import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import FindSquad from './pages/FindSquad';
import PostSquad from './pages/PostSquad';
import Profile from './pages/Profile';
import Auth from './pages/Auth';
import AuthCallback from './pages/AuthCallback';
import Onboarding from './pages/Onboarding';
import Admin from './pages/Admin';
import Inbox from './pages/Inbox';
import DirectMessage from './pages/DirectMessage';
import SquadProfile from './pages/SquadProfile';
import UserProfile from './pages/UserProfile';
import SquadChat from './pages/SquadChat';
import MySquads from './pages/MySquads';
import ManageSquad from './pages/ManageSquad';
import PrivacyInfo from './pages/PrivacyInfo';
import Diagnostics from './pages/Diagnostics';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { MySquadsProvider } from './context/MySquadsContext';

const RouteGuard = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return null;
  }

  const path = location.pathname;
  const publicPaths = ['/auth', '/auth/callback'];
  const isPublicPath = publicPaths.includes(path);

  if (user && !user.onboardingComplete && path !== '/onboarding' && !isPublicPath) {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <MySquadsProvider>
        <ToastProvider>
          <Router>
            <div className="min-h-screen bg-[#0e0f11] text-charcoal-dark font-tactical">
              <Navbar />
              <main className="container mx-auto px-3 py-5 sm:px-4 sm:py-8">
                <RouteGuard>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/find" element={<FindSquad />} />
                    <Route path="/post" element={<PostSquad />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/auth/callback" element={<AuthCallback />} />
                    <Route path="/onboarding" element={<Onboarding />} />
                    <Route path="/my-squads" element={<MySquads />} />
                    <Route path="/inbox" element={<Inbox />} />
                    <Route path="/dm/:id" element={<DirectMessage />} />
                    <Route path="/squad/:id" element={<SquadProfile />} />
                    <Route path="/squad/:id/chat" element={<SquadChat />} />
                    <Route path="/squad/:id/manage" element={<ManageSquad />} />
                    <Route path="/user/:id" element={<UserProfile />} />
                    <Route path="/admin" element={<Admin />} />
                    <Route path="/privacy" element={<PrivacyInfo />} />
                    <Route path="/diag" element={<Diagnostics />} />
                  </Routes>
                </RouteGuard>
              </main>
            </div>
          </Router>
        </ToastProvider>
      </MySquadsProvider>
    </AuthProvider>
  );
}

export default App;
