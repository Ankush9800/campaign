import { useState, useEffect } from 'react';
import { Link } from "react-router-dom";
import axios from 'axios';

export default function AdminDashboard() {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    trackingUrl: '',
    payoutRate: '',
    status: 'active'
  });

  const [campaigns, setCampaigns] = useState([]);
  const [users, setUsers] = useState([]);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [campaignsRes, usersRes] = await Promise.all([
          axios.get('https://taskwala-backend.onrender.com/api/campaigns'),
          axios.get('https://taskwala-backend.onrender.com/api/users')
        ]);
        setCampaigns(campaignsRes.data);
        setUsers(usersRes.data);
      } catch (err) {
        setError('Failed to load data. Please try refreshing the page.');
      }
    };
    
    fetchData();
  }, []);

  // ... Keep all your existing handler functions unchanged ...

  return (
    <div className="pt-20 min-h-screen p-4 bg-gray-50">
      <div className="max-w-7xl mx-auto flex gap-8">
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
              {/* Keep form inputs exactly as they were */}
              {/* ... Your existing form fields ... */}
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