const mongoose = require('mongoose');
const Admin = require('./models/Admin');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Connect to MongoDB Atlas
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 30000, // 30 seconds timeout
})
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch(err => console.error('MongoDB connection error:', err));

// Create admin user
const createAdmin = async () => {
  try {
    const adminExists = await Admin.findOne({ username: 'admin' });

    if (!adminExists) {
      const admin = new Admin({
        username: 'admin',
        password: 'Ankush9413@', // Change this to a strong password
      });
      await admin.save();
      console.log('Admin created');
    } else {
      console.log('Admin already exists');
    }
  } catch (err) {
    console.error('Error creating admin:', err);
  } finally {
    mongoose.connection.close(); // Close the connection
  }
};

createAdmin();