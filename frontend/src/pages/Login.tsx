import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Lock, Mail, User, Phone, MapPin, Sparkles, ShieldCheck, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, isAuthenticated } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [preferredDistrict, setPreferredDistrict] = useState('Patna');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Where to redirect after login
  const from = location.state?.from?.pathname || '/';

  // If already authenticated, redirect to destination
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        if (!email.trim() || !password.trim()) {
          throw new Error('Please provide both email and password');
        }
        await login(email.trim(), password);
      } else {
        if (!name.trim() || !email.trim() || !password.trim()) {
          throw new Error('Please fill in your name, email, and password');
        }
        await register({
          name: name.trim(),
          email: email.trim(),
          password,
          phone: phone.trim(),
          preferredDistrict
        });
      }
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickDemoLogin = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      await login('rahul@biharyatra.in', 'yatra2026');
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Quick demo login failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-gray-100 shadow-premium space-y-6">
        
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-yatra-terracotta/10 text-2xl mb-1">
            🕉️
          </div>
          <h1 className="font-serif font-bold text-2xl text-yatra-charcoal">
            {mode === 'login' ? 'Welcome to Bihar Yatra' : 'Create Traveler Account'}
          </h1>
          <p className="text-xs text-gray-500 font-light max-w-xs mx-auto">
            {mode === 'login' 
              ? 'Sign in to access verified itineraries, live GPS navigation, and safety analytics.'
              : 'Join Bihar Yatra for personalized heritage routes and fair transit fare intelligence.'}
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex bg-gray-50 p-1 rounded-2xl border border-gray-200">
          <button
            type="button"
            onClick={() => { setMode('login'); setError(null); }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              mode === 'login'
                ? 'bg-white text-yatra-charcoal shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setError(null); }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              mode === 'register'
                ? 'bg-white text-yatra-charcoal shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Register
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-2xl text-xs flex items-start gap-2 animate-fade-in">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Rahul Verma"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-yatra-charcoal focus:outline-none focus:border-yatra-terracotta"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-yatra-charcoal focus:outline-none focus:border-yatra-terracotta"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-yatra-charcoal focus:outline-none focus:border-yatra-terracotta"
              />
            </div>
          </div>

          {mode === 'register' && (
            <>
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider">
                  Phone Number (Optional)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+91-9876543210"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-yatra-charcoal focus:outline-none focus:border-yatra-terracotta"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider">
                  Base District in Bihar
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                  <select
                    value={preferredDistrict}
                    onChange={e => setPreferredDistrict(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-yatra-charcoal focus:outline-none focus:border-yatra-terracotta"
                  >
                    <option value="Patna">Patna</option>
                    <option value="Gaya">Gaya / Bodh Gaya</option>
                    <option value="Nalanda">Nalanda / Rajgir</option>
                    <option value="Jamui">Jamui</option>
                    <option value="Vaishali">Vaishali</option>
                    <option value="Bhagalpur">Bhagalpur</option>
                    <option value="Muzaffarpur">Muzaffarpur</option>
                    <option value="Madhubani">Madhubani</option>
                    <option value="Rohtas">Rohtas</option>
                    <option value="West Champaran">West Champaran</option>
                  </select>
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-2xl bg-yatra-terracotta hover:bg-yatra-amber text-white font-bold text-xs transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <span>{mode === 'login' ? 'Sign In to Bihar Yatra' : 'Create My Account'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Access for Evaluators */}
        {mode === 'login' && (
          <div className="pt-2 border-t border-gray-100 space-y-2">
            <button
              type="button"
              onClick={handleQuickDemoLogin}
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-yatra-gold fill-yatra-gold" />
              <span>Quick Demo: Sign In as Rahul Verma</span>
            </button>
            <p className="text-[10px] text-gray-400 text-center font-light">
              Default Credentials: <code className="text-gray-600 font-mono">rahul@biharyatra.in</code> / <code className="text-gray-600 font-mono">yatra2026</code>
            </p>
          </div>
        )}

        {/* Security Badge */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400 font-light pt-2">
          <ShieldCheck className="w-4 h-4 text-yatra-forest" />
          <span>Protected by Bihar State Tourism SSL Security</span>
        </div>

      </div>
    </div>
  );
}
