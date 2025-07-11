const express = require('express');
const router = express.Router();
const resumeController = require('../controllers/resumeController');
const resumeShareController = require('../controllers/resumeShareController');
const upload = require('../middleware/uploadMiddleware');
const { validateRequest, schemas } = require('../middleware/validationMiddleware');

// POST /v1/resume/upload - Upload a resume
router.post("/upload", upload.single("file"), validateRequest(schemas.resumeUpload), resumeController.uploadResume);

// GET /v1/resume/resume_lists - Get paginated list of resumes
router.get("/resume_lists", resumeController.getResumeList);

// POST /v1/resume/share/email - Share resume via email
router.post("/share/email", validateRequest(schemas.shareByEmail), resumeShareController.shareResumeByEmail);

// POST /v1/resume/share/link - Generate a shareable link for a resume
router.post("/share/link", validateRequest(schemas.generateShareLink), resumeShareController.generateShareLink);

// POST /v1/resume/preview - Get resume preview for client and track view
// router.post(
// 	"/preview",
// 	validateRequest(schemas.resumePreview),
// 	resumeController.getClientPreview
// );
router.post(
	"/preview",
	resumeController.getClientPreview
);

module.exports = router;