// routes/users.js - User routes
const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const userController = require('../controllers/userController');
const { trackProfileView } = require('../controllers/analyticsController');
const auth = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');
const User = require('../models/User');

// @route   GET api/users/:username
// @desc    Get user profile by username (public)
// @access  Public
router.get('/:username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .select('-password -email -resetPasswordToken -resetPasswordExpires');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Track profile view
    await trackProfileView(user._id, req);

    // Get user's links
    const links = await Link.find({ 
      user: user._id, 
      isActive: true 
    }).sort({ order: 1 });

    res.json({
      user,
      links
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT api/users/profile
// @desc    Update user profile
// @access  Private
router.put(
  '/profile',
  auth,
  userController.updateProfile
);

// @route   POST api/users/upload
// @desc    Upload user image (profile/banner)
// @access  Private
router.post(
  '/upload',
  auth,
  userController.uploadImage
);

// @route   PUT api/users/settings
// @desc    Update user settings
// @access  Private
router.put(
  '/settings',
  [
    auth,
    check('email', 'Please include a valid email').optional().isEmail(),
    check('newPassword', 'New password must be at least 6 characters').optional().isLength({ min: 6 })
  ],
  validateRequest,
  userController.updateSettings
);

// @route   DELETE api/users
// @desc    Delete user account
// @access  Private
router.delete('/', auth, userController.deleteAccount);

// POST /api/user/profile-setup
router.post('/profile-setup', auth, async (req, res) => {
  try {
    const { username, category } = req.body;

    // Validate input
    if (!username || !category) {
      return res.status(400).json({ message: 'Username and category are required.' });
    }

    // req.user is attached by the auth middleware (the currently logged-in user)
    const user = req.user;
    user.username = username;
    user.category = category;

    await user.save();

    return res.status(200).json({ message: 'Profile updated successfully.' });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

// 2) GET: Fetch the current user’s profile data
router.get('/me', auth, userController.getMe);



module.exports = router;