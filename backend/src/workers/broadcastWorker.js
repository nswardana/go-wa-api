const { broadcastQueue } = require('../services/queueService');
const { sendWhatsAppMessage } = require('./messageSender');
const { db } = require('../config/database');
const logger = require('../utils/logger');

// Import socket.io instance (will be set from app.js)
let io = null;

const setSocketIO = (socketIOInstance) => {
  io = socketIOInstance;
};

const emitProgress = (broadcastId, data) => {
  if (io) {
    io.emit('broadcast-progress', {
      broadcastId,
      timestamp: new Date().toISOString(),
      ...data
    });
  }
};

// Process broadcast job
broadcastQueue.process('send-broadcast', async (job) => {
  const { broadcastId, recipients, message, senderPhones } = job.data;
  
  logger.info(`Processing broadcast job`, { 
    jobId: job.id, 
    broadcastId,
    recipientCount: recipients.length,
    senderCount: senderPhones.length 
  });

  let sentCount = 0;
  let failedCount = 0;
  let pendingCount = recipients.length;

  // Update broadcast status to processing
  await db.query(
    'UPDATE broadcasts SET status = $1, updated_at = NOW() WHERE id = $2',
    ['processing', broadcastId]
  );

  // Emit initial progress
  emitProgress(broadcastId, {
    status: 'started',
    totalRecipients: recipients.length,
    sentCount: 0,
    failedCount: 0,
    pendingCount: recipients.length
  });

  // Process each recipient
  for (let i = 0; i < recipients.length; i++) {
    const recipient = recipients[i];
    
    try {
      // Update job progress
      job.progress((i / recipients.length) * 100);

      // Try each sender phone until one succeeds
      let messageSent = false;
      let lastError = null;

      for (const senderPhone of senderPhones) {
        const result = await sendWhatsAppMessage(recipient, message, senderPhone);
        
        if (result.success) {
          sentCount++;
          pendingCount--;
          messageSent = true;

          // Update recipient status in database
          await db.query(
            'INSERT INTO broadcast_recipients (broadcast_id, contact_id, status, sent_at, message_id) VALUES ($1, $2, $3, NOW(), $4) ON CONFLICT (broadcast_id, contact_id) DO UPDATE SET status = $3, sent_at = NOW(), message_id = $4',
            [broadcastId, recipient.id, 'sent', result.messageId]
          );

          emitProgress(broadcastId, {
            status: 'recipient-sent',
            recipient: {
              id: recipient.id,
              name: recipient.name,
              phone: recipient.phone
            },
            sentCount,
            failedCount,
            pendingCount,
            progress: Math.round((sentCount / recipients.length) * 100)
          });

          break;
        } else {
          lastError = result.error;
        }
      }

      if (!messageSent) {
        failedCount++;
        pendingCount--;

        // Update recipient status as failed
        await db.query(
          'INSERT INTO broadcast_recipients (broadcast_id, contact_id, status, failed_at, error_message) VALUES ($1, $2, $3, NOW(), $4) ON CONFLICT (broadcast_id, contact_id) DO UPDATE SET status = $3, failed_at = NOW(), error_message = $4',
          [broadcastId, recipient.id, 'failed', lastError]
        );

        emitProgress(broadcastId, {
          status: 'recipient-failed',
          recipient: {
            id: recipient.id,
            name: recipient.name,
            phone: recipient.phone
          },
          error: lastError,
          sentCount,
          failedCount,
          pendingCount,
          progress: Math.round((sentCount / recipients.length) * 100)
        });
      }

      // Add delay between messages to avoid rate limiting
      if (i < recipients.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
      }

    } catch (error) {
      failedCount++;
      pendingCount--;

      logger.error(`Error processing recipient`, {
        broadcastId,
        recipientId: recipient.id,
        error: error.message
      });

      emitProgress(broadcastId, {
        status: 'recipient-error',
        recipient: {
          id: recipient.id,
          name: recipient.name,
          phone: recipient.phone
        },
        error: error.message,
        sentCount,
        failedCount,
        pendingCount,
        progress: Math.round((sentCount / recipients.length) * 100)
      });
    }
  }

  // Update final broadcast status
  const finalStatus = failedCount === 0 ? 'completed' : 'completed_with_errors';
  await db.query(
    'UPDATE broadcasts SET status = $1, sent_count = $2, failed_count = $3, completed_at = NOW() WHERE id = $4',
    [finalStatus, sentCount, failedCount, broadcastId]
  );

  // Emit final progress
  emitProgress(broadcastId, {
    status: 'completed',
    totalRecipients: recipients.length,
    sentCount,
    failedCount,
    pendingCount: 0,
    progress: 100
  });

  logger.info(`Broadcast job completed`, {
    jobId: job.id,
    broadcastId,
    sentCount,
    failedCount,
    finalStatus
  });

  return {
    success: true,
    sentCount,
    failedCount,
    totalRecipients: recipients.length
  };
});

module.exports = {
  setSocketIO,
  emitProgress
};
