import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, NavLink, Navigate, useNavigate } from 'react-router-dom';
import { Menu, X, Globe, User, Sparkles, AlertCircle, LogOut, LogIn } from 'lucide-react';
import Home from './pages/Home.tsx';
import Planner from './pages/Planner.tsx';
import GenerationScreen from './pages/GenerationScreen.tsx';
import Itinerary from './pages/Itinerary.tsx';
import RouteBuilder from './pages/RouteBuilder.tsx';
import HiddenGems from './pages/HiddenGems.tsx';
import Experiences from './pages/Experiences.tsx';
import Homestays from './pages/Homestays.tsx';
import Passport from './pages/Passport.tsx';
import Intelligence from './pages/Intelligence.tsx';
import Profile from './pages/Profile.tsx';
import Admin from './pages/Admin.tsx';
import Login from './pages/Login.tsx';
import { ProtectedRoute } from './components/ProtectedRoute.tsx';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { isOffline, registerNetworkStatusListener } from './services/offline.ts';

function AppContent() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [online, setOnline] = useState(!isOffline());
  const [language, setLanguage] = useState('English');
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = registerNetworkStatusListener((isOnline) => {
      setOnline(isOnline);
    });
    return unsubscribe;
  }, []);

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'English' ? 'Hindi' : prev === 'Hindi' ? 'Bhojpuri' : 'English');
  };

  const handleLogout = async () => {
    await logout();
    setMobileMenuOpen(false);
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex flex-col min-h-screen">
      
      {/* Offline Banner alert */}
      {!online && (
        <div className="bg-yatra-amber text-white text-center py-2.5 px-4 text-xs font-semibold flex items-center justify-center gap-2 sticky top-0 z-[9999] shadow-md">
          <AlertCircle className="w-4 h-4 animate-bounce" />
          <span>Offline Mode active. Accessing local cached itineraries, map markers, and emergency services.</span>
        </div>
      )}

      {/* Global Navigation Header */}
      <header className="bg-white/95 backdrop-blur-md border-b border-gray-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl">🕉️</span>
            <div className="flex flex-col">
              <span className="font-serif font-black text-lg tracking-tight text-yatra-terracotta leading-none">BIHAR YATRA</span>
              <span className="text-[9px] font-bold text-yatra-slate tracking-widest mt-0.5 uppercase">Beyond The Map</span>
            </div>
          </Link>

          {/* Desktop Navigation links */}
          {isAuthenticated && (
            <nav className="hidden lg:flex items-center gap-1.5 text-xs font-semibold text-gray-500">
              <NavLink to="/" className={({ isActive }) => `px-3.5 py-2 rounded-full transition-colors ${isActive ? 'bg-yatra-terracotta/5 text-yatra-terracotta' : 'hover:text-yatra-terracotta'}`}>
                Explore
              </NavLink>
              <NavLink to="/planner" className={({ isActive }) => `px-3.5 py-2 rounded-full transition-colors ${isActive ? 'bg-yatra-terracotta/5 text-yatra-terracotta' : 'hover:text-yatra-terracotta'}`}>
                Plan Trip
              </NavLink>
              <NavLink to="/hidden-gems" className={({ isActive }) => `px-3.5 py-2 rounded-full transition-colors ${isActive ? 'bg-yatra-terracotta/5 text-yatra-terracotta' : 'hover:text-yatra-terracotta'}`}>
                Hidden Bihar
              </NavLink>
              <NavLink to="/experiences" className={({ isActive }) => `px-3.5 py-2 rounded-full transition-colors ${isActive ? 'bg-yatra-terracotta/5 text-yatra-terracotta' : 'hover:text-yatra-terracotta'}`}>
                Experiences
              </NavLink>
              <NavLink to="/homestays" className={({ isActive }) => `px-3.5 py-2 rounded-full transition-colors ${isActive ? 'bg-yatra-terracotta/5 text-yatra-terracotta' : 'hover:text-yatra-terracotta'}`}>
                Stays
              </NavLink>
              <NavLink to="/passport" className={({ isActive }) => `px-3.5 py-2 rounded-full transition-colors ${isActive ? 'bg-yatra-terracotta/5 text-yatra-terracotta' : 'hover:text-yatra-terracotta'}`}>
                Passport
              </NavLink>
              <NavLink to="/intelligence" className={({ isActive }) => `px-3.5 py-2 rounded-full transition-colors ${isActive ? 'bg-yatra-terracotta/5 text-yatra-terracotta' : 'hover:text-yatra-terracotta'}`}>
                Tourism Intelligence
              </NavLink>
              <NavLink to="/admin" className={({ isActive }) => `px-3.5 py-2 rounded-full transition-colors ${isActive ? 'bg-red-500/5 text-red-500' : 'hover:text-red-500'}`}>
                Admin Console
              </NavLink>
            </nav>
          )}

          {/* Header Rightside actions */}
          <div className="hidden lg:flex items-center gap-3">
            <button 
              onClick={toggleLanguage}
              className="flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-yatra-terracotta border border-gray-200 rounded-full px-3 py-1.5 transition-colors bg-white shadow-sm cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5" /> {language}
            </button>

            {isAuthenticated ? (
              <>
                <Link 
                  to="/profile" 
                  className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full bg-yatra-cream border border-gray-200 text-yatra-slate hover:border-yatra-terracotta transition-colors"
                  title="View Profile"
                >
                  <div className="w-7 h-7 rounded-full bg-yatra-terracotta text-white flex items-center justify-center text-xs font-bold">
                    {user?.name ? user.name[0].toUpperCase() : 'U'}
                  </div>
                  <span className="text-xs font-bold text-yatra-charcoal max-w-24 truncate">
                    {user?.name?.split(' ')[0] || 'Profile'}
                  </span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-red-600 hover:border-red-200 transition-colors cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>

                <Link 
                  to="/planner" 
                  className="bg-yatra-terracotta hover:bg-yatra-amber text-white font-bold text-xs px-4 py-2.5 rounded-full transition-colors shadow-sm flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5 text-yatra-gold fill-yatra-gold" /> Plan My Trip
                </Link>
              </>
            ) : (
              <Link
                to="/login"
                className="bg-yatra-terracotta hover:bg-yatra-amber text-white font-bold text-xs px-4 py-2.5 rounded-full transition-colors shadow-sm flex items-center gap-1.5"
              >
                <LogIn className="w-3.5 h-3.5" /> Sign In
              </Link>
            )}
          </div>

          {/* Mobile menu hamburger toggle */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg border border-gray-100 hover:bg-gray-50 text-gray-600 transition-colors cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile expandable drawer panel */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-100 bg-white/95 px-6 py-6 space-y-4 absolute top-20 left-0 w-full shadow-lg z-50">
            {isAuthenticated ? (
              <div className="flex flex-col gap-2 font-semibold text-gray-600 text-sm">
                <div className="p-3 bg-yatra-cream/60 rounded-2xl border border-yatra-terracotta/20 flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-yatra-terracotta text-white flex items-center justify-center text-xs font-bold">
                      {user?.name ? user.name[0].toUpperCase() : 'U'}
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-yatra-charcoal">{user?.name}</span>
                      <span className="block text-[10px] text-gray-500">{user?.email}</span>
                    </div>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="text-xs text-red-600 font-bold px-2 py-1 bg-red-50 rounded-lg"
                  >
                    Logout
                  </button>
                </div>

                <Link to="/" onClick={() => setMobileMenuOpen(false)} className="py-2 hover:text-yatra-terracotta">Explore</Link>
                <Link to="/planner" onClick={() => setMobileMenuOpen(false)} className="py-2 hover:text-yatra-terracotta">Plan Trip</Link>
                <Link to="/hidden-gems" onClick={() => setMobileMenuOpen(false)} className="py-2 hover:text-yatra-terracotta">Hidden Bihar</Link>
                <Link to="/experiences" onClick={() => setMobileMenuOpen(false)} className="py-2 hover:text-yatra-terracotta">Experiences</Link>
                <Link to="/homestays" onClick={() => setMobileMenuOpen(false)} className="py-2 hover:text-yatra-terracotta">Stays</Link>
                <Link to="/passport" onClick={() => setMobileMenuOpen(false)} className="py-2 hover:text-yatra-terracotta">Passport</Link>
                <Link to="/intelligence" onClick={() => setMobileMenuOpen(false)} className="py-2 hover:text-yatra-terracotta">Tourism Intelligence</Link>
                <Link to="/profile" onClick={() => setMobileMenuOpen(false)} className="py-2 hover:text-yatra-terracotta">My Profile</Link>
                <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="py-2 text-red-500">Admin Console</Link>
              </div>
            ) : (
              <div className="flex flex-col gap-3 font-semibold text-gray-600 text-sm">
                <Link 
                  to="/login" 
                  onClick={() => setMobileMenuOpen(false)} 
                  className="bg-yatra-terracotta text-white font-bold py-3 rounded-2xl text-center text-xs shadow-md"
                >
                  Sign In / Create Account
                </Link>
              </div>
            )}

            <div className="flex gap-2 pt-4 border-t border-gray-100">
              <button 
                onClick={toggleLanguage}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 bg-white"
              >
                <Globe className="w-4 h-4" /> Language: {language}
              </button>
              {isAuthenticated && (
                <Link 
                  to="/planner" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 bg-yatra-terracotta text-white font-bold py-2.5 rounded-xl text-center text-xs shadow-md"
                >
                  ✨ Plan My Trip
                </Link>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main content body with Route Protection */}
      <main className="flex-grow">
        <Routes>
          {/* Public Authentication Route */}
          <Route path="/login" element={<Login />} />

          {/* Protected Application Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Home />} />
            <Route path="/planner" element={<Planner />} />
            <Route path="/generate-loading" element={<GenerationScreen />} />
            <Route path="/itinerary" element={<Itinerary />} />
            <Route path="/route-builder" element={<RouteBuilder />} />
            <Route path="/hidden-gems" element={<HiddenGems />} />
            <Route path="/experiences" element={<Experiences />} />
            <Route path="/homestays" element={<Homestays />} />
            <Route path="/passport" element={<Passport />} />
            <Route path="/intelligence" element={<Intelligence />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/admin" element={<Admin />} />
          </Route>

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Brand Footer */}
      <footer className="bg-yatra-charcoal text-white/90 border-t border-white/5 py-12 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">🕉️</span>
              <span className="font-serif font-black text-lg text-white tracking-wide">BIHAR YATRA</span>
            </div>
            <p className="text-xs text-gray-400 font-light leading-relaxed">
              Discover Bihar Beyond the Map. Experience the rich spiritual legacy, ancient universities, and warm communities.
            </p>
          </div>
          
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-yatra-gold">General Directory</h4>
            <div className="flex flex-col gap-2 text-xs text-gray-400 font-light">
              <Link to="/" className="hover:text-white transition-colors">Homepage & Explore</Link>
              <Link to="/hidden-gems" className="hover:text-white transition-colors">Hidden Spots catalog</Link>
              <Link to="/experiences" className="hover:text-white transition-colors">Experiences</Link>
              <Link to="/homestays" className="hover:text-white transition-colors">Rural Lodges</Link>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-yatra-gold">Safety & AI Routing</h4>
            <div className="flex flex-col gap-2 text-xs text-gray-400 font-light">
              <Link to="/route-builder" className="hover:text-white transition-colors">Route Builder</Link>
              <Link to="/intelligence" className="hover:text-white transition-colors">Intelligence board</Link>
              <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full border border-white/15 w-fit text-green-400 font-semibold mt-1">
                🛡️ SSL Certified Safe
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-yatra-gold">Contact Emergency Support</h4>
            <div className="text-xs text-gray-400 font-light space-y-1">
              <p>Bihar Tourist helpline: 1800-3456-112</p>
              <p>Police Patrol central: 112</p>
              <p>Support: support@biharyatra.gov.in</p>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto border-t border-white/5 mt-10 pt-6 text-center text-[10px] text-gray-500 font-light">
          © 2026 Bihar Yatra Tourism Development Corporation. All rights reserved. Developed under state safety standards.
        </div>
      </footer>

    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}
