const express = require('express');
const { body, query } = require('express-validator');
const messageController = require('../controllers/messageController');
const { auth, phoneOwnership } = require('../middleware/auth');

const router = express.Router();

router.post('/send', [
  auth,
  body('phoneId').notEmpty().withMessage('Phone ID is required'),
  body('to').notEmpty().withMessage('Recipient number is required'),
  body('message').notEmpty().withMessage('Message is required'),
  body('type').optional().isIn(['text', 'image', 'video', 'audio', 'document'])
], messageController.sendMessage);

router.get('/', [
  auth,
  query('phoneId').optional().isInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 })
], messageController.getMessages);

router.get('/:messageId', [
  auth
], messageController.getMessageById);

module.exports = router;
