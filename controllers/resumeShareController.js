const { resumeShareLinkExpireDate } = require('../constants/common');
const nodemailer = require('nodemailer');
const commonService = require('../services/common');
const db = require('../models');

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

    // Find resume using Sequelize
    const resume = await commonService.findByPk("resumes_uploaded", resume_template_id);

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: "Resume not found",
      });
    }

    // Create share links for all emails
    const shareLinks = [];
    for (const email of emails) {
      const shareLink = await commonService.create("resume_share_links", {
        resumes_uploaded_id: resume_template_id,
        email: email,
        share_type: 'email',
        expires_at: resumeShareLinkExpireDate,
        is_active: true
      });
      shareLinks.push(shareLink);
    }

    // Create reusable transporter
    const transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: "carli.hills48@ethereal.email",
        pass: "YKewzD2T3eez3JVepz",
      },
    });

    // Send emails
    const emailPromises = shareLinks.map(async (shareLink) => {
      const mailOptions = {
        from: "mirzalaique2ey@gmail.com",
        to: shareLink.email,
        subject: "Resume Share Link",
        text: `Click the below link to view the resume: http://localhost:3000/view/${shareLink.resume_share_links_id}`,
        html: `<p>Click the below link to view the resume:</p><p><a target="_blank" href="http://localhost:3000/view/${shareLink.resume_share_links_id}">View Resume: ${resume.resume_name}</a></p>`,
      };

      const info = await transporter.sendMail(mailOptions);

      return {
        email: shareLink.email,
        messageId: info.messageId,
        previewUrl: nodemailer.getTestMessageUrl(info),
      };
    });

    await Promise.all(emailPromises);

    res.status(200).json({
      success: true,
      message: `Resume shared with ${emails.length} recipient(s)`,
      data: {
        resumeId: resume.resumes_uploaded_id,
        resumeName: resume.resume_name,
      },
    });
  } catch (error) {
    console.error('Error sharing resume by email:', error);
    next(error);
  }
}

/**
 * Generate a shareable link for a resume
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
async function generateShareLink(req, res, next) {
  try {
    const { client_name, resume_template_id } = req.body;

    // Validate request body
    if (!client_name || !client_name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Client name is required"
      });
    }

    if (!resume_template_id) {
      return res.status(400).json({
        success: false,
        message: "Resume template ID is required"
      });
    }

    // Find resume using Sequelize
    const resume = await commonService.findByPk("resumes_uploaded", resume_template_id);

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: "Resume not found"
      });
    }

    // Create share link
    const shareLink = await commonService.create("resume_share_links", {
      resumes_uploaded_id: resume_template_id,
      client_name: client_name,
      share_type: 'link',
      expires_at: resumeShareLinkExpireDate,
      is_active: true
    });

    res.status(200).json({
      success: true,
      message: "Share link generated successfully",
      data: {
        share_link_id: shareLink.resume_share_links_id,
        expires_at: shareLink.expires_at
      }
    });
  } catch (error) {
    console.error('Error generating share link:', error);
    next(error);
  }
}

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
        message: "Share link ID is required"
      });
    }

    // Find valid share link using Sequelize
    const shareLink = await commonService.findOne("resume_share_links", {
      resume_share_links_id: id,
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
  shareResumeByEmail,
  generateShareLink,
  getClientPreview
};