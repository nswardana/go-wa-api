const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { auth: authMiddleware } = require('../middleware/auth');

// Category Routes
router.get('/', authMiddleware, categoryController.getCategories);
router.post('/', authMiddleware, categoryController.createCategory);
router.get('/:id', authMiddleware, categoryController.getCategory);
router.put('/:id', authMiddleware, categoryController.updateCategory);
router.delete('/:id', authMiddleware, categoryController.deleteCategory);

module.exports = router;
