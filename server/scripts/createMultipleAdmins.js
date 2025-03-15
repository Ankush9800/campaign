const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const Admin = require('../models/Admin');
const readline = require('readline');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Connect to MongoDB
const connectDB = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB successfully!');
    return true;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    return false;
  }
};

// Function to create a new admin user
const createAdmin = async (username, password, name) => {
  try {
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
      name: name || username
    });
    
    await admin.save();
    console.log(`Admin user "${username}" created successfully!`);
    return true;
  } catch (error) {
    console.error('Error creating admin:', error);
    return false;
  }
};

// Function to prompt user for admin details
const promptForAdminDetails = () => {
  return new Promise((resolve) => {
    rl.question('Enter username (or "exit" to quit): ', (username) => {
      if (username.toLowerCase() === 'exit') {
        resolve(null);
        return;
      }
      
      rl.question('Enter password: ', (password) => {
        rl.question('Enter name (optional, press Enter to use username): ', (name) => {
          resolve({
            username,
            password,
            name: name || username
          });
        });
      });
    });
  });
};

// Main function to create multiple admins
const createMultipleAdmins = async () => {
  // Connect to database
  const connected = await connectDB();
  if (!connected) {
    console.error('Failed to connect to database. Exiting...');
    rl.close();
    process.exit(1);
  }
  
  console.log('=== Create Multiple Admin Users ===');
  console.log('Enter "exit" as username to finish.');
  
  let adminCreated = false;
  
  // Loop to create multiple admins
  while (true) {
    const adminDetails = await promptForAdminDetails();
    
    // Exit if user enters "exit"
    if (!adminDetails) {
      break;
    }
    
    // Validate input
    if (!adminDetails.username || !adminDetails.password) {
      console.log('Username and password are required!');
      continue;
    }
    
    // Create the admin
    const success = await createAdmin(
      adminDetails.username,
      adminDetails.password,
      adminDetails.name
    );
    
    if (success) {
      adminCreated = true;
    }
  }
  
  if (adminCreated) {
    console.log('Admin user(s) created successfully!');
    console.log('You can now log in using the created credentials.');
  } else {
    console.log('No new admin users were created.');
  }
  
  // Close the readline interface and disconnect from MongoDB
  rl.close();
  await mongoose.disconnect();
  console.log('Disconnected from MongoDB');
};

// Run the script
createMultipleAdmins(); 