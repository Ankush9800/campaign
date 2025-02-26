import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SignedIn, SignedOut, SignIn, SignUp, UserButton } from '@clerk/clerk-react';
import Home from './pages/Home';
import AdminDashboard from './pages/AdminDashboard';
import CampaignPage from './pages/CampaignPage';

function App() {
  return (
    <Router>
      <div className="pt-16 grid place-items-center">
        <SignedIn>
          <UserButton />
        </SignedIn>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/admin"
            element={
              <SignedIn>
                <AdminDashboard />
              </SignedIn>
            }
          />
          <Route
            path="/sign-in"
            element={
              <SignedOut>
                <SignIn />
              </SignedOut>
            }
          />
          <Route
            path="/sign-up"
            element={
              <SignedOut>
                <SignUp />
              </SignedOut>
            }
          />
          <Route path="/campaigns/:id" element={<CampaignPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;