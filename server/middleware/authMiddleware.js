app.use('/admin', (req, res, next) => {
  next(); // Allow all requests to /admin
});