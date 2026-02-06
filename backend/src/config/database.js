const { Pool } = require('pg');
const Redis = require('redis');
const logger = require('../utils/logger');

// PostgreSQL configuration
const pool = new Pool({
  host: 'postgres', // Use Docker container name
  port: 5432,
  database: process.env.DB_NAME || 'evolution_api',
  user: process.env.DB_USER || 'evolution_user',
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
    host: 'redis', // Use Docker container name
    port: 6379,
    family: 4 // Force IPv4
  },
  password: process.env.REDIS_PASSWORD || undefined,
  retry_delay_on_failover: 100,
  enable_offline_queue: false,
});

redisClient.on('connect', () => {
  logger.info('Connected to Redis server');
});

redisClient.on('error', (err) => {
  logger.error('Redis connection error:', err);
});

redisClient.on('ready', () => {
  logger.info('Redis client ready');
});

// Initialize Redis connection
try {
  redisClient.connect().catch(err => {
    logger.error('Failed to connect to Redis:', err);
  });
} catch (error) {
  logger.error('Redis initialization error:', error);
}

// Database helper functions
const db = {
  // Query function
  query: async (text, params) => {
    const start = Date.now();
    try {
      const result = await pool.query(text, params);
      const duration = Date.now() - start;
      logger.debug('Executed query', { text, duration, rows: result.rowCount });
      return result;
    } catch (error) {
      logger.error('Database query error:', { text, error: error.message });
      throw error;
    }
  },

  // Transaction function
  transaction: async (callback) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  // Get single row
  getOne: async (text, params) => {
    const result = await db.query(text, params);
    return result.rows[0] || null;
  },

  // Get multiple rows
  getMany: async (text, params) => {
    const result = await db.query(text, params);
    return result.rows;
  },

  // Insert and return
  insert: async (table, data) => {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map((_, index) => `$${index + 1}`).join(', ');
    
    const text = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders}) RETURNING *`;
    return await db.getOne(text, values);
  },

  // Update and return
  update: async (table, id, data) => {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const setClause = keys.map((key, index) => `${key} = $${index + 2}`).join(', ');
    
    const text = `UPDATE ${table} SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`;
    return await db.getOne(text, [id, ...values]);
  },

  // Delete and return
  delete: async (table, id) => {
    const text = `DELETE FROM ${table} WHERE id = $1 RETURNING *`;
    return await db.getOne(text, [id]);
  },

  // Check if exists
  exists: async (table, condition, params) => {
    const text = `SELECT 1 FROM ${table} WHERE ${condition} LIMIT 1`;
    const result = await db.query(text, params);
    return result.rows.length > 0;
  },

  // Count rows
  count: async (table, condition = '1=1', params = []) => {
    const text = `SELECT COUNT(*) as count FROM ${table} WHERE ${condition}`;
    const result = await db.getOne(text, params);
    return parseInt(result.count);
  }
};

// Redis helper functions
const redis = {
  // Get value
  get: async (key) => {
    try {
      return await redisClient.get(key);
    } catch (error) {
      logger.error('Redis GET error:', error);
      return null;
    }
  },

  // Set value
  set: async (key, value, ttl = 3600) => {
    try {
      if (ttl) {
        await redisClient.setEx(key, ttl, value);
      } else {
        await redisClient.set(key, value);
      }
      return true;
    } catch (error) {
      logger.error('Redis SET error:', error);
      return false;
    }
  },

  // Delete value
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
      return await redisClient.exists(key);
    } catch (error) {
      logger.error('Redis EXISTS error:', error);
      return false;
    }
  },

  // Set JSON value
  setJSON: async (key, value, ttl = 3600) => {
    return await redis.set(key, JSON.stringify(value), ttl);
  },

  // Get JSON value
  getJSON: async (key) => {
    const value = await redis.get(key);
    try {
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Redis JSON parse error:', error);
      return null;
    }
  },

  // Increment counter
  incr: async (key) => {
    try {
      return await redisClient.incr(key);
    } catch (error) {
      logger.error('Redis INCR error:', error);
      return 0;
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

  // Get all set members
  smembers: async (key) => {
    try {
      return await redisClient.sMembers(key);
    } catch (error) {
      logger.error('Redis SMEMBERS error:', error);
      return [];
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
