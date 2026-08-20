import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  ShieldCheck, MapPin, Share2, PhoneCall, AlertTriangle, 
  HelpCircle, Eye, Calculator, Landmark, ShieldAlert 
} from 'lucide-react';
import L from 'leaflet';
import { fetchSafeRoute, fetchNearbyPlaces, estimateFare, reverseGeocode } from '../services/api.ts';
import { useLanguage } from '../context/LanguageContext.tsx';

export default function RouteBuilder() {
  const { t } = useLanguage();
  const routerState = useLocation().state;
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);

  const [start, setStart] = useState(routerState?.start || 'Patna');
  const [destination, setDestination] = useState(routerState?.dest || 'Bodh Gaya');
  const [routeType, setRouteType] = useState('safest');
  const [travelTime, setTravelTime] = useState('10:00 AM');
  
  // Route result states
  const [routeDetails, setRouteDetails] = useState<any>(null);
  const [emergencyPlaces, setEmergencyPlaces] = useState<any[]>([]);
  const [showEmergencyOnMap, setShowEmergencyOnMap] = useState(false);

  // Live location state
  const [isSharingLocation, setIsSharingLocation] = useState(false);
  const [shareLink, setShareLink] = useState('');

  // Transport Fare state
  const [vehicle, setVehicle] = useState('auto');
  const [actualPrice, setActualPrice] = useState('300');
  const [fareEstimate, setFareEstimate] = useState<any>(null);

  // Load route details on launch/change
  useEffect(() => {
    const loadRoute = async () => {
      const details = await fetchSafeRoute({ start, destination, routeType, travelTime });
      setRouteDetails(details);
      
      // Update Fare Estimate when distance changes
      const fare = await estimateFare(vehicle, details.distance_km);
      setFareEstimate(fare);
    };
    loadRoute();
  }, [start, destination, routeType, travelTime, vehicle]);

  // Load nearby emergency services
  useEffect(() => {
    fetchNearbyPlaces().then(data => setEmergencyPlaces(data));
  }, []);

  // Update Leaflet Map when coordinates change
  useEffect(() => {
    if (!routeDetails || !routeDetails.coordinates) return;

    // Check if container exists
    const container = document.getElementById('route-map');
    if (!container) return;

    // Clean up existing map instance
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    // Initialize new map
    const map = L.map('route-map').setView(routeDetails.coordinates[0], 9);
    mapRef.current = map;

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Render path route line
    const latlngs = routeDetails.coordinates.map((c: any) => [c[0], c[1]] as L.LatLngExpression);
    const polyline = L.polyline(latlngs, { color: '#A04000', weight: 5, opacity: 0.8 }).addTo(map);
    map.fitBounds(polyline.getBounds());

    // Custom icons for start and end
    const startMarker = L.circleMarker(latlngs[0], {
      color: '#2E86C1', radius: 8, fillColor: '#3498DB', fillOpacity: 0.8
    }).addTo(map).bindPopup(`<b>Start:</b> ${start}`);

    const endMarker = L.circleMarker(latlngs[latlngs.length - 1], {
      color: '#27AE60', radius: 8, fillColor: '#2ECC71', fillOpacity: 0.8
    }).addTo(map).bindPopup(`<b>Destination:</b> ${destination}`);

    // If emergency points are enabled, render them as markers
    if (showEmergencyOnMap && emergencyPlaces.length > 0) {
      emergencyPlaces.forEach(place => {
        if (place.location) {
          L.circleMarker(place.location, {
            color: '#E74C3C', radius: 6, fillColor: '#EC7063', fillOpacity: 0.9
          }).addTo(map).bindPopup(`<b>${place.type}:</b> ${place.name}<br/>Distance: ${place.distance}`);
        }
      });
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [routeDetails, showEmergencyOnMap, emergencyPlaces, start, destination]);

  const handleStartShare = () => {
    setIsSharingLocation(true);
    const generatedLink = `https://biharyatra.in/track/live?trip_id=TRK_${Math.floor(100000 + Math.random() * 900000)}`;
    setShareLink(generatedLink);
  };

  const handleStopShare = () => {
    setIsSharingLocation(false);
    setShareLink('');
  };

  const copyShareLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareLink);
      alert("Live location link copied! You can now send this link on WhatsApp.");
    }
  };

  const routeOptions = [
    { type: 'safest', label: '🛡️ Safest Route', desc: 'Focuses on well-lit lanes and high police post frequency' },
    { type: 'fastest', label: '⚡ Fastest Route', desc: 'Prioritizes highway routes' },
    { type: 'shortest', label: '📏 Shortest Route', desc: 'Local links, may have rural trails' },
    { type: 'scenic', label: '🌿 Scenic Route', desc: 'Riverside and valley pathways' },
    { type: 'heritage', label: '🏛️ Heritage Route', desc: 'Ancient historical markers and monuments' }
  ];

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-serif font-bold text-yatra-charcoal">Smart Route Builder</h1>
        <p className="text-xs text-yatra-slate font-light">Leverage spatial intelligence to build routes, evaluate safety, and get fair local transport fares.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Controls Column */}
        <div className="space-y-6">
          {/* Route Config card */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-yatra-charcoal flex items-center gap-1.5 uppercase tracking-wider">
              <MapPin className="w-4 h-4 text-yatra-terracotta" /> Route Setup
            </h3>
            
            <div className="space-y-3">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs text-gray-500 uppercase tracking-wider">From</label>
                  <button
                    type="button"
                    onClick={() => {
                      if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition(async pos => {
                          const geo = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
                          setStart(geo.locationName || `GPS: ${pos.coords.latitude.toFixed(3)}, ${pos.coords.longitude.toFixed(3)}`);
                        });
                      }
                    }}
                    className="text-[10px] text-yatra-terracotta hover:underline font-semibold"
                  >
                    📍 Use Current Location
                  </button>
                </div>
                <input 
                  type="text" 
                  value={start}
                  onChange={e => setStart(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-yatra-terracotta"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">To</label>
                <input 
                  type="text" 
                  value={destination}
                  onChange={e => setDestination(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-yatra-terracotta"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Time of travel</label>
                <select 
                  value={travelTime}
                  onChange={e => setTravelTime(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-yatra-terracotta"
                >
                  <option value="09:00 AM">Daytime (09:00 AM)</option>
                  <option value="03:00 PM">Afternoon (03:00 PM)</option>
                  <option value="08:00 PM">Night (08:00 PM - score drops)</option>
                  <option value="11:30 PM">Late Night (11:30 PM)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Route Preferences tabs */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-yatra-charcoal flex items-center gap-1.5 uppercase tracking-wider">
              <Landmark className="w-4 h-4 text-yatra-terracotta" /> Route Preference
            </h3>
            
            <div className="space-y-2">
              {routeOptions.map(opt => (
                <div 
                  key={opt.type}
                  onClick={() => setRouteType(opt.type)}
                  className={`p-3 rounded-2xl border cursor-pointer transition-all ${routeType === opt.type ? 'border-yatra-terracotta bg-yatra-terracotta/5' : 'border-gray-50 hover:border-gray-200'}`}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-700">{opt.label}</span>
                    {routeDetails?.alternative_routes_scores?.[opt.type] && (
                      <span className="text-[10px] bg-white border border-gray-200 px-2 py-0.5 rounded-full font-semibold">
                        Score: {routeDetails.alternative_routes_scores[opt.type]}
                      </span>
                    )}
                  </div>
                  <span className="block text-[10px] text-gray-400 font-light mt-1">{opt.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Map & Live Navigation column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Leaflet map display */}
          <div className="bg-white rounded-[32px] p-4 border border-gray-100 shadow-premium">
            <div id="route-map" className="w-full h-[400px] bg-gray-50 rounded-2xl relative">
              {/* Fallback alert if offline maps */}
              <div className="absolute top-4 right-4 z-[999] bg-white rounded-xl shadow-md p-3 border border-gray-100 flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="show-emergency" 
                  checked={showEmergencyOnMap}
                  onChange={e => setShowEmergencyOnMap(e.target.checked)}
                  className="rounded border-gray-300 text-yatra-terracotta focus:ring-yatra-terracotta"
                />
                <label htmlFor="show-emergency" className="text-[10px] font-semibold text-gray-600 cursor-pointer">
                  Show Nearby Safety Points
                </label>
              </div>
            </div>
          </div>

          {/* Details & Live Sharing Panel */}
          {routeDetails && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Route Details Card */}
              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-bold text-gray-700">Route Analytics</h3>
                    <span className="text-[11px] text-gray-400 font-light">Calculated via OpenStreetMap geometry</span>
                  </div>
                  {routeType === 'safest' && (
                    <span className="bg-green-100 border border-green-200 text-green-700 text-[10px] px-2 py-0.5 rounded-full font-bold">
                      🛡️ Recommended Safe Route
                    </span>
                  )}
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                    <span className="text-gray-400 block text-[10px] font-medium">Distance</span>
                    <span className="font-bold text-yatra-charcoal">{routeDetails.distance_km} km</span>
                  </div>
                  <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                    <span className="text-gray-400 block text-[10px] font-medium">Est Time</span>
                    <span className="font-bold text-yatra-charcoal">{Math.floor(routeDetails.duration_min / 60)}h {routeDetails.duration_min % 60}m</span>
                  </div>
                  <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                    <span className="text-gray-400 block text-[10px] font-medium">Safety Score</span>
                    <span className={`font-bold ${routeDetails.safety_score > 85 ? 'text-green-600' : 'text-amber-500'}`}>{routeDetails.safety_score}/100</span>
                  </div>
                </div>

                <div className="space-y-1.5 text-[11px]">
                  <span className="font-bold text-gray-700 block">Safety Factors Breakdown:</span>
                  <div className="grid grid-cols-2 gap-2 text-gray-500">
                    <div>🚗 Roads: {routeDetails.factors.road_conditions}</div>
                    <div>💡 Lighting: {routeDetails.factors.street_lighting}</div>
                    <div>🚑 Emergency: {routeDetails.factors.emergency_services}</div>
                    <div>🚔 Police Presence: {routeDetails.factors.police_presence}</div>
                  </div>
                </div>
              </div>

              {/* Location Sharing & Fare Estimation */}
              <div className="space-y-6">
                {/* Live location sharing */}
                <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
                  <h3 className="text-sm font-bold text-gray-700 flex items-center gap-1.5">
                    <Share2 className="w-4 h-4 text-yatra-terracotta" /> Live Location Sharing
                  </h3>
                  
                  {!isSharingLocation ? (
                    <button
                      onClick={handleStartShare}
                      className="w-full bg-yatra-terracotta hover:bg-yatra-amber text-white text-xs font-semibold py-2.5 rounded-xl transition-all shadow-sm"
                    >
                      Share My Live Location
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 bg-green-50 text-green-700 text-xs px-3 py-2 rounded-xl border border-green-200">
                        <span className="w-2.5 h-2.5 bg-green-600 rounded-full animate-ping"></span>
                        <span>Active Tracking Enabled</span>
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={copyShareLink}
                          className="flex-1 bg-white border border-gray-200 hover:border-gray-300 text-gray-700 text-xs font-semibold py-2 rounded-xl transition-all"
                        >
                          Copy Link
                        </button>
                        <button
                          onClick={handleStopShare}
                          className="bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold py-2 px-4 rounded-xl transition-all border border-red-200"
                        >
                          Stop Sharing
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Fair Fare pricing estimator */}
                <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
                  <h3 className="text-sm font-bold text-gray-700 flex items-center gap-1.5">
                    <Calculator className="w-4 h-4 text-yatra-terracotta" /> Fair Transport Pricing
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-gray-400 font-semibold mb-1">Vehicle Type</label>
                      <select
                        value={vehicle}
                        onChange={e => setVehicle(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-yatra-terracotta"
                      >
                        <option value="auto">Auto Rikshaw</option>
                        <option value="taxi">Private Taxi</option>
                        <option value="bus">Local Bus</option>
                        <option value="train">Express Train</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-400 font-semibold mb-1">Driver's Quote (₹)</label>
                      <input
                        type="number"
                        value={actualPrice}
                        onChange={e => setActualPrice(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
                      />
                    </div>
                  </div>

                  {fareEstimate && (
                    <div className="space-y-2 pt-1.5 border-t border-gray-100">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-500 font-light">Estimated fair price:</span>
                        <span className="font-bold text-yatra-charcoal">₹{fareEstimate.estimatedRange[0]}–₹{fareEstimate.estimatedRange[1]}</span>
                      </div>
                      
                      {Number(actualPrice) > fareEstimate.estimatedRange[1] && (
                        <div className="flex items-start gap-1 text-[10px] bg-amber-50 border border-amber-200 p-2 rounded-xl text-amber-700 font-medium">
                          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                          <span>⚠️ This is above the estimated fair range. Try negotiating or booking via official services.</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Nearby Safety Places detail list */}
          <div className="bg-white rounded-[32px] p-6 border border-gray-100 shadow-sm space-y-4">
            <h3 className="text-base font-serif font-bold text-yatra-charcoal flex items-center gap-1.5">
              <ShieldAlert className="w-5 h-5 text-yatra-terracotta" /> Nearby Emergency Stations
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {emergencyPlaces.map((place, idx) => (
                <div key={idx} className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex flex-col justify-between space-y-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-yatra-terracotta block tracking-wider">{place.type}</span>
                    <span className="font-bold text-xs text-gray-700 block mt-0.5 line-clamp-1">{place.name}</span>
                    <span className="text-[10px] text-gray-400 block mt-1">Distance: {place.distance}</span>
                  </div>
                  <a
                    href={`tel:${place.phone}`}
                    className="inline-flex items-center gap-1 text-[10px] font-bold text-white bg-yatra-terracotta/90 hover:bg-yatra-terracotta py-1.5 px-3 rounded-lg justify-center transition-colors"
                  >
                    <PhoneCall className="w-3 h-3" /> Call Station
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
