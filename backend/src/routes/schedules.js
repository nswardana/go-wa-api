const express = require('express');
const { body, query } = require('express-validator');
const scheduleController = require('../controllers/scheduleController');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Create new scheduled message
router.post('/', [
  auth,
  body('phoneId').isInt().withMessage('Phone ID must be an integer'),
  body('to').notEmpty().withMessage('Recipient number is required'),
  body('content').notEmpty().withMessage('Message content is required'),
  body('scheduledAt').isISO8601().withMessage('Scheduled date must be valid'),
  body('type').optional().isString().withMessage('Message type must be a string'),
  body('mediaUrl').optional().isURL().withMessage('Media URL must be valid')
], scheduleController.createSchedule);

// Get all scheduled messages for user
router.get('/', [
  auth,
  query('status').optional().isIn(['pending', 'processing', 'sent', 'failed']).withMessage('Invalid status')
], scheduleController.getSchedules);

// Update scheduled message
router.put('/:scheduleId', [
  auth,
  body('to').optional().notEmpty().withMessage('Recipient number cannot be empty'),
  body('content').optional().notEmpty().withMessage('Message content cannot be empty'),
  body('scheduledAt').optional().isISO8601().withMessage('Scheduled date must be valid'),
  body('type').optional().isString().withMessage('Message type must be a string'),
  body('mediaUrl').optional().isURL().withMessage('Media URL must be valid')
], scheduleController.updateSchedule);

// Delete scheduled message
router.delete('/:scheduleId', [
  auth
], scheduleController.deleteSchedule);

// Process scheduled messages (cron job)
router.post('/process', [
  // This endpoint should be protected with API key for cron jobs
], scheduleController.processScheduledMessages);

module.exports = router;
