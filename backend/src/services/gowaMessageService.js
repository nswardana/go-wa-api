const axios = require('axios');
const logger = require('../utils/logger');
const { db } = require('../config/database');

class GOWAMessageService {
  constructor() {
    this.gowaBaseUrl = process.env.GOWA_BASE_URL || 'http://localhost:8081';
    this.gowaApiKey = process.env.GOWA_API_KEY || 'admin';
    this.deviceId = process.env.GOWA_DEVICE_ID || 'chatflow-api-1';
    this.pollingInterval = process.env.GOWA_POLLING_INTERVAL || 5000; // 5 seconds
    this.isPolling = false;
  }

  // Start polling for messages
  startPolling() {
    if (this.isPolling) {
      logger.warn('GOWA message polling already started');
      return;
    }

    this.isPolling = true;
    logger.info('Starting GOWA message polling');
    
    this.pollInterval = setInterval(async () => {
      try {
        await this.fetchMessages();
      } catch (error) {
        logger.error('Error in GOWA message polling:', error);
      }
    }, this.pollingInterval);
  }

  // Stop polling
  stopPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.isPolling = false;
      logger.info('GOWA message polling stopped');
    }
  }

  // Fetch messages from GOWA
  async fetchMessages() {
    try {
      const response = await axios.get(`${this.gowaBaseUrl}/message`, {
        auth: {
          username: this.gowaApiKey,
          password: this.gowaApiKey
        },
        headers: {
          'X-Device-Id': this.deviceId
        },
        timeout: 10000
      });

      const messages = response.data;
      
      if (messages && messages.length > 0) {
        logger.info(`Fetched ${messages.length} messages from GOWA`);
        await this.processMessages(messages);
      }
    } catch (error) {
      logger.error('Error fetching messages from GOWA:', error.message);
    }
  }

  // Process fetched messages
  async processMessages(messages) {
    for (const message of messages) {
      try {
        await this.saveMessage(message);
      } catch (error) {
        logger.error(`Error processing message ${message.id}:`, error);
      }
    }
  }

  // Save message to database
  async saveMessage(message) {
    try {
      // Skip if message is from ourselves
      if (message.fromMe) {
        logger.debug(`Skipping own message: ${message.id}`);
        return;
      }

      // Check if message already exists
      const existingMessage = await db.query(
        'SELECT id FROM messages WHERE message_id = $1',
        [message.id]
      );

      if (existingMessage.rows.length > 0) {
        logger.debug(`Message already exists: ${message.id}`);
        return;
      }

      // Get phone number ID
      const phoneResult = await db.query(
        'SELECT id FROM phone_numbers WHERE device_name = $1 LIMIT 1',
        [this.deviceId]
      );

      const phoneId = phoneResult.rows[0]?.id || null;
      
      if (!phoneId) {
        logger.warn(`No phone found for device: ${this.deviceId}`);
        return;
      }

      // Extract sender phone number
      const senderPhone = message.from.replace('@s.whatsapp.net', '').replace('@g.us', '');

      // Determine message type
      let messageType = 'text';
      let messageContent = message.message?.text || message.message?.caption || '';

      if (message.message?.media) {
        if (message.message.media.mimeType?.startsWith('image/')) messageType = 'image';
        else if (message.message.media.mimeType?.startsWith('video/')) messageType = 'video';
        else if (message.message.media.mimeType?.startsWith('audio/')) messageType = 'audio';
        else messageType = 'document';
        messageContent = message.message?.caption || `[${messageType}]`;
      }

      // Save to database
      const saved = await db.query(`
        INSERT INTO messages (
          phone_number_id, message_id, from_number, to_number,
          message_type, content, status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (message_id) DO NOTHING
        RETURNING *
      `, [
        phoneId,
        message.id,
        senderPhone,
        phoneId,
        messageType,
        messageContent,
        'received',
        new Date(message.timestamp * 1000).toISOString()
      ]);

      if (saved.rows.length > 0) {
        logger.info(`GOWA Message saved: ${message.id} from ${senderPhone}`);
        
        // Trigger auto-reply
        await this.triggerAutoReply(saved.rows[0], message);
      }
    } catch (error) {
      logger.error('Error saving GOWA message:', error);
    }
  }

  // Trigger auto-reply
  async triggerAutoReply(savedMessage, rawMessage) {
    try {
      if (savedMessage.is_group) return; // skip group messages
      
      const autoReplyService = require('./autoReplyService');
      await autoReplyService.processIncomingMessage(
        savedMessage.from_number,
        savedMessage.phone_number_id,
        savedMessage.content
      );
    } catch (error) {
      logger.error('Error triggering auto-reply:', error);
    }
  }
}

module.exports = new GOWAMessageService();
