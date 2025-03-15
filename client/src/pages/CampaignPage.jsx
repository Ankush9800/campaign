import { useState, useEffect } from 'react';
import { useParams, Link, Navigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
// import { toast } from 'react-hot-toast';

// Create a temporary toast function until react-hot-toast is installed
const toast = {
  success: (message) => console.log('SUCCESS:', message),
  error: (message) => console.error('ERROR:', message)
};

export default function CampaignPage() {
  const { slug } = useParams();
  const location = useLocation();
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    phone: '',
    upiId: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [referralCode, setReferralCode] = useState(null);

  // Extract referral code from URL if present
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const ref = queryParams.get('ref');
    if (ref) {
      console.log('Referral code detected:', ref);
      setReferralCode(ref);
      
      // Store referral code in session storage to use later
      sessionStorage.setItem('referralCode', ref);
      
      // Track the referral click
      trackReferralClick(ref);
    }
  }, [location.search]);
  
  // Track referral click
  const trackReferralClick = async (code) => {
    try {
      // Get a user identifier - could be from localStorage if user has used the site before
      const userId = localStorage.getItem('userId') || '';
      
      await axios.get(`https://campaign-pohg.onrender.com/api/referrals/track/${code}`, {
        params: { userId }
      });
      console.log('Referral click tracked');
    } catch (err) {
      console.error('Error tracking referral click:', err);
    }
  };

  useEffect(() => {
    const fetchCampaign = async () => {
      try {
        const response = await fetch(`https://campaign-pohg.onrender.com/api/campaigns/${slug}`);

        if (!response.ok) throw new Error('Campaign not found');
        const data = await response.json();
        console.log('Fetched campaign data:', data);
        setCampaign(data);
      } catch (err) {
        console.error('Error fetching campaign:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCampaign();
  }, [slug]);

  // If campaign is paused, redirect to CampaignPaused page
  if (campaign && campaign.status === 'paused') {
    return <Navigate to="/campaign-paused" replace />;
  }

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError('');

    try {
      // Validate inputs
      if (!/^\d{10}$/.test(formData.phone)) {
        throw new Error('Please enter a valid 10-digit phone number');
      }

      if (!formData.upiId.includes('@')) {
        throw new Error('Please enter a valid UPI ID (e.g., example@upi)');
      }

      // Get referral code from state or session storage
      const refCode = referralCode || sessionStorage.getItem('referralCode');
      
      // Store user ID in localStorage for future visits
      localStorage.setItem('userId', formData.phone);

      // Submit user details to backend
      await axios.post('https://campaign-pohg.onrender.com/api/users', {
        phone: formData.phone,
        upiId: formData.upiId,
        campaignId: slug,
        referralCode: refCode // Include referral code if present
      });

      // Mark as successful submission
      setSubmitSuccess(true);
      toast.success('Details submitted successfully!');

      // Encode UPI ID
      const encodedUPI = encodeURIComponent(formData.upiId);

      // Build the affiliate link
      const affiliateLink = `${campaign.trackingUrl}?p1=${formData.phone}&p2=${encodedUPI}`;
      
      // If there was a referral, send a click update
      if (refCode) {
        try {
          await axios.post('https://campaign-pohg.onrender.com/api/referrals/conversion', {
            referralCode: refCode,
            userId: formData.phone,
            conversionId: `${campaign._id}-${Date.now()}` // Use actual campaign ID
          });
          console.log('Referral conversion tracked');
        } catch (refErr) {
          console.error('Error tracking referral conversion:', refErr);
          // Don't block the main flow if referral tracking fails
        }
      }

      // Set a short timeout before redirecting to allow user to see success message
      setTimeout(() => {
        window.location.href = affiliateLink;
      }, 1500);

    } catch (err) {
      setSubmitError(err.response?.data?.message || err.message);
      toast.error('Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Function to share the campaign
  const shareCampaign = () => {
    const shareUrl = campaign.shareUrl || window.location.href;
    
    if (navigator.share) {
      navigator.share({
        title: campaign.name,
        text: campaign.description || `Check out this campaign: ${campaign.name}`,
        url: shareUrl
      })
      .then(() => console.log('Shared successfully'))
      .catch((err) => console.error('Share error:', err));
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(shareUrl)
        .then(() => {
          toast.success('Link copied to clipboard!');
        })
        .catch(err => {
          console.error('Copy failed:', err);
          toast.error('Failed to copy link');
        });
    }
  };

  // Function to navigate to referral page
  const generateReferralLink = () => {
    // Only navigate if the campaign has a referral program
    if (campaign.referralAmount > 0) {
      // Navigate to the referral page with campaign ID in the URL
      window.location.href = `/refer?campaign=${campaign._id}`;
    } else {
      toast.error('This campaign does not have a referral program');
    }
  };

  // Default campaign image if none provided
  const defaultImageUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(campaign?.name || 'Campaign')}&background=0D8ABC&color=fff&size=300`;
  const campaignImage = campaign?.imageUrl || defaultImageUrl;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="bg-red-100 text-red-700 p-4 rounded-lg shadow-md">
          {error}
        </div>
      </div>
    );
  }

  if (!campaign) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Campaign Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-14 px-4 relative overflow-hidden">
        {/* Background pattern */}
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

        {/* Share buttons */}
        <div className="absolute top-4 right-4 flex space-x-2">
          <button 
            onClick={shareCampaign} 
            className="bg-white bg-opacity-20 p-2 rounded-full hover:bg-opacity-30 transition-all"
            title="Share campaign"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
            </svg>
          </button>
          {campaign.referralAmount > 0 && (
            <button 
              onClick={generateReferralLink} 
              className="bg-green-500 bg-opacity-90 p-2 rounded-full hover:bg-green-600 transition-all flex items-center"
              title="Refer & Earn"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
              </svg>
            </button>
          )}
        </div>
        
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-lg overflow-hidden bg-white shadow-lg flex-shrink-0">
              <img 
                src={campaignImage}
                alt={campaign.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  console.log("Image failed to load, using fallback");
                  e.target.onerror = null;
                  e.target.src = defaultImageUrl;
                }}
              />
            </div>
            
            <div className="text-center md:text-left">
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                {campaign.name}
              </h1>
              
              {campaign.description && (
                <p className="text-lg opacity-90 mb-4 md:pr-12">
                  {campaign.description}
                </p>
              )}
              
              <div className="flex flex-wrap justify-center md:justify-start items-center gap-3">
                <div className="bg-white bg-opacity-20 px-4 py-2 rounded-lg backdrop-blur-sm flex items-center">
                  <span className="mr-2">Status:</span>
                  <span className={`px-2 py-0.5 rounded text-sm font-medium ${
                    campaign.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {campaign.status}
                  </span>
                </div>
                
                <div className="bg-white bg-opacity-20 px-4 py-2 rounded-lg backdrop-blur-sm flex items-center">
                  <span className="mr-2">Campaign ID:</span>
                  <span className="font-mono text-sm">{campaign._id}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Payout Banner */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 py-4 text-white text-center">
        <div className="max-w-lg mx-auto px-4 flex justify-center items-center gap-3">
          <span className="text-lg">Earn up to:</span>
          <span className="text-3xl font-bold">₹{campaign.payoutRate}</span>
          <span className="bg-white bg-opacity-20 px-2 py-1 rounded text-sm">per completion</span>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="max-w-lg mx-auto px-4">
        {/* Instructions Card */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            How it works
          </h2>
          <ol className="space-y-4 text-gray-600">
            {campaign.howItWorks && campaign.howItWorks.length > 0 ? (
              // Use custom steps if available
              campaign.howItWorks.map((step, index) => (
                <li key={index} className="flex items-start">
                  <div className="bg-blue-100 text-blue-600 rounded-full w-7 h-7 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0 font-medium">
                    {index + 1}
                  </div>
                  <div>
                    <span className="font-medium text-gray-800">{step.title}</span>
                    <p className="text-sm mt-1">{step.description}</p>
                  </div>
                </li>
              ))
            ) : (
              // Default steps if none available
              <>
                <li className="flex items-start">
                  <div className="bg-blue-100 text-blue-600 rounded-full w-7 h-7 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0 font-medium">
                    1
                  </div>
                  <div>
                    <span className="font-medium text-gray-800">Enter your details</span>
                    <p className="text-sm mt-1">Fill in your mobile number and UPI ID below</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="bg-blue-100 text-blue-600 rounded-full w-7 h-7 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0 font-medium">
                    2
                  </div>
                  <div>
                    <span className="font-medium text-gray-800">Complete offer requirements</span>
                    <p className="text-sm mt-1">Follow the instructions on the next page to complete the offer</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="bg-blue-100 text-blue-600 rounded-full w-7 h-7 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0 font-medium">
                    3
                  </div>
                  <div>
                    <span className="font-medium text-gray-800">Get paid</span>
                    <p className="text-sm mt-1">Receive your payout directly to your UPI ID once verified</p>
                  </div>
                </li>
              </>
            )}
          </ol>
        </div>
        
        {/* Form Card */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Enter your details
          </h2>
          
          {submitSuccess ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-lg font-medium text-green-800">Success!</h3>
              <p className="text-green-700">Your details have been submitted. Redirecting you now...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Mobile Number *
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
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    pattern="\d{10}"
                    placeholder="Enter 10-digit mobile number"
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">Your mobile number will be used to track your offer completion</p>
              </div>
              
              <div>
                <label htmlFor="upiId" className="block text-sm font-medium text-gray-700 mb-1">
                  UPI ID *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    id="upiId"
                    name="upiId"
                    value={formData.upiId}
                    onChange={handleInputChange}
                    placeholder="Enter your UPI ID (e.g., example@upi)"
                    pattern=".+@.+"
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">Your earnings will be sent to this UPI ID</p>
              </div>

              {submitError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                  <div className="flex">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span>{submitError}</span>
                  </div>
                </div>
              )}
              
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-blue-600 text-white px-4 py-3 rounded-md hover:bg-blue-700 font-medium transition-colors disabled:bg-gray-400 flex items-center justify-center text-lg"
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    Continue to Offer
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </>
                )}
              </button>
            </form>
          )}
          
          <div className="mt-6 border-t pt-4">
            <div className="flex items-center justify-center text-gray-500 text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Your data is secure and will only be used for this campaign
            </div>
          </div>
        </div>
        
        {/* Referral Card */}
        {campaign.referralAmount > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6 mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Refer & Earn
              </h2>
              <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                ₹{campaign.referralAmount} per referral
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg mb-4">
              <div className="flex items-start">
                <div className="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0 font-medium">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-gray-800 text-lg">Earn extra money by referring friends!</h3>
                  <p className="text-gray-600 mt-1">
                    Share your unique referral link with friends. When they complete this offer, you'll earn ₹{campaign.referralAmount} for each successful referral.
                  </p>
                </div>
              </div>
            </div>
            
            <button
              onClick={generateReferralLink}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
              </svg>
              Get My Referral Link
            </button>
          </div>
        )}
        
        {/* Campaign Details */}
        {campaign.details && (
          <div className="bg-white rounded-xl shadow-sm p-6 mt-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Campaign Details</h2>
            <div className="prose prose-blue max-w-none">
              <div dangerouslySetInnerHTML={{ __html: campaign.details }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}