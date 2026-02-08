const express = require('express');
const userMessageController = require('../controllers/userMessageController');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// Rate limiting for user API
const userRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute per user
  message: {
    status: false,
    code: 429,
    message: 'Too many requests. Please try again later.',
    data: null
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use API key as rate limit key
    return req.body.api_key || req.ip;
  }
});

// Apply rate limiting to all routes
router.use(userRateLimit);

// 📨 USER MESSAGE ENDPOINTS

// 1. Send Message to Individual Number
// POST /v1/send-message
router.post('/send-message', userMessageController.sendMessage);

// 2. Send Message to Group
// POST /v1/send-group-message
router.post('/send-group-message', userMessageController.sendGroupMessage);

// 3. Get Account Status
// POST /v1/get-status
router.post('/get-status', userMessageController.getAccountStatus);

// 4. Get Balance/Usage
// POST /v1/get-balance
router.post('/get-balance', userMessageController.getBalance);

// Get Groups
router.post('/get-groups', userRateLimit, userMessageController.getGroups);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: true,
    code: 200,
    message: 'User Message API is healthy',
    data: {
      service: 'User Message API',
      version: 'v1',
      timestamp: new Date().toISOString().replace('T', ' ').substr(0, 19)
    }
  });
});

module.exports = router;
