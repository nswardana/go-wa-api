const express = require('express');
const router = express.Router();
const broadcastController = require('../controllers/broadcastController');
const { auth: authMiddleware } = require('../middleware/auth');

// Broadcast Routes
router.get('/', authMiddleware, broadcastController.getBroadcasts);
router.post('/', authMiddleware, broadcastController.createBroadcast);
router.get('/queue', authMiddleware, broadcastController.getQueueStatus); // Add queue status route
router.get('/:id', authMiddleware, broadcastController.getBroadcast);
router.put('/:id', authMiddleware, broadcastController.updateBroadcast);
router.delete('/:id', authMiddleware, broadcastController.deleteBroadcast);

// Broadcast Control Routes
router.post('/:id/start', authMiddleware, broadcastController.startBroadcast);
router.post('/:id/pause', authMiddleware, broadcastController.pauseBroadcast);
router.post('/:id/stop', authMiddleware, broadcastController.stopBroadcast);
router.get('/:id/progress', authMiddleware, broadcastController.getBroadcastProgress);
router.get('/:id/messages', authMiddleware, broadcastController.getBroadcastMessages);
router.post('/:id/test', authMiddleware, broadcastController.testBroadcast);

module.exports = router;
