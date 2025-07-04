const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const fs = require('fs').promises;
const path = require('path');
dotenv.config();

// Database connection objects
let db = null;
let pool = null;

// Create database connection
const connectDB = async () => {
  try {
    // First connect without specifying a database to check if it exists
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT || 3306
    });
    
    // Create database if it doesn't exist
    const dbName = process.env.DB_NAME || 'resume_analytics';
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${dbName}`);
    await connection.end();
    
    // Create a connection pool for better performance and reliability
    pool = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: dbName,
      port: process.env.DB_PORT || 3306,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
    
    // Get a connection from the pool
    db = await pool.getConnection();
    
    // Initialize database tables
    await initializeTables();
    
    console.log('Database connection established successfully');
    return db;
  } catch (error) {
    console.error('Database connection failed:', error);
    throw error;
  }
};

// Initialize database tables
const initializeTables = async () => {
  try {
    // Get a connection from the pool
    const connection = await pool.getConnection();
    
    try {
      // Create resumes_uploaded table if it doesn't exist
      await connection.query(`
        CREATE TABLE IF NOT EXISTS resumes_uploaded (
          resumes_uploaded_id INT PRIMARY KEY AUTO_INCREMENT,
          resume_html LONGTEXT NOT NULL,
          resume_name VARCHAR(255) NOT NULL,
          created_at DATETIME NOT NULL,
          updated_at DATETIME NOT NULL,
          uploaded_by VARCHAR(255) NOT NULL
        )
      `);
      
      // Add indexes if they don't exist
      // Check if index exists before creating it
      const [indexes] = await connection.query(`SHOW INDEX FROM resumes_uploaded`);
      const indexNames = indexes.map(index => index.Key_name);
      
      if (!indexNames.includes('idx_resume_name')) {
        await connection.query(`CREATE INDEX idx_resume_name ON resumes_uploaded(resume_name)`);
      }
      
      if (!indexNames.includes('idx_uploaded_at')) {
        await connection.query(`CREATE INDEX idx_uploaded_at ON resumes_uploaded(created_at)`);
      }
      
      console.log('Database tables initialized successfully');
    } finally {
      // Always release the connection back to the pool
      connection.release();
    }
  } catch (error) {
    console.error('Error initializing database tables:', error);
    throw error;
  }
};

// Get database connection
const getDB = async () => {
  if (!pool) {
    throw new Error('Database pool not initialized. Call connectDB() first.');
  }
  try {
    // Return the pool for query execution
    return pool;
  } catch (error) {
    console.error('Error getting database connection:', error);
    throw error;
  }
};

// Check if database is connected
const isConnected = async () => {
  if (!pool) {
    return false;
  }
  
  try {
    // Get a connection from the pool and ping it
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release(); // Release the connection back to the pool
    return true;
  } catch (error) {
    console.error('Database connection check failed:', error);
    return false;
  }
};

// Close database connection
const closeConnection = async () => {
  if (pool) {
    try {
      await pool.end();
      console.log('Database connection pool closed');
    } catch (error) {
      console.error('Error closing database connection pool:', error);
      throw error;
    }
  }
};

// Export the database connection and functions
module.exports = { 
  connectDB,
  initializeTables,
  getDB,
  isConnected,
  closeConnection,
  // For backward compatibility, define a getter for db
  // Note: This is a synchronous getter but returns a Promise
  // Use await getDB() instead for proper async handling
  get db() {
    if (!pool) {
      throw new Error('Database pool not initialized. Call connectDB() first.');
    }
    return pool;
  }
};
