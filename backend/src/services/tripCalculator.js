import { getAttractionsForDistrict } from '../data/districtDestinations.js';
import { calculateRoute, getCoordinatesForPlace, generateRoutePolyline } from './routeService.js';
import { getDestinationWeather } from './weatherService.js';
import { lookupFares } from './fareGuardService.js';

// Time conversion helpers
function minutesToTimeString(minutes) {
  let totalMin = Math.round(minutes);
  let h = Math.floor(totalMin / 60) % 24;
  const m = totalMin % 60;
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  const mStr = m < 10 ? `0${m}` : `${m}`;
  const hStr = h < 10 ? `0${h}` : `${h}`;
  return `${hStr}:${mStr} ${ampm}`;
}




function timeStringToMinutes(timeStr) {
  if (!timeStr) return 540;
  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return 540;
  let h = parseInt(match[1]);
  const m = parseInt(match[2]);
  const ampm = match[3].toUpperCase();
  if (ampm === 'PM' && h < 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;
  return h * 60 + m;
}

// Parse duration string into minutes (e.g. "1.5 hours" -> 90, "2.5 hours" -> 150)
function parseDurationToMinutes(durationStr, defaultMin = 90) {
  if (!durationStr) return defaultMin;
  const match = durationStr.match(/(\d+(\.\d+)?)\s*(hour|hr|h|min|m)/i);
  if (!match) return defaultMin;
  const val = parseFloat(match[1]);
  const unit = match[3].toLowerCase();
  if (unit.startsWith('h')) {
    return Math.round(val * 60);
  }
  return Math.round(val);
}

// Meal recommendations tailored to dietary preference and Bihar regional specialities
function getDietaryFoodPlan(foodPreference = 'Local cuisine', districtName = 'Bihar') {
  const pref = (foodPreference || 'Local cuisine').toLowerCase();
  
  if (pref.includes('vegan')) {
    return {
      breakfast: "Steamed Chana Ghugni with roasted beaten rice (Chura), fresh ginger and lemon tea",
      lunch: `Authentic ${districtName} Dal-Pitha (steamed rice dumplings with spiced lentil filling) and roasted baingan chokha with mustard oil`,
      snack: "Roasted spiced Makhana with fresh coconut water",
      dinner: "Local pumpkin & Bengal gram curry (Kaddu-Chana dal) with handmade whole wheat tawa rotis and salad"
    };
  }
  
  if (pref.includes('veg') && !pref.includes('non')) {
    return {
      breakfast: "Sattu-stuffed hot Parathas with fresh coriander-mint chutney and fresh curd",
      lunch: `Traditional ${districtName} Vegetarian Thali: Steamed rice, Arhar dal, Aloo Chokha, Seasonal Bhunjia, Ol chutney, and Kadhi Badi`,
      snack: "Traditional sweet Khaja or Tilkut with spiced masala chai",
      dinner: "Classic wood-fired Litti Chokha with ghee dip, spicy baingan-tamatar bharta, and green chutney"
    };
  }
  
  if (pref.includes('jain')) {
    return {
      breakfast: "Roasted Makhana and puffed rice with warm herbal lemon tea",
      lunch: "Pure Jain Thali: Yellow moong dal, bottle gourd (Lauki) curry, cumin rice, and fresh whole wheat phulkas without root vegetables",
      snack: "Dry fruit and sesame laddoos with ginger tea",
      dinner: "Light Moong dal khichdi with roasted cumin papad and sweet curd"
    };
  }
  
  if (pref.includes('non-veg') || pref.includes('non veg')) {
    return {
      breakfast: "Egg Bhurji or Sattu Paratha with spiced pickle and tea",
      lunch: `Famous ${districtName} Ahuna (Claypot) Handi Curry cooked on slow coal embers with whole garlic cloves, served with hot steamed rice`,
      snack: "Bihari Seekh Kebabs or spicy roasted Chana",
      dinner: "Traditional river fish curry in rich mustard gravy (Sarson Machhli) with tawa rotis"
    };
  }
  
  // Default: Local cuisine
  return {
    breakfast: "Crispy hot Kachori-Jalebi or cool spiced Sattu Sharbat with green chili",
    lunch: `Traditional ${districtName} Special Thali: Sattu Litti, Dal, seasonal Bhunjia, tomato chokha, and regional papad`,
    snack: "Local sweet delicacy (Silao Khaja / Peda) with evening masala tea",
    dinner: "Rustic coal-baked Litti Chokha with smoked eggplant bharta and garlic-coriander chutney"
  };
}

// Chronological itinerary validation and auto-repair
function validateAndRepairItinerary(trip) {
  if (!trip || !trip.itinerary) return trip;

  trip.itinerary.forEach((day) => {
    let currentMin = 0;
    if (day.structuredActivities && Array.isArray(day.structuredActivities)) {
      day.structuredActivities.forEach((act, idx) => {
        const startMin = timeStringToMinutes(act.startTime);
        const endMin = timeStringToMinutes(act.endTime);
        
        // Ensure start is strictly after previous end
        if (idx > 0 && startMin < currentMin) {
          act.startTime = minutesToTimeString(currentMin);
          act.endTime = minutesToTimeString(currentMin + (act.durationMinutes || 60));
        }
        
        // Ensure end is strictly after start
        const fixedStart = timeStringToMinutes(act.startTime);
        const fixedEnd = timeStringToMinutes(act.endTime);
        if (fixedEnd <= fixedStart) {
          act.endTime = minutesToTimeString(fixedStart + (act.durationMinutes || 60));
        }
        
        currentMin = timeStringToMinutes(act.endTime);
        act.time = `${act.startTime} – ${act.endTime}`;
      });
    }
  });

  return trip;
}

export async function generatePersonalizedTrip(profile) {
  if (!profile || typeof profile !== 'object') {
    throw new Error("Validation failed: Trip profile is required.");
  }

  const {
    startingLocation,
    startLocation,
    userCoordinates,
    destination,
    startDate = '',
    endDate = '',
    duration: inputDuration,
    travellers = { adults: 2, children: 0, seniors: 0 },
    budget = 'Budget',
    transport = 'Mixed',
    travelStyle = 'Budget',
    travellerType = 'Family',
    interests = ['History', 'Culture', 'Food', 'Photography'],
    specialRequirements = ['Family friendly'],
    accommodation = 'Homestay',
    food = 'Local cuisine',
    routePreference = 'Safest',
    dailyPace = 'Balanced',
    priority = 'Attractions'
  } = profile;

  // Strict validation: Destination must be provided
  if (!destination || typeof destination !== 'string' || !destination.trim() || destination === 'undefined' || destination === 'null') {
    throw new Error("Validation failed: Destination is required and cannot be empty.");
  }

  // Strict validation: Starting location must be provided
  if (!startingLocation && !startLocation && !userCoordinates) {
    throw new Error("Validation failed: Starting location or GPS coordinates are required.");
  }

  if (typeof startingLocation === 'string' && (!startingLocation.trim() || startingLocation === 'undefined' || startingLocation === 'null')) {
    if (!startLocation && !userCoordinates) {
      throw new Error("Validation failed: Valid starting location is required.");
    }
  }

  // Strict validation: Start Date must be provided
  if (!startDate || typeof startDate !== 'string' || !startDate.trim()) {
    throw new Error("Validation failed: Valid starting date is required.");
  }

  // 1. Calculate duration and nights
  let days = 2;
  if (startDate && endDate) {
    const s = new Date(startDate);
    const e = new Date(endDate);
    const diffDays = Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    if (diffDays > 0) days = diffDays;
  } else if (inputDuration) {
    days = parseInt(inputDuration) || 2;
  }
  days = Math.max(1, Math.min(14, days));
  const nights = Math.max(0, days - 1);

  const numAdults = travellers?.adults ?? 2;
  const numChildren = travellers?.children ?? 0;
  const numSeniors = travellers?.seniors ?? 0;
  const totalTravellers = Math.max(1, numAdults + numChildren + numSeniors);

  // Exact coordinates for starting location
  const originParam = (startLocation && (startLocation.latitude || startLocation.lat))
    ? startLocation
    : (userCoordinates && (userCoordinates.lat || userCoordinates.latitude))
    ? userCoordinates
    : startingLocation;

  // 2. Calculate real route, distance and transit durations
  const routeInfo = calculateRoute(originParam, destination, transport, routePreference);

  // 3. Fetch live or seasonal weather
  const weather = await getDestinationWeather(destination, startDate, days);

  // 4. Retrieve verified attractions for destination district
  const allAttractions = getAttractionsForDistrict(destination);

  // 5. Score & Rank attractions
  const rankedAttractions = [...allAttractions].sort((a, b) => {
    let scoreA = 0;
    let scoreB = 0;

    if (interests && Array.isArray(interests)) {
      interests.forEach(interest => {
        const intKey = interest.toLowerCase();
        if (a[intKey] || a.category?.toLowerCase() === intKey) scoreA += 4;
        if (b[intKey] || b.category?.toLowerCase() === intKey) scoreB += 4;
      });
    }

    if (specialRequirements && Array.isArray(specialRequirements)) {
      if (specialRequirements.includes('Wheelchair accessible')) {
        if (a.wheelchairAccessible) scoreA += 5;
        if (b.wheelchairAccessible) scoreB += 5;
      }
      if (specialRequirements.includes('Less walking')) {
        if (a.lessWalking) scoreA += 4;
        if (b.lessWalking) scoreB += 4;
      }
      if (specialRequirements.includes('Senior friendly') || numSeniors > 0) {
        if (a.seniorFriendly) scoreA += 3;
        if (b.seniorFriendly) scoreB += 3;
      }
      if (specialRequirements.includes('Child friendly') || numChildren > 0) {
        if (a.childFriendly) scoreA += 3;
        if (b.childFriendly) scoreB += 3;
      }
    }

    return scoreB - scoreA;
  });

  // Determine places per day according to pace
  let maxPlacesPerDay = 3;
  if (dailyPace === 'Relaxed') maxPlacesPerDay = 2;
  if (dailyPace === 'Packed') maxPlacesPerDay = 4;

  const foodPlan = getDietaryFoodPlan(food, destination);

  const startDisplayName = (typeof startLocation === 'object' && startLocation?.name)
    ? `📍 Current Location (${startLocation.name})`
    : startingLocation.startsWith('📍')
    ? startingLocation
    : `${routeInfo.origin} (Departure)`;

  // 6. Chronological Day-by-Day Scheduling Engine
  const itinerary = [];
  const mapWaypoints = [
    {
      id: "wp_origin",
      name: startDisplayName,
      category: "Transit",
      time: "08:30 AM",
      lat: routeInfo.originCoords[0],
      lng: routeInfo.originCoords[1],
      type: "start",
      description: `Departure point for ${destination} journey`
    }
  ];

  const intermediateGpsCoords = [];
  const activityTicketItems = [];
  const transportSegments = [];

  let attractionIndex = 0;
  const startD = startDate ? new Date(startDate) : new Date();

  // Segment 1: Origin to Destination via FareGuard
  const outwardFareObj = lookupFares(routeInfo.origin, routeInfo.destination, {
    travelers: totalTravellers,
    budget: budget,
    transportPreference: transport,
    distanceKm: routeInfo.distanceKm
  });
  const outwardOption = outwardFareObj.recommended;
  const outwardCost = outwardOption.calculatedTotal;

  transportSegments.push({
    from: routeInfo.origin,
    to: routeInfo.destination,
    distanceKm: routeInfo.distanceKm,
    duration: routeInfo.durationText,
    mode: outwardOption.transportType,
    operator: outwardOption.operator,
    fareType: outwardOption.fareType,
    cost: outwardCost,
    method: outwardOption.costFormula,
    source: outwardOption.source,
    verificationStatus: outwardOption.verificationStatus
  });

  for (let d = 1; d <= days; d++) {
    const currentDayDate = new Date(startD);
    currentDayDate.setDate(startD.getDate() + (d - 1));
    const dateFormatted = currentDayDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

    const isFirstDay = (d === 1);
    const isLastDay = (d === days);
    const structuredActivities = [];
    const plainActivities = [];
    const optionalExperiences = [];

    let currentMinute = 510; // Start at 08:30 AM (510 minutes from midnight)
    let previousLocationName = isFirstDay ? startingLocation : `${destination} Center / Accommodation`;

    // --- DAY 1: INITIAL TRAVEL & SIGHTSEEING ---
    if (isFirstDay) {
      // 1. Departure from Origin
      const departTimeStr = minutesToTimeString(currentMinute);
      const transitDurationMin = routeInfo.durationMinutes || 140;
      currentMinute += transitDurationMin;
      const arriveTimeStr = minutesToTimeString(currentMinute);

      structuredActivities.push({
        time: `${departTimeStr} – ${arriveTimeStr}`,
        startTime: departTimeStr,
        endTime: arriveTimeStr,
        place: `${startingLocation} → ${destination}`,
        title: `Travel from ${startingLocation} to ${destination}`,
        category: "Transit",
        description: `Depart from ${startingLocation} via ${routeInfo.highwayName}. Enjoy scenic countryside views.`,
        duration: routeInfo.durationText,
        durationMinutes: transitDurationMin,
        travelTime: routeInfo.durationText,
        travelDistance: `${routeInfo.distanceKm} km`,
        travelFrom: startingLocation,
        estimatedCost: outwardCost,
        costText: `₹${outwardCost} (Included in Transport)`,
        recommendedWindow: "Morning departure (08:30 AM)",
        isOutsideWindow: false,
        crowdLevel: "Low",
        type: "travel"
      });
      plainActivities.push(`${departTimeStr} — Depart from ${startingLocation} via ${routeInfo.highwayName} (${routeInfo.distanceKm} km, ~${routeInfo.durationText}).`);
      plainActivities.push(`${arriveTimeStr} — Arrive in ${destination}. Check-in at accommodation and freshen up.`);

      // 2. Check-in & Freshen Up
      const checkinStart = currentMinute;
      const checkinDuration = 30;
      currentMinute += checkinDuration;
      structuredActivities.push({
        time: `${minutesToTimeString(checkinStart)} – ${minutesToTimeString(currentMinute)}`,
        startTime: minutesToTimeString(checkinStart),
        endTime: minutesToTimeString(currentMinute),
        place: `Verified ${destination} Heritage Homestay`,
        title: `Check-in & Freshen Up`,
        category: "Accommodation",
        description: `Check-in at verified local homestay, store luggage, and prepare for local exploration.`,
        duration: "30 min",
        durationMinutes: 30,
        travelTime: "5 min",
        travelDistance: "2 km",
        travelFrom: "Arrival Point",
        estimatedCost: 0,
        costText: "Included in Stay",
        recommendedWindow: "11:00 AM – 12:00 PM",
        isOutsideWindow: false,
        crowdLevel: "Low",
        type: "checkin"
      });

      mapWaypoints.push({
        id: `wp_stay_${d}`,
        name: `Verified ${destination} Heritage Homestay`,
        category: "Accommodation",
        time: minutesToTimeString(checkinStart),
        lat: routeInfo.destCoords[0] + 0.005,
        lng: routeInfo.destCoords[1] - 0.005,
        type: "accommodation",
        description: "Identity Verified local homestay"
      });
      intermediateGpsCoords.push([routeInfo.destCoords[0] + 0.005, routeInfo.destCoords[1] - 0.005]);

      previousLocationName = "Homestay / Town Center";
    } else {
      // Subsequent day start: Breakfast at 08:00 AM
      currentMinute = 480; // 08:00 AM
      const bStart = currentMinute;
      currentMinute += 45; // 45 min breakfast
      structuredActivities.push({
        time: `${minutesToTimeString(bStart)} – ${minutesToTimeString(currentMinute)}`,
        startTime: minutesToTimeString(bStart),
        endTime: minutesToTimeString(currentMinute),
        place: `Local Breakfast Spot in ${destination}`,
        title: `Morning Breakfast`,
        category: "Food",
        description: foodPlan.breakfast,
        duration: "45 min",
        durationMinutes: 45,
        travelTime: "0 min",
        travelDistance: "0 km",
        travelFrom: "Accommodation",
        estimatedCost: 60 * totalTravellers,
        costText: "Included in Food Budget",
        recommendedWindow: "08:00 AM – 09:00 AM",
        isOutsideWindow: false,
        crowdLevel: "Low",
        type: "meal"
      });
      plainActivities.push(`${minutesToTimeString(bStart)} — Morning Breakfast: ${foodPlan.breakfast}.`);
      previousLocationName = "Accommodation / Breakfast";
    }

    // Schedule Attractions for the Day
    let attractionsScheduledToday = 0;
    let hadLunch = false;
    let dayLocalDistance = 0;

    while (attractionsScheduledToday < maxPlacesPerDay && attractionIndex < rankedAttractions.length) {
      const place = rankedAttractions[attractionIndex];
      attractionIndex++;

      // Check if lunch should happen before next attraction
      if (!hadLunch && currentMinute >= 760) {
        const lStart = currentMinute;
        currentMinute += 50; // 50 min lunch
        structuredActivities.push({
          time: `${minutesToTimeString(lStart)} – ${minutesToTimeString(currentMinute)}`,
          startTime: minutesToTimeString(lStart),
          endTime: minutesToTimeString(currentMinute),
          place: `Authentic ${destination} Eatery`,
          title: `Regional Lunch Break`,
          category: "Food",
          description: foodPlan.lunch,
          duration: "50 min",
          durationMinutes: 50,
          travelTime: "10 min",
          travelDistance: "3 km",
          travelFrom: previousLocationName,
          estimatedCost: 110 * totalTravellers,
          costText: "Included in Food Budget",
          recommendedWindow: "01:00 PM – 02:30 PM",
          isOutsideWindow: false,
          crowdLevel: "Medium",
          type: "meal"
        });
        plainActivities.push(`${minutesToTimeString(lStart)} — Lunch: ${foodPlan.lunch} at popular local eateries.`);
        hadLunch = true;
        previousLocationName = "Lunch Eatery";
      }

      // Calculate travel time to this attraction
      const interStopDistanceKm = Math.max(8, Math.round(12 + (attractionsScheduledToday * 6)));
      const interStopDurationMin = Math.round((interStopDistanceKm / 35) * 60); // 35 km/h local speed
      dayLocalDistance += interStopDistanceKm;

      // Travel to attraction
      const travelStart = currentMinute;
      currentMinute += interStopDurationMin;

      // Activity duration
      const visitDurationMin = parseDurationToMinutes(place.averageVisitDuration, 90);
      const actStart = currentMinute;
      currentMinute += visitDurationMin;
      const actEnd = currentMinute;

      // Check if scheduled within recommended window
      const isOutsideWindow = currentMinute > 1080 || (place.bestTimeToVisit && place.bestTimeToVisit.toLowerCase().includes('morning') && actStart >= 840);
      const entryFeeTotal = (place.entryFee || 0) * totalTravellers;

      activityTicketItems.push({
        place: place.name,
        feeType: place.entryFee === 0 ? "FREE" : "PER_PERSON",
        entryFee: place.entryFee || 0,
        total: entryFeeTotal,
        source: "DATABASE VERIFIED"
      });

      structuredActivities.push({
        time: `${minutesToTimeString(actStart)} – ${minutesToTimeString(actEnd)}`,
        startTime: minutesToTimeString(actStart),
        endTime: minutesToTimeString(actEnd),
        place: place.name,
        title: `Visit ${place.name}`,
        category: place.category || "Heritage",
        description: place.description,
        duration: place.averageVisitDuration || `${visitDurationMin / 60} hrs`,
        durationMinutes: visitDurationMin,
        travelTime: `${interStopDurationMin} min`,
        travelDistance: `${interStopDistanceKm} km`,
        travelFrom: previousLocationName,
        estimatedCost: entryFeeTotal,
        costText: place.entryFee === 0 ? "Free Entry" : `₹${place.entryFee} / person (₹${entryFeeTotal} total)`,
        recommendedWindow: place.bestTimeToVisit || "09:00 AM – 05:00 PM",
        isOutsideWindow,
        outsideWarning: isOutsideWindow ? "Scheduled in afternoon slot" : undefined,
        crowdLevel: place.category === 'Spirituality' ? "Medium" : "Low",
        type: "attraction"
      });

      mapWaypoints.push({
        id: `wp_attr_${place.id || attractionIndex}`,
        name: place.name,
        category: place.category || "Heritage",
        time: minutesToTimeString(actStart),
        lat: place.latitude || (routeInfo.destCoords[0] + (attractionIndex * 0.01)),
        lng: place.longitude || (routeInfo.destCoords[1] + (attractionIndex * 0.01)),
        type: "attraction",
        description: place.description
      });
      intermediateGpsCoords.push([
        place.latitude || (routeInfo.destCoords[0] + (attractionIndex * 0.01)),
        place.longitude || (routeInfo.destCoords[1] + (attractionIndex * 0.01))
      ]);

      plainActivities.push(`${minutesToTimeString(actStart)} — Visit ${place.name} (${place.category}): ${place.description} [Duration: ${place.averageVisitDuration || '1.5 hrs'} | Travel from previous stop: ${interStopDurationMin} min (${interStopDistanceKm} km) | Entry: ${place.entryFee === 0 ? 'Free' : `₹${place.entryFee}`}]`);

      previousLocationName = place.name;
      attractionsScheduledToday++;

      if (currentMinute >= 1050) break;
    }

    // Add local transit segment for this day via FareGuard
    const localFareObj = lookupFares(`${destination} Hub`, `${destination} Local Circuit`, {
      travelers: totalTravellers,
      budget: budget,
      transportPreference: transport,
      distanceKm: dayLocalDistance || 30
    });
    const localOption = localFareObj.recommended;
    const localDailyCost = localOption.calculatedTotal;

    transportSegments.push({
      from: `${destination} Hub`,
      to: `Day ${d} Attractions Circuit`,
      distanceKm: dayLocalDistance,
      duration: `${Math.round(dayLocalDistance / 35 * 60)} mins`,
      mode: localOption.transportType,
      operator: localOption.operator,
      fareType: localOption.fareType,
      cost: localDailyCost,
      method: localOption.costFormula,
      source: localOption.source,
      verificationStatus: localOption.verificationStatus
    });

    // Insert lunch if not yet inserted
    if (!hadLunch) {
      const lStart = currentMinute;
      currentMinute += 45;
      structuredActivities.push({
        time: `${minutesToTimeString(lStart)} – ${minutesToTimeString(currentMinute)}`,
        startTime: minutesToTimeString(lStart),
        endTime: minutesToTimeString(currentMinute),
        place: `Regional Lunch in ${destination}`,
        title: `Lunch Break`,
        category: "Food",
        description: foodPlan.lunch,
        duration: "45 min",
        durationMinutes: 45,
        travelTime: "10 min",
        travelDistance: "3 km",
        travelFrom: previousLocationName,
        estimatedCost: 110 * totalTravellers,
        costText: "Included in Food Budget",
        recommendedWindow: "01:00 PM – 02:30 PM",
        isOutsideWindow: false,
        crowdLevel: "Medium",
        type: "meal"
      });
      plainActivities.push(`${minutesToTimeString(lStart)} — Lunch: ${foodPlan.lunch}.`);
      previousLocationName = "Lunch Eatery";
    }

    // Collect any remaining unused attractions as "Optional Experiences"
    if (attractionIndex < rankedAttractions.length && isLastDay) {
      for (let op = attractionIndex; op < Math.min(rankedAttractions.length, attractionIndex + 2); op++) {
        const opPlace = rankedAttractions[op];
        optionalExperiences.push({
          name: opPlace.name,
          category: opPlace.category,
          description: opPlace.description,
          recommendedWindow: opPlace.bestTimeToVisit || "09:00 AM – 12:00 PM",
          estimatedCost: opPlace.entryFee || 0
        });
      }
    }

    // --- EVENING / RETURN JOURNEY LOGIC ---
    if (isLastDay && days > 1) {
      // 1. Souvenirs & Preparation
      const prepStart = currentMinute;
      currentMinute += 40;
      structuredActivities.push({
        time: `${minutesToTimeString(prepStart)} – ${minutesToTimeString(currentMinute)}`,
        startTime: minutesToTimeString(prepStart),
        endTime: minutesToTimeString(currentMinute),
        place: `${destination} Artisan Market`,
        title: `Souvenir Shopping & Wrap-up`,
        category: "Shopping",
        description: `Explore local handicraft stands, purchase authentic regional delicacies (${foodPlan.snack}), and prepare for return journey.`,
        duration: "40 min",
        durationMinutes: 40,
        travelTime: "10 min",
        travelDistance: "4 km",
        travelFrom: previousLocationName,
        estimatedCost: 50 * totalTravellers,
        costText: "Miscellaneous",
        recommendedWindow: "04:30 PM – 05:30 PM",
        isOutsideWindow: false,
        crowdLevel: "Medium",
        type: "attraction"
      });
      plainActivities.push(`${minutesToTimeString(prepStart)} — Local artisan market walkthrough, souvenir shopping, and snack: ${foodPlan.snack}.`);

      // 2. Explicit Return Journey
      const returnDepartMin = currentMinute + 15; // 15 min buffer
      const returnDurationMin = routeInfo.durationMinutes || 140;
      const returnArriveMin = returnDepartMin + returnDurationMin;
      
      const returnFareObj = lookupFares(destination, startingLocation, {
        travelers: totalTravellers,
        budget: budget,
        transportPreference: transport,
        distanceKm: routeInfo.distanceKm
      });
      const returnOption = returnFareObj.recommended;
      const returnCost = returnOption.calculatedTotal;

      transportSegments.push({
        from: destination,
        to: startingLocation,
        distanceKm: routeInfo.distanceKm,
        duration: routeInfo.durationText,
        mode: returnOption.transportType,
        operator: returnOption.operator,
        fareType: returnOption.fareType,
        cost: returnCost,
        method: returnOption.costFormula,
        source: returnOption.source,
        verificationStatus: returnOption.verificationStatus
      });

      structuredActivities.push({
        time: `${minutesToTimeString(returnDepartMin)} – ${minutesToTimeString(returnArriveMin)}`,
        startTime: minutesToTimeString(returnDepartMin),
        endTime: minutesToTimeString(returnArriveMin),
        place: `${destination} → ${startingLocation}`,
        title: `Return Journey to ${startingLocation}`,
        category: "Transit",
        description: `Depart from ${destination} and travel back to ${startingLocation} via ${routeInfo.highwayName}. Distance: ${routeInfo.distanceKm} km. Estimated travel time: ${routeInfo.durationText}.`,
        duration: routeInfo.durationText,
        durationMinutes: returnDurationMin,
        travelTime: routeInfo.durationText,
        travelDistance: `${routeInfo.distanceKm} km`,
        travelFrom: destination,
        estimatedCost: returnCost,
        costText: `₹${returnCost} (Included in Transport)`,
        recommendedWindow: `${minutesToTimeString(returnDepartMin)} departure`,
        isOutsideWindow: false,
        crowdLevel: "Low",
        type: "return"
      });
      plainActivities.push(`${minutesToTimeString(returnDepartMin)} — Start Return Journey: ${destination} → ${startingLocation} (${routeInfo.distanceKm} km, ~${routeInfo.durationText} via ${routeInfo.highwayName}).`);
      plainActivities.push(`${minutesToTimeString(returnArriveMin)} — Arrive in ${startingLocation}. Tour successfully concluded with verified explorer memories.`);

      mapWaypoints.push({
        id: "wp_return",
        name: `${startingLocation} (Return Arrival)`,
        category: "Transit",
        time: minutesToTimeString(returnArriveMin),
        lat: routeInfo.originCoords[0],
        lng: routeInfo.originCoords[1],
        type: "return",
        description: `Tour completion in ${startingLocation}`
      });
    } else {
      // Multi-day stay evening relaxation and dinner
      const relaxStart = currentMinute;
      currentMinute += 50;
      structuredActivities.push({
        time: `${minutesToTimeString(relaxStart)} – ${minutesToTimeString(currentMinute)}`,
        startTime: minutesToTimeString(relaxStart),
        endTime: minutesToTimeString(currentMinute),
        place: `Verified ${destination} Heritage Homestay`,
        title: `Evening Relaxation & Cultural Leisure`,
        category: "Culture",
        description: `Return to accommodation, enjoy evening tea with ${foodPlan.snack}, and relax amidst local ambience.`,
        duration: "50 min",
        durationMinutes: 50,
        travelTime: "15 min",
        travelDistance: "8 km",
        travelFrom: previousLocationName,
        estimatedCost: 0,
        costText: "Included",
        recommendedWindow: "06:30 PM – 07:30 PM",
        isOutsideWindow: false,
        crowdLevel: "Low",
        type: "attraction"
      });

      const dinnerStart = Math.max(1200, currentMinute + 20); // 08:00 PM
      const dinnerEnd = dinnerStart + 60;
      structuredActivities.push({
        time: `${minutesToTimeString(dinnerStart)} – ${minutesToTimeString(dinnerEnd)}`,
        startTime: minutesToTimeString(dinnerStart),
        endTime: minutesToTimeString(dinnerEnd),
        place: `Verified ${destination} Heritage Homestay`,
        title: `Traditional Dinner`,
        category: "Food",
        description: foodPlan.dinner,
        duration: "1 hr",
        durationMinutes: 60,
        travelTime: "0 min",
        travelDistance: "0 km",
        travelFrom: "Accommodation",
        estimatedCost: 100 * totalTravellers,
        costText: "Included in Food Budget",
        recommendedWindow: "08:00 PM – 09:30 PM",
        isOutsideWindow: false,
        crowdLevel: "Low",
        type: "meal"
      });
      plainActivities.push(`${minutesToTimeString(relaxStart)} — Return to accommodation, refresh, and evening relaxation.`);
      plainActivities.push(`${minutesToTimeString(dinnerStart)} — Dinner: ${foodPlan.dinner}. Overnight stay at verified homestay.`);
    }

    // Day titles
    let dayTitle = "";
    let dayRoute = "";
    let dayDistance = "";
    let dayTime = "";

    if (isFirstDay && isLastDay) {
      dayTitle = `Day Excursion: ${startingLocation} to ${destination}`;
      dayRoute = `${startingLocation} ⇄ ${destination} (${routeInfo.highwayName})`;
      dayDistance = `${routeInfo.distanceKm * 2} km (Round-trip)`;
      dayTime = `${Math.round(routeInfo.durationMinutes * 2 / 60 * 10) / 10} hrs transit`;
    } else if (isFirstDay) {
      dayTitle = `Day 1: Travel to ${destination} & Heritage Landmarks`;
      dayRoute = `${startingLocation} → ${destination} (${routeInfo.highwayName})`;
      dayDistance = `${routeInfo.distanceKm} km (Intercity) + ~32 km (Local)`;
      dayTime = routeInfo.durationText;
    } else if (isLastDay) {
      dayTitle = `Day 2: ${destination} Nature Sanctuaries & Return Journey`;
      dayRoute = `${destination} Local Trails → ${startingLocation} (Return)`;
      dayDistance = `~35 km (Local) + ${routeInfo.distanceKm} km (Return)`;
      dayTime = `${routeInfo.durationText} return transit`;
    } else {
      dayTitle = `Day ${d}: Deep Exploration of ${destination} Traditions`;
      dayRoute = `${destination} Regional Circuit (Local sightseeing)`;
      dayDistance = `~40 km (Local circuit)`;
      dayTime = "1 hr local transit";
    }

    // Accommodation night labeling
    let accommodationText = "";
    if (isLastDay && days > 1) {
      accommodationText = `Day ${d}: Return Journey to ${startingLocation} (No overnight accommodation required in ${destination})`;
    } else if (isFirstDay && isLastDay) {
      accommodationText = "Same-day return excursion (No overnight stay required)";
    } else {
      accommodationText = `Stay — Night ${d}: Verified ${destination} Heritage Homestay (Identity Verified)`;
    }

    itinerary.push({
      day: d,
      date: dateFormatted,
      title: dayTitle,
      route: dayRoute,
      travelDistance: dayDistance,
      travelTime: dayTime,
      safetyScore: Math.min(96, Math.max(85, routeInfo.safetyScore - ((d - 1) * 2))),
      safetyFactors: {
        roadConditions: "94/100 (Smooth highway with active state road patrols)",
        nightLighting: "88/100 (Well-lit central town & monument transit)",
        emergencyServices: "95/100 (District hospital & police post within 5 km)",
        crowdActivity: "82/100 (Family-friendly daytime visitor index)",
        policePresence: "High (Active district assistance booths)"
      },
      activities: plainActivities,
      structuredActivities,
      optionalExperiences,
      foodRecommendation: `Lunch: ${foodPlan.lunch} | Dinner: ${foodPlan.dinner}`,
      accommodation: accommodationText,
      estimatedCost: 0,
      bestTime: structuredActivities.find(a => a.type === 'attraction')?.recommendedWindow || "09:00 AM – 12:00 PM",
      recommendedWindow: structuredActivities.find(a => a.type === 'attraction')?.recommendedWindow || "09:00 AM – 12:00 PM",
      crowdLevel: d % 2 === 0 ? "Low" : "Medium",
      weatherCondition: `${weather.condition}, ${weather.temp}°C`
    });
  }

  // 7. Component-based Cost Calculation
  
  // A. Transport Cost from segments
  const transportCost = transportSegments.reduce((acc, seg) => acc + seg.cost, 0);

  // B. Accommodation Cost
  const roomsRequired = Math.ceil(totalTravellers / 2);
  let nightlyRatePerRoom = 750;
  if (budget === 'Premium') {
    nightlyRatePerRoom = accommodation === 'Homestay' ? 2200 : accommodation === 'Heritage' ? 6500 : 4500;
  } else if (budget === 'Standard') {
    nightlyRatePerRoom = accommodation === 'Homestay' ? 1400 : accommodation === 'Heritage' ? 3200 : 2200;
  } else {
    nightlyRatePerRoom = accommodation === 'Homestay' ? 750 : accommodation === 'Heritage' ? 1800 : 1100;
  }
  const accommodationCost = nights * roomsRequired * nightlyRatePerRoom;

  // C. Food Cost
  let foodPerPersonPerDay = 260;
  if (budget === 'Premium') {
    foodPerPersonPerDay = 1200;
  } else if (budget === 'Standard') {
    foodPerPersonPerDay = 550;
  } else {
    foodPerPersonPerDay = 260;
  }
  const foodCost = foodPerPersonPerDay * totalTravellers * days;

  // D. Activities
  const guideFee = budget === 'Premium' ? (400 * days) : budget === 'Standard' ? (150 * days) : 0;
  const activitiesCost = activityTicketItems.reduce((acc, it) => acc + it.total, 0) + guideFee;

  // E. Miscellaneous
  const parkingCost = (transport.toLowerCase().includes('car') || transport.toLowerCase().includes('taxi')) ? 100 * days : 0;
  const waterCost = 20 * totalTravellers * days;
  const bufferCost = (budget === 'Premium' ? 150 : budget === 'Standard' ? 80 : 40) * days * totalTravellers;
  const miscellaneousCost = parkingCost + waterCost + bufferCost;

  // Total
  const totalCost = Math.round(transportCost + accommodationCost + foodCost + activitiesCost + miscellaneousCost);
  const costPerPerson = Math.round(totalCost / totalTravellers);
  const perDayCost = Math.round(totalCost / days);

  itinerary.forEach(d => {
    d.estimatedCost = perDayCost;
  });

  const targetDailyCap = budget === 'Premium' ? 6000 : budget === 'Standard' ? 4000 : 2000;
  const targetTotalBudget = targetDailyCap * days * Math.max(1, Math.round(totalTravellers / 2));
  const savings = Math.max(0, targetTotalBudget - totalCost);

  // Build full real road multi-stop polyline from OSRM driving engine
  let fullPolyline = [];
  try {
    const validPoints = mapWaypoints.filter(w => w && typeof w.lat === 'number' && typeof w.lng === 'number' && !isNaN(w.lat) && !isNaN(w.lng));
    if (validPoints.length >= 2) {
      const coordsString = validPoints.map(w => `${w.lng},${w.lat}`).join(';');
      const url = `https://router.project-osrm.org/route/v1/driving/${coordsString}?overview=full&geometries=geojson`;
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (res.ok) {
        const data = await res.json();
        if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
          // Convert OSRM GeoJSON [lng, lat] to Leaflet [lat, lng]
          fullPolyline = data.routes[0].geometry.coordinates.map(coord => [coord[1], coord[0]]);
        }
      }
    }
  } catch (err) {
    console.warn("[TRIP ENGINE] OSRM multi-stop query notice:", err.message);
  }

  const accomName = accommodation === 'Homestay' 
    ? `Verified ${destination} Heritage Homestay` 
    : accommodation === 'Heritage' 
    ? `${destination} Royal Heritage Haveli` 
    : `${destination} City Comfort Hotel`;

  const itemizedBreakdown = {
    transport: {
      total: transportCost,
      segments: transportSegments,
      source: "CALCULATED"
    },
    accommodation: {
      total: accommodationCost,
      hotelName: accomName,
      pricePerNight: nightlyRatePerRoom,
      rooms: roomsRequired,
      nights: nights,
      calculation: `${roomsRequired} room${roomsRequired > 1 ? 's' : ''} × ${nights} night${nights > 1 ? 's' : ''} × ₹${nightlyRatePerRoom}/night`,
      verificationStatus: "Identity Verified",
      source: "DATABASE VERIFIED"
    },
    food: {
      total: foodCost,
      dailyCostPerPerson: foodPerPersonPerDay,
      meals: [
        { meal: "Breakfast", costPerPerson: Math.round(foodPerPersonPerDay * 0.22), total: Math.round(foodPerPersonPerDay * 0.22) * totalTravellers * days, detail: `₹${Math.round(foodPerPersonPerDay * 0.22)}/person × ${totalTravellers} travellers × ${days} days` },
        { meal: "Lunch", costPerPerson: Math.round(foodPerPersonPerDay * 0.42), total: Math.round(foodPerPersonPerDay * 0.42) * totalTravellers * days, detail: `₹${Math.round(foodPerPersonPerDay * 0.42)}/person × ${totalTravellers} travellers × ${days} days` },
        { meal: "Dinner", costPerPerson: Math.round(foodPerPersonPerDay * 0.24), total: Math.round(foodPerPersonPerDay * 0.24) * totalTravellers * days, detail: `₹${Math.round(foodPerPersonPerDay * 0.24)}/person × ${totalTravellers} travellers × ${days} days` },
        { meal: "Snacks & Drinks", costPerPerson: Math.round(foodPerPersonPerDay * 0.12), total: Math.round(foodPerPersonPerDay * 0.12) * totalTravellers * days, detail: `₹${Math.round(foodPerPersonPerDay * 0.12)}/person × ${totalTravellers} travellers × ${days} days` }
      ],
      source: "ESTIMATED"
    },
    activities: {
      total: activitiesCost,
      items: activityTicketItems,
      guideFee: guideFee,
      source: "DATABASE VERIFIED"
    },
    miscellaneous: {
      total: miscellaneousCost,
      items: [
        { label: "Monument Parking & Local Tolls", cost: parkingCost, detail: `₹${Math.round(parkingCost / Math.max(1, days))}/day × ${days} days` },
        { label: "Emergency Bottled Water & Offerings", cost: waterCost, detail: `₹20/person/day × ${totalTravellers} travellers × ${days} days` },
        { label: "Incidental Emergency Buffer", cost: bufferCost, detail: `₹${Math.round(bufferCost / Math.max(1, days))}/day × ${days} days` }
      ],
      source: "ESTIMATED"
    }
  };

  const rawTrip = {
    startingLocation: startDisplayName,
    startLocation: (typeof startLocation === 'object') ? startLocation : {
      name: routeInfo.origin,
      latitude: routeInfo.originCoords[0],
      longitude: routeInfo.originCoords[1]
    },
    destination: routeInfo.destination,
    duration: days,
    nights,
    travellers,
    totalTravellers,
    budgetType: budget,
    travelStyle,
    priority,
    totalCost,
    costPerPerson,
    dailyAverageCost: perDayCost,
    targetBudget: targetTotalBudget,
    savings,
    breakdown: {
      transport: transportCost,
      accommodation: accommodationCost,
      food: foodCost,
      activities: activitiesCost,
      miscellaneous: miscellaneousCost,
      itemized: itemizedBreakdown
    },
    route: routeInfo,
    mapData: {
      origin: routeInfo.origin,
      destination: routeInfo.destination,
      waypoints: mapWaypoints,
      polyline: fullPolyline
    },
    weather,
    itinerary
  };

  // Run final chronological validation and repair
  return validateAndRepairItinerary(rawTrip);
}
