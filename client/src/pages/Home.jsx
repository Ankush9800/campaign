// client/src/pages/Home.jsx
import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { SignIn, SignedOut } from '@clerk/clerk-react';

export default function Home() {
  const [campaigns, setCampaigns] = useState([]);

  useEffect(() => {
    const fetchCampaigns = async () => {

      const response = await fetch('https://taskwala-backend.onrender.com/api/campaigns');

      const data = await response.json();
      setCampaigns(data);
    };
    fetchCampaigns();
  }, []);

    return (
      <>
      <Navbar/>
      <div>
      <h1>Welcome to the Home Page</h1>
      <SignedOut>
        <SignIn />
      </SignedOut>
    </div>
      <div className="pt-20 min-h-screen">
        <div className="container">
          <h1 className="text-3xl font-bold text-gray-800 mb-8">Active Campaigns</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map(campaign => (
              <div 
                key={campaign._id}
                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-2">
                    {campaign.name}
                  </h2>
                  <p className="text-gray-600 mb-4">
                    {campaign.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded">
                      {campaign.status}
                    </span>
                    <span className="text-lg font-bold text-blue-600">
                      ₹{campaign.payoutRate}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      </>
    );
  }