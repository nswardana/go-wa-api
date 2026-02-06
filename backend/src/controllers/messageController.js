const PhoneNumber = require('../models/PhoneNumber');
const logger = require('../utils/logger');
const { validationResult } = require('express-validator');

class MessageController {
  async sendMessage(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { phoneId, to, message, type = 'text', mediaUrl, mediaType } = req.body;

      // Check if phone belongs to user
      const phone = await PhoneNumber.findById(phoneId);
      if (!phone || phone.user_id !== req.user.id) {
        return res.status(404).json({
          error: 'Phone not found',
          message: 'Phone number does not exist or access denied'
        });
      }

      // Check if phone is connected
      if (!phone.is_connected) {
        return res.status(400).json({
          error: 'Phone not connected',
          message: 'WhatsApp is not connected for this phone number'
        });
      }

      // TODO: Integrate with Evolution API to send message
      // For now, just return success response
      const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      logger.info(`Message sent from ${phone.phone_number} to ${to}`, {
        messageId,
        userId: req.user.id,
        phoneId
      });

      res.json({
        success: true,
        message: 'Message sent successfully',
        data: {
          messageId,
          from: phone.phone_number,
          to,
          type,
          message,
          mediaUrl,
          mediaType,
          status: 'sent',
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      logger.error('Send message error', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to send message'
      });
    }
  }

  async getMessages(req, res) {
    try {
      const { phoneId, limit = 50, offset = 0 } = req.query;

      let result;
      if (phoneId) {
        // Check if phone belongs to user
        const phone = await PhoneNumber.findById(phoneId);
        if (!phone || phone.user_id !== req.user.id) {
          return res.status(404).json({
            error: 'Phone not found',
            message: 'Phone number does not exist or access denied'
          });
        }

        result = await PhoneNumber.getPhoneWithMessages(phoneId, parseInt(limit), parseInt(offset));
      } else {
        // Get messages from all user's phones
        // TODO: Implement this method in PhoneNumber model
        result = { messages: [], total: 0, limit: parseInt(limit), offset: parseInt(offset) };
      }

      res.json({
        success: true,
        ...result
      });

    } catch (error) {
      logger.error('Get messages error', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to get messages'
      });
    }
  }

  async getMessageById(req, res) {
    try {
      const { messageId } = req.params;

      // TODO: Implement message retrieval by ID
      // For now, return not found
      res.status(404).json({
        error: 'Message not found',
        message: 'Message does not exist'
      });

    } catch (error) {
      logger.error('Get message by ID error', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to get message'
      });
    }
  }
}

module.exports = new MessageController();
