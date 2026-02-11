const Queue = require('bull');
const { redis } = require('../config/database');
const logger = require('../utils/logger');

// Create broadcast queue
const broadcastQueue = new Queue('broadcast processing', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    db: 0
  },
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    }
  }
});

// Queue event listeners
broadcastQueue.on('completed', (job, result) => {
  logger.info(`Broadcast job ${job.id} completed:`, result);
});

broadcastQueue.on('failed', (job, err) => {
  logger.error(`Broadcast job ${job.id} failed:`, err);
});

broadcastQueue.on('progress', (job, progress) => {
  logger.info(`Broadcast job ${job.id} progress: ${progress}%`);
});

// Add broadcast job
const addBroadcastJob = async (broadcastId, action = 'start') => {
  try {
    const job = await broadcastQueue.add('process-broadcast', {
      broadcastId,
      action,
      timestamp: new Date().toISOString()
    }, {
      priority: 1,
      delay: 0,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000
      }
    });

    logger.info(`Broadcast job added: ${job.id} for broadcast ${broadcastId}`);
    return job;
  } catch (error) {
    logger.error('Error adding broadcast job:', error);
    throw error;
  }
};

// Get queue status
const getQueueStatus = async () => {
  try {
    const waiting = await broadcastQueue.getWaiting();
    const active = await broadcastQueue.getActive();
    const completed = await broadcastQueue.getCompleted();
    const failed = await broadcastQueue.getFailed();

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length
    };
  } catch (error) {
    logger.error('Error getting queue status:', error);
    throw error;
  }
};

// Pause queue
const pauseQueue = async () => {
  try {
    await broadcastQueue.pause();
    logger.info('Broadcast queue paused');
  } catch (error) {
    logger.error('Error pausing queue:', error);
    throw error;
  }
};

// Resume queue
const resumeQueue = async () => {
  try {
    await broadcastQueue.resume();
    logger.info('Broadcast queue resumed');
  } catch (error) {
    logger.error('Error resuming queue:', error);
    throw error;
  }
};

// Clear queue
const clearQueue = async () => {
  try {
    await broadcastQueue.clean(0, 'completed');
    await broadcastQueue.clean(0, 'failed');
    logger.info('Broadcast queue cleaned');
  } catch (error) {
    logger.error('Error clearing queue:', error);
    throw error;
  }
};

// Get job by id
const getJob = async (jobId) => {
  try {
    const job = await broadcastQueue.getJob(jobId);
    return job;
  } catch (error) {
    logger.error('Error getting job:', error);
    throw error;
  }
};

// Cancel job
const cancelJob = async (jobId) => {
  try {
    const job = await broadcastQueue.getJob(jobId);
    if (job) {
      await job.remove();
      logger.info(`Broadcast job ${jobId} cancelled`);
      return true;
    }
    return false;
  } catch (error) {
    logger.error('Error cancelling job:', error);
    throw error;
  }
};

module.exports = {
  broadcastQueue,
  addBroadcastJob,
  getQueueStatus,
  pauseQueue,
  resumeQueue,
  clearQueue,
  getJob,
  cancelJob
};
