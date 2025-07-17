const express = require('express');
const router = express.Router();
const resumeController = require('../controllers/resumeController');
const resumeShareController = require('../controllers/resumeShareController');
const upload = require('../middleware/uploadMiddleware');
const { validateRequest, schemas } = require('../middleware/validationMiddleware');

// POST /v1/resume/upload - Upload a resume
router.post("/upload", upload.single("file"), validateRequest(schemas.resumeUpload), resumeController.uploadResume);

// POST /v1/resume/resume_lists - Get paginated list of resumes
router.post("/resume_lists", resumeController.getResumeList);

// POST /v1/resume/share/email - Share resume via email
router.post("/share/email", validateRequest(schemas.shareByEmail), resumeShareController.shareResumeByEmail);

// POST /v1/resume/share/link - Generate a shareable link for a resume
router.post("/share/link", validateRequest(schemas.generateShareLink), resumeShareController.generateShareLink);

// POST /v1/resume/preview - Get resume preview for client and track view
router.post(
	"/preview",
	validateRequest(schemas.resumePreview),
	resumeController.getClientPreview
);


// POST /v1/resume/update-scroll - Update scroll percentage for a resume view
router.post(
	"/update-scroll",
	validateRequest(schemas.updateScrollPercentage),
	resumeController.updateScrollPercentage
);

// POST /v1/resume/track-event - Track resume view events
router.post(
	"/track-event",
	validateRequest(schemas.trackResumeEvent),
	resumeController.trackResumeEvent
);

// POST /v1/resume/update-view-time - Update total time spent and view end time for a resume view
router.post(
	"/update-view-time",
	validateRequest(schemas.updateViewTimeInfo),
	resumeController.updateViewTimeInfo
);

// POST /v1/resume/track-click - Track resume click events
router.post(
	"/track-click",
	validateRequest(schemas.trackClickEvent),
	resumeController.trackClickEvent
);

module.exports = router;