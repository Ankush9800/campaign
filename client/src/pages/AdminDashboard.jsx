import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import AdminLogin from './AdminLogin';
import ConversionStats from '../components/ConversionStats';
import ConversionsTable from '../components/ConversionsTable';
import Navbar from '../components/Navbar';

// Main Dashboard Component
export default function AdminDashboard() {
  const navigate = useNavigate();
  // State variables
  const [activeTab, setActiveTab] = useState('dashboard');
  const [campaigns, setCampaigns] = useState([]);
  const [users, setUsers] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [stats, setStats] = useState({
    campaigns: 0,
    users: 0,
    pendingPayouts: 0,
    totalPayout: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [totalConversions, setTotalConversions] = useState(0);
  
  // Conversion-related states
  const [conversions, setConversions] = useState([]);
  const [conversionStats, setConversionStats] = useState({
    total: 0,
    pending: 0,
    completed: 0,
    rejected: 0,
    totalPayout: 0
  });
  const [dbConversionStats, setDbConversionStats] = useState({
    total: 0,
    pending: 0,
    completed: 0,
    rejected: 0,
    totalPayout: 0
  });
  const [conversionStatus, setConversionStatus] = useState('all');
  const [conversionPage, setConversionPage] = useState(1);
  const [conversionLimit, setConversionLimit] = useState(10);
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    trackingUrl: '',
    shareUrl: '',
    imageUrl: '',
    payoutRate: '',
    status: 'active',
    details: '',
    howItWorks: [
      { title: 'Enter your details', description: 'Fill in your mobile number and UPI ID' },
      { title: 'Complete offer requirements', description: 'Follow the instructions on the next page' },
      { title: 'Get paid', description: 'Receive your payout directly to your UPI ID' }
    ]
  });
  
  // Modal states
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [payoutForm, setPayoutForm] = useState({
    userId: '',
    amount: '',
    paymentMethod: 'automatic'
  });
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [navigationState, setNavigationState] = useState(null);
  
  // Edit mode
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  
  // Payout settings
  const [payoutSettings, setPayoutSettings] = useState({
    enabled: false,
    minAmount: 10,
    maxDaily: 5000,
    scheduleTime: '14:00'
  });
  
  // Payment method selection
  const [payoutMethod, setPayoutMethod] = useState('manual');
  const [manualPayoutData, setManualPayoutData] = useState({
    payoutId: '',
    transactionId: ''
  });
  
  // Cashfree configuration
  const [cashfreeConfig, setCashfreeConfig] = useState({
    apiKey: '',
    secretKey: '',
    environment: 'TEST'
  });
  const [cashfreeConfigLoading, setCashfreeConfigLoading] = useState(false);
  const [cashfreeStatus, setCashfreeStatus] = useState({
    isConfigured: false,
    lastUpdated: '-'
  });
  
  // User processes
  const [selectedPhone, setSelectedPhone] = useState(null);
  const [userProcesses, setUserProcesses] = useState({ conversions: [], summary: {} });
  const [processLoading, setProcessLoading] = useState(false);
  
  // Bulk operations
  const [selectedUsers, setSelectedUsers] = useState([]);

  // Add state for HiQmobi data
  const [hiqmobiData, setHiqmobiData] = useState([]);
  const [hiqmobiLoading, setHiqmobiLoading] = useState(false);

  const [dbConversions, setDbConversions] = useState([]);
  const [dbConversionsLoading, setDbConversionsLoading] = useState(false);
  const [dbConversionPage, setDbConversionPage] = useState(1);
  const [dbConversionLimit] = useState(20);
  const [dbConversionStatus, setDbConversionStatus] = useState('all');
  const [dbConversionSearch, setDbConversionSearch] = useState('');
  
  // Referral settings
  const [referralSettings, setReferralSettings] = useState({
    referralAmount: 10,
    enabled: true
  });
  
  // Add fetchStats function definition
  const fetchStats = async () => {
    try {
      const response = await axios.get('https://campaign-pohg.onrender.com/api/admin/stats');
      if (response.status === 200) {
        const { totalPayouts, activeUsers, avgPayout } = response.data;
        setStats({
          totalPayouts: `₹${totalPayouts.toLocaleString()}`,
          activeUsers: activeUsers.toLocaleString(),
          campaigns: campaigns.length.toString(),
          avgPayout: `₹${avgPayout.toLocaleString()}`
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      setError('Failed to fetch statistics');
    }
  };

  // Add additional data fetching useEffect hooks
  // Fetch data when conversion parameters change
  useEffect(() => {
    fetchData();
  }, [conversionPage, conversionLimit, conversionStatus]);

  // Fetch HiQmobi data when activeTab changes to 'hiqmobi'
  useEffect(() => {
    if (activeTab === 'hiqmobi') {
      fetchHiqmobiData();
    }
  }, [activeTab]);

  // Add hook to update total payout amount when payouts data changes
  useEffect(() => {
    console.log('Recalculating total payout amount from website payout data...');
    
    // Calculate total payout amount based on website's payout data
    let totalPayout = 0;
    
    if (Array.isArray(payouts) && payouts.length > 0) {
      console.log('Calculating from', payouts.length, 'website payouts');
      
      // Sum up all payout amounts
      totalPayout = payouts.reduce((sum, payout) => {
        const amount = parseFloat(payout.amount) || 0;
        console.log(`Adding payout: ₹${amount} (${payout.status})`);
        return sum + amount;
      }, 0);
    } else if (campaigns.length > 0) {
      // If no payouts but we have campaigns, use their average payout rate as sample data
      const avgPayoutRate = campaigns.reduce((sum, campaign) => {
        return sum + (parseFloat(campaign.payoutRate) || 0);
      }, 0) / campaigns.length || 0;
      
      console.log(`No payouts found. Using campaign average rate for sample data: ₹${avgPayoutRate}`);
      totalPayout = avgPayoutRate * 2; // Sample value based on campaign rates
    }
    
    console.log(`Setting total payout amount to: ₹${totalPayout.toFixed(2)}`);
    
    // Update stats with new total payout amount
    setStats(prevStats => ({
      ...prevStats,
      totalPayout: totalPayout.toFixed(2)
    }));
  }, [payouts, campaigns]);

  // Handle API errors consistently
  const handleApiError = (err, operation) => {
    const errorMessage = err.response?.data?.error 
      || `Failed to complete ${operation}. Please try again.`;
    setError(errorMessage);
  };

  // Function to fetch all data
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Check if token exists before making requests
      const token = localStorage.getItem('adminToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Ensure axios headers are set
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Fetch users
      const usersResponse = await axios.get('https://campaign-pohg.onrender.com/api/admin/users');
      if (usersResponse.status === 200) {
        setUsers(usersResponse.data);
      }
      
      // Fetch campaigns
      const campaignsResponse = await axios.get('https://campaign-pohg.onrender.com/api/campaigns');
      if (campaignsResponse.status === 200) {
        setCampaigns(campaignsResponse.data);
      }
      
      // Fetch payouts from MongoDB
      const payoutsResponse = await axios.get('https://campaign-pohg.onrender.com/api/admin/payouts');
      if (payoutsResponse.status === 200) {
        setPayouts(payoutsResponse.data);
      }
      
      // Fetch stats
      await fetchStats();
      
    } catch (error) {
      console.error('Error fetching data:', error);
      if (error.response?.status === 401) {
        // Token expired or invalid
        localStorage.removeItem('adminToken');
        delete axios.defaults.headers.common['Authorization'];
        setIsAuthenticated(false);
        toast.error('Session expired. Please login again.');
              } else {
        setError('Failed to fetch data');
      }
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch referral settings
  const fetchReferralSettings = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      // We'll get this from the same endpoint that provides other settings
      const response = await axios.get('https://campaign-pohg.onrender.com/api/settings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data && response.data.referralAmount !== undefined) {
        setReferralSettings({
          ...referralSettings,
          referralAmount: response.data.referralAmount
        });
      }
    } catch (error) {
      console.error('Error fetching referral settings:', error);
      handleApiError(error, 'fetch referral settings');
    }
  };

  // Function to update referral amount
  const updateReferralAmount = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        toast.error('Authentication required');
        return;
      }
      
      setLoading(true);
      
      const response = await axios.post(
        'https://campaign-pohg.onrender.com/api/referrals/admin/settings',
        { referralAmount: referralSettings.referralAmount },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.status === 200) {
        toast.success('Referral amount updated successfully');
      }
    } catch (error) {
      console.error('Error updating referral amount:', error);
      handleApiError(error, 'update referral amount');
    } finally {
      setLoading(false);
    }
  };

  // Check authentication on component mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
      const token = localStorage.getItem('adminToken');
        if (!token) {
          setIsAuthenticated(false);
          setIsCheckingAuth(false);
          return;
        }
      
        // Set the token in axios defaults
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        // Verify the token with the server
        const response = await axios.get('https://campaign-pohg.onrender.com/api/admin/verify');
        if (response.status === 200) {
            setIsAuthenticated(true);
          // Fetch initial data
          await fetchData();
          }
        } catch (err) {
        console.error('Auth check failed:', err);
          localStorage.removeItem('adminToken');
        delete axios.defaults.headers.common['Authorization'];
          setIsAuthenticated(false);
      } finally {
      setIsCheckingAuth(false);
      }
    };

    checkAuth();
  }, []);

  // Handle successful login
  const handleLoginSuccess = () => {
    console.log('Login successful, setting authenticated state');
    setIsAuthenticated(true);
    setIsCheckingAuth(false);
    
    // Make sure to set the axios default header again
    const token = localStorage.getItem('adminToken');
    if (token) {
      console.log('Setting authorization header with token');
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    
    // Fetch data with a small delay to ensure state updates first
    setTimeout(() => {
      fetchData();
      toast.success('Welcome to Admin Dashboard!');
    }, 100);
  };

  // Show loading spinner while checking auth
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen grid place-items-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return <AdminLogin onLoginSuccess={handleLoginSuccess} />;
  }

  if (loading) return <div>Loading...</div>;

  // Fetch payout settings
  const fetchPayoutSettings = async () => {
    try {
      const { data } = await axios.get('https://campaign-pohg.onrender.com/api/settings');
      setPayoutSettings(data.autoPayout);
    } catch (err) {
      console.error('Error fetching payout settings:', err);
    }
  };
  
  // Update payout settings
  const updatePayoutSettings = async () => {
    try {
      const { data } = await axios.patch('https://campaign-pohg.onrender.com/api/settings/auto-payout', payoutSettings);
      setPayoutSettings(data);
    setError('');
      alert('Auto-payout settings updated successfully!');
    } catch (err) {
      setError('Failed to update auto-payout settings');
    }
  };
  
  // Create payout
  const createPayout = async (userId, amount) => {
    try {
      setLoading(true);
      
      // Get the token from localStorage
      const token = localStorage.getItem('adminToken');
      
      // Create a new payout with the token in headers
      const response = await axios.post(
        'https://campaign-pohg.onrender.com/api/payouts',
        {
        userId,
        amount,
        paymentMethod: payoutMethod
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      console.log('Payout created successfully:', response.data);
      setPayouts([...payouts, response.data]);
      setShowPayoutModal(true);
      setManualPayoutData({ payoutId: response.data._id, transactionId: '' });
      toast.success('Payout created successfully');
    } catch (err) {
      console.error('Error creating payout:', err);
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);
      toast.error(err.response?.data?.error || 'Failed to create payout');
    } finally {
      setLoading(false);
    }
  };

  // Process manual payout
  const processManualPayout = async () => {
    try {
      setLoading(true);
      
      if (!manualPayoutData.payoutId || !manualPayoutData.transactionId) {
        setError('Transaction ID is required for manual payouts');
      return;
    }

      await axios.post('https://campaign-pohg.onrender.com/api/payouts/manual-process', manualPayoutData);
      
      setShowPayoutModal(false);
      setManualPayoutData({ payoutId: '', transactionId: '' });
      
      // Refresh payouts
      const { data } = await axios.get('https://campaign-pohg.onrender.com/api/payouts');
      setPayouts(data);
    } catch (err) {
      handleApiError(err, 'process payout');
    } finally {
      setLoading(false);
    }
  };

  // Process automatic payout
  const processAutomaticPayout = async (payoutId) => {
    try {
      setLoading(true);
      await axios.post('https://campaign-pohg.onrender.com/api/payouts/auto-process', { payoutId });
      
      // Refresh payouts
      const { data } = await axios.get('https://campaign-pohg.onrender.com/api/payouts');
      setPayouts(data);
    } catch (err) {
      handleApiError(err, 'automatic payout');
    } finally {
      setLoading(false);
    }
  };

  // Campaign form submission
  const handleCampaignSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      const campaignData = { ...formData };
      
      // If no shareUrl is provided, use trackingUrl
      if (!campaignData.shareUrl.trim()) {
        campaignData.shareUrl = campaignData.trackingUrl;
      }
      
      // Format the payoutRate as a number
      campaignData.payoutRate = parseFloat(campaignData.payoutRate);
      
      // Filter out empty howItWorks steps
      campaignData.howItWorks = campaignData.howItWorks.filter(
        step => step.title.trim() !== '' || step.description.trim() !== ''
      );
      
      // Ensure required fields are present
      if (!campaignData.offerId) {
        campaignData.offerId = `${campaignData.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
      }
      
      if (!campaignData.payout) {
        campaignData.payout = parseFloat(campaignData.payoutRate);
      }
      
      if (editMode) {
        // Update existing campaign
        console.log('Updating campaign with data:', campaignData);
        await axios.put(`https://campaign-pohg.onrender.com/api/campaigns/${editId}`, campaignData);
        toast.success('Campaign updated successfully');
      } else {
        // Create new campaign
        await axios.post('https://campaign-pohg.onrender.com/api/campaigns', campaignData);
        toast.success('Campaign created successfully');
      }
      
      fetchData();
      resetForm();
    } catch (err) {
      handleApiError(err, 'submit campaign');
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
    setEditMode(true);
    setEditId(campaign._id);
    
    // If campaign has no howItWorks, use default
    const defaultHowItWorks = [
      { title: 'Enter your details', description: 'Fill in your mobile number and UPI ID' },
      { title: 'Complete offer requirements', description: 'Follow the instructions on the next page' },
      { title: 'Get paid', description: 'Receive your payout directly to your UPI ID' }
    ];
    
    setFormData({
      name: campaign.name,
      description: campaign.description || '',
      trackingUrl: campaign.trackingUrl,
      shareUrl: campaign.shareUrl || '',
      imageUrl: campaign.imageUrl || '', 
      payoutRate: campaign.payoutRate,
      status: campaign.status,
      details: campaign.details || '',
      howItWorks: campaign.howItWorks || defaultHowItWorks,
      // Add missing required fields
      offerId: campaign.offerId || `${campaign.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
      payout: campaign.payout || campaign.payoutRate
    });
    
    // Scroll to the form
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setActiveTab('campaigns');
  };

  // Delete campaign with confirmation
  const deleteCampaign = async (id) => {
    if(window.confirm('Are you sure you want to delete this campaign? This action cannot be undone.')) {
      try {
        await axios.delete(`https://campaign-pohg.onrender.com/api/campaigns/${id}`);

        setCampaigns(campaigns.filter(c => c._id !== id));
      } catch (err) {
        handleApiError(err, 'delete campaign');
      }
    }
  };

  // User payout status update
  const updatePayoutStatus = async (userId, status) => {
    try {
      await axios.patch(`https://campaign-pohg.onrender.com/api/users/${userId}/status`, { status });

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
        await axios.delete(`https://campaign-pohg.onrender.com/api/users/${userId}`);

        setUsers(users.filter(u => u._id !== userId));
      } catch (err) {
        console.error('Error deleting user:', err);
        setError('Failed to delete user. Please try again.');
      }
    }
  };

  // Reset form state
  const resetForm = () => {
    setFormData({
      _id: '',
      name: '',
      description: '',
      trackingUrl: '',
      shareUrl: '',
      imageUrl: '', // Add image URL field
      payoutRate: '',
      status: 'active',
      details: '',
      offerId: '',
      payout: '',
      howItWorks: [
        { title: 'Enter your details', description: 'Fill in your mobile number and UPI ID' },
        { title: 'Complete offer requirements', description: 'Follow the instructions on the next page' },
        { title: 'Get paid', description: 'Receive your payout directly to your UPI ID' }
      ]
    });
  };

  // Input change handler
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'payoutRate' ? parseFloat(value) || '' : value
    }));
  };

  // Referral settings change handler
  const handleReferralSettingsChange = (e) => {
    const { name, value } = e.target;
    setReferralSettings({
      ...referralSettings,
      [name]: name === 'referralAmount' ? parseFloat(value) || 0 : value
    });
  };

  // Process payouts in bulk for selected users
  const processBulkPayouts = async (instant = false) => {
    try {
      setLoading(true);
      
      if (selectedUsers.length === 0) {
        toast.warn('No users selected for bulk payout');
        setLoading(false);
        return;
      }
      
      const response = await fetch('https://campaign-pohg.onrender.com/api/admin/bulk-payouts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({
          userIds: selectedUsers,
          instantPayment: instant
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to process bulk payouts');
      }
      
      toast.success(`Bulk payout initiated for ${selectedUsers.length} users`);
      
      // Clear selection after successful operation
      setSelectedUsers([]);
      
      // Refresh data
      fetchData();
    } catch (err) {
      handleApiError(err, 'processing bulk payouts');
    } finally {
      setLoading(false);
    }
  };

  // Toggle user selection for bulk operations
  const toggleUserSelection = (userId) => {
    setSelectedUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  // Update Cashfree configuration
  const updateCashfreeConfig = async () => {
    try {
      setCashfreeConfigLoading(true);
      
      const response = await fetch('https://campaign-pohg.onrender.com/api/admin/cashfree-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(cashfreeConfig)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update Cashfree configuration');
      }
      
      toast.success('Cashfree configuration updated successfully');
      
      // Update cashfree status
      const statusResponse = await fetch('https://campaign-pohg.onrender.com/api/admin/cashfree-status', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        setCashfreeStatus(statusData.status);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update Cashfree configuration');
      console.error('Error updating Cashfree config:', err);
    } finally {
      setCashfreeConfigLoading(false);
    }
  };

  // Process new conversions from HiQmobi API
  const processNewConversions = async (instantPayments = false) => {
    try {
      setLoading(true);
      
      toast.info('Starting conversion processing...');
      
      // First, refresh the data from HiQmobi to get the latest conversions
      await fetchHiqmobiData();
      
      // Process each conversion that has all the required fields
      const validConversions = hiqmobiData.filter(conv => 
        conv.clickid && 
        conv.p1 && 
        conv.p2 // Ensure we have all required fields
      );
      
      if (validConversions.length === 0) {
        toast.info('No valid conversions found to process');
        setLoading(false);
        return;
      }
      
      toast.info(`Found ${validConversions.length} conversions to process`);
      
      // Process conversions one by one
      let processedCount = 0;
      let initialPayoutCount = 0;
      let pendingVerificationCount = 0;
      let errorCount = 0;
      
      for (const conv of validConversions) {
        try {
          // Check if this conversion was already processed
          const existingConversion = conversions.find(c => c.id === conv.clickid);
          if (existingConversion && existingConversion.status === 'completed') {
            // Skip already processed conversions
            continue;
          }
          
          // Process the conversion
          await processConversion(conv.p1, conv.p2, conv.offerid, conv.clickid);
          processedCount++;
          initialPayoutCount++;
          pendingVerificationCount++;
          
          // Add a small delay between processing to prevent overwhelming the system
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          console.error(`Error processing conversion ${conv.clickid}:`, error);
          errorCount++;
        }
      }
      
      // Show summary notification
      if (processedCount > 0) {
        toast.success(
          `Successfully processed ${processedCount} conversions: ` + 
          `${initialPayoutCount} initial ₹1 payouts sent, ` + 
          `${pendingVerificationCount} pending verification for final payout`
        );
      }
      
      if (errorCount > 0) {
        toast.error(`Failed to process ${errorCount} conversions`);
      }
      
      // Refresh data after processing
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to process conversions');
      console.error('Error processing conversions:', err);
    } finally {
      setLoading(false);
    }
  };

  // Process a single conversion directly from the UI
  const processConversion = async (phone, upiId, offerId, clickId) => {
    try {
      // Validate required parameters
      if (!phone) {
        toast.error("Phone number is required to process conversion");
        return;
      }
      if (!upiId) {
        toast.error("UPI ID is required for payment");
        return;
      }
      if (!clickId) {
        toast.error("Click ID is required for conversion tracking");
        return;
      }
      
      setLoading(true);
      
      // First, check if user exists by phone number
      let user = users.find(u => u.phone === phone);
      let isNewUser = false;
      
      if (!user) {
        // Create a new user
        isNewUser = true;
        toast.info(`Creating new user for ${phone}`);
        
        // Find a matching campaign based on the offer ID
        const campaign = offerId ? campaigns.find(c => c.trackingUrl.includes(offerId)) : null;
        
        // Prepare user data
        const userData = {
          phone,
          upiId,
          campaignId: campaign ? campaign._id : (campaigns.find(c => c.status === 'active')?._id || 'default'),
          payoutStatus: 'pending',
          // Add tracking data from HiQmobi
          conversionSource: 'hiqmobi',
          clickId: clickId,
          offerId: offerId || null,
          ipAddress: conversions.find(c => c.id === clickId)?.ip || null
        };
        
        // Try to create user with direct API endpoint
        try {
          const createUserResponse = await fetch('https://campaign-pohg.onrender.com/api/users', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            },
            body: JSON.stringify(userData)
          });
          
          if (!createUserResponse.ok) {
            const errorData = await createUserResponse.json();
            throw new Error(errorData.error || 'Failed to create user');
          }
          
          // Get the created user
          user = await createUserResponse.json();
          toast.success(`Successfully created user: ${phone}`);
          
          // Add the new user to our local state
          setUsers(prevUsers => [...prevUsers, user]);
        } catch (err) {
          console.error('Error creating user:', err);
          toast.error(`Failed to create user: ${err.message}`);
          setLoading(false);
          return;
        }
      } else {
        // If user exists but UPI has changed, update it
        if (user.upiId !== upiId) {
          try {
            await fetch(`https://campaign-pohg.onrender.com/api/users/${user._id}`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
              },
              body: JSON.stringify({ upiId })
            });
            
            // Update user in local state
            user.upiId = upiId;
            setUsers(prevUsers => prevUsers.map(u => u._id === user._id ? {...u, upiId} : u));
            toast.info(`Updated UPI ID for ${phone}`);
          } catch (err) {
            console.error('Error updating UPI ID:', err);
            // Continue even if update fails
          }
        }
      }
      
      // Now create a payout based on the user state
      try {
        // If new user, send an initial 1 rupee payout instantly
        if (isNewUser) {
          const initialPayoutResponse = await fetch('https://campaign-pohg.onrender.com/api/payouts', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            },
            body: JSON.stringify({
              userId: user._id,
              amount: 1, // Initial 1 rupee payout
              paymentMethod: 'automatic',
              instantProcess: true, // Process it immediately
              source: 'hiqmobi_initial',
              conversionId: clickId,
              notes: 'Initial registration payout'
            })
          });
          
          if (!initialPayoutResponse.ok) {
            const errorData = await initialPayoutResponse.json();
            console.error('Error creating initial payout:', errorData);
            toast.warning(`Initial payout creation failed: ${errorData.error || 'Unknown error'}`);
          } else {
            toast.success(`Sent ₹1 initial payout to ${phone}`);
          }
        }
        
        // Calculate the remaining payout amount based on the campaign
        const campaign = offerId ? campaigns.find(c => c.trackingUrl.includes(offerId)) : null;
        const totalPayoutAmount = campaign ? campaign.payoutRate : 100; // Default to 100 if no campaign found
        const remainingAmount = isNewUser ? totalPayoutAmount - 1 : totalPayoutAmount; // Subtract the initial 1 rupee if it was a new user
        
        // Create the main payout record (this will be processed manually later)
        const mainPayoutResponse = await fetch('https://campaign-pohg.onrender.com/api/payouts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
          },
          body: JSON.stringify({
            userId: user._id,
            amount: remainingAmount,
            paymentMethod: 'manual', // This will be processed manually after verification
            instantProcess: false,
            source: 'hiqmobi_main',
            conversionId: clickId,
            notes: 'Main payout pending verification'
          })
        });
        
        if (!mainPayoutResponse.ok) {
          const errorData = await mainPayoutResponse.json();
          throw new Error(errorData.error || 'Failed to create main payout');
        }
        
        toast.success(`Created pending payout of ₹${remainingAmount} for ${phone} (requires verification)`);
        
        // Add conversion to the database if it doesn't exist yet
        try {
          await fetch('https://campaign-pohg.onrender.com/api/conversions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            },
            body: JSON.stringify({
              userId: user._id,
              conversionId: clickId,
              offerId: offerId || 'unknown',
              status: 'pending_verification', // Change status to pending verification
              initialPayout: isNewUser ? 1 : 0,
              remainingPayout: remainingAmount,
              totalPayout: totalPayoutAmount,
              source: 'hiqmobi',
              ip: conversions.find(c => c.id === clickId)?.ip || null
            })
          });
        } catch (convErr) {
          console.error('Error saving conversion record:', convErr);
          // Non-critical error, continue
        }
        
        // Refresh data
        fetchData();
      } catch (err) {
        toast.error(err.message || 'Failed to create payout');
        console.error('Error creating payout:', err);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to process conversion');
      console.error('Error processing conversion:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch process details for a specific user
  const fetchUserProcesses = async (phone) => {
    try {
      setProcessLoading(true);
      setSelectedPhone(phone);
      
      const response = await fetch(`https://campaign-pohg.onrender.com/api/admin/user/${phone}/processes`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch user processes');
      }
      
      const data = await response.json();
      setUserProcesses(data);
    } catch (err) {
      handleApiError(err, 'fetching user processes');
    } finally {
      setProcessLoading(false);
    }
  };

  // Add fetch function for HiQmobi data
  const fetchHiqmobiData = async () => {
    try {
      const response = await axios.get('https://campaign-pohg.onrender.com/api/admin/hiqmobi/conversions', {
        params: {
          page: 1,
          limit: 10
        }
      });
      
      if (response.status === 200) {
        const { data, stats } = response.data;
        setHiqmobiData(data);
        setConversionStats(stats);
      }
    } catch (error) {
      console.error('Error fetching HiQmobi data:', error);
      setError('Failed to fetch conversion data');
    }
  };

  // Share campaign function
  const shareCampaign = (campaign) => {
    // Create campaign-specific shareable URL using slug if available, otherwise fall back to ID
    const campaignURL = `${window.location.origin}/campaigns/${campaign.slug || campaign._id}`;
    
    if (navigator.share) {
      navigator.share({
        title: campaign.name,
        text: campaign.description || `Check out this campaign: ${campaign.name}`,
        url: campaignURL
      })
      .then(() => toast.success('Shared successfully!'))
      .catch((err) => {
        console.error('Share error:', err);
        toast.error('Failed to share');
      });
    } else {
      // Fallback for browsers that don't support the Web Share API
      navigator.clipboard.writeText(campaignURL)
        .then(() => toast.success('Campaign link copied to clipboard!'))
        .catch(() => toast.error('Failed to copy link'));
    }
  };

  // Fetch conversions from the database
  const fetchDbConversions = async () => {
    try {
      setDbConversionsLoading(true);
      
      // Check if token exists
      const token = localStorage.getItem('adminToken');
      if (!token) {
        console.error('No auth token found for API request');
        toast.error('Authentication token missing. Please log in again.');
        setDbConversions([]);
        setDbConversionStats({
          total: 0,
          pending: 0,
          completed: 0,
          rejected: 0,
          totalPayout: 0
        });
        return;
      }

      // Call the new endpoint to get conversions from MongoDB
      const response = await axios.get(
        `https://campaign-pohg.onrender.com/api/admin/db-conversions`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            page: dbConversionPage,
            limit: dbConversionLimit,
            status: dbConversionStatus !== 'all' ? dbConversionStatus : undefined,
            search: dbConversionSearch || undefined
          }
        }
      );

      if (response.status !== 200) {
        throw new Error(`Failed to fetch database conversions: ${response.status} ${response.statusText}`);
      }

      const { data } = response;
      console.log('Received database conversions:', data);
      
      if (data && Array.isArray(data.data)) {
        setDbConversions(data.data);
        setDbConversionStats(data.stats);
      } else {
        console.error('Error fetching database conversions:', data.message || 'Unknown error');
        toast.error(`Failed to fetch database conversions: ${data.message || 'Unknown error'}`);
        setDbConversions([]);
      }
    } catch (err) {
      console.error('Exception fetching database conversions:', err);
      handleApiError(err, 'fetching database conversions');
      setDbConversions([]);
    } finally {
      setDbConversionsLoading(false);
    }
  };

  // Render dashboard content based on active tab
  const renderDashboardContent = () => {
    switch (activeTab) {
      case 'dashboard':
  return (
      <div>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-gray-500 text-sm font-medium">Total Campaigns</h3>
                <p className="text-3xl font-bold">{campaigns.length}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {campaigns.filter(c => c.status === 'paused').length} paused
                </p>
    </div>
              
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-gray-500 text-sm font-medium">Total Users</h3>
                <p className="text-3xl font-bold">{users.length}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {users.filter(u => u.payoutStatus === 'pending').length} pending payouts
                </p>
            </div>
              
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-gray-500 text-sm font-medium">Pending Payouts</h3>
                <p className="text-3xl font-bold">{payouts.filter(p => p.status === 'pending').length}</p>
                <p className="text-sm text-gray-500 mt-1">
                  ₹{payouts.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0).toFixed(2)}
                </p>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-gray-500 text-sm font-medium">Total Payout Amount</h3>
                <p className="text-3xl font-bold">₹{stats.totalPayout || '0.00'}</p>
                <p className="text-sm text-gray-500 mt-1">
                  Last 30 days
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Recent Users */}
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <h3 className="text-lg font-medium text-gray-800">Recent Users</h3>
                </div>
                <div className="p-6">
                  <ul className="divide-y divide-gray-200">
                    {users.slice(0, 5).map(user => (
                      <li key={user._id} className="py-4">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            <span className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-blue-600">{user.phone?.substring(0, 2) || 'U'}</span>
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{user.phone || 'No Phone'}</p>
                            <p className="text-sm text-gray-500 truncate">{user.upiId || 'No UPI'}</p>
                          </div>
                          <div>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              user.payoutStatus === 'paid' 
                                ? 'bg-green-100 text-green-800' 
                                : user.payoutStatus === 'rejected'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {user.payoutStatus || 'pending'}
                            </span>
                          </div>
                        </div>
                      </li>
                    ))}
                    {users.length === 0 && (
                      <li className="py-4 text-center text-gray-500">No users registered yet</li>
                    )}
                  </ul>
                </div>
              </div>
              
              {/* Paused Campaigns */}
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <h3 className="text-lg font-medium text-gray-800">Paused Campaigns</h3>
                </div>
                <div className="p-6">
                  <ul className="divide-y divide-gray-200">
                    {campaigns.filter(c => c.status === 'paused').map(campaign => (
                      <li key={campaign._id} className="py-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{campaign.name}</p>
                            <p className="text-sm text-gray-500 truncate max-w-xs mt-1">
                              {campaign.trackingUrl}
                            </p>
                          </div>
                          <button
                            onClick={() => editCampaign(campaign)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Edit
                          </button>
                  </div>
                      </li>
                    ))}
                    {campaigns.filter(c => c.status === 'paused').length === 0 && (
                      <li className="py-4 text-center text-gray-500">No paused campaigns</li>
                    )}
                  </ul>
                            </div>
              </div>
            </div>
          </div>
        );

      case 'campaigns':
        return (
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Campaign Management</h2>

        {/* Campaign Form */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h3 className="text-lg font-medium mb-4">{formData._id ? 'Edit Campaign' : 'Add New Campaign'}</h3>
          <form onSubmit={handleCampaignSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded"
                required
              />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payout Rate (₹)</label>
                    <input
                      type="number"
                      name="payoutRate"
                      value={formData.payoutRate}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded"
                      required
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Referral Amount (₹)</label>
                    <input
                      type="number"
                      name="referralAmount"
                      value={formData.referralAmount || 0}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded"
                      min="0"
                      step="0.01"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Amount paid to referrers for each successful conversion (0 = no referral program)
                    </p>
                  </div>
                </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Offer ID</label>
                <input
                  type="text"
                  name="offerId"
                  value={formData.offerId || ''}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder="Will be auto-generated if empty"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payout Amount (₹)</label>
                <input
                  type="number"
                  name="payout"
                  value={formData.payout || ''}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder="Defaults to Payout Rate if empty"
                      min="0"
                      step="0.01"
                    />
                  </div>
            </div>

            <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded"
                    rows="2"
              ></textarea>
            </div>

            <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tracking URL</label>
              <input
                type="url"
                name="trackingUrl"
                value={formData.trackingUrl}
                onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded"
                required
                    placeholder="https://example.com/track"
              />
                  <p className="text-xs text-gray-500 mt-1">
                    The tracking URL where users will be redirected after form submission.
                  </p>
            </div>

            <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Share URL (Optional)</label>
              <input
                    type="url"
                    name="shareUrl"
                    value={formData.shareUrl}
                onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded"
                    placeholder="Will use tracking URL if left empty"
              />
            </div>

            <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded"
              >
                <option value="active">Active</option>
                <option value="paused">Paused</option>
              </select>
            </div>

                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-4">
                  <h3 className="text-blue-700 font-medium mb-2">Campaign Image</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Image URL</label>
                  <input
                    type="url"
                    name="imageUrl"
                      value={formData.imageUrl || ''}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded"
                    placeholder="https://example.com/image.jpg"
                  />
                    <p className="text-xs text-gray-500 mt-1 mb-2">
                      URL to an image that will be displayed on the campaign page. Recommended size: 300x300 pixels.
                    </p>
                    
                    <div className="mt-2 mb-2 text-xs text-gray-600">
                      <details>
                        <summary className="font-medium cursor-pointer">Sample Image URLs (Click to expand)</summary>
                        <div className="mt-2 space-y-2 pl-2 border-l-2 border-gray-200">
                          <div>
                            <div className="font-medium">Banking Offers:</div>
                            <div>IndusInd Bank: https://i.imgur.com/k9hDu7f.png</div>
                            <div>ICICI Bank: https://i.imgur.com/vLweYHx.png</div>
                            <div>HDFC Bank: https://i.imgur.com/DObgXdx.png</div>
                          </div>
                          <div>
                            <div className="font-medium">Shopping Offers:</div>
                            <div>Amazon: https://i.imgur.com/RTlBgNL.png</div>
                            <div>Flipkart: https://i.imgur.com/FgSS2AO.png</div>
                          </div>
                          <div>
                            <div className="font-medium">App Installs:</div>
                            <div>General App: https://i.imgur.com/BDRe8IW.png</div>
                          </div>
                        </div>
                      </details>
                    </div>
                    
                    {formData.imageUrl ? (
                      <div className="mt-2">
                        <p className="text-sm font-medium mb-1">Image Preview:</p>
                        <div className="border border-gray-200 rounded overflow-hidden w-32 h-32">
                          <img 
                            src={formData.imageUrl} 
                            alt="Campaign Preview" 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name || 'Campaign')}&background=0D8ABC&color=fff&size=300`;
                            }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="mt-2">
                        <p className="text-sm font-medium mb-1">Default Image (if no URL provided):</p>
                        <div className="border border-gray-200 rounded overflow-hidden w-32 h-32">
                          <img 
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name || 'Campaign')}&background=0D8ABC&color=fff&size=300`}
                            alt="Default Campaign" 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Details (HTML)</label>
                  <textarea
                    name="details"
                    value={formData.details || ''}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded font-mono text-sm"
                    rows="3"
                    placeholder="Optional HTML content for additional campaign details"
                  ></textarea>
                </div>

                {/* How It Works Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    How It Works Steps
                  </label>
                  
                  {formData.howItWorks && formData.howItWorks.map((step, index) => (
                    <div key={index} className="flex gap-2 mb-2 items-start">
                      <div className="bg-gray-100 text-gray-700 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-2">
                        {index + 1}
                      </div>
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={step.title}
                          onChange={(e) => updateHowItWorksStep(index, 'title', e.target.value)}
                          className="p-2 border border-gray-300 rounded"
                          placeholder="Step title"
                        />
                        <input
                          type="text"
                          value={step.description}
                          onChange={(e) => updateHowItWorksStep(index, 'description', e.target.value)}
                          className="p-2 border border-gray-300 rounded"
                          placeholder="Step description"
                        />
                      </div>
                      {formData.howItWorks.length > 1 && (
              <button 
                          type="button"
                          onClick={() => removeHowItWorksStep(index)}
                          className="text-red-500 hover:text-red-700 mt-2"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
              </button>
                      )}
                    </div>
                  ))}
                  
                  <button
                    type="button"
                    onClick={addHowItWorksStep}
                    className="mt-2 text-blue-600 hover:text-blue-800 text-sm flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                    </svg>
                    Add Step
                  </button>
                </div>

                <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={resetForm}
                    className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                >
                    {formData._id ? 'Cancel' : 'Reset'}
                </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    {formData._id ? 'Update Campaign' : 'Add Campaign'}
                  </button>
            </div>
          </form>
        </div>

            {/* Campaigns List */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="p-4 border-b">
                <h3 className="text-lg font-medium">Active Campaigns</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Image
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Payout Rate
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Referral Amount
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                </tr>
              </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                {campaigns.map(campaign => (
                      <tr key={campaign._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">{campaign.name}</div>
                          <div className="text-xs text-gray-500 truncate max-w-xs mt-1">
                            {campaign.trackingUrl}
                          </div>
                    </td>
                    <td className="px-6 py-4">
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {campaign.description || 'No description'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        campaign.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {campaign.status}
                      </span>
                    </td>
                        <td className="px-6 py-4 text-center">
                          {campaign.imageUrl ? (
                            <div className="mx-auto w-10 h-10 rounded-full overflow-hidden shadow-sm border border-gray-200">
                              <img 
                                src={campaign.imageUrl} 
                                alt={campaign.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(campaign.name)}&background=0D8ABC&color=fff&size=300`;
                                }}
                              />
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                // For IndusInd Bank campaign
                                if (campaign.name.includes('IndusInd')) {
                                  updateCampaignImage(campaign._id, 'https://i.imgur.com/k9hDu7f.png');
                                } else {
                                  // For other campaigns, open edit form
                                  setFormData({...campaign});
                                  setActiveTab('campaigns');
                                }
                              }}
                              className="text-blue-600 hover:text-blue-800 text-xs px-2 py-1 bg-blue-50 rounded"
                            >
                              Add Image
                            </button>
                          )}
                    </td>
                        <td className="px-6 py-4 text-right">
                          <div className="text-sm font-medium text-gray-900">₹{campaign.payoutRate}</div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="text-sm font-medium text-gray-900">
                            {campaign.referralAmount > 0 ? `₹${campaign.referralAmount}` : '—'}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                setFormData({...campaign});
                                setActiveTab('campaigns');
                              }}
                              className="text-blue-600 hover:text-blue-900"
                              title="Edit Campaign"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                              </svg>
                            </button>
                      <button
                              onClick={() => handleCampaignStatusToggle(campaign._id, campaign.status === 'active' ? 'inactive' : 'active')}
                              className={`${
                                campaign.status === 'active' ? 'text-yellow-600 hover:text-yellow-900' : 'text-green-600 hover:text-green-900'
                              }`}
                              title={campaign.status === 'active' ? 'Pause Campaign' : 'Activate Campaign'}
                            >
                              {campaign.status === 'active' ? (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                              ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                </svg>
                              )}
                      </button>
                      <button
                        onClick={() => deleteCampaign(campaign._id)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete Campaign"
                      >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                      </button>
                            <button
                              onClick={() => shareCampaign(campaign)}
                              className="text-indigo-600 hover:text-indigo-900"
                              title="Share Campaign"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                              </svg>
                            </button>
                          </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
          </div>
        );
        
      case 'users':
        return (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">User Management</h2>
              
              {/* Bulk Payout Controls */}
              <div className="flex space-x-2">
                <select
                  value={payoutMethod}
                  onChange={(e) => setPayoutMethod(e.target.value)}
                  className="border rounded px-2 py-1 text-sm"
                >
                  <option value="manual">Manual Payout</option>
                  <option value="automatic">Automatic Payout</option>
                </select>
                
                <button
                  onClick={processBulkPayouts}
                  disabled={selectedUsers.length === 0 || loading}
                  className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:bg-gray-400"
                >
                  Process {selectedUsers.length} Payouts
                </button>
              </div>
            </div>
            
            {/* User List */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-lg font-medium text-gray-800">Registered Users</h3>
              </div>
              <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <input
                          type="checkbox"
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedUsers(users.filter(u => u.payoutStatus === 'pending').map(u => u._id));
                            } else {
                              setSelectedUsers([]);
                            }
                          }}
                          className="rounded text-blue-600"
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">UPI ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map(user => (
                      <tr key={user._id} className={user.payoutStatus === 'paid' ? 'bg-green-50' : ''}>
                        <td className="px-4 py-3">
                          {user.payoutStatus === 'pending' && (
                            <input
                              type="checkbox"
                              checked={selectedUsers.includes(user._id)}
                              onChange={() => toggleUserSelection(user._id)}
                              className="rounded text-blue-600"
                            />
                          )}
                        </td>
                    <td className="px-4 py-3">{user.phone}</td>
                    <td className="px-4 py-3">{user.upiId}</td>
                    <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            user.payoutStatus === 'paid' 
                              ? 'bg-green-100 text-green-800' 
                              : user.payoutStatus === 'rejected'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {user.payoutStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3 flex space-x-2">
                          {user.payoutStatus === 'pending' && (
                            <button
                              onClick={() => createPayout(user._id, campaigns.find(c => c._id === user.campaignId)?.payoutRate || 0)}
                              className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                            >
                              Create Payout
                            </button>
                          )}
                          <button
                            onClick={() => deleteUser(user._id)}
                            className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200"
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
        );
        
      case 'payouts':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-800">Manage Payouts</h2>
              <div className="flex space-x-2">
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none">
                      <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                  <input
                    type="text"
                    placeholder="Search payouts..."
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <button
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                  onClick={async () => {
                    try {
                      const pendingPayouts = payouts.filter(p => p.status === 'pending');
                      if (pendingPayouts.length > 0) {
                        toast.info(`Processing ${pendingPayouts.length} pending payouts...`);
                        for (const payout of pendingPayouts) {
                          try {
                            await axios.post('https://campaign-pohg.onrender.com/api/payouts/auto-process', {
                              payoutId: payout._id
                            });
                          } catch (error) {
                            console.error(`Failed to process payout ${payout._id}:`, error);
                            toast.error(`Failed to process payout for ${payout.user?.phone || 'user'}`);
                          }
                        }
                        toast.success('Finished processing payouts');
                        fetchData(); // Refresh the data
                    } else {
                        toast.info('No pending payouts to process');
                      }
                    } catch (error) {
                      toast.error('Failed to process payouts');
                      console.error('Error processing payouts:', error);
                    }
                  }}
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Process All Pending
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                <span className="block sm:inline">{error}</span>
              </div>
            )}

            {loading ? (
              <div className="flex justify-center py-10">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : payouts.length === 0 ? (
              <div className="bg-white shadow-md rounded-lg p-6 text-center">
                <p className="text-gray-500">No payouts found</p>
                <button
                  onClick={fetchData}
                  className="mt-4 text-blue-600 hover:text-blue-800"
                >
                  Refresh Data
                </button>
              </div>
            ) : (
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {payouts.map((payout, index) => (
                        <tr key={payout._id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 mr-3">
                                {payout.user?.phone?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                  {payout.user?.phone || 'Unknown User'}
                              </div>
                                <div className="text-sm text-gray-500">ID: {payout.user?._id || 'N/A'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              <div className="flex items-center">
                                <span>{payout.user?.phone || 'N/A'}</span>
                                {payout.user?.phone && (
                            <button 
                                    onClick={() => copyToClipboard(payout.user.phone)}
                              className="ml-2 text-gray-500 hover:text-blue-600"
                              title="Copy phone number"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                              </svg>
                            </button>
                                )}
                          </div>
                              <div className="flex items-center">
                                <span>UPI: {payout.user?.upiId || 'N/A'}</span>
                                {payout.user?.upiId && (
                              <button 
                                    onClick={() => copyToClipboard(payout.user.upiId)}
                                className="ml-2 text-gray-500 hover:text-blue-600"
                                title="Copy UPI ID"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                </svg>
                              </button>
                            )}
                              </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">₹{payout.amount?.toFixed(2) || '0.00'}</div>
                            {payout.conversionSummary && (
                              <div className="text-xs text-gray-500">
                                Offer: {payout.conversionSummary.offerName || 'N/A'}
                              </div>
                            )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            payout.status === 'completed' ? 'bg-green-100 text-green-800' :
                            payout.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                              {payout.status?.charAt(0).toUpperCase() + (payout.status?.slice(1) || '')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {payout.createdAt ? new Date(payout.createdAt).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {payout.status === 'pending' ? (
                            <>
                              <button
                                onClick={async () => {
                                  try {
                                      toast.success(`Processing payout for ${payout.user?.phone || 'user'}`);
                                      const response = await axios.post('https://campaign-pohg.onrender.com/api/payouts/auto-process', {
                                        payoutId: payout._id
                                      });
                                      
                                      if (response.status === 200) {
                                        toast.success('Payout processed successfully');
                                        fetchData(); // Refresh the data
                                      }
                                  } catch (error) {
                                    toast.error(`Failed to process payout: ${error.message}`);
                                    console.error("Payout processing error:", error);
                                  }
                                }}
                                className="text-green-600 hover:text-green-900 mr-3"
                              >
                                Process
                              </button>
                              <button
                                onClick={async () => {
                                  try {
                                      toast.success(`Rejecting payout for ${payout.user?.phone || 'user'}`);
                                      const response = await axios.put(`https://campaign-pohg.onrender.com/api/payouts/${payout._id}/reject`, {
                                        reason: 'Rejected by admin' 
                                      });
                                      
                                      if (response.status === 200) {
                                        toast.success('Payout rejected successfully');
                                        fetchData(); // Refresh the data
                                      }
                                  } catch (error) {
                                    toast.error(`Failed to reject payout: ${error.message}`);
                                    console.error("Payout rejection error:", error);
                                  }
                                }}
                                className="text-red-600 hover:text-red-900"
                              >
                                Reject
                              </button>
                            </>
                          ) : (
                            <span className="text-gray-500">
                                {payout.status === 'completed' ? 'Processed' : 
                               payout.status === 'rejected' ? 'Rejected' : payout.status}
                            </span>
                          )}
                            <button 
                              onClick={() => {
                                // Show payout details in a modal or new page
                                toast.info('Payout details feature coming soon');
                              }}
                              className="text-blue-600 hover:text-blue-900 ml-3"
                            >
                            Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            )}
          </div>
        );
      case 'conversions':
        return (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">HiQmobi Conversions</h2>
              
              <div className="flex space-x-2">
                <select
                  value={conversionStatus}
                  onChange={(e) => setConversionStatus(e.target.value)}
                  className="border rounded px-3 py-1"
                >
                  <option value="all">All Status</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                </select>
                
                <button
                  onClick={() => processNewConversions(true)}
                  disabled={loading}
                  className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition-colors disabled:bg-gray-400"
                >
                  Process with Instant Pay
                </button>
                
                <button
                  onClick={() => processNewConversions(false)}
                  disabled={loading}
                  className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                >
                  Process Normally
                </button>
              </div>
            </div>
            
            {/* Conversion Stats using our new component */}
            <ConversionStats stats={conversionStats} loading={hiqmobiLoading} />
            
            {/* Conversions Table using our new component */}
            <ConversionsTable conversions={hiqmobiData} loading={hiqmobiLoading} />
            
            {/* Pagination Controls */}
            <div className="flex justify-between items-center mt-4">
              <div>
                <span className="text-sm text-gray-600">
                  Showing {hiqmobiData.length} entries
                </span>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setConversionPage(prev => Math.max(1, prev - 1))}
                  disabled={conversionPage === 1}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="px-3 py-1 text-sm">Page {conversionPage}</span>
                <button
                  onClick={() => setConversionPage(prev => prev + 1)}
                  className="px-3 py-1 border rounded"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        );
      case 'db-conversions':
        return (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Stored Conversions</h2>
              
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Search phone/UPI..."
                  value={dbConversionSearch}
                  onChange={(e) => setDbConversionSearch(e.target.value)}
                  className="border rounded px-3 py-1"
                />
                
                <select
                  value={dbConversionStatus}
                  onChange={(e) => setDbConversionStatus(e.target.value)}
                  className="border rounded px-3 py-1"
                >
                  <option value="all">All Status</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                </select>
                
                <button
                  onClick={fetchDbConversions}
                  disabled={dbConversionsLoading}
                  className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                >
                  Refresh
                </button>
              </div>
            </div>
            
            {/* Conversion Stats using our component */}
            <ConversionStats stats={dbConversionStats} loading={dbConversionsLoading} />
            
            {/* Conversions Table using our component */}
            <ConversionsTable conversions={dbConversions} loading={dbConversionsLoading} />
            
            {/* Pagination Controls */}
            <div className="flex justify-between items-center mt-4">
              <div>
                <span className="text-sm text-gray-600">
                  Showing {dbConversions.length} entries
                </span>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setDbConversionPage(prev => Math.max(1, prev - 1))}
                  disabled={dbConversionPage === 1}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="px-3 py-1 text-sm">Page {dbConversionPage}</span>
                <button
                  onClick={() => setDbConversionPage(prev => prev + 1)}
                  className="px-3 py-1 border rounded"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        );
      case 'hiqmobi':
        return (
          <div className="p-4">
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">HiQmobi Conversion Tracking</h2>
              <p className="text-gray-600 mb-4">
                This tab helps you track and process conversions coming from the HiQmobi API. Any user who submits data through 
                your affiliate campaigns will appear here for processing.
              </p>
              
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-6">
                <h3 className="text-lg font-medium text-blue-800 mb-2">How Campaign Submissions are Captured</h3>
                <ol className="list-decimal pl-5 space-y-2 text-blue-700">
                  <li>
                    <strong>Campaign submission:</strong> When a user submits data through a campaign form, their phone, UPI ID, and other details are sent to the HiQmobi API
                  </li>
                  <li>
                    <strong>Data tracking:</strong> HiQmobi records the submission with a unique Click ID, Offer ID, and other tracking data
                  </li>
                  <li>
                    <strong>Admin processing:</strong> You can process these conversions here to create user accounts and initiate payouts
                  </li>
                </ol>
              </div>
            </div>
            
            <div className="mb-4 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-medium">Conversion Data</h3>
                <p className="text-sm text-gray-500">
                  {hiqmobiData.length} conversions available • 
                  Last updated: {new Date().toLocaleTimeString()}
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={fetchHiqmobiData}
                  className="bg-blue-600 text-white py-1 px-4 rounded hover:bg-blue-700 flex items-center"
                  disabled={hiqmobiLoading}
                >
                  {hiqmobiLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Loading...
                    </>
                  ) : "Refresh Data"}
                </button>
                <button
                  onClick={() => processNewConversions(false)}
                  className="bg-green-600 text-white py-1 px-4 rounded hover:bg-green-700"
                  disabled={hiqmobiLoading || loading}
                >
                  Process All (₹1 now + pending)
                </button>
                <button
                  onClick={() => processNewConversions(true)}
                  className="bg-purple-600 text-white py-1 px-4 rounded hover:bg-purple-700"
                  disabled={hiqmobiLoading || loading}
                >
                  Process with Verification
                </button>
              </div>
            </div>
            
            {hiqmobiLoading ? (
              <div className="flex justify-center py-10">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="overflow-x-auto bg-white rounded-lg shadow">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Click ID
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Phone
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        UPI ID
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Offer ID
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Goal Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        IP
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {hiqmobiData.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="px-4 py-5 text-center text-gray-500">
                          No HiQmobi data available
                        </td>
                      </tr>
                    ) : (
                      hiqmobiData.map((item, index) => {
                        // Check if this conversion was already processed
                        const existingConversion = conversions.find(c => c.id === item.clickid);
                        const isProcessed = existingConversion && existingConversion.status === 'completed';
                        
                        return (
                          <tr key={index} className={isProcessed ? 'bg-green-50' : ''}>
                            <td className="px-4 py-2 whitespace-nowrap font-mono text-sm">
                              {item.clickid || 'N/A'}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap font-medium">
                              {item.p1 ? (
                                <div className="flex items-center">
                                  <span>{item.p1}</span>
                                  <button 
                                    onClick={() => copyToClipboard(item.p1)}
                                    className="ml-2 text-gray-500 hover:text-blue-600"
                                    title="Copy phone number"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                    </svg>
                                  </button>
                                </div>
                              ) : 'N/A'}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap font-mono text-sm">
                              {item.p2 ? (
                                <div className="flex items-center">
                                  <span>{item.p2}</span>
                                  <button 
                                    onClick={() => copyToClipboard(item.p2)}
                                    className="ml-2 text-gray-500 hover:text-blue-600"
                                    title="Copy UPI ID"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                    </svg>
                                  </button>
                                </div>
                              ) : 'N/A'}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap">
                              {item.offerid || 'N/A'}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap">
                              {item.goalName || 'N/A'}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap font-mono text-xs">
                              {item.ip || 'N/A'}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap">
                              {isProcessed ? (
                                <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                                  Processed
                                </span>
                              ) : (
                                <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
                                  Pending
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => item.p1 && item.p2 && item.clickid ? 
                                    processConversion(item.p1, item.p2, item.offerid, item.clickid) : 
                                    toast.error('Missing required data for processing')}
                                  className={`text-xs ${
                                    isProcessed ? 
                                      'bg-gray-100 text-gray-500' :
                                      item.p1 && item.p2 && item.clickid ? 
                                        'bg-green-100 text-green-700 hover:bg-green-200' : 
                                        'bg-gray-100 text-gray-400 cursor-not-allowed'
                                  } px-2 py-1 rounded`}
                                  disabled={isProcessed || !item.p1 || !item.p2 || !item.clickid}
                                >
                                  {isProcessed ? 'Processed' : 'Send ₹1 + Create Pending Payout'}
                                </button>
                                
                                {item.p1 && (
                                  <button
                                    onClick={() => {
                                      // Find if user exists for this phone
                                      const user = users.find(u => u.phone === item.p1);
                                      if (user) {
                                        toast.info(`User exists with ID: ${user._id}`);
                                      } else {
                                        toast.info(`No existing user found for ${item.p1}`);
                                      }
                                    }}
                                    className="text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 px-2 py-1 rounded"
                                  >
                                    Check User
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
            
            <div className="mt-8 bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="text-lg font-medium mb-2">How to test the conversion process:</h3>
              <ol className="list-decimal pl-5 space-y-2">
                <li>
                  Submit data through your campaign form with a valid phone number and UPI ID
                </li>
                <li>
                  Click "Refresh Data" on this page to fetch the new submission from HiQmobi
                </li>
                <li>
                  Process the conversion by clicking "Process" next to the specific entry or "Process All" for all entries
                </li>
                <li>
                  Verify that a user account was created and a payout was initiated in the Users and Payouts tabs
                </li>
              </ol>
            </div>
          </div>
        );
      case 'referrals':
        return (
          <div className="p-4">
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">Referral Program Management</h2>
              <p className="text-gray-600 mb-4">
                Manage your referral program settings and view referral statistics.
              </p>
            </div>
            
            {/* Referral Settings Section */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h3 className="text-lg font-medium mb-4">Referral Settings</h3>
              
              <div className="flex items-center space-x-4 mb-6">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Referral Reward Amount (₹)
                  </label>
                  <input
                    type="number"
                    value={referralSettings.referralAmount || 0}
                    onChange={(e) => handleReferralSettingsChange(e)}
                    name="referralAmount"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter amount in ₹"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Amount users will receive for each successful referral
                  </p>
                </div>
                
                <div className="mt-6">
                  <button
                    onClick={updateReferralAmount}
                    className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving...
                      </span>
                    ) : "Save Settings"}
                  </button>
                </div>
              </div>
            </div>
            
            {/* Referral Statistics */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h3 className="text-lg font-medium mb-4">Referral Statistics</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Total Referrals</p>
                  <p className="text-2xl font-bold text-blue-600">0</p>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Successful Referrals</p>
                  <p className="text-2xl font-bold text-green-600">0</p>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Total Rewards Paid</p>
                  <p className="text-2xl font-bold text-purple-600">₹0</p>
                </div>
              </div>
            </div>
            
            {/* Referral Links Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-800">Recent Referrals</h3>
                <button
                  onClick={() => fetchReferralSettings()}
                  className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                  </svg>
                  Refresh
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Referrer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Referred User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reward</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                        No referral data available
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      case 'settings':
        return (
          <div className="p-4">
            <h2 className="text-xl font-semibold mb-4">Settings</h2>
            <p className="text-gray-600 mb-6">
              Configure application settings and preferences.
            </p>
            
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-medium mb-4">General Settings</h3>
              <p className="text-gray-500 mb-4">
                More settings will be added in future updates.
              </p>
            </div>
          </div>
        );
    }
  };

  // Update how it works steps
  const updateHowItWorksStep = (index, field, value) => {
    const updatedSteps = [...formData.howItWorks];
    updatedSteps[index] = {
      ...updatedSteps[index],
      [field]: value
    };
    
    setFormData({
      ...formData,
      howItWorks: updatedSteps
    });
  };
  
  // Add a new step to how it works
  const addHowItWorksStep = () => {
    setFormData({
      ...formData,
      howItWorks: [
        ...formData.howItWorks,
        { title: '', description: '' }
      ]
    });
  };
  
  // Remove a step from how it works
  const removeHowItWorksStep = (index) => {
    // Don't allow less than one step
    if (formData.howItWorks.length <= 1) return;
    
    const updatedSteps = [...formData.howItWorks];
    updatedSteps.splice(index, 1);
    
    setFormData({
      ...formData,
      howItWorks: updatedSteps
    });
  };

  // Add this function near other utility functions
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => toast.success('Copied to clipboard!'))
      .catch(() => toast.error('Failed to copy'));
  };

  // Update a campaign's image URL
  const updateCampaignImage = async (campaignId, imageUrl) => {
    try {
      setLoading(true);
      
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Authentication required');
        return;
      }
      
      const response = await axios.put(
        `https://campaign-pohg.onrender.com/api/campaigns/${campaignId}`,
        { imageUrl },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.status === 200) {
        toast.success('Campaign image updated successfully');
        // Refresh campaigns list
        fetchCampaigns();
      }
    } catch (error) {
      console.error('Error updating campaign image:', error);
      toast.error(error.response?.data?.message || 'Failed to update campaign image');
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch only campaigns
  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      
      // Check if token exists before making requests
      const token = localStorage.getItem('adminToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Ensure axios headers are set
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Fetch campaigns
      const campaignsResponse = await axios.get('https://campaign-pohg.onrender.com/api/campaigns');
      if (campaignsResponse.status === 200) {
        setCampaigns(campaignsResponse.data);
      }
      
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      handleApiError(error, 'fetch campaigns');
    } finally {
      setLoading(false);
    }
  };

  // Toggle campaign status (active/inactive)
  const handleCampaignStatusToggle = async (campaignId, newStatus) => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        toast.error('Authentication required');
        return;
      }
      
      const response = await axios.put(
        `https://campaign-pohg.onrender.com/api/campaigns/${campaignId}`,
        { status: newStatus },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.status === 200) {
        toast.success(`Campaign ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
        // Update campaigns in state
        setCampaigns(campaigns.map(c => 
          c._id === campaignId ? { ...c, status: newStatus } : c
        ));
      }
    } catch (error) {
      console.error('Error updating campaign status:', error);
      handleApiError(error, 'update campaign status');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto p-4">
        <div className="bg-white rounded-xl shadow-md">
          <div className="p-6">
            <div className="mb-8">
              <div className="border-b border-gray-200">
                <nav className="flex space-x-4 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                  <button 
                    className={`border-b-2 py-4 px-1 text-sm font-medium ${
                      activeTab === 'dashboard' 
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                    onClick={() => setActiveTab('dashboard')}
                  >
                    Dashboard
                  </button>
                  <button 
                    className={`border-b-2 py-4 px-1 text-sm font-medium ${
                      activeTab === 'campaigns' 
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                    onClick={() => setActiveTab('campaigns')}
                  >
                    Campaigns
                  </button>
                  <button 
                    className={`border-b-2 py-4 px-1 text-sm font-medium ${
                      activeTab === 'users' 
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                    onClick={() => setActiveTab('users')}
                  >
                    Users
                  </button>
                  <button 
                    className={`border-b-2 py-4 px-1 text-sm font-medium ${
                      activeTab === 'payouts' 
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                    onClick={() => setActiveTab('payouts')}
                  >
                    Payouts
                  </button>
                  <button 
                    className={`border-b-2 py-4 px-1 text-sm font-medium ${
                      activeTab === 'conversions' 
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                    onClick={() => setActiveTab('conversions')}
                  >
                    Conversions
                  </button>
                  <button 
                    className={`border-b-2 py-4 px-1 text-sm font-medium ${
                      activeTab === 'db-conversions' 
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                    onClick={() => setActiveTab('db-conversions')}
                  >
                    Stored Conversions
                  </button>
                  <button 
                    className={`border-b-2 py-4 px-1 text-sm font-medium ${
                      activeTab === 'hiqmobi' 
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                    onClick={() => setActiveTab('hiqmobi')}
                  >
                    HiQmobi
                  </button>
                  <button 
                    className={`border-b-2 py-4 px-1 text-sm font-medium ${
                      activeTab === 'referrals' 
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                    onClick={() => setActiveTab('referrals')}
                  >
                    Referrals
                  </button>
                  <button 
                    className={`border-b-2 py-4 px-1 text-sm font-medium ${
                      activeTab === 'settings' 
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                    onClick={() => setActiveTab('settings')}
                  >
                    Settings
                  </button>
                </nav>
              </div>
            </div>
            {renderDashboardContent()}
          </div>
        </div>
      </div>
    </div>
  );
}
