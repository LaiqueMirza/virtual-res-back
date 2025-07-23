const fs = require('fs').promises;
const { uploadedByArr, resumeShareLinkExpireDate, resumeJson } = require('../../constants/common');
const db = require('../../models');
const { convertToHtml } = require('../utils/documentConverter');
const nodemailer = require('nodemailer');
const commonService = require('../services/common');
const { convertTimeToSeconds, convertSecondsToTime, enhanceResumeWithAnalytics } = require('../utils/helperFun');


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
    
    console.error('Error uploading resume:', error);
    // Handle connection timeout errors gracefully
    if (error.name === 'SequelizeConnectionError' || error.message.includes('ETIMEDOUT')) {
      console.log('Database connection timed out. The operation will be retried automatically.');
      return res.status(503).json({
        success: false,
        message: 'Service temporarily unavailable. Please try again later.',
        retryable: true
      });
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
    // Get page number from request body, default to 1 if not provided
    const page = parseInt(req.body.page) || 1;
    const limit = parseInt(req.body.limit) || 10; // 10 records per page by default
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

    // Enhance each resume with additional analytics data using helper function
    const enhancedResumes = await Promise.all(
      resumes.map(resume => enhanceResumeWithAnalytics(resume))
    );

    const totalPages = Math.ceil(totalResumes / limit);
    
    res.status(200).json({
      success: true,
      data: {
        resumes: enhancedResumes,
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
    // Handle connection timeout errors gracefully
    if (error.name === 'SequelizeConnectionError' || error.message.includes('ETIMEDOUT')) {
      console.log('Database connection timed out. The operation will be retried automatically.');
      return res.status(503).json({
        success: false,
        message: 'Service temporarily unavailable. Please try again later.',
        retryable: true
      });
    }
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
    const { resume_share_links_id, viewer_ip, device_type, browser_info, location_city, location_country, resume_views_id, referrer_url } = req.body;
    
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
    let resumeView;
    let checkResumeView;
    if(resume_views_id) {
      checkResumeView = await commonService.findByPk("resume_views", resume_views_id);
    }
    if (checkResumeView) {
			// Update resume_views table and check if any rows were affected
			const updateResult = await commonService.update(
				"resume_views",
				{
					viewer_ip,
					device_type,
					browser_info,
					location_city,
					location_country,
					referrer_url,
				},
				{
					resume_views_id,
				}
			);
		} else {
			// Insert view data into resume_views table
			resumeView = await commonService.create("resume_views", {
				resume_share_links_id,
				viewer_ip,
				device_type,
				browser_info,
				location_city,
				location_country,
				referrer_url,
			});
		}

    res.status(200).json({
			success: true,
			data: {
				resume_json: resume.resume_json,
				resume_views_id: resume_views_id || resumeView?.resume_views_id,
			},
		});
  } catch (error) {
    console.error('Error getting client preview:', error);
    // Handle connection timeout errors gracefully
    if (error.name === 'SequelizeConnectionError' || error.message.includes('ETIMEDOUT')) {
      console.log('Database connection timed out. The operation will be retried automatically.');
      return res.status(503).json({
        success: false,
        message: 'Service temporarily unavailable. Please try again later.',
        retryable: true
      });
    }
    next(error);
  }
}

/**
 * Update scroll percentage for a resume view
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
async function updateScrollPercentage(req, res, next) {
  try {
    const { resume_views_id, scroll_percentage } = req.body;
    
    if (!resume_views_id) {
      return res.status(400).json({
        success: false,
        message: "Resume view ID is required"
      });
    }

    // Find the resume view record
    const resumeView = await commonService.findByPk("resume_views", resume_views_id);

    if (!resumeView) {
      return res.status(404).json({
        success: false,
        message: "Resume view record not found"
      });
    }

    // Update the scroll percentage and check if any rows were affected
    const updateResult = await commonService.update("resume_views", {
      scroll_percentage
    }, {
      resume_views_id
    });
    
    // Sequelize update returns [affectedCount, affectedRows]
    if (!updateResult || updateResult[0] === 0) {
      console.log(`No rows updated for scroll percentage with resume_views_id: ${resume_views_id}`);
      return res.status(404).json({
        success: false,
        message: "Failed to update scroll percentage. Record may have been deleted."
      });
    }

    res.status(200).json({
      success: true,
      message: "Scroll percentage updated successfully"
    });
  } catch (error) {
    console.error('Error updating scroll percentage:', error);
    // Handle connection timeout errors gracefully
    if (error.name === 'SequelizeConnectionError' || error.message.includes('ETIMEDOUT')) {
      console.log('Database connection timed out. The operation will be retried automatically.');
      return res.status(503).json({
        success: false,
        message: 'Service temporarily unavailable. Please try again later.',
        retryable: true
      });
    }
    next(error);
  }
}

/**
 * Track resume view events
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
async function trackResumeEvent(req, res, next) {
  try {
    const { resume_views_id, resume_share_links_id, section_name, total_time_spent, view_end_time } = req.body;
    
    if (!resume_views_id || !resume_share_links_id) {
      return res.status(400).json({
        success: false,
        message: "Resume view ID and resume share link ID are required"
      });
    }

    // Check if a record with the same resume_views_id, resume_share_links_id, and section_name exists
    const existingEvent = await commonService.findOne("resume_view_events", {
      resume_views_id,
      resume_share_links_id,
      section_name
    });

    let resumeViewEvent;

    if (existingEvent) {
      // Update the existing record
      // Increment breaks_taken by 1
      const updatedBreaksTaken = (existingEvent.breaks_taken || 0) + 1;
      
      // Add current total_time_spent to the previous total_time_spent
      // Since total_time_spent is stored as TIME type, we need to handle it appropriately
      let updatedTotalTimeSpent = total_time_spent;
      
      if (existingEvent.total_time_spent && total_time_spent) {
        const existingSeconds = convertTimeToSeconds(existingEvent.total_time_spent);
        const newSeconds = convertTimeToSeconds(total_time_spent);
        const totalSeconds = existingSeconds + newSeconds;
        
        updatedTotalTimeSpent = convertSecondsToTime(totalSeconds);
      }
      
      await commonService.update("resume_view_events", {
        breaks_taken: updatedBreaksTaken,
        total_time_spent: updatedTotalTimeSpent,
        view_end_time: view_end_time
      }, {
        resume_view_events_id: existingEvent.resume_view_events_id
      });
      
      resumeViewEvent = await commonService.findByPk("resume_view_events", existingEvent.resume_view_events_id);
    } else {
      // Create a new resume view event record
      resumeViewEvent = await commonService.create("resume_view_events", {
        resume_views_id,
        resume_share_links_id,
        section_name,
        total_time_spent: convertTimeToSeconds(total_time_spent),
        view_end_time
      });
    }
    res.status(200).json({
      success: true,
      message: "Resume view event tracked successfully",
      data: {
        resume_view_events_id: resumeViewEvent.resume_view_events_id
      }
    });
  } catch (error) {
    console.error('Error tracking resume event:', error);
    // Handle connection timeout errors gracefully
    if (error.name === 'SequelizeConnectionError' || error.message.includes('ETIMEDOUT')) {
      console.log('Database connection timed out. The operation will be retried automatically.');
      return res.status(503).json({
        success: false,
        message: 'Service temporarily unavailable. Please try again later.',
        retryable: true
      });
    }
    next(error);
  }
}

/**
 * Update total time spent and view end time for a resume view
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
async function updateViewTimeInfo(req, res, next) {
  try {
    const { resume_views_id, total_time_spent, view_end_time } = req.body;
    console.log("updateViewTimeInfo: ", resume_views_id, total_time_spent, view_end_time)
    if (!resume_views_id) {
      return res.status(400).json({
        success: false,
        message: "Resume view ID is required"
      });
    }

    // Find the resume view record
    const resumeView = await commonService.findByPk("resume_views", resume_views_id);

    if (!resumeView) {
      return res.status(404).json({
        success: false,
        message: "Resume view record not found"
      });
    }

    // Calculate updated total_time_spent if it already exists
    let updatedTotalTimeSpent = total_time_spent;
    
    if (resumeView.total_time_spent && total_time_spent) {
      const existingSeconds = convertTimeToSeconds(resumeView.total_time_spent);
      const newSeconds = convertTimeToSeconds(total_time_spent);
      const totalSeconds = existingSeconds + newSeconds;
      
      updatedTotalTimeSpent = convertSecondsToTime(totalSeconds);
    }

    // Update the total_time_spent and view_end_time and check if any rows were affected
    const updateResult = await commonService.update("resume_views", {
      total_time_spent: updatedTotalTimeSpent,
      view_end_time: view_end_time
    }, {
      resume_views_id
    });
    
    // Sequelize update returns [affectedCount, affectedRows]
    if (!updateResult || updateResult[0] === 0) {
      console.log(`No rows updated for view time info with resume_views_id: ${resume_views_id}`);
      return res.status(404).json({
        success: false,
        message: "Failed to update view time information. Record may have been deleted."
      });
    }

    res.status(200).json({
      success: true,
      message: "View time information updated successfully"
    });
  } catch (error) {
    console.error('Error updating view time information:', error);
    // Handle connection timeout errors gracefully
    if (error.name === 'SequelizeConnectionError' || error.message.includes('ETIMEDOUT')) {
      console.log('Database connection timed out. The operation will be retried automatically.');
      return res.status(503).json({
        success: false,
        message: 'Service temporarily unavailable. Please try again later.',
        retryable: true
      });
    }
    next(error);
  }
}

/**
 * Track resume click events
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
async function trackClickEvent(req, res, next) {
  try {
    const { resume_views_id, resume_share_links_id, section_name, link, element_text } = req.body;
    
    if (!resume_views_id || !resume_share_links_id) {
      return res.status(400).json({
        success: false,
        message: "Resume view ID and resume share link ID are required"
      });
    }

    // Create a new click event record
    const clickEvent = await commonService.create("resume_click_events", {
      resume_views_id,
      resume_share_links_id,
      section_name,
      link,
      element_text
    });

    res.status(200).json({
      success: true,
      message: "Click event tracked successfully",
      data: {
        resume_click_events_id: clickEvent.resume_click_events_id
      }
    });
  } catch (error) {
    console.error('Error tracking click event:', error);
    // Handle connection timeout errors gracefully
    if (error.name === 'SequelizeConnectionError' || error.message.includes('ETIMEDOUT')) {
      console.log('Database connection timed out. The operation will be retried automatically.');
      return res.status(503).json({
        success: false,
        message: 'Service temporarily unavailable. Please try again later.',
        retryable: true
      });
    }
    next(error);
  }
}

/**
 * Get comprehensive resume analytics data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
async function getResumeAnalytics(req, res, next) {
  try {
    const { resumes_uploaded_id } = req.body;
    
    if (!resumes_uploaded_id) {
      return res.status(400).json({
        success: false,
        message: "Resume uploaded ID is required"
      });
    }

    // Get resume data
    const resumeData = await commonService.findByPk("resumes_uploaded", resumes_uploaded_id);
    
    if (!resumeData) {
      return res.status(404).json({
        success: false,
        message: "Resume not found"
      });
    }

    // Enhance resume data with analytics using helper function
    const enhancedResumeData = await enhanceResumeWithAnalytics(resumeData);

    // Get all share links for this resume
    const shareLinks = await commonService.findAll("resume_share_links", {
      resumes_uploaded_id
    });

    // For each share link, get all views
    const resumeShared = [];
    
    for (const shareLink of shareLinks) {
      const views = await commonService.findAll("resume_views", {
        resume_share_links_id: shareLink.resume_share_links_id
      });

      const resumeViewed = [];
      
      for (const view of views) {
        // Get resume view events for this view
        const viewEvents = await commonService.findAll("resume_view_events", {
          resume_views_id: view.resume_views_id
        });

        // Get resume click events for this view
        const clickEvents = await commonService.findAll("resume_click_events", {
          resume_views_id: view.resume_views_id
        });

        // Format view events
        const resumeViewEvents = viewEvents.map(event => ({
          section_name: event.section_name,
          total_time_spent: event.total_time_spent
        }));

        // Format click events
        const resumeClickEvents = clickEvents.map(event => ({
          section_name: event.section_name,
          link: event.link,
          element_text: event.element_text
        }));

        resumeViewed.push({
          viewer_ip: view.viewer_ip,
          device_type: view.device_type,
          browser_info: view.browser_info,
          user_agent: view.user_agent,
          location_city: view.location_city,
          location_country: view.location_country,
          referrer_url: view.referrer_url,
          total_time_spent: view.total_time_spent,
          view_end_time: view.view_end_time,
          scroll_percentage: view.scroll_percentage,
          resume_viewed_at: view.created_at,
          resume_view_events: resumeViewEvents,
          resume_click_events: resumeClickEvents
        });
      }

      resumeShared.push({
        email: shareLink.email,
        client_name: shareLink.client_name,
        share_type: shareLink.share_type,
        expires_at: shareLink.expires_at,
        shared_at: shareLink.created_at,
        resume_viewed: resumeViewed
      });
    }

    const responseData = {
      resume_data: {
        resume_name: resumeData.resume_name,
        uploaded_by: resumeData.uploaded_by,
        uploaded_at: resumeData.created_at,
        total_link_count: enhancedResumeData.total_link_count,
        total_view_count: enhancedResumeData.total_view_count,
        average_read_time: enhancedResumeData.average_read_time
      },
      resume_shared: resumeShared
    };

    res.status(200).json({
      success: true,
      message: "Resume analytics data retrieved successfully",
      data: responseData
    });
  } catch (error) {
    console.error('Error getting resume analytics:', error);
    // Handle connection timeout errors gracefully
    if (error.name === 'SequelizeConnectionError' || error.message.includes('ETIMEDOUT')) {
      console.log('Database connection timed out. The operation will be retried automatically.');
      return res.status(503).json({
        success: false,
        message: 'Service temporarily unavailable. Please try again later.',
        retryable: true
      });
    }
    next(error);
  }
}

/**
 * Get resume JSON data for internal preview
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
async function internalPreview(req, res, next) {
  try {
    const { resumes_uploaded_id } = req.body;
    
    if (!resumes_uploaded_id) {
      return res.status(400).json({
        success: false,
        message: "Resume uploaded ID is required"
      });
    }

    // Get resume data by ID
    const resume = await commonService.findByPk("resumes_uploaded", resumes_uploaded_id);

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: "Resume not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Resume data retrieved successfully",
      data: {
        resume_json: resume.resume_json
      }
    });
  } catch (error) {
    console.error('Error getting internal preview:', error);
    // Handle connection timeout errors gracefully
    if (error.name === 'SequelizeConnectionError' || error.message.includes('ETIMEDOUT')) {
      console.log('Database connection timed out. The operation will be retried automatically.');
      return res.status(503).json({
        success: false,
        message: 'Service temporarily unavailable. Please try again later.',
        retryable: true
      });
    }
    next(error);
  }
}

module.exports = {
	uploadResume,
	getResumeList,
	getClientPreview,
	updateScrollPercentage,
	trackResumeEvent,
	updateViewTimeInfo,
	trackClickEvent,
	getResumeAnalytics,
	internalPreview,
};