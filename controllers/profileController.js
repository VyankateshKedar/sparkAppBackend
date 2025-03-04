// controllers/profileController.js
const Profile = require('../models/profile');

// GET /api/profile/:userId
exports.getProfileByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const profile = await Profile.findOne({ user: userId });

    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    return res.json(profile);
  } catch (error) {
    console.error('Error fetching profile:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/profile/:userId
exports.updateProfileByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      username,
      bio,
      profilePhoto,
      bannerColor,
      links
    } = req.body;

    // Find existing profile (or create one if not found)
    let profile = await Profile.findOne({ user: userId });
    if (!profile) {
      // If no profile exists, create a new one
      profile = new Profile({ user: userId });
    }

    // Update fields
    profile.username = username || profile.username;
    profile.bio = bio || profile.bio;
    profile.profilePhoto = profilePhoto || profile.profilePhoto;
    profile.bannerColor = bannerColor || profile.bannerColor;
    // If links is provided, replace or update them
    if (Array.isArray(links)) {
      profile.links = links;
    }

    await profile.save();
    return res.json(profile);
  } catch (error) {
    console.error('Error updating profile:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};
