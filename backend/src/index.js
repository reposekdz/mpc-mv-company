const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Middleware
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://[::1]:5173',
  process.env.FRONTEND_URL
].filter(Boolean);

const isReplitOrigin = (origin) => {
  if (!origin) return false;
  return origin.endsWith('.replit.dev') || origin.endsWith('.replit.app') || origin.endsWith('.repl.co');
};

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || isReplitOrigin(origin) || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));
app.use(helmet());
app.use(morgan(NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again after 15 minutes',
    timestamp: new Date().toISOString()
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Cache control middleware - no cache for dynamic API responses
app.use('/api/', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
});

// Database connection test
const { pool } = require('./config/db');

// Root API endpoint
app.get('/api/', (req, res) => {
  res.json({
    message: 'MOC-MV Company API',
    version: '1.0.0',
    documentation: 'API documentation available at /api/docs',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      jobs: '/api/jobs',
      trucks: '/api/trucks',
      employees: '/api/employees',
      reports: '/api/reports',
      consulting: '/api/consulting',
      meetings: '/api/meetings',
      analytics: '/api/analytics',
      contact: '/api/contact'
    },
    features: [
      'Pagination, sorting, filtering',
      'Bulk operations',
      'Rate limiting',
      'Input validation',
      'Authentication & Authorization',
      'Comprehensive error handling'
    ],
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1 + 1 AS result');
    res.json({ 
      status: 'healthy', 
      database: 'connected', 
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({ status: 'unhealthy', error: error.message });
  }
});

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/jobs', require('./routes/jobs'));
app.use('/api/trucks', require('./routes/trucks'));
app.use('/api/employees', require('./routes/employees'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/consulting', require('./routes/consulting'));
app.use('/api/meetings', require('./routes/meetings'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/contact', require('./routes/contact'));

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  const status = err.status || 500;
  const message = err.message || 'Internal server error';
  
  res.status(status).json({
    success: false,
    error: message,
    timestamp: new Date().toISOString(),
    ...(NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
const { Server } = require('socket.io');
const http = require('http');
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT'],
    credentials: true
  }
});

// Socket.io events for real-time features
io.on('connection', (socket) => {
  console.log('👤 User connected:', socket.id);

  // Join rooms by role/user
  socket.on('join-room', (room) => {
    socket.join(room);
    console.log(`User ${socket.id} joined room: ${room}`);
  });

  // Real-time truck GPS updates
  socket.on('truck-update', (data) => {
    io.emit('truck-updated', data);
  });

  // Job progress updates
  socket.on('job-progress', (data) => {
    io.to('managers').emit('job-updated', data);
  });

  // New notifications
  socket.on('send-notification', (data) => {
    io.to(data.userId).emit('notification', data);
  });

  socket.on('disconnect', () => {
    console.log('👤 User disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Server + Socket.io running on port ${PORT}`);
  console.log(`📊 Environment: ${NODE_ENV}`);
  console.log(`🔗 API URL: http://localhost:${PORT}/api`);
  console.log(`🔌 Socket.io: http://localhost:${PORT}`);
});


// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received: shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received: shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

module.exports = app;
