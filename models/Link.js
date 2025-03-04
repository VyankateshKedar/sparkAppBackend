// models/Link.js
const mongoose = require('mongoose');

const LinkSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  url: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  icon: {
    type: String
  },
  order: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // New field for short URL
  shortUrl: {
    type: String,
    unique: true,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before save
LinkSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Pre-validate hook to auto-generate a shortUrl if not provided
LinkSchema.pre('validate', async function(next) {
  if (!this.shortUrl) {
    let generated;
    let exists = true;
    // Generate until a unique short URL is found
    while (exists) {
      // Generate a random 7-character alphanumeric string
      generated = Math.random().toString(36).substring(2, 9);
      exists = await this.constructor.findOne({ shortUrl: generated });
    }
    this.shortUrl = generated;
  }
  next();
});

module.exports = mongoose.model('Link', LinkSchema);
