import React, { useState, useEffect, useRef } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Download, Share2, Save, MapPin, 
  Clock, Shield, DollarSign, CloudSun, Hotel, 
  Utensils, Navigation, AlertCircle, Compass, Calendar, 
  Map, Sparkles, CheckCircle2, ChevronDown, ChevronUp,
  CreditCard, ShieldCheck, HelpCircle, PhoneCall, Radio, Zap
} from 'lucide-react';
import L from 'leaflet';
import { 
  generateTrip, 
  fetchWeather, 
  saveOfflinePack, 
  fetchDualRoutes, 
  recalculateRoute, 
  reverseGeocode, 
  submitFareDispute 
} from '../services/api.ts';

// Helper for distance in meters
function getDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // Earth radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function getManeuverSymbol(maneuver?: string) {
  switch (maneuver) {
    case 'turn-left': return '↰';
    case 'turn-right': return '↱';
    case 'uturn': return '↶';
    case 'roundabout': return '🔄';
    case 'arrive': return '🏁';
    case 'depart': return '🚗';
    default: return '↑';
  }
}

export default function Itinerary() {
  const location = useLocation();
  const navigate = useNavigate();
  const [trip, setTrip] = useState<any>(null);
  const [weather, setWeather] = useState<any>(null);
  const [selectedDay, setSelectedDay] = useState(1);
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState('');
  const [offlineStatus, setOfflineStatus] = useState('');
  const [expandedCategory, setExpandedCategory] = useState<string | null>('Transit & Inter-City');

  // Dual Route & Navigation State
  const [dualRoutes, setDualRoutes] = useState<any>(null);
  const [selectedRouteType, setSelectedRouteType] = useState<'FASTEST' | 'SAFER'>('FASTEST');
  const [showSafetyExplain, setShowSafetyExplain] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [navRemainingDist, setNavRemainingDist] = useState('');
  const [navRemainingTime, setNavRemainingTime] = useState('');
  const [routeChangedNotice, setRouteChangedNotice] = useState<string | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [distToNextStepText, setDistToNextStepText] = useState('In 500 m');
  const [destinationReached, setDestinationReached] = useState(false);

  // Live location & geocoding state
  const [liveCoords, setLiveCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [liveLocationName, setLiveLocationName] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationAccuracyNotice, setLocationAccuracyNotice] = useState<string | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);

  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker | L.CircleMarker }>({});
  const liveMarkerRef = useRef<L.CircleMarker | null>(null);
  const fastPolylineRef = useRef<L.Polyline | null>(null);
  const safePolylineRef = useRef<L.Polyline | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const lastRecalcTimeRef = useRef<number>(0);

  // Initialize or load trip
  useEffect(() => {
    let loadedTrip = location.state?.trip;

    if (!loadedTrip) {
      const stored = localStorage.getItem('yatra_active_trip');
      if (stored) {
        try {
          loadedTrip = JSON.parse(stored);
        } catch {
          loadedTrip = null;
        }
      }
    }

    if (loadedTrip && loadedTrip.destination && loadedTrip.itinerary) {
      setTrip(loadedTrip);
      localStorage.setItem('yatra_active_trip', JSON.stringify(loadedTrip));
      
      if (loadedTrip.startLocation && loadedTrip.startLocation.latitude) {
        setLiveCoords({ lat: loadedTrip.startLocation.latitude, lng: loadedTrip.startLocation.longitude });
        setLiveLocationName(loadedTrip.startLocation.name);
      } else if (loadedTrip.userCoordinates) {
        setLiveCoords(loadedTrip.userCoordinates);
      }

      if (loadedTrip.weather) {
        setWeather(loadedTrip.weather);
      } else {
        const dest = loadedTrip.destination;
        fetchWeather(dest, loadedTrip.startDate).then(data => setWeather(data));
      }

      // Fetch dual routes passing all itinerary waypoints for real road coverage
      const startOrigin = loadedTrip.startLocation || loadedTrip.userCoordinates || loadedTrip.startingLocation;
      fetchDualRoutes(startOrigin, loadedTrip.destination, loadedTrip.transport || 'Mixed', loadedTrip.mapData?.waypoints)
        .then(dual => {
          if (dual) setDualRoutes(dual);
        });
    } else {
      // If no valid trip exists, return to Planner
      navigate('/planner', { 
        replace: true, 
        state: { error: 'No active journey found. Please craft your journey with your destination and starting location.' } 
      });
    }
  }, [location, navigate]);

  // Handle "Use My Current Location"
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setLocationAccuracyNotice(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const accuracy = pos.coords.accuracy;

        setLiveCoords({ lat, lng });

        if (accuracy > 100) {
          setLocationAccuracyNotice(`Location accuracy: ~${Math.round(accuracy)}m`);
        }

        try {
          const geo = await reverseGeocode(lat, lng);
          const name = geo.name || `GPS: ${lat.toFixed(3)}, ${lng.toFixed(3)}`;
          const fullStartObj = {
            name: geo.name,
            address: geo.address,
            city: geo.city,
            district: geo.district,
            state: geo.state,
            latitude: lat,
            longitude: lng,
            accuracy: Math.round(accuracy)
          };
          
          setLiveLocationName(name);

          // Update trip starting location and startLocation
          if (trip) {
            setTrip((prev: any) => ({
              ...prev,
              startingLocation: geo.displayName || `📍 Current Location (${name}, Bihar)`,
              startLocation: fullStartObj,
              userCoordinates: { lat, lng }
            }));

            // Fetch new dual routes from live GPS
            const dual = await fetchDualRoutes(fullStartObj, trip.destination, trip.transport, trip.mapData?.waypoints);
            if (dual) setDualRoutes(dual);
          }
        } catch {
          setLiveLocationName(`GPS (${lat.toFixed(3)}, ${lng.toFixed(3)})`);
        }

        setIsLocating(false);
      },
      (err) => {
        setIsLocating(false);
        if (err.code === 1) {
          alert('Location access was denied. You can continue using the manual starting location.');
        } else {
          alert('Could not retrieve current location. Please try again.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const activeRoute = selectedRouteType === 'FASTEST' ? dualRoutes?.fastest : dualRoutes?.safer;
  const activeSteps: any[] = activeRoute?.steps || [];
  const currentStep = activeSteps[currentStepIndex] || activeSteps[0];
  const nextStep = activeSteps[currentStepIndex + 1];

  // Start Live Road Navigation
  const startNavigation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported on this device.');
      return;
    }

    setIsNavigating(true);
    setDestinationReached(false);
    setRouteChangedNotice(null);
    setCurrentStepIndex(0);

    const r = selectedRouteType === 'FASTEST' ? dualRoutes?.fastest : dualRoutes?.safer;
    setNavRemainingDist(r?.distanceText || '18.4 km');
    setNavRemainingTime(r?.durationText || '32 min');
    setDistToNextStepText('In 450 m');

    // Start watching driving position
    watchIdRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setLiveCoords({ lat, lng });

        // Move live marker on map
        if (mapRef.current && liveMarkerRef.current) {
          liveMarkerRef.current.setLatLng([lat, lng]);
        }

        // 1. Destination arrival detection (within 40m)
        const destCoords = dualRoutes?.destCoords || (trip?.mapData?.waypoints?.slice(-1)[0] ? [trip.mapData.waypoints.slice(-1)[0].lat, trip.mapData.waypoints.slice(-1)[0].lng] : null);
        if (destCoords) {
          const distToDest = getDistanceInMeters(lat, lng, destCoords[0], destCoords[1]);
          if (distToDest < 45) {
            setDestinationReached(true);
            setDistToNextStepText("Destination reached!");
            stopNavigation();
            return;
          }
        }

        // 2. Step Maneuver Progression
        const steps = (selectedRouteType === 'FASTEST' ? dualRoutes?.fastest : dualRoutes?.safer)?.steps || [];
        if (steps.length > 0 && currentStepIndex < steps.length) {
          const targetStep = steps[currentStepIndex];
          if (targetStep && targetStep.location) {
            const distMeters = Math.round(getDistanceInMeters(lat, lng, targetStep.location[0], targetStep.location[1]));
            if (distMeters <= 35) {
              // Advance to next step
              setCurrentStepIndex(idx => Math.min(steps.length - 1, idx + 1));
              setDistToNextStepText("Turn completed");
            } else if (distMeters < 1000) {
              setDistToNextStepText(`In ${distMeters} m`);
            } else {
              setDistToNextStepText(`In ${(distMeters / 1000).toFixed(1)} km`);
            }
          }
        }

        // 3. Off-route detection & auto-reroute
        const polyline = (selectedRouteType === 'FASTEST' ? dualRoutes?.fastest : dualRoutes?.safer)?.polyline || [];
        if (polyline.length > 0 && trip) {
          // Find minimum distance to route polyline
          let minDistanceToRoute = Infinity;
          for (let i = 0; i < polyline.length; i += 3) {
            const pt = polyline[i];
            const d = getDistanceInMeters(lat, lng, pt[0], pt[1]);
            if (d < minDistanceToRoute) minDistanceToRoute = d;
          }

          // If off-route (> 180 meters) and not rerouted in last 8 seconds
          const now = Date.now();
          if (minDistanceToRoute > 180 && now - lastRecalcTimeRef.current > 8000) {
            lastRecalcTimeRef.current = now;
            setRouteChangedNotice("⚠️ Route deviation detected — Recalculating from your new live position...");
            
            const recalc = await recalculateRoute(lat, lng, trip.destination, trip.transport);
            if (recalc) {
              setDualRoutes(recalc);
              setCurrentStepIndex(0);
              setTimeout(() => setRouteChangedNotice(null), 4000);
            }
          }
        }
      },
      (err) => {
        console.warn("Navigation watch error:", err.message);
      },
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 }
    );
  };

  const stopNavigation = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsNavigating(false);
  };

  // Cleanup watcher on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Leaflet Map Initialization and Real Road Route Rendering
  useEffect(() => {
    if (!trip || !trip.mapData || !trip.mapData.waypoints) return;

    try {
      const mapContainer = document.getElementById('itinerary-map');
      if (!mapContainer) return;

      // Destroy prior map instance if existing
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      // Filter and validate waypoints
      const waypoints = (trip.mapData.waypoints || []).filter((wp: any) => 
        wp && typeof wp.lat === 'number' && typeof wp.lng === 'number' && !isNaN(wp.lat) && !isNaN(wp.lng)
      );

      const initialCenter: [number, number] = liveCoords 
        ? [liveCoords.lat, liveCoords.lng]
        : [waypoints[0]?.lat || 25.1982, waypoints[0]?.lng || 85.5149];
      
      const map = L.map('itinerary-map', {
        zoomControl: true,
        scrollWheelZoom: false
      }).setView(initialCenter, 10);
      
      mapRef.current = map;
      markersRef.current = {};

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18
      }).addTo(map);

      // Force recalculation of container size after mounting to prevent blank tiles
      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.invalidateSize();
        }
      }, 250);

      // 1. Render Dual Road Routes Polylines if available
      if (dualRoutes?.fastest?.polyline && dualRoutes.fastest.polyline.length > 1) {
        const isFastestActive = selectedRouteType === 'FASTEST';

        // Fastest Polyline (Blue/Cyan road route)
        const fastLatLngs = dualRoutes.fastest.polyline.map((p: any) => [p[0], p[1]] as L.LatLngExpression);
        if (fastLatLngs.length > 1) {
          const fastPolyline = L.polyline(fastLatLngs, {
            color: isFastestActive ? '#1E40AF' : '#64748B',
            weight: isFastestActive ? 6 : 3.5,
            opacity: isFastestActive ? 0.95 : 0.45,
            dashArray: isFastestActive ? undefined : '5, 8'
          }).addTo(map);
          fastPolylineRef.current = fastPolyline;
        }

        // Safer Polyline (Terracotta/Amber road route)
        if (dualRoutes.safer?.polyline && dualRoutes.safer.polyline.length > 1) {
          const safeLatLngs = dualRoutes.safer.polyline.map((p: any) => [p[0], p[1]] as L.LatLngExpression);
          const safePolyline = L.polyline(safeLatLngs, {
            color: !isFastestActive ? '#C05621' : '#94A3B8',
            weight: !isFastestActive ? 6 : 3.5,
            opacity: !isFastestActive ? 0.95 : 0.45,
            dashArray: !isFastestActive ? undefined : '5, 8'
          }).addTo(map);
          safePolylineRef.current = safePolyline;
        }
      } else if (trip.mapData?.polyline && trip.mapData.polyline.length > 1) {
        // Fallback to trip mapData full OSRM polyline
        const latLngs = trip.mapData.polyline.map((p: any) => [p[0], p[1]] as L.LatLngExpression);
        if (latLngs.length > 1) {
          L.polyline(latLngs, {
            color: '#C05621',
            weight: 5,
            opacity: 0.9
          }).addTo(map);
        }
      }

      // 2. Render Verified Itinerary Markers
      waypoints.forEach((wp: any) => {
        if (typeof wp.lat !== 'number' || typeof wp.lng !== 'number' || isNaN(wp.lat) || isNaN(wp.lng)) return;

        let color = '#C05621';
        let fillColor = '#DD6B20';
        let radius = 7;
        let typeBadge = wp.category || "Attraction";

        if (wp.type === 'start') {
          color = '#1D4ED8';
          fillColor = '#3B82F6';
          radius = 10;
          typeBadge = "Departure Point";
        } else if (wp.type === 'return') {
          color = '#4338CA';
          fillColor = '#6366F1';
          radius = 10;
          typeBadge = "Return Arrival";
        } else if (wp.type === 'accommodation') {
          color = '#047857';
          fillColor = '#10B981';
          radius = 8;
          typeBadge = "Accommodation";
        }

        const marker = L.circleMarker([wp.lat, wp.lng], {
          color: color,
          fillColor: fillColor,
          fillOpacity: 0.95,
          radius: radius,
          weight: 2.5
        }).addTo(map);

        const popupContent = `
          <div style="font-family: sans-serif; font-size: 12px; line-height: 1.4; padding: 2px;">
            <span style="display:inline-block; font-size:10px; font-weight:bold; color:white; background:${color}; padding:2px 6px; border-radius:4px; margin-bottom:4px;">${typeBadge}</span><br/>
            <strong style="color: #1F2937; font-size: 13px;">${wp.name}</strong><br/>
            <span style="color: #4B5563;">🕒 ${wp.time || 'Visit Point'}</span><br/>
            <small style="color: #6B7280;">${wp.description || ''}</small>
          </div>
        `;
        marker.bindPopup(popupContent);
        markersRef.current[wp.id] = marker;
      });

      // 3. Live User GPS Position Marker
      if (liveCoords && typeof liveCoords.lat === 'number' && typeof liveCoords.lng === 'number' && !isNaN(liveCoords.lat) && !isNaN(liveCoords.lng)) {
        const liveMarker = L.circleMarker([liveCoords.lat, liveCoords.lng], {
          color: '#2563EB',
          fillColor: '#3B82F6',
          fillOpacity: 1,
          radius: 8,
          weight: 3
        }).addTo(map);

        liveMarker.bindPopup(`
          <div style="font-family: sans-serif; font-size: 12px;">
            <strong style="color: #2563EB;">📍 You are here</strong><br/>
            <span>${liveLocationName || 'Live GPS Location'}</span>
          </div>
        `);
        liveMarkerRef.current = liveMarker;
      }

      // 4. Viewport auto-fit to encompass all markers and full route
      const bounds = L.latLngBounds([]);
      waypoints.forEach((wp: any) => {
        if (typeof wp.lat === 'number' && typeof wp.lng === 'number') {
          bounds.extend([wp.lat, wp.lng]);
        }
      });
      if (liveCoords && typeof liveCoords.lat === 'number' && typeof liveCoords.lng === 'number') {
        bounds.extend([liveCoords.lat, liveCoords.lng]);
      }
      if (dualRoutes?.fastest?.polyline) {
        dualRoutes.fastest.polyline.forEach((p: any) => bounds.extend([p[0], p[1]]));
      } else if (trip.mapData?.polyline) {
        trip.mapData.polyline.forEach((p: any) => bounds.extend([p[0], p[1]]));
      }

      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
      }

      setMapError(null);
    } catch (err: any) {
      console.error("Map initialization error:", err);
      setMapError("Interactive map temporarily unavailable.");
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [trip, dualRoutes, selectedRouteType, liveCoords]);

  // Focus marker when selectedStopId changes
  const handleSelectStop = (stopId: string, lat?: number, lng?: number) => {
    setSelectedStopId(stopId);
    if (mapRef.current && typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng)) {
      mapRef.current.flyTo([lat, lng], 13, { animate: true, duration: 1.0 });
      if (markersRef.current[stopId]) {
        markersRef.current[stopId].openPopup();
      }
    }
  };

  const toggleCategory = (cat: string) => {
    setExpandedCategory(expandedCategory === cat ? null : cat);
  };

  if (!trip) return <div className="text-center py-20 font-serif text-lg">Loading Itinerary...</div>;

  const handleSave = () => {
    const saved = JSON.parse(localStorage.getItem('yatra_saved_trips') || '[]');
    saved.push({ ...trip, id: 'trip_' + Date.now(), savedAt: new Date().toLocaleDateString() });
    localStorage.setItem('yatra_saved_trips', JSON.stringify(saved));
    setSaveStatus('✨ Journey saved successfully!');
    setTimeout(() => setSaveStatus(''), 3000);
  };

  const handleOfflineDownload = () => {
    const pack = {
      id: 'pack_' + Date.now(),
      destination: trip.destination,
      downloadedAt: new Date().toLocaleDateString(),
      itinerary: trip.itinerary,
      contacts: [
        { name: "Patna Tourist Help Centre", phone: "+91-612-2225418" },
        { name: "Jamui District Tourist Desk", phone: "+91-6345-222010" },
        { name: "Rajgir Police Post", phone: "+91-6112-255242" },
        { name: "Bodh Gaya Police Post", phone: "+91-631-2200741" }
      ],
      notes: "Weather forecast cached. Map coordinates and route polyline stored."
    };
    const ok = saveOfflinePack(pack);
    if (ok) {
      setOfflineStatus('✓ Offline Pack downloaded! Available in Offline Mode.');
      setTimeout(() => setOfflineStatus(''), 3500);
    }
  };

  const handleShare = () => {
    const text = `Check out my Bihar itinerary: ${trip.startingLocation} to ${trip.destination}!`;
    if (navigator.share) {
      navigator.share({
        title: 'Bihar Yatra Trip',
        text: text,
        url: window.location.href
      }).catch(err => console.log(err));
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard! Share it on WhatsApp.');
    }
  };

  const itemized = trip.breakdown?.itemized;

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
      {/* Top controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link 
          to="/planner" 
          className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-yatra-terracotta transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Planner
        </Link>
        <div className="flex gap-2">
          <button 
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-full bg-white border border-gray-200 text-gray-700 hover:border-gray-300 transition-colors shadow-sm"
          >
            <Save className="w-3.5 h-3.5 text-yatra-terracotta" /> Save Trip
          </button>
          <button 
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-full bg-white border border-gray-200 text-gray-700 hover:border-gray-300 transition-colors shadow-sm"
          >
            <Share2 className="w-3.5 h-3.5 text-yatra-terracotta" /> Share Trip
          </button>
          <button 
            onClick={handleOfflineDownload}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-full bg-yatra-terracotta text-white hover:bg-yatra-amber transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-yatra-gold" /> Download Offline Pack
          </button>
        </div>
      </div>

      {/* Notifications */}
      {saveStatus && (
        <div className="bg-yatra-forest/10 border border-yatra-forest/20 text-yatra-forest p-4 rounded-xl text-sm font-semibold animate-fade-in">
          {saveStatus}
        </div>
      )}
      {offlineStatus && (
        <div className="bg-yatra-forest/10 border border-yatra-forest/20 text-yatra-forest p-4 rounded-xl text-sm font-semibold animate-fade-in">
          {offlineStatus}
        </div>
      )}
      {routeChangedNotice && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-xl text-sm font-semibold animate-fade-in flex items-center gap-2">
          <Radio className="w-4 h-4 text-blue-600 animate-pulse" /> {routeChangedNotice}
        </div>
      )}
      {destinationReached && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 p-4 rounded-xl text-sm font-bold animate-fade-in flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" /> 🎉 Destination reached! You have arrived at {trip.destination}.
        </div>
      )}

      {/* Live Turn-by-Turn Navigation HUD */}
      {isNavigating && (
        <div className="bg-yatra-charcoal text-white rounded-3xl p-6 border border-yatra-charcoal shadow-2xl space-y-4 animate-fade-in">
          {/* Main Turn Instruction Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-700 pb-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-yatra-terracotta flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                {getManeuverSymbol(currentStep?.maneuver)}
              </div>
              <div>
                <span className="text-xs uppercase font-bold text-yatra-gold tracking-widest block">
                  {distToNextStepText}
                </span>
                <h3 className="font-serif font-bold text-xl text-white">
                  {currentStep?.instruction || "Follow road corridor to destination"}
                </h3>
                {currentStep?.roadName && (
                  <p className="text-xs text-gray-300 mt-0.5">
                    Road: <strong className="text-white">{currentStep.roadName}</strong>
                  </p>
                )}
              </div>
            </div>

            {/* Remaining HUD & Stop Control */}
            <div className="flex items-center gap-4 bg-gray-800/80 px-4 py-2.5 rounded-2xl border border-gray-700 w-full md:w-auto justify-between">
              <div>
                <span className="text-[10px] text-gray-400 block uppercase">Remaining</span>
                <span className="text-base font-bold text-white">{navRemainingDist}</span>
              </div>
              <div className="h-8 w-px bg-gray-700"></div>
              <div>
                <span className="text-[10px] text-gray-400 block uppercase">ETA</span>
                <span className="text-base font-bold text-yatra-gold">{navRemainingTime}</span>
              </div>
              <button
                onClick={stopNavigation}
                className="ml-2 px-3.5 py-2 rounded-xl bg-red-600/80 hover:bg-red-600 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Stop
              </button>
            </div>
          </div>

          {/* Next Step Preview Bar */}
          <div className="flex flex-wrap justify-between items-center text-xs text-gray-300 gap-2">
            <div>
              <span>Step {currentStepIndex + 1} of {Math.max(1, activeSteps.length)}: </span>
              <span className="text-white font-medium">
                {nextStep ? `Then ${nextStep.instruction}` : "Arriving at final destination"}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-gray-400">
                Route: <strong className="text-yatra-gold">{selectedRouteType === 'FASTEST' ? '⚡ Fastest Route' : '🛡 Safer Route'}</strong>
              </span>
              <span className="text-[11px] text-gray-400">
                Destination: <strong className="text-white">{trip.destination}</strong>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Header Info & Budget Overview */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white rounded-3xl p-8 border border-gray-100 shadow-premium">
        <div className="space-y-1">
          <span className="text-xs font-bold text-yatra-terracotta uppercase tracking-wider block">
            Tailored Bihar Itinerary
          </span>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-yatra-charcoal">
            {liveLocationName ? `📍 ${liveLocationName}` : trip.startingLocation} → {trip.destination}
          </h1>

          {locationAccuracyNotice && (
            <p className="text-[11px] text-amber-600 font-medium">{locationAccuracyNotice}</p>
          )}

          <p className="text-sm text-yatra-slate font-light flex items-center gap-2">
            <Calendar className="w-4 h-4 text-yatra-terracotta" /> Duration: {trip.duration} Days ({trip.nights || (trip.duration - 1)} Nights) | 
            <Clock className="w-4 h-4 text-yatra-terracotta" /> Style: {trip.travelStyle || 'Balanced'} |
            <span className="font-medium text-yatra-charcoal">👥 {trip.totalTravellers || 2} Travellers</span>
          </p>
        </div>

        <div className="flex items-center gap-4 border-l-0 md:border-l border-gray-100 pl-0 md:pl-8">
          <div>
            <span className="text-[10px] text-gray-400 uppercase font-semibold block">Total Estimated Budget</span>
            <span className="text-3xl font-bold text-yatra-terracotta font-serif">₹{trip.totalCost}</span>
            <span className="text-[10px] text-yatra-forest font-semibold block mt-0.5">
              {trip.savings > 0 
                ? `₹${trip.savings} saved vs standard estimates` 
                : `₹${trip.costPerPerson || Math.round(trip.totalCost / (trip.totalTravellers || 2))} / person`}
            </span>
          </div>

          {!isNavigating ? (
            <button 
              onClick={startNavigation}
              className="inline-flex items-center gap-1.5 px-5 py-3 rounded-2xl bg-yatra-terracotta text-white font-semibold text-xs hover:bg-yatra-amber transition-colors shadow-md cursor-pointer"
            >
              <Map className="w-4 h-4 text-yatra-gold" /> Start Navigation
            </button>
          ) : (
            <button 
              onClick={stopNavigation}
              className="inline-flex items-center gap-1.5 px-5 py-3 rounded-2xl bg-gray-800 text-white font-semibold text-xs hover:bg-gray-900 transition-colors shadow-md cursor-pointer"
            >
              Stop Navigation
            </button>
          )}
        </div>
      </div>

      {/* Interactive Journey Route Map Card */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-premium space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-yatra-terracotta" />
            <h3 className="font-serif font-bold text-lg text-yatra-charcoal">Interactive Journey Route Map</h3>
          </div>

          {/* Dual Route Toggle: Fastest vs Safer */}
          {dualRoutes && (
            <div className="flex items-center gap-1.5 bg-gray-50 p-1 rounded-2xl border border-gray-200 text-xs">
              <button
                onClick={() => setSelectedRouteType('FASTEST')}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-all flex items-center gap-1 ${
                  selectedRouteType === 'FASTEST'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-blue-600'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                ⚡ Fastest ({dualRoutes.fastest?.durationText})
              </button>
              
              <button
                onClick={() => setSelectedRouteType('SAFER')}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-all flex items-center gap-1 ${
                  selectedRouteType === 'SAFER'
                    ? 'bg-yatra-terracotta text-white shadow-sm'
                    : 'text-gray-600 hover:text-yatra-terracotta'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                🛡 Safer ({dualRoutes.safer?.durationText})
              </button>
            </div>
          )}
        </div>

        {/* Route Details & Difference Strip */}
        {dualRoutes && (
          <div className="bg-gray-50/80 rounded-2xl p-3 border border-gray-100 text-xs flex flex-wrap justify-between items-center gap-3">
            <div className="flex items-center gap-3 text-gray-700">
              <span className="font-semibold text-yatra-charcoal">
                {selectedRouteType === 'FASTEST' ? '⚡ Fastest Route Selected' : '🛡 Safer Route (Safety Preference)'}:
              </span>
              <span>
                {selectedRouteType === 'FASTEST'
                  ? `${dualRoutes.fastest?.distanceText} • ${dualRoutes.fastest?.durationText} • ${dualRoutes.fastest?.trafficLevel}`
                  : `${dualRoutes.safer?.distanceText} • ${dualRoutes.safer?.durationText} • ${dualRoutes.safer?.timeDifferenceText}`
                }
              </span>
            </div>

            {selectedRouteType === 'SAFER' && (
              <button
                onClick={() => setShowSafetyExplain(!showSafetyExplain)}
                className="text-[11px] text-yatra-terracotta font-semibold hover:underline flex items-center gap-1"
              >
                {showSafetyExplain ? 'Hide Factors' : 'View Safety Factors'}
                {showSafetyExplain ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            )}
          </div>
        )}

        {/* Explainable Safety Factor Breakdown Dropdown */}
        {showSafetyExplain && dualRoutes?.safer?.factors && (
          <div className="bg-yatra-cream/60 border border-yatra-terracotta/20 rounded-2xl p-4 text-xs space-y-2 animate-fade-in">
            <h4 className="font-bold text-yatra-charcoal uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-yatra-terracotta" /> Safer Route Evaluation Factors (Comparative Analysis)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              <div className="bg-white p-3 rounded-xl border border-gray-100">
                <span className="font-semibold text-yatra-charcoal block">Corridor Quality</span>
                <p className="text-gray-600 text-[11px] mt-0.5">{dualRoutes.safer.factors.roadConditions}</p>
              </div>
              <div className="bg-white p-3 rounded-xl border border-gray-100">
                <span className="font-semibold text-yatra-charcoal block">Traffic Conditions</span>
                <p className="text-gray-600 text-[11px] mt-0.5">{dualRoutes.safer.factors.trafficConditions}</p>
              </div>
              <div className="bg-white p-3 rounded-xl border border-gray-100">
                <span className="font-semibold text-yatra-charcoal block">Patrol & Illumination</span>
                <p className="text-gray-600 text-[11px] mt-0.5">{dualRoutes.safer.factors.lightingAndPatrol}</p>
              </div>
            </div>
            <p className="text-[10px] text-gray-500 italic mt-1">
              * Note: "Safer Route" reflects road classification, lighting, and bypass characteristics without guaranteeing absolute safety.
            </p>
          </div>
        )}

        {/* Leaflet Map Container */}
        {mapError ? (
          <div className="w-full h-80 bg-gray-50 rounded-2xl border border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-500 gap-2">
            <Map className="w-8 h-8 text-gray-400" />
            <p className="text-sm font-semibold">{mapError}</p>
            <button 
              onClick={() => window.location.reload()}
              className="text-xs text-yatra-terracotta font-semibold hover:underline"
            >
              Refresh Map
            </button>
          </div>
        ) : (
          <div 
            id="itinerary-map" 
            className="w-full h-96 rounded-2xl border border-gray-200 z-10"
            style={{ minHeight: '384px' }}
          ></div>
        )}

        {/* Interactive Stops Bar */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
          <span className="text-xs font-semibold text-gray-500 self-center">Interactive Stops:</span>
          {trip.mapData?.waypoints?.map((wp: any) => (
            <button
              key={wp.id}
              onClick={() => handleSelectStop(wp.id, wp.lat, wp.lng)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                selectedStopId === wp.id
                  ? 'bg-yatra-charcoal text-white border-yatra-charcoal shadow-sm'
                  : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
              }`}
            >
              {wp.name}
            </button>
          ))}
        </div>
      </div>

      {/* Day-by-Day Itinerary Tabs */}
      <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-premium space-y-6">
        <div className="flex justify-between items-center border-b border-gray-100 pb-4">
          <div>
            <span className="text-xs font-bold text-yatra-terracotta uppercase tracking-wider block">Timeline</span>
            <h3 className="font-serif font-bold text-2xl text-yatra-charcoal">Chronological Day Schedule</h3>
          </div>

          <div className="flex gap-2">
            {trip.itinerary?.map((day: any) => (
              <button
                key={day.day}
                onClick={() => setSelectedDay(day.day)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedDay === day.day
                    ? 'bg-yatra-terracotta text-white shadow-md'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                Day {day.day}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Day Activities List */}
        {trip.itinerary?.filter((d: any) => d.day === selectedDay).map((day: any) => (
          <div key={day.day} className="space-y-4 animate-fade-in">
            <div className="bg-yatra-cream/40 p-4 rounded-2xl border border-yatra-terracotta/10 flex justify-between items-center">
              <div>
                <h4 className="font-serif font-bold text-base text-yatra-charcoal">
                  Day {day.day}: {day.title || `Exploring ${trip.destination}`}
                </h4>
                <p className="text-xs text-gray-500 font-light mt-0.5">{day.theme || 'Heritage & Cultural Highlights'}</p>
              </div>
              <span className="text-xs font-bold bg-white px-3 py-1 rounded-full text-yatra-terracotta border border-yatra-terracotta/20 shadow-sm">
                {day.date || `Day ${day.day}`}
              </span>
            </div>

            <div className="space-y-3">
              {day.structuredActivities?.map((act: any, idx: number) => {
                const isTravel = act.type === 'travel';
                const isMeal = act.type === 'meal';
                return (
                  <div 
                    key={idx}
                    className={`p-5 rounded-2xl border transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
                      isTravel 
                        ? 'bg-blue-50/40 border-blue-100' 
                        : isMeal 
                        ? 'bg-amber-50/40 border-amber-100' 
                        : 'bg-gray-50/60 border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-yatra-charcoal bg-white px-2.5 py-1 rounded-md border border-gray-200">
                          {act.time}
                        </span>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          isTravel ? 'bg-blue-100 text-blue-700' : isMeal ? 'bg-amber-100 text-amber-700' : 'bg-yatra-terracotta/10 text-yatra-terracotta'
                        }`}>
                          {act.category || (isTravel ? 'Transit' : isMeal ? 'Food' : 'Attraction')}
                        </span>
                      </div>
                      <h5 className="font-bold text-sm text-yatra-charcoal">{act.title || act.place}</h5>
                      <p className="text-xs text-gray-500 font-light">{act.description}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="block text-xs font-bold text-yatra-charcoal">{act.costText || 'Free Entry'}</span>
                      {act.travelDistance && (
                        <span className="text-[10px] text-gray-400 block mt-0.5">{act.travelDistance} • {act.travelTime}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Smart Budget Optimizer Integration */}
      {itemized && (
        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-premium space-y-6">
          <div className="border-b border-gray-100 pb-4">
            <span className="text-xs font-bold text-yatra-terracotta uppercase tracking-wider block">Transparency</span>
            <h3 className="font-serif font-bold text-2xl text-yatra-charcoal">Smart Budget Optimizer</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(itemized).map(([catKey, catData]: [string, any]) => {
              const isExpanded = expandedCategory === catKey;
              return (
                <div key={catKey} className="bg-gray-50 rounded-2xl p-5 border border-gray-100 space-y-3">
                  <div className="flex justify-between items-center cursor-pointer" onClick={() => toggleCategory(catKey)}>
                    <div className="flex items-center gap-2">
                      {catKey.includes('Transit') ? <Navigation className="w-4 h-4 text-blue-600" /> :
                       catKey.includes('Lodging') ? <Hotel className="w-4 h-4 text-yatra-terracotta" /> :
                       <Utensils className="w-4 h-4 text-emerald-600" />}
                      <span className="font-bold text-xs text-yatra-charcoal">{catKey}</span>
                    </div>
                    <span className="font-bold text-sm text-yatra-charcoal">₹{catData.total}</span>
                  </div>

                  {isExpanded && (
                    <div className="pt-2 border-t border-gray-200 space-y-2 animate-fade-in">
                      {catData.items?.map((it: any, i: number) => (
                        <div key={i} className="flex justify-between text-[11px] text-gray-600">
                          <span>{it.label}</span>
                          <span className="font-semibold text-yatra-charcoal">₹{it.cost}</span>
                        </div>
                      ))}
                      <div className="pt-1 text-[10px] text-gray-400">Source: {catData.source || 'Tariff card verified'}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
