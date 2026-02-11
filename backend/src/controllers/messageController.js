const { db } = require('../config/database');
const evolutionService = require('../services/evolutionService');
const logger = require('../utils/logger');

class MessageController {
  // Get all messages for authenticated user
  async getMessages(req, res) {
    try {
      const userId = req.user.id;
      const { limit = 50, offset = 0, status, phoneId } = req.query;
      
      let query = 'SELECT m.*, p.device_name, p.phone_number ' +
                   'FROM messages m ' +
                   'JOIN phone_numbers p ON m.phone_number_id = p.id ' +
                   'WHERE p.user_id = $1 ';
      
      const params = [userId];
      
      if (status) {
        query += 'AND m.status = $' + (params.length + 1) + ' ';
        params.push(status);
      }
      
      if (phoneId) {
        query += 'AND p.id = $' + (params.length + 1) + ' ';
        params.push(phoneId);
      }
      
      query += 'ORDER BY m.created_at DESC ' +
                'LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
      params.push(parseInt(limit), parseInt(offset));
      
      const messages = await db.getAll(query, params);
      
      const countQuery = 'SELECT COUNT(*) as total ' +
                       'FROM messages m ' +
                       'JOIN phone_numbers p ON m.phone_number_id = p.id ' +
                       'WHERE p.user_id = $1';
      
      const countResult = await db.query(countQuery, [userId]);
      const count = countResult.rows[0];
      
      res.json({
        success: true,
        messages,
        total: parseInt(count.total),
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
      
    } catch (error) {
      logger.error('Get messages error:', error);
      res.status(500).json({
        error: 'Internal server error'
      });
    }
  }

  // Get message by ID
  async getMessageById(req, res) {
    try {
      const { messageId } = req.params;
      const userId = req.user.id;
      
      const query = 'SELECT m.*, p.device_name, p.phone_number ' +
                   'FROM messages m ' +
                   'JOIN phone_numbers p ON m.phone_number_id = p.id ' +
                   'WHERE m.id = $1 AND p.user_id = $2';
      
      const messageResult = await db.query(query, [messageId, userId]);
      const message = messageResult.rows[0];
      
      if (!message) {
        return res.status(404).json({
          error: 'Message not found'
        });
      }
      
      res.json({
        success: true,
        message
      });
      
    } catch (error) {
      logger.error('Get message by ID error:', error);
      res.status(500).json({
        error: 'Internal server error'
      });
    }
  }

  // Send message through ChatFlow (Mock for now)
  async sendMessage(req, res) {
    try {
      const userId = req.user.id;
      const { phone_id, to, message: messageContent, media_url, media_type } = req.body;
      
      // Handle both old and new field names
      const phoneId = phone_id || req.body.phoneId;
      const content = messageContent || req.body.content;
      const type = media_type || req.body.type || 'text';
      
      // Validate required fields
      if (!phoneId || !to || !content) {
        return res.status(400).json({
          error: 'Missing required fields',
          required: ['phone_id', 'to', 'message']
        });
      }
      
      // Check if phone belongs to user
      const phoneQuery = 'SELECT * FROM phone_numbers WHERE id = $1 AND user_id = $2';
      const phoneResult = await db.query(phoneQuery, [phoneId, userId]);
      const phone = phoneResult.rows[0];
      
      if (!phone) {
        return res.status(404).json({
          error: 'Phone not found'
        });
      }
      
      // Send message through Evolution Service
      const sendResult = await evolutionService.sendMessage(phoneId, {
        to: to,
        content: content,
        type: type,
        media_url: media_url,
        media_type: media_type
      });

      if (!sendResult.success) {
        throw new Error(sendResult.message || 'Failed to send message');
      }

      const messageRecord = sendResult.message;

      logger.info('Message sent via Evolution Service:', {
        messageId: messageRecord.id,
        to,
        phoneId,
        evolutionInstance: phone.evolution_name
      });
      
      res.status(201).json({
        success: true,
        message: 'Message sent successfully via ChatFlow',
        message: {
          id: messageRecord.id,
          from: phone.phone_number,
          to: to,
          content: content,
          status: 'sent',
          createdAt: messageRecord.created_at
        }
      });
      
    } catch (error) {
      logger.error('Send message error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  }

  // Sync messages from ChatFlow (Mock for now)
  async syncMessages(req, res) {
    try {
      const { phoneId } = req.params;
      const userId = req.user.id;
      const { limit = 100, offset = 0 } = req.query;
      
      // Check if phone belongs to user
      const phoneQuery = 'SELECT * FROM phone_numbers WHERE id = $1 AND user_id = $2';
      const phoneResult = await db.query(phoneQuery, [phoneId, userId]);
      const phone = phoneResult.rows[0];
      
      if (!phone) {
        return res.status(404).json({
          error: 'Phone not found'
        });
      }
      
      // Mock sync for now
      logger.info('Messages synced (mock):', {
        phoneId,
        deviceName: phone.device_name,
        messagesCount: 0
      });
      
      res.json({
        success: true,
        message: 'Messages synced successfully (mock)',
        synced: 0,
        total: 0,
        messages: []
      });
      
    } catch (error) {
      logger.error('Sync messages error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  }

  // Delete message
  async deleteMessage(req, res) {
    try {
      const { messageId } = req.params;
      const userId = req.user.id;
      
      // Check if message belongs to user
      const query = 'SELECT m.id FROM messages m ' +
                   'JOIN phone_numbers p ON m.phone_number_id = p.id ' +
                   'WHERE m.id = $1 AND p.user_id = $2';
      
      const messageResult = await db.query(query, [messageId, userId]);
      const message = messageResult.rows[0];
      
      if (!message) {
        return res.status(404).json({
          error: 'Message not found'
        });
      }
      
      // Delete message
      const deleteQuery = 'DELETE FROM messages WHERE id = $1';
      await db.query(deleteQuery, [messageId]);
      
      logger.info('Message deleted:', messageId);
      
      res.json({
        success: true,
        message: 'Message deleted successfully'
      });
      
    } catch (error) {
      logger.error('Delete message error:', error);
      res.status(500).json({
        error: 'Internal server error'
      });
    }
  }
}

module.exports = new MessageController();
