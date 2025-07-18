const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');

// Load environment variables
dotenv.config();

// Import routes, middleware, and database
const resumeRoutes = require('./src/routes/resumeRoutes');
const authRoutes = require('./src/routes/authRoutes');
const { authenticateToken } = require('./src/middleware/authMiddleware');
const { sequelize } = require('./models');

// Initialize express app
const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000', // Frontend URL from .env
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Handle preflight requests
app.options('*', cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // Parse cookies

// Log all requests for debugging
// app.use((req, res, next) => {
//   console.log(`${req.method} ${req.url}`);
//   console.log('Headers:', req.headers);
//   next();
// });

// Serve static files from resume_uploads directory
app.use('/resume_uploads', express.static('resume_uploads'));

// Auth routes (unprotected)
app.use('/api', authRoutes);

// Protected routes (require authentication)
app.use('/v1/resume', authenticateToken, resumeRoutes);

// Default route
app.post('/', (req, res) => {
  res.send('Resume Upload API is running');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Initialize the database and start server
const startServer = async () => {
  // Start the server regardless of database connection status
  const PORT = process.env.PORT || 8000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use`);
    } else {
      console.error('Server error:', err);
    }
    process.exit(1);
  });
};

// Start the server
startServer();

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('SIGINT signal received. Shutting down gracefully...');
  await sequelize.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received. Shutting down gracefully...');
  await sequelize.close();
  process.exit(0);
});

process.on('uncaughtException', async (error) => {
  console.error('Uncaught Exception:', error);
  await sequelize.close();
  process.exit(1);
});

process.on('unhandledRejection', async (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  await sequelize.close();
  process.exit(1);
});