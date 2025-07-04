# Resume Upload API

A Node.js and Express.js backend application that handles resume uploads, converts documents to HTML, and stores them in a MySQL database.

## Features

- Upload resume files (.pdf, .doc, .docx)
- Convert documents to HTML format
- Store resume data in MySQL database
- API endpoint for resume uploads
- Automatic database initialization
- Connection pooling for improved performance
- Graceful shutdown handling

## Prerequisites

- Node.js (v14 or higher)
- MySQL (v5.7 or higher)
- npm or yarn

## Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file based on the `.env.example` template
4. Start the server:
   ```
   npm start
   ```

The application will automatically create the database and required tables if they don't exist.

## Environment Variables

Create a `.env` file in the root directory with the following variables (see `.env.example`):

```
# Server Configuration
PORT=8000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password
DB_NAME=resume_analytics
DB_PORT=3306

# CORS Configuration
FRONTEND_URL=http://localhost:3000
```

## API Endpoints

### Upload Resume

```
POST /v1/resume/upload
```

**Request:**
- Content-Type: multipart/form-data
- Body:
  - resume: File (.pdf, .doc, or .docx)
  - resumeName: String

**Response:**
```json
{
  "success": true,
  "message": "Resume uploaded successfully",
  "data": {
    "id": 1,
    "resumeName": "Example Resume",
    "uploadedAt": "2023-09-15T12:00:00.000Z",
    "createdAt": "2023-09-15T12:00:00.000Z",
    "uploadedBy": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

## Database Schema

The application uses a MySQL database with the following table structure (automatically created on startup):

```sql
CREATE TABLE resumes_uploaded (
  resumes_uploaded_id INT PRIMARY KEY AUTO_INCREMENT,
  resume_html LONGTEXT NOT NULL,
  resume_name VARCHAR(255) NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  uploaded_by VARCHAR(255) NOT NULL
);

-- Indexes for faster queries
CREATE INDEX idx_resume_name ON resumes_uploaded(resume_name);
CREATE INDEX idx_uploaded_at ON resumes_uploaded(created_at);
```

## Database Connection

The application uses a robust database connection implementation with the following features:

- **Connection Pooling**: Uses MySQL connection pooling for improved performance and reliability
- **Automatic Initialization**: Creates database and tables automatically on startup if they don't exist
- **Graceful Shutdown**: Properly closes database connections when the application is terminated
- **Error Handling**: Comprehensive error handling for database operations
- **Connection Verification**: Verifies database connection before starting the server

## License

ISC