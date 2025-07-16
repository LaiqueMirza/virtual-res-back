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

module.exports = {
	convertSecondsToTime,
	convertTimeToSeconds
};