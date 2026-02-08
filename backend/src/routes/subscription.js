const express = require('express');
const { body } = require('express-validator');
const subscriptionController = require('../controllers/subscriptionController');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get user subscription info
router.get('/info', auth, subscriptionController.getUserSubscription);

// Check if user can add more phones
router.get('/can-add-phone', auth, subscriptionController.canAddPhone);

// Get available plans
router.get('/plans', subscriptionController.getAvailablePlans);

// Upgrade subscription
router.post('/upgrade', [
  auth,
  body('plan_id').isInt().withMessage('Plan ID must be an integer')
], subscriptionController.upgradeSubscription);

module.exports = router;
