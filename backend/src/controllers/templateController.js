const templateService = require('../services/templateService');
const logger = require('../utils/logger');
const { validationResult } = require('express-validator');

class TemplateController {
  // Create new template
  async createTemplate(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const userId = req.user.id;
      const templateData = req.body;

      const template = await templateService.createTemplate(userId, templateData);

      res.status(201).json({
        success: true,
        message: 'Template created successfully',
        template
      });
    } catch (error) {
      logger.error('Create template error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  }

  // Get all templates for user
  async getTemplates(req, res) {
    try {
      const userId = req.user.id;
      const { category } = req.query;

      let templates = await templateService.getTemplates(userId);

      // Filter by category if specified
      if (category) {
        templates = templates.filter(template => template.category === category);
      }

      res.json({
        success: true,
        templates,
        total: templates.length
      });
    } catch (error) {
      logger.error('Get templates error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  }

  // Update template
  async updateTemplate(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { templateId } = req.params;
      const userId = req.user.id;
      const templateData = req.body;

      const template = await templateService.updateTemplate(templateId, userId, templateData);

      res.json({
        success: true,
        message: 'Template updated successfully',
        template
      });
    } catch (error) {
      logger.error('Update template error:', error);
      if (error.message === 'Template not found') {
        return res.status(404).json({
          error: 'Template not found'
        });
      }
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  }

  // Delete template
  async deleteTemplate(req, res) {
    try {
      const { templateId } = req.params;
      const userId = req.user.id;

      const template = await templateService.deleteTemplate(templateId, userId);

      res.json({
        success: true,
        message: 'Template deleted successfully',
        template
      });
    } catch (error) {
      logger.error('Delete template error:', error);
      if (error.message === 'Template not found') {
        return res.status(404).json({
          error: 'Template not found'
        });
      }
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  }

  // Process template with variables
  async processTemplate(req, res) {
    try {
      const { templateId } = req.params;
      const { variables } = req.body;

      const processedTemplate = await templateService.processTemplate(templateId, variables);

      res.json({
        success: true,
        template: processedTemplate
      });
    } catch (error) {
      logger.error('Process template error:', error);
      if (error.message === 'Template not found') {
        return res.status(404).json({
          error: 'Template not found'
        });
      }
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  }
}

module.exports = new TemplateController();
