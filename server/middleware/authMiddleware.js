const passport = require('passport');

const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  res.status(401).json({ error: 'Unauthorized' });
};

module.exports = isAuthenticated;

const authMiddleware = require('./middleware/authMiddleware');

// Protect all admin routes
app.use('/admin', authMiddleware.isAuthenticated, (req, res, next) => {
  next();
});