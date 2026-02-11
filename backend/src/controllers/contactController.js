const { db } = require('../config/database');
const logger = require('../utils/logger');

class ContactController {
  // Get contacts with pagination, search, and filter
  async getContacts(req, res) {
    try {
      const { page = 1, limit = 25, search, category } = req.query;
      const userId = req.user.id;
      const offset = (page - 1) * limit;

      let query = `
        SELECT c.*, 
               ARRAY_AGG(cc.name) as categories,
               ARRAY_AGG(cc.color) as category_colors
        FROM contacts c
        LEFT JOIN contact_category_relations ccr ON c.id = ccr.contact_id
        LEFT JOIN contact_categories cc ON ccr.category_id = cc.id
        WHERE c.user_id = $1
      `;
      
      let params = [userId];
      
      if (search) {
        query += ` AND (c.name ILIKE $2 OR c.phone ILIKE $3 OR c.email ILIKE $4)`;
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }
      
      if (category && category !== 'all') {
        const paramIndex = params.length + 1;
        query += ` AND EXISTS (
          SELECT 1 FROM contact_category_relations ccr2 
          WHERE ccr2.contact_id = c.id AND ccr2.category_id = $${paramIndex}
        )`;
        params.push(category);
      }
      
      query += ` GROUP BY c.id ORDER BY c.name`;
      
      const result = await db.query(query, params);
      
      // Apply pagination in code (simpler approach)
      const paginatedResults = result.rows.slice(offset, offset + parseInt(limit));
      
      res.json({
        success: true,
        contacts: paginatedResults,
        total: result.rows.length,
        page: parseInt(page),
        limit: parseInt(limit)
      });
    } catch (error) {
      logger.error('Get contacts error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Get single contact
  async getContact(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const result = await db.query(`
        SELECT c.*, 
               ARRAY_AGG(cc.name) as categories,
               ARRAY_AGG(cc.color) as category_colors
        FROM contacts c
        LEFT JOIN contact_category_relations ccr ON c.id = ccr.contact_id
        LEFT JOIN contact_categories cc ON ccr.category_id = cc.id
        WHERE c.id = $1 AND c.user_id = $2
        GROUP BY c.id
      `, [id, userId]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Contact not found'
        });
      }

      res.json({
        success: true,
        contact: result.rows[0]
      });
    } catch (error) {
      logger.error('Get contact error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Create new contact
  async createContact(req, res) {
    try {
      const { name, phone, email, company, address, notes, categories } = req.body;
      const userId = req.user.id;

      await db.query('BEGIN');

      // Create contact
      const contactResult = await db.query(`
        INSERT INTO contacts (user_id, name, phone, email, company, address, notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [userId, name, phone, email, company || null, address || null, notes || null]);

      const contact = contactResult.rows[0];

      // Add categories
      if (categories && categories.length > 0) {
        for (const categoryId of categories) {
          await db.query(`
            INSERT INTO contact_category_relations (contact_id, category_id)
            VALUES ($1, $2)
          `, [contact.id, categoryId]);
        }
      }

      await db.query('COMMIT');

      // Return basic contact (simplified)
      res.json({
        success: true,
        contact: contact
      });
    } catch (error) {
      await db.query('ROLLBACK');
      logger.error('Create contact error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Helper method to get contact with categories
  async getContactWithCategories(contactId) {
    const result = await db.query(`
      SELECT c.*, 
             ARRAY_AGG(cc.name) as categories,
             ARRAY_AGG(cc.color) as category_colors
      FROM contacts c
      LEFT JOIN contact_category_relations ccr ON c.id = ccr.contact_id
      LEFT JOIN contact_categories cc ON ccr.category_id = cc.id
      WHERE c.id = $1
      GROUP BY c.id
    `, [contactId]);

    return result.rows[0];
  }

  // Update contact
  async updateContact(req, res) {
    try {
      const { id } = req.params;
      const { name, phone, email, company, address, notes, categories } = req.body;
      const userId = req.user.id;

      await db.query('BEGIN');

      // Update contact
      await db.query(`
        UPDATE contacts 
        SET name = $1, phone = $2, email = $3, company = $4, address = $5, notes = $6, updated_at = NOW()
        WHERE id = $7 AND user_id = $8
      `, [name, phone, email, company, address, notes, id, userId]);

      // Update categories (remove all, then add new)
      await db.query(`
        DELETE FROM contact_category_relations WHERE contact_id = $1
      `, [id]);

      if (categories && categories.length > 0) {
        for (const categoryId of categories) {
          await db.query(`
            INSERT INTO contact_category_relations (contact_id, category_id)
            VALUES ($1, $2)
          `, [id, categoryId]);
        }
      }

      await db.query('COMMIT');

      // Get updated contact (simplified)
      const updatedContact = await db.query(`
        SELECT * FROM contacts WHERE id = $1 AND user_id = $2
      `, [id, userId]);

      res.json({
        success: true,
        contact: updatedContact.rows[0]
      });
    } catch (error) {
      await db.query('ROLLBACK');
      logger.error('Update contact error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Delete contact
  async deleteContact(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const result = await db.query(`
        DELETE FROM contacts 
        WHERE id = $1 AND user_id = $2
      `, [id, userId]);

      if (result.rowCount > 0) {
        res.json({
          success: true,
          message: 'Contact deleted successfully'
        });
      } else {
        res.status(404).json({
          success: false,
          error: 'Contact not found'
        });
      }
    } catch (error) {
      logger.error('Delete contact error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Import contacts
  async importContacts(req, res) {
    try {
      const { contacts } = req.body;
      const userId = req.user.id;

      await db.query('BEGIN');

      const importedContacts = [];
      const skippedContacts = [];

      for (const contactData of contacts) {
        try {
          const contactResult = await db.query(`
            INSERT INTO contacts (user_id, name, phone, email, company)
            VALUES ($1, $2, $3, $4)
            RETURNING *
          `, [userId, contactData.name, contactData.phone, contactData.email]);

          importedContacts.push(contactResult.rows[0]);
        } catch (error) {
          if (!error.message.includes('duplicate')) {
            throw error;
          } else {
            skippedContacts.push({
              data: contactData,
              error: 'Duplicate phone number'
            });
          }
        }
      }

      await db.query('COMMIT');

      res.json({
        success: true,
        imported: importedContacts.length,
        skipped: skippedContacts.length,
        total: contacts.length,
        contacts: importedContacts
      });
    } catch (error) {
      await db.query('ROLLBACK');
      logger.error('Import contacts error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Export contacts
  async exportContacts(req, res) {
    try {
      const { format = 'csv', category } = req.query;
      const userId = req.user.id;

      let query = `
        SELECT c.name, c.phone, c.email, c.company, c.address, c.notes,
               ARRAY_AGG(cc.name ORDER BY cc.name) as categories
        FROM contacts c
        LEFT JOIN contact_category_relations ccr ON c.id = ccr.contact_id
        LEFT JOIN contact_categories cc ON ccr.category_id = cc.id
        WHERE c.user_id = $1
      `;
      
      const params = [userId];
      
      if (category && category !== 'all') {
        query += ` AND EXISTS (
          SELECT 1 FROM contact_category_relations ccr2 
          WHERE ccr2.contact_id = c.id AND ccr2.category_id = $2
        )`;
        params.push(category);
      }
      
      query += ` GROUP BY c.id ORDER BY c.name`;

      const result = await db.query(query, params);

      if (format === 'csv') {
        const csv = this.convertToCSV(result.rows);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="contacts.csv"');
        res.send(csv);
      } else {
        res.json({
          success: true,
          contacts: result.rows
        });
      }
    } catch (error) {
      logger.error('Export contacts error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Bulk delete contacts
  async bulkDelete(req, res) {
    try {
      const { contactIds } = req.body;
      const userId = req.user.id;

      const result = await db.query(`
        DELETE FROM contacts 
        WHERE id = ANY($1) AND user_id = $2
      `, [contactIds, userId]);

      res.json({
        success: true,
        deleted: result.rowCount
      });
    } catch (error) {
      logger.error('Bulk delete error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Bulk update categories
  async bulkUpdateCategory(req, res) {
    try {
      const { contactIds, categoryId } = req.body;
      const userId = req.user.id;

      await db.query('BEGIN');

      // Remove existing category relations
      await db.query(`
        DELETE FROM contact_category_relations 
        WHERE contact_id = ANY($1)
      `, [contactIds]);

      // Add new category relations
      for (const contactId of contactIds) {
        await db.query(`
          INSERT INTO contact_category_relations (contact_id, category_id)
          VALUES ($1, $2)
          `, [contactId, categoryId]);
      }

      await db.query('COMMIT');

      res.json({
        success: true,
        updated: contactIds.length
      });
    } catch (error) {
      await db.query('ROLLBACK');
      logger.error('Bulk update category error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Convert to CSV
  async convertToCSV(contacts) {
    const headers = ['Name', 'Phone', 'Email', 'Company', 'Address', 'Notes', 'Categories'];
    const rows = contacts.map(contact => [
      contact.name,
      contact.phone,
      contact.email || '',
      contact.company || '',
      contact.address || '',
      contact.notes || '',
      (contact.categories || []).join('; ')
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }
}

module.exports = new ContactController();
