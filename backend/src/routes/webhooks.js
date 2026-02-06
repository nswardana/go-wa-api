const express = require('express');
const { body, query } = require('express-validator');
const webhookController = require('../controllers/webhookController');
const { phoneOwnership } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     WebhookEvent:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Event ID
 *         phone_number_id:
 *           type: integer
 *           description: Phone number ID
 *         event_type:
 *           type: string
 *           description: Type of event
 *         payload:
 *           type: object
 *           description: Event payload
 *         status:
 *           type: string
 *           enum: [pending, sent, failed]
 *           description: Event status
 *         retry_count:
 *           type: integer
 *           description: Number of retries
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Creation date
 *         sent_at:
 *           type: string
 *           format: date-time
 *           description: Sent date
 *     WebhookStats:
 *       type: object
 *       properties:
 *         total:
 *           type: integer
 *           description: Total events
 *         pending:
 *           type: integer
 *           description: Pending events
 *         sent:
 *           type: integer
 *           description: Sent events
 *         failed:
 *           type: integer
 *           description: Failed events
 *         deliveryRate:
 *           type: number
 *           description: Delivery rate percentage
 */

/**
 * @swagger
 * /api/webhooks/phone/{phoneId}/events:
 *   get:
 *     summary: Get webhook events for a phone number
 *     tags: [Webhooks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: phoneId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Phone number ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of events to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of events to skip
 *       - in: query
 *         name: eventType
 *         schema:
 *           type: string
 *         description: Filter by event type
 *     responses:
 *       200:
 *         description: Webhook events retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 events:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/WebhookEvent'
 *                 total:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 offset:
 *                   type: integer
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Phone number not found
 *       500:
 *         description: Internal server error
 */
router.get('/phone/:phoneId/events', [
  phoneOwnership,
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be a non-negative integer'),
  query('eventType')
    .optional()
    .isString()
    .withMessage('Event type must be a string')
], webhookController.getEvents);

/**
 * @swagger
 * /api/webhooks/phone/{phoneId}/stats:
 *   get:
 *     summary: Get webhook statistics for a phone number
 *     tags: [Webhooks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: phoneId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Phone number ID
 *     responses:
 *       200:
 *         description: Webhook statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 stats:
 *                   $ref: '#/components/schemas/WebhookStats'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Phone number not found
 *       500:
 *         description: Internal server error
 */
router.get('/phone/:phoneId/stats', [
  phoneOwnership
], webhookController.getStats);

/**
 * @swagger
 * /api/webhooks/phone/{phoneId}/test:
 *   post:
 *     summary: Test webhook endpoint for a phone number
 *     tags: [Webhooks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: phoneId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Phone number ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               webhookUrl:
 *                 type: string
 *                 format: uri
 *                 description: Custom webhook URL to test (optional)
 *     responses:
 *       200:
 *         description: Webhook test successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 statusCode:
 *                   type: integer
 *                 duration:
 *                   type: number
 *       400:
 *         description: Webhook test failed
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Phone number not found
 *       500:
 *         description: Internal server error
 */
router.post('/phone/:phoneId/test', [
  phoneOwnership,
  body('webhookUrl')
    .optional()
    .isURL({ protocols: ['http', 'https'] })
    .withMessage('Webhook URL must be a valid HTTP/HTTPS URL')
], webhookController.testWebhook);

/**
 * @swagger
 * /api/webhooks/phone/{phoneId}/retry:
 *   post:
 *     summary: Retry failed webhook events for a phone number
 *     tags: [Webhooks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: phoneId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Phone number ID
 *     responses:
 *       200:
 *         description: Failed webhooks queued for retry
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 retriedCount:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Phone number not found
 *       500:
 *         description: Internal server error
 */
router.post('/phone/:phoneId/retry', [
  phoneOwnership
], webhookController.retryFailed);

/**
 * @swagger
 * /api/webhooks/phone/{phoneId}/recent:
 *   get:
 *     summary: Get recent webhook events for a phone number
 *     tags: [Webhooks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: phoneId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Phone number ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of recent events to return
 *     responses:
 *       200:
 *         description: Recent webhook events retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 events:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/WebhookEvent'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Phone number not found
 *       500:
 *         description: Internal server error
 */
router.get('/phone/:phoneId/recent', [
  phoneOwnership,
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50')
], webhookController.getRecentEvents);

/**
 * @swagger
 * /api/webhooks/queue/status:
 *   get:
 *     summary: Get webhook queue status
 *     tags: [Webhooks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Queue status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 queue:
 *                   type: object
 *                   properties:
 *                     queueLength:
 *                       type: integer
 *                     processing:
 *                       type: boolean
 *                     batchSize:
 *                       type: integer
 *                     processInterval:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/queue/status', webhookController.getQueueStatus);

/**
 * @swagger
 * /api/webhooks/cleanup:
 *   post:
 *     summary: Cleanup old webhook events
 *     tags: [Webhooks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               days:
 *                 type: integer
 *                 default: 30
 *                 minimum: 1
 *                 maximum: 365
 *                 description: Delete events older than this many days
 *     responses:
 *       200:
 *         description: Old webhook events cleaned up successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 deletedCount:
 *                   type: integer
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/cleanup', [
  body('days')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Days must be between 1 and 365')
], webhookController.cleanupEvents);

module.exports = router;
