const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const { auth: authMiddleware } = require('../middleware/auth');

// Contact Routes
router.get('/', authMiddleware, contactController.getContacts);
router.get('/:id', authMiddleware, contactController.getContact);
router.post('/', authMiddleware, contactController.createContact);
router.put('/:id', authMiddleware, contactController.updateContact);
router.delete('/:id', authMiddleware, contactController.deleteContact);

// Bulk Operations
router.post('/import', authMiddleware, contactController.importContacts);
router.get('/export', authMiddleware, contactController.exportContacts);
router.post('/bulk-delete', authMiddleware, contactController.bulkDelete);
router.post('/bulk-category', authMiddleware, contactController.bulkUpdateCategory);

module.exports = router;
