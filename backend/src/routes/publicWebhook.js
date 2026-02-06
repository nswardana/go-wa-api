const express = require('express');
const webhookController = require('../controllers/webhookController');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// Rate limiting for public webhook endpoint
const webhookRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // limit each IP to 100 requests per minute
  message: {
    error: 'Too many webhook requests',
    message: 'Please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * @swagger
 * /webhook:
 *   post:
 *     summary: Receive webhook from Evolution API
 *     tags: [Public Webhooks]
 *     description: |
 *       This endpoint receives webhooks from Evolution API instances.
 *       It processes various event types including messages, connection status, and group events.
 *       
 *       **Headers:**
 *       - `X-Webhook-Signature`: HMAC SHA256 signature for webhook verification
 *       - `X-Phone-Token`: Phone token for identification (alternative to payload)
 *       
 *       **Event Types:**
 *       - `message`: New message received
 *       - `message.ack`: Message acknowledgment
 *       - `message.reaction`: Message reaction
 *       - `connection.status`: Connection status change
 *       - `group.participants`: Group participant changes
 *       - `group.joined`: Group joined
 *       - `group.left`: Group left
 *     
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               event:
 *                 type: string
 *                 description: Event type
 *                 example: "message"
 *               phoneToken:
 *                 type: string
 *                 description: Phone token for identification
 *                 example: "token_123456789"
 *               data:
 *                 type: object
 *                 description: Event data (varies by event type)
 *                 properties:
 *                   id:
 *                     type: string
 *                     description: Message ID
 *                   from:
 *                     type: string
 *                     description: Sender phone number
 *                   to:
 *                     type: string
 *                     description: Recipient phone number
 *                   type:
 *                     type: string
 *                     description: Message type
 *                     enum: [text, image, video, audio, document]
 *                   body:
 *                     type: string
 *                     description: Message content
 *                   timestamp:
 *                     type: string
 *                     format: date-time
 *                     description: Message timestamp
 *             required:
 *               - event
 *               - data
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 eventId:
 *                   type: integer
 *                   description: Internal event ID
 *                   example: 12345
 *                 message:
 *                   type: string
 *                   example: "Webhook processed successfully"
 *       400:
 *         description: Bad request - Invalid payload or missing phone token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Invalid payload"
 *                 message:
 *                   type: string
 *                   example: "Payload must be a valid JSON object"
 *       401:
 *         description: Unauthorized - Invalid phone token or signature
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Phone not found"
 *                 message:
 *                   type: string
 *                   example: "Invalid phone token"
 *       404:
 *         description: Phone number not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Phone not found"
 *                 message:
 *                   type: string
 *                   example: "Invalid phone token"
 *       429:
 *         description: Too many requests
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Too many webhook requests"
 *                 message:
 *                   type: string
 *                   example: "Please try again later"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 *                 message:
 *                   type: string
 *                   example: "Failed to process webhook"
 */
router.post('/', webhookRateLimit, webhookController.handleWebhook);

/**
 * @swagger
 * /webhook/health:
 *   get:
 *     summary: Webhook endpoint health check
 *     tags: [Public Webhooks]
 *     description: Health check endpoint for webhook service
 *     responses:
 *       200:
 *         description: Webhook service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "healthy"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-01T12:00:00.000Z"
 *                 service:
 *                   type: string
 *                   example: "webhook-receiver"
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'webhook-receiver'
  });
});

module.exports = router;
