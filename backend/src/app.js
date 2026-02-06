const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const WebSocket = require('ws');
const http = require('http');
require('dotenv').config();

const config = require('./config/database');
const logger = require('./utils/logger');
const { auth: authMiddleware } = require('./middleware/auth');
const errorHandler = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/auth');
const simpleAuthRoutes = require('./routes/simpleAuth');
const userRoutes = require('./routes/users');
const phoneRoutes = require('./routes/phones');
const messageRoutes = require('./routes/messages');
const webhookRoutes = require('./routes/webhooks');
const statsRoutes = require('./routes/stats');

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Security middleware
app.use(helmet());
app.use(compression());

// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://evolution-api.beeasy.id', 'https://manager.evolution-api.beeasy.id']
    : true,
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Swagger documentation
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Evolution API Backend',
      version: '1.0.0',
      description: 'Multi-tenancy WhatsApp API SaaS Backend',
      contact: {
        name: 'Evolution API Team',
        email: 'support@beeasy.id'
      }
    },
    servers: [
      {
        url: process.env.SERVER_URL || 'http://localhost:8090',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: ['./src/routes/*.js', './src/controllers/*.js']
};

const specs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/simple-auth', simpleAuthRoutes);
app.use('/api/users', authMiddleware, userRoutes);
app.use('/api/phones', authMiddleware, phoneRoutes);
app.use('/api/messages', authMiddleware, messageRoutes);
app.use('/api/webhooks', authMiddleware, webhookRoutes);
app.use('/api/stats', authMiddleware, statsRoutes);

// Public webhook endpoint (no auth required)
app.use('/webhook', require('./routes/publicWebhook'));

// WebSocket for real-time updates
const wss = new WebSocket.Server({ server, path: '/ws' });

wss.on('connection', (ws, req) => {
  logger.info('WebSocket client connected');
  
  // Extract token from query params or headers
  const token = req.url.includes('token=') 
    ? req.url.split('token=')[1].split('&')[0]
    : req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    ws.close(1008, 'Authentication required');
    return;
  }
  
  // Verify token and associate with user
  // This will be implemented in the auth service
  ws.userId = null; // Will be set after token verification
  
  ws.on('message', (message) => {
    logger.info('Received WebSocket message:', message.toString());
  });
  
  ws.on('close', () => {
    logger.info('WebSocket client disconnected');
  });
  
  ws.on('error', (error) => {
    logger.error('WebSocket error:', error);
  });
});

// Broadcast function for real-time updates
global.broadcast = (userId, data) => {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN && client.userId === userId) {
      client.send(JSON.stringify(data));
    }
  });
};

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl
  });
});

// Start server
const PORT = process.env.PORT || 8090;

server.listen(PORT, () => {
  logger.info(`Evolution API Backend running on port ${PORT}`);
  logger.info(`API Documentation: http://localhost:${PORT}/api-docs`);
  logger.info(`WebSocket: ws://localhost:${PORT}/ws`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

module.exports = app;
