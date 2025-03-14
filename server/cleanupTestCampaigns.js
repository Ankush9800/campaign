const mongoose = require('mongoose');

// Define the MongoDB connection string (replace with your actual connection string)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://your-mongodb-connection-string';

// Define a simple Campaign schema matching the one used in your application
const campaignSchema = new mongoose.Schema({
  name: String,
  description: String,
  trackingUrl: String,
  shareUrl: String,
  payoutRate: Number,
  status: String,
  details: String
});

async function cleanupTestCampaigns() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Create a Campaign model
    const Campaign = mongoose.model('Campaign', campaignSchema);
    
    console.log('Looking for test campaigns...');
    
    // Find all campaigns that have names indicating they are test campaigns
    const testCampaignQuery = {
      $or: [
        { name: { $regex: /test/i } },  // Any campaign with "test" in the name
        { name: { $regex: /amazon gift card/i } },
        { name: { $regex: /paytm cash/i } },
        { name: { $regex: /phonepe/i } }
      ]
    };
    
    // First, let's find and log them
    const testCampaigns = await Campaign.find(testCampaignQuery);
    
    if (testCampaigns.length === 0) {
      console.log('No test campaigns found in the database.');
    } else {
      console.log(`Found ${testCampaigns.length} test campaigns:`);
      testCampaigns.forEach(campaign => {
        console.log(`- ${campaign.name}`);
      });
      
      // Now delete them
      const result = await Campaign.deleteMany(testCampaignQuery);
      console.log(`Deleted ${result.deletedCount} test campaigns from the database.`);
    }
  } catch (error) {
    console.error('Error cleaning up test campaigns:', error);
  } finally {
    // Close the MongoDB connection
    await mongoose.disconnect();
    console.log('MongoDB connection closed.');
    process.exit(0);
  }
}

// Run the cleanup function
cleanupTestCampaigns();

/*
INSTRUCTIONS FOR RUNNING ON RENDER:

1. Log in to your Render dashboard
2. Go to your server service
3. Click on the "Shell" tab
4. Run the following commands:

   cd /opt/render/project/src/server
   node cleanupTestCampaigns.js

This will run the script in your production environment with access to your 
MongoDB connection string from the environment variables.
*/ 