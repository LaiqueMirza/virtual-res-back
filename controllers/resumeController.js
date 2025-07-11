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

/**
 * Get resume preview for client and track the view
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
async function getClientPreview(req, res, next) {
  try {
    const { resume_share_links_id, viewer_ip, device_type, browser_info, location_city, location_country } = req.body;
    
    if (!resume_share_links_id) {
      return res.status(400).json({
        success: false,
        message: "Resume share link ID is required"
      });
    }

    // Find valid share link using Sequelize
    const shareLink = await commonService.findOne("resume_share_links", {
      resume_share_links_id,
      is_active: true,
      expires_at: {
        [db.Sequelize.Op.or]: [
          { [db.Sequelize.Op.gt]: new Date() },
          { [db.Sequelize.Op.eq]: null }
        ]
      }
    });

    if (!shareLink) {
      return res.status(404).json({
        success: false,
        message: "Share link not found or expired"
      });
    }

    // Get associated resume
    const resume = await commonService.findByPk("resumes_uploaded", shareLink.resumes_uploaded_id);

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: "Resume not found"
      });
    }

    // Insert view data into resume_views table
    await commonService.create("resume_views", {
      resume_share_links_id,
      viewer_ip,device_type, browser_info,
      location_city,
      location_country,
    });

    res.status(200).json({
      success: true,
      data: {
        resume_json: resume.resume_json
      }
    });
  } catch (error) {
    console.error('Error getting client preview:', error);
    next(error);
  }
}

module.exports = {
  uploadResume,
  getResumeList,
  getClientPreview
};