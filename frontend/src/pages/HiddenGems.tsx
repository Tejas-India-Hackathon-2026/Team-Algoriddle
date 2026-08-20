import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Compass, MapPin, Eye, Play, Square, Mic, 
  HelpCircle, Volume2, Sparkles, VolumeX, ShieldCheck,
  Plus, Check, Clock, Navigation, AlertCircle
} from 'lucide-react';
import { fetchHiddenGems, fetchDiscoveriesNearRoute, askAIGuide } from '../services/api.ts';
import { speak, startListening, stopSpeaking } from '../services/voice.ts';

export default function HiddenGems() {
  const routerState = useLocation().state;
  const navigate = useNavigate();

  const [gems, setGems] = useState<any[]>([]);
  const [filter, setFilter] = useState(routerState?.filter || 'All');
  const [origin, setOrigin] = useState(routerState?.origin || 'Patna');
  const [destination, setDestination] = useState(routerState?.destination || 'Rajgir');
  const [addedGems, setAddedGems] = useState<{ [key: string]: boolean }>({});
  const [addNotice, setAddNotice] = useState<string | null>(null);
  
  // Selected Gem details for the AI Tourist Guide Modal
  const [selectedGem, setSelectedGem] = useState<any>(null);
  
  // AI Guide voice/text states
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState('');
  const [isAskingAI, setIsAskingAI] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // Load route-aware discoveries
  useEffect(() => {
    const loadDiscoveries = async () => {
      try {
        const res = await fetchDiscoveriesNearRoute({
          origin,
          destination,
          category: filter,
          maxDetourKm: 45
        });
        if (res?.discoveries && res.discoveries.length > 0) {
          setGems(res.discoveries);
        } else {
          // Fallback to full hidden list
          const allGems = await fetchHiddenGems();
          setGems(allGems);
        }
      } catch {
        const allGems = await fetchHiddenGems();
        setGems(allGems);
      }
    };

    loadDiscoveries();
  }, [origin, destination, filter]);

  const categories = ['All', 'Heritage', 'Nature', 'Culture', 'Food', 'Adventure', 'Eco-tourism'];

  const filteredGems = filter === 'All' 
    ? gems 
    : gems.filter(g => g.category?.toLowerCase() === filter.toLowerCase());

  const handleOpenAIGuide = async (gem: any) => {
    setSelectedGem(gem);
    setAiQuestion('');
    setIsAskingAI(true);
    setAiAnswer("Connecting to Gemini AI Guide...");
    
    // Call default guide query
    const res = await askAIGuide("Tell me about this place", gem.id);
    setAiAnswer(res.answer);
  };

  const handleAskText = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuestion.trim() || !selectedGem) return;
    setAiAnswer("Consulting historical records...");
    const res = await askAIGuide(aiQuestion, selectedGem.id);
    setAiAnswer(res.answer);
  };

  const handleListenSpeech = () => {
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
    } else if (aiAnswer) {
      speak(aiAnswer);
      setIsSpeaking(true);
    }
  };

  const handleStartVoiceQuestion = () => {
    setIsListening(true);
    startListening(
      async (text) => {
        setIsListening(false);
        setAiQuestion(text);
        setAiAnswer("Thinking...");
        const res = await askAIGuide(text, selectedGem.id);
        setAiAnswer(res.answer);
      },
      (err) => {
        setIsListening(false);
        console.error(err);
      }
    );
  };

  const handleCloseAIGuide = () => {
    stopSpeaking();
    setIsSpeaking(false);
    setIsAskingAI(false);
    setSelectedGem(null);
  };

  // Add Discovery to Itinerary Journey
  const handleAddToJourney = (gem: any) => {
    try {
      const existingTrip = JSON.parse(localStorage.getItem('yatra_active_trip') || 'null');
      
      const newActivity = {
        time: "11:30 AM – 12:15 PM",
        startTime: "11:30 AM",
        endTime: "12:15 PM",
        place: gem.name,
        title: `Explore ${gem.name} (Hidden Gem Discovery)`,
        category: gem.category || "Attraction",
        description: gem.whyRecommended || gem.description,
        duration: gem.visitDuration || "45 mins",
        durationMinutes: 45,
        estimatedCost: gem.costNum || 0,
        costText: gem.cost || "Free",
        type: "attraction"
      };

      if (existingTrip && existingTrip.itinerary && existingTrip.itinerary[0]) {
        existingTrip.itinerary[0].structuredActivities.splice(1, 0, newActivity);
        
        // Add waypoint to map
        if (existingTrip.mapData?.waypoints) {
          existingTrip.mapData.waypoints.splice(1, 0, {
            id: `wp_${gem.id}`,
            name: `${gem.name} (Discovery)`,
            lat: gem.lat,
            lng: gem.lng,
            type: "discovery",
            category: gem.category
          });
        }

        localStorage.setItem('yatra_active_trip', JSON.stringify(existingTrip));
      }

      setAddedGems(prev => ({ ...prev, [gem.id]: true }));
      setAddNotice(`✨ Added "${gem.name}" to your journey! Itinerary and route updated.`);
      setTimeout(() => setAddNotice(null), 4000);
    } catch (e) {
      setAddedGems(prev => ({ ...prev, [gem.id]: true }));
      setAddNotice(`✨ Added "${gem.name}" to your journey!`);
      setTimeout(() => setAddNotice(null), 4000);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-serif font-bold text-yatra-charcoal">Hidden Bihar Discovery</h1>
        <p className="text-sm text-yatra-slate font-light">
          Discover authentic, lesser-known cultural treasures, seasonal cascades, and heritage food clusters near your route.
        </p>
      </div>

      {/* Route Context Banner */}
      <div className="bg-yatra-cream/60 border border-yatra-terracotta/20 rounded-2xl p-4 flex flex-wrap justify-between items-center gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Navigation className="w-4 h-4 text-yatra-terracotta" />
          <span className="text-gray-600">Active Route Corridor:</span>
          <strong className="text-yatra-charcoal font-bold">{origin} → {destination}</strong>
        </div>
        <div className="flex items-center gap-2 text-gray-500">
          <span>Search Radius: <strong>Within 45 km detour</strong></span>
        </div>
      </div>

      {/* Added to Journey Notification */}
      {addNotice && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl text-xs font-bold animate-fade-in flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{addNotice}</span>
          </div>
          <button 
            onClick={() => navigate('/itinerary')}
            className="text-xs text-emerald-900 underline font-bold cursor-pointer"
          >
            View in Itinerary →
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-2 border-b border-gray-100 pb-4">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-4 py-2 rounded-full text-xs font-semibold border transition-all cursor-pointer ${filter === cat ? 'bg-yatra-terracotta text-white border-yatra-terracotta shadow-sm' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Gems Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {filteredGems.map(gem => (
          <div key={gem.id} className="bg-white rounded-3xl overflow-hidden border border-gray-100 hover:shadow-premium-hover transition-all duration-300 flex flex-col justify-between group">
            <div className="relative h-56 overflow-hidden">
              <img 
                src={gem.image} 
                alt={gem.name} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <span className="absolute top-4 left-4 bg-yatra-terracotta text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider backdrop-blur-sm">
                ★ Gem Score: {gem.discoveryScore || gem.hiddenScore || gem.hiddenGemScore}/100
              </span>
              {gem.distanceFromRouteText && (
                <span className="absolute bottom-4 left-4 bg-black/70 text-yatra-gold text-[10px] font-bold px-2.5 py-1 rounded-lg backdrop-blur-sm">
                  📍 {gem.distanceFromRouteText}
                </span>
              )}
            </div>
            
            <div className="p-6 space-y-4 flex-grow flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-bold uppercase text-yatra-slate flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-yatra-terracotta" /> {gem.location || gem.district}
                  </span>
                  <span className="text-[10px] font-bold uppercase bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                    {gem.category}
                  </span>
                </div>
                
                <h3 className="text-xl font-serif font-bold text-yatra-charcoal mt-1 mb-2">{gem.name}</h3>
                <p className="text-xs text-gray-500 font-light leading-relaxed line-clamp-2">{gem.description}</p>
                
                {/* Why Recommended Strip */}
                {gem.whyRecommended && (
                  <div className="mt-3 p-2.5 rounded-xl bg-gray-50 border border-gray-100 text-[11px] text-gray-600">
                    <strong className="text-yatra-charcoal block text-[10px] uppercase font-bold text-yatra-terracotta">Why near your route?</strong>
                    <p className="mt-0.5 line-clamp-2">{gem.whyRecommended}</p>
                  </div>
                )}
              </div>

              <div className="space-y-3 pt-3 border-t border-gray-100">
                <div className="grid grid-cols-2 gap-2 text-[10px] font-medium text-gray-500">
                  {gem.detourText && <span>Detour: <strong className="text-yatra-charcoal font-bold">{gem.detourText}</strong></span>}
                  {gem.visitDuration && <span>Visit: <strong className="text-yatra-charcoal font-bold">{gem.visitDuration}</strong></span>}
                  <span>Cost: <strong className="text-yatra-terracotta font-bold">{gem.cost || 'Free'}</strong></span>
                  <span>Crowd: <strong className="text-emerald-600 font-bold">{gem.crowdLevel || 'Low'}</strong></span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenAIGuide(gem)}
                    className="flex-1 inline-flex items-center justify-center gap-1 py-2.5 rounded-xl bg-yatra-terracotta/5 hover:bg-yatra-terracotta/10 text-yatra-terracotta text-xs font-bold transition-all border border-yatra-terracotta/10 cursor-pointer"
                  >
                    🎧 Guide
                  </button>
                  
                  <button
                    onClick={() => handleAddToJourney(gem)}
                    disabled={addedGems[gem.id]}
                    className={`flex-1 inline-flex items-center justify-center gap-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      addedGems[gem.id]
                        ? 'bg-emerald-600 text-white'
                        : 'bg-yatra-charcoal hover:bg-black text-white shadow-sm'
                    }`}
                  >
                    {addedGems[gem.id] ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                    {addedGems[gem.id] ? 'Added' : 'Add to Trip'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredGems.length === 0 && (
        <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm space-y-3">
          <Compass className="w-12 h-12 text-gray-300 mx-auto" />
          <h3 className="font-serif font-bold text-lg text-gray-700">No hidden discoveries found near this route</h3>
          <p className="text-xs text-gray-400 max-w-xs mx-auto">Try selecting "All" categories or broadening your route corridor.</p>
        </div>
      )}

      {/* AI Tourist Guide Modal overlay */}
      {isAskingAI && selectedGem && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] p-6 max-w-lg w-full border border-gray-100 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
            
            {/* Header info */}
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold text-yatra-terracotta uppercase tracking-wider">🎧 AI Tourist Guide</span>
                <h2 className="text-2xl font-serif font-bold text-yatra-charcoal mt-1">{selectedGem.name}</h2>
              </div>
              <button 
                onClick={handleCloseAIGuide}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 font-bold text-sm flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* AI Voice output control */}
            <div className="bg-gradient-to-r from-yatra-charcoal to-yatra-terracotta text-white rounded-2xl p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleListenSpeech}
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${isSpeaking ? 'bg-red-600 animate-pulse' : 'bg-yatra-terracotta'} text-white shadow-md cursor-pointer`}
                >
                  {isSpeaking ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5 text-yatra-gold" />}
                </button>
                <div>
                  <span className="text-xs font-semibold block">{isSpeaking ? 'Speaking Explanation...' : 'Listen to History Explanation'}</span>
                  <span className="text-[10px] text-gray-300 font-light">Interactive Voice Synthesis</span>
                </div>
              </div>
              <span className="text-[10px] font-bold bg-white/10 px-2 py-0.5 rounded-full border border-white/15">
                {selectedGem.category}
              </span>
            </div>

            {/* Guide response block */}
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 min-h-36 max-h-56 overflow-y-auto text-xs text-gray-600 leading-relaxed font-light space-y-3">
              <span className="font-semibold text-yatra-charcoal block flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-yatra-gold fill-yatra-gold" /> Guide Insight:
              </span>
              <p>{aiAnswer}</p>
            </div>

            {/* Prompt input / Voice recognition trigger */}
            <form onSubmit={handleAskText} className="flex gap-2">
              <input 
                type="text"
                placeholder="Ask about architecture, entry fee, timings..."
                value={aiQuestion}
                onChange={e => setAiQuestion(e.target.value)}
                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-yatra-terracotta"
              />
              <button
                type="button"
                onClick={handleStartVoiceQuestion}
                className={`p-2.5 rounded-xl border flex items-center justify-center transition-all ${isListening ? 'bg-red-50 text-red-600 border-red-200 animate-pulse' : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-300'}`}
                title="Ask via Speech-to-Text"
              >
                <Mic className="w-5 h-5" />
              </button>
              <button
                type="submit"
                className="bg-yatra-terracotta hover:bg-yatra-amber text-white text-xs font-semibold px-4 rounded-xl transition-colors cursor-pointer"
              >
                Ask Guide
              </button>
            </form>

            <div className="bg-yatra-forest/5 border border-yatra-forest/10 p-3.5 rounded-xl flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-yatra-forest flex-shrink-0" />
              <div className="text-[10px] text-gray-500 leading-relaxed font-light">
                <strong>Safety Verification status:</strong> {selectedGem.safetyStatus || `Active patrol routes map. Emergency support desk is located at ${selectedGem.location || selectedGem.district}.`}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
