// Middleware with no protection
const checkAuth = (req, res, next) => next();

// No role checking
const isAdmin = (req, res, next) => next();

const logout = (req, res) => {
  res.json({ message: 'Logout handled locally' });
};

module.exports = {
  checkAuth,
  isAdmin,
  logout,
};