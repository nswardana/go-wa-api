const express = require('express');
const evolutionService = require('../services/evolutionService');
const logger = require('../utils/logger');

const router = express.Router();

// Public webhook endpoint for ChatFlow
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
    
    logger.info('Received ChatFlow webhook:', {
      event: webhookData.event,
      instance: webhookData.instance,
      data: webhookData.data ? 'present' : 'absent'
    });

    // Process webhook through EvolutionService
    const result = await evolutionService.handleWebhook(webhookData);
    
    if (result.success) {
      res.status(200).json({ status: 'success' });
    } else {
      res.status(400).json({ status: 'error', message: result.message });
    }
    
  } catch (error) {
    logger.error('Webhook processing error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Internal server error' 
    });
  }
});

// Health check for webhook
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'evolution-webhook',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
