const { db } = require('../config/database');
const logger = require('../utils/logger');
const evolutionService = require('./evolutionService');

class BroadcastWorker {
  constructor() {
    this.isProcessing = false;
    this.currentBroadcast = null;
    this.batchSize = 10; // Process 10 messages at a time
    this.delayBetweenBatches = 1000; // 1 second delay between batches
  }

  // Process broadcast job
  async processBroadcast(broadcastId) {
    try {
      logger.info(`Starting broadcast processing for broadcast ${broadcastId}`);
      
      // Get broadcast details
      const broadcast = await this.getBroadcast(broadcastId);
      if (!broadcast) {
        throw new Error('Broadcast not found');
      }

      // Update broadcast status
      await this.updateBroadcastStatus(broadcastId, 'running');
      
      // Get filtered contacts
      const contacts = await this.getFilteredContacts(broadcast);
      
      // Update total contacts count
      await this.updateBroadcastTotalCount(broadcastId, contacts.length);
      
      // Initialize progress tracking
      await this.initializeProgress(broadcastId, contacts.length);
      
      // Create broadcast messages
      await this.createBroadcastMessages(broadcastId, contacts, broadcast.message);
      
      // Process messages in batches
      await this.processMessages(broadcastId);
      
      // Mark broadcast as completed
      await this.updateBroadcastStatus(broadcastId, 'completed');
      
      logger.info(`Broadcast ${broadcastId} completed successfully`);
      return { success: true, totalContacts: contacts.length };
      
    } catch (error) {
      logger.error(`Error processing broadcast ${broadcastId}:`, error);
      await this.updateBroadcastStatus(broadcastId, 'failed');
      throw error;
    }
  }

  // Get broadcast details
  async getBroadcast(broadcastId) {
    const result = await db.query(`
      SELECT * FROM broadcasts WHERE id = $1
    `, [broadcastId]);
    
    return result.rows[0] || null;
  }

  // Get filtered contacts based on broadcast criteria
  async getFilteredContacts(broadcast) {
    let query = `
      SELECT DISTINCT c.* FROM contacts c
      LEFT JOIN contact_category_relations ccr ON c.id = ccr.contact_id
      WHERE c.user_id = $1
    `;
    
    const params = [broadcast.user_id];
    
    // Apply search filter
    if (broadcast.contact_filter && broadcast.contact_filter.search) {
      query += ` AND (c.name ILIKE $${params.length + 1} OR c.phone ILIKE $${params.length + 2} OR c.email ILIKE $${params.length + 3})`;
      params.push(`%${broadcast.contact_filter.search}%`, `%${broadcast.contact_filter.search}%`, `%${broadcast.contact_filter.search}%`);
    }
    
    // Apply category filter
    if (broadcast.contact_filter && broadcast.contact_filter.categories && broadcast.contact_filter.categories.length > 0) {
      query += ` AND ccr.category_id = ANY($${params.length + 1})`;
      params.push(broadcast.contact_filter.categories);
    }
    
    query += ` ORDER BY c.name`;
    
    const result = await db.query(query, params);
    return result.rows;
  }

  // Update broadcast status
  async updateBroadcastStatus(broadcastId, status) {
    const updateFields = {
      'running': 'started_at = NOW()',
      'completed': 'completed_at = NOW()',
      'failed': 'completed_at = NOW()',
      'paused': 'updated_at = NOW()',
      'stopped': 'completed_at = NOW()'
    };
    
    const field = updateFields[status] || 'updated_at = NOW()';
    
    await db.query(`
      UPDATE broadcasts 
      SET status = $1, ${field}
      WHERE id = $2
    `, [status, broadcastId]);
  }

  // Update total contacts count
  async updateBroadcastTotalCount(broadcastId, totalContacts) {
    await db.query(`
      UPDATE broadcasts 
      SET total_contacts = $1
      WHERE id = $2
    `, [totalContacts, broadcastId]);
  }

  // Initialize progress tracking
  async initializeProgress(broadcastId, totalContacts) {
    await db.query(`
      INSERT INTO broadcast_progress (broadcast_id, total_contacts, processed_contacts, sent_messages, failed_messages, progress_percentage)
      VALUES ($1, $2, 0, 0, 0, 0)
      ON CONFLICT (broadcast_id) DO UPDATE SET
        total_contacts = $2,
        processed_contacts = 0,
        sent_messages = 0,
        failed_messages = 0,
        progress_percentage = 0,
        last_updated = NOW()
    `, [broadcastId, totalContacts]);
  }

  // Create broadcast messages
  async createBroadcastMessages(broadcastId, contacts, message) {
    const messageValues = contacts.map(contact => 
      `(${broadcastId}, ${contact.id}, '${contact.phone}', '${message.replace(/'/g, "''")}', 'pending')`
    ).join(',');
    
    await db.query(`
      INSERT INTO broadcast_messages (broadcast_id, contact_id, phone, message, status)
      VALUES ${messageValues}
    `);
  }

  // Process messages in batches
  async processMessages(broadcastId) {
    let offset = 0;
    let processedCount = 0;
    let sentCount = 0;
    let failedCount = 0;
    
    while (true) {
      // Get batch of messages
      const messages = await this.getMessageBatch(broadcastId, offset, this.batchSize);
      
      if (messages.length === 0) {
        break; // No more messages to process
      }
      
      // Process each message in the batch
      for (const message of messages) {
        try {
          // Send message via Evolution API
          const result = await this.sendMessage(message.phone, message.message);
          
          if (result.success) {
            // Update message status to sent
            await this.updateMessageStatus(message.id, 'sent');
            sentCount++;
          } else {
            // Update message status to failed
            await this.updateMessageStatus(message.id, 'failed', result.error);
            failedCount++;
          }
          
        } catch (error) {
          // Update message status to failed
          await this.updateMessageStatus(message.id, 'failed', error.message);
          failedCount++;
        }
        
        processedCount++;
        
        // Update progress
        await this.updateProgress(broadcastId, processedCount, sentCount, failedCount);
      }
      
      offset += this.batchSize;
      
      // Add delay between batches to avoid rate limiting
      if (messages.length === this.batchSize) {
        await this.sleep(this.delayBetweenBatches);
      }
    }
    
    // Update final counts
    await this.updateBroadcastCounts(broadcastId, sentCount, failedCount);
  }

  // Get batch of messages
  async getMessageBatch(broadcastId, offset, limit) {
    const result = await db.query(`
      SELECT * FROM broadcast_messages 
      WHERE broadcast_id = $1 AND status = 'pending'
      ORDER BY created_at
      LIMIT $2 OFFSET $3
    `, [broadcastId, limit, offset]);
    
    return result.rows;
  }

  // Send message via Evolution API
  async sendMessage(phone, message) {
    try {
      // Get active phone for sending
      const phoneResult = await db.query(`
        SELECT * FROM phones WHERE status = 'connected' AND is_active = true LIMIT 1
      `);
      
      if (phoneResult.rows.length === 0) {
        throw new Error('No active phone found for sending messages');
      }
      
      const phone = phoneResult.rows[0];
      
      // Send message using Evolution API
      const result = await evolutionService.sendMessage(phone.phone_number, phone, message);
      
      return { success: true, result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Update message status
  async updateMessageStatus(messageId, status, errorMessage = null) {
    const updateFields = status === 'sent' ? 'sent_at = NOW()' : '';
    const errorField = errorMessage ? ', error_message = $2' : '';
    
    await db.query(`
      UPDATE broadcast_messages 
      SET status = $1 ${updateFields} ${errorField}
      WHERE id = $3
    `, [status, errorMessage, messageId]);
  }

  // Update progress
  async updateProgress(broadcastId, processed, sent, failed) {
    // Get total contacts for percentage calculation
    const broadcast = await this.getBroadcast(broadcastId);
    const total = broadcast.total_contacts;
    const percentage = total > 0 ? (processed / total) * 100 : 0;
    
    // Estimate completion time
    const now = new Date();
    const estimatedCompletion = processed > 0 ? 
      new Date(now.getTime() + ((total - processed) * this.delayBetweenBatches / this.batchSize)) : 
      null;
    
    await db.query(`
      UPDATE broadcast_progress 
      SET processed_contacts = $1,
          sent_messages = $2,
          failed_messages = $3,
          progress_percentage = $4,
          estimated_completion = $5,
          last_updated = NOW()
      WHERE broadcast_id = $6
    `, [processed, sent, failed, percentage, estimatedCompletion, broadcastId]);
  }

  // Update broadcast counts
  async updateBroadcastCounts(broadcastId, sentCount, failedCount) {
    await db.query(`
      UPDATE broadcasts 
      SET sent_count = $1, failed_count = $2
      WHERE id = $3
    `, [sentCount, failedCount, broadcastId]);
  }

  // Sleep utility
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Pause broadcast processing
  async pauseBroadcast(broadcastId) {
    await this.updateBroadcastStatus(broadcastId, 'paused');
    logger.info(`Broadcast ${broadcastId} paused`);
  }

  // Resume broadcast processing
  async resumeBroadcast(broadcastId) {
    await this.updateBroadcastStatus(broadcastId, 'running');
    logger.info(`Broadcast ${broadcastId} resumed`);
  }

  // Stop broadcast processing
  async stopBroadcast(broadcastId) {
    await this.updateBroadcastStatus(broadcastId, 'stopped');
    logger.info(`Broadcast ${broadcastId} stopped`);
  }
}

module.exports = new BroadcastWorker();
