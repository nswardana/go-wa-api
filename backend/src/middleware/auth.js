const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { redis } = require('../config/database');
const logger = require('../utils/logger');

const authMiddleware = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'No token provided or invalid format'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Check if token is blacklisted
    const isBlacklisted = await redis.exists(`blacklist:${token}`);
    if (isBlacklisted) {
      return res.status(401).json({
        error: 'Token has been revoked',
        message: 'Please login again'
      });
    }

    // Verify token structure
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.id) {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'Token structure is invalid'
      });
    }

    // Get user from cache or database
    let user = await redis.getJSON(`session:${decoded.id}`);
    
    if (!user) {
      // If not in cache, get from database
      user = await User.findById(decoded.id);
      if (!user) {
        return res.status(401).json({
          error: 'User not found',
          message: 'Invalid token'
        });
      }

      // Cache user session
      await redis.setJSON(`session:${user.id}`, {
        id: user.id,
        username: user.username,
        email: user.email,
        apiKey: user.api_key
      }, 86400); // 24 hours
    }

    // Verify token with user's JWT secret
    try {
      jwt.verify(token, user.jwt_secret || process.env.JWT_SECRET);
    } catch (jwtError) {
      // Remove invalid session from cache
      await redis.del(`session:${user.id}`);
      
      return res.status(401).json({
        error: 'Invalid token',
        message: jwtError.message === 'jwt expired' ? 'Token has expired' : 'Token is invalid'
      });
    }

    // Add user to request object
    req.user = user;
    req.token = token;

    // Update last activity
    await redis.set(`last_activity:${user.id}`, Date.now(), 86400);

    next();

  } catch (error) {
    logger.error('Auth middleware error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Authentication failed'
    });
  }
};

// API Key authentication middleware (alternative to JWT)
const apiKeyAuth = async (req, res, next) => {
  try {
    // Get API key from header or query parameter
    const apiKey = req.header('X-API-Key') || req.query.apiKey;

    if (!apiKey) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'API key required'
      });
    }

    // Get user from cache or database
    let user = await redis.getJSON(`api_key:${apiKey}`);
    
    if (!user) {
      // If not in cache, get from database
      user = await User.findByApiKey(apiKey);
      if (!user || !user.is_active) {
        return res.status(401).json({
          error: 'Invalid API key',
          message: 'API key is not valid or has been deactivated'
        });
      }

      // Cache API key mapping
      await redis.setJSON(`api_key:${apiKey}`, {
        id: user.id,
        username: user.username,
        email: user.email,
        apiKey: user.api_key
      }, 3600); // 1 hour
    }

    // Add user to request object
    req.user = user;
    req.apiKey = apiKey;

    // Update last activity
    await redis.set(`last_activity:${user.id}`, Date.now(), 86400);

    next();

  } catch (error) {
    logger.error('API Key auth middleware error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Authentication failed'
    });
  }
};

// Optional authentication (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // No token, continue without user
    }

    const token = authHeader.substring(7);

    // Check if token is blacklisted
    const isBlacklisted = await redis.exists(`blacklist:${token}`);
    if (isBlacklisted) {
      return next(); // Blacklisted token, continue without user
    }

    const decoded = jwt.decode(token);
    if (!decoded || !decoded.id) {
      return next(); // Invalid token, continue without user
    }

    let user = await redis.getJSON(`session:${decoded.id}`);
    
    if (!user) {
      user = await User.findById(decoded.id);
      if (!user) {
        return next(); // User not found, continue without user
      }

      await redis.setJSON(`session:${user.id}`, {
        id: user.id,
        username: user.username,
        email: user.email,
        apiKey: user.api_key
      }, 86400);
    }

    try {
      jwt.verify(token, user.jwt_secret || process.env.JWT_SECRET);
      req.user = user;
      req.token = token;
      await redis.set(`last_activity:${user.id}`, Date.now(), 86400);
    } catch (jwtError) {
      // Token invalid, continue without user
      await redis.del(`session:${user.id}`);
    }

    next();

  } catch (error) {
    logger.error('Optional auth middleware error:', error);
    next(); // Continue without user on error
  }
};

// Admin authentication middleware
const adminAuth = async (req, res, next) => {
  try {
    // First run regular auth
    await authMiddleware(req, res, () => {});

    // Check if user is admin (you might want to add an is_admin field to users table)
    const adminEmails = ['admin@beeasy.id']; // Configure admin emails
    if (!adminEmails.includes(req.user.email)) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Admin privileges required'
      });
    }

    next();

  } catch (error) {
    logger.error('Admin auth middleware error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Authentication failed'
    });
  }
};

// Phone number ownership middleware
const phoneOwnership = async (req, res, next) => {
  try {
    const phoneId = req.params.phoneId || req.params.id;
    
    if (!phoneId) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Phone ID required'
      });
    }

    const PhoneNumber = require('../models/PhoneNumber');
    const phone = await PhoneNumber.findById(phoneId);

    if (!phone) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Phone number not found'
      });
    }

    if (phone.user_id !== req.user.id) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You do not have permission to access this phone number'
      });
    }

    req.phone = phone;
    next();

  } catch (error) {
    logger.error('Phone ownership middleware error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Authorization failed'
    });
  }
};

module.exports = {
  auth: authMiddleware,
  apiKey: apiKeyAuth,
  optional: optionalAuth,
  admin: adminAuth,
  phoneOwnership
};
