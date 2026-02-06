const { db } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class PhoneNumber {
  static async create(phoneData) {
    const {
      userId,
      phoneNumber,
      deviceName,
      token = `token_${uuidv4().replace(/-/g, '')}`,
      webhookUrl,
      webhookSecret = uuidv4(),
      autoReply,
      autoMarkRead = false,
      autoDownloadMedia = true
    } = phoneData;

    const query = `
      INSERT INTO phone_numbers (
        user_id, phone_number, device_name, token, webhook_url, 
        webhook_secret, auto_reply, auto_mark_read, auto_download_media
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const values = [
      userId, phoneNumber, deviceName, token, webhookUrl,
      webhookSecret, autoReply, autoMarkRead, autoDownloadMedia
    ];

    return await db.getOne(query, values);
  }

  static async findById(id) {
    const query = `
      SELECT p.*, u.username, u.email
      FROM phone_numbers p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = $1 AND u.is_active = true
    `;
    return await db.getOne(query, [id]);
  }

  static async findByToken(token) {
    const query = `
      SELECT p.*, u.username, u.email
      FROM phone_numbers p
      JOIN users u ON p.user_id = u.id
      WHERE p.token = $1 AND u.is_active = true
    `;
    return await db.getOne(query, [token]);
  }

  static async findByUserId(userId, limit = 50, offset = 0) {
    const countQuery = 'SELECT COUNT(*) as count FROM phone_numbers WHERE user_id = $1';
    
    const query = `
      SELECT p.*, 
             (SELECT COUNT(*) FROM messages WHERE phone_number_id = p.id) as message_count
      FROM phone_numbers p
      WHERE p.user_id = $1
      ORDER BY p.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const [phones, countResult] = await Promise.all([
      db.getMany(query, [userId, limit, offset]),
      db.getOne(countQuery, [userId])
    ]);

    return {
      phones,
      total: parseInt(countResult.count),
      limit,
      offset
    };
  }

  static async findByPhoneNumber(userId, phoneNumber) {
    const query = `
      SELECT * FROM phone_numbers
      WHERE user_id = $1 AND phone_number = $2
    `;
    return await db.getOne(query, [userId, phoneNumber]);
  }

  static async update(id, phoneData) {
    const allowedFields = [
      'device_name', 'webhook_url', 'webhook_secret', 
      'auto_reply', 'auto_mark_read', 'auto_download_media'
    ];
    
    const updates = [];
    const values = [];
    let paramIndex = 1;

    Object.keys(phoneData).forEach(key => {
      if (allowedFields.includes(key)) {
        updates.push(`${key} = $${paramIndex}`);
        values.push(phoneData[key]);
        paramIndex++;
      }
    });

    if (updates.length === 0) {
      throw new Error('No valid fields to update');
    }

    const query = `
      UPDATE phone_numbers
      SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    values.push(id);
    return await db.getOne(query, values);
  }

  static async updateConnectionStatus(id, isConnected, sessionData = null, qrCode = null) {
    const query = `
      UPDATE phone_numbers
      SET is_connected = $1, 
          last_seen = CURRENT_TIMESTAMP,
          ${sessionData ? 'session_data = $2,' : ''}
          ${qrCode ? 'qr_code = $' + (sessionData ? '3' : '2') + ',' : ''}
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $${sessionData ? (qrCode ? '4' : '3') : (qrCode ? '3' : '2')}
      RETURNING *
    `;

    const values = [id];
    let paramIndex = 2;

    if (sessionData) {
      values.splice(1, 0, JSON.stringify(sessionData));
      paramIndex++;
    }

    if (qrCode) {
      values.splice(paramIndex - 1, 0, qrCode);
    }

    return await db.getOne(query, values);
  }

  static async regenerateToken(id) {
    const newToken = `token_${uuidv4().replace(/-/g, '')}`;

    const query = `
      UPDATE phone_numbers
      SET token = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;

    return await db.getOne(query, [newToken, id]);
  }

  static async delete(id) {
    const query = 'DELETE FROM phone_numbers WHERE id = $1 RETURNING *';
    return await db.getOne(query, [id]);
  }

  static async getConnectedPhones(userId = null) {
    let query = `
      SELECT p.*, u.username, u.email
      FROM phone_numbers p
      JOIN users u ON p.user_id = u.id
      WHERE p.is_connected = true AND u.is_active = true
    `;
    const values = [];

    if (userId) {
      query += ' AND p.user_id = $1';
      values.push(userId);
    }

    query += ' ORDER BY p.last_seen DESC';

    return await db.getMany(query, values);
  }

  static async getDisconnectedPhones(userId = null) {
    let query = `
      SELECT p.*, u.username, u.email
      FROM phone_numbers p
      JOIN users u ON p.user_id = u.id
      WHERE p.is_connected = false AND u.is_active = true
    `;
    const values = [];

    if (userId) {
      query += ' AND p.user_id = $1';
      values.push(userId);
    }

    query += ' ORDER BY p.updated_at DESC';

    return await db.getMany(query, values);
  }

  static async updateLastSeen(id) {
    const query = `
      UPDATE phone_numbers
      SET last_seen = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING last_seen
    `;

    const result = await db.getOne(query, [id]);
    return result ? result.last_seen : null;
  }

  static async getStats(userId = null) {
    let whereClause = 'WHERE u.is_active = true';
    const values = [];

    if (userId) {
      whereClause += ' AND p.user_id = $1';
      values.push(userId);
    }

    const queries = await Promise.all([
      db.getOne(`
        SELECT COUNT(*) as total FROM phone_numbers p 
        JOIN users u ON p.user_id = u.id 
        ${whereClause}
      `, values),
      db.getOne(`
        SELECT COUNT(*) as connected FROM phone_numbers p 
        JOIN users u ON p.user_id = u.id 
        ${whereClause} AND p.is_connected = true
      `, values),
      db.getOne(`
        SELECT COUNT(*) as with_webhook FROM phone_numbers p 
        JOIN users u ON p.user_id = u.id 
        ${whereClause} AND p.webhook_url IS NOT NULL
      `, values)
    ]);

    return {
      total: parseInt(queries[0].total),
      connected: parseInt(queries[1].connected),
      withWebhook: parseInt(queries[2].connected),
      disconnected: parseInt(queries[0].total) - parseInt(queries[1].connected)
    };
  }

  static async getPhoneWithMessages(phoneId, limit = 50, offset = 0) {
    const phoneQuery = `
      SELECT p.*, u.username, u.email
      FROM phone_numbers p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = $1 AND u.is_active = true
    `;

    const messagesQuery = `
      SELECT * FROM messages
      WHERE phone_number_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const countQuery = `
      SELECT COUNT(*) as count FROM messages WHERE phone_number_id = $1
    `;

    const [phone, messages, countResult] = await Promise.all([
      db.getOne(phoneQuery, [phoneId]),
      db.getMany(messagesQuery, [phoneId, limit, offset]),
      db.getOne(countQuery, [phoneId])
    ]);

    if (!phone) {
      return null;
    }

    return {
      phone,
      messages,
      total: parseInt(countResult.count),
      limit,
      offset
    };
  }
}

module.exports = PhoneNumber;
