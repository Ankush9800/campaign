const express = require('express');
const { requireAuth } = require('@clerk/express');
const router = express.Router();

// Protect all routes with Clerk authentication
router.use(
  requireAuth({
    secretKey: process.env.CLERK_SECRET_KEY,
  })
);

// Example protected route
router.get('/check-auth', (req, res) => {
  res.json({ authenticated: true });
});

module.exports = router;