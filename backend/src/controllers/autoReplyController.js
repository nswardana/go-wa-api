const { db } = require('../config/database');
const logger = require('../utils/logger');

class AutoReplyController {
  // Get user's phone numbers for auto-reply configuration
  async getPhoneNumbers(req, res) {
    try {
      const userId = req.user.id;
      
      const result = await db.query(`
        SELECT id, phone_number, device_name 
        FROM phone_numbers 
        WHERE user_id = $1 
        ORDER BY phone_number
      `, [userId]);

      res.json({
        success: true,
        phone_numbers: result.rows
      });
    } catch (error) {
      logger.error('Get phone numbers error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Get all auto-reply configs for user
  async getAutoReplyConfigs(req, res) {
    try {
      const userId = req.user.id;
      
      const result = await db.query(`
        SELECT * FROM auto_reply_configs 
        WHERE user_id = $1 
        ORDER BY created_at DESC
      `, [userId]);

      // Get menus for all configs
      const configsWithMenus = await Promise.all(
        result.rows.map(async (config) => {
          const menusResult = await db.query(`
            SELECT * FROM auto_reply_menus 
            WHERE config_id = $1 AND is_active = true 
            ORDER BY order_index ASC, menu_key ASC
          `, [config.id]);

          return {
            ...config,
            menus: menusResult.rows
          };
        })
      );

      res.json({
        success: true,
        configs: configsWithMenus
      });
    } catch (error) {
      logger.error('Get auto-reply configs error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Get single auto-reply config with menus
  async getAutoReplyConfig(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const configResult = await db.query(`
        SELECT * FROM auto_reply_configs 
        WHERE id = $1 AND user_id = $2
      `, [id, userId]);

      if (configResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Auto-reply config not found'
        });
      }

      const config = configResult.rows[0];

      // Get menus for this config
      const menusResult = await db.query(`
        SELECT * FROM auto_reply_menus 
        WHERE config_id = $1 AND is_active = true 
        ORDER BY order_index ASC, menu_key ASC
      `, [id]);

      res.json({
        success: true,
        config: {
          ...config,
          menus: menusResult.rows
        }
      });
    } catch (error) {
      logger.error('Get auto-reply config error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Create new auto-reply config
  async createAutoReplyConfig(req, res) {
    try {
      const userId = req.user.id;
      const { name, trigger_keywords, welcome_message, phone_numbers, menus } = req.body;

      // Validate required fields
      if (!name || !trigger_keywords || !welcome_message) {
        return res.status(400).json({
          success: false,
          error: 'Name, trigger keywords, and welcome message are required'
        });
      }

      // Validate phone numbers if provided
      if (phone_numbers && phone_numbers.length > 0) {
        // Check if phone numbers belong to user
        const phoneCheck = await db.query(`
          SELECT COUNT(*) as count FROM phone_numbers 
          WHERE id = ANY($1) AND user_id = $2
        `, [phone_numbers, userId]);

        if (parseInt(phoneCheck.rows[0].count) !== phone_numbers.length) {
          return res.status(400).json({
            success: false,
            error: 'One or more phone numbers do not belong to this user'
          });
        }
      }

      // Create config
      const configResult = await db.query(`
        INSERT INTO auto_reply_configs (user_id, name, trigger_keywords, welcome_message, phone_numbers)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [userId, name, trigger_keywords, welcome_message, phone_numbers || []]);

      const config = configResult.rows[0];

      // Create menus if provided
      if (menus && menus.length > 0) {
        for (const menu of menus) {
          await db.query(`
            INSERT INTO auto_reply_menus (config_id, menu_key, menu_text, response_text, order_index)
            VALUES ($1, $2, $3, $4, $5)
          `, [config.id, menu.menu_key, menu.menu_text, menu.response_text, menu.order_index || 0]);
        }
      }

      res.status(201).json({
        success: true,
        config
      });
    } catch (error) {
      logger.error('Create auto-reply config error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Update auto-reply config
  async updateAutoReplyConfig(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const { name, trigger_keywords, welcome_message, is_active, phone_numbers, menus } = req.body;

      // Check if config exists and belongs to user
      const existingConfig = await db.query(`
        SELECT * FROM auto_reply_configs 
        WHERE id = $1 AND user_id = $2
      `, [id, userId]);

      if (existingConfig.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Auto-reply config not found'
        });
      }

      // Validate phone numbers if provided
      if (phone_numbers !== undefined && phone_numbers.length > 0) {
        // Check if phone numbers belong to user
        const phoneCheck = await db.query(`
          SELECT COUNT(*) as count FROM phone_numbers 
          WHERE id = ANY($1) AND user_id = $2
        `, [phone_numbers, userId]);

        if (parseInt(phoneCheck.rows[0].count) !== phone_numbers.length) {
          return res.status(400).json({
            success: false,
            error: 'One or more phone numbers do not belong to this user'
          });
        }
      }

      // Update config
      const updateFields = [];
      const updateValues = [];
      let paramIndex = 1;

      if (name !== undefined) {
        updateFields.push(`name = $${paramIndex++}`);
        updateValues.push(name);
      }
      if (trigger_keywords !== undefined) {
        updateFields.push(`trigger_keywords = $${paramIndex++}`);
        updateValues.push(trigger_keywords);
      }
      if (welcome_message !== undefined) {
        updateFields.push(`welcome_message = $${paramIndex++}`);
        updateValues.push(welcome_message);
      }
      if (is_active !== undefined) {
        updateFields.push(`is_active = $${paramIndex++}`);
        updateValues.push(is_active);
      }
      if (phone_numbers !== undefined) {
        updateFields.push(`phone_numbers = $${paramIndex++}`);
        updateValues.push(phone_numbers);
      }

      if (updateFields.length > 0) {
        updateValues.push(id, userId);
        await db.query(`
          UPDATE auto_reply_configs 
          SET ${updateFields.join(', ')}
          WHERE id = $${paramIndex++} AND user_id = $${paramIndex++}
        `, updateValues);
      }

      // Update menus if provided
      if (menus !== undefined) {
        // Delete existing menus
        await db.query(`
          DELETE FROM auto_reply_menus WHERE config_id = $1
        `, [id]);

        // Create new menus
        for (const menu of menus) {
          await db.query(`
            INSERT INTO auto_reply_menus (config_id, menu_key, menu_text, response_text, order_index)
            VALUES ($1, $2, $3, $4, $5)
          `, [id, menu.menu_key, menu.menu_text, menu.response_text, menu.order_index || 0]);
        }
      }

      // Get updated config
      const updatedResult = await db.query(`
        SELECT * FROM auto_reply_configs WHERE id = $1
      `, [id]);

      res.json({
        success: true,
        config: updatedResult.rows[0]
      });
    } catch (error) {
      logger.error('Update auto-reply config error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Delete auto-reply config
  async deleteAutoReplyConfig(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const result = await db.query(`
        DELETE FROM auto_reply_configs 
        WHERE id = $1 AND user_id = $2
        RETURNING *
      `, [id, userId]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Auto-reply config not found'
        });
      }

      res.json({
        success: true,
        message: 'Auto-reply config deleted successfully'
      });
    } catch (error) {
      logger.error('Delete auto-reply config error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Test auto-reply config
  async testAutoReplyConfig(req, res) {
    try {
      const { id } = req.params;
      const { message, phone_number } = req.body;

      if (!message || !phone_number) {
        return res.status(400).json({
          success: false,
          error: 'Message and phone number are required'
        });
      }

      // Find phone number record
      const phoneResult = await db.query(`
        SELECT id FROM phone_numbers 
        WHERE phone_number = $1
      `, [phone_number]);

      if (phoneResult.rows.length === 0) {
        return res.json({
          success: true,
          triggered: false,
          message: 'Phone number not found in system'
        });
      }

      const phoneId = phoneResult.rows[0].id;

      // Get config
      const configResult = await db.query(`
        SELECT * FROM auto_reply_configs 
        WHERE id = $1 AND is_active = true
      `, [id]);

      if (configResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Auto-reply config not found or inactive'
        });
      }

      const config = configResult.rows[0];

      // Check if this phone number is allowed for this config
      if (config.phone_numbers && config.phone_numbers.length > 0) {
        if (!config.phone_numbers.includes(phoneId)) {
          return res.json({
            success: true,
            triggered: false,
            message: 'Phone number not configured for this auto-reply'
          });
        }
      }

      // Check if message matches trigger keywords
      const messageLower = message.toLowerCase();
      const keywordsMatch = config.trigger_keywords.some(keyword => 
        messageLower.includes(keyword.toLowerCase())
      );

      if (!keywordsMatch) {
        return res.json({
          success: true,
          triggered: false,
          message: 'Message does not match trigger keywords'
        });
      }

      // Get menus
      const menusResult = await db.query(`
        SELECT * FROM auto_reply_menus 
        WHERE config_id = $1 AND is_active = true 
        ORDER BY order_index ASC, menu_key ASC
      `, [id]);

      res.json({
        success: true,
        triggered: true,
        response: config.welcome_message,
        menus: menusResult.rows,
        config: {
          name: config.name,
          trigger_keywords: config.trigger_keywords
        }
      });
    } catch (error) {
      logger.error('Test auto-reply config error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Get auto-reply analytics
  async getAutoReplyAnalytics(req, res) {
    try {
      const userId = req.user.id;
      const { period = '7d' } = req.query;

      // Calculate date range
      const days = period === '1d' ? 1 : period === '7d' ? 7 : period === '30d' ? 30 : 7;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get basic analytics
      const analyticsResult = await db.query(`
        SELECT 
          COUNT(*) as total_messages,
          AVG(response_time) as avg_response_time,
          COUNT(DISTINCT phone_number) as unique_users,
          COUNT(CASE WHEN created_at >= $1 THEN 1 END) as recent_messages
        FROM auto_reply_logs 
        WHERE created_at >= $1
      `, [startDate]);

      // Get popular menus
      const popularMenusResult = await db.query(`
        SELECT 
          menu_path,
          COUNT(*) as usage_count
        FROM auto_reply_logs 
        WHERE created_at >= $1 AND menu_path IS NOT NULL
        GROUP BY menu_path
        ORDER BY usage_count DESC
        LIMIT 10
      `, [startDate]);

      // Get daily message count
      const dailyMessagesResult = await db.query(`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as message_count
        FROM auto_reply_logs 
        WHERE created_at >= $1
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `, [startDate]);

      res.json({
        success: true,
        analytics: {
          ...analyticsResult.rows[0],
          popular_menus: popularMenusResult.rows,
          daily_messages: dailyMessagesResult.rows
        }
      });
    } catch (error) {
      logger.error('Get auto-reply analytics error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new AutoReplyController();
