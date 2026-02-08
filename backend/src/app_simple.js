const express = require('express');
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

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-API-Key');
  res.header('Access-Control-Expose-Headers', 'X-Total-Count');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Health check
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

// Public webhook endpoint (no auth required)
app.use('/webhook', require('./routes/publicWebhook'));

// WebSocket for real-time updates
const io = require('socket.io')(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  logger.info('WebSocket client connected');
  
  socket.on('join-user-room', (userId) => {
    socket.join('user-' + userId);
    logger.info('User ' + userId + ' joined room');
  });
  
  socket.on('disconnect', () => {
    logger.info('WebSocket client disconnected');
  });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl
  });
});

const PORT = process.env.PORT || 8090;

server.listen(PORT, () => {
  logger.info('Server running on port ' + PORT);
});

module.exports = app;
