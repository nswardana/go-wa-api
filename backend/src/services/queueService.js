const Queue = require('bull');
const logger = require('../utils/logger');

// Check if development mode
const isDevelopment = process.env.NODE_ENV === 'development';

// Create broadcast queue with environment-specific Redis config
const broadcastQueue = new Queue('broadcast processing', {
  redis: {
    host: isDevelopment ? 'localhost' : 'chatflow-redis', // Development: localhost, Production: service name
    port: 6379,
    db: 0,
    maxRetriesPerRequest: 3,
    retryDelayOnFailover: 100
  },
  defaultJobOptions: {
    removeOnComplete: 10,
    removeOnFail: 50,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    }
  }
});

// Queue events
broadcastQueue.on('completed', (job, result) => {
  logger.info(`Broadcast job completed`, { 
    jobId: job.id, 
    broadcastId: job.data.broadcastId,
    result 
  });
});

broadcastQueue.on('failed', (job, err) => {
  logger.error(`Broadcast job failed`, { 
    jobId: job.id, 
    broadcastId: job.data.broadcastId,
    error: err.message 
  });
});

broadcastQueue.on('stalled', (job) => {
  logger.warn(`Broadcast job stalled`, { 
    jobId: job.id, 
    broadcastId: job.data.broadcastId 
  });
});

// Graceful shutdown
const gracefulShutdown = async () => {
  logger.info('Closing queue...');
  await broadcastQueue.close();
  process.exit(0);
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

module.exports = {
  broadcastQueue
};
