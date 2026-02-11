const express = require('express');
const { body, query } = require('express-validator');
const phoneController = require('../controllers/phoneController');
const { auth } = require('../middleware/auth');
const { db } = require('../config/database');

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

// Get phones with API keys
router.get('/with-keys', [
  auth
], async (req, res) => {
  try {
    const userId = req.user.id;
    
    const query = `
      SELECT p.id, p.phone_number, p.device_name, p.token as number_key, p.is_connected, 
             p.created_at, p.updated_at
      FROM phone_numbers p
      WHERE p.user_id = $1
      ORDER BY p.created_at DESC
    `;
    const result = await db.query(query, [userId]);
    
    res.json({
      success: true,
      phones: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching phones with keys:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch phones with keys',
      details: error.message
    });
  }
});

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

router.post('/:phoneId/disconnect', [
  auth
], phoneController.disconnectPhone);

router.get('/:phoneId/qr-image', [
  auth
], phoneController.getQRImage);

router.get('/:phoneId/status', [
  auth
], phoneController.getConnectionStatus);

module.exports = router;
