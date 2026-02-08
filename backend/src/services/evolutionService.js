const { Pool } = require('pg');
const axios = require('axios');
const logger = require('../utils/logger');

// Use shared database configuration
const { db } = require('../config/database');

class EvolutionService {
  constructor() {
    // Check if running in development mode
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    // Multiple ChatFlow instances
    this.instances = {
      'chatflow-1': {
        url: isDevelopment ? 'http://localhost:8081' : 'http://chatflow-1:3000',
        apiKey: process.env.EVOLUTION_API_KEY_1 || 'admin'
      },
      'chatflow-2': {
        url: isDevelopment ? 'http://localhost:8082' : 'http://chatflow-2:3000',
        apiKey: process.env.EVOLUTION_API_KEY_2 || 'admin'
      }
    };
    
    // Default instance
    this.evolutionApiUrl = isDevelopment ? 'http://localhost:8081' : process.env.EVOLUTION_API_URL || 'http://chatflow-1:3000';
    this.evolutionApiKey = process.env.EVOLUTION_API_KEY || 'admin';
    
    // For frontend access, use localhost:8081 in development
    this.evolutionApiPublicUrl = isDevelopment ? 'http://localhost:8081' : 'http://localhost:8081';
  }

  // Get instance URL and API key
  getInstanceConfig(instanceName) {
    return this.instances[instanceName] || {
      url: this.evolutionApiUrl,
      apiKey: this.evolutionApiKey
    };
  }

  // Create new instance in ChatFlow
  async createInstance(phoneData) {
    try {
      // Based on go-whatsapp-web-multidevice documentation, use POST /devices endpoint
      const response = await axios.post(`${this.evolutionApiUrl}/devices`, {
        device_id: phoneData.deviceName,
        number: phoneData.phoneNumber,
        webhook: phoneData.webhookUrl,
        webhook_secret: phoneData.webhookSecret
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${Buffer.from('admin:admin').toString('base64')}`
        },
        timeout: 30000
      });

      logger.info('ChatFlow device created:', {
        deviceName: phoneData.deviceName,
        phoneNumber: phoneData.phoneNumber,
        deviceId: response.data.results?.id
      });

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      logger.error('Failed to create ChatFlow device:', {
        error: error.message,
        response: error.response?.data
      });
      
      return {
        success: false,
        message: error.response?.data?.message || error.message
      };
    }
  }

  // Generate QR code for existing instance
  async generateQR(phoneId) {
    try {
      logger.info('Starting QR generation for phoneId:', phoneId);
      
      // Get phone details from database
      const phoneQuery = 'SELECT * FROM phone_numbers WHERE id = $1';
      const phoneResult = await db.query(phoneQuery, [phoneId]);
      const phone = phoneResult.rows[0];

      if (!phone) {
        logger.error('Phone not found for phoneId:', phoneId);
        return {
          success: false,
          message: 'Phone not found',
          phoneId
        };
      }

      logger.info('Found phone:', { phoneId: phone.id, deviceName: phone.device_name });

      // Check if ChatFlow is available
      const evolutionInstance = phone.evolution_name || 'chatflow-1';
      const instanceConfig = this.getInstanceConfig(evolutionInstance);
      
      try {
        logger.info('Getting QR code from ChatFlow:', {
          evolutionInstance,
          url: instanceConfig.url,
          deviceName: phone.device_name
        });
        
        // ✅ CORRECT: Use GET /app/login endpoint to trigger QR generation
        const loginResponse = await axios.get(
          `${instanceConfig.url}/app/login`,
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Basic ${Buffer.from('admin:admin').toString('base64')}`,
              'X-Device-Id': phone.device_name
            },
            timeout: 15000
          }
        );

        logger.info('Login response:', loginResponse.data);

        // Check if device exists, if not create it first
        if (loginResponse.data?.message?.includes('device not found') ||
            loginResponse.data?.message?.includes('create a device first')) {
          
          logger.info('Device not found, creating device first:', {
            deviceName: phone.device_name,
            phoneNumber: phone.phone_number
          });

          // Create device first
          const createResult = await this.createInstance({
            deviceName: phone.device_name,
            phoneNumber: phone.phone_number,
            webhookUrl: phone.webhook_url,
            webhookSecret: phone.webhook_secret
          });

          if (createResult.success) {
            logger.info('Device created successfully, retrying QR generation');
            
            // Retry QR generation after device creation
            return await this.generateQR(phoneId);
          } else {
            logger.error('Failed to create device:', createResult.message);
            throw new Error(createResult.message);
          }
        }

        // Check if QR code is available
        if (loginResponse.data && loginResponse.data.code === 'SUCCESS') {
          const qrData = loginResponse.data.results;
          
          if (qrData && qrData.qrcode) {
            // QR code path from API
            const qrCodePath = qrData.qrcode; // e.g., "/statics/qrcode/scan-qr-{UUID}.png"
            const fullQrUrl = `${instanceConfig.url}${qrCodePath}`;
            
            // Update phone with QR code URL
            const updateQuery = 'UPDATE phone_numbers SET qr_code = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2';
            await db.query(updateQuery, [fullQrUrl, phoneId]);

            logger.info('QR code generated successfully:', {
              phoneId,
              deviceName: phone.device_name,
              qrCodePath,
              fullQrUrl
            });

            return {
              success: true,
              qrCode: fullQrUrl,
              qrCodeBase64: qrData.qrcode_base64 || null, // If API provides base64
              message: 'QR code generated successfully',
              phoneId: phoneId,
              deviceName: phone.device_name,
              phoneNumber: phone.phone_number,
              evolutionApiUrl: instanceConfig.url,
              source: 'chatflow'
            };
          } else if (qrData && qrData.message) {
            // Already logged in or other status
            return {
              success: true,
              qrCode: null,
              message: qrData.message,
              status: qrData.status || 'connected',
              phoneId: phoneId,
              deviceName: phone.device_name,
              phoneNumber: phone.phone_number,
              source: 'chatflow'
            };
          }
        }

        // If no QR in response, check status
        if (loginResponse.data && loginResponse.data.results) {
          const status = loginResponse.data.results.status || loginResponse.data.results.message;
          
          // Check if device is already connected
          if (loginResponse.data.results.connected === true || 
              loginResponse.data.results.status === 'CONNECTED' ||
              loginResponse.data.results.message?.includes('already connected')) {
            
            return {
              success: true,
              qrCode: null,
              message: 'Device is already connected to WhatsApp',
              status: 'connected',
              phoneId: phoneId,
              deviceName: phone.device_name,
              phoneNumber: phone.phone_number,
              evolutionApiUrl: instanceConfig.url,
              source: 'chatflow'
            };
          }
          
          return {
            success: true,
            qrCode: null,
            message: status || 'Device may already be connected',
            status: 'check_connection',
            phoneId: phoneId,
            deviceName: phone.device_name,
            phoneNumber: phone.phone_number,
            evolutionApiUrl: instanceConfig.url,
            source: 'chatflow'
          };
        }

      } catch (evolutionError) {
        logger.warn('ChatFlow error:', {
          error: evolutionError.message,
          response: evolutionError.response?.data,
          evolutionInstance,
          phoneId
        });

        // If device not found, try to create it first
        if (evolutionError.response?.status === 404 || 
            evolutionError.response?.data?.message?.includes('not found')) {
          
          logger.info('Device not found, creating new device...');
          
          const createResult = await this.createInstance({
            deviceName: phone.device_name,
            phoneNumber: phone.phone_number,
            webhookUrl: phone.webhook_url,
            webhookSecret: phone.webhook_secret
          });

          if (createResult.success) {
            // Retry getting QR code
            return await this.generateQR(phoneId);
          }
        }

        return {
          success: false,
          message: evolutionError.response?.data?.message || evolutionError.message,
          phoneId: phoneId,
          evolutionApiUrl: instanceConfig.url
        };
      }

      // Fallback: No QR code available
      return {
        success: false,
        message: 'Unable to generate QR code. Device may already be connected or API error.',
        phoneId: phoneId,
        deviceName: phone.device_name,
        evolutionApiUrl: instanceConfig.url
      };

    } catch (error) {
      logger.error('Failed to generate QR code:', {
        error: error.message,
        stack: error.stack,
        phoneId
      });
      
      return {
        success: false,
        message: 'Failed to generate QR code: ' + error.message,
        phoneId
      };
    }
  }

  // Check connection status
  async getConnectionStatus(phoneId) {
    try {
      const phoneQuery = 'SELECT * FROM phone_numbers WHERE id = $1';
      const phoneResult = await db.query(phoneQuery, [phoneId]);
      const phone = phoneResult.rows[0];

      if (!phone) {
        throw new Error('Phone not found');
      }

      const evolutionInstance = phone.evolution_name || 'chatflow-1';
      const instanceConfig = this.getInstanceConfig(evolutionInstance);

      // Use GET /app/status endpoint with X-Device-Id header
      const response = await axios.get(`${instanceConfig.url}/app/status`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${Buffer.from('admin:admin').toString('base64')}`,
          'X-Device-Id': phone.device_name
        },
        timeout: 10000
      });

      const isConnected = response.data.code === 'SUCCESS' && 
                         response.data.results?.connected === true;

      // Update connection status in database
      const updateQuery = 'UPDATE phone_numbers SET is_connected = $1, last_seen = CURRENT_TIMESTAMP WHERE id = $2';
      await db.query(updateQuery, [isConnected, phoneId]);

      return {
        success: true,
        connected: isConnected,
        phone: response.data.results?.phone || null,
        battery: response.data.results?.battery || null,
        plugged: response.data.results?.plugged || false,
        status: response.data.results?.status || 'unknown'
      };
    } catch (error) {
      logger.error('Failed to get connection status:', {
        error: error.message,
        response: error.response?.data
      });
      
      return {
        success: false,
        connected: false,
        message: error.message
      };
    }
  }

  // Send message through ChatFlow
  async sendMessage(phoneId, messageData) {
    try {
      const phoneQuery = 'SELECT * FROM phone_numbers WHERE id = $1';
      const phoneResult = await db.query(phoneQuery, [phoneId]);
      const phone = phoneResult.rows[0];

      if (!phone) {
        throw new Error('Phone not found');
      }

      if (!phone.is_connected) {
        throw new Error('Phone is not connected to WhatsApp');
      }

      const evolutionInstance = phone.evolution_name || 'chatflow-1';
      const instanceConfig = this.getInstanceConfig(evolutionInstance);

      // Use POST /send endpoint with device_id query parameter
      const response = await axios.post(
        `${instanceConfig.url}/send?device_id=${phone.device_name}`,
        {
          number: messageData.to,
          message: messageData.content
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      // Store message in database
      const messageQuery = `
        INSERT INTO messages (phone_number_id, message_id, from_number, to_number, message_type, content, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;
      
      const messageResult = await db.query(messageQuery, [
        phoneId,
        response.data.results?.message_id || 'msg_' + Date.now(),
        phone.phone_number,
        messageData.to,
        'text',
        messageData.content,
        'sent'
      ]);
      const message = messageResult.rows[0];

      logger.info('Message sent successfully:', {
        messageId: message.id,
        to: messageData.to,
        phoneId
      });

      return {
        success: true,
        message: {
          id: message.id,
          from: phone.phone_number,
          to: messageData.to,
          content: messageData.content,
          status: 'sent',
          createdAt: message.created_at
        }
      };
    } catch (error) {
      logger.error('Failed to send message:', {
        error: error.message,
        response: error.response?.data
      });
      
      return {
        success: false,
        message: error.response?.data?.message || error.message
      };
    }
  }

  // Logout/Disconnect device
  async logoutDevice(phoneId) {
    try {
      const phoneQuery = 'SELECT * FROM phone_numbers WHERE id = $1';
      const phoneResult = await db.query(phoneQuery, [phoneId]);
      const phone = phoneResult.rows[0];

      if (!phone) {
        throw new Error('Phone not found');
      }

      const evolutionInstance = phone.evolution_name || 'chatflow-1';
      const instanceConfig = this.getInstanceConfig(evolutionInstance);

      // Use GET /app/logout with X-Device-Id header
      await axios.get(`${instanceConfig.url}/app/logout`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${Buffer.from('admin:admin').toString('base64')}`,
          'X-Device-Id': phone.device_name
        },
        timeout: 15000
      });

      // Update database
      const updateQuery = 'UPDATE phone_numbers SET is_connected = false, qr_code = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = $1';
      await db.query(updateQuery, [phoneId]);

      logger.info('Device logged out:', {
        phoneId,
        deviceName: phone.device_name
      });

      return { success: true };
    } catch (error) {
      logger.error('Failed to logout device:', {
        error: error.message,
        response: error.response?.data
      });
      
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Delete instance from ChatFlow
  async deleteInstance(phoneId) {
    try {
      const phoneQuery = 'SELECT * FROM phone_numbers WHERE id = $1';
      const phoneResult = await db.query(phoneQuery, [phoneId]);
      const phone = phoneResult.rows[0];

      if (!phone) {
        throw new Error('Phone not found');
      }

      const evolutionInstance = phone.evolution_name || 'chatflow-1';
      const instanceConfig = this.getInstanceConfig(evolutionInstance);

      // Use DELETE /devices/{device_id} endpoint
      await axios.delete(`${instanceConfig.url}/devices/${phone.device_name}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${Buffer.from('admin:admin').toString('base64')}`,
          'X-Device-Id': phone.device_name
        },
        timeout: 15000
      });

      logger.info('ChatFlow instance deleted:', {
        instanceName: phone.device_name,
        phoneNumber: phone.phone_number
      });

      return { success: true };
    } catch (error) {
      logger.error('Failed to delete ChatFlow instance:', {
        error: error.message,
        response: error.response?.data
      });
      
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Get list of devices
  async getDevices() {
    try {
      const response = await axios.get(`${this.evolutionApiUrl}/devices`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${Buffer.from('admin:admin').toString('base64')}`
        },
        timeout: 10000
      });

      return {
        success: true,
        devices: response.data.results || []
      };
    } catch (error) {
      logger.error('Failed to get devices:', {
        error: error.message,
        response: error.response?.data
      });
      
      return {
        success: false,
        devices: [],
        message: error.message
      };
    }
  }

  // Webhook handler for incoming messages
  async handleWebhook(webhookData) {
    try {
      logger.info('Received webhook from ChatFlow:', webhookData);

      // Handle connection status updates
      if (webhookData.event === 'connection.status' || webhookData.code === 'CONNECTION_UPDATE') {
        const deviceId = webhookData.device_id || webhookData.device;
        
        // Find phone by device name
        const phoneQuery = 'SELECT * FROM phone_numbers WHERE device_name = $1 LIMIT 1';
        const phoneResult = await db.query(phoneQuery, [deviceId]);
        const phone = phoneResult.rows[0];

        if (phone) {
          const isConnected = webhookData.results?.connected || webhookData.data?.connected || false;
          
          // Update phone connection status
          const updateQuery = `
            UPDATE phone_numbers
            SET is_connected = $1, 
                last_seen = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
          `;
          
          await db.query(updateQuery, [isConnected, phone.id]);

          logger.info('Connection status updated:', {
            phoneId: phone.id,
            deviceName: phone.device_name,
            isConnected: isConnected
          });
        }
      }

      // Handle incoming messages
      if (webhookData.event === 'message.received' || webhookData.code === 'MESSAGE_RECEIVED') {
        const deviceId = webhookData.device_id || webhookData.device;
        
        // Find phone by device name
        const phoneQuery = 'SELECT * FROM phone_numbers WHERE device_name = $1 LIMIT 1';
        const phoneResult = await db.query(phoneQuery, [deviceId]);
        const phone = phoneResult.rows[0];

        if (phone) {
          const messageData = webhookData.results || webhookData.data;
          
          logger.info('Found phone for webhook:', { phoneId: phone.id, deviceName: phone.device_name });
          
          // Store incoming message
          const messageQuery = `
            INSERT INTO messages (phone_number_id, message_id, from_number, to_number, message_type, content, status, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT DO NOTHING
          `;
          
          await db.query(messageQuery, [
            phone.id,
            messageData.id || messageData.message_id || 'msg_' + Date.now(),
            messageData.from || messageData.sender,
            phone.phone_number,
            messageData.type || 'text',
            messageData.message || messageData.text || '',
            'received',
            new Date()
          ]);

          logger.info('Message synced from webhook:', {
            from: messageData.from || messageData.sender,
            to: phone.phone_number
          });
        } else {
          logger.warn('No phone found for webhook device:', deviceId);
        }
      }

      return { success: true };
    } catch (error) {
      logger.error('Failed to handle webhook:', {
        error: error.message,
        stack: error.stack
      });
      
      return {
        success: false,
        message: error.message
      };
    }
  }
}

module.exports = new EvolutionService();