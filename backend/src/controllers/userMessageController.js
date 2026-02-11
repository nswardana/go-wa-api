const { Pool } = require('pg');
const evolutionService = require('../services/evolutionService');

// Evolution Service Configuration
const EVOLUTION_SERVICE_API_KEY = process.env.EVOLUTION_SERVICE_API_KEY;
const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL;

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'chatflow_api',
  user: process.env.DB_USER || 'chatflow_user',
  password: process.env.DB_PASSWORD || 'Bismillah313!',
});

// Response Codes
const RESPONSE_CODES = {
  SUCCESS: 200,
  INVALID_API_KEY: 300,
  INVALID_REQUEST_FORMAT: 1100,
  NUMBER_NOT_FOUND: 800,
  WHATSAPP_CONNECTION_ERROR: 900,
  GENERAL_ERROR: 1000
};

// Response Messages
const RESPONSE_MESSAGES = {
  [RESPONSE_CODES.SUCCESS]: 'Success',
  [RESPONSE_CODES.INVALID_API_KEY]: 'Invalid API Key',
  [RESPONSE_CODES.INVALID_REQUEST_FORMAT]: 'Invalid Request Format',
  [RESPONSE_CODES.NUMBER_NOT_FOUND]: 'Number Not Found / Not Registered',
  [RESPONSE_CODES.WHATSAPP_CONNECTION_ERROR]: 'WhatsApp Connection Error',
  [RESPONSE_CODES.GENERAL_ERROR]: 'General Error'
};

class UserMessageController {
  // Send Message to Individual Number
  async sendMessage(req, res) {
    try {
      const { api_key, number_key, phone_no, message } = req.body;

      // Validation
      if (!api_key || !number_key || !phone_no || !message) {
        return res.status(200).json({
          status: false,
          code: 1100,
          message: 'Invalid Request Format: api_key, number_key, phone_no, and message are required',
          data: null
        });
      }

      // Find user by API key
      const userQuery = 'SELECT id, username, email FROM users WHERE api_key = $1';
      const userResult = await pool.query(userQuery, [api_key]);

      if (userResult.rows.length === 0) {
        return res.status(200).json({
          status: false,
          code: 300,
          message: 'Invalid API Key',
          data: null
        });
      }

      const user = userResult.rows[0];

      // Find phone number by number_key and user_id
      const phoneQuery = `
        SELECT p.*, 'chatflow-1' as evolution_name
        FROM phone_numbers p
        WHERE p.token = $1 AND p.user_id = $2
      `;
      const phoneResult = await pool.query(phoneQuery, [number_key, user.id]);

      if (phoneResult.rows.length === 0) {
        return res.status(200).json({
          status: false,
          code: 800,
          message: 'Number Not Found / Not Registered',
          data: null
        });
      }

      const phone = phoneResult.rows[0];

      // Check if phone is connected
      if (phone.is_connected !== 'connected') {
        return res.status(200).json({
          status: false,
          code: 900,
          message: 'WhatsApp Connection Error - Phone not connected',
          data: null
        });
      }

      // Send message via ChatFlow
      const messageId = 'BAE5F8D9' + Math.random().toString(36).substr(2, 9).toUpperCase();
      
      const evolutionData = {
        number: phone_no,
        text: message,
        messageId: messageId
      };

      let sendResult;
      if (phone.evolution_name === 'chatflow-1') {
        sendResult = await evolutionService.sendMessage('chatflow-1', evolutionData);
      } else if (phone.evolution_name === 'chatflow-2') {
        sendResult = await evolutionService.sendMessage('chatflow-2', evolutionData);
      } else {
        // Fallback to default
        sendResult = await evolutionService.sendMessage('chatflow-1', evolutionData);
      }

      // Store message in database
      const insertMessageQuery = `
        INSERT INTO messages (
          user_id, phone_number_id, message_id, to_number, message_type, content, 
          status, direction, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
        RETURNING *
      `;

      const messageRecord = await pool.query(insertMessageQuery, [
        user.id,
        phone.id,
        messageId,
        phone_no,
        'text',
        message,
        sendResult.success ? 'sent' : 'failed',
        'outbound'
      ]);

      return res.status(200).json({
        status: sendResult.success,
        code: sendResult.success ? 200 : 900,
        message: sendResult.success ? 'Message sent successfully' : 'Failed to send message',
        data: {
          message_id: messageId,
          phone_no: phone_no,
          status: sendResult.success ? 'sent' : 'failed',
          timestamp: new Date().toISOString().replace('T', ' ').substr(0, 19)
        }
      });

    } catch (error) {
      console.error('Send message error:', error);
      return res.status(200).json({
        status: false,
        code: 1000,
        message: 'General Error: ' + error.message,
        data: null
      });
    }
  }

  // Send Message to Group
  async sendGroupMessage(req, res) {
    try {
      const { api_key, number_key, group_id, message } = req.body;

      // Validation
      if (!api_key || !number_key || !group_id || !message) {
        return res.status(200).json({
          status: false,
          code: 1100,
          message: 'Invalid Request Format: api_key, number_key, group_id, and message are required',
          data: null
        });
      }

      // Find user by API key
      const userQuery = 'SELECT id, username, email FROM users WHERE api_key = $1';
      const userResult = await pool.query(userQuery, [api_key]);

      if (userResult.rows.length === 0) {
        return res.status(200).json({
          status: false,
          code: 300,
          message: 'Invalid API Key',
          data: null
        });
      }

      const user = userResult.rows[0];

      // Find phone number by number_key and user_id
      const phoneQuery = `
        SELECT p.*, e.name as evolution_name, e.url as evolution_url, e.token as evolution_token
        FROM phone_numbers p
        "chatflow-1" as evolution_name
        WHERE p.token = $1 AND p.user_id = $2 
      `;
      const phoneResult = await pool.query(phoneQuery, [number_key, user.id]);

      if (phoneResult.rows.length === 0) {
        return res.status(200).json({
          status: false,
          code: 800,
          message: 'Number Not Found / Not Registered',
          data: null
        });
      }

      const phone = phoneResult.rows[0];

      // Check if phone is connected
      if (phone.is_connected !== 'connected') {
        return res.status(200).json({
          status: false,
          code: 900,
          message: 'WhatsApp Connection Error - Phone not connected',
          data: null
        });
      }

      // Send group message via ChatFlow
      const messageId = 'BAE5F8D9' + Math.random().toString(36).substr(2, 9).toUpperCase();
      
      const evolutionData = {
        group: group_id,
        text: message,
        messageId: messageId
      };

      let sendResult;
      if (phone.evolution_name === 'chatflow-1') {
        sendResult = await await evolutionService.sendGroupMessage('chatflow-1', evolutionData);
      } else if (phone.evolution_name === 'chatflow-2') {
        sendResult = await await evolutionService.sendGroupMessage('chatflow-2', evolutionData);
      } else {
        // Fallback to default
        sendResult = await await evolutionService.sendGroupMessage('chatflow-1', evolutionData);
      }

      // Store message in database
      const insertMessageQuery = `
        INSERT INTO messages (
          user_id, phone_number_id, message_id, to_number, message_type, content, 
          status, direction, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
        RETURNING *
      `;

      const messageRecord = await pool.query(insertMessageQuery, [
        user.id,
        phone.id,
        messageId,
        group_id,
        'text',
        message,
        sendResult.success ? 'sent' : 'failed',
        'outbound'
      ]);

      return res.status(200).json({
        status: sendResult.success,
        code: sendResult.success ? 200 : 900,
        message: sendResult.success ? 'Group message sent successfully' : 'Failed to send group message',
        data: {
          message_id: messageId,
          group_id: group_id,
          status: sendResult.success ? 'sent' : 'failed',
          timestamp: new Date().toISOString().replace('T', ' ').substr(0, 19)
        }
      });

    } catch (error) {
      console.error('Send group message error:', error);
      return res.status(200).json({
        status: false,
        code: 1000,
        message: 'General Error: ' + error.message,
        data: null
      });
    }
  }

  // Get Account Status
  async getAccountStatus(req, res) {
    try {
      const { api_key, number_key } = req.body;

      // Validation
      if (!api_key || !number_key) {
        return res.status(200).json({
          status: false,
          code: 1100,
          message: 'Invalid Request Format: api_key and number_key are required',
          data: null
        });
      }

      // Find user by API key
      const userQuery = 'SELECT id, username, email FROM users WHERE api_key = $1';
      const userResult = await pool.query(userQuery, [api_key]);

      if (userResult.rows.length === 0) {
        return res.status(200).json({
          status: false,
          code: 300,
          message: 'Invalid API Key',
          data: null
        });
      }

      const user = userResult.rows[0];

      // Find phone number by number_key and user_id
      const phoneQuery = `
        SELECT p.*, e.name as evolution_name, e.url as evolution_url, e.token as evolution_token
        FROM phone_numbers p
        "chatflow-1" as evolution_name
        WHERE p.token = $1 AND p.user_id = $2 
      `;
      const phoneResult = await pool.query(phoneQuery, [number_key, user.id]);

      if (phoneResult.rows.length === 0) {
        return res.status(200).json({
          status: false,
          code: 800,
          message: 'Number Not Found / Not Registered',
          data: null
        });
      }

      const phone = phoneResult.rows[0];

      // Get connection status from ChatFlow
      let connectionStatus = 'unknown';
      if (phone.evolution_name === 'chatflow-1') {
        const statusResult = await evolutionService.getConnectionState('chatflow-1', phone.phone_number);
        connectionStatus = statusResult.state || 'unknown';
      } else if (phone.evolution_name === 'chatflow-2') {
        const statusResult = await evolutionService.getConnectionState('chatflow-2', phone.phone_number);
        connectionStatus = statusResult.state || 'unknown';
      }

      return res.status(200).json({
        status: true,
        code: 200,
        message: 'Account status retrieved successfully',
        data: {
          number_key: number_key,
          phone_number: phone.phone_number,
          status: connectionStatus,
          is_connected: connectionStatus === 'connected',
          evolution_instance: phone.evolution_name,
          timestamp: new Date().toISOString().replace('T', ' ').substr(0, 19)
        }
      });

    } catch (error) {
      console.error('Get account status error:', error);
      return res.status(200).json({
        status: false,
        code: 1000,
        message: 'General Error: ' + error.message,
        data: null
      });
    }
  }

  // Get List Groups
  async getGroups(req, res) {
    try {
      const { api_key, number_key } = req.body;

      // Validation
      if (!api_key || !number_key) {
        return res.status(200).json({
          status: false,
          code: 1100,
          message: 'Invalid Request Format: api_key and number_key are required',
          data: null
        });
      }

      // Find user by API key
      const userQuery = 'SELECT id, username, email FROM users WHERE api_key = $1';
      const userResult = await pool.query(userQuery, [api_key]);

      if (userResult.rows.length === 0) {
        return res.status(200).json({
          status: false,
          code: 300,
          message: 'Invalid API Key',
          data: null
        });
      }

      const user = userResult.rows[0];

      // Find phone number by number_key and user_id
      const phoneQuery = `
        SELECT p.*, e.name as evolution_name, e.url as evolution_url, e.token as evolution_token
        FROM phone_numbers p
        "chatflow-1" as evolution_name
        WHERE p.token = $1 AND p.user_id = $2 
      `;
      const phoneResult = await pool.query(phoneQuery, [number_key, user.id]);

      if (phoneResult.rows.length === 0) {
        return res.status(200).json({
          status: false,
          code: 800,
          message: 'Number Not Found / Not Registered',
          data: null
        });
      }

      const phone = phoneResult.rows[0];

      // Get groups from ChatFlow
      let groupsResult;
      if (phone.evolution_name === 'chatflow-1') {
        groupsResult = await evolutionService.getGroups('chatflow-1', phone.device_name);
      } else if (phone.evolution_name === 'chatflow-2') {
        groupsResult = await evolutionService.getGroups('chatflow-2', phone.device_name);
      } else {
        // Fallback to default
        groupsResult = await evolutionService.getGroups('chatflow-1', phone.device_name);
      }

      if (!groupsResult.success) {
        return res.status(200).json({
          status: false,
          code: 900,
          message: 'WhatsApp Connection Error: ' + groupsResult.error,
          data: null
        });
      }

      return res.status(200).json({
        status: true,
        code: 200,
        message: 'Groups retrieved successfully',
        data: {
          number_key: number_key,
          phone_number: phone.phone_number,
          evolution_instance: phone.evolution_name,
          groups: groupsResult.groups || [],
          total_groups: groupsResult.groups ? groupsResult.groups.length : 0,
          timestamp: new Date().toISOString().replace('T', ' ').substr(0, 19)
        }
      });

    } catch (error) {
      console.error('Get Groups Error:', error);
      return res.status(200).json({
        status: false,
        code: 1000,
        message: 'General Error: ' + error.message,
        data: null
      });
    }
  }

  // Get Balance/Usage
  async getBalance(req, res) {
    try {
      const { api_key, number_key } = req.body;

      // Validation
      if (!api_key || !number_key) {
        return res.status(200).json({
          status: false,
          code: 1100,
          message: 'Invalid Request Format: api_key and number_key are required',
          data: null
        });
      }

      // Find user by API key
      const userQuery = 'SELECT id, username, email FROM users WHERE api_key = $1';
      const userResult = await pool.query(userQuery, [api_key]);

      if (userResult.rows.length === 0) {
        return res.status(200).json({
          status: false,
          code: 300,
          message: 'Invalid API Key',
          data: null
        });
      }

      const user = userResult.rows[0];

      // Find phone number by number_key and user_id
      const phoneQuery = `
        SELECT p.*, e.name as evolution_name, e.url as evolution_url, e.token as evolution_token
        FROM phone_numbers p
        "chatflow-1" as evolution_name
        WHERE p.token = $1 AND p.user_id = $2 
      `;
      const phoneResult = await pool.query(phoneQuery, [number_key, user.id]);

      if (phoneResult.rows.length === 0) {
        return res.status(200).json({
          status: false,
          code: 800,
          message: 'Number Not Found / Not Registered',
          data: null
        });
      }

      const phone = phoneResult.rows[0];

      // Get message statistics from database
      const statsQuery = `
        SELECT 
          COUNT(*) as total_messages,
          COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent_messages,
          COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_messages,
          COUNT(CASE WHEN created_at >= CURRENT_DATE THEN 1 END) as today_messages
        FROM messages 
        WHERE user_id = $1 AND phone_number_id = $2 AND direction = 'outbound'
      `;
      const statsResult = await pool.query(statsQuery, [user.id, phone.id]);

      const stats = statsResult.rows[0];

      return res.status(200).json({
        status: true,
        code: 200,
        message: 'Balance retrieved successfully',
        data: {
          number_key: number_key,
          phone_number: phone.phone_number,
          total_messages: parseInt(stats.total_messages),
          sent_messages: parseInt(stats.sent_messages),
          failed_messages: parseInt(stats.failed_messages),
          today_messages: parseInt(stats.today_messages),
          success_rate: stats.total_messages > 0 ? 
            Math.round((stats.sent_messages / stats.total_messages) * 100) : 0,
          timestamp: new Date().toISOString().replace('T', ' ').substr(0, 19)
        }
      });

    } catch (error) {
      console.error('Get balance error:', error);
      return res.status(200).json({
        status: false,
        code: 1000,
        message: 'General Error: ' + error.message,
        data: null
      });
    }
  }
}

module.exports = new UserMessageController();
