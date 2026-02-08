const express = require('express');
const { query } = require('express-validator');
const userController = require('../controllers/userController');
const { auth, authenticateToken } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of users to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of users to skip
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search users by username or email
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.get('/', [
  auth,
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be a non-negative integer'),
  query('search')
    .optional()
    .isString()
    .withMessage('Search must be a string')
], userController.getAllUsers);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.get('/:id', [
  auth,
  query('id')
    .isInt()
    .withMessage('ID must be an integer')
], userController.getUserById);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Update user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *       - in: body
 *         name: user
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             username:
 *               type: string
 *               minLength: 3
 *               maxLength: 50
 *             email:
 *               type: string
 *               format: email
 *             is_active:
 *               type: boolean
 *     responses:
 *       200:
 *         description: User updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Can only update own profile
 *       404:
 *         description: User not found
 */
router.put('/:id', [
  auth,
  query('id')
    .isInt()
    .withMessage('ID must be an integer')
], userController.updateUser);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Delete user (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.delete('/:id', [
  auth,
  query('id')
    .isInt()
    .withMessage('ID must be an integer')
], userController.deleteUser);

// Get API Keys for current user
// router.get('/api-keys', authenticateToken, async (req, res) => {
//   try {
//     const userId = req.user.id;
//     
//     const query = 'SELECT id, username, email, api_key, created_at, updated_at FROM users WHERE id = $1';
//     const result = await db.query(query, [userId]);
//     
//     if (result.rows.length === 0) {
//       return res.status(404).json({ error: 'User not found' });
//     }
//     
//     const user = result.rows[0];
//     
//     res.json({
//       status: 'success',
//       data: {
//         id: user.id,
//         username: user.username,
//         email: user.email,
//         api_key: user.api_key,
//         created_at: user.created_at,
//         updated_at: user.updated_at
//       }
//     });
//   } catch (error) {
//     console.error('Error fetching API keys:', error);
//     res.status(500).json({ error: 'Failed to fetch API keys' });
//   }
// });

// Generate new API Key for user
// router.post('/generate-api-key', authenticateToken, async (req, res) => {
//   try {
//     const userId = req.user.id;
//     
//     // Generate new API key
//     const newApiKey = `user_${req.user.username}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
//     
//     const query = 'UPDATE users SET api_key = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING api_key, updated_at';
//     const result = await db.query(query, [newApiKey, userId]);
//     
//     if (result.rows.length === 0) {
//       return res.status(404).json({ error: 'User not found' });
//     }
//     
//     res.json({
//       status: 'success',
//       message: 'API key generated successfully',
//       data: {
//         api_key: result.rows[0].api_key,
//         updated_at: result.rows[0].updated_at
//       }
//     });
//   } catch (error) {
//     console.error('Error generating API key:', error);
//     res.status(500).json({ error: 'Failed to generate API key' });
//   }
// });

// Get Phone Numbers with Number Keys for current user
// router.get('/phones/with-keys', authenticateToken, async (req, res) => {
//   try {
//     const userId = req.user.id;
//     
//     const query = `
//       SELECT p.id, p.phone_number, p.device_name, p.number_key, p.is_connected, 
//              p.created_at, p.updated_at, e.name as evolution_instance
//       FROM phone_numbers p
//       LEFT JOIN evolution_instances e ON p.evolution_instance_id = e.id
//       WHERE p.user_id = $1
//       ORDER BY p.created_at DESC
//     `;
//     const result = await db.query(query, [userId]);
//     
//     res.json({
//       status: 'success',
//       data: result.rows
//     });
//   } catch (error) {
//     console.error('Error fetching phone numbers with keys:', error);
//     res.status(500).json({ error: 'Failed to fetch phone numbers' });
//   }
// });

// Generate new Number Key for phone
// router.post('/phones/:id/generate-number-key', authenticateToken, async (req, res) => {
//   try {
//     const userId = req.user.id;
//     const phoneId = req.params.id;
//     
//     // First check if phone belongs to user
//     const checkQuery = 'SELECT id, phone_number FROM phone_numbers WHERE id = $1 AND user_id = $2';
//     const checkResult = await db.query(checkQuery, [phoneId, userId]);
//     
//     if (checkResult.rows.length === 0) {
//       return res.status(404).json({ error: 'Phone not found or not owned by user' });
//     }
//     
//     // Generate new number key
//     const phoneNumber = checkResult.rows[0].phone_number.replace(/\D/g, '').slice(0, 12);
//     const newNumberKey = `nk_${phoneNumber}_${phoneId}_${Date.now()}`;
//     
//     const updateQuery = 'UPDATE phone_numbers SET number_key = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING number_key, updated_at';
//     const result = await db.query(updateQuery, [newNumberKey, phoneId]);
//     
//     res.json({
//       status: 'success',
//       message: 'Number key generated successfully',
//       data: {
//         phone_id: phoneId,
//         phone_number: checkResult.rows[0].phone_number,
//         number_key: result.rows[0].number_key,
//         updated_at: result.rows[0].updated_at
//       }
//     });
//   } catch (error) {
//     console.error('Error generating number key:', error);
//     res.status(500).json({ error: 'Failed to generate number key' });
//   }
// });

module.exports = router;
