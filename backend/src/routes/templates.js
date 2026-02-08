const express = require('express');
const { body, query } = require('express-validator');
const templateController = require('../controllers/templateController');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Create new template
router.post('/', [
  auth,
  body('name').notEmpty().withMessage('Template name is required'),
  body('content').notEmpty().withMessage('Template content is required'),
  body('category').optional().isString().withMessage('Category must be a string'),
  body('variables').optional().isArray().withMessage('Variables must be an array')
], templateController.createTemplate);

// Get all templates for user
router.get('/', [
  auth,
  query('category').optional().isString().withMessage('Category must be a string')
], templateController.getTemplates);

// Update template
router.put('/:templateId', [
  auth,
  body('name').optional().notEmpty().withMessage('Template name cannot be empty'),
  body('content').optional().notEmpty().withMessage('Template content cannot be empty'),
  body('category').optional().isString().withMessage('Category must be a string'),
  body('variables').optional().isArray().withMessage('Variables must be an array')
], templateController.updateTemplate);

// Delete template
router.delete('/:templateId', [
  auth
], templateController.deleteTemplate);

// Process template with variables
router.post('/:templateId/process', [
  auth,
  body('variables').optional().isObject().withMessage('Variables must be an object')
], templateController.processTemplate);

module.exports = router;
