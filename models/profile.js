// models/Profile.js
const mongoose = require('mongoose');

const LinkSchema = new mongoose.Schema({
  title: { type: String, required: true },
  url: { type: String, required: true },
  enabled: { type: Boolean, default: true }
});

// Example Profile schema
const ProfileSchema = new mongoose.Schema({
  // if you have a separate "User" model, you can reference it:
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  username: { type: String, default: '' },
  bio: { type: String, default: '' },

  // We'll store the profile photo as a simple URL or base64 string
  profilePhoto: { type: String, default: '' },

  // Example banner color
  bannerColor: { type: String, default: '#3A3529' },

  // An array of links
  links: [LinkSchema]
});

module.exports = mongoose.model('Profile', ProfileSchema);
