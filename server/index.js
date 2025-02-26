const express = require('express');
const mongoose = require('mongoose');
const { requireAuth } = require('@clerk/express');
const cors = require('cors');
require('dotenv').config({ path: '../.env' });

const app = express();

// Database connection with options
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 30000,
})
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Middleware
app.use(cors({
  origin: ['https://taskwala.netlify.app', 'http://localhost:3000'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

// Clerk middleware for authentication
app.use(
  requireAuth({
    secretKey: process.env.CLERK_SECRET_KEY,
  })
);

// Example protected route with Clerk
app.get('/admin/check-auth', (req, res) => {
  res.json({ authenticated: true });
});

// Logout route (optional, Clerk handles session management)
app.get('/api/auth/logout', (req, res) => {
  res.json({ message: 'Logout handled by Clerk' });
});

// Routes
const authRoutes = require('./routes/auth');
const campaignRoutes = require('./routes/campaigns');
const payoutRoutes = require('./routes/payouts');
const usersRouter = require('./routes/users');

app.use('/api/auth', authRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/payouts', payoutRoutes);
app.use('/api/users', usersRouter);

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));