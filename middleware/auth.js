// middleware/auth.js
const passport = require('passport');

module.exports = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      // If user not found in token or token invalid, respond with 401
      return res.status(401).json({ message: 'Unauthorized. Please log in.' });
    }
    // Attach authenticated user to req object
    req.user = user;
    return next();
  })(req, res, next);
};
