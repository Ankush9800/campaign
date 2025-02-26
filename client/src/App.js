import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import AdminDashboard from './pages/AdminDashboard';
import CampaignPage from './pages/CampaignPage';

function App() {
  return (
    <Router>
      <div className="pt-16 grid place-items-center">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/admin" element={<AdminDashboard />} /> {/* No protection */}
          <Route path="/campaigns/:id" element={<CampaignPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;