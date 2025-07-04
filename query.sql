-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS resume_analytics;

-- Use the database
USE resume_analytics;

-- Create resumes_uploaded table
CREATE TABLE IF NOT EXISTS resumes_uploaded (
  resumes_uploaded_id INT PRIMARY KEY AUTO_INCREMENT,
  resume_html LONGTEXT NOT NULL,
  resume_name VARCHAR(255) NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  uploaded_by VARCHAR(255) NOT NULL
);

-- Add index for faster queries
CREATE INDEX idx_resume_name ON resumes_uploaded(resume_name);
CREATE INDEX idx_uploaded_at ON resumes_uploaded(created_at);