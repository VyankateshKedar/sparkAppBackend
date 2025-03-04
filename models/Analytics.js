// models/Analytics.js - Analytics model
const mongoose = require('mongoose');

const VisitorSchema = new mongoose.Schema({
  ip: String,
  userAgent: String,
  device: {
    type: String,
    enum: ['mobile', 'desktop', 'tablet', 'unknown'],
    default: 'unknown'
  },
  location: {
    country: { type: String, default: 'unknown' },
    city: { type: String, default: 'unknown' }
  },
  referrer: { type: String, default: 'direct' },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const AnalyticsSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  link: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Link'
  },
  // For profile page views (no specific link)
  isProfileView: {
    type: Boolean,
    default: false
  },
  // For tracking unique views
  uniqueVisitors: [VisitorSchema],
  // For quick access to totals
  totalViews: {
    type: Number,
    default: 0
  },
  totalClicks: {
    type: Number,
    default: 0
  },
  // Date fields for aggregation
  date: {
    type: Date,
    default: Date.now
  }
});

// Create indexes for faster queries
AnalyticsSchema.index({ user: 1, date: 1 });
AnalyticsSchema.index({ link: 1, date: 1 });

module.exports = mongoose.model('Analytics', AnalyticsSchema);