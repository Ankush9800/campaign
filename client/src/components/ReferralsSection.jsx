import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ReferralsSection = ({ userId }) => {
  const [referrals, setReferrals] = useState([]);
  const [stats, setStats] = useState({
    totalReferrals: 0,
    totalClicks: 0,
    totalConversions: 0,
    totalEarned: 0,
    conversionRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchReferrals = async () => {
      if (!userId) return;
      
      try {
        setLoading(true);
        const response = await axios.get(`https://campaign-pohg.onrender.com/api/referrals/user/${userId}`);
        
        if (response.data) {
          setReferrals(response.data.referrals || []);
          setStats(response.data.stats || {});
        }
      } catch (err) {
        console.error('Error fetching referrals:', err);
        setError('Failed to load your referrals. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchReferrals();
  }, [userId]);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        console.log('Referral link copied to clipboard!');
        // You could use a toast notification here
      })
      .catch((err) => {
        console.error('Failed to copy link:', err);
      });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 my-4 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 my-4">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (referrals.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 my-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Your Referrals</h2>
        <p className="text-gray-500">You haven't created any referrals yet. Share campaigns with your friends to earn rewards!</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 my-4">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Your Referrals</h2>
      
      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-indigo-50 p-3 rounded-lg">
          <p className="text-sm text-gray-500">Total Referrals</p>
          <p className="text-xl font-bold text-indigo-600">{stats.totalReferrals || 0}</p>
        </div>
        
        <div className="bg-blue-50 p-3 rounded-lg">
          <p className="text-sm text-gray-500">Total Clicks</p>
          <p className="text-xl font-bold text-blue-600">{stats.totalClicks || 0}</p>
        </div>
        
        <div className="bg-green-50 p-3 rounded-lg">
          <p className="text-sm text-gray-500">Conversions</p>
          <p className="text-xl font-bold text-green-600">{stats.totalConversions || 0}</p>
        </div>
        
        <div className="bg-purple-50 p-3 rounded-lg">
          <p className="text-sm text-gray-500">Total Earned</p>
          <p className="text-xl font-bold text-purple-600">₹{stats.totalEarned || 0}</p>
        </div>
      </div>
      
      {/* Referrals List */}
      <div className="space-y-4">
        {referrals.map((referral) => (
          <div key={referral.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                {referral.campaignImage ? (
                  <img 
                    src={referral.campaignImage} 
                    alt={referral.campaignName} 
                    className="w-10 h-10 rounded-full mr-3 object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(referral.campaignName)}&background=0D8ABC&color=fff&size=100`;
                    }}
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full mr-3 bg-gray-200 flex items-center justify-center text-gray-500">
                    {referral.campaignName.charAt(0)}
                  </div>
                )}
                <div>
                  <h3 className="font-medium text-gray-900">{referral.campaignName}</h3>
                  <p className="text-xs text-gray-500">
                    Created {new Date(referral.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="block text-sm font-medium text-gray-900">₹{referral.amount} per referral</span>
                <span className="block text-xs text-gray-500">
                  {referral.conversionCount} conversions
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
              <div className="text-sm">
                <span className="text-gray-500">Clicks: {referral.clickCount}</span>
                <span className="mx-2">•</span>
                <span className="text-gray-500">Earned: ₹{referral.totalEarned}</span>
              </div>
              <button
                onClick={() => copyToClipboard(referral.referralLink)}
                className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
              >
                Copy Link
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReferralsSection; 