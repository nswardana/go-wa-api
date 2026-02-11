const { db } = require('../config/database');
const logger = require('../utils/logger');

class BroadcastTemplateController {
  // Get all templates
  async getTemplates(req, res) {
    try {
      const { page = 1, limit = 25 } = req.query;
      const userId = req.user.id;
      const offset = (page - 1) * limit;

      const result = await db.query(`
        SELECT * FROM broadcast_templates 
        WHERE user_id = $1 
        ORDER BY created_at DESC 
        LIMIT $2 OFFSET $3
      `, [userId, limit, offset]);
      
      // Get total count
      const countResult = await db.query(`
        SELECT COUNT(*) as total FROM broadcast_templates WHERE user_id = $1
      `, [userId]);

      res.json({
        success: true,
        templates: result.rows,
        total: parseInt(countResult.rows[0].total),
        page: parseInt(page),
        limit: parseInt(limit)
      });
    } catch (error) {
      logger.error('Get templates error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Get single template
  async getTemplate(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const result = await db.query(`
        SELECT * FROM broadcast_templates 
        WHERE id = $1 AND user_id = $2
      `, [id, userId]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Template not found'
        });
      }

      res.json({
        success: true,
        template: result.rows[0]
      });
    } catch (error) {
      logger.error('Get template error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Create new template
  async createTemplate(req, res) {
    try {
      const { name, description, message, variables } = req.body;
      const userId = req.user.id;

      const result = await db.query(`
        INSERT INTO broadcast_templates (user_id, name, description, message, variables)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [userId, name, description, message, variables || {}]);

      res.json({
        success: true,
        template: result.rows[0]
      });
    } catch (error) {
      logger.error('Create template error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Update template
  async updateTemplate(req, res) {
    try {
      const { id } = req.params;
      const { name, description, message, variables } = req.body;
      const userId = req.user.id;

      const result = await db.query(`
        UPDATE broadcast_templates 
        SET name = $1, description = $2, message = $3, variables = $4, updated_at = NOW()
        WHERE id = $5 AND user_id = $6
        RETURNING *
      `, [name, description, message, variables || {}, id, userId]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Template not found'
        });
      }

      res.json({
        success: true,
        template: result.rows[0]
      });
    } catch (error) {
      logger.error('Update template error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Delete template
  async deleteTemplate(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const result = await db.query(`
        DELETE FROM broadcast_templates 
        WHERE id = $1 AND user_id = $2
      `, [id, userId]);

      if (result.rowCount === 0) {
        return res.status(404).json({
          success: false,
          error: 'Template not found'
        });
      }

      res.json({
        success: true,
        message: 'Template deleted successfully'
      });
    } catch (error) {
      logger.error('Delete template error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new BroadcastTemplateController();
