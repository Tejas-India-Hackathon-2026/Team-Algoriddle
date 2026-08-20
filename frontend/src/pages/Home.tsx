import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Compass, Sparkles, AlertCircle, Award, Shield, MapPin } from 'lucide-react';
import { fetchHiddenGems, fetchExperiences } from '../services/api.ts';

export default function Home() {
  const navigate = useNavigate();
  const [start, setStart] = useState('');
  const [duration, setDuration] = useState('3');
  const [budget, setBudget] = useState('Standard');
  const [interest, setInterest] = useState('History');
  const [hiddenGemsList, setHiddenGemsList] = useState<any[]>([]);
  const [experiencesList, setExperiencesList] = useState<any[]>([]);

  useEffect(() => {
    fetchHiddenGems().then(data => setHiddenGemsList(data || []));
    fetchExperiences().then(data => setExperiencesList(data || []));
  }, []);

  const handleQuickPlan = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/planner', { 
      state: { 
        quickStart: start, 
        quickDuration: duration, 
        quickBudget: budget, 
        quickInterest: interest 
      } 
    });
  };

  const categories = [
    { name: 'History', icon: '🏛️' },
    { name: 'Spirituality', icon: '🕉️' },
    { name: 'Nature', icon: '🌿' },
    { name: 'Food', icon: '🍲' },
    { name: 'Culture', icon: '🎨' },
    { name: 'Adventure', icon: '🧗' },
    { name: 'Photography', icon: '📷' },
    { name: 'Shopping', icon: '🛍️' }
  ];

  return (
    <div className="space-y-16 pb-20">
      {/* Hero Section */}
      <section className="relative h-[650px] flex items-center justify-center text-white overflow-hidden rounded-b-[40px] shadow-premium">
        <div className="absolute inset-0 z-0">
          <img 
            src="/hero_bihar.jpg" 
            alt="Mahabodhi Temple Bodh Gaya Bihar Heritage" 
            className="w-full h-full object-cover filter brightness-[0.45] scale-105"
          />
        </div>
        
        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center space-y-6">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white/10 backdrop-blur-md text-yatra-terracottaLight border border-white/20 uppercase tracking-widest">
            🇮🇳 Welcome to Bihar Yatra
          </span>
          <h1 className="text-5xl md:text-7xl font-serif font-bold tracking-tight text-white leading-tight">
            Discover Bihar <br/><span className="text-yatra-gold">Beyond the Map.</span>
          </h1>
          <p className="text-lg md:text-xl max-w-2xl mx-auto text-gray-200 font-light">
            Plan smarter journeys, discover hidden places, and experience Bihar through the people who call it home.
          </p>
          <div className="flex flex-wrap gap-4 justify-center pt-4">
            <Link 
              to="/planner" 
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-yatra-terracotta text-white font-medium hover:bg-yatra-amber transition-all duration-300 shadow-lg transform hover:-translate-y-0.5"
            >
              <Sparkles className="w-5 h-5 text-yatra-gold fill-yatra-gold" /> Plan My AI Journey
            </Link>
            <Link 
              to="/hidden-gems" 
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-white/10 backdrop-blur-md text-white border border-white/30 font-medium hover:bg-white/20 transition-all duration-300"
            >
              Explore Hidden Bihar
            </Link>
          </div>
        </div>
      </section>

      {/* Quick Planner Widget */}
      <section className="max-w-6xl mx-auto px-6 -mt-32 relative z-20">
        <div className="bg-white rounded-3xl p-8 shadow-premium border border-gray-100">
          <h2 className="text-2xl font-serif font-bold mb-6 text-yatra-terracotta flex items-center gap-2">
            <Compass className="w-6 h-6" /> Where do you want to go?
          </h2>
          <form onSubmit={handleQuickPlan} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Starting From</label>
              <input 
                type="text" 
                value={start}
                onChange={(e) => setStart(e.target.value)}
                placeholder="e.g. Patna"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-yatra-terracotta focus:ring-1 focus:ring-yatra-terracotta"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Duration</label>
              <select 
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-yatra-terracotta"
              >
                <option value="1">1 Day</option>
                <option value="2">2 Days</option>
                <option value="3">3 Days (Recommended)</option>
                <option value="5">5 Days</option>
                <option value="7">7 Days</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Budget per Day</label>
              <select 
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-yatra-terracotta"
              >
                <option value="Budget">Budget (₹1k - ₹3k)</option>
                <option value="Standard">Standard (₹3k - ₹6k)</option>
                <option value="Premium">Premium (₹6k+)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Primary Interest</label>
              <select 
                value={interest}
                onChange={(e) => setInterest(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-yatra-terracotta"
              >
                <option value="History">History</option>
                <option value="Spirituality">Spirituality</option>
                <option value="Nature">Nature</option>
                <option value="Food">Food & Craft</option>
              </select>
            </div>
            <button 
              type="submit"
              className="w-full bg-yatra-terracotta hover:bg-yatra-amber text-white font-medium py-3.5 px-4 rounded-xl transition-colors duration-300 text-sm shadow-md"
            >
              Plan My Journey
            </button>
          </form>
        </div>
      </section>

      {/* Explore by Interest */}
      <section className="max-w-6xl mx-auto px-6 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-serif font-bold">Explore Bihar by Interest</h2>
          <p className="text-yatra-slate font-light">Customise your exploration based on what captures your curiosity</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-4">
          {categories.map((cat, i) => (
            <div 
              key={i} 
              onClick={() => navigate('/hidden-gems', { state: { filter: cat.name } })}
              className="bg-white rounded-2xl p-4 text-center border border-gray-100 hover:shadow-premium-hover transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
            >
              <span className="text-3xl block mb-2">{cat.icon}</span>
              <span className="text-xs font-medium text-gray-700">{cat.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Hidden Bihar */}
      <section className="max-w-6xl mx-auto px-6 space-y-6">
        <div className="flex justify-between items-end">
          <div className="space-y-1">
            <h2 className="text-3xl font-serif font-bold text-yatra-charcoal">Hidden Bihar</h2>
            <p className="text-yatra-slate font-light">Lesser-known relics, reserve forests, and architectures</p>
          </div>
          <Link to="/hidden-gems" className="text-sm font-semibold text-yatra-terracotta hover:text-yatra-amber transition-colors flex items-center gap-1">
            View All Gems <span className="text-lg">→</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {hiddenGemsList.slice(0, 3).map((gem: any) => (
            <div key={gem.id} className="bg-white rounded-3xl overflow-hidden border border-gray-100 hover:shadow-premium-hover transition-all duration-300 flex flex-col h-full group">
              <div className="relative h-56 overflow-hidden">
                <img 
                  src={gem.image} 
                  alt={gem.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute top-4 left-4 bg-yatra-terracotta/90 text-white text-xs font-semibold px-3 py-1 rounded-full backdrop-blur-sm">
                  ★ Gem Score: {gem.hiddenGemScore}/100
                </span>
              </div>
              <div className="p-6 space-y-4 flex flex-col flex-grow justify-between">
                <div>
                  <div className="flex items-center gap-1 text-xs text-yatra-slate font-medium uppercase tracking-wider mb-2">
                    <MapPin className="w-3.5 h-3.5 text-yatra-terracotta" /> {gem.location}
                  </div>
                  <h3 className="text-xl font-serif font-bold text-yatra-charcoal mb-2">{gem.name}</h3>
                  <p className="text-sm text-gray-500 line-clamp-3 font-light leading-relaxed">{gem.description}</p>
                </div>
                <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-xs font-medium text-gray-700">
                  <span>Best: {gem.bestTime}</span>
                  <Link 
                    to={`/hidden-gems`} 
                    className="inline-flex items-center gap-1 text-yatra-terracotta hover:underline font-semibold"
                  >
                    Explore <Compass className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Tourism Intelligence Teaser */}
      <section className="max-w-6xl mx-auto px-6">
        <div className="bg-gradient-to-br from-yatra-charcoal to-yatra-terracotta text-white rounded-[32px] p-8 md:p-12 shadow-premium flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-6 max-w-xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-yatra-gold border border-white/20 uppercase tracking-widest">
              📊 Tourism Intelligence Dashboard
            </span>
            <h2 className="text-3xl md:text-4xl font-serif font-bold leading-tight">
              Real-time crowd indices and smart itinerary matching
            </h2>
            <p className="text-gray-300 font-light leading-relaxed">
              We cross-examine weather forecasts, tourist flow numbers, and regional road updates to advise whether to travel, where to skip, and how to optimize.
            </p>
            
            {/* Sample Nalanda Block */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-serif font-bold text-lg text-yatra-gold">Ruins of Nalanda</span>
                <span className="bg-green-500/20 text-green-300 text-xs px-2 py-0.5 rounded-full border border-green-500/30">Low Crowd</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="block text-gray-400">Score</span>
                  <span className="font-semibold text-white">92/100</span>
                </div>
                <div>
                  <span className="block text-gray-400">Best Visit</span>
                  <span className="font-semibold text-white">8 AM - 11 AM</span>
                </div>
                <div>
                  <span className="block text-gray-400">Cost</span>
                  <span className="font-semibold text-white">₹₹</span>
                </div>
              </div>
              <div className="flex items-start gap-1.5 text-xs bg-yatra-terracotta/20 border border-yatra-terracotta/40 p-2.5 rounded-xl text-yatra-terracottaLight">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span><strong>AI Insight:</strong> Nalanda is currently a better match for you than Rajgir.</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-4 text-center md:text-right flex-shrink-0">
            <div className="bg-white text-yatra-charcoal rounded-3xl p-6 shadow-lg inline-block text-left w-64">
              <div className="text-4xl font-serif font-bold text-yatra-terracotta">91%</div>
              <div className="text-xs font-semibold uppercase text-gray-400 tracking-wider mt-1">Average Safety Score</div>
              <p className="text-xs text-gray-500 mt-2 font-light">Calculated via active police post frequencies and road conditions.</p>
            </div>
            <div className="block pt-2">
              <Link 
                to="/intelligence" 
                className="inline-flex items-center gap-2 bg-yatra-gold hover:bg-yellow-500 text-yatra-charcoal font-semibold px-6 py-3 rounded-full transition-all duration-300"
              >
                Access Dashboard
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Local Experiences */}
      <section className="max-w-6xl mx-auto px-6 space-y-6">
        <div className="flex justify-between items-end">
          <div className="space-y-1">
            <h2 className="text-3xl font-serif font-bold text-yatra-charcoal">Local Experiences</h2>
            <p className="text-yatra-slate font-light">Connect with local communities, learn traditional crafts, and taste the real Bihar</p>
          </div>
          <Link to="/experiences" className="text-sm font-semibold text-yatra-terracotta hover:text-yatra-amber transition-colors flex items-center gap-1">
            Browse Market <span className="text-lg">→</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {experiencesList.slice(0, 2).map((exp: any) => (
            <div key={exp.id} className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-premium-hover transition-all duration-300 flex flex-col sm:flex-row">
              <div className="sm:w-1/3 h-48 sm:h-auto relative">
                <img src={exp.image} alt={exp.title} className="w-full h-full object-cover" />
                {exp.verified && (
                  <span className="absolute top-3 left-3 bg-green-600 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                    <Shield className="w-2.5 h-2.5" /> Verified Host
                  </span>
                )}
              </div>
              <div className="p-6 sm:w-2/3 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <span className="text-[10px] font-semibold uppercase text-yatra-terracotta tracking-widest">{exp.location}</span>
                  <h3 className="text-lg font-bold font-serif text-yatra-charcoal leading-tight">{exp.title}</h3>
                  <p className="text-xs text-gray-500 font-light line-clamp-2">{exp.description}</p>
                </div>
                <div className="flex items-center justify-between text-xs border-t border-gray-100 pt-3">
                  <div>
                    <span className="text-[10px] uppercase text-gray-400 block">Hosted by</span>
                    <span className="font-medium text-gray-700">{exp.host}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase text-gray-400 block">Price</span>
                    <span className="font-bold text-yatra-terracotta text-sm">₹{exp.price}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Explorer Passport Gamification Teaser */}
      <section className="max-w-6xl mx-auto px-6">
        <div className="bg-white border border-gray-100 rounded-[32px] p-8 md:p-12 shadow-premium flex flex-col md:flex-row items-center gap-8 justify-between">
          <div className="flex items-center gap-4 flex-col sm:flex-row text-center sm:text-left">
            <div className="bg-yatra-terracotta/10 p-5 rounded-full text-yatra-terracotta">
              <Award className="w-12 h-12" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-2xl font-serif font-bold text-yatra-charcoal">Unlock Your Bihar Explorer Passport</h2>
              <p className="text-gray-500 text-sm font-light max-w-md leading-relaxed">
                Collect virtual stamps, earn experience badges like <span className="italic font-semibold">"History Hunter"</span> and climb up levels as you explore Bihar's ruins and villages.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2 items-center text-center">
            <span className="text-xs text-gray-400 uppercase font-semibold tracking-wider">Level 1 - Explorer</span>
            <div className="w-48 bg-gray-100 h-2.5 rounded-full overflow-hidden border border-gray-200">
              <div className="bg-yatra-gold h-full rounded-full" style={{ width: '45%' }}></div>
            </div>
            <span className="text-xs font-semibold text-yatra-terracotta">450 / 1000 XP to Level 2</span>
            <Link to="/passport" className="mt-2 text-xs font-bold text-yatra-terracotta bg-yatra-terracotta/5 border border-yatra-terracotta/10 px-4 py-2 rounded-full hover:bg-yatra-terracotta/10 transition-colors">
              Manage Passport
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-3xl mx-auto px-6 text-center space-y-6 pt-10">
        <h2 className="text-4xl font-serif font-bold text-yatra-charcoal">Your Bihar Journey Starts Here.</h2>
        <p className="text-gray-500 font-light max-w-xl mx-auto leading-relaxed">
          Embark on an unforgettable route optimized for comfort, security, and true cultural immersion. Craft your trip profiles today.
        </p>
        <Link 
          to="/planner" 
          className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-yatra-terracotta text-white font-medium hover:bg-yatra-amber transition-colors shadow-lg"
        >
          Create My Bihar Journey
        </Link>
      </section>
    </div>
  );
}
