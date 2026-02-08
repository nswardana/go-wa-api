const { db } = require('../config/database');
const logger = require('../utils/logger');

class ScheduleService {
  // Create scheduled message
  async createSchedule(userId, scheduleData) {
    try {
      const { phoneId, to, content, scheduledAt, type, mediaUrl } = scheduleData;
      
      const query = `
        INSERT INTO scheduled_messages (user_id, phone_id, to_number, content, scheduled_at, message_type, media_url, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;
      
      const schedule = await db.getOne(query, [
        userId,
        phoneId,
        to,
        content,
        scheduledAt,
        type || 'text',
        mediaUrl || null,
        'pending'
      ]);
      
      logger.info('Scheduled message created:', { scheduleId: schedule.id, userId });
      return schedule;
    } catch (error) {
      logger.error('Failed to create schedule:', error);
      throw new Error('Failed to create schedule');
    }
  }

  // Get all scheduled messages for user
  async getSchedules(userId) {
    try {
      const query = `
        SELECT sm.*, p.device_name, p.phone_number 
        FROM scheduled_messages sm
        LEFT JOIN phone_numbers p ON sm.phone_id = p.id
        WHERE sm.user_id = $1 
        ORDER BY sm.scheduled_at ASC
      `;
      
      const schedules = await db.getAll(query, [userId]);
      return schedules;
    } catch (error) {
      logger.error('Failed to get schedules:', error);
      throw new Error('Failed to get schedules');
    }
  }

  // Update scheduled message
  async updateSchedule(scheduleId, userId, scheduleData) {
    try {
      const { to, content, scheduledAt, type, mediaUrl } = scheduleData;
      
      const query = `
        UPDATE scheduled_messages 
        SET to_number = $1, content = $2, scheduled_at = $3, message_type = $4, media_url = $5, updated_at = CURRENT_TIMESTAMP
        WHERE id = $6 AND user_id = $7
        RETURNING *
      `;
      
      const schedule = await db.getOne(query, [
        to,
        content,
        scheduledAt,
        type || 'text',
        mediaUrl || null,
        scheduleId,
        userId
      ]);
      
      if (!schedule) {
        throw new Error('Schedule not found');
      }
      
      logger.info('Schedule updated:', { scheduleId, userId });
      return schedule;
    } catch (error) {
      logger.error('Failed to update schedule:', error);
      throw new Error('Failed to update schedule');
    }
  }

  // Delete scheduled message
  async deleteSchedule(scheduleId, userId) {
    try {
      const query = `
        DELETE FROM scheduled_messages 
        WHERE id = $1 AND user_id = $2
        RETURNING *
      `;
      
      const schedule = await db.getOne(query, [scheduleId, userId]);
      
      if (!schedule) {
        throw new Error('Schedule not found');
      }
      
      logger.info('Schedule deleted:', { scheduleId, userId });
      return schedule;
    } catch (error) {
      logger.error('Failed to delete schedule:', error);
      throw new Error('Failed to delete schedule');
    }
  }

  // Process scheduled messages (cron job)
  async processScheduledMessages() {
    try {
      const query = `
        UPDATE scheduled_messages 
        SET status = 'processing', updated_at = CURRENT_TIMESTAMP
        WHERE status = 'pending' AND scheduled_at <= CURRENT_TIMESTAMP
        RETURNING *
      `;
      
      const messages = await db.getAll(query);
      
      for (const message of messages) {
        try {
          // Send message (mock for now)
          const messageQuery = `
            INSERT INTO messages (phone_number_id, message_id, from_number, to_number, message_type, content, status, created_at)
            SELECT phone_id, $1, p.phone_number, to_number, message_type, content, 'sent', CURRENT_TIMESTAMP
            FROM phone_numbers p
            WHERE p.id = phone_id
          `;
          
          await db.query(messageQuery, ['scheduled_' + Date.now()]);
          
          // Update schedule status
          await db.query(
            'UPDATE scheduled_messages SET status = $1 WHERE id = $2',
            ['sent', message.id]
          );
          
          logger.info('Scheduled message sent:', { scheduleId: message.id });
        } catch (error) {
          // Update schedule status to failed
          await db.query(
            'UPDATE scheduled_messages SET status = $1 WHERE id = $2',
            ['failed', message.id]
          );
          
          logger.error('Failed to send scheduled message:', { scheduleId: message.id, error: error.message });
        }
      }
      
      return messages.length;
    } catch (error) {
      logger.error('Failed to process scheduled messages:', error);
      throw new Error('Failed to process scheduled messages');
    }
  }
}

module.exports = new ScheduleService();
