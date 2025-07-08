const fs = require('fs').promises;
const { uploadedByArr, resumeShareLinkExpireDate, resumeJson } = require('../constants/common');
const db = require('../models');
const { convertToHtml } = require('../utils/documentConverter');
const nodemailer = require('nodemailer');
const commonService = require('../services/common');

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

    // Generate a random uploader name
    const uploadedBy = uploadedByArr[Math.floor(Math.random() * uploadedByArr.length)];
    
    // Get resume name from request body
    const resumeName = req.body.resumeName;
    
    // Convert the document to HTML
    const htmlContent = await convertToHtml(req.file.path);
    
    let internalResumeJson = resumeJson;
    internalResumeJson.basics.name = resumeName;
    internalResumeJson = JSON.stringify(internalResumeJson);

    // Create resume using Sequelize
    const resume = await commonService.create("resumes_uploaded", {
      resume_html: htmlContent,
      resume_json: internalResumeJson,
      resume_name: resumeName,
      uploaded_by: uploadedBy
    });
      
    // Delete the uploaded file after processing
    await fs.unlink(req.file.path);
    
    res.status(201).json({
      success: true,
      message: 'Resume uploaded successfully',
      data: {
        id: resume.resumes_uploaded_id,
        resumeName: resume.resume_name,
        updatedAt: resume.updated_at,
        createdAt: resume.created_at,
        uploadedBy: resume.uploaded_by
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
    
    // Get resumes with pagination using Sequelize
    const { count: totalResumes, rows: resumes } = await commonService.findAndCountAll(
      "resumes_uploaded",
      {}, // condition
      null, // attributes (null to get all fields)
      offset,
      limit,
      [["updated_at", "DESC"]], // order
      [] // optionalInclude
    );

    const totalPages = Math.ceil(totalResumes / limit);
    
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

// /**
//  * Share resume via email
//  * @param {Object} req - Express request object
//  * @param {Object} res - Express response object
//  * @param {Function} next - Express next middleware function
//  */
// async function shareResumeByEmail(req, res, next) {
//   try {
//     const { emails, resume_template_id } = req.body;

//     // Validate request body
//     if (!emails || !Array.isArray(emails) || emails.length === 0) {
//       return res.status(400).json({
//         success: false,
//         message: "At least one email address is required",
//       });
//     }

//     if (!resume_template_id) {
//       return res.status(400).json({
//         success: false,
//         message: "Resume template ID is required",
//       });
//     }

//     // Find resume using Sequelize
//     const resume = await commonService.findByPk("resumes_uploaded", resume_template_id);

//     if (!resume) {
//       return res.status(404).json({
//         success: false,
//         message: "Resume not found",
//       });
//     }

//     // Create reusable transporter
//     const transporter = nodemailer.createTransport({
//       host: "smtp.ethereal.email",
//       port: 587,
//       secure: false,
//       auth: {
//         user: "carli.hills48@ethereal.email",
//         pass: "YKewzD2T3eez3JVepz",
//       },
//     });

//     // Send emails
//     const emailPromises = emails.map(async (email) => {
//       const mailOptions = {
//         from: "mirzalaique2ey@gmail.com",
//         to: email,
//         subject: "Resume Share Link",
//         text: `Click the below link to view the resume: http://localhost:3000/view/${resume.resumes_uploaded_id}`,
//         html: `<p>Click the below link to view the resume:</p><p><a target="_blank" href="http://localhost:3000/view/${resume.resumes_uploaded_id}">View Resume: ${resume.resume_name}</a></p>`,
//       };

//       const info = await transporter.sendMail(mailOptions);

//       return {
//         email,
//         messageId: info.messageId,
//         previewUrl: nodemailer.getTestMessageUrl(info),
//       };
//     });

//     await Promise.all(emailPromises);

//     res.status(200).json({
//       success: true,
//       message: `Resume shared with ${emails.length} recipient(s)`,
//       data: {
//         resumeId: resume.resumes_uploaded_id,
//         resumeName: resume.resume_name,
//       },
//     });
//   } catch (error) {
//     console.error('Error sharing resume by email:', error);
//     next(error);
//   }
// }

/**
 * Get resume preview for client
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
async function getClientPreview(req, res, next) {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Resume ID is required"
      });
    }

    // Find resume using Sequelize
    const resume = await commonService.findByPk("resumes_uploaded", id);

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: "Resume not found"
      });
    }

    // Return the resume content
    res.status(200).json({
      success: true,
      content: resume.resume_html,
      resumeName: resume.resume_name
    });
  } catch (error) {
    console.error('Error getting client preview:', error);
    next(error);
  }
}

module.exports = {
  uploadResume,
  getResumeList,
  shareResumeByEmail,
  getClientPreview
};