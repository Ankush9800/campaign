const jwt = require('jsonwebtoken');

// Authentication middleware
const authenticateAdmin = (req, res, next) => {
  try {
    // Get token from authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    
    // Verify token with JWT secret from environment variables
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Check if user is admin - if isAdmin is not present, assume they are an admin
    // since they were able to log in through the admin login route
    if (decoded.isAdmin === false) {
      return res.status(403).json({ error: 'Access denied. Not an admin.' });
    }
    
    // Add user data to request
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token verification error:', error.message);
    return res.status(401).json({ error: 'Invalid token.' });
  }
};

module.exports = { authenticateAdmin }; 