const { v4: uuidv4 } = require('uuid');
const { db } = require('../config/database');
const logger = require('../utils/logger');

class SubscriptionController {
  // Get user subscription info
  async getUserSubscription(req, res) {
    try {
      const userId = req.user.id;
      
      const query = `
        SELECT u.*, s.plan_name, s.max_phone_numbers, s.max_messages_per_month, s.features
        FROM users u
        LEFT JOIN subscriptions s ON u.subscription_id = s.id
        WHERE u.id = $1
      `;
      
      const user = await db.getOne(query, [userId]);
      
      if (!user) {
        return res.status(404).json({
          error: 'User not found'
        });
      }

      // Get current phone count
      const phoneCountQuery = `
        SELECT COUNT(*) as phone_count
        FROM phone_numbers
        WHERE user_id = $1 AND is_active = true
      `;
      
      const phoneCount = await db.getOne(phoneCountQuery, [userId]);
      
      res.json({
        success: true,
        subscription: {
          plan_name: user.plan_name || 'Free',
          max_phone_numbers: user.max_phone_numbers || 1,
          max_messages_per_month: user.max_messages_per_month || 100,
          features: user.features || {},
          current_phone_numbers: parseInt(phoneCount.phone_count),
          available_slots: (user.max_phone_numbers || 1) - parseInt(phoneCount.phone_count)
        }
      });
      
    } catch (error) {
      logger.error('Get user subscription error:', error);
      res.status(500).json({
        error: 'Internal server error'
      });
    }
  }

  // Check if user can add more phone numbers
  async canAddPhone(req, res) {
    try {
      const userId = req.user.id;
      
      const query = `
        SELECT s.max_phone_numbers
        FROM users u
        LEFT JOIN subscriptions s ON u.subscription_id = s.id
        WHERE u.id = $1
      `;
      
      const user = await db.getOne(query, [userId]);
      const maxPhones = user?.max_phone_numbers || 1;
      
      const phoneCountQuery = `
        SELECT COUNT(*) as phone_count
        FROM phone_numbers
        WHERE user_id = $1 AND is_active = true
      `;
      
      const phoneCount = await db.getOne(phoneCountQuery, [userId]);
      const currentPhones = parseInt(phoneCount.phone_count);
      
      res.json({
        success: true,
        can_add: currentPhones < maxPhones,
        current_count: currentPhones,
        max_allowed: maxPhones,
        remaining_slots: maxPhones - currentPhones
      });
      
    } catch (error) {
      logger.error('Check can add phone error:', error);
      res.status(500).json({
        error: 'Internal server error'
      });
    }
  }

  // Get available plans
  async getAvailablePlans(req, res) {
    try {
      const query = `
        SELECT id, plan_name, max_phone_numbers, max_messages_per_month, 
               price_monthly, features, description
        FROM subscriptions
        WHERE is_active = true
        ORDER BY price_monthly ASC
      `;
      
      const plans = await db.getAll(query);
      
      res.json({
        success: true,
        plans
      });
      
    } catch (error) {
      logger.error('Get available plans error:', error);
      res.status(500).json({
        error: 'Internal server error'
      });
    }
  }

  // Upgrade subscription
  async upgradeSubscription(req, res) {
    try {
      const userId = req.user.id;
      const { plan_id } = req.body;
      
      if (!plan_id) {
        return res.status(400).json({
          error: 'Plan ID is required'
        });
      }
      
      // Get plan details
      const planQuery = `
        SELECT * FROM subscriptions WHERE id = $1 AND is_active = true
      `;
      
      const plan = await db.getOne(planQuery, [plan_id]);
      
      if (!plan) {
        return res.status(404).json({
          error: 'Plan not found'
        });
      }
      
      // Update user subscription
      const updateQuery = `
        UPDATE users 
        SET subscription_id = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `;
      
      await db.query(updateQuery, [plan_id, userId]);
      
      logger.info(`User ${userId} upgraded to plan ${plan.plan_name}`);
      
      res.json({
        success: true,
        message: 'Subscription upgraded successfully',
        plan: {
          plan_name: plan.plan_name,
          max_phone_numbers: plan.max_phone_numbers,
          max_messages_per_month: plan.max_messages_per_month,
          features: plan.features
        }
      });
      
    } catch (error) {
      logger.error('Upgrade subscription error:', error);
      res.status(500).json({
        error: 'Internal server error'
      });
    }
  }
}

module.exports = new SubscriptionController();
