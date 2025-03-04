// routes/profile.js
const express = require('express');
const router = express.Router();

const profileController = require('../controllers/profileController');

// GET user profile by userId
router.get('/:userId', profileController.getProfileByUserId);

// PUT update user profile by userId
router.put('/:userId', profileController.updateProfileByUserId);

module.exports = router;
