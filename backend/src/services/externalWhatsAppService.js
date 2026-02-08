const axios = require('axios');
const logger = require('../utils/logger');

class ExternalWhatsAppService {
  constructor() {
    this.providers = {
      watzap: {
        name: 'Watzap',
        baseUrl: 'https://api.watzap.id/v1',
        headers: {
          'Content-Type': 'application/json'
        },
        sendEndpoint: '/send_message',
        statusEndpoint: '/status',
        balanceEndpoint: '/balance'
      },
      // Add other providers here
      // evolution: {
      //   name: 'ChatFlow',
      //   baseUrl: process.env.EVOLUTION_API_URL,
      //   headers: {
      //     'Authorization': `Basic ${Buffer.from('admin:admin').toString('base64')}`
      //   },
      //   sendEndpoint: '/message/sendText'
      // }
    };
  }

  // Send message via external WhatsApp API
  async sendMessage(providerName, config, messageData) {
    try {
      const provider = this.providers[providerName];
      
      if (!provider) {
        throw new Error(`Provider ${providerName} not supported`);
      }

      const { api_key, number_key } = config;
      
      // Prepare request data based on provider
      let requestData;
      
      switch (providerName) {
        case 'watzap':
          requestData = {
            api_key: api_key,
            number_key: number_key,
            phone_no: messageData.to.replace(/[^\d]/g, ''), // Remove non-digits
            message: messageData.content
          };
          
          // Add media if present
          if (messageData.mediaUrl) {
            requestData.image_url = messageData.mediaUrl;
          }
          break;
          
        // Add other providers here
        default:
          throw new Error(`Provider ${providerName} not implemented`);
      }

      logger.info(`Sending message via ${provider.name}:`, {
        provider: providerName,
        to: messageData.to,
        content: messageData.content
      });

      const response = await axios.post(
        `${provider.baseUrl}${provider.sendEndpoint}`,
        requestData,
        {
          headers: provider.headers,
          timeout: 30000
        }
      );

      logger.info(`Message sent via ${provider.name}:`, {
        provider: providerName,
        response: response.data
      });

      return {
        success: true,
        provider: providerName,
        messageId: response.data.id || response.data.message_id,
        status: response.data.status || 'sent',
        response: response.data
      };

    } catch (error) {
      logger.error(`Failed to send message via ${providerName}:`, {
        error: error.message,
        response: error.response?.data
      });

      return {
        success: false,
        provider: providerName,
        error: error.response?.data?.message || error.message,
        response: error.response?.data
      };
    }
  }

  // Get account status/balance
  async getAccountStatus(providerName, config) {
    try {
      const provider = this.providers[providerName];
      
      if (!provider || !provider.balanceEndpoint) {
        throw new Error(`Balance check not supported for ${providerName}`);
      }

      const { api_key } = config;
      
      const response = await axios.get(
        `${provider.baseUrl}${provider.balanceEndpoint}`,
        {
          headers: {
            ...provider.headers,
            'api_key': api_key
          },
          timeout: 10000
        }
      );

      return {
        success: true,
        provider: providerName,
        balance: response.data.balance || response.data.quota,
        response: response.data
      };

    } catch (error) {
      logger.error(`Failed to get balance for ${providerName}:`, {
        error: error.message,
        response: error.response?.data
      });

      return {
        success: false,
        provider: providerName,
        error: error.response?.data?.message || error.message
      };
    }
  }

  // Get supported providers
  getSupportedProviders() {
    return Object.keys(this.providers).map(key => ({
      key,
      name: this.providers[key].name,
      features: {
        sendMessage: !!this.providers[key].sendEndpoint,
        checkBalance: !!this.providers[key].balanceEndpoint,
        checkStatus: !!this.providers[key].statusEndpoint
      }
    }));
  }

  // Validate provider configuration
  validateProviderConfig(providerName, config) {
    const provider = this.providers[providerName];
    
    if (!provider) {
      return {
        valid: false,
        errors: [`Provider ${providerName} not supported`]
      };
    }

    const errors = [];
    
    switch (providerName) {
      case 'watzap':
        if (!config.api_key) errors.push('API Key is required');
        if (!config.number_key) errors.push('Number Key is required');
        break;
        
      // Add validation for other providers
      default:
        break;
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

module.exports = new ExternalWhatsAppService();
