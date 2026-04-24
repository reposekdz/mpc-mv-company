const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

const allowedOrigins = [
  'http://localhost:5000',
  'http://localhost:5173',
  'http://127.0.0.1:5000',
  'http://127.0.0.1:5173',
  'http://[::1]:5000',
  'http://[::1]:5173',
  process.env.FRONTEND_URL,
  ...(process.env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean),
].filter(Boolean);

// Auto-allow common deploy hosts so adding a new Vercel/Render preview "just works"
const isTrustedHostedOrigin = (origin) => {
  if (!origin) return false;
  try {
    const { hostname } = new URL(origin);
    return (
      hostname.endsWith('.replit.dev') ||
      hostname.endsWith('.replit.app') ||
      hostname.endsWith('.repl.co') ||
      hostname.endsWith('.vercel.app') ||
      hostname.endsWith('.onrender.com')
    );
  } catch {
    return false;
  }
};

const corsOptions = {
  origin: (origin, callback) => {
    // Allow same-origin / curl / mobile (no Origin header)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || isTrustedHostedOrigin(origin)) {
      return callback(null, true);
    }
    if (NODE_ENV !== 'production') return callback(null, true);
    console.warn(`CORS blocked origin: ${origin}`);
    callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
};

app.use(cors(corsOptions));
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));
app.use(morgan(NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again after 15 minutes',
    timestamp: new Date().toISOString()
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

app.use('/api/', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

const { pool } = require('./config/db');

// ─── Root & Health ────────────────────────────────────────────────────────────
app.get('/api/', (req, res) => {
  res.json({
    message: 'MOC-MV Company API',
    version: '2.0.0',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1 + 1 AS result');
    res.json({ status: 'healthy', database: 'connected', timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ status: 'unhealthy', error: error.message });
  }
});

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/jobs', require('./routes/jobs'));
app.use('/api/trucks', require('./routes/trucks'));
app.use('/api/employees', require('./routes/employees'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/consulting', require('./routes/consulting'));
app.use('/api/meetings', require('./routes/meetings'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/contact', require('./routes/contact'));
app.use('/api/uploads', require('./routes/uploads'));

// ─── Serve React Frontend ─────────────────────────────────────────────────────
const distPath = path.join(__dirname, '../../dist');
if (NODE_ENV === 'production' && fs.existsSync(distPath)) {
  app.use(express.static(distPath, {
    maxAge: '1d',
    etag: true,
  }));
}

// ─── API 404 Handler ──────────────────────────────────────────────────────────
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'API route not found',
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  });
});

// ─── SPA Catch-all ────────────────────────────────────────────────────────────
if (NODE_ENV === 'production' && fs.existsSync(distPath)) {
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
    timestamp: new Date().toISOString(),
    ...(NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ─── Socket.io Server ─────────────────────────────────────────────────────────
const { Server } = require('socket.io');
const http = require('http');
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin) || isTrustedHostedOrigin(origin) || NODE_ENV !== 'production') {
        return callback(null, true);
      }
      callback(null, false);
    },
    methods: ['GET', 'POST'],
    credentials: true,
    allowedHeaders: ['Authorization', 'Content-Type'],
  },
  transports: ['polling', 'websocket'],
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Attach io to app so controllers can emit events
app.set('io', io);

io.on('connection', (socket) => {
  console.log(`👤 Socket connected: ${socket.id}`);

  socket.on('join-room', (room) => {
    socket.join(room);
    console.log(`Socket ${socket.id} joined: ${room}`);
  });

  // Real-time truck GPS updates
  socket.on('truck-update', (data) => {
    io.emit('truck-updated', data);
  });

  // Job progress updates
  socket.on('job-progress', (data) => {
    io.to('managers').emit('job-updated', data);
    io.to('admins').emit('job-updated', data);
  });

  socket.on('send-notification', (data) => {
    if (data.userId) {
      io.to(data.userId).emit('notification', data);
    } else {
      io.to('managers').emit('notification', data);
      io.to('admins').emit('notification', data);
    }
  });

  socket.on('disconnect', () => {
    console.log(`👤 Socket disconnected: ${socket.id}`);
  });
});

// Helper: broadcast to all admins & managers
app.broadcastToManagers = (event, data) => {
  io.to('managers').emit(event, data);
  io.to('admins').emit(event, data);
};

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server + Socket.io running on port ${PORT}`);
  console.log(`📊 Environment: ${NODE_ENV}`);
  console.log(`🔗 API URL: http://localhost:${PORT}/api`);
  console.log(`🔌 Socket.io: http://localhost:${PORT}`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received: shutting down gracefully');
  server.close(() => { console.log('Server closed'); process.exit(0); });
});

process.on('SIGINT', () => {
  console.log('SIGINT received: shutting down gracefully');
  server.close(() => { console.log('Server closed'); process.exit(0); });
});

module.exports = { app, io };
