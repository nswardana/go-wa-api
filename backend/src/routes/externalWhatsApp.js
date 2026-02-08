const express = require('express');
const { body } = require('express-validator');
const externalWhatsAppController = require('../controllers/externalWhatsAppController');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Send message via external WhatsApp API
router.post('/send', [
  auth,
  body('provider').notEmpty().withMessage('Provider is required'),
  body('config.api_key').notEmpty().withMessage('API Key is required'),
  body('config.number_key').notEmpty().withMessage('Number Key is required'),
  body('phoneId').isInt().withMessage('Phone ID must be an integer'),
  body('to').notEmpty().withMessage('Recipient number is required'),
  body('content').notEmpty().withMessage('Message content is required'),
  body('type').optional().isString().withMessage('Message type must be a string'),
  body('mediaUrl').optional().isURL().withMessage('Media URL must be valid')
], externalWhatsAppController.sendMessage);

// Get account status/balance
router.post('/status', [
  auth,
  body('provider').notEmpty().withMessage('Provider is required'),
  body('config.api_key').notEmpty().withMessage('API Key is required'),
  body('config.number_key').optional().notEmpty().withMessage('Number Key is required')
], externalWhatsAppController.getAccountStatus);

// Get supported providers
router.get('/providers', [
  auth
], externalWhatsAppController.getSupportedProviders);

// Test provider connection
router.post('/test', [
  auth,
  body('provider').notEmpty().withMessage('Provider is required'),
  body('config.api_key').notEmpty().withMessage('API Key is required'),
  body('config.number_key').notEmpty().withMessage('Number Key is required')
], externalWhatsAppController.testProvider);

module.exports = router;
