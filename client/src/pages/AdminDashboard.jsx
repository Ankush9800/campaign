import { useState, useEffect } from 'react';
import { Link } from "react-router-dom";
import axios from 'axios';
import LoginForm from './LoginForm';

export default function AdminDashboard() {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    trackingUrl: '',
    payoutRate: '',
    status: 'active'
  });
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [campaigns, setCampaigns] = useState([]);
  const [users, setUsers] = useState([]);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showUserModal, setShowUserModal] = useState(false);

  useEffect(() => {
  axios.get('https://taskwala-backend.onrender.com/admin/check-auth', { 
    withCredentials: true // Include cookies
  })
    .then(res => setIsAuthenticated(res.data.authenticated))
    .catch(() => setIsAuthenticated(false))
    .finally(() => setLoading(false)); // Ensure loading is set to false
}, []);

  // Fetch campaigns and users with separate error handling
  useEffect(() => {
    const fetchData = async () => {
      try {
        const campaignsRes = await axios.get('https://taskwala-backend.onrender.com/api/campaigns');
        setCampaigns(campaignsRes.data);
      } catch (err) {
        setError('Failed to load campaigns. Please try refreshing the page.');
      }

      try {
        const usersRes = await axios.get('https://taskwala-backend.onrender.com/api/users');
        setUsers(usersRes.data);
      } catch (err) {
        setError('Failed to load user data. User management features disabled.');
      }
    };
    
    fetchData();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (!isAuthenticated) return <LoginForm />;

  // Campaign form submission
  const handleCampaignSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      const url = editingCampaign 
        ? `https://taskwala-backend.onrender.com/api/campaigns/${editingCampaign._id}`
        : 'https://taskwala-backend.onrender.com/api/campaigns';
      
      const method = editingCampaign ? 'PUT' : 'POST';
      
      const { data } = await axios({
        method,
        url,
        data: formData
      });

      if(editingCampaign) {
        setCampaigns(campaigns.map(c => c._id === data._id ? data : c));
      } else {
        setCampaigns([...campaigns, data]);
      }
      
      resetForm();
    } catch (err) {
      handleApiError(err, 'campaign operation');
    } finally {
      setLoading(false);
    }
  };

  // Form validation
  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Campaign name is required');
      return false;
    }
    if (isNaN(formData.payoutRate) || parseFloat(formData.payoutRate) <= 0) {
      setError('Invalid payout rate');
      return false;
    }
    return true;
  };

  // Edit campaign
  const editCampaign = (campaign) => {
    setEditingCampaign(campaign);
    setFormData({
      name: campaign.name,
      description: campaign.description,
      trackingUrl: campaign.trackingUrl,
      payoutRate: campaign.payoutRate,
      status: campaign.status
    });
  };

  // Delete campaign with confirmation
  const deleteCampaign = async (id) => {
    if(window.confirm('Are you sure you want to delete this campaign? This action cannot be undone.')) {
      try {
        await axios.delete(`https://taskwala-backend.onrender.com/api/campaigns/${id}`);
        setCampaigns(campaigns.filter(c => c._id !== id));
      } catch (err) {
        handleApiError(err, 'delete campaign');
      }
    }
  };

  // User payout status update
  const updatePayoutStatus = async (userId, status) => {
    try {
      await axios.patch(`https://taskwala-backend.onrender.com/api/users/${userId}/status`, { status });
      setUsers(users.map(u => u._id === userId ? { ...u, payoutStatus: status } : u));
    } catch (err) {
      console.error('Error updating payout status:', err);
      setError('Failed to update payout status. Please try again.');
    }
  };

  // Delete user with confirmation
    const deleteUser = async (userId) => {
    if (window.confirm('Permanently delete this user record?')) {
      try {
        await axios.delete(`https://taskwala-backend.onrender.com/api/users/${userId}`);
        setUsers(users.filter(u => u._id !== userId));
      } catch (err) {
        console.error('Error deleting user:', err);
        setError('Failed to delete user. Please try again.');
      }
    }
  };

  // Handle API errors consistently
  const handleApiError = (err, operation) => {
    const errorMessage = err.response?.data?.error 
      || `Failed to complete ${operation}. Please try again.`;
    setError(errorMessage);
  };

  // Reset form state
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      trackingUrl: '',
      payoutRate: '',
      status: 'active'
    });
    setEditingCampaign(null);
  };

  // Input change handler
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'payoutRate' ? parseFloat(value) || '' : value
    }));
  };

  return (
    <div className="pt-20 min-h-screen p-4 bg-gray-50">
      <div className="max-w-7xl mx-auto flex gap-8">
      <div>
      {/* Admin panel content */}
      <button 
        onClick={() => axios.get('https://taskwala-backend.onrender.com/logout')}
        className="bg-red-500 text-white px-4 py-2 rounded"
      >
        Logout
      </button>
    </div>
        {/* Left Column - Campaign Management */}
        <div className="flex-1 max-w-2xl">
          <h1 className="text-3xl font-bold text-gray-800 mb-8">Campaign Management</h1>

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
              {error}
            </div>
          )}

        {/* Campaign Form */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            {editingCampaign ? 'Edit Campaign' : 'Create New Campaign'}
          </h2>
          <form onSubmit={handleCampaignSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Campaign Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded-lg h-32 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              ></textarea>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tracking URL *
              </label>
              <input
                type="url"
                name="trackingUrl"
                value={formData.trackingUrl}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
                pattern="https?://.+"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payout Rate (₹) *
              </label>
              <input
                type="number"
                name="payoutRate"
                min="0"
                step="0.01"
                value={formData.payoutRate}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status *
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="active">Active</option>
                <option value="paused">Paused</option>
              </select>
            </div>

            <div className="flex gap-4">
              <button 
                type="submit" 
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex-1 disabled:bg-gray-400"
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Campaign'}
              </button>
              {editingCampaign && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors flex-1"
                >
                  Cancel Edit
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Campaign List */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Status</th>
                  <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">Payout</th>
                  <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {campaigns.map(campaign => (
                  <tr key={campaign._id}>
                    <td className="px-6 py-4 text-gray-800">
                      <Link 
                        to={`/campaigns/${campaign._id}`} 
                        className="text-blue-600 hover:underline"
                      >
                        {campaign.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 text-xs font-medium rounded ${
                        campaign.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {campaign.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-blue-600 font-medium">
                      ₹{campaign.payoutRate}
                    </td>
                    <td className="px-6 py-4 text-right space-x-4">
                      <button
                        onClick={() => editCampaign(campaign)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteCampaign(campaign._id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column - User Management */}
        <div className="flex-1 max-w-2xl">
          <h1 className="text-3xl font-bold text-gray-800 mb-8">User Management</h1>
          
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Phone</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">UPI ID</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Status</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map(user => (
                  <tr key={user._id}>
                    <td className="px-4 py-3">{user.phone}</td>
                    <td className="px-4 py-3">{user.upiId}</td>
                    <td className="px-4 py-3">
                      <select
                        value={user.payoutStatus || 'pending'}
                        onChange={(e) => updatePayoutStatus(user._id, e.target.value)}
                        className="border rounded px-2 py-1 text-sm"
                      >
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => deleteUser(user._id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}