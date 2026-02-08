const express = require('express');
const { body, query } = require('express-validator');
const phoneController = require('../controllers/phoneController');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.post('/', [
  auth,
  body('phoneNumber').notEmpty().withMessage('Phone number is required'),
  body('deviceName').optional().isString().withMessage('Device name must be a string')
], phoneController.createPhone);

router.get('/', [
  auth,
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 })
], phoneController.getPhones);

router.get('/:phoneId', [
  auth
], phoneController.getPhoneById);

router.put('/:phoneId', [
  auth,
  body('phoneNumber').notEmpty().withMessage('Phone number is required'),
  body('deviceName').optional().isString().withMessage('Device name must be a string')
], phoneController.updatePhone);

router.delete('/:phoneId', [
  auth
], phoneController.deletePhone);

router.post('/:phoneId/generate-qr', [
  auth
], phoneController.generateQR);

router.get('/:phoneId/qr-image', [
  auth
], phoneController.getQRImage);

router.get('/:phoneId/status', [
  auth
], phoneController.getConnectionStatus);

module.exports = router;
