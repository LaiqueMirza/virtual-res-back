const commonService = require("../services/common");
const db = require("../../models");

// Convert seconds back to time format (HH:MM:SS)
const convertSecondsToTime = (totalSeconds) => {
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = totalSeconds % 60;

	return `${hours.toString().padStart(2, "0")}:${minutes
		.toString()
		.padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
};

// Convert both time values to seconds for addition
const convertTimeToSeconds = (timeStr) => {
	if (!timeStr) return 0;

	// Handle different time formats (HH:MM:SS or MM:SS)
	const parts = timeStr.toString().split(":");
	let seconds = 0;

	if (parts.length === 3) {
		// HH:MM:SS
		seconds =
			parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
	} else if (parts.length === 2) {
		// MM:SS
		seconds = parseInt(parts[0]) * 60 + parseInt(parts[1]);
	} else if (parts.length === 1) {
		// SS
		seconds = parseInt(parts[0]);
	}

	return seconds;
};

/**
 * Helper function to enhance resume data with analytics information
 * @param {Object} resume - Resume object from database
 * @returns {Object} Enhanced resume object with analytics data
 */
async function enhanceResumeWithAnalytics(resume) {
	// Get total link count for this resume
	const shareLinks = await commonService.findAll("resume_share_links", {
		resumes_uploaded_id: resume.resumes_uploaded_id,
	});
	const totalLinkCount = shareLinks.length;

	// Get all share link IDs for this resume
	const shareLinkIds = shareLinks.map((link) => link.resume_share_links_id);

	// Get total view count and calculate average read time
	let totalViewCount = 0;
	let averageReadTime = "00:00:00";

	if (shareLinkIds.length > 0) {
		// Get all views for all share links of this resume
		const allViews = await commonService.findAll("resume_views", {
			resume_share_links_id: {
				[db.Sequelize.Op.in]: shareLinkIds,
			},
		});

		totalViewCount = allViews.length;

		// Calculate average read time from total_time_spent values
		if (allViews.length > 0) {
			const validTimeSpentViews = allViews.filter(
				(view) => view.total_time_spent
			);

			if (validTimeSpentViews.length > 0) {
				const totalSeconds = validTimeSpentViews.reduce((sum, view) => {
					return sum + convertTimeToSeconds(view.total_time_spent);
				}, 0);

				const averageSeconds = Math.round(
					totalSeconds / validTimeSpentViews.length
				);
				averageReadTime = convertSecondsToTime(averageSeconds);
			}
		}
	}

	return {
		...resume.toJSON(),
		total_link_count: totalLinkCount,
		total_view_count: totalViewCount,
		average_read_time: averageReadTime,
	};
}

module.exports = {
	convertSecondsToTime,
	convertTimeToSeconds,
	enhanceResumeWithAnalytics,
};
