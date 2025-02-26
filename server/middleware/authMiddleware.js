const { ClerkExpressRequireAuth } = require('@clerk/clerk-sdk-node');

// Protect all admin routes
app.use('/admin', ClerkExpressRequireAuth(), (req, res, next) => {
  next();
});