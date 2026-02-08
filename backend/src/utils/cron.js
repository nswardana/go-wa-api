const scheduleService = require('../services/scheduleService');
const logger = require('../utils/logger');

// Process scheduled messages every minute
const processScheduledMessages = async () => {
  try {
    const processedCount = await scheduleService.processScheduledMessages();
    
    if (processedCount > 0) {
      logger.info(`Processed ${processedCount} scheduled messages`);
    }
  } catch (error) {
    logger.error('Failed to process scheduled messages:', error);
  }
};

// Start the cron job
const startCronJobs = () => {
  // Process scheduled messages every minute
  setInterval(processScheduledMessages, 60 * 1000);
  
  logger.info('Cron jobs started - Processing scheduled messages every minute');
};

module.exports = {
  startCronJobs,
  processScheduledMessages
};
