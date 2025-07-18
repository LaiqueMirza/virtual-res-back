const jwt = require('jsonwebtoken');


/**
 * Handle user login
 * Validates credentials against hardcoded values
 * If valid, generates and returns a JWT token
 * If invalid, returns 401 Unauthorized
 */
const login = (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate credentials
    if (email !== process.env.VALID_EMAIL || password !== process.env.VALID_PASSWORD) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { email }, // Payload
      process.env.JWT_SECRET, // Secret key
      { expiresIn: process.env.JWT_EXPIRES_IN || '1d' } // Expiration
    );

    // Return success response with token
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = { login };