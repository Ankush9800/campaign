// server/middleware/tracking.js
app.use((req, res, next) => {
    if (req.path.includes('/track')) {
      const click = new Click({
        campaign: req.params.campaignId,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      });
      click.save();
    }
    next();
  });