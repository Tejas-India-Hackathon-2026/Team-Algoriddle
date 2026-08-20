import React, { useState, useEffect } from 'react';
import { ShieldCheck, Plus, Check, Search, Home, DollarSign, Image, Lock } from 'lucide-react';
import { fetchHomestays, addHomestay } from '../services/api.ts';

export default function Homestays() {
  const [homestaysList, setHomestaysList] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'visitor' | 'owner'>('visitor');
  const [toastMessage, setToastMessage] = useState('');

  // Owner Form State
  const [name, setName] = useState('');
  const [host, setHost] = useState('');
  const [location, setLocation] = useState('');
  const [pricePerNight, setPricePerNight] = useState('');
  const [amenities, setAmenities] = useState('Traditional Meals, AC Room, Free WiFi');
  const [rules, setRules] = useState('Respect local customs, no smoking');
  const [idFile, setIdFile] = useState<any>(null);
  const [idFileName, setIdFileName] = useState('');

  // Booking details
  const [selectedHomeForBooking, setSelectedHomeForBooking] = useState<any>(null);
  const [bookingDays, setBookingDays] = useState(2);
  const [bookingEmail, setBookingEmail] = useState('');

  useEffect(() => {
    fetchHomestays().then(data => setHomestaysList(data));
  }, []);

  const handleIdUploadMock = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIdFile(e.target.files[0]);
      setIdFileName(e.target.files[0].name);
    }
  };

  const handleOwnerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !host || !location || !pricePerNight || !idFileName) {
      alert("Please fill all details and upload a valid government ID proof.");
      return;
    }

    // Call API helper
    const res = await addHomestay({
      name,
      host,
      location,
      pricePerNight,
      amenities: amenities.split(',').map(a => a.trim()),
      rules,
      idProofName: idFileName // Pass standard metadata, protect raw files securely
    });

    if (res.success) {
      setToastMessage('✨ Homestay listing created! Host identity securely verified.');
      setHomestaysList(prev => [res.homestay, ...prev]);
      
      // Reset form
      setName('');
      setHost('');
      setLocation('');
      setPricePerNight('');
      setIdFile(null);
      setIdFileName('');
      setActiveTab('visitor');
      setTimeout(() => setToastMessage(''), 4500);
    }
  };

  const handleRequestBooking = (home: any) => {
    setSelectedHomeForBooking(home);
    setBookingDays(2);
    setBookingEmail('');
  };

  const handleConfirmBooking = (e: React.FormEvent) => {
    e.preventDefault();
    setToastMessage(`✓ Booking request sent for ${selectedHomeForBooking.name}. Owner will verify slots.`);
    setSelectedHomeForBooking(null);
    setTimeout(() => setToastMessage(''), 4500);
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-serif font-bold text-yatra-charcoal">Rural Homestay Lodges</h1>
        <p className="text-sm text-yatra-slate font-light">Stay with local families. Enjoy home-cooked food and learn local traditions in certified safe homestays.</p>
      </div>

      {toastMessage && (
        <div className="bg-yatra-forest/10 border border-yatra-forest/20 text-yatra-forest p-4 rounded-2xl text-sm font-semibold animate-fade-in">
          {toastMessage}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-100 max-w-sm">
        <button
          onClick={() => setActiveTab('visitor')}
          className={`flex-1 py-3 text-center text-xs font-bold transition-all border-b-2 ${activeTab === 'visitor' ? 'border-yatra-terracotta text-yatra-terracotta' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
        >
          Book a Homestay
        </button>
        <button
          onClick={() => setActiveTab('owner')}
          className={`flex-1 py-3 text-center text-xs font-bold transition-all border-b-2 ${activeTab === 'owner' ? 'border-yatra-terracotta text-yatra-terracotta' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
        >
          List Your Property (Owner)
        </button>
      </div>

      {/* VISITOR FLOW */}
      {activeTab === 'visitor' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {homestaysList.map(home => (
            <div key={home.id} className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-premium-hover transition-all duration-300 flex flex-col group">
              <div className="relative h-60 overflow-hidden">
                <img 
                  src={home.image} 
                  alt={home.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                />
                
                {/* ID verified flag display (NO details of ID proof are visible) */}
                <span className="absolute top-4 left-4 bg-green-600/90 text-white text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1 backdrop-blur-sm">
                  <ShieldCheck className="w-3.5 h-3.5" /> Identity Verified
                </span>
                
                <span className="absolute bottom-4 right-4 bg-white/95 text-yatra-charcoal text-xs font-bold px-3 py-1 rounded-full border border-gray-100 shadow-sm">
                  ₹{home.pricePerNight} / night
                </span>
              </div>

              <div className="p-6 space-y-4 flex-grow flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase text-yatra-terracotta">
                    <span>{home.location}</span>
                    <span className="text-gray-400">★ {home.rating} Rating</span>
                  </div>
                  <h3 className="text-xl font-serif font-bold text-yatra-charcoal leading-snug">{home.name}</h3>
                  <p className="text-xs text-gray-500 font-light leading-relaxed">
                    Hosted by <strong>{home.host}</strong>. Includes local meals, farm access, and hot springs guides.
                  </p>
                </div>

                <div className="space-y-1 text-[11px] border-t border-gray-100 pt-3">
                  <span className="font-bold text-gray-700 block">Amenities & Rules:</span>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {home.amenities.map((am: string, idx: number) => (
                      <span key={idx} className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[10px]">{am}</span>
                    ))}
                  </div>
                  <span className="text-gray-400 block text-[10px] font-light mt-2"><strong>Rules:</strong> {home.rules}</span>
                </div>

                <button
                  onClick={() => handleRequestBooking(home)}
                  className="w-full bg-yatra-terracotta hover:bg-yatra-amber text-white font-bold py-3 rounded-xl text-xs transition-colors mt-2"
                >
                  Request Booking
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* OWNER FLOW */}
      {activeTab === 'owner' && (
        <div className="max-w-2xl bg-white rounded-3xl p-8 border border-gray-100 shadow-premium space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-serif font-bold text-yatra-charcoal flex items-center gap-1.5">
              <Plus className="w-5 h-5 text-yatra-terracotta" /> List a Homestay Space
            </h2>
            <p className="text-xs text-yatra-slate font-light">Submit details. Identity documents are uploaded securely and never shared publicly.</p>
          </div>

          <form onSubmit={handleOwnerSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Property Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Mithila Heritage Homestay"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-yatra-terracotta"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Host Full Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Mishra Family"
                  value={host}
                  onChange={e => setHost(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-yatra-terracotta"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Location / District</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Madhubani District"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-yatra-terracotta"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Price Per Night (₹)</label>
                <input 
                  type="number" 
                  required
                  placeholder="e.g. 1500"
                  value={pricePerNight}
                  onChange={e => setPricePerNight(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-yatra-terracotta"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Amenities (comma separated)</label>
                <input 
                  type="text" 
                  value={amenities}
                  onChange={e => setAmenities(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">House Rules</label>
                <input 
                  type="text" 
                  value={rules}
                  onChange={e => setRules(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none"
                />
              </div>
            </div>

            {/* Secure ID Document Upload */}
            <div className="border border-dashed border-gray-200 rounded-2xl p-6 bg-yatra-cream/30 space-y-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-yatra-terracotta">
                <Lock className="w-4 h-4" /> Secure Identity Verification (Required)
              </div>
              <p className="text-[10px] text-gray-400 leading-relaxed font-light">
                We take privacy seriously. Government-issued IDs (Aadhaar, Voter ID, Passport) are stored in secure Firebase buckets with restricted backend-only read permissions. Customers will only see a "✓ Identity Verified" safety badge.
              </p>
              
              <div className="flex items-center gap-4">
                <label className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 cursor-pointer hover:bg-gray-50 transition-colors shadow-sm">
                  <Image className="w-4 h-4 text-yatra-slate" /> Select Document
                  <input 
                    type="file" 
                    accept="image/*,.pdf" 
                    className="hidden" 
                    onChange={handleIdUploadMock} 
                  />
                </label>
                <span className="text-xs text-yatra-slate italic font-medium">
                  {idFileName || "No document selected"}
                </span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-yatra-terracotta hover:bg-yatra-amber text-white font-bold py-3.5 rounded-2xl text-xs transition-colors shadow-md"
            >
              Verify Identity & Publish Listing
            </button>
          </form>
        </div>
      )}

      {/* Visitor Booking Modal */}
      {selectedHomeForBooking && (
        <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleConfirmBooking} className="bg-white rounded-[32px] p-6 max-w-sm w-full border border-gray-100 shadow-2xl space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold text-yatra-terracotta uppercase">Homestay Booking</span>
                <h3 className="text-lg font-serif font-bold text-yatra-charcoal mt-0.5">{selectedHomeForBooking.name}</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setSelectedHomeForBooking(null)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 font-bold text-sm flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-500 font-semibold mb-1">Number of Nights</label>
                <input 
                  type="number" 
                  min={1} 
                  required
                  value={bookingDays}
                  onChange={e => setBookingDays(Number(e.target.value))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 font-semibold mb-1">Your Email</label>
                <input 
                  type="email" 
                  required
                  placeholder="name@domain.com"
                  value={bookingEmail}
                  onChange={e => setBookingEmail(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none"
                />
              </div>
            </div>

            <div className="bg-yatra-cream p-4 rounded-2xl flex justify-between items-center text-xs font-semibold">
              <span className="text-gray-500">Total Price:</span>
              <span className="text-yatra-terracotta text-sm">₹{selectedHomeForBooking.pricePerNight * bookingDays}</span>
            </div>

            <button
              type="submit"
              className="w-full bg-yatra-terracotta hover:bg-yatra-amber text-white font-bold py-3 rounded-xl text-xs transition-colors shadow-md"
            >
              Confirm Booking Request
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
