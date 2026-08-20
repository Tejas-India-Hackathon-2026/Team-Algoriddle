import React, { useState, useEffect } from 'react';
import { ShieldAlert, Award, Star, Clock, MapPin, Users, Heart } from 'lucide-react';
import { fetchExperiences, bookExperience } from '../services/api.ts';

export default function Experiences() {
  const [experiencesList, setExperiencesList] = useState<any[]>([]);
  const [selectedExp, setSelectedExp] = useState<any>(null);
  
  // Booking Form State
  const [date, setDate] = useState('');
  const [slots, setSlots] = useState(1);
  const [email, setEmail] = useState('');
  
  // Feedback toasts
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    fetchExperiences().then(data => setExperiencesList(data));
  }, []);

  const handleOpenBooking = (exp: any) => {
    setSelectedExp(exp);
    setDate(new Date().toISOString().split('T')[0]);
    setSlots(1);
    setEmail('');
  };
  

  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExp) return;

    const res = await bookExperience({
      experienceId: selectedExp.id,
      userEmail: email,
      date,
      slots
    });

    if (res.success) {
      setToastMessage(`✨ Booked! Confirmation ID: ${res.bookingId}`);
      setSelectedExp(null);
      setTimeout(() => setToastMessage(''), 4500);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-serif font-bold text-yatra-charcoal">Local Experiences Marketplace</h1>
        <p className="text-sm text-yatra-slate font-light">Directly support local rural artisans, master chefs, and musicians in authentic craft workshops.</p>
      </div>

      {toastMessage && (
        <div className="bg-yatra-forest/10 border border-yatra-forest/20 text-yatra-forest p-4 rounded-2xl text-sm font-semibold animate-fade-in">
          {toastMessage}
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {experiencesList.map(exp => (
          <div key={exp.id} className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-premium-hover transition-all duration-300 flex flex-col sm:flex-row group">
            <div className="sm:w-2/5 h-52 sm:h-auto relative overflow-hidden">
              <img 
                src={exp.image} 
                alt={exp.title} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
              />
              {exp.verified && (
                <span className="absolute top-4 left-4 bg-green-600/90 text-white text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5 uppercase tracking-wider backdrop-blur-sm">
                  ✓ Verified Host
                </span>
              )}
            </div>
            
            <div className="p-6 sm:w-3/5 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <span className="text-[9px] font-bold uppercase text-yatra-terracotta tracking-widest block">{exp.location}</span>
                <h3 className="text-lg font-bold font-serif text-yatra-charcoal leading-snug">{exp.title}</h3>
                <p className="text-xs text-gray-500 font-light line-clamp-2 leading-relaxed">{exp.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-400 font-medium">
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-yatra-slate" /> {exp.duration}
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-yatra-gold fill-yatra-gold" /> {exp.rating} Rating
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                <div>
                  <span className="text-[9px] uppercase text-gray-400 block font-light">Host</span>
                  <span className="text-xs font-semibold text-gray-700 block line-clamp-1">{exp.host}</span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] uppercase text-gray-400 block font-light">Price</span>
                  <span className="font-bold text-yatra-terracotta text-sm">₹{exp.price}</span>
                </div>
              </div>

              <button
                onClick={() => handleOpenBooking(exp)}
                className="w-full bg-yatra-terracotta hover:bg-yatra-amber text-white font-bold py-2.5 rounded-xl text-xs transition-colors shadow-sm"
              >
                Book Experience
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Booking Modal */}
      {selectedExp && (
        <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleConfirmBooking} className="bg-white rounded-[32px] p-6 max-w-sm w-full border border-gray-100 shadow-2xl space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold text-yatra-terracotta uppercase">Experience Booking</span>
                <h3 className="text-lg font-serif font-bold text-yatra-charcoal mt-0.5">{selectedExp.title}</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setSelectedExp(null)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 font-bold text-sm flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-500 font-semibold mb-1">Select Date</label>
                <input 
                  type="date"
                  required
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-500 font-semibold mb-1">Slots / Travellers</label>
                <input 
                  type="number"
                  required
                  min={1}
                  max={10}
                  value={slots}
                  onChange={e => setSlots(Number(e.target.value))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-500 font-semibold mb-1">Contact Email</label>
                <input 
                  type="email"
                  required
                  placeholder="name@domain.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none"
                />
              </div>
            </div>

            <div className="bg-yatra-cream p-4 rounded-2xl flex justify-between items-center text-xs font-semibold">
              <span className="text-gray-500">Total Price:</span>
              <span className="text-yatra-terracotta text-sm">₹{selectedExp.price * slots}</span>
            </div>

            <button
              type="submit"
              className="w-full bg-yatra-terracotta hover:bg-yatra-amber text-white font-bold py-3 rounded-xl text-xs transition-colors shadow-md"
            >
              Confirm & Request Booking
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
