// utils/helpers.js - Helper functions
const jwt = require('jsonwebtoken');

// Generate JWT token
exports.generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Format date to YYYY-MM-DD
exports.formatDate = (date) => {
  return date.toISOString().split('T')[0];
};

// Validate URL
exports.isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch (err) {
    return false;
  }
};