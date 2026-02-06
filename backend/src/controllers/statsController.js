const User = require('../models/User');
const PhoneNumber = require('../models/PhoneNumber');
const WebhookEvent = require('../models/WebhookEvent');
const { db } = require('../config/database');
const logger = require('../utils/logger');

class StatsController {
  async getDashboardStats(req, res) {
    try {
      const userId = req.user.id;

      const [userStats, phoneStats, webhookStats] = await Promise.all([
        User.getStats(userId),
        PhoneNumber.getStats(userId),
        WebhookEvent.getStats(null, userId)
      ]);

      const recentMessages = await db.getMany(`
        SELECT m.*, p.phone_number
        FROM messages m
        JOIN phone_numbers p ON m.phone_number_id = p.id
        WHERE p.user_id = $1
        ORDER BY m.created_at DESC
        LIMIT 10
      `, [userId]);

      const recentWebhooks = await WebhookEvent.getRecentEvents(null, 10);

      res.json({
        success: true,
        stats: {
          user: userStats,
          phones: phoneStats,
          webhooks: webhookStats
        },
        recent: {
          messages: recentMessages,
          webhooks: recentWebhooks
        }
      });

    } catch (error) {
      logger.error('Get dashboard stats error', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to get dashboard stats'
      });
    }
  }

  async getMessageStats(req, res) {
    try {
      const userId = req.user.id;
      const { period = '7d' } = req.query;

      let timeFilter;
      switch (period) {
        case '1d':
          timeFilter = "created_at >= CURRENT_DATE - INTERVAL '1 day'";
          break;
        case '7d':
          timeFilter = "created_at >= CURRENT_DATE - INTERVAL '7 days'";
          break;
        case '30d':
          timeFilter = "created_at >= CURRENT_DATE - INTERVAL '30 days'";
          break;
        default:
          timeFilter = "created_at >= CURRENT_DATE - INTERVAL '7 days'";
      }

      const [totalSent, totalReceived, dailyStats] = await Promise.all([
        db.getOne(`
          SELECT COUNT(*) as count FROM messages m
          JOIN phone_numbers p ON m.phone_number_id = p.id
          WHERE p.user_id = $1 AND m.from_number = p.phone_number AND ${timeFilter}
        `, [userId]),
        
        db.getOne(`
          SELECT COUNT(*) as count FROM messages m
          JOIN phone_numbers p ON m.phone_number_id = p.id
          WHERE p.user_id = $1 AND m.from_number != p.phone_number AND ${timeFilter}
        `, [userId]),
        
        db.getMany(`
          SELECT 
            DATE(created_at) as date,
            COUNT(*) as count
          FROM messages m
          JOIN phone_numbers p ON m.phone_number_id = p.id
          WHERE p.user_id = $1 AND ${timeFilter}
          GROUP BY DATE(created_at)
          ORDER BY date DESC
          LIMIT 30
        `, [userId])
      ]);

      res.json({
        success: true,
        period,
        stats: {
          sent: parseInt(totalSent.count),
          received: parseInt(totalReceived.count),
          total: parseInt(totalSent.count) + parseInt(totalReceived.count),
          daily: dailyStats
        }
      });

    } catch (error) {
      logger.error('Get message stats error', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to get message stats'
      });
    }
  }

  async getPhoneStats(req, res) {
    try {
      const userId = req.user.id;
      
      const [phoneStats, connectionStats] = await Promise.all([
        PhoneNumber.getStats(userId),
        db.getMany(`
          SELECT 
            p.id,
            p.phone_number,
            p.is_connected,
            p.last_seen,
            COUNT(m.id) as message_count
          FROM phone_numbers p
          LEFT JOIN messages m ON p.id = m.phone_number_id
          WHERE p.user_id = $1
          GROUP BY p.id, p.phone_number, p.is_connected, p.last_seen
          ORDER BY p.created_at DESC
        `, [userId])
      ]);

      res.json({
        success: true,
        stats: {
          summary: phoneStats,
          details: connectionStats
        }
      });

    } catch (error) {
      logger.error('Get phone stats error', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to get phone stats'
      });
    }
  }

  async getWebhookStats(req, res) {
    try {
      const userId = req.user.id;
      const { period = '24h' } = req.query;

      let timeFilter;
      switch (period) {
        case '1h':
          timeFilter = "created_at >= NOW() - INTERVAL '1 hour'";
          break;
        case '24h':
          timeFilter = "created_at >= NOW() - INTERVAL '24 hours'";
          break;
        case '7d':
          timeFilter = "created_at >= NOW() - INTERVAL '7 days'";
          break;
        default:
          timeFilter = "created_at >= NOW() - INTERVAL '24 hours'";
      }

      const [webhookStats, eventTypeStats, hourlyStats] = await Promise.all([
        WebhookEvent.getStats(null, userId),
        db.getMany(`
          SELECT 
            event_type,
            COUNT(*) as count
          FROM webhook_events we
          JOIN phone_numbers p ON we.phone_number_id = p.id
          WHERE p.user_id = $1 AND ${timeFilter}
          GROUP BY event_type
          ORDER BY count DESC
        `, [userId]),
        
        db.getMany(`
          SELECT 
            DATE_TRUNC('hour', created_at) as hour,
            COUNT(*) as count
          FROM webhook_events we
          JOIN phone_numbers p ON we.phone_number_id = p.id
          WHERE p.user_id = $1 AND ${timeFilter}
          GROUP BY DATE_TRUNC('hour', created_at)
          ORDER BY hour DESC
          LIMIT 24
        `, [userId])
      ]);

      const deliveryRate = await WebhookEvent.getDeliveryRate(null, 24);

      res.json({
        success: true,
        period,
        stats: {
          summary: webhookStats,
          eventTypes: eventTypeStats,
          hourly: hourlyStats,
          deliveryRate: deliveryRate.deliveryRate
        }
      });

    } catch (error) {
      logger.error('Get webhook stats error', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to get webhook stats'
      });
    }
  }
}

module.exports = new StatsController();
