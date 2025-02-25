const express = require('express');
const passport = require('passport');
const authController = require('../controllers/authController');
const router = express.Router();

router.post('/login', 
  passport.authenticate('local'), // Use Passport's local strategy
  authController.login
);

// Backend route
app.get('/logout', (req, res) => {
  req.logout();
  res.sendStatus(200);
});

router.get('/logout', authController.logout);
router.get('/check-auth', authController.checkAuth);

module.exports = router;