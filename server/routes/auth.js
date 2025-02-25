const express = require('express');
const passport = require('passport');
const authController = require('../controllers/authController');
const router = express.Router();

router.post('/login', 
  passport.authenticate('local'), // Use Passport's local strategy
  authController.login
);

// Backend route
router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ message: 'Error logging out' });
    req.session.destroy((err) => {
      if (err) return res.status(500).json({ message: 'Error destroying session' });
      res.clearCookie('connect.sid');
      res.json({ message: 'Logged out successfully' });
    });
  });
});

router.get('/logout', authController.logout);
router.get('/check-auth', authController.checkAuth);

module.exports = router;