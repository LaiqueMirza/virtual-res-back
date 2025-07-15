const Joi = require('joi');

// Validation schemas
const schemas = {
	// Schema for resume preview
	resumePreview: Joi.object({
		resume_share_links_id: Joi.string().required().messages({
			"string.empty": "Resume share link ID is required",
			"any.required": "Resume share link ID is required",
		}),
		viewer_ip: Joi.string().allow(null, ""),
		device_type: Joi.string().allow(null, ""),
		browser_info: Joi.string().allow(null, ""),
		location_city: Joi.string().allow(null, ""),
		location_country: Joi.string().allow(null, ""),
	}),

	// Schema for resume upload
	resumeUpload: Joi.object({
		resumeName: Joi.string().required().messages({
			"string.empty": "Resume name is required",
			"any.required": "Resume name is required",
		}),
	}),

	// Schema for sharing resume by email
	shareByEmail: Joi.object({
		resumes_uploaded_id: Joi.number().required().messages({
			"number.base": "resumes_uploaded_id must be a number",
			"any.required": "resumes_uploaded_id is required",
		}),
		emails: Joi.array().required().messages({
			"array.base": "Emails must be an array",
			"any.required": "Recipient emails is required",
		}),
		// senderName: Joi.string().required().messages({
		// 	"string.empty": "Sender name is required",
		// 	"any.required": "Sender name is required",
		// }),
	}),

	// Schema for generating share link
	generateShareLink: Joi.object({
		resumes_uploaded_id: Joi.number().required().messages({
			"number.base": "resumes_uploaded_id must be a number",
			"any.required": "resumes_uploaded_id is required",
		}),
		client_name: Joi.string().required().messages({
			"string.empty": "client_name is required",
			"any.required": "client_name is required",
		}),
	}),

	// Schema for updating scroll percentage
	updateScrollPercentage: Joi.object({
		resume_views_id: Joi.number().required().messages({
			"number.base": "Resume view ID must be a number",
			"any.required": "Resume view ID is required",
		}),
		scroll_percentage: Joi.number().integer().min(0).max(100).required().messages({
			"number.base": "Scroll percentage must be a number",
			"number.integer": "Scroll percentage must be an integer",
			"number.min": "Scroll percentage must be at least 0",
			"number.max": "Scroll percentage cannot exceed 100",
			"any.required": "Scroll percentage is required",
		}),
	}),
};

// Middleware factory for validation
const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      const errorMessages = error.details.map(detail => detail.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errorMessages
      });
    }
    
    next();
  };
};

module.exports = {
  validateRequest,
  schemas
};