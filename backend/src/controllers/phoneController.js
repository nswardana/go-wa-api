const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');
const logger = require('../utils/logger');
const { db } = require('../config/database');
const evolutionService = require('../services/evolutionService');

class PhoneController {
  // Get all phones for authenticated user
  async getPhones(req, res) {
    try {
      const userId = req.user.id;
      const { limit = 50, offset = 0 } = req.query;
      
      const query = 'SELECT p.*, COUNT(m.id) as message_count ' +
                   'FROM phone_numbers p ' +
                   'LEFT JOIN messages m ON p.id = m.phone_number_id ' +
                   'WHERE p.user_id = $1 ' +
                   'GROUP BY p.id, p.user_id, p.phone_number, p.device_name, p.token, p.webhook_url, p.webhook_secret, p.is_connected, p.last_seen, p.qr_code, p.session_data, p.auto_reply, p.auto_mark_read, p.auto_download_media, p.created_at, p.updated_at ' +
                   'ORDER BY p.created_at DESC ' +
                   'LIMIT $2 OFFSET $3';
      
      const phones = await db.query(query, [userId, parseInt(limit), parseInt(offset)]);
      
      const countQuery = 'SELECT COUNT(*) as total ' +
                       'FROM phone_numbers ' +
                       'WHERE user_id = $1';
      
      const countResult = await db.query(countQuery, [userId]);
      const count = countResult.rows[0];
      
      res.json({
        success: true,
        phones: phones.rows,
        total: parseInt(count.total),
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
      
    } catch (error) {
      logger.error('Get phones error:', error);
      res.status(500).json({
        error: 'Internal server error'
      });
    }
  }

  // Get phone by ID
  async getPhoneById(req, res) {
    try {
      const { phoneId } = req.params;
      const userId = req.user.id;
      
      const query = 'SELECT * FROM phone_numbers ' +
                   'WHERE id = $1 AND user_id = $2';
      
      const phoneResult = await db.query(query, [phoneId, userId]);
      const phone = phoneResult.rows[0];
      
      if (!phone) {
        return res.status(404).json({
          error: 'Phone not found'
        });
      }
      
      res.json({
        success: true,
        phone
      });
      
    } catch (error) {
      logger.error('Get phone by ID error:', error);
      res.status(500).json({
        error: 'Internal server error'
      });
    }
  }

  // Create new phone
  async createPhone(req, res) {
    try {
      const userId = req.user.id;
      const { phoneNumber, deviceName, webhookUrl, webhookSecret } = req.body;
      
      // Simple limit check (max 3 phones for demo)
      const phoneCountQuery = 'SELECT COUNT(*) as phone_count ' +
                             'FROM phone_numbers ' +
                             'WHERE user_id = $1';
      
      const phoneCountResult = await db.query(phoneCountQuery, [userId]);
      const phoneCount = phoneCountResult.rows[0];
      const currentPhones = parseInt(phoneCount.phone_count);
      
      if (currentPhones >= 3) {
        return res.status(403).json({
          error: 'Phone number limit reached. Maximum allowed: 3',
          current_count: currentPhones,
          max_allowed: 3
        });
      }
      
      const token = 'token_' + uuidv4().replace(/-/g, '');
      const webhookSecretFinal = webhookSecret || 'webhook_' + uuidv4();
      
      const query = 'INSERT INTO phone_numbers (user_id, phone_number, device_name, token, webhook_url, webhook_secret) ' +
                   'VALUES ($1, $2, $3, $4, $5, $6) ' +
                   'RETURNING *';
      
      const phoneResult = await db.query(query, [
        userId, phoneNumber, deviceName, token, webhookUrl, webhookSecretFinal
      ]);
      const phone = phoneResult.rows[0];
      
      // Create instance in ChatFlow
      try {
        await evolutionService.createInstance({
          deviceName: phone.device_name,
          phoneNumber: phone.phone_number,
          webhookUrl: phone.webhook_url,
          webhookSecret: phone.webhook_secret,
          token: phone.token
        });
      } catch (error) {
        logger.warn('Failed to create ChatFlow instance:', error.message);
      }
      
      logger.info('Phone created: ' + phone.id + ' for user ' + userId);
      
      res.status(201).json({
        success: true,
        message: 'Phone number created successfully',
        phone: {
          id: phone.id,
          phoneNumber: phone.phone_number,
          deviceName: phone.device_name,
          token: phone.token,
          webhookUrl: phone.webhook_url,
          webhookSecret: phone.webhook_secret,
          isConnected: false,
          autoReply: null,
          autoMarkRead: false,
          autoDownloadMedia: true,
          createdAt: phone.created_at
        }
      });
      
    } catch (error) {
      logger.error('Create phone error:', error);
      res.status(500).json({
        error: 'Internal server error'
      });
    }
  }

  // Update phone
  async updatePhone(req, res) {
    try {
      const { phoneId } = req.params;
      const userId = req.user.id;
      const { phoneNumber, deviceName, webhookUrl, webhookSecret } = req.body;
      
      // Check if phone belongs to user
      const checkQuery = 'SELECT id FROM phone_numbers ' +
                       'WHERE id = $1 AND user_id = $2';
      
      const existingPhoneResult = await db.query(checkQuery, [phoneId, userId]);
      const existingPhone = existingPhoneResult.rows[0];
      
      if (!existingPhone) {
        return res.status(404).json({
          error: 'Phone not found'
        });
      }
      
      const query = 'UPDATE phone_numbers ' +
                   'SET phone_number = $1, device_name = $2, webhook_url = $3, webhook_secret = $4, updated_at = CURRENT_TIMESTAMP ' +
                   'WHERE id = $5 AND user_id = $6 ' +
                   'RETURNING *';
      
      const phoneResult = await db.query(query, [
        phoneNumber, deviceName, webhookUrl, webhookSecret, phoneId, userId
      ]);
      const phone = phoneResult.rows[0];
      
      logger.info('Phone updated: ' + phone.id);
      
      res.json({
        success: true,
        message: 'Phone number updated successfully',
        phone: {
          id: phone.id,
          phoneNumber: phone.phone_number,
          deviceName: phone.device_name,
          token: phone.token,
          webhookUrl: phone.webhook_url,
          webhookSecret: phone.webhook_secret,
          isConnected: phone.is_connected,
          autoReply: phone.auto_reply,
          autoMarkRead: phone.auto_mark_read,
          autoDownloadMedia: phone.auto_download_media,
          updatedAt: phone.updated_at
        }
      });
      
    } catch (error) {
      logger.error('Update phone error:', error);
      res.status(500).json({
        error: 'Internal server error'
      });
    }
  }

  // Delete phone
  async deletePhone(req, res) {
    try {
      const { phoneId } = req.params;
      const userId = req.user.id;
      
      // Check if phone belongs to user
      const checkQuery = 'SELECT id FROM phone_numbers ' +
                       'WHERE id = $1 AND user_id = $2';
      
      const existingPhoneResult = await db.query(checkQuery, [phoneId, userId]);
      const existingPhone = existingPhoneResult.rows[0];
      
      if (!existingPhone) {
        return res.status(404).json({
          error: 'Phone not found'
        });
      }
      
      const query = 'DELETE FROM phone_numbers ' +
                   'WHERE id = $1 AND user_id = $2';
      
      await db.query(query, [phoneId, userId]);
      
      logger.info('Phone deleted: ' + phoneId);
      
      res.json({
        success: true,
        message: 'Phone number deleted successfully'
      });
      
    } catch (error) {
      logger.error('Delete phone error:', error);
      res.status(500).json({
        error: 'Internal server error'
      });
    }
  }

  // Generate QR code for phone (Simple Mock)
  async generateQR(req, res) {
    try {
      const { phoneId } = req.params;
      const userId = req.user.id;
      
      logger.info('Generating QR for phoneId:', phoneId, 'userId:', userId);
      
      // Check if phone belongs to user
      const checkQuery = 'SELECT * FROM phone_numbers ' +
                       'WHERE id = $1 AND user_id = $2';
      
      const phoneResult = await db.query(checkQuery, [phoneId, userId]);
      const phone = phoneResult.rows[0];
      
      if (!phone) {
        logger.error('Phone not found:', { phoneId, userId });
        return res.status(404).json({
          error: 'Phone not found'
        });
      }
      
      logger.info('Found phone:', { phoneId: phone.id, deviceName: phone.device_name });
      
      // Generate QR code using ChatFlow service
      const qrResult = await evolutionService.generateQR(phoneId);
      
      if (qrResult.success) {
        logger.info('QR code generated successfully for phone:', phoneId);
        
        res.json({
          success: true,
          message: qrResult.message,
          qrCode: qrResult.qrCode,
          phoneId: phoneId,
          deviceName: phone.device_name,
          phoneNumber: phone.phone_number,
          source: qrResult.source
        });
      } else {
        logger.error('QR generation failed:', qrResult.message);
        res.status(500).json({
          error: 'Failed to generate QR code',
          message: qrResult.message
        });
      }
      
    } catch (error) {
      logger.error('Generate QR error:', {
        error: error.message,
        stack: error.stack,
        phoneId: req.params.phoneId
      });
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to generate QR code: ' + error.message
      });
    }
  }

  // Get QR code image
  async getQRImage(req, res) {
    try {
      const { phoneId } = req.params;
      const userId = req.user.id;
      
      // Check if phone belongs to user
      const checkQuery = 'SELECT * FROM phone_numbers ' +
                       'WHERE id = $1 AND user_id = $2';
      
      const phoneResult = await db.query(checkQuery, [phoneId, userId]);
      const phone = phoneResult.rows[0];
      
      if (!phone) {
        return res.status(404).json({
          error: 'Phone not found'
        });
      }

      if (!phone.qr_code) {
        return res.status(404).json({
          error: 'QR code not found. Please generate QR code first.'
        });
      }

      // If QR code is a URL, fetch and serve the image
      if (phone.qr_code.startsWith('http')) {
        const axios = require('axios');
        // Convert localhost URL to container URL for internal access
        let imageUrl = phone.qr_code;
        if (imageUrl.includes('localhost:8082')) {
          imageUrl = imageUrl.replace('localhost:8082', 'http://chatflow-2:3000');
        }
        
        const response = await axios.get(imageUrl, {
          responseType: 'stream',
          auth: {
            username: 'admin',
            password: 'admin'
          }
        });
        
        res.set({
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=300' // 5 minutes cache
        });
        
        response.data.pipe(res);
      } else {
        // If QR code is base64, decode and serve
        const Buffer = require('buffer').Buffer;
        const imageBuffer = Buffer.from(phone.qr_code, 'base64');
        
        res.set({
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=300'
        });
        
        res.send(imageBuffer);
      }
    } catch (error) {
      logger.error('Get QR image error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  }

  // Get connection status for phone
  async getConnectionStatus(req, res) {
    try {
      const { phoneId } = req.params;
      const userId = req.user.id;
      
      // Check if phone belongs to user
      const checkQuery = 'SELECT * FROM phone_numbers ' +
                       'WHERE id = $1 AND user_id = $2';
      
      const phoneResult = await db.query(checkQuery, [phoneId, userId]);
      const phone = phoneResult.rows[0];
      
      if (!phone) {
        return res.status(404).json({
          error: 'Phone not found'
        });
      }
      
      res.json({
        success: true,
        phone: {
          id: phone.id,
          phoneNumber: phone.phone_number,
          deviceName: phone.device_name,
          isConnected: phone.is_connected || false,
          lastSeen: phone.last_seen
        }
      });
      
    } catch (error) {
      logger.error('Get connection status error:', error);
      res.status(500).json({
        error: 'Internal server error'
      });
    }
  }
}

module.exports = new PhoneController();
