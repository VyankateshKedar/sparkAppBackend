// controllers/userController.js - User controller
const User = require('../models/User');
const Link = require('../models/Link');
const Analytics = require('../models/Analytics');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Get user profile by username (public)
exports.getUserByUsername = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .select('-password -email -resetPasswordToken -resetPasswordExpires');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

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
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const {
      username,
      profileImage,
      bannerImage,
      socialIcons,
      shopLinks,
      theme
    } = req.body;

    // Check if username is taken (if being changed)
    if (username) {
      const existingUser = await User.findOne({ 
        username, 
        _id: { $ne: req.user.id } 
      });
      
      if (existingUser) {
        return res.status(400).json({ message: 'Username is already taken' });
      }
    }

    // Find and update user
    const updateData = {};
    if (username) updateData.username = username;
    if (profileImage) updateData.profileImage = profileImage;
    if (bannerImage) updateData.bannerImage = bannerImage;
    if (socialIcons) updateData.socialIcons = socialIcons;
    if (shopLinks) updateData.shopLinks = shopLinks;
    if (theme) updateData.theme = theme;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateData },
      { new: true }
    ).select('-password');

    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Upload image
exports.uploadImage = async (req, res) => {
  try {
    const { image, imageType } = req.body;
    
    if (!image) {
      return res.status(400).json({ message: 'No image provided' });
    }

    // Upload image to Cloudinary
    const result = await cloudinary.uploader.upload(image, {
      folder: `linktree-clone/${req.user.id}/${imageType}`,
      transformation: imageType === 'profile' 
        ? { width: 400, height: 400, crop: 'fill' } 
        : { width: 1200, quality: 'auto' }
    });

    res.json({ 
      url: result.secure_url,
      publicId: result.public_id
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Update user settings
exports.updateSettings = async (req, res) => {
  try {
    const { email, currentPassword, newPassword } = req.body;
    
    // Find user
    const user = await User.findById(req.user.id);
    
    // If updating email, verify it's not taken
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'Email is already in use' });
      }
      user.email = email;
    }
    
    // If updating password, verify current password
    if (currentPassword && newPassword) {
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }
      user.password = newPassword;
    }
    
    await user.save();
    
    // Return updated user without password
    const updatedUser = await User.findById(req.user.id).select('-password');
    res.json(updatedUser);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Delete user account
exports.deleteAccount = async (req, res) => {
  try {
    // Delete all user's links
    await Link.deleteMany({ user: req.user.id });
    
    // Delete all user's analytics
    await Analytics.deleteMany({ user: req.user.id });
    
    // Delete user's account
    await User.findByIdAndDelete(req.user.id);
    
    res.json({ message: 'Account deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// POST /api/user/profile-setup
exports.profileSetup = async (req, res) => {
  try {
    const userId = req.user.id; 
    const { username, category, bio, profileImage } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update fields if provided
    if (username) user.username = username;
    if (category) user.category = category;
    if (bio) user.bio = bio;
    if (profileImage) {
      user.profileImage = profileImage; // e.g. base64 or a URL
    }

    await user.save();

    return res.json({
      message: 'Profile setup successful',
      user: {
        _id: user._id,
        username: user.username,
        category: user.category,
        bio: user.bio,
        profileImage: user.profileImage,
        email: user.email
      }
    });
  } catch (error) {
    console.error('profileSetup Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/user/me
exports.getMe = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('getMe Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};