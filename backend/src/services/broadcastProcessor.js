const { broadcastQueue } = require('./broadcastQueueService');
const broadcastWorker = require('./broadcastWorker');
const logger = require('../utils/logger');

// Process broadcast jobs
broadcastQueue.process('process-broadcast', async (job) => {
  const { broadcastId, action } = job.data;
  
  logger.info(`Processing broadcast job: ${job.id}, action: ${action}, broadcast: ${broadcastId}`);
  
  try {
    switch (action) {
      case 'start':
        return await broadcastWorker.processBroadcast(broadcastId);
        
      case 'pause':
        await broadcastWorker.pauseBroadcast(broadcastId);
        return { success: true, action: 'paused' };
        
      case 'resume':
        await broadcastWorker.resumeBroadcast(broadcastId);
        return { success: true, action: 'resumed' };
        
      case 'stop':
        await broadcastWorker.stopBroadcast(broadcastId);
        return { success: true, action: 'stopped' };
        
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    logger.error(`Error processing broadcast job ${job.id}:`, error);
    throw error;
  }
});

// Update job progress
const updateJobProgress = async (jobId, progress) => {
  try {
    const job = await broadcastQueue.getJob(jobId);
    if (job) {
      await job.progress(progress);
    }
  } catch (error) {
    logger.error('Error updating job progress:', error);
  }
};

// Handle queue events
broadcastQueue.on('progress', (job, progress) => {
  logger.info(`Job ${job.id} progress: ${progress}%`);
});

broadcastQueue.on('completed', (job, result) => {
  logger.info(`Job ${job.id} completed:`, result);
});

broadcastQueue.on('failed', (job, err) => {
  logger.error(`Job ${job.id} failed:`, err);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down gracefully...');
  await broadcastQueue.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down gracefully...');
  await broadcastQueue.close();
  process.exit(0);
});

module.exports = {
  broadcastQueue,
  updateJobProgress
};
