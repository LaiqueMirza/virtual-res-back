/**
 * Example of how to use the validation middleware in a controller
 * 
 * This file is for demonstration purposes only and is not used in the application.
 */

const express = require('express');
const router = express.Router();
const Joi = require('joi');

// Example controller function
const exampleController = {
  /**
   * Example function that processes user data
   */
  processUserData: (req, res) => {
    try {
      // At this point, the request body has already been validated by the middleware
      // so we can safely use the data without additional validation
      const { name, email, age } = req.body;
      
      // Process the data...
      
      // Return a response
      return res.status(200).json({
        success: true,
        message: 'User data processed successfully',
        data: { name, email, age }
      });
    } catch (error) {
      console.error('Error processing user data:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
};

// Example validation schema
const userDataSchema = Joi.object({
  name: Joi.string().required().min(2).max(50).messages({
    'string.empty': 'Name is required',
    'string.min': 'Name must be at least 2 characters long',
    'string.max': 'Name cannot exceed 50 characters',
    'any.required': 'Name is required'
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'Invalid email format',
    'string.empty': 'Email is required',
    'any.required': 'Email is required'
  }),
  age: Joi.number().integer().min(18).max(120).required().messages({
    'number.base': 'Age must be a number',
    'number.integer': 'Age must be an integer',
    'number.min': 'Age must be at least 18',
    'number.max': 'Age cannot exceed 120',
    'any.required': 'Age is required'
  })
});

// Validation middleware
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

// Example route with validation middleware
router.post('/user', validateRequest(userDataSchema), exampleController.processUserData);

// Example of how to use the middleware in a route
/*
  POST /api/user
  Content-Type: application/json
  
  {
    "name": "John Doe",
    "email": "john.doe@example.com",
    "age": 30
  }
*/

// Example of validation error response
/*
  {
    "success": false,
    "message": "Validation error",
    "errors": [
      "Name is required",
      "Invalid email format",
      "Age must be at least 18"
    ]
  }
*/

module.exports = router;