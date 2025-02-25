import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import '../index.css';

export default function CampaignPage() {
  const { id } = useParams();
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    phone: '',
    upiId: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    const fetchCampaign = async () => {
      try {
        const response = await fetch(`https://taskwala-backend.onrender.com/api/campaigns/${id}`);
        if (!response.ok) throw new Error('Campaign not found');
        const data = await response.json();
        setCampaign(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCampaign();
  }, [id]);

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

      // Submit user details to backend
      await axios.post('https://taskwala-backend.onrender.com/api/users', {
        phone: formData.phone,
        upiId: formData.upiId,
        campaignId: id
      });

      // Encode UPI ID
      const encodedUPI = encodeURIComponent(formData.upiId);

      // Build the affiliate link
      const affiliateLink = `${campaign.trackingUrl}?p1=${formData.phone}&p2=${encodedUPI}`;

      // Redirect user
      window.location.href = affiliateLink;

    } catch (err) {
      setSubmitError(err.response?.data?.message || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;
  if (error) return <div className="text-center py-8 text-red-600">{error}</div>;

  return (
    <div className="pt-4 min-h-screen grid place-items-center px-4 xl:w-1/4 lg:w-1/2 md:w-1">
      <div className="w-full max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-4 text-center">{campaign.name}</h1>
          
          <div className="space-y-4 max-w-2xl mx-auto">
            {/* Campaign Details */}
            <div className="text-center">
              <label className="text-sm font-medium text-gray-600">Status:</label>
              <span className={`ml-2 px-2.5 py-0.5 rounded text-sm ${
                campaign.status === 'active' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {campaign.status}
              </span>
            </div>

            <div className="text-center">
              <label className="text-sm font-medium text-gray-600">Payout Rate:</label>
              <span className="ml-2 text-blue-600 font-medium block mt-1">
                ₹{campaign.payoutRate}
              </span>
            </div>

            {/* User Details Form */}
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  pattern="\d{10}"
                  placeholder="Enter 10-digit mobile number"
                  className="mt-1 block w-full rounded-md border-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="upiId" className="block text-sm font-medium text-gray-700">
                  UPI ID
                </label>
                <input
                  type="text"
                  id="upiId"
                  name="upiId"
                  value={formData.upiId}
                  onChange={handleInputChange}
                  placeholder="Enter your UPI ID (e.g., example@upi)"
                  pattern=".+@.+"
                  className="mt-1 block w-full rounded-md border-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>

              {submitError && (
                <div className="text-red-600 text-sm">{submitError}</div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400"
              >
                {submitting ? 'Submitting...' : 'Proceed to Tracking'}
              </button>
            </form>
            
            <div className="text-center">
              <label className="text-sm font-medium text-gray-600">Description:</label>
              <p className="mt-1 text-gray-700 whitespace-pre-line px-4">
                {campaign.description}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}