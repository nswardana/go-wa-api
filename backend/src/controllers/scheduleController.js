const scheduleService = require('../services/scheduleService');
const logger = require('../utils/logger');
const { validationResult } = require('express-validator');

class ScheduleController {
  // Create new scheduled message
  async createSchedule(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const userId = req.user.id;
      const scheduleData = req.body;

      const schedule = await scheduleService.createSchedule(userId, scheduleData);

      res.status(201).json({
        success: true,
        message: 'Message scheduled successfully',
        schedule
      });
    } catch (error) {
      logger.error('Create schedule error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  }

  // Get all scheduled messages for user
  async getSchedules(req, res) {
    try {
      const userId = req.user.id;
      const { status } = req.query;

      let schedules = await scheduleService.getSchedules(userId);

      // Filter by status if specified
      if (status) {
        schedules = schedules.filter(schedule => schedule.status === status);
      }

      res.json({
        success: true,
        schedules,
        total: schedules.length
      });
    } catch (error) {
      logger.error('Get schedules error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  }

  // Update scheduled message
  async updateSchedule(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { scheduleId } = req.params;
      const userId = req.user.id;
      const scheduleData = req.body;

      const schedule = await scheduleService.updateSchedule(scheduleId, userId, scheduleData);

      res.json({
        success: true,
        message: 'Schedule updated successfully',
        schedule
      });
    } catch (error) {
      logger.error('Update schedule error:', error);
      if (error.message === 'Schedule not found') {
        return res.status(404).json({
          error: 'Schedule not found'
        });
      }
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  }

  // Delete scheduled message
  async deleteSchedule(req, res) {
    try {
      const { scheduleId } = req.params;
      const userId = req.user.id;

      const schedule = await scheduleService.deleteSchedule(scheduleId, userId);

      res.json({
        success: true,
        message: 'Schedule deleted successfully',
        schedule
      });
    } catch (error) {
      logger.error('Delete schedule error:', error);
      if (error.message === 'Schedule not found') {
        return res.status(404).json({
          error: 'Schedule not found'
        });
      }
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  }

  // Process scheduled messages (cron job endpoint)
  async processScheduledMessages(req, res) {
    try {
      const processedCount = await scheduleService.processScheduledMessages();

      res.json({
        success: true,
        message: `Processed ${processedCount} scheduled messages`,
        processedCount
      });
    } catch (error) {
      logger.error('Process scheduled messages error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  }
}

module.exports = new ScheduleController();
