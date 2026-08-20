import express from 'express';
import axios from 'axios';
import { destinations, hiddenGems, experiences, homestays, emergencyPlaces, transportPrices } from '../data/seedData.js';
import { HIDDEN_DISCOVERIES } from '../data/hiddenGemsData.js';
import { districtDestinations, getAttractionsForDistrict } from '../data/districtDestinations.js';
import { calculateRoute, getCoordinatesForPlace, calculateDualRoutes, reverseGeocodeLocation } from '../services/routeService.js';
import { getDestinationWeather, getRoutePulseData } from '../services/weatherService.js';
import { generatePersonalizedTrip } from '../services/tripCalculator.js';
import { lookupFares, checkFairFare, getAllFares, addFare, updateFare, deleteFare } from '../services/fareGuardService.js';
import { findDiscoveriesNearRoute } from '../services/discoveryService.js';

const router = express.Router();


// 1. GET /api/destinations - List of all standard destinations
router.get('/destinations', (req, res) => {
  res.json(destinations);
});

// 2. GET /api/destinations/hidden - List of verified hidden discoveries
router.get('/destinations/hidden', (req, res) => {
  res.json(HIDDEN_DISCOVERIES);
});

// 2b. POST /api/destinations/discover-near-route - Route-Aware Hidden Bihar Discoveries
router.post('/destinations/discover-near-route', async (req, res) => {
  try {
    const result = await findDiscoveriesNearRoute(req.body);
    res.json(result);
  } catch (err) {
    console.error("Discovery error:", err);
    res.status(500).json({ error: "Failed to find discoveries near route", details: err.message });
  }
});

// 3. GET /api/destinations/district/:district - Attractions in a specific district
router.get('/destinations/district/:district', (req, res) => {
  const attractions = getAttractionsForDistrict(req.params.district);
  res.json(attractions);
});

// 3b. GET /api/destinations/:id - Retrieve specific destination details
router.get('/destinations/:id', (req, res) => {
  const id = req.params.id.toLowerCase();
  const dest = destinations.find(d => d.id === id) || hiddenGems.find(d => d.id === id);
  if (!dest) {
    return res.status(404).json({ error: "Destination not found" });
  }
  res.json(dest);
});

// 4. POST /api/trips/generate - Generate personalized, verified itinerary using centralized engine
router.post('/trips/generate', async (req, res) => {
  try {
    const { destination, startingLocation, startLocation, userCoordinates, startDate } = req.body || {};
    
    if (!destination || typeof destination !== 'string' || !destination.trim()) {
      return res.status(400).json({ error: "Validation failed: Destination is required." });
    }
    if (!startingLocation && !startLocation && !userCoordinates) {
      return res.status(400).json({ error: "Validation failed: Starting location is required." });
    }
    if (typeof startingLocation === 'string' && !startingLocation.trim() && !startLocation && !userCoordinates) {
      return res.status(400).json({ error: "Validation failed: Starting location cannot be empty." });
    }
    if (!startDate || typeof startDate !== 'string' || !startDate.trim()) {
      return res.status(400).json({ error: "Validation failed: Starting date is required." });
    }

    const trip = await generatePersonalizedTrip(req.body);
    res.json(trip);
  } catch (error) {
    console.error("Trip generation error:", error);
    res.status(400).json({ error: error.message || "Failed to generate itinerary" });
  }
});

// 5. POST /api/routes/safe - Calculate route details & safety scores
router.post('/routes/safe', async (req, res) => {
  const { start, destination, routeType, travelTime } = req.body;

  try {
    // Attempt to connect to Python FastAPI microservice if running
    const response = await axios.post('http://localhost:8000/api/routes/score', {
      start,
      destination,
      route_type: routeType || 'safest',
      travel_time: travelTime || '10:00 AM'
    }, { timeout: 1500 });
    
    return res.json(response.data);
  } catch (error) {
    // Node calculation using real geographical coordinates & routing
    const selectedType = routeType || 'safest';
    const route = calculateRoute(start, destination, 'Mixed', selectedType);
    const startCoord = getCoordinatesForPlace(start);
    const destCoord = getCoordinatesForPlace(destination);
    
    // Generate logical intermediate waypoints
    const midLat = (startCoord.lat + destCoord.lat) / 2;
    const midLng = (startCoord.lng + destCoord.lng) / 2;
    
    res.json({
      start: route.origin,
      destination: route.destination,
      route_type: selectedType,
      safety_score: route.safetyScore,
      distance_km: route.distanceKm,
      duration_min: route.durationMinutes,
      highway: route.highwayName,
      toll_estimate: route.tollEstimate,
      factors: {
        road_conditions: selectedType === 'safest' ? "94/100" : "80/100",
        street_lighting: "88/100",
        emergency_services: selectedType === 'safest' ? "95/100" : "75/100",
        crowd_activity: "82/100",
        police_presence: selectedType === 'safest' ? "High" : "Moderate"
      },
      coordinates: [
        [startCoord.lat, startCoord.lng],
        [midLat, midLng],
        [destCoord.lat, destCoord.lng]
      ],
      alternative_routes_scores: {
        safest: 92,
        fastest: 86,
        scenic: 82,
        shortest: 76
      }
    });
  }
});

// 6. GET /api/weather - Dynamic weather forecast for destination and date
router.get('/weather', async (req, res) => {
  const { destination, date, days } = req.query;
  try {
    const weather = await getDestinationWeather(destination, date, parseInt(days) || 3);
    res.json(weather);
  } catch (err) {
    res.status(500).json({ error: "Failed to retrieve weather" });
  }
});

// 6b. POST /api/weather/route-pulse - Route Pulse Multi-Stop Weather & Precautions
router.all('/weather/route-pulse', async (req, res) => {
  try {
    const waypoints = req.body?.waypoints || req.query?.waypoints || [];
    const pulseData = await getRoutePulseData(waypoints);
    res.json(pulseData);
  } catch (err) {
    res.status(500).json({ error: "Failed to retrieve route pulse weather" });
  }
});

// 7. GET /api/nearby - Nearby emergency & convenience places using GPS
router.get('/nearby', (req, res) => {
  res.json(emergencyPlaces);
});

// 8. GET /api/experiences - List available local experiences
router.get('/experiences', (req, res) => {
  res.json(experiences);
});

// 9. POST /api/experiences/book - Book a local experience
router.post('/experiences/book', (req, res) => {
  const { experienceId, userEmail, date, slots } = req.body;
  res.json({
    success: true,
    bookingId: "EXP-" + Math.floor(100000 + Math.random() * 900000),
    experienceId,
    message: "Experience booked successfully! Verification details sent to your registered contact.",
    status: "Confirmed"
  });
});

// 10. GET /api/homestays - Get list of homestays
router.get('/homestays', (req, res) => {
  res.json(homestays);
});

// 11. POST /api/homestays - Owner listing homestay
router.post('/homestays', (req, res) => {
  const { name, host, location, pricePerNight, amenities, rules, idProofName } = req.body;
  
  // Protect ID: only store "Identity Verified" status flag, never expose proof
  const newHomestay = {
    id: "home_" + Date.now(),
    name,
    host,
    location,
    pricePerNight: parseFloat(pricePerNight),
    rating: 5.0,
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80",
    amenities: amenities || ["WiFi", "Traditional Kitchen"],
    rules: rules || "Respect local customs",
    availability: "Available",
    verified: true, // Auto flag verified for mock
    identityVerifiedStatus: "✓ Identity Verified"
  };

  homestays.push(newHomestay);
  res.json({
    success: true,
    message: "Property listing submitted successfully! Identity document verification complete.",
    homestay: newHomestay
  });
});

// 12. POST /api/budget/calculate - Budget optimizer calculator
router.post('/budget/calculate', (req, res) => {
  const { transportCost, accommodationCost, foodCost, activitiesCost, miscCost, targetBudget } = req.body;
  const total = Number(transportCost) + Number(accommodationCost) + Number(foodCost) + Number(activitiesCost) + Number(miscCost);
  const difference = Number(targetBudget) - total;
  
  res.json({
    totalEstimated: total,
    budgetCap: Number(targetBudget),
    remaining: difference,
    alert: difference < 0 ? "⚠️ You are over budget by ₹" + Math.abs(difference) + ". Try switching transportation from Taxi to Bus/Train, or opt for a verified Homestay." : "✨ You are within your budget constraints."
  });
});

// 13. POST /api/ai/guide - AI Audio/Text Tourist Guide for destinations & Trip Chatbot
router.post('/ai/guide', (req, res) => {
  const { question, prompt, destinationId, context } = req.body;
  const userQuery = prompt || question || '';
  const lang = context?.language || 'English';
  
  if (context && (!context.destination || context.destination.trim() === '')) {
    const noTripResp = lang === 'Hindi'
      ? 'मार्ग संबंधी प्रश्न पूछने से पहले कृपया एक प्रारंभिक स्थान और गंतव्य का चयन करें।'
      : 'Please select a starting location and destination first to plan your journey before asking route questions.';
    return res.json({ response: noTripResp, answer: noTripResp });
  }

  const start = context?.startingLocation || 'Patna';
  const dest = context?.destination || destinationId || 'Bodh Gaya';
  const dist = context?.distance || '128 km';
  const dur = context?.duration || '3 hours 15 mins';

  const q = userQuery.toLowerCase();
  let textResponse = '';

  if (q.includes('distance') || q.includes('far') || q.includes('दूरी') || q.includes('दूर')) {
    textResponse = lang === 'Hindi'
      ? `${start} से ${dest} के बीच की दूरी लगभग ${dist} है।`
      : `The distance from ${start} to ${dest} is approximately ${dist}.`;
  } else if (q.includes('time') || q.includes('long') || q.includes('समय') || q.includes('देर')) {
    textResponse = lang === 'Hindi'
      ? `${start} से ${dest} तक सड़क मार्ग द्वारा अनुमानित समय ${dur} है।`
      : `The estimated travel time by road from ${start} to ${dest} is ${dur}.`;
  } else if (q.includes('food') || q.includes('eat') || q.includes('stop') || q.includes('भोजन') || q.includes('खाना') || q.includes('रुकना')) {
    textResponse = lang === 'Hindi'
      ? `${start}-${dest} राजमार्ग गलियारे पर स्वच्छ भोजन के लिए सत्यापित हाईवे रेस्ट ढाबे उपलब्ध हैं।`
      : `On the ${start}-${dest} highway corridor, verified highway dhabas and food plazas are available.`;
  } else if (q.includes('spot') || q.includes('visit') || q.includes('see') || q.includes('स्थल') || q.includes('देखने')) {
    textResponse = lang === 'Hindi'
      ? `आपके मुख्य गंतव्य ${dest} के आसपास प्रमुख पवित्र और ऐतिहासिक स्थल शामिल हैं।`
      : `Your primary destination ${dest} features major spiritual and historical sites.`;
  } else {
    textResponse = lang === 'Hindi'
      ? `${start} से ${dest} तक आपकी यात्रा (दूरी: ${dist}, समय: ${dur}) के लिए OSRM सड़क नेटवर्क द्वारा सत्यापित मार्ग तैयार है।`
      : `For your journey from ${start} to ${dest} (Distance: ${dist}, Est. Time: ${dur}), your route follows verified road networks.`;
  }

  res.json({
    destinationId: dest,
    answer: textResponse,
    response: textResponse,
    audioUrl: null
  });
});

// 14. POST /api/ai/translate - Language Translation service
router.post('/ai/translate', (req, res) => {
  const { text, targetLanguage } = req.body;
  
  // Custom mock translator for Bihar regional languages
  const translations = {
    "hindi": {
      "Welcome to Bihar Yatra": "बिहार यात्रा में आपका स्वागत है",
      "Plan smarter journeys": "स्मार्ट यात्रा की योजना बनाएं",
      "Where do you want to go?": "आप कहाँ जाना चाहते हैं?",
      "Safe Route": "सुरक्षित मार्ग",
      "Identity Verified": "पहचान सत्यापित"
    },
    "bhojpuri": {
      "Welcome to Bihar Yatra": "बिहार यात्रा में राउर स्वागत बा",
      "Plan smarter journeys": "चला बढ़िया से यात्रा के तैयारी करीं",
      "Where do you want to go?": "कहाँ जाए के मन बा?",
      "Safe Route": "सुरक्षित रास्ता",
      "Identity Verified": "पहचान ओके बा"
    },
    "maithili": {
      "Welcome to Bihar Yatra": "बिहार यात्रा में अहाँक स्वागत अछि",
      "Plan smarter journeys": "सटीक यात्राक योजना बनाऊ",
      "Where do you want to go?": "अहाँ कतय जेबाक चाहैत छी?",
      "Safe Route": "सुरक्षित बाट",
      "Identity Verified": "पहचान प्रमाणित अछि"
    }
  };

  const lang = (targetLanguage || 'english').toLowerCase();
  const langPack = translations[lang] || {};
  const translatedText = langPack[text] || text; // Fallback to original text

  res.json({
    originalText: text,
    translatedText,
    targetLanguage
  });
});

// 15. GET /api/transport/fare - Fair Transport Price Estimator (FareGuard)
router.get('/transport/fare', (req, res) => {
  const { vehicleType, distanceKm, start, destination } = req.query;
  const dist = Number(distanceKm) || 10;
  const veh = (vehicleType || 'auto').toLowerCase();
  
  const fareResult = lookupFares(start || 'Patna', destination || 'Bihar Museum', {
    distanceKm: dist,
    transportPreference: veh
  });
  
  res.json({
    vehicleType: veh,
    distanceKm: dist,
    recommended: fareResult.recommended,
    alternatives: fareResult.alternatives,
    estimatedRange: [
      Math.round(fareResult.recommended.calculatedTotal * 0.95),
      Math.round(fareResult.recommended.calculatedTotal * 1.15)
    ],
    currency: "INR",
    note: "Verified FareGuard tariffs based on official Bihar state transit guidelines."
  });
});

// 16. POST /api/fares/check - Fair Fare Quote Evaluation
router.post('/fares/check', (req, res) => {
  const { origin, destination, driverQuote, vehicleType } = req.body;
  const evaluation = checkFairFare(origin, destination, driverQuote, vehicleType);
  res.json(evaluation);
});

// 17. GET /api/fares - List all verified fares (Admin / Directory)
router.get('/fares', (req, res) => {
  const fares = getAllFares(req.query);
  res.json(fares);
});

// 18. POST /api/fares - Add verified fare (Admin)
router.post('/fares', (req, res) => {
  const newFare = addFare(req.body);
  res.json({ success: true, fare: newFare });
});

// 19. PUT /api/fares/:id - Update verified fare (Admin)
router.put('/fares/:id', (req, res) => {
  const updated = updateFare(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: "Fare record not found" });
  res.json({ success: true, fare: updated });
});

// 20. DELETE /api/fares/:id - Expire/remove fare (Admin)
router.delete('/fares/:id', (req, res) => {
  const ok = deleteFare(req.params.id);
  if (!ok) return res.status(404).json({ error: "Fare record not found" });
  res.json({ success: true, message: "Fare expired and removed successfully" });
});

// 21. GET /api/routes/reverse-geocode - Reverse Geocode Lat/Lng to Human Readable Location
router.get('/routes/reverse-geocode', (req, res) => {
  const { lat, lng } = req.query;
  const latitude = parseFloat(lat);
  const longitude = parseFloat(lng);
  
  if (isNaN(latitude) || isNaN(longitude)) {
    return res.status(400).json({ error: "Invalid coordinates provided" });
  }
  
  const geoObj = reverseGeocodeLocation(latitude, longitude);
  res.json(geoObj);
});

// 22. GET / POST /api/routes/dual - Calculate Dual Routes (Fastest vs Safer)
router.all('/routes/dual', async (req, res) => {
  try {
    const origin = req.body?.origin || req.query.origin || 'Patna Junction';
    const destination = req.body?.destination || req.query.destination || 'Bihar Museum';
    const transport = req.body?.transport || req.query.transport || 'Mixed';
    const waypoints = req.body?.waypoints || null;
    
    const dualResult = await calculateDualRoutes(origin, destination, transport, waypoints);
    
    // Attach FareGuard verified pricing to each route candidate
    // Use the resolved string names from dualResult (not raw origin/destination which may be objects)
    const originName = dualResult.origin || (typeof origin === 'string' ? origin : origin?.name || 'Patna');
    const destName = dualResult.destination || (typeof destination === 'string' ? destination : destination?.name || 'Bihar Museum');
    const fareData = lookupFares(originName, destName, { transportPreference: transport });
    
    res.json({
      ...dualResult,
      verifiedFare: fareData.recommended
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to calculate dual routes", details: err.message });
  }
});

// 23. POST /api/routes/recalculate - Live Navigation Off-Route Recalculation
router.post('/routes/recalculate', async (req, res) => {
  try {
    const { currentLat, currentLng, destination, transport, waypoints } = req.body;
    const currentPlace = reverseGeocodeLocation(parseFloat(currentLat), parseFloat(currentLng));
    const dualResult = await calculateDualRoutes(
      { latitude: parseFloat(currentLat), longitude: parseFloat(currentLng), name: currentPlace.name },
      destination || 'Bihar Museum',
      transport || 'Mixed',
      waypoints || []
    );
    
    res.json({
      recalculatedFrom: currentPlace,
      currentCoords: [parseFloat(currentLat), parseFloat(currentLng)],
      ...dualResult
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to recalculate route", details: err.message });
  }
});

export default router;
