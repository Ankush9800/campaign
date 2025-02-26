const { ClerkExpressRequireAuth } = require('@clerk/clerk-sdk-node');

// Middleware to check if the user is authenticated
const checkAuth = ClerkExpressRequireAuth();

// Middleware to check if the user is an admin
const isAdmin = (req, res, next) => {
  if (req.auth.claims.publicMetadata.role !== 'admin') {
    return res.status(403).json({ message: 'Unauthorized: Admin access required' });
  }
  next();
};

// Logout (optional, Clerk handles session management)
const logout = (req, res) => {
  res.json({ message: 'Logout handled by Clerk' });
};

module.exports = {
  checkAuth,
  isAdmin,
  logout,
};