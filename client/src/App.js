import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Home from './pages/Home';
import AdminDashboard from './pages/AdminDashboard';
import CampaignPage from './pages/CampaignPage';
import CampaignPaused from './pages/CampaignPaused';
import ContactUs from './pages/ContactUs';
import ReferralPage from './pages/ReferralPage';

function App() {
  return (
    <Router>
      <div className="pt-16 grid place-items-center">
        <Toaster position="top-center" />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/admin" element={<AdminDashboard />} /> {/* No protection */}
          <Route path="/campaigns/:slug" element={<CampaignPage />} />
          <Route path="/campaign-paused" element={<CampaignPaused />} />
          <Route path="/contact" element={<ContactUs />} />
          <Route path="/refer" element={<ReferralPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;