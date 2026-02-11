const { Pool } = require('pg');
const Redis = require('redis');
const logger = require('../utils/logger');

// PostgreSQL configuration
const isDevelopment = process.env.NODE_ENV === 'development';
const pool = new Pool({
  host: isDevelopment ? 'localhost' : (process.env.DB_HOST || 'chatflow-postgres'), // Development: localhost, Production: service name
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'chatflow_api',
  user: process.env.DB_USER || 'chatflow_user',
  password: process.env.DB_PASSWORD || 'Bismillah313!',
  max: 20, // maximum number of clients in the pool
  idleTimeoutMillis: 30000, // how long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: 2000, // how long to wait when connecting a new client
});

// Test database connection
pool.on('connect', () => {
  logger.info('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  logger.error('Database connection error:', err);
});

// Redis configuration
const redisClient = Redis.createClient({
  socket: {
    host: isDevelopment ? 'localhost' : (process.env.REDIS_HOST || 'chatflow-redis'), // Development: localhost, Production: service name
    port: process.env.REDIS_PORT || 6379,
    family: 4 // Force IPv4
  },
  database: 0
});

// Handle connection events
redisClient.on('connect', () => {
  logger.info('Connected to Redis');
});

redisClient.on('error', (err) => {
  logger.error('Redis connection error:', err);
});

redisClient.on('end', () => {
  logger.info('Redis connection ended');
});

// Graceful shutdown
const closeRedis = async () => {
  if (redisClient.isOpen) {
    await redisClient.quit();
  }
};

process.on('SIGINT', closeRedis);
process.on('SIGTERM', closeRedis);

// Connect to Redis
redisClient.connect().catch(err => {
  logger.error('Failed to connect to Redis:', err);
});

// Database helper functions
const db = {
  // Execute query
  query: async (text, params) => {
    const start = Date.now();
    try {
      const res = await pool.query(text, params);
      const duration = Date.now() - start;
      logger.debug('Executed query', { text, duration, rows: res.rowCount });
      return res;
    } catch (error) {
      logger.error('Database query error:', error);
      throw error;
    }
  },

  // Get single row
  getOne: async (text, params) => {
    try {
      const res = await pool.query(text, params);
      return res.rows[0] || null;
    } catch (error) {
      logger.error('Database getOne error:', error);
      throw error;
    }
  },

  // Get multiple rows
  getAll: async (text, params) => {
    try {
      const res = await pool.query(text, params);
      return res.rows;
    } catch (error) {
      logger.error('Database getAll error:', error);
      throw error;
    }
  },

  // Get multiple rows (alias for getAll)
  getMany: async (text, params) => {
    try {
      const res = await pool.query(text, params);
      return res.rows;
    } catch (error) {
      logger.error('Database getMany error:', error);
      throw error;
    }
  }
};

// Redis helper functions
const redis = {
  // Set value with expiration
  set: async (key, value, ttl = 3600) => {
    try {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      return await redisClient.setEx(key, ttl, stringValue);
    } catch (error) {
      logger.error('Redis SET error:', error);
      return false;
    }
  },

  // Set JSON value with expiration
  setJSON: async (key, value, ttl = 3600) => {
    try {
      const stringValue = JSON.stringify(value);
      return await redisClient.setEx(key, ttl, stringValue);
    } catch (error) {
      logger.error('Redis SET JSON error:', error);
      return false;
    }
  },

  // Get value
  get: async (key) => {
    try {
      const value = await redisClient.get(key);
      if (!value) return null;
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    } catch (error) {
      logger.error('Redis GET error:', error);
      return null;
    }
  },

  // Delete key
  del: async (key) => {
    try {
      return await redisClient.del(key);
    } catch (error) {
      logger.error('Redis DEL error:', error);
      return false;
    }
  },

  // Check if key exists
  exists: async (key) => {
    try {
      const result = await redisClient.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Redis EXISTS error:', error);
      return false;
    }
  },

  // Add to set
  sadd: async (key, member) => {
    try {
      return await redisClient.sAdd(key, member);
    } catch (error) {
      logger.error('Redis SADD error:', error);
      return false;
    }
  },

  // Remove from set
  srem: async (key, member) => {
    try {
      return await redisClient.sRem(key, member);
    } catch (error) {
      logger.error('Redis SREM error:', error);
      return false;
    }
  }
};

module.exports = {
  pool,
  redisClient,
  db,
  redis
};
