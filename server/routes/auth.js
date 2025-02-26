const express = require('express');
const router = express.Router();

// Remove all Clerk middleware
router.get('/check-auth', (req, res) => {
  res.json({ authenticated: true }); // Fake authentication status
});

module.exports = router;