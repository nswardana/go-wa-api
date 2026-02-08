const express = require('express');
const { body, query } = require('express-validator');
const messageController = require('../controllers/messageController');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.get('/', [
  auth,
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 }),
  query('status').optional().isString(),
  query('phoneId').optional().isInt()
], messageController.getMessages);

router.get('/:messageId', [
  auth
], messageController.getMessageById);

router.post('/send', [
  auth,
  body('phone_id').notEmpty().withMessage('Phone ID is required'),
  body('to').notEmpty().withMessage('To number is required'),
  body('message').notEmpty().withMessage('Message is required'),
  body('media_url').optional().isString(),
  body('media_type').optional().isString()
], messageController.sendMessage);

router.post('/:phoneId/sync', [
  auth
], messageController.syncMessages);

router.delete('/:messageId', [
  auth
], messageController.deleteMessage);

module.exports = router;
