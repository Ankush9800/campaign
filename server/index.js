const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const cors = require('cors');
const bcrypt = require('bcryptjs');
const Admin = require('./models/Admin');
require('dotenv').config({ path: '../.env' }); // Load .env from root

const app = express();

// Database connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Middleware
<<<<<<< HEAD
const allowedOrigins = [
  'https://taskwala.netlify.app',
  'https://taskwala.netlify.app/', // Include both formats
  'http://localhost:3000' // For local testing
];

app.use(cors({
  origin: (origin, callback) => {
    if (allowedOrigins.includes(origin) || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
=======
app.use(cors({
  origin: 'https://taskwala.netlify.app/', // Allow requests from this origin
  credentials: true, // Allow cookies and credentials
>>>>>>> e19ccf6f (Added all files)
}));

app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  }
}));

// Passport configuration
app.use(passport.initialize());
app.use(passport.session());

// Passport Local Strategy
passport.use(
  new LocalStrategy(
    { usernameField: 'username' }, // Match the field name in your form
    async (username, password, done) => {
      try {
        const admin = await Admin.findOne({ username });
        if (!admin) return done(null, false);

        const isValid = await bcrypt.compare(password, admin.password);
        return isValid ? done(null, admin) : done(null, false);
      } catch (err) {
        return done(err);
      }
    }
  )
);

passport.serializeUser((admin, done) => done(null, admin.id));
passport.deserializeUser(async (id, done) => {
  try {
    const admin = await Admin.findById(id);
    done(null, admin);
  } catch (err) {
    done(err);
  }
});
// Routes
const authRoutes = require('./routes/auth');
const campaignRoutes = require('./routes/campaigns');
const payoutRoutes = require('./routes/payouts');
const usersRouter = require('./routes/users');

app.get('/admin/check-auth', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ authenticated: true });
  } else {
    res.json({ authenticated: false });
  }
});

// Route handlers
app.use('/api/auth', authRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/payouts', payoutRoutes);
app.use('/api/users', usersRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));