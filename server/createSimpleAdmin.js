const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const SimpleAdmin = require('./models/SimpleAdmin');

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
        password: 'Sampan9413@',
        name: 'Administrator'
      });
      
      await admin.save();
      console.log('SimpleAdmin user created successfully!');
      console.log('Username: admin');
      console.log('Password: Sampan9413@');
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