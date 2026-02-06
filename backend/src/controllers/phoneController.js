const PhoneNumber = require('../models/PhoneNumber');
const logger = require('../utils/logger');
const { validationResult } = require('express-validator');

class PhoneController {
  async createPhone(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { phoneNumber, deviceName, webhookUrl, autoReply, autoMarkRead, autoDownloadMedia } = req.body;

      // Check if phone number already exists for this user
      const existingPhone = await PhoneNumber.findByPhoneNumber(req.user.id, phoneNumber);
      if (existingPhone) {
        return res.status(409).json({
          error: 'Phone number already exists',
          message: 'This phone number is already registered'
        });
      }

      const phone = await PhoneNumber.create({
        userId: req.user.id,
        phoneNumber,
        deviceName,
        webhookUrl,
        autoReply,
        autoMarkRead,
        autoDownloadMedia
      });

      logger.info(`Phone number created: ${phoneNumber} by ${req.user.username}`);

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
          isConnected: phone.is_connected,
          autoReply: phone.auto_reply,
          autoMarkRead: phone.auto_mark_read,
          autoDownloadMedia: phone.auto_download_media,
          createdAt: phone.created_at
        }
      });

    } catch (error) {
      logger.error('Create phone number error', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to create phone number'
      });
    }
  }

  async getPhones(req, res) {
    try {
      const { limit = 50, offset = 0 } = req.query;
      const result = await PhoneNumber.findByUserId(req.user.id, parseInt(limit), parseInt(offset));

      res.json({
        success: true,
        ...result
      });

    } catch (error) {
      logger.error('Get phone numbers error', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to get phone numbers'
      });
    }
  }

  async getPhoneById(req, res) {
    try {
      const phone = req.phone;

      res.json({
        success: true,
        phone: {
          id: phone.id,
          phoneNumber: phone.phone_number,
          deviceName: phone.device_name,
          token: phone.token,
          webhookUrl: phone.webhook_url,
          webhookSecret: phone.webhook_secret,
          isConnected: phone.is_connected,
          lastSeen: phone.last_seen,
          qrCode: phone.qr_code,
          autoReply: phone.auto_reply,
          autoMarkRead: phone.auto_mark_read,
          autoDownloadMedia: phone.auto_download_media,
          createdAt: phone.created_at,
          updatedAt: phone.updated_at
        }
      });

    } catch (error) {
      logger.error('Get phone number error', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to get phone number'
      });
    }
  }

  async updatePhone(req, res) {
    try {
      const phone = req.phone;
      const { deviceName, webhookUrl, webhookSecret, autoReply, autoMarkRead, autoDownloadMedia } = req.body;

      const updatedPhone = await PhoneNumber.update(phone.id, {
        device_name: deviceName,
        webhook_url: webhookUrl,
        webhook_secret: webhookSecret,
        auto_reply: autoReply,
        auto_mark_read: autoMarkRead,
        auto_download_media: autoDownloadMedia
      });

      logger.info(`Phone number updated: ${updatedPhone.phone_number} by ${req.user.username}`);

      res.json({
        success: true,
        message: 'Phone number updated successfully',
        phone: {
          id: updatedPhone.id,
          phoneNumber: updatedPhone.phone_number,
          deviceName: updatedPhone.device_name,
          token: updatedPhone.token,
          webhookUrl: updatedPhone.webhook_url,
          webhookSecret: updatedPhone.webhook_secret,
          isConnected: updatedPhone.is_connected,
          autoReply: updatedPhone.auto_reply,
          autoMarkRead: updatedPhone.auto_mark_read,
          autoDownloadMedia: updatedPhone.auto_download_media,
          updatedAt: updatedPhone.updated_at
        }
      });

    } catch (error) {
      logger.error('Update phone number error', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to update phone number'
      });
    }
  }

  async deletePhone(req, res) {
    try {
      const phone = req.phone;

      await PhoneNumber.delete(phone.id);

      logger.info(`Phone number deleted: ${phone.phone_number} by ${req.user.username}`);

      res.json({
        success: true,
        message: 'Phone number deleted successfully'
      });

    } catch (error) {
      logger.error('Delete phone number error', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to delete phone number'
      });
    }
  }
}

module.exports = new PhoneController();
