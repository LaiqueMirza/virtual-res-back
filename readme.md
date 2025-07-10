# Resume Upload API

A Node.js and Express.js backend application that handles resume uploads, converts documents to HTML, and stores them in a MySQL database. The application uses Joi for request validation and nodemon for development.

## Features

- Upload resume files (.pdf, .doc, .docx)
- Convert documents to HTML format
- Store resume data in MySQL database
- API endpoints for resume uploads, sharing, and viewing
- Request validation using Joi
- Automatic database initialization
- Connection pooling for improved performance
- Graceful shutdown handling
- Development mode with nodemon for auto-restart

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
   # For production
   npm start
   
   # For development (with auto-restart)
   npm run dev
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

All endpoints with request bodies are validated using Joi schemas.

### Upload Resume

```
POST /v1/resume/upload
```

**Request:**
- Content-Type: multipart/form-data
- Body:
  - file: File (.pdf, .doc, or .docx)
  - resumeName: String (required)

**Response:**
```json
{
  "success": true,
  "message": "Resume uploaded successfully",
  "data": {
    "id": 1,
    "resumeName": "Example Resume",
    "updatedAt": "2023-09-15T12:00:00.000Z",
    "createdAt": "2023-09-15T12:00:00.000Z",
    "uploadedBy": "John Doe"
  }
}
```

### Get Resume List

```
GET /v1/resume/resume_lists
```

**Request:**
- Query Parameters:
  - page: Number (optional, default: 1)

**Response:**
```json
{
  "success": true,
  "data": {
    "resumes": [
      {
        "resumes_uploaded_id": 1,
        "resume_name": "Example Resume",
        "created_at": "2023-09-15T12:00:00.000Z",
        "updated_at": "2023-09-15T12:00:00.000Z",
        "uploaded_by": "John Doe"
      }
    ],
    "pagination": {
      "total": 1,
      "page": 1,
      "limit": 10,
      "totalPages": 1
    }
  }
}
```

### Share Resume by Email

```
POST /v1/resume/share/email
```

**Request:**
- Content-Type: application/json
- Body:
  - resumeId: Number (required)
  - recipientEmail: String (required, valid email)
  - senderName: String (required)

**Response:**
```json
{
  "success": true,
  "message": "Resume shared successfully"
}
```

### Generate Share Link

```
POST /v1/resume/share/link
```

**Request:**
- Content-Type: application/json
- Body:
  - resumeId: Number (required)
  - expiresIn: Number (optional, days until expiration)

**Response:**
```json
{
  "success": true,
  "data": {
    "shareLink": "https://example.com/resume/preview?id=abc123",
    "expiresAt": "2023-10-15T12:00:00.000Z"
  }
}
```

### Get Resume Preview

```
POST /v1/resume/preview
```

**Request:**
- Content-Type: application/json
- Body:
  - resume_share_links_id: String (required)
  - viewer_ip: String (optional)
  - location_city: String (optional)
  - location_country: String (optional)

**Response:**
```json
{
  "success": true,
  "data": {
    "resume_json": { /* Resume JSON data */ }
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

## Request Validation

The application uses Joi for request validation with the following features:

- **Schema-based Validation**: Validates request bodies against predefined schemas
- **Custom Error Messages**: Provides clear and descriptive error messages
- **Middleware Approach**: Uses middleware to validate requests before they reach the controllers
- **Reusable Schemas**: Defines reusable validation schemas for different endpoints

Example validation schema:

```javascript
const resumePreviewSchema = Joi.object({
  resume_share_links_id: Joi.string().required().messages({
    'string.empty': 'Resume share link ID is required',
    'any.required': 'Resume share link ID is required'
  }),
  viewer_ip: Joi.string().allow(null, ''),
  location_city: Joi.string().allow(null, ''),
  location_country: Joi.string().allow(null, '')
});
```

## License

ISC