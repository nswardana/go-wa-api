const { db } = require('../config/database');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

class User {
  static async create(userData) {
    const {
      username,
      email,
      password,
      apiKey = `ev_${uuidv4().replace(/-/g, '')}`,
      jwtSecret = uuidv4()
    } = userData;

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const query = `
      INSERT INTO users (username, email, password_hash, api_key, jwt_secret)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, username, email, api_key, jwt_secret, is_active, created_at
    `;

    const values = [username, email, passwordHash, apiKey, jwtSecret];
    const result = await db.query(query, values);
    return result.rows[0];
  }

  static async findById(id) {
    const query = `
      SELECT id, username, email, api_key, jwt_secret, is_active, created_at, updated_at
      FROM users
      WHERE id = $1 AND is_active = true
    `;
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  static async findByEmail(email) {
    const query = `
      SELECT id, username, email, password_hash, api_key, jwt_secret, is_active, created_at, updated_at
      FROM users
      WHERE email = $1 AND is_active = true
    `;
    const result = await db.query(query, [email]);
    return result.rows[0];
  }

  static async findByApiKey(apiKey) {
    const query = `
      SELECT id, username, email, api_key, jwt_secret, is_active, created_at, updated_at
      FROM users
      WHERE api_key = $1 AND is_active = true
    `;
    const result = await db.query(query, [apiKey]);
    return result.rows[0];
  }

  static async findByUsername(username) {
    const query = `
      SELECT id, username, email, password_hash, api_key, jwt_secret, is_active, created_at, updated_at
      FROM users
      WHERE username = $1 AND is_active = true
    `;
    const result = await db.query(query, [username]);
    return result.rows[0];
  }

  static async update(id, userData) {
    const allowedFields = ['username', 'email'];
    const updates = [];
    const values = [];
    let paramIndex = 1;

    Object.keys(userData).forEach(key => {
      if (allowedFields.includes(key)) {
        updates.push(`${key} = $${paramIndex}`);
        values.push(userData[key]);
        paramIndex++;
      }
    });

    if (updates.length === 0) {
      throw new Error('No valid fields to update');
    }

    const query = `
      UPDATE users
      SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramIndex} AND is_active = true
      RETURNING id, username, email, api_key, jwt_secret, is_active, created_at, updated_at
    `;

    values.push(id);
    const result = await db.query(query, values);
    return result.rows[0];
  }

  static async updatePassword(id, newPassword) {
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    const query = `
      UPDATE users
      SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND is_active = true
      RETURNING id, username, email, api_key, jwt_secret, is_active, created_at, updated_at
    `;

    const result = await db.query(query, [passwordHash, id]);
    return result.rows[0];
  }

  static async regenerateApiKey(id) {
    const newApiKey = `ev_${uuidv4().replace(/-/g, '')}`;

    const query = `
      UPDATE users
      SET api_key = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND is_active = true
      RETURNING id, username, email, api_key, jwt_secret, is_active, created_at, updated_at
    `;

    const result = await db.query(query, [newApiKey, id]);
    return result.rows[0];
  }

  static async regenerateJwtSecret(id) {
    const newJwtSecret = uuidv4();

    const query = `
      UPDATE users
      SET jwt_secret = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND is_active = true
      RETURNING id, username, email, api_key, jwt_secret, is_active, created_at, updated_at
    `;

    const result = await db.query(query, [newJwtSecret, id]);
    return result.rows[0];
  }

  static async deactivate(id) {
    const query = `
      UPDATE users
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id, username, email, api_key, is_active, created_at, updated_at
    `;

    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  static async activate(id) {
    const query = `
      UPDATE users
      SET is_active = true, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id, username, email, api_key, is_active, created_at, updated_at
    `;

    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  static async validatePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  static async getAll(limit = 50, offset = 0, search = '') {
    let query = `
      SELECT id, username, email, api_key, is_active, created_at, updated_at
      FROM users
      WHERE is_active = true
    `;
    let countQuery = 'SELECT COUNT(*) as count FROM users WHERE is_active = true';
    const values = [];
    const countValues = [];

    if (search) {
      query += ' AND (username ILIKE $1 OR email ILIKE $1)';
      countQuery += ' AND (username ILIKE $1 OR email ILIKE $1)';
      values.push(`%${search}%`);
      countValues.push(`%${search}%`);
    }

    query += ' ORDER BY created_at DESC LIMIT $' + (values.length + 1) + ' OFFSET $' + (values.length + 2);
    values.push(limit, offset);

    const [users, countResult] = await Promise.all([
      db.query(query, values),
      db.query(countQuery, countValues)
    ]);

    return {
      users: users.rows,
      total: parseInt(countResult.rows[0].total),
      limit,
      offset
    };
  }

  static async getStats(id) {
    const queries = await Promise.all([
      db.query('SELECT COUNT(*) as phone_count FROM phone_numbers WHERE user_id = $1', [id]),
      db.query('SELECT COUNT(*) as message_count FROM messages m JOIN phone_numbers p ON m.phone_number_id = p.id WHERE p.user_id = $1', [id]),
      db.query('SELECT COUNT(*) as connected_phones FROM phone_numbers WHERE user_id = $1 AND is_connected = true', [id])
    ]);

    return {
      phoneCount: parseInt(queries[0].rows[0].phone_count),
      messageCount: parseInt(queries[1].rows[0].message_count),
      connectedPhones: parseInt(queries[2].rows[0].connected_phones)
    };
  }
}

module.exports = User;
