const express = require('express');
const router = express.Router();
const autoReplyController = require('../controllers/autoReplyController');
const { auth } = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(auth);

// Get user's phone numbers
router.get('/phone-numbers', autoReplyController.getPhoneNumbers);

// Auto-reply configurations
router.get('/', autoReplyController.getAutoReplyConfigs);
router.get('/:id', autoReplyController.getAutoReplyConfig);
router.post('/', autoReplyController.createAutoReplyConfig);
router.put('/:id', autoReplyController.updateAutoReplyConfig);
router.delete('/:id', autoReplyController.deleteAutoReplyConfig);

// Test auto-reply
router.post('/:id/test', autoReplyController.testAutoReplyConfig);

// Analytics
router.get('/analytics/stats', autoReplyController.getAutoReplyAnalytics);

module.exports = router;
