import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, ShieldCheck, Download, Settings, Heart, 
  MapPin, Plus, Trash2, Phone, Save, Award, LogOut 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { getOfflinePacks, deleteOfflinePack } from '../services/offline.ts';

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [language, setLanguage] = useState('English');
  const [savedTrips, setSavedTrips] = useState<any[]>([]);
  const [offlinePacks, setOfflinePacks] = useState<any[]>([]);
  const [trustedContacts, setTrustedContacts] = useState<any[]>([
    { name: 'Amit Verma (Brother)', phone: '+91-9876543210' }
  ]);

  // Trusted Contact form state
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  useEffect(() => {
    // Load saved trips
    const trips = JSON.parse(localStorage.getItem('yatra_saved_trips') || '[]');
    setSavedTrips(trips);

    // Load offline packs
    setOfflinePacks(getOfflinePacks());
  }, []);

  const handleAddContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName || !contactPhone) return;
    const newContacts = [...trustedContacts, { name: contactName, phone: contactPhone }];
    setTrustedContacts(newContacts);
    setContactName('');
    setContactPhone('');
  };

  const handleDeleteContact = (index: number) => {
    setTrustedContacts(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleDeleteOffline = (id: string) => {
    deleteOfflinePack(id);
    setOfflinePacks(getOfflinePacks());
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-10">
      {/* Upper header */}
      <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-premium flex flex-col md:flex-row items-center gap-6 justify-between">
        <div className="flex items-center gap-4 flex-col sm:flex-row text-center sm:text-left">
          <div className="w-20 h-20 rounded-full bg-yatra-terracotta/10 text-yatra-terracotta flex items-center justify-center border-4 border-white shadow-md">
            <User className="w-10 h-10 text-yatra-terracotta" />
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-serif font-bold text-yatra-charcoal">{user?.name || 'Traveler'}</h2>
            <p className="text-xs text-gray-500 font-light">{user?.email || 'traveler@biharyatra.in'}</p>
            <div className="flex items-center gap-2 pt-1">
              <span className="bg-green-600/10 text-green-700 border border-green-200 text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-widest inline-flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> ID Verified Member
              </span>
              <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-semibold">
                📍 {user?.preferredDistrict || 'Patna'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-gray-400 font-semibold mb-1">Language</label>
              <select
                value={language}
                onChange={e => setLanguage(e.target.value)}
                className="bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
              >
                <option value="English">English</option>
                <option value="Hindi">हिन्दी (Hindi)</option>
                <option value="Bhojpuri">भोजपुरी (Bhojpuri)</option>
                <option value="Maithili">मैथिली (Maithili)</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-400 font-semibold mb-1">Passport Rank</label>
              <span className="block font-bold text-yatra-terracotta text-sm">
                {user?.passportLevel || 'Level 1 - Explorer'}
              </span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-600 text-xs font-bold border border-gray-200 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Grid panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column: saved trips & downloads */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Saved Trips */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
            <h3 className="text-base font-serif font-bold text-yatra-charcoal flex items-center gap-1.5 border-b border-gray-100 pb-3">
              <Save className="w-5 h-5 text-yatra-terracotta" /> Saved Itineraries ({savedTrips.length})
            </h3>
            
            <div className="space-y-3">
              {savedTrips.map((trip, idx) => (
                <div key={idx} className="flex justify-between items-center p-3.5 rounded-2xl bg-gray-50 border border-gray-100 text-xs">
                  <div>
                    <strong className="block text-gray-700 text-sm font-serif">{trip.startingLocation} → {trip.destination || "Bihar Tour"}</strong>
                    <span className="text-[10px] text-gray-400 font-light">{trip.savedAt || "Recent Trip"} • {trip.duration || 2} Days</span>
                  </div>
                  <span className="font-bold text-yatra-terracotta text-sm font-serif">₹{trip.totalCost || 0}</span>
                </div>
              ))}
              {savedTrips.length === 0 && (
                <p className="text-xs text-gray-400 italic py-2">No saved trips yet. Plan a trip to save your custom schedule.</p>
              )}
            </div>
          </div>

          {/* Offline Packs */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
            <h3 className="text-base font-serif font-bold text-yatra-charcoal flex items-center gap-1.5 border-b border-gray-100 pb-3">
              <Download className="w-5 h-5 text-yatra-terracotta" /> Downloaded Offline Packs ({offlinePacks.length})
            </h3>

            <div className="space-y-3">
              {offlinePacks.map((pack) => (
                <div key={pack.id} className="flex justify-between items-center p-3.5 rounded-2xl bg-gray-50 border border-gray-100 text-xs">
                  <div>
                    <strong className="block text-gray-700 font-medium">{pack.destination} Regional Pack</strong>
                    <span className="text-[10px] text-gray-400 font-light">Downloaded: {pack.downloadedAt}</span>
                  </div>
                  <button 
                    onClick={() => handleDeleteOffline(pack.id)}
                    className="text-red-500 hover:text-red-700 p-1"
                    title="Delete Pack"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {offlinePacks.length === 0 && (
                <p className="text-xs text-gray-400 italic py-2">No offline packs downloaded. You can download an offline emergency pack from your itinerary page.</p>
              )}
            </div>
          </div>

        </div>

        {/* Right column: trusted contacts */}
        <div className="space-y-8">
          
          {/* Trusted Contacts */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
            <h3 className="text-base font-serif font-bold text-yatra-charcoal flex items-center gap-1.5 border-b border-gray-100 pb-3">
              <Phone className="w-5 h-5 text-yatra-terracotta" /> Trusted Safety Contacts
            </h3>

            <div className="space-y-3">
              {trustedContacts.map((contact, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 rounded-2xl bg-gray-50 border border-gray-100 text-xs">
                  <div>
                    <strong className="block text-gray-700 font-medium">{contact.name}</strong>
                    <span className="text-[10px] text-gray-400 font-light">{contact.phone}</span>
                  </div>
                  <button 
                    onClick={() => handleDeleteContact(idx)}
                    className="text-red-500 hover:text-red-700"
                  >
                    ✕
                  </button>
                </div>
              ))}

              <form onSubmit={handleAddContact} className="space-y-2 border-t border-gray-100 pt-3">
                <input 
                  type="text" 
                  required
                  placeholder="Contact Name (e.g. Mom)"
                  value={contactName}
                  onChange={e => setContactName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-yatra-terracotta"
                />
                <input 
                  type="text" 
                  required
                  placeholder="Phone Number"
                  value={contactPhone}
                  onChange={e => setContactPhone(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-yatra-terracotta"
                />
                <button
                  type="submit"
                  className="w-full bg-yatra-terracotta hover:bg-yatra-amber text-white text-xs font-bold py-2 rounded-lg transition-colors cursor-pointer"
                >
                  Add Trusted Contact
                </button>
              </form>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
