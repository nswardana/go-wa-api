const express = require('express');
const crypto = require('crypto');
const evolutionService = require('../services/evolutionService');
const logger = require('../utils/logger');
const webhookController = require('../controllers/webhookController');

const router = express.Router();

// Verify HMAC signature dari GOWA
function verifyWebhookSignature(req, res, next) {
  const secret = process.env.WEBHOOK_SECRET || 'webhook_secret_123';
  const signature = req.headers['x-hub-signature-256'] || req.headers['x-signature'];
  
  if (!signature) return next(); // skip jika tidak ada signature
  
  const hmac = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(req.body))
    .digest('hex');
  
  const expected = `sha256=${hmac}`;
  if (signature !== expected) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  next();
}

// GOWA webhook endpoint
router.post('/incoming', verifyWebhookSignature, async (req, res) => {
  try {
    console.log('GOWA Webhook called:', req.body);
    logger.info('GOWA Webhook received in publicWebhook:', req.body);
    
    const result = await webhookController.handleIncoming(req, res);
    console.log('GOWA Webhook result:', result);
    logger.info('GOWA Webhook result:', result);
    
    return result;
  } catch (error) {
    console.error('GOWA Webhook error:', error);
    logger.error('GOWA Webhook error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Public webhook endpoint for ChatFlow and go-whatsapp-web-multidevice
router.post('/evolution', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    let webhookData;
    
    // Handle both raw JSON and parsed JSON
    if (typeof req.body === 'string') {
      webhookData = JSON.parse(req.body);
    } else if (typeof req.body === 'object') {
      webhookData = req.body;
    } else {
      logger.error('Invalid webhook body type:', typeof req.body);
      return res.status(400).json({ status: 'error', message: 'Invalid request body' });
    }
    
    logger.info('Received webhook:', {
      event: webhookData.event,
      instance: webhookData.instance,
      data: webhookData.data ? 'present' : 'absent'
    });

    // Handle go-whatsapp-web-multidevice format
    if (webhookData.event === 'message') {
      const processedData = processGoWhatsAppPayload(webhookData);
      
      // Convert to legacy format for compatibility
      const legacyData = {
        event: 'message.received',
        device: processedData.deviceName,
        data: {
          from: processedData.from,
          to: processedData.to,
          message: processedData.message,
          text: processedData.message,
          id: processedData.messageId,
          timestamp: processedData.timestamp,
          type: processedData.type,
          senderName: processedData.senderName
        }
      };

      logger.info('Converted webhook to legacy format:', {
        from: legacyData.data.from,
        to: legacyData.data.to,
        message: legacyData.data.message
      });

      // Process webhook through EvolutionService
      const result = await evolutionService.handleWebhook(legacyData);
      
      logger.info('Webhook processed result:', {
        success: result.success,
        shouldReply: result.shouldReply,
        response: result.response ? 'present' : 'absent'
      });
      
      return res.json({
        status: 'success',
        processed: true,
        result
      });
    }

    // Handle legacy format and other events
    const result = await evolutionService.handleWebhook(webhookData);
    
    return res.json({
      status: 'success',
      processed: true,
      result
    });
    
  } catch (error) {
    logger.error('Webhook processing error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

// Process go-whatsapp-web-multidevice payload
function processGoWhatsAppPayload(webhookData) {
  const { data } = webhookData;
  
  // Extract phone number from WhatsApp format
  const extractPhoneNumber = (whatsappId) => {
    if (whatsappId.includes('@s.whatsapp.net')) {
      return whatsappId.replace('@s.whatsapp.net', '');
    }
    if (whatsappId.includes('@g.us')) {
      return whatsappId.replace('@g.us', '');
    }
    return whatsappId;
  };

  // Extract message content
  let messageContent = '';
  if (data.content) {
    if (data.content.conversation) {
      messageContent = data.content.conversation;
    } else if (data.content.text) {
      messageContent = data.content.text;
    } else if (typeof data.content === 'string') {
      messageContent = data.content;
    }
  }

  // Find device name from database or use instance
  let deviceName = webhookData.instance || 'unknown';
  
  return {
    messageId: data.id,
    from: extractPhoneNumber(data.from),
    to: data.to,
    message: messageContent,
    timestamp: data.timestamp,
    type: data.type || 'chat',
    senderName: data.pushname,
    deviceName,
    isGroup: data.from.includes('@g.us'),
    mediaType: data.type === 'image' ? 'image' : data.type === 'video' ? 'video' : data.type === 'audio' ? 'audio' : 'text'
  };
}

// Health check for webhook
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'evolution-webhook',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
