const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Admin = require('./models/Admin');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Default admin credentials
const createDefaultAdmin = async () => {
  try {
    // Check if admin already exists
    const adminExists = await Admin.findOne({ username: 'admin' });
    
    if (adminExists) {
      console.log('Admin user already exists.');
      process.exit(0);
    }
    
    // Create new admin
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('Sampan9413@', salt);
    
    const admin = new Admin({
      username: 'admin',
      password: hashedPassword,
      name: 'Administrator'
    });
    
    await admin.save();
    console.log('Admin user created successfully!');
    console.log('Username: admin');
    console.log('Password: Sampan9413@');
    console.log('Please change the default password after first login');
  } catch (error) {
    console.error('Error creating admin:', error);
  } finally {
    mongoose.disconnect();
  }
};

// Run the function
createDefaultAdmin();