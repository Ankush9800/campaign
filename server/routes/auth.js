const express = require('express');
const { ClerkExpressRequireAuth } = require('@clerk/clerk-sdk-node');
const authController = require('../controllers/authController');
const router = express.Router();

// Protect all routes with Clerk authentication
router.use(ClerkExpressRequireAuth());

// Example protected route
router.get('/check-auth', authController.checkAuth);

// Logout route (optional, Clerk handles session management)
router.get('/logout', authController.logout);

module.exports = router;