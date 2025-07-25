const express = require('express');
const router = express.Router();
const resumeController = require('../controllers/resumeController');
const { validateRequest, schemas } = require('../middleware/validationMiddleware');

// POST /v1/open/resume/preview - Get resume preview for client and track view
router.post(
	"/preview",
	validateRequest(schemas.resumePreview),
	resumeController.getClientPreview
);

// POST /v1/open/resume/update-scroll - Update scroll percentage for a resume view
router.post(
	"/update-scroll",
	validateRequest(schemas.updateScrollPercentage),
	resumeController.updateScrollPercentage
);

// POST /v1/open/resume/track-event - Track resume view events
router.post(
	"/track-event",
	validateRequest(schemas.trackResumeEvent),
	resumeController.trackResumeEvent
);

// POST /v1/open/resume/update-view-time - Update total time spent and view end time for a resume view
router.post(
	"/update-view-time",
	validateRequest(schemas.updateViewTimeInfo),
	resumeController.updateViewTimeInfo
);

// POST /v1/open/resume/track-click - Track resume click events
router.post(
	"/track-click",
	validateRequest(schemas.trackClickEvent),
	resumeController.trackClickEvent
);

module.exports = router;