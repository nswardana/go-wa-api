const { db } = require('../config/database');
const logger = require('../utils/logger');
const { io } = require('../app');
const gowaMessageService = require('../services/gowaMessageService');

// Handle GOWA message
const handleGOWAMessage = async (deviceId, payload) => {
  console.log('=== GOWA WEBHOOK DEBUG START ===');
  console.log('handleGOWAMessage called with:', deviceId, payload);
  logger.info('handleGOWAMessage called with:', { deviceId, payload });
  
  const {
    id: messageId,
    from,
    fromMe,
    isGroup,
    timestamp,
    pushName,
    message,
    media,
    body
  } = payload;

  console.log('Extracted data:', { messageId, from, fromMe, isGroup, timestamp, pushName, message, media, body });

  // Skip pesan yang kita kirim sendiri
  if (fromMe) {
    console.log('Skipping own message');
    return;
  }

  // Handle device_id that might be a phone number
  let actualDeviceId = deviceId;
  if (deviceId.includes('@s.whatsapp.net') || deviceId.includes('@g.us')) {
    // Extract phone number from device_id and map to our device
    actualDeviceId = 'chatflow-api-1';
    console.log('Device ID is phone number, mapping to:', actualDeviceId);
  }

  console.log('Looking up phone for device:', actualDeviceId);
  // Cari phone record berdasarkan device_id
  const phoneResult = await db.query(
    'SELECT id FROM phone_numbers WHERE device_name = $1 LIMIT 1',
    [actualDeviceId]
  );
  const phoneId = phoneResult.rows[0]?.id || null;

  console.log('Phone lookup result:', { phoneId, rows: phoneResult.rows });

  if (!phoneId) {
    console.log('No phone found for device:', actualDeviceId);
    logger.warn(`No phone found for device: ${actualDeviceId}`);
    return;
  }

  console.log('Phone found:', phoneId);
  logger.info('Phone found:', { phoneId, deviceId: actualDeviceId });

  // Extract nomor pengirim (hapus @s.whatsapp.net)
  const senderPhone = from.replace('@s.whatsapp.net', '').replace('@g.us', '').replace('@lid', '');

  // Tentukan tipe pesan
  let messageType = 'text';
  let messageContent = body || message?.text || message?.caption || '';

  if (media) {
    if (media.mimeType?.startsWith('image/')) messageType = 'image';
    else if (media.mimeType?.startsWith('video/')) messageType = 'video';
    else if (media.mimeType?.startsWith('audio/')) messageType = 'audio';
    else messageType = 'document';
    messageContent = body || message?.caption || `[${messageType}]`;
  }

  console.log('Message data:', { messageId, phoneId, senderPhone, messageType, messageContent });
  logger.info('Message data:', { messageId, phoneId, senderPhone, messageType, messageContent });

  try {
    console.log('Attempting database insert...');
    
    // Handle timestamp conversion
    let createdAt;
    if (typeof timestamp === 'string') {
      // If timestamp is a string, try to parse it
      const parsedDate = new Date(timestamp);
      if (isNaN(parsedDate.getTime())) {
        // If parsing fails, use current time
        createdAt = new Date().toISOString();
      } else {
        createdAt = parsedDate.toISOString();
      }
    } else if (typeof timestamp === 'number') {
      // If timestamp is a number, treat as Unix timestamp
      createdAt = new Date(timestamp * 1000).toISOString();
    } else {
      // Fallback to current time
      createdAt = new Date().toISOString();
    }
    
    console.log('Timestamp conversion:', { timestamp, createdAt });
    
    // Simpan ke existing messages table
    const saved = await db.query(`
      INSERT INTO messages (
        phone_number_id, message_id, from_number, to_number,
        message_type, content, media_url, media_type, status, webhook_sent, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `, [
      phoneId,
      messageId,
      senderPhone,
      phoneId, // Gunakan phoneId sebagai to_number
      messageType,
      messageContent,
      null, // media_url
      null, // media_type
      'received',
      false, // webhook_sent
      createdAt
    ]);

    console.log('Database insert result:', saved);
    console.log('Rows affected:', saved.rowCount, 'Rows returned:', saved.rows);

    if (saved.rows.length > 0) {
      logger.info(`GOWA Message saved: ${messageId} from ${senderPhone}`);

      // Kirim realtime ke frontend via Socket.io
      if (io) {
        io.emit('incoming_message', {
          ...saved.rows[0],
          pushName: pushName || senderPhone
        });
      }

      // Trigger auto-reply
      await triggerAutoReply(saved.rows[0], payload);
    } else {
      console.log('No rows inserted - possibly duplicate');
    }
  } catch (error) {
    console.error('Database insert error:', error);
    logger.error('Database insert error:', error);
  }

  console.log('=== GOWA WEBHOOK DEBUG END ===');
};

// Handle GOWA message acknowledgment
const handleMessageAck = async (deviceId, payload) => {
  const { id: messageId, ack } = payload;
  // ack: 1=sent, 2=delivered, 3=read

  // Handle device_id that might be a phone number
  let actualDeviceId = deviceId;
  if (deviceId.includes('@s.whatsapp.net') || deviceId.includes('@g.us')) {
    actualDeviceId = 'chatflow-api-1';
  }

  const statusMap = { 1: 'sent', 2: 'delivered', 3: 'read' };

  try {
    const result = await db.query(`
      UPDATE messages 
      SET status = $1, updated_at = NOW()
      WHERE message_id = $2
    `, [statusMap[ack] || 'unknown', messageId]);
    
    console.log(`Message ACK updated: ${messageId} -> ${statusMap[ack] || 'unknown'}`, { rowsAffected: result.rowCount });
  } catch (error) {
    console.error('Error updating message ACK:', error);
  }
};

// Handle GOWA message revoked
const handleMessageRevoked = async (deviceId, payload) => {
  await db.query(`
    UPDATE messages 
    SET status = 'revoked', updated_at = NOW()
    WHERE message_id = $1
  `, [payload.id]);
};

// Send WhatsApp message via ChatFlow Message Controller
const sendWhatsAppMessage = async (phoneNumber, message) => {
  try {
    console.log('Sending WhatsApp message via ChatFlow:', { phoneNumber, message });
    
    // Get phone ID for the registered phone
    const phoneResult = await db.query(
      'SELECT id FROM phone_numbers WHERE device_name = $1 LIMIT 1',
      ['chatflow-api-1']
    );
    
    if (phoneResult.rows.length === 0) {
      throw new Error('No registered phone found');
    }
    
    const phoneId = phoneResult.rows[0].id;
    
    // Create mock request object for message controller
    const mockReq = {
      user: { id: 1 }, // Assuming user ID 1 for auto-reply
      body: {
        phone_id: phoneId,
        to: phoneNumber,
        message: message,
        type: 'text'
      }
    };
    
    // Create mock response object
    let responseData = null;
    const mockRes = {
      status: (code) => ({
        json: (data) => {
          responseData = data;
          return responseData;
        }
      })
    };
    
    // Import and use message controller
    const messageController = require('./messageController');
    await messageController.sendMessage(mockReq, mockRes);
    
    console.log('WhatsApp message sent successfully via ChatFlow:', responseData);
    return { success: true, data: responseData };
  } catch (error) {
    console.error('Error sending WhatsApp message:', error.message);
    logger.error('Error sending WhatsApp message:', error);
    return { success: false, error: error.message };
  }
};

// Trigger auto-reply
const triggerAutoReply = async (savedMessage, rawPayload) => {
  if (savedMessage.is_group) return; // skip group message dulu
  
  try {
    // Import auto-reply service
    const autoReplyService = require('../services/autoReplyService');
    
    // Get the registered phone number for auto-reply
    const phoneResult = await db.query(
      'SELECT phone_number FROM phone_numbers WHERE id = $1',
      [savedMessage.phone_number_id]
    );
    
    if (phoneResult.rows.length > 0) {
      const registeredPhone = phoneResult.rows[0].phone_number; // Keep the + sign
      
      console.log('Using registered phone for auto-reply:', registeredPhone);
      
      // Call auto-reply service with registered phone number
      logger.info('WebhookController: Calling auto-reply service', { 
        phoneNumber: registeredPhone, 
        message: savedMessage.content,
        messageId: savedMessage.message_id 
      });
      
      const replyResult = await autoReplyService.processMessage(registeredPhone, savedMessage.content);
      
      console.log('Auto-reply result:', replyResult);
      logger.info('WebhookController: Auto-reply service result', {
        shouldReply: replyResult.shouldReply,
        response: replyResult.response
      });
      
      if (replyResult.shouldReply) {
        console.log('Auto-reply triggered:', replyResult.response);
        
        // Send actual WhatsApp message
        const sendResult = await sendWhatsAppMessage(savedMessage.from_number, replyResult.response);
        
        if (sendResult.success) {
          console.log('Auto-reply sent successfully via ChatFlow');
        } else {
          console.error('Failed to send auto-reply via ChatFlow:', sendResult.error);
        }
      } else {
        console.log('No auto-reply configured for this message');
      }
    } else {
      console.log('No registered phone found for auto-reply');
    }
  } catch (error) {
    logger.error('Auto-reply error:', error);
    console.error('Auto-reply error:', error);
  }
};

const webhookController = {
  async handleIncoming(req, res) {
    // Langsung balas 200 OK dulu ke GOWA agar tidak timeout
    res.status(200).json({ received: true });

    try {
      const { event, device_id, payload } = req.body;

      logger.info(`Webhook received: event=${event}, device=${device_id}`);
      logger.info('Webhook payload:', req.body);

      // Route berdasarkan jenis event
      switch (event) {
        case 'message':
          await handleGOWAMessage(device_id, payload);
          break;
        case 'message.ack':
          await handleMessageAck(device_id, payload);
          break;
        case 'message.revoked':
          await handleMessageRevoked(device_id, payload);
          break;
        default:
          logger.info(`Unhandled event: ${event}`);
      }

    } catch (error) {
      logger.error('Webhook processing error:', error);
    }
  },

  // Start message polling
  startMessagePolling() {
    logger.info('Starting GOWA message polling service');
    gowaMessageService.startPolling();
  },

  // Stop message polling
  stopMessagePolling() {
    logger.info('Stopping GOWA message polling service');
    gowaMessageService.stopPolling();
  },

  // Missing methods required by routes
  async getEvents(req, res) {
    try {
      const { phoneId } = req.params;
      const { limit = 50, offset = 0, eventType } = req.query;

      const events = await db.query(`
        SELECT * FROM webhook_events 
        WHERE phone_id = $1 ${eventType ? 'AND event_type = $2' : ''}
        ORDER BY created_at DESC 
        LIMIT $${eventType ? 3 : 2} OFFSET $${eventType ? 4 : 3}
      `, eventType ? [phoneId, eventType, limit, offset] : [phoneId, limit, offset]);

      res.json({
        success: true,
        events: events.rows,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: events.rowCount || 0
        }
      });
    } catch (error) {
      logger.error('Error getting webhook events:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  },

  async getStats(req, res) {
    try {
      const { phoneId } = req.params;

      const stats = await db.query(`
        SELECT 
          COUNT(*) as total_events,
          COUNT(CASE WHEN created_at > NOW() - INTERVAL '24 hours' THEN 1 END) as last_24h,
          COUNT(CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN 1 END) as last_7d,
          COUNT(CASE WHEN created_at > NOW() - INTERVAL '30 days' THEN 1 END) as last_30d
        FROM webhook_events 
        WHERE phone_id = $1
      `, [phoneId]);

      res.json({
        success: true,
        stats: stats.rows[0]
      });
    } catch (error) {
      logger.error('Error getting webhook stats:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  },

  async testWebhook(req, res) {
    try {
      const { phoneId } = req.params;
      
      // Test webhook by sending a test event
      const testPayload = {
        event: 'test',
        device_id: 'test-device',
        payload: {
          test: true,
          timestamp: Date.now()
        }
      };

      // Send test webhook
      await handleGOWAMessage('test-device', testPayload.payload);

      res.json({
        success: true,
        message: 'Test webhook sent successfully'
      });
    } catch (error) {
      logger.error('Error testing webhook:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  },

  async retryFailed(req, res) {
    try {
      const { phoneId } = req.params;
      
      // Retry failed webhook events
      const failedEvents = await db.query(`
        SELECT * FROM webhook_events 
        WHERE phone_id = $1 AND status = 'failed'
        ORDER BY created_at ASC
        LIMIT 10
      `, [phoneId]);

      for (const event of failedEvents.rows) {
        try {
          // Retry processing the event
          await handleGOWAMessage(event.device_id, event.payload);
          
          // Update status to success
          await db.query(`
            UPDATE webhook_events 
            SET status = 'success', updated_at = NOW()
            WHERE id = $1
          `, [event.id]);
        } catch (error) {
          logger.error(`Failed to retry webhook event ${event.id}:`, error);
        }
      }

      res.json({
        success: true,
        message: `Retried ${failedEvents.rows.length} failed webhook events`
      });
    } catch (error) {
      logger.error('Error retrying failed webhooks:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  },

  async getRecentEvents(req, res) {
    try {
      const { phoneId } = req.params;
      const { limit = 10 } = req.query;

      const events = await db.query(`
        SELECT * FROM webhook_events 
        WHERE phone_id = $1 
        ORDER BY created_at DESC 
        LIMIT $2
      `, [phoneId, limit]);

      res.json({
        success: true,
        events: events.rows
      });
    } catch (error) {
      logger.error('Error getting recent webhook events:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  },

  async getQueueStatus(req, res) {
    try {
      const queueStats = await db.query(`
        SELECT 
          COUNT(*) as total_pending,
          COUNT(CASE WHEN created_at > NOW() - INTERVAL '1 hour' THEN 1 END) as last_hour
        FROM webhook_events 
        WHERE status = 'pending'
      `);

      res.json({
        success: true,
        queue: {
          pending: parseInt(queueStats.rows[0].total_pending),
          last_hour: parseInt(queueStats.rows[0].last_hour)
        }
      });
    } catch (error) {
      logger.error('Error getting queue status:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  },

  async clearQueue(req, res) {
    try {
      const result = await db.query(`
        DELETE FROM webhook_events 
        WHERE status = 'pending' AND created_at < NOW() - INTERVAL '24 hours'
      `);

      res.json({
        success: true,
        message: `Cleared ${result.rowCount} old pending events`
      });
    } catch (error) {
      logger.error('Error clearing queue:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  },

  async cleanupEvents(req, res) {
    try {
      const { days = 30 } = req.body;
      
      const result = await db.query(`
        DELETE FROM webhook_events 
        WHERE created_at < NOW() - INTERVAL '${days} days'
      `);

      res.json({
        success: true,
        message: `Cleaned up ${result.rowCount} old webhook events`
      });
    } catch (error) {
      logger.error('Error cleaning up webhook events:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
};

module.exports = webhookController;
