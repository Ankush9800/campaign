const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const cors = require('cors');
const bcrypt = require('bcryptjs');
const MongoStore = require('connect-mongo');
const Admin = require('./models/Admin');
require('dotenv').config({ path: '../.env' });

const app = express();

// Database connection with options
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 30000
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Middleware
app.use(cors({
  origin: ['https://taskwala.netlify.app', 'http://localhost:3000'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    ttl: 14 * 24 * 60 * 60
  }),
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    httpOnly: true,
    maxAge: 14 * 24 * 60 * 60 * 1000
  }
}));

// Passport configuration
app.use(passport.initialize());
app.use(passport.session());

// Passport Local Strategy
passport.use(new LocalStrategy(
  { usernameField: 'username' },
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
));

passport.serializeUser((admin, done) => done(null, admin.id));
passport.deserializeUser(async (id, done) => {
  try {
    const admin = await Admin.findById(id);
    if (!admin) return done(new Error('Admin not found'));
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
  res.json({ authenticated: req.isAuthenticated() });
});

app.get('/api/auth/logout', (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ message: 'Logout error' });
    req.session.destroy((err) => {
      if (err) return res.status(500).json({ message: 'Session destruction error' });
      res.clearCookie('connect.sid');
      res.json({ message: 'Logged out successfully' });
    });
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/payouts', payoutRoutes);
app.use('/api/users', usersRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));