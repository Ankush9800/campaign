const passport = require('passport');
const Admin = require('../models/Admin');

exports.login = (req, res, next) => {
  passport.authenticate('local', (err, admin, info) => {
    if (err) return next(err);
    if (!admin) return res.status(400).json({ error: 'Invalid credentials' });

    req.logIn(admin, (err) => {
      if (err) return next(err);
      return res.json({ success: true });
    });
  })(req, res, next);
};

exports.logout = (req, res) => {
  req.logout();
  res.json({ success: true });
};

exports.checkAuth = (req, res) => {
  res.json({ authenticated: req.isAuthenticated() });
};