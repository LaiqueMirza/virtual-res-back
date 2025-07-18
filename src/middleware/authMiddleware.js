const jwt = require('jsonwebtoken');

/**
 * Middleware to authenticate JWT token
 * Validates the token from Authorization header
 * If valid, adds the decoded user to the request object
 * If invalid, returns 401 Unauthorized
 */
const authenticateToken = (req, res, next) => {
  // Get the authorization header
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN format

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No token provided.'
    });
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Add the decoded user to the request object
    next(); // Proceed to the next middleware/route handler
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid token.'
    });
  }
};

module.exports = { authenticateToken };