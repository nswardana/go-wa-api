const { db } = require('../config/database');
const logger = require('../utils/logger');

class CategoryController {
  // Get all categories for user
  async getCategories(req, res) {
    try {
      const userId = req.user.id;

      const result = await db.query(`
        SELECT * FROM contact_categories 
        WHERE user_id = $1 
        ORDER BY name
      `, [userId]);

      res.json({
        success: true,
        categories: result.rows
      });
    } catch (error) {
      logger.error('Get categories error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Create new category
  async createCategory(req, res) {
    try {
      const { name, description, color } = req.body;
      const userId = req.user.id;

      const result = await db.query(`
        INSERT INTO contact_categories (user_id, name, description, color)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `, [userId, name, description, color || '#1976d2']);

      res.json({
        success: true,
        category: result.rows[0]
      });
    } catch (error) {
      logger.error('Create category error:', error);
      if (error.message.includes('duplicate')) {
        res.status(400).json({
          success: false,
          error: 'Category name already exists'
        });
      } else {
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    }
  }

  // Get single category
  async getCategory(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const result = await db.query(`
        SELECT * FROM contact_categories 
        WHERE id = $1 AND user_id = $2
      `, [id, userId]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Category not found'
        });
      }

      res.json({
        success: true,
        category: result.rows[0]
      });
    } catch (error) {
      logger.error('Get category error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Update category
  async updateCategory(req, res) {
    try {
      const { id } = req.params;
      const { name, description, color } = req.body;
      const userId = req.user.id;

      const result = await db.query(`
        UPDATE contact_categories 
        SET name = $1, description = $2, color = $3, updated_at = NOW()
        WHERE id = $4 AND user_id = $5
        RETURNING *
      `, [name, description, color, id, userId]);

      if (result.rowCount > 0) {
        res.status(404).json({
          success: false,
          error: 'Category not found'
        });
      } else {
        res.json({
          success: true,
          category: result.rows[0]
        });
      }
    } catch (error) {
      logger.error('Update category error:', error);
      if (error.message.includes('duplicate')) {
        res.status(400).json({
          success: false,
          error: 'Category name already exists'
        });
      } else {
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    }
  }

  // Delete category
  async deleteCategory(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // Check if category has contacts
      const contactCount = await db.query(`
        SELECT COUNT(*) as count FROM contact_category_relations 
        WHERE category_id = $1
      `, [id]);

      if (parseInt(contactCount.rows[0].count) > 0) {
        return res.status(400).json({
          success: false,
          error: 'Cannot delete category with existing contacts'
        });
      }

      const result = await db.query(`
        DELETE FROM contact_categories 
        WHERE id = $1 AND user_id = $2
      `, [id, userId]);

      if (result.rowCount > 0) {
        res.json({
          success: true,
          message: 'Category deleted successfully'
        });
      } else {
        res.status(404).json({
          success: false,
          error: 'Category not found'
        });
      }
    } catch (error) {
      logger.error('Delete category error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new CategoryController();
