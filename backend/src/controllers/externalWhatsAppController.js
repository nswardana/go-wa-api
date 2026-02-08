const externalWhatsAppService = require('../services/externalWhatsAppService');
const { db } = require('../config/database');
const logger = require('../utils/logger');
const { validationResult } = require('express-validator');

class ExternalWhatsAppController {
  // Send message via external WhatsApp API
  async sendMessage(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const userId = req.user.id;
      const { provider, config, phoneId, to, content, type, mediaUrl } = req.body;

      // Validate provider configuration
      const configValidation = externalWhatsAppService.validateProviderConfig(provider, config);
      if (!configValidation.valid) {
        return res.status(400).json({
          error: 'Invalid provider configuration',
          details: configValidation.errors
        });
      }

      // Check if phone belongs to user
      const phoneQuery = 'SELECT * FROM phone_numbers WHERE id = $1 AND user_id = $2';
      const phone = await db.getOne(phoneQuery, [phoneId, userId]);
      
      if (!phone) {
        return res.status(404).json({
          error: 'Phone not found'
        });
      }

      // Send message via external API
      const result = await externalWhatsAppService.sendMessage(provider, config, {
        to,
        content,
        type: type || 'text',
        mediaUrl
      });

      if (!result.success) {
        return res.status(400).json({
          error: 'Failed to send message via external API',
          details: result.error,
          provider: result.provider
        });
      }

      // Store message in database
      const messageQuery = `
        INSERT INTO messages (phone_number_id, message_id, from_number, to_number, message_type, content, status, provider, external_message_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `;
      
      const message = await db.getOne(messageQuery, [
        phoneId,
        result.messageId || 'ext_' + Date.now(),
        phone.phone_number,
        to,
        type || 'text',
        content,
        result.status,
        provider,
        result.messageId
      ]);

      logger.info('External message sent:', {
        messageId: message.id,
        provider,
        to,
        phoneId
      });

      res.status(201).json({
        success: true,
        message: 'Message sent successfully via external API',
        message: {
          id: message.id,
          from: phone.phone_number,
          to: to,
          content: content,
          status: result.status,
          provider: provider,
          externalMessageId: result.messageId,
          createdAt: message.created_at
        },
        externalResponse: result.response
      });

    } catch (error) {
      logger.error('Send external message error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  }

  // Get account status/balance
  async getAccountStatus(req, res) {
    try {
      const userId = req.user.id;
      const { provider, config } = req.body;

      // Validate provider configuration
      const configValidation = externalWhatsAppService.validateProviderConfig(provider, config);
      if (!configValidation.valid) {
        return res.status(400).json({
          error: 'Invalid provider configuration',
          details: configValidation.errors
        });
      }

      // Get account status
      const result = await externalWhatsAppService.getAccountStatus(provider, config);

      if (!result.success) {
        return res.status(400).json({
          error: 'Failed to get account status',
          details: result.error,
          provider: result.provider
        });
      }

      res.json({
        success: true,
        provider: provider,
        balance: result.balance,
        response: result.response
      });

    } catch (error) {
      logger.error('Get account status error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  }

  // Get supported providers
  async getSupportedProviders(req, res) {
    try {
      const providers = externalWhatsAppService.getSupportedProviders();

      res.json({
        success: true,
        providers
      });

    } catch (error) {
      logger.error('Get supported providers error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  }

  // Test provider connection
  async testProvider(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { provider, config } = req.body;

      // Validate provider configuration
      const configValidation = externalWhatsAppService.validateProviderConfig(provider, config);
      if (!configValidation.valid) {
        return res.status(400).json({
          error: 'Invalid provider configuration',
          details: configValidation.errors
        });
      }

      // Test by getting account status
      const result = await externalWhatsAppService.getAccountStatus(provider, config);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: 'Provider connection failed',
          details: result.error,
          provider: result.provider
        });
      }

      res.json({
        success: true,
        message: 'Provider connection successful',
        provider: provider,
        balance: result.balance,
        response: result.response
      });

    } catch (error) {
      logger.error('Test provider error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  }
}

module.exports = new ExternalWhatsAppController();
