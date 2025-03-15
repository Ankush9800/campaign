import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';

// Create a temporary replacement for motion elements from framer-motion
const Motion = {
  div: (props) => <div {...props} />,
  section: (props) => <section {...props} />,
  h2: (props) => <h2 {...props} />,
  p: (props) => <p {...props} />
};

// Create a temporary toast implementation
const toast = {
  success: (message) => console.log('SUCCESS:', message),
  error: (message) => console.error('ERROR:', message)
};

export default function Home() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    totalPayouts: '₹75000+',
    activeUsers: '7000+',
    campaigns: '0',
    avgPayout: '₹250+'
  });

  useEffect(() => {
    document.title = 'Taskwala - Complete Tasks & Earn Money';

    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch campaigns
        const campaignsResponse = await axios.get('https://campaign-pohg.onrender.com/api/campaigns');
        if (campaignsResponse.status !== 200) {
          throw new Error('Failed to fetch campaigns');
        }
        
        const activeCampaigns = campaignsResponse.data.filter(campaign => campaign.status === 'active');
        setCampaigns(activeCampaigns);

        // Set stats with fixed values for payouts and users, but dynamic campaign count
        setStats({
          totalPayouts: '₹75000+',
          activeUsers: '7000+',
          campaigns: `${activeCampaigns.length}`,
          avgPayout: '₹250+'
        });
        
        // Clear any previous errors since we at least have campaigns
        setError('');
      } catch (err) {
        setError('Failed to load data. Please try again later.');
        console.error('Data fetch error:', err);
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Animate items on scroll
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  // Handle "Get" button click
  const handleGetClick = (campaign) => {
    // Use slug if available, otherwise use ID
    const identifier = campaign.slug || campaign._id;
    window.location.href = `/campaigns/${identifier}`;
  };

  return (
    <>
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-20 lg:pt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center">
            {/* Hero Text */}
            <Motion.div 
              className="lg:w-1/2 text-center lg:text-left"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 tracking-tight">
                Earn Money with <span className="text-blue-600">Taskwala</span>
              </h1>
              <p className="mt-6 text-xl text-gray-500 max-w-3xl">
                Join our affiliate program and complete simple tasks to earn money. 
                Get paid directly to your UPI account!
              </p>
              <div className="mt-10 flex flex-col sm:flex-row justify-center lg:justify-start gap-4">
                <Link 
                  to="#campaigns" 
                  onClick={() => document.getElementById('campaigns').scrollIntoView({ behavior: 'smooth' })}
                  className="px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:text-lg transition-colors"
                >
                  View Campaigns
                </Link>
                <Link 
                  to="/how-it-works"
                  className="px-8 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-blue-50 hover:bg-blue-100 md:text-lg transition-colors"
                >
                  How It Works
                </Link>
              </div>
            </Motion.div>

            {/* Hero Image */}
            <Motion.div 
              className="lg:w-1/2 mt-10 lg:mt-0"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <img 
                src="https://images.unsplash.com/photo-1579389083078-4e7018379f7e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2070&q=80" 
                alt="Earning money online" 
                className="w-full h-auto rounded-lg shadow-xl"
              />
            </Motion.div>
          </div>
        </div>
      </section>
      
      {/* Stats Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Motion.div 
            className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="p-6 bg-white shadow-lg rounded-xl">
              <h2 className="text-3xl font-bold text-blue-600">{stats.totalPayouts}</h2>
              <p className="text-gray-600 mt-2">Total Payouts</p>
            </div>
            <div className="p-6 bg-white shadow-lg rounded-xl">
              <h2 className="text-3xl font-bold text-blue-600">{stats.activeUsers}</h2>
              <p className="text-gray-600 mt-2">Active Users</p>
            </div>
            <div className="p-6 bg-white shadow-lg rounded-xl">
              <h2 className="text-3xl font-bold text-blue-600">{stats.campaigns}</h2>
              <p className="text-gray-600 mt-2">Campaigns</p>
            </div>
            <div className="p-6 bg-white shadow-lg rounded-xl">
              <h2 className="text-3xl font-bold text-blue-600">{stats.avgPayout}</h2>
              <p className="text-gray-600 mt-2">Avg. Payout</p>
            </div>
          </Motion.div>
        </div>
      </section>
      
      {/* How It Works Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Motion.div 
            className="text-center mb-12"
            {...fadeInUp}
          >
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              How It Works
            </h2>
            <p className="mt-4 text-xl text-gray-600">
              Earn money in three simple steps
            </p>
          </Motion.div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Motion.div 
              className="bg-white p-8 rounded-xl shadow-lg relative"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <div className="w-12 h-12 flex items-center justify-center bg-blue-100 text-blue-600 rounded-full text-xl font-bold mb-6">
                1
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Choose a Campaign</h3>
              <p className="text-gray-600">
                Browse through our available campaigns and select one that interests you. Each campaign shows the task and payout.
              </p>
            </Motion.div>
            
            <Motion.div 
              className="bg-white p-8 rounded-xl shadow-lg relative"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <div className="w-12 h-12 flex items-center justify-center bg-blue-100 text-blue-600 rounded-full text-xl font-bold mb-6">
                2
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Complete the Task</h3>
              <p className="text-gray-600">
                Follow the instructions and complete the required tasks accurately. Make sure to provide your UPI details.
              </p>
            </Motion.div>
            
            <Motion.div 
              className="bg-white p-8 rounded-xl shadow-lg relative"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              <div className="w-12 h-12 flex items-center justify-center bg-blue-100 text-blue-600 rounded-full text-xl font-bold mb-6">
                3
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Get Paid</h3>
              <p className="text-gray-600">
                Once your task is verified, you'll receive your payment directly to your UPI account. It's that simple!
              </p>
            </Motion.div>
          </div>
        </div>
      </section>
      
      {/* Campaigns Section */}
      <section id="campaigns" className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Motion.div 
            className="text-center mb-12"
            {...fadeInUp}
          >
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Active Campaigns
            </h2>
            <p className="mt-4 text-xl text-gray-600">
              Choose a campaign and start earning today
            </p>
          </Motion.div>
          
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading campaigns...</p>
            </div>
          ) : error ? (
            <div className="bg-red-100 text-red-700 p-6 rounded-lg text-center max-w-lg mx-auto">
              <h3 className="font-bold text-lg mb-2">Error</h3>
              <p>{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : campaigns.length === 0 ? (
            <div className="bg-yellow-100 text-yellow-700 p-6 rounded-lg text-center max-w-lg mx-auto">
              <h3 className="font-bold text-lg mb-2">No Campaigns Available</h3>
              <p>There are no active campaigns at the moment. Please check back later!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {campaigns.map((campaign, index) => (
                <Motion.div
                key={campaign._id}
                  className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 * index }}
              >
                <div className="p-6 h-full flex flex-col">
                    <div className="flex-grow">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-xl font-bold text-gray-900">
                    {campaign.name}
                        </h3>
                        <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                      {campaign.status}
                    </span>
                      </div>
                      <p className="text-gray-600 mb-4 line-clamp-3">
                        {campaign.description}
                      </p>
                      <div className="mt-4 flex justify-between items-center">
                        <div className="text-gray-500 text-sm">Est. Time: 10 mins</div>
                        <div className="text-lg font-bold text-blue-600">₹{campaign.payoutRate}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleGetClick(campaign)}
                      className="mt-6 w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      Get Started
                    </button>
                  </div>
                </Motion.div>
              ))}
            </div>
          )}
        </div>
      </section>
      
      {/* Testimonials Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Motion.div 
            className="text-center mb-12"
            {...fadeInUp}
          >
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              What Our Users Say
            </h2>
            <p className="mt-4 text-xl text-gray-600">
              Join thousands of satisfied users earning with Taskwala
            </p>
          </Motion.div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Motion.div 
              className="bg-white p-6 rounded-xl shadow"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <div className="flex items-center mb-4">
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-600 font-semibold">RM</span>
                </div>
                <div className="ml-4">
                  <h4 className="font-semibold text-gray-900">Rahul M.</h4>
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-gray-600">
                "I've earned over ₹5,000 in the past month by completing simple tasks on Taskwala. The payouts are quick and reliable!"
              </p>
            </Motion.div>
            
            <Motion.div 
              className="bg-white p-6 rounded-xl shadow"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <div className="flex items-center mb-4">
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-600 font-semibold">PS</span>
                </div>
                <div className="ml-4">
                  <h4 className="font-semibold text-gray-900">Priya S.</h4>
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
              </div>
              </div>
              <p className="text-gray-600">
                "As a college student, Taskwala has been a great way to make extra income. The tasks are easy and I can do them in my free time."
              </p>
            </Motion.div>
            
            <Motion.div 
              className="bg-white p-6 rounded-xl shadow"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              <div className="flex items-center mb-4">
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-600 font-semibold">AK</span>
                </div>
                <div className="ml-4">
                  <h4 className="font-semibold text-gray-900">Amit K.</h4>
                  <div className="flex text-yellow-400">
                    {[...Array(4)].map((_, i) => (
                      <svg key={i} xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-300" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </div>
                </div>
              </div>
              <p className="text-gray-600">
                "The direct UPI payment makes this platform stand out. I receive my money within 24 hours of completing a task!"
              </p>
            </Motion.div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl py-12 px-8 md:py-16 md:px-12 shadow-xl">
            <div className="max-w-3xl mx-auto text-center">
              <Motion.h2 
                className="text-3xl font-extrabold text-white sm:text-4xl"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                Ready to Start Earning?
              </Motion.h2>
              <Motion.p 
                className="mt-4 text-xl text-blue-100"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                Join thousands of users who are already earning with Taskwala.
                It only takes a minute to get started!
              </Motion.p>
              <Motion.div 
                className="mt-8"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <a
                  href="#campaigns"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('campaigns').scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="inline-block px-8 py-3 border border-transparent text-base font-medium rounded-md bg-white text-blue-600 hover:bg-blue-50 md:text-lg transition-colors"
                >
                  View Campaigns
                </a>
              </Motion.div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">Taskwala</h3>
              <p className="text-gray-400">
                The leading affiliate platform for earning through simple tasks.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li>
                  <Link to="/" className="text-gray-400 hover:text-white transition-colors">
                    Home
                  </Link>
                </li>
                <li>
                  <Link to="/how-it-works" className="text-gray-400 hover:text-white transition-colors">
                    How It Works
                  </Link>
                </li>
                <li>
                  <Link to="#campaigns" className="text-gray-400 hover:text-white transition-colors"
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById('campaigns').scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    Campaigns
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="text-gray-400 hover:text-white transition-colors">
                    Contact Us
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}