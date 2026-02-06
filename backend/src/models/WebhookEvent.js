const { db } = require('../config/database');
const crypto = require('crypto');

class WebhookEvent {
  static async create(eventData) {
    const {
      phoneNumberId,
      eventType,
      payload,
      retryCount = 0,
      status = 'pending'
    } = eventData;

    const query = `
      INSERT INTO webhook_events (phone_number_id, event_type, payload, retry_count, status)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const values = [phoneNumberId, eventType, JSON.stringify(payload), retryCount, status];
    return await db.getOne(query, values);
  }

  static async findById(id) {
    const query = `
      SELECT we.*, p.phone_number, p.webhook_url, p.webhook_secret, u.username, u.email
      FROM webhook_events we
      JOIN phone_numbers p ON we.phone_number_id = p.id
      JOIN users u ON p.user_id = u.id
      WHERE we.id = $1
    `;
    return await db.getOne(query, [id]);
  }

  static async findByPhoneNumberId(phoneNumberId, limit = 50, offset = 0) {
    const countQuery = 'SELECT COUNT(*) as count FROM webhook_events WHERE phone_number_id = $1';
    
    const query = `
      SELECT we.*, p.phone_number
      FROM webhook_events we
      JOIN phone_numbers p ON we.phone_number_id = p.id
      WHERE we.phone_number_id = $1
      ORDER BY we.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const [events, countResult] = await Promise.all([
      db.getMany(query, [phoneNumberId, limit, offset]),
      db.getOne(countQuery, [phoneNumberId])
    ]);

    return {
      events,
      total: parseInt(countResult.count),
      limit,
      offset
    };
  }

  static async findPending(limit = 100) {
    const query = `
      SELECT we.*, p.phone_number, p.webhook_url, p.webhook_secret, u.username, u.email
      FROM webhook_events we
      JOIN phone_numbers p ON we.phone_number_id = p.id
      JOIN users u ON p.user_id = u.id
      WHERE we.status = 'pending' AND we.retry_count < 5
      ORDER BY we.created_at ASC
      LIMIT $1
    `;
    return await db.getMany(query, [limit]);
  }

  static async updateStatus(id, status, sentAt = null) {
    const query = `
      UPDATE webhook_events
      SET status = $1, sent_at = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `;
    return await db.getOne(query, [status, sentAt, id]);
  }

  static async incrementRetry(id) {
    const query = `
      UPDATE webhook_events
      SET retry_count = retry_count + 1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    return await db.getOne(query, [id]);
  }

  static async markAsFailed(id) {
    const query = `
      UPDATE webhook_events
      SET status = 'failed', updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    return await db.getOne(query, [id]);
  }

  static async deleteOldEvents(daysOld = 30) {
    const query = `
      DELETE FROM webhook_events
      WHERE created_at < NOW() - INTERVAL '${daysOld} days'
      RETURNING id
    `;
    const result = await db.getMany(query);
    return result.length;
  }

  static async getStats(phoneNumberId = null, userId = null) {
    let whereClause = 'WHERE 1=1';
    const values = [];
    let paramIndex = 1;

    if (phoneNumberId) {
      whereClause += ` AND we.phone_number_id = $${paramIndex}`;
      values.push(phoneNumberId);
      paramIndex++;
    }

    if (userId) {
      whereClause += ` AND p.user_id = $${paramIndex}`;
      values.push(userId);
      paramIndex++;
    }

    const queries = await Promise.all([
      db.getOne(`
        SELECT COUNT(*) as total FROM webhook_events we
        JOIN phone_numbers p ON we.phone_number_id = p.id
        ${whereClause}
      `, values),
      db.getOne(`
        SELECT COUNT(*) as pending FROM webhook_events we
        JOIN phone_numbers p ON we.phone_number_id = p.id
        ${whereClause} AND we.status = 'pending'
      `, values),
      db.getOne(`
        SELECT COUNT(*) as sent FROM webhook_events we
        JOIN phone_numbers p ON we.phone_number_id = p.id
        ${whereClause} AND we.status = 'sent'
      `, values),
      db.getOne(`
        SELECT COUNT(*) as failed FROM webhook_events we
        JOIN phone_numbers p ON we.phone_number_id = p.id
        ${whereClause} AND we.status = 'failed'
      `, values)
    ]);

    return {
      total: parseInt(queries[0].total),
      pending: parseInt(queries[1].pending),
      sent: parseInt(queries[2].sent),
      failed: parseInt(queries[3].failed)
    };
  }

  static async getRecentEvents(phoneNumberId = null, limit = 10) {
    let whereClause = 'WHERE 1=1';
    const values = [];

    if (phoneNumberId) {
      whereClause += ' AND we.phone_number_id = $1';
      values.push(phoneNumberId);
    }

    const query = `
      SELECT we.*, p.phone_number, u.username
      FROM webhook_events we
      JOIN phone_numbers p ON we.phone_number_id = p.id
      JOIN users u ON p.user_id = u.id
      ${whereClause}
      ORDER BY we.created_at DESC
      LIMIT $${values.length + 1}
    `;
    values.push(limit);

    return await db.getMany(query, values);
  }

  // Generate webhook signature
  static generateSignature(payload, secret) {
    return crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');
  }

  // Verify webhook signature
  static verifySignature(payload, signature, secret) {
    const expectedSignature = this.generateSignature(payload, secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  }

  // Get events by type
  static async findByEventType(eventType, phoneNumberId = null, limit = 50, offset = 0) {
    let whereClause = 'WHERE we.event_type = $1';
    const values = [eventType];
    let paramIndex = 2;

    if (phoneNumberId) {
      whereClause += ` AND we.phone_number_id = $${paramIndex}`;
      values.push(phoneNumberId);
      paramIndex++;
    }

    const countQuery = `
      SELECT COUNT(*) as count FROM webhook_events we
      ${whereClause}
    `;

    const query = `
      SELECT we.*, p.phone_number, u.username
      FROM webhook_events we
      JOIN phone_numbers p ON we.phone_number_id = p.id
      JOIN users u ON p.user_id = u.id
      ${whereClause}
      ORDER BY we.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    values.push(limit, offset);

    const [events, countResult] = await Promise.all([
      db.getMany(query, values),
      db.getOne(countQuery, values.slice(0, -2))
    ]);

    return {
      events,
      total: parseInt(countResult.count),
      limit,
      offset
    };
  }

  // Retry failed events
  static async retryFailedEvents(phoneNumberId = null) {
    let whereClause = 'WHERE we.status = $1 AND we.retry_count < 5';
    const values = ['failed'];

    if (phoneNumberId) {
      whereClause += ' AND we.phone_number_id = $2';
      values.push(phoneNumberId);
    }

    const query = `
      UPDATE webhook_events
      SET status = 'pending', updated_at = CURRENT_TIMESTAMP
      ${whereClause}
      RETURNING *
    `;

    const events = await db.getMany(query, values);
    return events;
  }

  // Get webhook delivery rate
  static async getDeliveryRate(phoneNumberId = null, hours = 24) {
    let whereClause = `WHERE we.created_at >= NOW() - INTERVAL '${hours} hours'`;
    const values = [];

    if (phoneNumberId) {
      whereClause += ' AND we.phone_number_id = $1';
      values.push(phoneNumberId);
    }

    const query = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN we.status = 'sent' THEN 1 END) as delivered,
        COUNT(CASE WHEN we.status = 'failed' THEN 1 END) as failed,
        COUNT(CASE WHEN we.status = 'pending' THEN 1 END) as pending
      FROM webhook_events we
      ${whereClause}
    `;

    const result = await db.getOne(query, values);
    
    const total = parseInt(result.total);
    const delivered = parseInt(result.delivered);
    
    return {
      total,
      delivered,
      failed: parseInt(result.failed),
      pending: parseInt(result.pending),
      deliveryRate: total > 0 ? (delivered / total * 100).toFixed(2) : 0
    };
  }
}

module.exports = WebhookEvent;
