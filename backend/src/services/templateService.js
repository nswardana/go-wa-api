const { db } = require('../config/database');
const logger = require('../utils/logger');

class TemplateService {
  // Create message template
  async createTemplate(userId, templateData) {
    try {
      const { name, content, category, variables } = templateData;
      
      const query = `
        INSERT INTO message_templates (user_id, name, content, category, variables)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;
      
      const template = await db.getOne(query, [
        userId,
        name,
        content,
        category || 'general',
        JSON.stringify(variables || [])
      ]);
      
      logger.info('Template created:', { templateId: template.id, userId });
      return template;
    } catch (error) {
      logger.error('Failed to create template:', error);
      throw new Error('Failed to create template');
    }
  }

  // Get all templates for user
  async getTemplates(userId) {
    try {
      const query = `
        SELECT * FROM message_templates 
        WHERE user_id = $1 
        ORDER BY created_at DESC
      `;
      
      const templates = await db.getAll(query, [userId]);
      return templates;
    } catch (error) {
      logger.error('Failed to get templates:', error);
      throw new Error('Failed to get templates');
    }
  }

  // Update template
  async updateTemplate(templateId, userId, templateData) {
    try {
      const { name, content, category, variables } = templateData;
      
      const query = `
        UPDATE message_templates 
        SET name = $1, content = $2, category = $3, variables = $4, updated_at = CURRENT_TIMESTAMP
        WHERE id = $5 AND user_id = $6
        RETURNING *
      `;
      
      const template = await db.getOne(query, [
        name,
        content,
        category,
        JSON.stringify(variables || []),
        templateId,
        userId
      ]);
      
      if (!template) {
        throw new Error('Template not found');
      }
      
      logger.info('Template updated:', { templateId, userId });
      return template;
    } catch (error) {
      logger.error('Failed to update template:', error);
      throw new Error('Failed to update template');
    }
  }

  // Delete template
  async deleteTemplate(templateId, userId) {
    try {
      const query = `
        DELETE FROM message_templates 
        WHERE id = $1 AND user_id = $2
        RETURNING *
      `;
      
      const template = await db.getOne(query, [templateId, userId]);
      
      if (!template) {
        throw new Error('Template not found');
      }
      
      logger.info('Template deleted:', { templateId, userId });
      return template;
    } catch (error) {
      logger.error('Failed to delete template:', error);
      throw new Error('Failed to delete template');
    }
  }

  // Process template with variables
  async processTemplate(templateId, variables) {
    try {
      const query = `
        SELECT * FROM message_templates 
        WHERE id = $1
      `;
      
      const template = await db.getOne(query, [templateId]);
      
      if (!template) {
        throw new Error('Template not found');
      }
      
      let processedContent = template.content;
      
      // Replace variables in template
      if (variables && typeof variables === 'object') {
        Object.keys(variables).forEach(key => {
          const regex = new RegExp(`{{${key}}}`, 'g');
          processedContent = processedContent.replace(regex, variables[key]);
        });
      }
      
      return {
        ...template,
        processedContent
      };
    } catch (error) {
      logger.error('Failed to process template:', error);
      throw new Error('Failed to process template');
    }
  }
}

module.exports = new TemplateService();
