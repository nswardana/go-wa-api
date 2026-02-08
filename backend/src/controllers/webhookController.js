const webhookService = require('../services/webhookService');
const PhoneNumber = require('../models/PhoneNumber');
const WebhookEvent = require('../models/WebhookEvent');
const logger = require('../utils/logger');
const { validationResult } = require('express-validator');

class WebhookController {
  // Handle incoming webhook from ChatFlow
  async handleWebhook(req, res) {
    try {
      const signature = req.header('X-Webhook-Signature');
      const payload = req.body;

      // Log incoming webhook
      logger.info('Incoming webhook received', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        signature: signature ? 'present' : 'missing',
        payloadKeys: Object.keys(payload)
      });

      // Validate payload structure
      if (!payload || typeof payload !== 'object') {
        return res.status(400).json({
          error: 'Invalid payload',
          message: 'Payload must be a valid JSON object'
        });
      }

      // Extract phone token from payload or headers
      const phoneToken = payload.phoneToken || req.header('X-Phone-Token');
      
      if (!phoneToken) {
        return res.status(400).json({
          error: 'Missing phone token',
          message: 'Phone token is required'
        });
      }

      // Find phone number by token
      const phone = await PhoneNumber.findByToken(phoneToken);
      if (!phone) {
        logger.warn('Webhook received with invalid phone token', {
          phoneToken,
          ip: req.ip
        });
        return res.status(404).json({
          error: 'Phone not found',
          message: 'Invalid phone token'
        });
      }

      // Verify webhook signature if configured
      if (phone.webhook_secret && signature) {
        const isValidSignature = WebhookEvent.verifySignature(
          payload, 
          signature.replace('sha256=', ''), 
          phone.webhook_secret
        );
        
        if (!isValidSignature) {
          logger.warn('Invalid webhook signature', {
            phoneId: phone.id,
            phoneToken,
            ip: req.ip
          });
          return res.status(401).json({
            error: 'Invalid signature',
            message: 'Webhook signature verification failed'
          });
        }
      }

      // Process webhook events based on type
      const eventType = payload.event || 'message';
      let processedEvent;

      switch (eventType) {
        case 'message':
        case 'message.received':
          processedEvent = await this.processMessageWebhook(phone.id, payload);
          break;
          
        case 'message.ack':
          processedEvent = await this.processMessageAckWebhook(phone.id, payload);
          break;
          
        case 'message.reaction':
          processedEvent = await this.processMessageReactionWebhook(phone.id, payload);
          break;
          
        case 'connection.status':
          processedEvent = await this.processConnectionWebhook(phone.id, payload);
          break;
          
        case 'group.participants':
        case 'group.joined':
        case 'group.left':
          processedEvent = await this.processGroupWebhook(phone.id, payload);
          break;
          
        default:
          processedEvent = await webhookService.createEvent(phone.id, eventType, payload);
      }

      // Update phone last seen
      await PhoneNumber.updateLastSeen(phone.id);

      // Send real-time update via WebSocket if user is connected
      if (global.broadcast) {
        global.broadcast(phone.user_id, {
          type: 'webhook',
          event: eventType,
          phoneId: phone.id,
          data: payload,
          timestamp: new Date().toISOString()
        });
      }

      logger.info('Webhook processed successfully', {
        eventId: processedEvent.id,
        phoneId: phone.id,
        eventType,
        userId: phone.user_id
      });

      res.status(200).json({
        success: true,
        eventId: processedEvent.id,
        message: 'Webhook processed successfully'
      });

    } catch (error) {
      logger.error('Webhook processing error', {
        error: error.message,
        stack: error.stack,
        body: req.body
      });

      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to process webhook'
      });
    }
  }

  // Process message webhook
  async processMessageWebhook(phoneId, payload) {
    const messageData = {
      id: payload.data?.id || payload.id,
      from_number: payload.data?.from || payload.from,
      to_number: payload.data?.to || payload.to,
      message_type: payload.data?.type || payload.type || 'text',
      content: payload.data?.body || payload.content,
      media_url: payload.data?.mediaUrl || payload.mediaUrl,
      media_type: payload.data?.mediaType || payload.mediaType,
      created_at: payload.data?.timestamp || payload.timestamp || new Date().toISOString(),
      status: 'received'
    };

    return await webhookService.createMessageWebhook(phoneId, messageData, 'message.received');
  }

  // Process message acknowledgment webhook
  async processMessageAckWebhook(phoneId, payload) {
    const ackData = {
      id: payload.data?.id || payload.id,
      status: payload.data?.status || payload.status,
      timestamp: payload.data?.timestamp || payload.timestamp || new Date().toISOString()
    };

    return await webhookService.createEvent(phoneId, 'message.ack', ackData);
  }

  // Process message reaction webhook
  async processMessageReactionWebhook(phoneId, payload) {
    const reactionData = {
      messageId: payload.data?.messageId || payload.messageId,
      reaction: payload.data?.reaction || payload.reaction,
      from: payload.data?.from || payload.from,
      timestamp: payload.data?.timestamp || payload.timestamp || new Date().toISOString()
    };

    return await webhookService.createEvent(phoneId, 'message.reaction', reactionData);
  }

  // Process connection status webhook
  async processConnectionWebhook(phoneId, payload) {
    const isConnected = payload.data?.connected || payload.connected;
    const qrCode = payload.data?.qrCode || payload.qrCode;

    // Update phone connection status in database
    await PhoneNumber.updateConnectionStatus(phoneId, isConnected, null, qrCode);

    return await webhookService.createConnectionWebhook(phoneId, isConnected, qrCode);
  }

  // Process group webhook
  async processGroupWebhook(phoneId, payload) {
    const groupData = {
      id: payload.data?.groupId || payload.groupId,
      name: payload.data?.groupName || payload.groupName,
      participants: payload.data?.participants || payload.participants,
      action: payload.data?.action || payload.action
    };

    const eventType = payload.event || 'group.participants';
    return await webhookService.createGroupWebhook(phoneId, groupData, eventType.replace('group.', ''));
  }

  // Get webhook events for a phone number
  async getEvents(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { phoneId } = req.params;
      const { limit = 50, offset = 0, eventType } = req.query;

      let result;
      if (eventType) {
        result = await WebhookEvent.findByEventType(eventType, phoneId, parseInt(limit), parseInt(offset));
      } else {
        result = await WebhookEvent.findByPhoneNumberId(phoneId, parseInt(limit), parseInt(offset));
      }

      res.json({
        success: true,
        ...result
      });

    } catch (error) {
      logger.error('Get webhook events error', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to get webhook events'
      });
    }
  }

  // Get webhook statistics
  async getStats(req, res) {
    try {
      const { phoneId } = req.params;
      const stats = await webhookService.getStats(phoneId, req.user.id);

      res.json({
        success: true,
        stats
      });

    } catch (error) {
      logger.error('Get webhook stats error', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to get webhook statistics'
      });
    }
  }

  // Test webhook endpoint
  async testWebhook(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { phoneId } = req.params;
      const { webhookUrl } = req.body;

      const result = await webhookService.testWebhook(phoneId, webhookUrl);

      if (result.success) {
        res.json({
          success: true,
          message: 'Webhook test successful',
          statusCode: result.statusCode,
          duration: result.duration
        });
      } else {
        res.status(400).json({
          success: false,
          error: 'Webhook test failed',
          details: result.error
        });
      }

    } catch (error) {
      logger.error('Test webhook error', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to test webhook'
      });
    }
  }

  // Retry failed webhooks
  async retryFailed(req, res) {
    try {
      const { phoneId } = req.params;
      
      const events = await webhookService.retryFailed(phoneId);

      res.json({
        success: true,
        message: `${events.length} failed webhooks queued for retry`,
        retriedCount: events.length
      });

    } catch (error) {
      logger.error('Retry webhooks error', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to retry webhooks'
      });
    }
  }

  // Get recent webhook events
  async getRecentEvents(req, res) {
    try {
      const { phoneId } = req.params;
      const { limit = 10 } = req.query;

      const events = await webhookService.getRecentEvents(phoneId, parseInt(limit));

      res.json({
        success: true,
        events
      });

    } catch (error) {
      logger.error('Get recent webhook events error', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to get recent webhook events'
      });
    }
  }

  // Get webhook queue status
  async getQueueStatus(req, res) {
    try {
      const queueStatus = webhookService.getQueueStatus();

      res.json({
        success: true,
        queue: queueStatus
      });

    } catch (error) {
      logger.error('Get queue status error', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to get queue status'
      });
    }
  }

  // Cleanup old webhook events
  async cleanupEvents(req, res) {
    try {
      const { days = 30 } = req.body;
      
      const deletedCount = await webhookService.cleanup(parseInt(days));

      res.json({
        success: true,
        message: `${deletedCount} old webhook events deleted`,
        deletedCount
      });

    } catch (error) {
      logger.error('Cleanup webhook events error', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to cleanup webhook events'
      });
    }
  }
}

module.exports = new WebhookController();
