const { db } = require('../config/database');
const logger = require('../utils/logger');

class BroadcastController {
  // Get all broadcasts
  async getBroadcasts(req, res) {
    try {
      const userId = req.user.id;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 25;
      const offset = (page - 1) * limit;

      const broadcastsResult = await db.query(`
        SELECT b.*, 
               COUNT(br.id) as message_count,
               SUM(CASE WHEN br.status = 'sent' THEN 1 ELSE 0 END) as sent_count,
               SUM(CASE WHEN br.status = 'failed' THEN 1 ELSE 0 END) as failed_count
        FROM broadcasts b
        LEFT JOIN broadcast_recipients br ON b.id = br.broadcast_id
        WHERE b.user_id = $1
        GROUP BY b.id ORDER BY b.created_at DESC LIMIT $2 OFFSET $3
      `, [userId, limit, offset]);

      const totalResult = await db.query('SELECT COUNT(*) as total FROM broadcasts WHERE user_id = $1', [userId]);

      res.json({
        success: true,
        broadcasts: broadcastsResult.rows,
        total: parseInt(totalResult.rows[0].total),
        page,
        limit
      });
    } catch (error) {
      logger.error('Get broadcasts error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Get single broadcast
  async getBroadcast(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const result = await db.query(`
        SELECT b.*, 
               COUNT(br.id) as message_count,
               SUM(CASE WHEN br.status = 'sent' THEN 1 ELSE 0 END) as sent_count,
               SUM(CASE WHEN br.status = 'failed' THEN 1 ELSE 0 END) as failed_count
        FROM broadcasts b
        LEFT JOIN broadcast_recipients br ON b.id = br.broadcast_id
        WHERE b.id = $1 AND b.user_id = $2
        GROUP BY b.id
      `, [id, userId]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Broadcast not found'
        });
      }

      res.json({
        success: true,
        broadcast: result.rows[0]
      });
    } catch (error) {
      logger.error('Get broadcast error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Create broadcast
  async createBroadcast(req, res) {
    try {
      const userId = req.user.id;
      const { name, description, message, template_id, contact_filter, scheduled_at, recipient_count, sender_ids } = req.body;

      // Calculate actual recipient count based on contact filter
      let recipientsQuery = `
        SELECT COUNT(*) as count
        FROM contacts 
        WHERE user_id = $1
      `;
      let recipientsParams = [userId];

      if (contact_filter && contact_filter.categories) {
        const categories = contact_filter.categories;
        if (categories.length > 0) {
          recipientsQuery += ` AND categories && $${recipientsParams.length + 1}`;
          recipientsParams.push(categories); // This will be properly handled by PostgreSQL
        }
      }
      /*
      if (contact_filter && contact_filter.search) {
        recipientsQuery += ` AND (name ILIKE $${recipientsParams.length + 1} OR phone ILIKE $${recipientsParams.length + 1} OR email ILIKE $${recipientsParams.length + 1})`;
        recipientsParams.push(`%${contact_filter.search}%`);
      }
      */

      console.log("recipientsParams",recipientsParams);
      console.log("recipientsQuery",recipientsQuery);


      const countResult = await db.query(recipientsQuery, recipientsParams);
      const actualRecipientCount = countResult.rows[0].count;

      // Only use the fields that exist in database
      const result = await db.query(`
        INSERT INTO broadcasts (user_id, name, description, message, template_id, contact_filter, total_contacts)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [userId, name, description, message, template_id, contact_filter, actualRecipientCount]);

      res.status(201).json({
        success: true,
        broadcast: result.rows[0]
      });
    } catch (error) {
      logger.error('Create broadcast error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Update broadcast
  async updateBroadcast(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const { name, description, message, template_id, contact_filter, scheduled_at } = req.body;

      const result = await db.query(`
        UPDATE broadcasts 
        SET name = $1, description = $2, message = $3, template_id = $4, contact_filter = $5, scheduled_at = $6, updated_at = NOW()
        WHERE id = $7 AND user_id = $8
        RETURNING *
      `, [name, description, message, template_id, contact_filter, scheduled_at, id, userId]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Broadcast not found'
        });
      }

      res.json({
        success: true,
        broadcast: result.rows[0]
      });
    } catch (error) {
      logger.error('Update broadcast error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Delete broadcast
  async deleteBroadcast(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const result = await db.query(`
        DELETE FROM broadcasts WHERE id = $1 AND user_id = $2
      `, [id, userId]);

      if (result.rowCount === 0) {
        return res.status(404).json({
          success: false,
          error: 'Broadcast not found'
        });
      }

      res.json({
        success: true,
        message: 'Broadcast deleted successfully'
      });
    } catch (error) {
      logger.error('Delete broadcast error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Start broadcast
  async startBroadcast(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // Get broadcast details
      const broadcastResult = await db.query(`
        SELECT * FROM broadcasts WHERE id = $1 AND user_id = $2
      `, [id, userId]);

      if (broadcastResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Broadcast not found'
        });
      }

      const broadcastData = broadcastResult.rows[0];

      // Get recipients based on filter
      let recipientsQuery = `
        SELECT id, name, phone, email 
        FROM contacts 
        WHERE user_id = $1
      `;
      let recipientsParams = [userId];

      if (broadcastData.contact_filter && broadcastData.contact_filter.categories) {
        const categories = broadcastData.contact_filter.categories;
        if (categories.length > 0) {
          recipientsQuery += ` AND categories && $${recipientsParams.length + 1}`;
          recipientsParams.push(categories);
        }
      }

      if (broadcastData.contact_filter && broadcastData.contact_filter.search) {
        recipientsQuery += ` AND (name ILIKE $${recipientsParams.length + 1} OR phone ILIKE $${recipientsParams.length + 1} OR email ILIKE $${recipientsParams.length + 1})`;
        recipientsParams.push(`%${broadcastData.contact_filter.search}%`);
      }

      const recipientsResult = await db.query(recipientsQuery, recipientsParams);

      // Get sender phones
      const sendersResult = await db.query(`
        SELECT phone_number FROM phone_numbers 
        WHERE user_id = $1 AND is_connected = true
      `, [userId]);

      const senderPhones = sendersResult.rows.map(row => row.phone_number);

      if (senderPhones.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No active sender phones available'
        });
      }

      if (recipientsResult.rows.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No recipients found for this broadcast'
        });
      }

      // Update broadcast status
      await db.query(`
        UPDATE broadcasts 
        SET status = 'running', started_at = NOW(), updated_at = NOW(), total_contacts = $2
        WHERE id = $1
      `, [id, recipientsResult.rows.length]);

      // Add job to Bull Queue
      const { broadcastQueue } = require('../services/queueService');
      const job = await broadcastQueue.add('send-broadcast', {
        broadcastId: parseInt(id),
        recipients: recipientsResult.rows,
        message: broadcastData.message,
        senderPhones: senderPhones
      }, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000
        }
      });

      res.json({
        success: true,
        message: 'Broadcast started successfully',
        jobId: job.id,
        recipientCount: recipientsResult.rows.length
      });
    } catch (error) {
      logger.error('Start broadcast error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Pause broadcast
  async pauseBroadcast(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      await db.query(`
        UPDATE broadcasts 
        SET status = 'paused', updated_at = NOW()
        WHERE id = $1 AND user_id = $2
      `, [id, userId]);

      res.json({
        success: true,
        message: 'Broadcast paused successfully'
      });
    } catch (error) {
      logger.error('Pause broadcast error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Stop broadcast
  async stopBroadcast(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      await db.query(`
        UPDATE broadcasts 
        SET status = 'stopped', completed_at = NOW(), updated_at = NOW()
        WHERE id = $1 AND user_id = $2
      `, [id, userId]);

      res.json({
        success: true,
        message: 'Broadcast stopped successfully'
      });
    } catch (error) {
      logger.error('Stop broadcast error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Get broadcast progress
  async getBroadcastProgress(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const result = await db.query(`
        SELECT bp.*, 
               b.total_contacts,
               b.sent_count,
               b.failed_count,
               b.status
        FROM broadcast_progress bp
        JOIN broadcasts b ON bp.broadcast_id = b.id
        WHERE bp.broadcast_id = $1 AND b.user_id = $2
      `, [id, userId]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Broadcast progress not found'
        });
      }

      res.json({
        success: true,
        progress: result.rows[0]
      });
    } catch (error) {
      logger.error('Get broadcast progress error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Get broadcast messages
  async getBroadcastMessages(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 25;
      const offset = (page - 1) * limit;

      const messagesResult = await db.query(`
        SELECT bm.*, c.name as contact_name, c.phone as contact_phone
        FROM broadcast_messages bm
        JOIN contacts c ON bm.contact_id = c.id
        WHERE bm.broadcast_id = $1 AND bm.user_id = $2
        ORDER BY bm.created_at DESC LIMIT $3 OFFSET $4
      `, [id, userId, limit, offset]);

      const totalResult = await db.query(`
        SELECT COUNT(*) as total 
        FROM broadcast_messages 
        WHERE broadcast_id = $1 AND user_id = $2
      `, [id, userId]);

      res.json({
        success: true,
        messages: messagesResult.rows,
        total: parseInt(totalResult.rows[0].total),
        page,
        limit
      });
    } catch (error) {
      logger.error('Get broadcast messages error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Test broadcast
  async testBroadcast(req, res) {
    try {
      const { id } = req.params;
      const { phone, message } = req.body;
      const userId = req.user.id;

      // Get broadcast details
      const broadcastResult = await db.query(`
        SELECT * FROM broadcasts WHERE id = $1 AND user_id = $2
      `, [id, userId]);

      if (broadcastResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Broadcast not found'
        });
      }

      // Send test message (will be implemented with Evolution API)
      // const result = await evolutionService.sendMessage(phone, message);

      res.json({
        success: true,
        message: 'Test message sent successfully'
        // result: result
      });
    } catch (error) {
      logger.error('Test broadcast error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Get queue status
  async getQueueStatus(req, res) {
    try {
      const userId = req.user.id;
      
      // Get running broadcasts
      const runningBroadcasts = await db.query(`
        SELECT id, name, status, total_contacts, sent_count, failed_count, started_at
        FROM broadcasts 
        WHERE user_id = $1 AND status IN ('running', 'paused')
        ORDER BY started_at DESC
      `, [userId]);
      
      // Get recent completed broadcasts (last 24 hours)
      const recentBroadcasts = await db.query(`
        SELECT id, name, status, total_contacts, sent_count, failed_count, started_at, completed_at
        FROM broadcasts 
        WHERE user_id = $1 AND status IN ('completed', 'completed_with_errors')
        AND completed_at >= NOW() - INTERVAL '24 hours'
        ORDER BY completed_at DESC
        LIMIT 10
      `, [userId]);
      
      res.json({
        success: true,
        data: {
          running: runningBroadcasts.rows,
          recent: recentBroadcasts.rows,
          summary: {
            runningCount: runningBroadcasts.rows.length,
            recentCount: recentBroadcasts.rows.length
          }
        }
      });
    } catch (error) {
      logger.error('Get queue status error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Get broadcast recipients
  async getBroadcastRecipients(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // Get broadcast details first
      const broadcastResult = await db.query(`
        SELECT * FROM broadcasts WHERE id = $1 AND user_id = $2
      `, [id, userId]);

      if (broadcastResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Broadcast not found'
        });
      }

      const broadcastData = broadcastResult.rows[0];

      // Get recipients based on filter
      let recipientsQuery = `
        SELECT c.id, c.name, c.phone, c.email, c.categories, 
               'pending' as status, 
               NULL as sent_at, 
               NULL as message_id
        FROM contacts c
        WHERE c.user_id = $1
      `;
      let recipientsParams = [userId];

      if (broadcastData.contact_filter && broadcastData.contact_filter.categories) {
        const categories = broadcastData.contact_filter.categories;
        if (categories.length > 0) {
          // Use string contains approach for categories (more reliable)
          const categoryConditions = categories.map(cat => {
            return `c.categories::text LIKE '%${cat}%'`;
          }).join(' OR ');
          
          recipientsQuery += ` AND (${categoryConditions})`;
        }
      }

      if (broadcastData.contact_filter && broadcastData.contact_filter.search) {
        recipientsQuery += ` AND (c.name ILIKE $${recipientsParams.length + 1} OR c.phone ILIKE $${recipientsParams.length + 1} OR c.email ILIKE $${recipientsParams.length + 1})`;
        recipientsParams.push(`%${broadcastData.contact_filter.search}%`);
      }

      recipientsQuery += ` ORDER BY c.name`;

      const recipientsResult = await db.query(recipientsQuery, recipientsParams);

      // Calculate actual total contacts based on current filter
      let totalCountQuery = `
        SELECT COUNT(*) as count
        FROM contacts c
        WHERE c.user_id = $1
      `;
      let totalCountParams = [userId];

      if (broadcastData.contact_filter && broadcastData.contact_filter.categories) {
        const categories = broadcastData.contact_filter.categories;
        if (categories.length > 0) {
          totalCountQuery += ` AND c.categories && $${totalCountParams.length + 1}`;
          totalCountParams.push(categories);
        }
      }

      if (broadcastData.contact_filter && broadcastData.contact_filter.search) {
        totalCountQuery += ` AND (c.name ILIKE $${totalCountParams.length + 1} OR c.phone ILIKE $${totalCountParams.length + 1} OR c.email ILIKE $${totalCountParams.length + 1})`;
        totalCountParams.push(`%${broadcastData.contact_filter.search}%`);
      }

      const totalCountResult = await db.query(totalCountQuery, totalCountParams);
      const actualTotalContacts = parseInt(totalCountResult.rows[0].count);

      // Add personalized message and WhatsApp preview for each recipient
      const recipientsWithPreview = recipientsResult.rows.map(recipient => {
        // Personalize message with recipient name
        let personalizedMessage = broadcastData.message;
        if (broadcastData.message && broadcastData.message.includes('{name}')) {
          personalizedMessage = broadcastData.message.replace(/{name}/g, recipient.name);
        }

        // Create WhatsApp preview
        const whatsappPreview = {
          type: 'text',
          content: personalizedMessage,
          sender: broadcastData.name || 'Broadcast',
          timestamp: recipient.sent_at || new Date().toISOString(),
          status: recipient.status
        };

        return {
          ...recipient,
          broadcast_message: broadcastData.message,
          broadcast_name: broadcastData.name,
          personalized_message: personalizedMessage,
          whatsapp_preview: whatsappPreview
        };
      });

      res.json({
        success: true,
        broadcast: {
          id: broadcastData.id,
          name: broadcastData.name,
          total_contacts: recipientsResult.rows.length,
          sent_count: broadcastData.sent_count,
          failed_count: broadcastData.failed_count,
          status: broadcastData.status,
          message: broadcastData.message
        },
        recipients: recipientsWithPreview,
        total: recipientsWithPreview.length
      });
    } catch (error) {
      logger.error('Get broadcast recipients error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new BroadcastController();
