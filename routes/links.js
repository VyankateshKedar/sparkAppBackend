// routes/links.js - Links routes
const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const linkController = require('../controllers/linkController');
const auth = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');

// @route   GET api/links
// @desc    Get all user links
// @access  Private
router.get('/', auth, linkController.getLinks);

// @route   POST api/links
// @desc    Create a new link
// @access  Private
router.post(
  '/',
  [
    auth,
    check('title', 'Title is required').not().isEmpty(),
    check('url', 'Valid URL is required').isURL()
  ],
  validateRequest,
  linkController.createLink
);

// @route   PUT api/links/:id
// @desc    Update a link
// @access  Private
router.put(
  '/:id',
  [
    auth,
    check('title', 'Title is required').optional().not().isEmpty(),
    check('url', 'Valid URL is required').optional().isURL()
  ],
  validateRequest,
  linkController.updateLink
);

// @route   DELETE api/links/:id
// @desc    Delete a link
// @access  Private
router.delete('/:id', auth, linkController.deleteLink);

// @route   PUT api/links/reorder
// @desc    Reorder links
// @access  Private
router.put('/reorder', auth, linkController.reorderLinks);

// @route   GET api/links/redirect/:id
// @desc    Get redirect URL and track click
// @access  Public
router.get('/redirect/:id', linkController.getRedirect);

// In routes/links.js, add a new route for shortUrl redirect
router.get('/redirect/short/:shortUrl', linkController.getRedirectByShortUrl);


module.exports = router;