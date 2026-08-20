import React, { useState, useEffect } from 'react';
import { ShieldCheck, Compass, Thermometer, BarChart, CheckCircle } from 'lucide-react';
import { fetchDestinations } from '../services/api.ts';

export default function Intelligence() {
  const [destList, setDestList] = useState<any[]>([]);

  useEffect(() => {
    fetchDestinations().then(data => setDestList(data));
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-10">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-serif font-bold text-yatra-charcoal flex items-center gap-2">
          <BarChart className="w-8 h-8 text-yatra-terracotta" /> Tourism Intelligence Board
        </h1>
        <p className="text-sm text-yatra-slate font-light">Cross-analyzing safety metrics, crowd indices, weather, and seasonal accommodation indices.</p>
      </div>

      {/* Analytics grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {destList.map(dest => (
          <div key={dest.id} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-5">
            <div className="flex justify-between items-start border-b border-gray-100 pb-3">
              <div>
                <span className="text-[10px] font-bold text-yatra-terracotta uppercase">{dest.category}</span>
                <h3 className="text-xl font-serif font-bold text-yatra-charcoal mt-0.5">{dest.name}</h3>
              </div>
              <span className="bg-yatra-terracotta/10 text-yatra-terracotta font-serif font-bold text-base px-3 py-1 rounded-full">
                {dest.tourismScore}/100
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center text-xs font-light text-gray-500">
              <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
                <span className="block text-[10px] text-gray-400 font-medium">Safety Score</span>
                <span className="block font-bold text-yatra-charcoal text-sm mt-0.5">{dest.safetyScore}/100</span>
              </div>
              <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
                <span className="block text-[10px] text-gray-400 font-medium">Crowd Index</span>
                <span className="block font-bold text-yatra-charcoal text-sm mt-0.5">{dest.crowdLevel}</span>
              </div>
              <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
                <span className="block text-[10px] text-gray-400 font-medium">Weather Index</span>
                <span className="block font-bold text-yatra-charcoal text-sm mt-0.5">{dest.weather}</span>
              </div>
              <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
                <span className="block text-[10px] text-gray-400 font-medium">Cost Category</span>
                <span className="block font-bold text-yatra-terracotta text-sm mt-0.5">{dest.costLevel}</span>
              </div>
            </div>

            <div className="bg-yatra-terracotta/5 border border-yatra-terracotta/10 p-4 rounded-2xl text-xs text-yatra-amber leading-relaxed font-light">
              <strong>✨ AI Insight:</strong> {dest.aiInsight}
            </div>

            <div className="text-xs text-gray-400 font-light flex justify-between items-center">
              <span>Best visiting hours: <strong>{dest.bestTime}</strong></span>
              <span className="text-yatra-forest font-semibold flex items-center gap-0.5">
                <CheckCircle className="w-4 h-4 text-yatra-forest" /> Optimized
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
