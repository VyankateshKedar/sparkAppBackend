// routes/analytics.js - Analytics routes
const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const auth = require('../middleware/auth');

// @route   GET api/analytics
// @desc    Get all user analytics
// @access  Private
router.get('/', auth, analyticsController.getUserAnalytics);

// @route   GET api/analytics/link/:linkId
// @desc    Get analytics for a specific link
// @access  Private
router.get('/link/:linkId', auth, analyticsController.getLinkAnalytics);

module.exports = router;