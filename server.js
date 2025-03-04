// server.js - Main entry point
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const passport = require('passport');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const userroutes = require('./routes/users'); 
const profileRoutes = require('./routes/profile');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Connect to MongoDB
require('./config/db');




// Middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: process.env.FRONTEND_URL, // Allow only the frontend URL
  credentials: true
}));
app.use(express.json({ limit: '10mb' })); // For parsing JSON with larger image payloads
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later'
});
app.use('/api/', apiLimiter);

// Passport middleware
app.use(passport.initialize());
require('./config/passport')(passport);
app.use('/api/profile', profileRoutes);
// Routes
app.use('/api/user', userroutes);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/links', require('./routes/links'));
app.use('/api/analytics', require('./routes/analytics'));

// Error handler middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Server Error', 
    error: process.env.NODE_ENV === 'development' ? err.message : undefined 
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
