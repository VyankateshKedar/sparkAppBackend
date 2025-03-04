// models/User.js - User model
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    default: ''
  },
  category: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    default: ''
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  profileImage: {
    type: String,
    default: ''
  },
  bannerImage: {
    type: String,
    default: ''
  },
  theme: {
    background: {
      type: String,
      default: 'default'
    },
    buttonDesign: {
      shape: { type: String, default: 'rounded' },
      color: { type: String, default: '#000000' },
      style: { type: String, default: 'filled' }
    },
    layout: {
      type: String,
      default: 'standard'
    }
  },
  socialIcons: [{
    platform: String,
    url: String
  }],
  shopLinks: [{
    title: String,
    url: String,
    imageUrl: String
  }],
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Method to compare passwords
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);