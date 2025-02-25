const express = require('express');
const passport = require('passport');
const authController = require('../controllers/authController');
const router = express.Router();

router.post('/login', 
  passport.authenticate('local'), // Use Passport's local strategy
  authController.login
);
router.get('/logout', authController.logout);
router.get('/check-auth', authController.checkAuth);

module.exports = router;