const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const SimpleAdmin = require('../models/SimpleAdmin');

// Simple admin login route - plain text password for testing
router.post('/admin/login', async (req, res) => {
  try {
    console.log('Login request received:', req.body);
    
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      console.log('Missing credentials');
      return res.status(400).json({ error: 'Please provide both username and password' });
    }

    // Find admin by username
    const admin = await SimpleAdmin.findOne({ username });
    if (!admin) {
      console.log('Admin not found');
      return res.status(400).json({ error: 'Invalid username or password' });
    }

    // Simple plain text password comparison for testing
    if (password !== admin.password) {
      console.log('Password mismatch');
      return res.status(400).json({ error: 'Invalid username or password' });
    }

    // Create token with environment variable JWT secret
    const token = jwt.sign(
      { 
        id: admin._id, 
        username: admin.username, 
        isAdmin: true, // Always set isAdmin to true for admin users
        name: admin.name
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    console.log('Login successful');

    // Send response
    res.json({
      token,
      admin: {
        id: admin._id,
        username: admin.username,
        name: admin.name
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Check authentication status
router.get('/check-auth', (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.json({ authenticated: false });
  }
  
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    res.json({ authenticated: true, user: decoded });
  } catch (error) {
    res.json({ authenticated: false });
  }
});

module.exports = router;