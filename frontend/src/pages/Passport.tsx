import React, { useState, useEffect } from 'react';
import { Award, Compass, MapPin, Sparkles, Trophy, CheckCircle2 } from 'lucide-react';

export default function Passport() {
  const [xp, setXp] = useState(450);
  const [level, setLevel] = useState(1);
  const [destinationsCount, setDestinationsCount] = useState(3);
  const [experiencesCount, setExperiencesCount] = useState(1);

  const badges = [
    { id: 'hist', name: 'History Hunter', desc: 'Visit ancient ruins of Nalanda or Pataliputra', unlocked: true, icon: '🏛️' },
    { id: 'food', name: 'Bihar Foodie', desc: 'Book a cooking class or review a Litti shop', unlocked: true, icon: '🍲' },
    { id: 'nature', name: 'Nature Explorer', desc: 'Visit Valmiki Tiger Reserve or waterfalls', unlocked: false, icon: '🌿' },
    { id: 'heritage', name: 'Heritage Explorer', desc: 'Visit a UNESCO site and caves', unlocked: true, icon: '🎖️' },
    { id: 'gems', name: 'Hidden Gem Hunter', desc: 'Find 3 spots with a Gem Score over 90', unlocked: false, icon: '🧭' }
  ];

  const stamps = [
    { place: 'Patna Sahib', date: '12 Aug 2026', type: 'History' },
    { place: 'Nalanda ruins', date: '14 Aug 2026', type: 'Heritage' },
    { place: 'Mahabodhi Temple', date: '15 Aug 2026', type: 'Spiritual' }
  ];

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-10">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-serif font-bold text-yatra-charcoal">Bihar Explorer Passport</h1>
        <p className="text-sm text-yatra-slate font-light">Earn XP, collect virtual passport stamps, and unlock specialized tourism badges as you discover Bihar.</p>
      </div>

      {/* Main Stats Header Card */}
      <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-premium flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex items-center gap-5 flex-col sm:flex-row text-center sm:text-left">
          <div className="bg-yatra-terracotta/10 p-5 rounded-full text-yatra-terracotta flex items-center justify-center">
            <Trophy className="w-12 h-12 text-yatra-gold fill-yatra-gold" />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-yatra-slate uppercase tracking-widest block">Active Level</span>
            <h2 className="text-3xl font-serif font-bold text-yatra-charcoal">Level {level} Explorer</h2>
            <p className="text-xs text-gray-400 font-light">You are in the top 15% of state travellers this month.</p>
          </div>
        </div>

        {/* XP Progress */}
        <div className="w-full md:w-80 space-y-2 text-center md:text-right">
          <div className="flex justify-between items-center text-xs font-semibold text-gray-500">
            <span>{xp} / 1000 XP</span>
            <span className="text-yatra-terracotta">Level 2 Unlock</span>
          </div>
          <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden border border-gray-200">
            <div className="bg-yatra-gold h-full rounded-full transition-all duration-500" style={{ width: '45%' }}></div>
          </div>
          <span className="text-[10px] text-yatra-slate font-light block">Get 550 more XP by checking in at Barabar Caves!</span>
        </div>
      </div>

      {/* Gamification Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Stamps/Visits Column */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-6">
          <h3 className="text-base font-serif font-bold text-yatra-charcoal flex items-center gap-1.5 border-b border-gray-100 pb-3">
            <MapPin className="w-5 h-5 text-yatra-terracotta" /> Passport Stamps ({stamps.length})
          </h3>

          <div className="space-y-4">
            {stamps.map((stamp, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 border border-gray-100 text-xs">
                <div>
                  <strong className="block text-gray-700 text-sm font-serif">{stamp.place}</strong>
                  <span className="text-[10px] text-gray-400 font-light">Stamped on: {stamp.date}</span>
                </div>
                <span className="bg-yatra-terracotta/10 text-yatra-terracotta px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider">
                  {stamp.type}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Badges Column */}
        <div className="md:col-span-2 bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-6">
          <h3 className="text-base font-serif font-bold text-yatra-charcoal flex items-center gap-1.5 border-b border-gray-100 pb-3">
            <Award className="w-5 h-5 text-yatra-terracotta" /> Explorer Achievement Badges
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {badges.map(badge => (
              <div 
                key={badge.id}
                className={`p-4 rounded-2xl border transition-all flex items-center gap-4 ${badge.unlocked ? 'border-yatra-terracotta/25 bg-yatra-terracotta/5' : 'border-gray-100 bg-gray-50 opacity-60'}`}
              >
                <span className="text-4xl">{badge.icon}</span>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <strong className="text-xs font-bold text-gray-700">{badge.name}</strong>
                    {badge.unlocked && <CheckCircle2 className="w-4 h-4 text-yatra-forest fill-green-100" />}
                  </div>
                  <p className="text-[10px] text-gray-400 font-light leading-relaxed">{badge.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-yatra-gold/5 border border-yatra-gold/15 p-4 rounded-2xl flex items-center gap-2 text-xs">
            <Sparkles className="w-4 h-4 text-yatra-gold fill-yatra-gold flex-shrink-0" />
            <span className="text-yatra-amber font-medium">
              Next Goal: Complete Valmiki Safari to unlock the <strong className="italic">Nature Explorer</strong> badge and earn 300 XP.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
