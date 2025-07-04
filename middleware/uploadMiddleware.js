const multer = require('multer');
const path = require('path');
const fs = require('fs');

// // Create uploads directory if it doesn't exist
// const uploadDir = path.join(__dirname, '..', process.env.UPLOAD_DIR || 'uploads');
// if (!fs.existsSync(uploadDir)) {
//   fs.mkdirSync(uploadDir, { recursive: true });
// }

// Configure storage
const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, './resume_uploads');
	},
	filename: function (req, file, cb) {
		const uniqueSuffix = Date.now() + "-" + file.originalname;
		cb(null, uniqueSuffix);
	},
});

// File filter to accept only .pdf, .doc, and .docx files
const fileFilter = (req, file, cb) => {
  const allowedFileTypes = ['.pdf', '.doc', '.docx'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedFileTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, DOC, and DOCX files are allowed.'), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 30 * 1024 * 1024, // 30MB max file size
  }
});

module.exports = upload;