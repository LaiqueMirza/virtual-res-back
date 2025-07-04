const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import routes and database
const resumeRoutes = require('./routes/resumeRoutes');
const { connectDB, getDB, isConnected, closeConnection } = require('./config/database');

// Initialize express app
const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:3000', // Frontend URL
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/v1/resume', resumeRoutes);

// Default route
app.get('/', (req, res) => {
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
  try {
    // Ensure database is connected before starting the server
    await connectDB();
    
    // Verify database connection
    const connected = await isConnected();
    if (!connected) {
      throw new Error('Database connection verification failed');
    }
    
    console.log('Database connection established and verified successfully');
    
    // Start the server
    const PORT = process.env.PORT || 8000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Database connection failed:", error);
    process.exit(1);
  }
};

// Start the server
startServer();

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('SIGINT signal received. Shutting down gracefully...');
  await closeConnection();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received. Shutting down gracefully...');
  await closeConnection();
  process.exit(0);
});

process.on('uncaughtException', async (error) => {
  console.error('Uncaught Exception:', error);
  await closeConnection();
  process.exit(1);
});

process.on('unhandledRejection', async (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  await closeConnection();
  process.exit(1);
});