const fs = require('fs').promises;
const { getDB } = require('../config/database');
const { uploadedByArr, resumeShareLinkExpireDate, resumeJson } = require('../constants/common');
const { convertToHtml } = require('../utils/documentConverter');
const nodemailer = require("nodemailer");

/**
 * Upload and process a resume file
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
async function uploadResume(req, res, next) {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Check if resumeName was provided
    if (!req.body.resumeName) {
      // Delete the uploaded file
      await fs.unlink(req.file.path);
      
      return res.status(400).json({
        success: false,
        message: 'Resume name is required'
      });
    }

    // Generate timestamps
    const now = new Date();
    const updatedAt = now;
    const createdAt = now;
    
    // Generate a random uploader name using UUID
    const uploadedBy = uploadedByArr[Math.floor(Math.random() * uploadedByArr.length)];
    
    // Get resume name from request body
    const resumeName = req.body.resumeName;
    
    // Convert the document to HTML
    const htmlContent = await convertToHtml(req.file.path);
    
    let internalResumeJson = resumeJson;
    internalResumeJson.basics.name = resumeName;
    internalResumeJson = JSON.stringify(internalResumeJson);
    // Insert into database
    let result;
    try {
      const db = await getDB();
      [result] = await db.execute(
				"INSERT INTO resumes_uploaded (resume_json, resume_html, resume_name, created_at, updated_at, uploaded_by) VALUES (?, ?, ?, ?, ?, ?)",
				[
          internalResumeJson,
          htmlContent,
					resumeName,
					createdAt,
					updatedAt,
					uploadedBy,
				]
			);
    } catch (dbError) {
      console.error('Database operation failed:', dbError);
      throw new Error(`Database operation failed: ${dbError.message}`);
    }
      
    // Delete the uploaded file after processing
    await fs.unlink(req.file.path);
    
    res.status(201).json({
      success: true,
      message: 'Resume uploaded successfully',
      data: {
        id: result.insertId,
        resumeName,
        updatedAt,
        createdAt,
        uploadedBy
      }
    });
  } catch (error) {
    // If there's an error, try to delete the uploaded file
    if (req.file && req.file.path) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting file:', unlinkError);
      }
    }
    
    next(error);
  }
}

/**
 * Get a paginated list of resumes
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
async function getResumeList(req, res, next) {
  try {
    // Get page number from query params, default to 1 if not provided
    const page = parseInt(req.query.page) || 1;
    const limit = 10; // 10 records per page
    const offset = (page - 1) * limit;
    
    // Get database connection
    const db = await getDB();
    
    // Get total count of resumes for pagination metadata
    const [countResult] = await db.execute('SELECT COUNT(*) as total FROM resumes_uploaded');
    const totalResumes = countResult[0].total;
    const totalPages = Math.ceil(totalResumes / limit);
    
    // Get resumes with pagination, sorted by updated_at in descending order
    const query = 'SELECT resumes_uploaded_id, resume_html, resume_name, created_at, updated_at, uploaded_by FROM resumes_uploaded ORDER BY updated_at DESC LIMIT ' + offset + ', ' + limit;
    const [resumes] = await db.query(query);
    
    res.status(200).json({
      success: true,
      data: {
        resumes,
        pagination: {
          total: totalResumes,
          page,
          limit,
          totalPages
        }
      }
    });
  } catch (error) {
    console.error('Error fetching resume list:', error);
    next(error);
  }
}

/**
 * Share resume via email
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
async function shareResumeByEmail(req, res, next) {
  try {
		const { emails, resume_template_id } = req.body;

		// Validate request body
		if (!emails || !Array.isArray(emails) || emails.length === 0) {
			return res.status(400).json({
				success: false,
				message: "At least one email address is required",
			});
		}

		if (!resume_template_id) {
			return res.status(400).json({
				success: false,
				message: "Resume template ID is required",
			});
		}

		// Get database connection to verify resume exists
		const db = await getDB();
		const [resumeResult] = await db.execute(
			"SELECT resume_name FROM resumes_uploaded WHERE resumes_uploaded_id = ?",
			[resume_template_id]
		);

		if (resumeResult.length === 0) {
			return res.status(404).json({
				success: false,
				message: "Resume not found",
			});
		}

		// Create share links for each email
		const shareLinks = await Promise.all(emails.map(async (email) => {
		  const [result] = await db.execute(
		    "INSERT INTO resume_share_links (resumes_uploaded_id, email, expires_at) VALUES (?, ?, ?)",
		    [resume_template_id, email, resumeShareLinkExpireDate]
		  );
		  return { email, id: result.insertId };
		}));

		const resumeName = resumeResult[0].resume_name;

		// Create reusable transporter
		const transporter = nodemailer.createTransport({
			host: "smtp.ethereal.email",
			port: 587,
			secure: false, // true for 465, false for other ports
			auth: {
				user: "carli.hills48@ethereal.email",
				pass: "YKewzD2T3eez3JVepz",
			},
		});

		// Send emails
		const emailPromises = shareLinks.map(async ({ email, id }) => {
			const mailOptions = {
				from: "mirzalaique2ey@gmail.com",
				to: email,
				subject: "Resume Share Link",
				text: `Click the below link to view the resume: http://localhost:3000/view/${id}`,
				html: `<p>Click the below link to view the resume:</p><p><a target="_blank" href="http://localhost:3000/view/${id}">View Resume: ${resumeName}</a></p>`,
			};

			const info = await transporter.sendMail(mailOptions);

			return {
				email,
				messageId: info.messageId,
				previewUrl: nodemailer.getTestMessageUrl(info),
			};
		});

		const emailResults = await Promise.all(emailPromises);

		res.status(200).json({
			success: true,
			message: `Resume shared with ${emails.length} recipient(s)`,
			data: {
				resumeId: resume_template_id,
				resumeName,
				// emailsSent: emailResults,
			},
		});
	} catch (error) {
    console.error('Error sharing resume by email:', error);
    next(error);
  }
}

module.exports = {
  uploadResume,
  getResumeList,
  shareResumeByEmail
};