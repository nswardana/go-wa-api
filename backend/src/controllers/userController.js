const User = require('../models/User');
const logger = require('../utils/logger');
const { validationResult } = require('express-validator');

class UserController {
  // Get all users (admin only)
  async getAllUsers(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { limit = 50, offset = 0, search } = req.query;
      const result = await User.getAll(parseInt(limit), parseInt(offset), search);

      res.json({
        success: true,
        ...result
      });

    } catch (error) {
      logger.error('Get all users error', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to get users'
      });
    }
  }

  // Get user by ID
  async getUserById(req, res) {
    try {
      const { id } = req.params;
      
      // Users can only view their own profile unless they're admin
      if (req.user.id !== parseInt(id) && req.user.email !== 'admin@beeasy.id') {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You can only view your own profile'
        });
      }

      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({
          error: 'User not found',
          message: 'User does not exist'
        });
      }

      // Get user stats
      const stats = await User.getStats(user.id);

      res.json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          apiKey: user.api_key,
          isActive: user.is_active,
          createdAt: user.created_at,
          updatedAt: user.updated_at
        },
        stats
      });

    } catch (error) {
      logger.error('Get user by ID error', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to get user'
      });
    }
  }

  // Update user
  async updateUser(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { id } = req.params;
      const { username, email } = req.body;

      // Users can only update their own profile unless they're admin
      if (req.user.id !== parseInt(id) && req.user.email !== 'admin@beeasy.id') {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You can only update your own profile'
        });
      }

      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({
          error: 'User not found',
          message: 'User does not exist'
        });
      }

      const updatedUser = await User.update(id, { username, email });

      logger.info(`User updated: ${updatedUser.username} by ${req.user.username}`);

      res.json({
        success: true,
        message: 'User updated successfully',
        user: {
          id: updatedUser.id,
          username: updatedUser.username,
          email: updatedUser.email,
          apiKey: updatedUser.api_key,
          isActive: updatedUser.is_active,
          updatedAt: updatedUser.updated_at
        }
      });

    } catch (error) {
      logger.error('Update user error', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to update user'
      });
    }
  }

  // Delete user (admin only)
  async deleteUser(req, res) {
    try {
      const { id } = req.params;

      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({
          error: 'User not found',
          message: 'User does not exist'
        });
      }

      // Prevent admin from deleting themselves
      if (user.email === 'admin@beeasy.id') {
        return res.status(400).json({
          error: 'Cannot delete admin',
          message: 'Admin user cannot be deleted'
        });
      }

      await User.deactivate(id);

      logger.info(`User deactivated: ${user.username} by ${req.user.username}`);

      res.json({
        success: true,
        message: 'User deactivated successfully'
      });

    } catch (error) {
      logger.error('Delete user error', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to delete user'
      });
    }
  }
}

module.exports = new UserController();
