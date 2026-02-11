const express = require('express');
const router = express.Router();
const broadcastTemplateController = require('../controllers/broadcastTemplateController');
const { auth: authMiddleware } = require('../middleware/auth');

// Template Routes
router.get('/', authMiddleware, broadcastTemplateController.getTemplates);
router.post('/', authMiddleware, broadcastTemplateController.createTemplate);
router.get('/:id', authMiddleware, broadcastTemplateController.getTemplate);
router.put('/:id', authMiddleware, broadcastTemplateController.updateTemplate);
router.delete('/:id', authMiddleware, broadcastTemplateController.deleteTemplate);

module.exports = router;
