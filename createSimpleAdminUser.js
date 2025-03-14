require('dotenv').config();
const mongoose = require('mongoose');
const path = require('path');

// Manually load the models
const simpleAdminSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const SimpleAdmin = mongoose.model('SimpleAdmin', simpleAdminSchema);

// Connect to MongoDB
console.log('MONGODB_URI:', process.env.MONGODB_URI);
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    try {
      // Check if admin already exists
      const adminExists = await SimpleAdmin.findOne({ username: 'admin' });
      
      if (adminExists) {
        console.log('SimpleAdmin user already exists');
        console.log('Username:', adminExists.username);
        console.log('Password: [HIDDEN]');
        mongoose.disconnect();
        return;
      }
      
      // Create new admin with plain text password
      const admin = new SimpleAdmin({
        username: 'admin',
        password: 'admin123',
        name: 'Administrator'
      });
      
      await admin.save();
      console.log('SimpleAdmin user created successfully!');
      console.log('Username: admin');
      console.log('Password: admin123');
      console.log('Please note this is using plain text password for testing.');
    } catch (error) {
      console.error('Error creating SimpleAdmin:', error);
    } finally {
      mongoose.disconnect();
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }); 