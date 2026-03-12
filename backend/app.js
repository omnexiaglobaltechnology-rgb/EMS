const express = require('express');
const path = require('path');
const { connectDB, mongoose } = require('./config/db');
const app = express();

let dbError = null;
// Store the DB connection promise so middleware can await it
const dbReady = connectDB().catch((err) => {
  console.error('[app.js] Database connection failed:', err.message);
  dbError = err.message;
});

// CORS middleware FIRST (handles OPTIONS preflight without waiting for DB)
app.use((req, res, next) => {
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'https://ems-frontend-eight-lilac.vercel.app',
    'https://ems-adminpanal.vercel.app',
  ];
  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }

  res.header(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, PATCH, DELETE, OPTIONS'
  );
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
});

app.use(express.json());

// Health check route with versioning and DB status (no DB wait)
app.get('/', (req, res) => {
  res.json({
    status: 'OWMS Backend Running',
    version: '2.0.0',
    db_connected: mongoose.connection.readyState === 1,
    db_error: dbError,
  });
});

// Middleware: wait for DB to be connected before handling API requests
app.use(async (req, res, next) => {
  try {
    await dbReady;
    next();
  } catch (err) {
    res.status(503).json({ error: 'Database is not available' });
  }
});

// Request logging middleware
app.use((req, res, next) => {
  const now = new Date().toISOString();
  console.log(`[${now}] ${req.method} ${req.path}`);
  next();
});

// Expose uploads with proper headers for downloads
app.use('/uploads', (req, res, next) => {
  console.log(`[uploads] Serving file: ${req.path}`);
  res.header('Content-Disposition', 'inline');
  res.header('Cache-Control', 'public, max-age=3600');
  express.static(path.join(__dirname, 'uploads'))(req, res, next);
});

const taskRoutes = require('./modules/tasks/task.routes');
const submissionsRoutes = require('./modules/submissions/submissions.routes');
const authRoutes = require('./modules/auth/auth.routes');
const trackingRoutes = require('./modules/tracking/tracking.routes');

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/submissions', submissionsRoutes);
app.use('/api/tracking', trackingRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[error-handler] Caught error:', err.message);
  console.error('[error-handler] Stack:', err.stack);
  res.status(err.status || 500).json({
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});

module.exports = app;
