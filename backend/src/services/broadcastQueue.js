const Redis = require('redis');
const { db } = require('../config/database');
const logger = require('../utils/logger');
const evolutionService = require('./evolutionService');

class BroadcastQueue {
  constructor() {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    this.queueKey = 'broadcast:queue';
    this.processingKey = 'broadcast:processing';
    this.resultsKey = 'broadcast:results';
  }

  async addToQueue(campaignId, message, contacts, phoneIds) {
    const job = {
      id: Date.now(),
      campaignId,
      message,
      contacts,
      phoneIds,
      status: 'queued',
      createdAt: new Date().toISOString(),
      totalContacts: contacts.length,
      processedContacts: 0,
      sentCount: 0,
      failedCount: 0
    };

    // Add to queue
    await this.redis.lpush(this.queueKey, JSON.stringify(job));
    
    // Add to processing set
    await this.redis.hset(this.processingKey, campaignId.toString(), JSON.stringify(job));
    
    logger.info('Broadcast job added to queue:', {
      campaignId,
      totalContacts: contacts.length,
      phoneIds: phoneIds.length
    });

    return job;
  }

  async processQueue() {
    while (true) {
      try {
        // Get job from queue
        const jobData = await this.redis.brpop(this.queueKey, 10);
        
        if (jobData) {
          const job = JSON.parse(jobData[1]);
          await this.processJob(job);
        }
      } catch (error) {
        logger.error('Queue processing error:', error);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }

  async processJob(job) {
    try {
      logger.info('Processing broadcast job:', {
        campaignId: job.campaignId,
        totalContacts: job.totalContacts
      });

      // Update job status to processing
      job.status = 'processing';
      await this.redis.hset(this.processingKey, job.campaignId.toString(), JSON.stringify(job));

      // Get phone numbers for rotation
      const phones = await this.getPhoneNumbers(job.phoneIds);
      let phoneIndex = 0;

      // Process each contact
      for (let i = 0; i < job.contacts.length; i++) {
        const contact = job.contacts[i];
        const phone = phones[phoneIndex % phones.length];

        try {
          // Send message with rate limiting
          await this.sendMessageWithDelay(phone, contact, job.message);
          
          // Update contact status
          await this.updateContactStatus(contact.id, 'sent');
          job.sentCount++;
          
          logger.info('Message sent:', {
            campaignId: job.campaignId,
            contactId: contact.id,
            phone: phone.phone_number
          });

        } catch (error) {
          // Update contact status
          await this.updateContactStatus(contact.id, 'failed', error.message);
          job.failedCount++;
          
          logger.error('Message failed:', {
            campaignId: job.campaignId,
            contactId: contact.id,
            error: error.message
          });
        }

        // Update job progress
        job.processedContacts = i + 1;
        await this.redis.hset(this.processingKey, job.campaignId.toString(), JSON.stringify(job));

        // Emit real-time update
        await this.emitProgress(job.campaignId, job);

        // Rate limiting: 1-3 seconds delay
        const delay = Math.floor(Math.random() * 2000) + 1000;
        await new Promise(resolve => setTimeout(resolve, delay));

        phoneIndex++;
      }

      // Update final status
      job.status = 'completed';
      job.completedAt = new Date().toISOString();
      await this.redis.hset(this.processingKey, job.campaignId.toString(), JSON.stringify(job));
      await this.redis.hset(this.resultsKey, job.campaignId.toString(), JSON.stringify(job));

      // Update campaign in database
      await this.updateCampaignStats(job.campaignId, job);

      logger.info('Broadcast job completed:', {
        campaignId: job.campaignId,
        sentCount: job.sentCount,
        failedCount: job.failedCount
      });

    } catch (error) {
      logger.error('Job processing failed:', error);
      job.status = 'failed';
      job.error = error.message;
      await this.redis.hset(this.processingKey, job.campaignId.toString(), JSON.stringify(job));
    }
  }

  async sendMessageWithDelay(phone, contact, message) {
    // Personalize message to avoid spam detection
    const personalizedMessage = this.personalizeMessage(message, contact);
    
    await evolutionService.sendMessage(phone.id, {
      to: contact.phone,
      content: personalizedMessage,
      type: 'text'
    });
  }

  personalizeMessage(template, contact) {
    const variations = [
      template,
      `Hi ${contact.name}, ${template}`,
      `${template} - ${contact.name}`,
      `Dear ${contact.name},\n${template}`,
      `Halo ${contact.name},\n${template}`
    ];
    
    return variations[Math.floor(Math.random() * variations.length)];
  }

  async getPhoneNumbers(phoneIds) {
    const placeholders = phoneIds.map((_, index) => `$${index + 1}`).join(',');
    const query = `
      SELECT id, phone_number, device_name 
      FROM phone_numbers 
      WHERE id IN (${placeholders}) AND is_connected = true
    `;
    
    const result = await db.query(query, phoneIds);
    return result.rows;
  }

  async updateContactStatus(contactId, status, errorMessage = null) {
    const query = `
      UPDATE broadcast_contacts 
      SET status = $1, sent_at = NOW(), error_message = $2
      WHERE id = $3
    `;
    
    await db.query(query, [status, errorMessage, contactId]);
  }

  async updateCampaignStats(campaignId, job) {
    const query = `
      UPDATE broadcast_campaigns 
      SET status = $1, sent_count = $2, failed_count = $3, updated_at = NOW()
      WHERE id = $4
    `;
    
    await db.query(query, [
      job.status,
      job.sentCount,
      job.failedCount,
      campaignId
    ]);
  }

  async emitProgress(campaignId, job) {
    const progress = {
      campaignId,
      status: job.status,
      total: job.totalContacts,
      processed: job.processedContacts,
      sent: job.sentCount,
      failed: job.failedCount,
      percentage: Math.round((job.processedContacts / job.totalContacts) * 100)
    };

    // Store in Redis for WebSocket
    await this.redis.publish('broadcast:progress', JSON.stringify(progress));
  }

  async getJobStatus(campaignId) {
    const jobData = await this.redis.hget(this.processingKey, campaignId.toString());
    return jobData ? JSON.parse(jobData) : null;
  }

  async getJobResult(campaignId) {
    const resultData = await this.redis.hget(this.resultsKey, campaignId.toString());
    return resultData ? JSON.parse(resultData) : null;
  }

  async clearCompletedJobs() {
    // Clean up jobs older than 24 hours
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const keys = await this.redis.hkeysall(this.resultsKey);
    
    for (const key of keys) {
      const jobData = await this.redis.hget(this.resultsKey, key);
      const job = JSON.parse(jobData);
      
      if (new Date(job.completedAt) < cutoffTime) {
        await this.redis.hdel(this.resultsKey, key);
        await this.redis.hdel(this.processingKey, key);
      }
    }
  }
}

module.exports = new BroadcastQueue();
