const { db } = require('../config/database');
const logger = require('../utils/logger');

class AutoReplyService {
  // Process incoming message and return auto-reply response
  async processMessage(phoneNumber, message) {
    try {
      const startTime = Date.now();

      logger.info('AutoReplyService: Starting processMessage', { phoneNumber, message });

      // 1. Find phone number record
      const phoneRecord = await this.findPhoneByNumber(phoneNumber);
      if (!phoneRecord) {
        logger.info('AutoReplyService: Phone number not found', { phoneNumber });
        return { shouldReply: false };
      }

      logger.info('AutoReplyService: Phone record found', { phoneId: phoneRecord.id, phoneName: phoneRecord.device_name });

      // 2. Find active config for this phone number
      const config = await this.findConfigForPhone(phoneRecord.id, message);
      if (!config) {
        logger.info('AutoReplyService: No config found for phone', { phoneId: phoneRecord.id, message });
        return { shouldReply: false };
      }

      logger.info('AutoReplyService: Config found', { configId: config.id, configName: config.name });

      // 3. Find active session for this phone number
      const session = await this.getActiveSession(phoneNumber);

      // Check if message contains welcome keywords
      const isWelcomeMessage = this.isWelcomeMessage(message, config.trigger_keywords);

      if (!session || isWelcomeMessage) {
        // Create new session or reset existing session for welcome message
        let newSession;
        
        if (!session) {
          // Create new session
          newSession = await this.createNewSession(phoneNumber, config.id, phoneRecord.id);
        } else {
          // Reset existing session for welcome message
          newSession = await this.resetSession(phoneNumber, config.id, phoneRecord.id);
        }
        
        // Get root menus for welcome message
        const rootMenus = await this.getRootMenus(config.id);
        
        // Build welcome message with menu list
        let welcomeMessage = config.welcome_message;
        if (rootMenus.length > 0) {
          welcomeMessage += '\n\nSilakan pilih:\n';
          rootMenus.forEach(menu => {
            welcomeMessage += `${menu.menu_key}. ${menu.menu_text}\n`;
          });
          welcomeMessage += '\nKetik "0" untuk kembali ke menu utama';
        }
        
        // Send welcome message with menu
        await this.logInteraction(phoneNumber, message, welcomeMessage, 'welcome', Date.now() - startTime, newSession.id);

        // Update session to clear current_menu_id for menu selection
        await this.updateSession(newSession.id, null);

        return {
          shouldReply: true,
          response: welcomeMessage,
          sessionId: newSession.id,
          configId: config.id,
          phoneId: phoneRecord.id
        };
      }

      // 4. If has session, process menu selection
      logger.info('AutoReplyService: Processing menu selection', { 
        sessionId: session.id, 
        currentMenuId: session.current_menu_id, 
        message: message 
      });
      
      const menuResponse = await this.handleMenuSelection(session, message);
      
      logger.info('AutoReplyService: Menu selection result', {
        response: menuResponse.response,
        menuId: menuResponse.menuId,
        menuPath: menuResponse.menuPath
      });
      
      // Update session
      await this.updateSession(session.id, menuResponse.menuId);

      // Log interaction
      await this.logInteraction(phoneNumber, message, menuResponse.response, menuResponse.menuPath, Date.now() - startTime, session.id);

      return {
        shouldReply: true,
        response: menuResponse.response,
        sessionId: session.id,
        menuPath: menuResponse.menuPath,
        phoneId: phoneRecord.id
      };

    } catch (error) {
      logger.error('Auto-reply process message error:', error);
      return { shouldReply: false, error: error.message };
    }
  }

  // Check if message contains welcome keywords
  isWelcomeMessage(message, triggerKeywords) {
    if (!triggerKeywords || triggerKeywords.length === 0) return false;
    
    const messageLower = message.toLowerCase().trim();
    return triggerKeywords.some(keyword => 
      messageLower.includes(keyword.toLowerCase().trim())
    );
  }

  // Reset existing session for welcome message
  async resetSession(phoneNumber, configId, phoneId) {
    try {
      const result = await db.query(`
        UPDATE auto_reply_sessions 
        SET current_menu_id = NULL, 
            session_data = '{}',
            last_interaction = NOW()
        WHERE phone_number = $1 AND is_active = true
        RETURNING *
      `, [phoneNumber]);

      return result.rows[0];
    } catch (error) {
      logger.error('Reset session error:', error);
      return null;
    }
  }

  // Find active session for phone number
  async getActiveSession(phoneNumber) {
    try {
      const result = await db.query(`
        SELECT s.*, c.name as config_name, c.trigger_keywords
        FROM auto_reply_sessions s
        JOIN auto_reply_configs c ON s.config_id = c.id
        WHERE s.phone_number = $1 AND s.is_active = true
        ORDER BY s.last_interaction DESC
        LIMIT 1
      `, [phoneNumber]);

      return result.rows[0] || null;
    } catch (error) {
      logger.error('Get active session error:', error);
      return null;
    }
  }

  // Find phone number record
  async findPhoneByNumber(phoneNumber) {
    try {
      logger.info('Looking up phone number:', { phoneNumber });
      
      const result = await db.query(`
        SELECT * FROM phone_numbers 
        WHERE phone_number = $1
      `, [phoneNumber]);

      logger.info('Phone lookup result:', {
        found: result.rows.length > 0,
        phoneId: result.rows[0]?.id
      });

      return result.rows[0] || null;
    } catch (error) {
      logger.error('Find phone by number error:', error);
      return null;
    }
  }

  // Find config for specific phone number
  async findConfigForPhone(phoneId, message) {
    try {
      const messageLower = message.toLowerCase().trim();
      
      logger.info('AutoReplyService: Finding config for phone', { phoneId, message: messageLower });
      
      // First try to find configs specifically for this phone
      const specificConfigResult = await db.query(`
        SELECT * FROM auto_reply_configs 
        WHERE is_active = true 
        AND $1 = ANY(phone_numbers)
        ORDER BY created_at DESC
      `, [phoneId]);

      logger.info('AutoReplyService: Specific config result', {
        phoneId,
        found: specificConfigResult.rows.length,
        configs: specificConfigResult.rows.map(c => ({ id: c.id, name: c.name, phone_numbers: c.phone_numbers }))
      });

      for (const config of specificConfigResult.rows) {
        const keywordsMatch = config.trigger_keywords.some(keyword => 
          messageLower.includes(keyword.toLowerCase())
        );
        
        if (keywordsMatch) {
          logger.info('AutoReplyService: Found matching specific config', { configId: config.id, configName: config.name });
          return config;
        }
      }

      // If no specific config found, try general configs (no phone numbers specified)
      const generalConfigResult = await db.query(`
        SELECT * FROM auto_reply_configs 
        WHERE is_active = true 
        AND (phone_numbers IS NULL OR phone_numbers = '{}' OR array_length(phone_numbers, 1) IS NULL)
        ORDER BY created_at DESC
      `);

      logger.info('AutoReplyService: General config result', {
        found: generalConfigResult.rows.length,
        configs: generalConfigResult.rows.map(c => ({ id: c.id, name: c.name, phone_numbers: c.phone_numbers }))
      });

      for (const config of generalConfigResult.rows) {
        const keywordsMatch = config.trigger_keywords.some(keyword => 
          messageLower.includes(keyword.toLowerCase())
        );
        
        if (keywordsMatch) {
          logger.info('AutoReplyService: Found matching general config', { configId: config.id, configName: config.name });
          return config;
        }
      }

      logger.info('AutoReplyService: No matching config found', { phoneId, message: messageLower });
      return null;
    } catch (error) {
      logger.error('Find config for phone error:', error);
      return null;
    }
  }

  // Create new session
  async createNewSession(phoneNumber, configId, phoneNumberId) {
    try {
      const result = await db.query(`
        INSERT INTO auto_reply_sessions (phone_number, config_id, phone_number_id)
        VALUES ($1, $2, $3)
        RETURNING *
      `, [phoneNumber, configId, phoneNumberId]);

      return result.rows[0];
    } catch (error) {
      logger.error('Create new session error:', error);
      throw error;
    }
  }

  // Handle menu selection
  async handleMenuSelection(session, message) {
    try {
      const messageTrim = message.trim();
      
      // Check for back to main menu
      if (messageTrim === '0' || messageTrim.toLowerCase() === 'menu') {
        const config = await this.getConfigById(session.config_id);
        return {
          response: config.welcome_message,
          menuId: null,
          menuPath: 'welcome'
        };
      }

      // Get current menu or root menus
      let menus;
      if (session.current_menu_id) {
        menus = await this.getSubMenus(session.current_menu_id);
      } else {
        menus = await this.getRootMenus(session.config_id);
      }

      // Find matching menu
      const selectedMenu = menus.find(menu => 
        menu.menu_key === messageTrim || 
        menu.menu_key.toLowerCase() === messageTrim.toLowerCase()
      );

      if (!selectedMenu) {
        // Menu not found, send error message
        return {
          response: 'Menu tidak ditemukan. Silakan pilih nomor yang tersedia atau ketik "0" untuk kembali ke menu utama.',
          menuId: session.current_menu_id,
          menuPath: 'error'
        };
      }

      // Check if this menu has sub-menus
      const subMenus = await this.getSubMenus(selectedMenu.id);
      
      if (subMenus.length > 0) {
        // This menu has sub-menus, show sub-menu options
        let subMenuText = selectedMenu.response_text + '\n\n';
        subMenuText += 'Silakan pilih:\n';
        subMenus.forEach(menu => {
          subMenuText += `${menu.menu_key}. ${menu.menu_text}\n`;
        });
        subMenuText += '\nKetik "0" untuk kembali ke menu utama';

        return {
          response: subMenuText,
          menuId: selectedMenu.id,
          menuPath: selectedMenu.menu_key
        };
      } else {
        // This is a final menu, send response
        return {
          response: selectedMenu.response_text + '\n\nKetik "0" untuk kembali ke menu utama',
          menuId: selectedMenu.id,
          menuPath: selectedMenu.menu_key
        };
      }

    } catch (error) {
      logger.error('Handle menu selection error:', error);
      return {
        response: 'Terjadi kesalahan. Silakan coba lagi.',
        menuId: session.current_menu_id,
        menuPath: 'error'
      };
    }
  }

  // Get config by ID
  async getConfigById(configId) {
    try {
      const result = await db.query(`
        SELECT * FROM auto_reply_configs WHERE id = $1
      `, [configId]);

      return result.rows[0];
    } catch (error) {
      logger.error('Get config by ID error:', error);
      throw error;
    }
  }

  // Get root menus for config
  async getRootMenus(configId) {
    try {
      const result = await db.query(`
        SELECT * FROM auto_reply_menus 
        WHERE config_id = $1 AND parent_menu_id IS NULL AND is_active = true
        ORDER BY order_index ASC, menu_key ASC
      `, [configId]);

      return result.rows;
    } catch (error) {
      logger.error('Get root menus error:', error);
      return [];
    }
  }

  // Get sub-menus for parent menu
  async getSubMenus(parentMenuId) {
    try {
      const result = await db.query(`
        SELECT * FROM auto_reply_menus 
        WHERE parent_menu_id = $1 AND is_active = true
        ORDER BY order_index ASC, menu_key ASC
      `, [parentMenuId]);

      return result.rows;
    } catch (error) {
      logger.error('Get sub-menus error:', error);
      return [];
    }
  }

  // Update session
  async updateSession(sessionId, menuId) {
    try {
      await db.query(`
        UPDATE auto_reply_sessions 
        SET current_menu_id = $1, last_interaction = NOW()
        WHERE id = $2
      `, [menuId, sessionId]);
    } catch (error) {
      logger.error('Update session error:', error);
    }
  }

  // Log interaction
  async logInteraction(phoneNumber, incomingMessage, outgoingMessage, menuPath, responseTime, sessionId) {
    try {
      await db.query(`
        INSERT INTO auto_reply_logs (phone_number, incoming_message, outgoing_message, menu_path, response_time, session_id)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [phoneNumber, incomingMessage, outgoingMessage, menuPath, responseTime, sessionId]);
    } catch (error) {
      logger.error('Log interaction error:', error);
    }
  }

  // End session
  async endSession(phoneNumber) {
    try {
      await db.query(`
        UPDATE auto_reply_sessions 
        SET is_active = false 
        WHERE phone_number = $1 AND is_active = true
      `, [phoneNumber]);
    } catch (error) {
      logger.error('End session error:', error);
    }
  }

  // Clean up old sessions (older than 24 hours)
  async cleanupOldSessions() {
    try {
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

      await db.query(`
        UPDATE auto_reply_sessions 
        SET is_active = false 
        WHERE last_interaction < $1 AND is_active = true
      `, [twentyFourHoursAgo]);

      logger.info('Cleaned up old auto-reply sessions');
    } catch (error) {
      logger.error('Cleanup old sessions error:', error);
    }
  }

  // Get session statistics
  async getSessionStats(configId) {
    try {
      const result = await db.query(`
        SELECT 
          COUNT(*) as total_sessions,
          COUNT(CASE WHEN is_active = true THEN 1 END) as active_sessions,
          AVG(EXTRACT(EPOCH FROM (NOW() - last_interaction))/60) as avg_session_duration_minutes
        FROM auto_reply_sessions 
        WHERE config_id = $1 AND created_at >= NOW() - INTERVAL '24 hours'
      `, [configId]);

      return result.rows[0];
    } catch (error) {
      logger.error('Get session stats error:', error);
      return null;
    }
  }
}

module.exports = new AutoReplyService();
