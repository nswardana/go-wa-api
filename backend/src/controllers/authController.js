const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { redis } = require('../config/database');
const logger = require('../utils/logger');
const { validationResult } = require('express-validator');

class AuthController {
  // Generate JWT token
  generateToken(user) {
    return jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        email: user.email 
      },
      user.jwt_secret,
      { 
        expiresIn: process.env.JWT_EXPIRES_IN || '24h',
        issuer: 'evolution-api',
        audience: 'evolution-client'
      }
    );
  }

  // Register new user
  async register(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { username, email, password } = req.body;

      // Check if user already exists
      const existingUser = await Promise.any([
        User.findByEmail(email),
        User.findByUsername(username)
      ]).catch(() => null);

      if (existingUser) {
        return res.status(409).json({
          error: 'User already exists',
          field: existingUser.email === email ? 'email' : 'username'
        });
      }

      // Create new user
      const user = await User.create({
        username,
        email,
        password
      });

      // Generate token
      const token = this.generateToken(user);

      // Cache user session
      await redis.setJSON(`session:${user.id}`, {
        id: user.id,
        username: user.username,
        email: user.email,
        apiKey: user.api_key
      }, 86400); // 24 hours

      logger.info(`User registered: ${username} (${email})`);

      res.status(201).json({
        message: 'User registered successfully',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          apiKey: user.api_key,
          createdAt: user.created_at
        },
        token
      });

    } catch (error) {
      logger.error('Registration error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to register user'
      });
    }
  }

  // Login user
  async login(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { email, password } = req.body;

      // Find user by email
      const user = await User.findByEmail(email);
      if (!user) {
        logger.warn('Login attempt with non-existent email', { email });
        return res.status(401).json({
          error: 'Invalid credentials'
        });
      }

      logger.info('User found for login', { userId: user.id, username: user.username });

      // Validate password
      const isValidPassword = await User.validatePassword(password, user.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({
          error: 'Invalid credentials'
        });
      }

      // Generate token
      const token = jwt.sign(
        { 
          id: user.id, 
          username: user.username, 
          email: user.email 
        },
        user.jwt_secret,
        { 
          expiresIn: process.env.JWT_EXPIRES_IN || '24h',
          issuer: 'evolution-api',
          audience: 'evolution-client'
        }
      );

      // Cache user session
      await redis.setJSON(`session:${user.id}`, {
        id: user.id,
        username: user.username,
        email: user.email,
        apiKey: user.api_key
      }, 86400); // 24 hours

      logger.info(`User logged in: ${user.username} (${user.email})`);

      res.json({
        message: 'Login successful',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          apiKey: user.api_key
        },
        token
      });

    } catch (error) {
      logger.error('Login error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to login'
      });
    }
  }

  // API Key authentication
  async authenticateWithApiKey(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { apiKey } = req.body;

      // Find user by API key
      const user = await User.findByApiKey(apiKey);
      if (!user) {
        return res.status(401).json({
          error: 'Invalid API key'
        });
      }

      // Generate token
      const token = this.generateToken(user);

      // Cache user session
      await redis.setJSON(`session:${user.id}`, {
        id: user.id,
        username: user.username,
        email: user.email,
        apiKey: user.api_key
      }, 86400); // 24 hours

      logger.info(`API key authentication successful: ${user.username}`);

      res.json({
        message: 'Authentication successful',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          apiKey: user.api_key
        },
        token
      });

    } catch (error) {
      logger.error('API key authentication error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to authenticate'
      });
    }
  }

  // Refresh token
  async refreshToken(req, res) {
    try {
      const user = req.user;

      // Generate new token
      const token = this.generateToken(user);

      // Update cached session
      await redis.setJSON(`session:${user.id}`, {
        id: user.id,
        username: user.username,
        email: user.email,
        apiKey: user.api_key
      }, 86400); // 24 hours

      res.json({
        message: 'Token refreshed successfully',
        token
      });

    } catch (error) {
      logger.error('Token refresh error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to refresh token'
      });
    }
  }

  // Logout user
  async logout(req, res) {
    try {
      const user = req.user;

      // Remove cached session
      await redis.del(`session:${user.id}`);

      logger.info(`User logged out: ${user.username}`);

      res.json({
        message: 'Logout successful'
      });

    } catch (error) {
      logger.error('Logout error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to logout'
      });
    }
  }

  // Get current user info
  async me(req, res) {
    try {
      const user = req.user;

      // Get user stats
      const stats = await User.getStats(user.id);

      res.json({
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
      logger.error('Get user info error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to get user info'
      });
    }
  }

  // Change password
  async changePassword(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const user = req.user;
      const { currentPassword, newPassword } = req.body;

      // Get user with password hash
      const userWithPassword = await User.findByEmail(user.email);
      if (!userWithPassword) {
        return res.status(404).json({
          error: 'User not found'
        });
      }

      // Validate current password
      const isValidPassword = await User.validatePassword(
        currentPassword, 
        userWithPassword.password_hash
      );
      if (!isValidPassword) {
        return res.status(401).json({
          error: 'Current password is incorrect'
        });
      }

      // Update password
      await User.updatePassword(user.id, newPassword);

      // Invalidate all sessions except current
      // This forces re-login on other devices
      await redis.del(`session:${user.id}`);

      logger.info(`Password changed for user: ${user.username}`);

      res.json({
        message: 'Password changed successfully'
      });

    } catch (error) {
      logger.error('Change password error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to change password'
      });
    }
  }

  // Regenerate API key
  async regenerateApiKey(req, res) {
    try {
      const user = req.user;

      // Generate new API key
      const updatedUser = await User.regenerateApiKey(user.id);

      // Update cached session
      await redis.setJSON(`session:${user.id}`, {
        id: user.id,
        username: user.username,
        email: user.email,
        apiKey: updatedUser.api_key
      }, 86400); // 24 hours

      logger.info(`API key regenerated for user: ${user.username}`);

      res.json({
        message: 'API key regenerated successfully',
        apiKey: updatedUser.api_key
      });

    } catch (error) {
      logger.error('Regenerate API key error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to regenerate API key'
      });
    }
  }
}

module.exports = new AuthController();
