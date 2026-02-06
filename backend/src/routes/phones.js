const express = require('express');
const { body, query } = require('express-validator');
const phoneController = require('../controllers/phoneController');
const { auth, phoneOwnership } = require('../middleware/auth');

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
  auth,
  phoneOwnership
], phoneController.getPhoneById);

router.put('/:phoneId', [
  auth,
  phoneOwnership
], phoneController.updatePhone);

router.delete('/:phoneId', [
  auth,
  phoneOwnership
], phoneController.deletePhone);

module.exports = router;
