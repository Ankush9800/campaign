import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import Navbar from '../components/Navbar';

export default function ReferralPage() {
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [phone, setPhone] = useState('');
  const [referralLink, setReferralLink] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [generatingLink, setGeneratingLink] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    document.title = 'Create Referral Link - Earn by Referring Friends';
    fetchCampaigns();
    
    // Check if user has a stored phone number
    const userId = localStorage.getItem('userId');
    if (userId && userId.length === 10 && /^\d+$/.test(userId)) {
      setPhone(userId);
    }
  }, []);

  // Extract campaign ID from URL and select it
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const campaignId = queryParams.get('campaign');
    
    if (campaignId && campaigns.length > 0) {
      const campaign = campaigns.find(c => c._id === campaignId);
      if (campaign) {
        setSelectedCampaign(campaign);
        // Show a notification
        toast.success(`Create a referral link for ${campaign.name} and earn ₹${campaign.referralAmount} per referral!`);
        // Scroll to the phone number input
        setTimeout(() => {
          const phoneInput = document.getElementById('phone');
          if (phoneInput) {
            phoneInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
            phoneInput.focus();
          }
        }, 500);
      }
    }
  }, [campaigns, location.search]);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const response = await axios.get('https://campaign-pohg.onrender.com/api/campaigns');
      
      // Filter out campaigns with no referral program (referralAmount = 0)
      const campaignsWithReferrals = response.data.filter(
        campaign => campaign.status === 'active' && campaign.referralAmount > 0
      );
      
      setCampaigns(campaignsWithReferrals);
      setError('');
    } catch (err) {
      console.error('Error fetching campaigns:', err);
      setError('Failed to load campaigns. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const generateReferralLink = async () => {
    if (!selectedCampaign) {
      toast.error('Please select a campaign');
      return;
    }

    if (!phone || !/^[0-9]{10}$/.test(phone)) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }

    try {
      setGeneratingLink(true);
      
      // Create or get referral code from backend
      const response = await axios.post('https://campaign-pohg.onrender.com/api/referrals/generate', {
        referrerId: phone,
        campaignId: selectedCampaign._id
      });
      
      if (response.data && response.data.referral) {
        setReferralCode(response.data.referral.referralCode);
        setReferralLink(response.data.referral.referralLink);
        toast.success('Referral link generated successfully!');
      }
    } catch (err) {
      console.error('Error generating referral link:', err);
      toast.error(err.response?.data?.message || 'Failed to generate referral link');
    } finally {
      setGeneratingLink(false);
    }
  };

  const handleCampaignSelect = (campaign) => {
    setSelectedCampaign(campaign);
    setReferralLink(''); // Reset referral link when changing campaigns
    setReferralCode('');
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink)
      .then(() => toast.success('Link copied to clipboard!'))
      .catch(() => toast.error('Failed to copy link'));
  };

  const shareReferralLink = () => {
    if (!referralLink) return;
    
    if (navigator.share) {
      navigator.share({
        title: `Refer friends to ${selectedCampaign.name}`,
        text: `Check out this offer and earn rewards: ${selectedCampaign.name}`,
        url: referralLink
      })
      .then(() => toast.success('Shared successfully!'))
      .catch((err) => {
        console.error('Share error:', err);
        toast.error('Failed to share');
      });
    } else {
      copyToClipboard();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-8 rounded-2xl mb-8 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <defs>
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>
          
          <div className="relative z-10">
            <h1 className="text-3xl font-bold mb-2">Refer Friends & Earn Money</h1>
            <p className="text-lg opacity-90 mb-4">
              Share your unique referral link with friends and earn rewards when they complete offers!
            </p>
            
            {selectedCampaign && (
              <div className="bg-white bg-opacity-20 px-4 py-3 rounded-lg backdrop-blur-sm inline-block">
                <span className="text-lg font-medium">Earn ₹{selectedCampaign.referralAmount}</span>
                <span className="ml-2">for each friend who completes {selectedCampaign.name}</span>
              </div>
            )}
            
            <div className="flex flex-wrap gap-3 mt-4">
              <div className="bg-white bg-opacity-20 px-4 py-2 rounded-lg backdrop-blur-sm flex items-center">
                <span className="mr-2">How it works:</span>
                <span className="font-medium">Select campaign → Share link → Earn rewards</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Step 1: Select a Campaign</h2>
          
          {loading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 text-red-700 p-4 rounded-lg">
              {error}
            </div>
          ) : campaigns.length === 0 ? (
            <div className="bg-yellow-50 text-yellow-700 p-4 rounded-lg">
              No campaigns with referral programs are currently available.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {campaigns.map(campaign => (
                <div 
                  key={campaign._id}
                  onClick={() => handleCampaignSelect(campaign)}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    selectedCampaign?._id === campaign._id 
                      ? 'border-blue-500 bg-blue-50 shadow-md' 
                      : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center">
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                      <img 
                        src={campaign.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(campaign.name)}&background=0D8ABC&color=fff`} 
                        alt={campaign.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(campaign.name)}&background=0D8ABC&color=fff`;
                        }}
                      />
                    </div>
                    <div className="ml-4">
                      <h3 className="font-medium text-lg">{campaign.name}</h3>
                      <div className="flex items-center mt-1">
                        <span className="text-green-600 font-medium">₹{campaign.referralAmount}</span>
                        <span className="text-gray-500 text-sm ml-1">per successful referral</span>
                      </div>
                      {selectedCampaign?._id === campaign._id && (
                        <div className="mt-2 text-blue-600 text-sm font-medium">Selected</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={`bg-white rounded-lg shadow-sm p-6 mb-6 ${!selectedCampaign ? 'opacity-75' : ''}`}>
          <h2 className="text-xl font-semibold mb-4">Step 2: Enter Your Mobile Number</h2>
          
          <div className="max-w-md">
            <p className="text-gray-600 mb-4">
              This number will be used to track your referrals and earnings.
            </p>
            
            <div className="mb-4">
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Mobile Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <input
                  type="tel"
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter 10-digit mobile number"
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  pattern="\d{10}"
                  disabled={!selectedCampaign}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">Your mobile number will be used to track your earnings</p>
            </div>
            
            <button
              onClick={generateReferralLink}
              disabled={!selectedCampaign || generatingLink}
              className="w-full bg-blue-600 text-white px-4 py-3 rounded-md hover:bg-blue-700 font-medium transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {generatingLink ? (
                <>
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                  Generating...
                </>
              ) : (
                'Generate Referral Link'
              )}
            </button>
          </div>
        </div>

        {referralLink && (
          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-500">
            <h2 className="text-xl font-semibold mb-4">Step 3: Share Your Referral Link</h2>
            
            <div className="mb-6">
              <p className="text-gray-600 mb-2">
                Share this link with your friends. You will earn <span className="font-medium text-green-600">₹{selectedCampaign?.referralAmount}</span> for each friend who completes the offer.
              </p>
              
              <div className="flex items-center mt-4">
                <div className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-l-md truncate font-mono text-sm">
                  {referralLink}
                </div>
                <button
                  onClick={copyToClipboard}
                  className="bg-blue-600 text-white p-3 rounded-r-md hover:bg-blue-700"
                  title="Copy to clipboard"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                    <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <button
                onClick={shareReferralLink}
                className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                </svg>
                Share Link
              </button>
              
              <Link
                to={`/campaigns/${selectedCampaign?.slug || selectedCampaign?._id}`}
                className="flex items-center bg-gray-100 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                </svg>
                View Campaign
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 