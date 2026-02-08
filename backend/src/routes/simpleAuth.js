const express = require('express');
const { body } = require('express-validator');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { db } = require('../config/database');
const logger = require('../utils/logger');
const { validationResult } = require('express-validator');

const router = express.Router();

// Simple login without Redis
router.post('/login', [
  body('email').custom(value => {
    const trimmedEmail = value.trim();
    if (!trimmedEmail) {
      throw new Error('Email is required');
    }
    // Basic email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      throw new Error('Valid email is required');
    }
    return true;
  }),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { email, password } = req.body;

    // Trim whitespace from email
    const trimmedEmail = email.trim();

    // Find user by email
    const user = await User.findByEmail(trimmedEmail);
    if (!user) {
      return res.status(401).json({
        error: 'Invalid credentials'
      });
    }

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
      process.env.JWT_SECRET || 'fallback_secret',
      { 
        expiresIn: '24h',
        issuer: 'chatflow',
        audience: 'evolution-client'
      }
    );

    logger.info(`User logged in: ${user.username} (${user.email})`);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        apiKey: user.api_key
      }
    });

  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to login'
    });
  }
});

module.exports = router;
