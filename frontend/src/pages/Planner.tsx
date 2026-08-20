import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Calendar, Users, Briefcase, UserCheck, Heart, Sparkles, Check, ChevronRight, ChevronLeft, Navigation, MapPin, AlertCircle } from 'lucide-react';
import { reverseGeocode } from '../services/api.ts';
import { useLanguage } from '../context/LanguageContext.tsx';

const BIHAR_DISTRICTS = [
  "Araria",
  "Arwal",
  "Aurangabad",
  "Banka",
  "Begusarai",
  "Bhagalpur",
  "Bhojpur",
  "Buxar",
  "Darbhanga",
  "East Champaran",
  "Gaya",
  "Gopalganj",
  "Jamui",
  "Jehanabad",
  "Kaimur",
  "Katihar",
  "Khagaria",
  "Kishanganj",
  "Lakhisarai",
  "Madhepura",
  "Madhubani",
  "Munger",
  "Muzaffarpur",
  "Nalanda",
  "Nawada",
  "Patna",
  "Purnia",
  "Rohtas",
  "Saharsa",
  "Samastipur",
  "Saran",
  "Sheikhpura",
  "Sheohar",
  "Sitamarhi",
  "Siwan",
  "Supaul",
  "Vaishali",
  "West Champaran"
];

export default function Planner() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  // Dynamic local date calculation for today (YYYY-MM-DD)
  const getTodayString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Multi-step progress: 1 to 4
  const [step, setStep] = useState(1);
  const [validationError, setValidationError] = useState<string | null>(null);

  // STEP 1 state - Fresh default values
  const [startingLocation, setStartingLocation] = useState('');
  const [startLocationObj, setStartLocationObj] = useState<{
    name: string;
    address: string;
    city: string;
    district: string;
    state: string;
    latitude: number;
    longitude: number;
    accuracy: number;
  } | null>(null);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'requesting' | 'success' | 'denied' | 'unavailable' | 'timeout' | 'error'>('idle');
  const [locatingError, setLocatingError] = useState('');
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState(getTodayString());
  const [endDate, setEndDate] = useState('');
  const [durationText, setDurationText] = useState('Select end date to calculate');
  const [travellers, setTravellers] = useState({ adults: 2, children: 0, seniors: 0 });

  const handleUseCurrentLocation = () => {
    console.log("[LOCATION] Request started");
    setValidationError(null);
    if (!navigator.geolocation) {
      console.warn("[LOCATION] Geolocation API not supported by browser");
      setLocationStatus('unavailable');
      setLocatingError('Geolocation is not supported by your browser.');
      setStartLocationObj(null);
      setStartingLocation(prev => prev.includes('Current Location') ? '' : prev);
      return;
    }

    setLocationStatus('requesting');
    setLocatingError('');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const accuracy = pos.coords.accuracy;
        console.log("[LOCATION] GPS success:", lat, lng, "Accuracy:", accuracy);

        try {
          console.log("[LOCATION] Reverse geocoding coords:", lat, lng);
          const geo = await reverseGeocode(lat, lng);
          console.log("[LOCATION] Reverse geocoding result:", geo);

          const locData = {
            name: geo.name || "Current Location",
            address: geo.address || `${geo.name}, Bihar`,
            city: geo.city || geo.name,
            district: geo.district || "Patna",
            state: "Bihar",
            latitude: lat,
            longitude: lng,
            accuracy: Math.round(accuracy)
          };

          setLocationStatus('success');
          setStartLocationObj(locData);
          setStartingLocation(geo.displayName || `📍 Current Location (${geo.name}, Bihar)`);
          setLocatingError('');
          setValidationError(null);
          console.log("[LOCATION] Final verified location set:", locData);
        } catch (geoErr) {
          console.warn("[LOCATION] Reverse geocode fallback:", geoErr);
          const fallbackData = {
            name: `GPS: ${lat.toFixed(3)}, ${lng.toFixed(3)}`,
            address: `GPS (${lat.toFixed(3)}, ${lng.toFixed(3)})`,
            city: "Patna",
            district: "Patna",
            state: "Bihar",
            latitude: lat,
            longitude: lng,
            accuracy: Math.round(accuracy)
          };
          setLocationStatus('success');
          setStartLocationObj(fallbackData);
          setStartingLocation(`📍 Current Location (${lat.toFixed(3)}, ${lng.toFixed(3)})`);
          setLocatingError('');
          setValidationError(null);
        }
      },
      (err) => {
        console.warn("[LOCATION] GPS error received:", err.code, err.message);
        setStartLocationObj(null);
        
        // CRITICAL: Ensure starting location never pretends to be Current Location
        setStartingLocation(prev => prev.includes('Current Location') ? '' : prev);

        if (err.code === 1) { // PERMISSION_DENIED
          console.log("[LOCATION] Permission denied by user");
          setLocationStatus('denied');
          setLocatingError('Location permission denied. Enter your starting location manually.');
        } else if (err.code === 2) { // POSITION_UNAVAILABLE
          console.log("[LOCATION] Position unavailable");
          setLocationStatus('unavailable');
          setLocatingError('Current location unavailable. Enter your starting location manually.');
        } else if (err.code === 3) { // TIMEOUT
          console.log("[LOCATION] GPS request timed out");
          setLocationStatus('timeout');
          setLocatingError('Location request timed out. Enter your starting location manually.');
        } else {
          setLocationStatus('error');
          setLocatingError('Unable to detect location. Enter your starting location manually.');
        }
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  // STEP 2 state
  const [budget, setBudget] = useState('Standard');
  const [transport, setTransport] = useState('Mixed');
  const [travelStyle, setTravelStyle] = useState('Balanced');

  // STEP 3 state
  const [travellerType, setTravellerType] = useState('Family');

  // STEP 4 state
  const [selectedInterests, setSelectedInterests] = useState<string[]>(['History', 'Culture', 'Food']);
  const [specialRequirements, setSpecialRequirements] = useState<string[]>(['Family friendly']);
  const [accommodation, setAccommodation] = useState('Homestay');
  const [food, setFood] = useState('Local cuisine');
  const [routePreference, setRoutePreference] = useState('Safest');
  const [dailyPace, setDailyPace] = useState('Balanced');
  const [aiPriority, setAiPriority] = useState('Attractions');

  // Validate and ensure Start Date cannot be in the past
  const handleStartDateChange = (val: string) => {
    setValidationError(null);
    const today = getTodayString();
    if (!val || val < today) {
      // Reject past date and restore to today
      setStartDate(today);
      if (endDate && endDate < today) {
        setEndDate('');
      }
    } else {
      setStartDate(val);
      if (endDate && endDate < val) {
        setEndDate('');
      }
    }
  };

  // Validate End Date cannot be before Start Date
  const handleEndDateChange = (val: string) => {
    setValidationError(null);
    const minDate = startDate || getTodayString();
    if (!val) {
      setEndDate('');
    } else if (val < minDate) {
      setEndDate(minDate);
    } else {
      setEndDate(val);
    }
  };

  // Read state from quick planner widget on homepage or error from redirect
  useEffect(() => {
    const today = getTodayString();
    if (location.state) {
      if (location.state.error) {
        setValidationError(location.state.error);
      }
      const { quickStart, quickDuration, quickBudget, quickInterest } = location.state;
      if (quickStart) {
        setStartingLocation(quickStart);
        setStartLocationObj(null);
      }
      if (quickBudget) setBudget(quickBudget);
      if (quickInterest) setSelectedInterests([quickInterest]);
      
      setStartDate(today);
      if (quickDuration) {
        const days = parseInt(quickDuration) || 2;
        const eDate = new Date();
        eDate.setDate(eDate.getDate() + (days - 1));
        const yyyy = eDate.getFullYear();
        const mm = String(eDate.getMonth() + 1).padStart(2, '0');
        const dd = String(eDate.getDate()).padStart(2, '0');
        setEndDate(`${yyyy}-${mm}-${dd}`);
      }
    }
  }, [location]);

  // Recalculate duration text dynamically whenever dates change
  useEffect(() => {
    if (startDate && endDate) {
      const s = new Date(startDate);
      const e = new Date(endDate);
      const diffTime = e.getTime() - s.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      
      if (diffDays >= 1) {
        setDurationText(`${diffDays} ${diffDays === 1 ? 'Day' : 'Days'} (${Math.max(0, diffDays - 1)} Nights)`);
      } else {
        setDurationText('Select valid dates');
      }
    } else if (startDate && !endDate) {
      setDurationText('Select end date to calculate');
    } else {
      setDurationText('Select dates to calculate');
    }
  }, [startDate, endDate]);

  const handleInterestToggle = (interest: string) => {
    setValidationError(null);
    setSelectedInterests(prev => 
      prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]
    );
  };

  const handleRequirementToggle = (req: string) => {
    setSpecialRequirements(prev =>
      prev.includes(req) ? prev.filter(r => r !== req) : [...prev, req]
    );
  };

  // Step-by-Step Validation Handler before Next Step
  const handleNext = () => {
    setValidationError(null);

    if (step === 1) {
      if (!startingLocation || startingLocation.trim() === '' || !destination || destination.trim() === '') {
        setValidationError(t('route.noInputs'));
        return;
      }
      if (!startDate || startDate.trim() === '') {
        setValidationError('Please select a valid starting date.');
        return;
      }
      const today = getTodayString();
      if (startDate < today) {
        setValidationError(`Starting date cannot be earlier than today's date (${today}).`);
        return;
      }
      if (endDate && endDate < startDate) {
        setValidationError('End date cannot be earlier than starting date.');
        return;
      }
      const totalTravellers = (travellers.adults || 0) + (travellers.children || 0) + (travellers.seniors || 0);
      if (totalTravellers < 1) {
        setValidationError('Please add at least 1 adult traveller.');
        return;
      }
    }

    if (step === 2) {
      if (!budget) {
        setValidationError('Please select your budget preference.');
        return;
      }
      if (!transport) {
        setValidationError('Please select your transport preference.');
        return;
      }
    }

    if (step === 3) {
      if (!travellerType) {
        setValidationError('Please select your traveller group persona.');
        return;
      }
    }

    if (step < 4) {
      setStep(s => s + 1);
    }
  };

  // Final Recommendation Guard & Submission
  const handleGenerate = () => {
    setValidationError(null);

    if (!startingLocation || startingLocation.trim() === '') {
      setStep(1);
      setValidationError('Please enter your starting location before generating your journey.');
      return;
    }
    if (!destination || destination.trim() === '') {
      setStep(1);
      setValidationError('Please select your destination before generating your journey.');
      return;
    }
    if (!startDate || startDate.trim() === '') {
      setStep(1);
      setValidationError('Please select a valid starting date.');
      return;
    }
    const today = getTodayString();
    if (startDate < today) {
      setStep(1);
      setValidationError(`Starting date cannot be earlier than today's date (${today}).`);
      return;
    }
    if (!selectedInterests || selectedInterests.length === 0) {
      setValidationError('Please select at least 1 interest (e.g. History, Nature, Food).');
      return;
    }

    const profile = {
      startingLocation: startingLocation.trim(),
      startLocation: startLocationObj,
      userCoordinates: startLocationObj ? { lat: startLocationObj.latitude, lng: startLocationObj.longitude } : null,
      destination: destination.trim(),
      startDate,
      endDate,
      duration: parseInt(durationText) || 2,
      travellers,
      budget,
      transport,
      travelStyle,
      travellerType,
      interests: selectedInterests,
      specialRequirements,
      accommodation,
      food,
      routePreference,
      dailyPace,
      priority: aiPriority
    };
    
    // Navigate to generation processing screen with validated state
    navigate('/generate-loading', { state: { profile } });
  };

  const interestsList = ['History', 'Spirituality', 'Nature', 'Food', 'Culture', 'Adventure', 'Photography', 'Shopping'];
  const requirementsList = ['Wheelchair accessible', 'Senior friendly', 'Child friendly', 'Less walking', 'Family friendly'];

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-serif font-bold text-yatra-charcoal uppercase tracking-wide">Craft Your Journey</h1>
        <p className="text-yatra-slate font-light">Tell us what you seek, and our AI will create your personalized Bihar experience.</p>
      </div>

      {/* Validation Error Alert Banner */}
      {validationError && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl text-xs font-semibold flex items-center gap-2.5 animate-fade-in shadow-sm">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Progress Stepper */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 flex justify-between items-center text-xs font-semibold text-gray-500 shadow-sm">
        <span className="text-yatra-terracotta">Step {step} of 4</span>
        <div className="flex gap-1.5">
          <div className={`h-2.5 w-16 rounded-full ${step >= 1 ? 'bg-yatra-terracotta' : 'bg-gray-200'}`}></div>
          <div className={`h-2.5 w-16 rounded-full ${step >= 2 ? 'bg-yatra-terracotta' : 'bg-gray-200'}`}></div>
          <div className={`h-2.5 w-16 rounded-full ${step >= 3 ? 'bg-yatra-terracotta' : 'bg-gray-200'}`}></div>
          <div className={`h-2.5 w-16 rounded-full ${step >= 4 ? 'bg-yatra-terracotta' : 'bg-gray-200'}`}></div>
        </div>
        <span className="hidden sm:inline text-gray-400">
          {step === 1 && 'Trip & Travellers'}
          {step === 2 && 'Budget & Transport'}
          {step === 3 && 'Traveller Persona'}
          {step === 4 && 'Interests & Preferences'}
        </span>
      </div>

      {/* STEP 1: YOUR TRIP */}
      {step === 1 && (
        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-premium space-y-6">
          <h2 className="text-2xl font-serif font-bold text-yatra-terracotta flex items-center gap-2">
            <Calendar className="w-6 h-6" /> Step 1: Your Trip & Travellers
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-semibold text-gray-700">Starting Location <span className="text-red-500">*</span></label>
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  disabled={locationStatus === 'requesting'}
                  className="text-xs text-yatra-terracotta hover:text-yatra-amber font-semibold flex items-center gap-1 bg-yatra-terracotta/10 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                >
                  <Navigation className="w-3 h-3" />
                  {locationStatus === 'requesting' ? 'Detecting location...' : 'Use current location'}
                </button>
              </div>
              <input 
                type="text"
                placeholder={locationStatus === 'requesting' ? "Detecting current location..." : "e.g. Patna (or detected GPS place)"}
                value={startingLocation}
                onChange={e => {
                  setStartingLocation(e.target.value);
                  setStartLocationObj(null); // Clear GPS object when user manually types
                  setLocationStatus('idle');
                  setLocatingError('');
                  setValidationError(null);
                }}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-yatra-terracotta"
              />
              
              {/* Dynamic Status / Error for Location */}
              {locationStatus === 'requesting' && (
                <p className="text-xs text-blue-600 font-medium mt-1 animate-pulse">
                  Detecting GPS coordinates from your device...
                </p>
              )}
              {locatingError && (
                <p className="text-xs text-amber-700 font-medium mt-1">
                  {locatingError}
                </p>
              )}
              {locationStatus === 'success' && startLocationObj && (
                <p className="text-xs text-green-700 font-semibold mt-1">
                  ✓ Verified: {startLocationObj.name} (±{startLocationObj.accuracy}m)
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Destination <span className="text-red-500">*</span></label>
              <select 
                value={destination}
                onChange={e => {
                  setDestination(e.target.value);
                  setValidationError(null);
                }}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-yatra-terracotta"
              >
                <option value="">Select Destination District...</option>
                {BIHAR_DISTRICTS.map((dist) => (
                  <option key={dist} value={dist}>{dist}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Starting Date <span className="text-red-500">*</span></label>
              <input 
                type="date"
                min={getTodayString()}
                value={startDate}
                onChange={e => handleStartDateChange(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-yatra-terracotta"
              />
              <p className="text-[11px] text-gray-400 mt-1">Earliest selectable date is today</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">End Date (Optional)</label>
              <input 
                type="date"
                min={startDate || getTodayString()}
                value={endDate}
                onChange={e => handleEndDateChange(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-yatra-terracotta"
              />
              <p className="text-[11px] text-yatra-terracotta font-semibold mt-1">{durationText}</p>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <label className="block text-sm font-semibold text-gray-700 mb-4">Travellers Count</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4 rounded-2xl flex items-center justify-between border border-gray-100">
                <div>
                  <span className="block text-xs font-bold text-gray-700">Adults</span>
                  <span className="text-[10px] text-gray-400">12+ years</span>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    type="button"
                    onClick={() => setTravellers(t => ({ ...t, adults: Math.max(1, t.adults - 1) }))}
                    className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center font-bold text-gray-600 hover:bg-gray-100 cursor-pointer"
                  >
                    -
                  </button>
                  <span className="font-bold text-sm text-yatra-charcoal">{travellers.adults}</span>
                  <button 
                    type="button"
                    onClick={() => setTravellers(t => ({ ...t, adults: t.adults + 1 }))}
                    className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center font-bold text-gray-600 hover:bg-gray-100 cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-2xl flex items-center justify-between border border-gray-100">
                <div>
                  <span className="block text-xs font-bold text-gray-700">Children</span>
                  <span className="text-[10px] text-gray-400">2-11 years</span>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    type="button"
                    onClick={() => setTravellers(t => ({ ...t, children: Math.max(0, t.children - 1) }))}
                    className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center font-bold text-gray-600 hover:bg-gray-100 cursor-pointer"
                  >
                    -
                  </button>
                  <span className="font-bold text-sm text-yatra-charcoal">{travellers.children}</span>
                  <button 
                    type="button"
                    onClick={() => setTravellers(t => ({ ...t, children: t.children + 1 }))}
                    className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center font-bold text-gray-600 hover:bg-gray-100 cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-2xl flex items-center justify-between border border-gray-100">
                <div>
                  <span className="block text-xs font-bold text-gray-700">Seniors</span>
                  <span className="text-[10px] text-gray-400">60+ years</span>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    type="button"
                    onClick={() => setTravellers(t => ({ ...t, seniors: Math.max(0, t.seniors - 1) }))}
                    className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center font-bold text-gray-600 hover:bg-gray-100 cursor-pointer"
                  >
                    -
                  </button>
                  <span className="font-bold text-sm text-yatra-charcoal">{travellers.seniors}</span>
                  <button 
                    type="button"
                    onClick={() => setTravellers(t => ({ ...t, seniors: t.seniors + 1 }))}
                    className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center font-bold text-gray-600 hover:bg-gray-100 cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: BUDGET & TRANSPORT */}
      {step === 2 && (
        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-premium space-y-6">
          <h2 className="text-2xl font-serif font-bold text-yatra-terracotta flex items-center gap-2">
            <Briefcase className="w-6 h-6" /> Step 2: Budget & Transport
          </h2>

          <div className="space-y-6">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">Budget Preference</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { title: "Budget", desc: "Economical stays & local transit", tag: "₹1,000 - ₹2,000 / day" },
                  { title: "Standard", desc: "Comfortable hotels & private/shared cabs", tag: "₹2,500 - ₹5,000 / day" },
                  { title: "Luxury", desc: "Premium heritage hotels & dedicated vehicles", tag: "₹6,000+ / day" }
                ].map((b) => (
                  <div 
                    key={b.title}
                    onClick={() => { setBudget(b.title); setValidationError(null); }}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer ${budget === b.title ? 'border-yatra-terracotta bg-yatra-cream/40 shadow-sm' : 'border-gray-100 hover:border-gray-200 bg-gray-50'}`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-sm text-yatra-charcoal">{b.title}</span>
                      {budget === b.title && <Check className="w-4 h-4 text-yatra-terracotta" />}
                    </div>
                    <p className="text-xs text-gray-500 font-light mb-2">{b.desc}</p>
                    <span className="text-[10px] font-bold text-yatra-terracotta">{b.tag}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">Preferred Transit Mode</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {['Cab', 'Bus', 'Train', 'Mixed'].map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => { setTransport(mode); setValidationError(null); }}
                    className={`py-3 px-4 rounded-xl border text-xs font-bold transition-all cursor-pointer ${transport === mode ? 'bg-yatra-charcoal text-white border-yatra-charcoal shadow-sm' : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'}`}
                  >
                    {mode === 'Cab' && '🚗 Private Cab'}
                    {mode === 'Bus' && '🚌 Public Bus'}
                    {mode === 'Train' && '🚆 Indian Railways'}
                    {mode === 'Mixed' && '🔄 Mixed Transit'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">Travel Style</label>
              <div className="grid grid-cols-3 gap-3">
                {['Relaxed', 'Balanced', 'Intensive'].map((style) => (
                  <button
                    key={style}
                    type="button"
                    onClick={() => { setTravelStyle(style); setValidationError(null); }}
                    className={`py-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${travelStyle === style ? 'bg-yatra-terracotta text-white border-yatra-terracotta shadow-sm' : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'}`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: TRAVELLER PERSONA */}
      {step === 3 && (
        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-premium space-y-6">
          <h2 className="text-2xl font-serif font-bold text-yatra-terracotta flex items-center gap-2">
            <UserCheck className="w-6 h-6" /> Step 3: Traveller Persona
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { id: 'Solo', title: 'Solo Explorer', desc: 'Freedom to wander, safety focused' },
              { id: 'Couple', title: 'Couple / Romance', desc: 'Scenic viewpoints & quiet evenings' },
              { id: 'Family', title: 'Family with Kids', desc: 'Comfort, parks, child-friendly food' },
              { id: 'Senior', title: 'Seniors / Pilgrimage', desc: 'Paved paths, easy pacing, shrines' },
              { id: 'Friends', title: 'Friends Group', desc: 'Adventures, road trips & food walks' },
              { id: 'Business', title: 'Business + Leisure', desc: 'Fast connectivity & historic breaks' }
            ].map((p) => (
              <div
                key={p.id}
                onClick={() => { setTravellerType(p.id); setValidationError(null); }}
                className={`p-5 rounded-2xl border transition-all cursor-pointer ${travellerType === p.id ? 'border-yatra-terracotta bg-yatra-cream/40 shadow-sm' : 'border-gray-100 hover:border-gray-200 bg-gray-50'}`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-sm text-yatra-charcoal">{p.title}</span>
                  {travellerType === p.id && <Check className="w-4 h-4 text-yatra-terracotta" />}
                </div>
                <p className="text-xs text-gray-500 font-light">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STEP 4: INTERESTS & PREFERENCES */}
      {step === 4 && (
        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-premium space-y-6">
          <h2 className="text-2xl font-serif font-bold text-yatra-terracotta flex items-center gap-2">
            <Heart className="w-6 h-6" /> Step 4: Interests & Final Touch
          </h2>

          <div className="space-y-6">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">Key Interests <span className="text-red-500">*</span></label>
              <div className="flex flex-wrap gap-2">
                {interestsList.map((interest) => (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => handleInterestToggle(interest)}
                    className={`px-4 py-2.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${selectedInterests.includes(interest) ? 'bg-yatra-terracotta text-white border-yatra-terracotta shadow-sm' : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'}`}
                  >
                    {interest}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">Accessibility & Special Preferences</label>
              <div className="flex flex-wrap gap-2">
                {requirementsList.map((req) => (
                  <button
                    key={req}
                    type="button"
                    onClick={() => handleRequirementToggle(req)}
                    className={`px-4 py-2.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${specialRequirements.includes(req) ? 'bg-yatra-charcoal text-white border-yatra-charcoal shadow-sm' : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'}`}
                  >
                    {req}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Accommodation Preference</label>
                <select
                  value={accommodation}
                  onChange={e => setAccommodation(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-yatra-terracotta"
                >
                  <option value="Homestay">Verified Bihar Homestay</option>
                  <option value="Hotel">Standard / Boutique Hotel</option>
                  <option value="Resort">Eco Resort / Heritage Haveli</option>
                  <option value="Ashram">Spiritual Monastery / Ashram</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Dietary Preference</label>
                <select
                  value={food}
                  onChange={e => setFood(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-yatra-terracotta"
                >
                  <option value="Local cuisine">Authentic Bihari Cuisine (Litti Chokha, Khaja)</option>
                  <option value="Vegetarian">Pure Vegetarian / Satvik</option>
                  <option value="Vegan">Vegan friendly</option>
                  <option value="No restrictions">No dietary restrictions</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center pt-4">
        {step > 1 ? (
          <button
            type="button"
            onClick={() => { setValidationError(null); setStep(s => s - 1); }}
            className="inline-flex items-center gap-1.5 px-6 py-3 rounded-full border border-gray-300 text-gray-700 text-xs font-semibold hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" /> Previous Step
          </button>
        ) : <div></div>}

        {step < 4 ? (
          <button
            type="button"
            onClick={handleNext}
            className="inline-flex items-center gap-1.5 px-8 py-3.5 rounded-full bg-yatra-terracotta text-white text-xs font-semibold hover:bg-yatra-amber transition-colors shadow-md cursor-pointer"
          >
            Next Step <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleGenerate}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-gradient-to-r from-yatra-terracotta to-yatra-amber text-white text-sm font-bold hover:shadow-lg transition-all shadow-md cursor-pointer"
          >
            <Sparkles className="w-4 h-4" /> Generate My AI Journey
          </button>
        )}
      </div>
    </div>
  );
}
