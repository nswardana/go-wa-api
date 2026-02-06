const axios = require('axios');
const WebhookEvent = require('../models/WebhookEvent');
const PhoneNumber = require('../models/PhoneNumber');
const { redis } = require('../config/database');
const logger = require('../utils/logger');
const EventEmitter = require('events');

class WebhookService extends EventEmitter {
  constructor() {
    super();
    this.processing = false;
    this.queue = [];
    this.maxRetries = 5;
    this.retryDelay = 5000; // 5 seconds
    this.batchSize = 10;
    this.processInterval = 5000; // 5 seconds
    
    // Start processing queue
    this.startQueueProcessor();
  }

  // Create webhook event
  async createEvent(phoneNumberId, eventType, payload) {
    try {
      const event = await WebhookEvent.create({
        phoneNumberId,
        eventType,
        payload
      });

      logger.info('Webhook event created', {
        eventId: event.id,
        phoneNumberId,
        eventType
      });

      // Emit event for real-time updates
      this.emit('eventCreated', event);

      // Add to processing queue
      this.queue.push(event.id);

      return event;
    } catch (error) {
      logger.error('Failed to create webhook event', {
        phoneNumberId,
        eventType,
        error: error.message
      });
      throw error;
    }
  }

  // Process single webhook event
  async processEvent(eventId) {
    try {
      const event = await WebhookEvent.findById(eventId);
      if (!event || event.status !== 'pending') {
        return null;
      }

      // Check if phone has webhook URL
      if (!event.webhook_url) {
        await WebhookEvent.updateStatus(eventId, 'skipped');
        logger.info('Webhook skipped - no URL configured', {
          eventId,
          phoneNumberId: event.phone_number_id
        });
        return null;
      }

      // Prepare payload
      const payload = {
        id: event.id,
        event: event.event_type,
        data: event.payload,
        timestamp: event.created_at,
        phone: {
          id: event.phone_number_id,
          number: event.phone_number
        },
        user: {
          username: event.username,
          email: event.email
        }
      };

      // Generate signature
      const signature = WebhookEvent.generateSignature(payload, event.webhook_secret);

      // Send webhook
      const response = await this.sendWebhook(event.webhook_url, payload, signature);

      if (response.success) {
        await WebhookEvent.updateStatus(eventId, 'sent', new Date());
        logger.info('Webhook sent successfully', {
          eventId,
          url: event.webhook_url,
          statusCode: response.statusCode
        });
        return { success: true, event };
      } else {
        throw new Error(response.error);
      }

    } catch (error) {
      logger.error('Webhook processing failed', {
        eventId,
        error: error.message
      });

      // Increment retry count
      await WebhookEvent.incrementRetry(eventId);

      // Check if max retries reached
      const updatedEvent = await WebhookEvent.findById(eventId);
      if (updatedEvent.retry_count >= this.maxRetries) {
        await WebhookEvent.markAsFailed(eventId);
        logger.warn('Webhook marked as failed - max retries reached', {
          eventId,
          retryCount: updatedEvent.retry_count
        });
        return { success: false, error: 'Max retries reached', event: updatedEvent };
      }

      return { success: false, error: error.message, event: updatedEvent };
    }
  }

  // Send webhook with retry logic
  async sendWebhook(url, payload, signature, timeout = 30000) {
    try {
      const startTime = Date.now();
      
      const response = await axios.post(url, payload, {
        timeout,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Evolution-API-Webhook/1.0',
          'X-Webhook-Signature': `sha256=${signature}`,
          'X-Webhook-Timestamp': Date.now().toString()
        },
        validateStatus: (status) => status < 500 // Don't retry on 4xx errors
      });

      const duration = Date.now() - startTime;
      
      logger.debug('Webhook request completed', {
        url,
        statusCode: response.status,
        duration: `${duration}ms`
      });

      if (response.status >= 200 && response.status < 300) {
        return { success: true, statusCode: response.status, duration };
      } else {
        return { 
          success: false, 
          error: `HTTP ${response.status}: ${response.statusText}`,
          statusCode: response.status 
        };
      }

    } catch (error) {
      if (error.code === 'ECONNABORTED') {
        return { success: false, error: 'Request timeout' };
      } else if (error.response) {
        return { 
          success: false, 
          error: `HTTP ${error.response.status}: ${error.response.statusText}`,
          statusCode: error.response.status 
        };
      } else {
        return { success: false, error: error.message };
      }
    }
  }

  // Process webhook queue
  async processQueue() {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;
    const batch = this.queue.splice(0, this.batchSize);

    try {
      const promises = batch.map(eventId => this.processEvent(eventId));
      const results = await Promise.allSettled(promises);

      // Log results
      const successful = results.filter(r => r.status === 'fulfilled' && r.value?.success).length;
      const failed = results.filter(r => r.status === 'rejected' || !r.value?.success).length;

      if (successful > 0 || failed > 0) {
        logger.info('Webhook batch processed', {
          batchSize: batch.length,
          successful,
          failed
        });
      }

    } catch (error) {
      logger.error('Webhook queue processing error', {
        error: error.message,
        batchSize: batch.length
      });
    } finally {
      this.processing = false;
    }
  }

  // Start queue processor
  startQueueProcessor() {
    setInterval(async () => {
      // Add pending events from database to queue
      if (this.queue.length < this.batchSize) {
        try {
          const pendingEvents = await WebhookEvent.findPending(this.batchSize - this.queue.length);
          const newEventIds = pendingEvents
            .filter(event => !this.queue.includes(event.id))
            .map(event => event.id);
          
          this.queue.push(...newEventIds);
        } catch (error) {
          logger.error('Failed to fetch pending webhook events', {
            error: error.message
          });
        }
      }

      // Process queue
      await this.processQueue();
    }, this.processInterval);
  }

  // Create WhatsApp message webhook
  async createMessageWebhook(phoneNumberId, messageData, eventType = 'message') {
    const payload = {
      id: messageData.id,
      from: messageData.from_number,
      to: messageData.to_number,
      type: messageData.message_type,
      content: messageData.content,
      mediaUrl: messageData.media_url,
      mediaType: messageData.media_type,
      timestamp: messageData.created_at,
      status: messageData.status
    };

    return await this.createEvent(phoneNumberId, eventType, payload);
  }

  // Create connection status webhook
  async createConnectionWebhook(phoneNumberId, isConnected, qrCode = null) {
    const payload = {
      connected: isConnected,
      qrCode: qrCode,
      timestamp: new Date().toISOString()
    };

    return await this.createEvent(phoneNumberId, 'connection.status', payload);
  }

  // Create group event webhook
  async createGroupWebhook(phoneNumberId, groupData, eventType) {
    const payload = {
      groupId: groupData.id,
      groupName: groupData.name,
      participants: groupData.participants,
      action: groupData.action,
      timestamp: new Date().toISOString()
    };

    return await this.createEvent(phoneNumberId, `group.${eventType}`, payload);
  }

  // Test webhook endpoint
  async testWebhook(phoneNumberId, testUrl = null) {
    try {
      const phone = await PhoneNumber.findById(phoneNumberId);
      if (!phone) {
        throw new Error('Phone number not found');
      }

      const webhookUrl = testUrl || phone.webhook_url;
      if (!webhookUrl) {
        throw new Error('No webhook URL configured');
      }

      const testPayload = {
        event: 'webhook.test',
        data: {
          message: 'This is a test webhook from Evolution API',
          timestamp: new Date().toISOString(),
          phone: {
            id: phone.id,
            number: phone.phone_number
          }
        }
      };

      const signature = WebhookEvent.generateSignature(testPayload, phone.webhook_secret);
      const result = await this.sendWebhook(webhookUrl, testPayload, signature, 10000);

      // Create test event record
      await WebhookEvent.create({
        phoneNumberId,
        eventType: 'webhook.test',
        payload: testPayload
      });

      return result;

    } catch (error) {
      logger.error('Webhook test failed', {
        phoneNumberId,
        error: error.message
      });
      throw error;
    }
  }

  // Get webhook statistics
  async getStats(phoneNumberId = null, userId = null) {
    const [eventStats, deliveryRate] = await Promise.all([
      WebhookEvent.getStats(phoneNumberId, userId),
      WebhookEvent.getDeliveryRate(phoneNumberId, 24)
    ]);

    return {
      ...eventStats,
      deliveryRate: deliveryRate.deliveryRate,
      last24Hours: deliveryRate
    };
  }

  // Retry failed webhooks
  async retryFailed(phoneNumberId = null) {
    const events = await WebhookEvent.retryFailedEvents(phoneNumberId);
    
    // Add to queue
    const eventIds = events.map(event => event.id);
    this.queue.push(...eventIds);

    logger.info('Failed webhooks queued for retry', {
      count: events.length,
      phoneNumberId
    });

    return events;
  }

  // Clear old events
  async cleanup(daysOld = 30) {
    const deletedCount = await WebhookEvent.deleteOldEvents(daysOld);
    
    logger.info('Old webhook events cleaned up', {
      deletedCount,
      daysOld
    });

    return deletedCount;
  }

  // Get recent events for dashboard
  async getRecentEvents(phoneNumberId = null, limit = 10) {
    return await WebhookEvent.getRecentEvents(phoneNumberId, limit);
  }

  // Get queue status
  getQueueStatus() {
    return {
      queueLength: this.queue.length,
      processing: this.processing,
      batchSize: this.batchSize,
      processInterval: this.processInterval
    };
  }
}

// Create singleton instance
const webhookService = new WebhookService();

module.exports = webhookService;
