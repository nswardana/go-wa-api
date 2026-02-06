const express = require('express');
const statsController = require('../controllers/statsController');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.get('/dashboard', [
  auth
], statsController.getDashboardStats);

router.get('/messages', [
  auth
], statsController.getMessageStats);

router.get('/phones', [
  auth
], statsController.getPhoneStats);

router.get('/webhooks', [
  auth
], statsController.getWebhookStats);

module.exports = router;
