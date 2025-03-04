// config/passport.js
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const User = require('../models/User');

module.exports = (passport) => {
  const opts = {
    // Extract the JWT from the "Authorization" header as a Bearer token
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    // Use your JWT secret from .env or config
    secretOrKey: process.env.JWT_SECRET,
  };

  passport.use(
    new JwtStrategy(opts, async (jwt_payload, done) => {
      try {
        // Make sure this matches how you sign your token: e.g., jwt.sign({ id: user._id }, ...)
        const user = await User.findById(jwt_payload.id).select('-password');
        if (user) {
          return done(null, user);
        }
        // If no user found, return false
        return done(null, false);
      } catch (error) {
        console.error('JWT Strategy error:', error);
        return done(error, false);
      }
    })
  );
};
