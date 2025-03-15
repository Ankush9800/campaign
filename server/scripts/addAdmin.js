const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const Admin = require('../models/Admin');

// Parse command line arguments
const args = process.argv.slice(2);
const showHelp = args.includes('--help') || args.includes('-h') || args.length === 0;

if (showHelp) {
  console.log(`
Usage: node addAdmin.js <username> <password> [name]

Arguments:
  username    Admin username (required)
  password    Admin password (required)
  name        Admin name (optional)

Options:
  --help, -h  Show this help message
  `);
  process.exit(0);
}

const username = args[0];
const password = args[1];
const name = args[2] || username;

// Function to create a new admin user
const createAdmin = async () => {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB successfully!');
    
    // Check if admin already exists
    const adminExists = await Admin.findOne({ username });
    
    if (adminExists) {
      console.log(`Admin user "${username}" already exists.`);
      return false;
    }
    
    // Create new admin
    const admin = new Admin({
      username,
      password, // Will be hashed by pre-save middleware
      name
    });
    
    await admin.save();
    console.log(`Admin user "${username}" created successfully!`);
    return true;
  } catch (error) {
    console.error('Error creating admin:', error);
    return false;
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Validate required arguments
if (!username || !password) {
  console.error('Error: Username and password are required!');
  console.log('Use --help for usage information');
  process.exit(1);
}

// Run the function
createAdmin()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  }); 