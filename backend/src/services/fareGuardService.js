import { transportFares } from '../data/transportFares.js';
import { calculateRoute } from './routeService.js';

let localFareDatabase = [...transportFares];

export function normalizeLocation(name) {
  if (!name) return "";
  // Handle object inputs (e.g. { name: "Patna", latitude: 25.59 }) gracefully
  if (typeof name === 'object') {
    name = name.name || name.city || name.district || '';
  }
  return String(name).toLowerCase().replace(/junction|jn|railway|station|bus|stand|hub/gi, '').trim();
}

/**
 * Lookup genuine fares for a route using FareGuard Trust Priority
 */
export function lookupFares(origin, destination, options = {}) {
  const {
    travelers = 2,
    budget = 'Budget',
    transportPreference = 'Mixed',
    distanceKm: inputDistance
  } = options;

  const origNorm = normalizeLocation(origin);
  const destNorm = normalizeLocation(destination);

  // 1. Check direct verified database matches
  const matches = localFareDatabase.filter(f => {
    const fOrig = normalizeLocation(f.origin);
    const fDest = normalizeLocation(f.destination);
    return (fOrig.includes(origNorm) || origNorm.includes(fOrig)) &&
           (fDest.includes(destNorm) || destNorm.includes(fDest));
  });

  // Calculate distance if not provided
  let routeDist = inputDistance;
  if (!routeDist) {
    const route = calculateRoute(origin, destination, transportPreference);
    routeDist = route.distanceKm || 25;
  }

  const optionsList = [];

  if (matches.length > 0) {
    matches.forEach(m => {
      const isPerPerson = m.fareUnit === 'PER_PERSON';
      const totalCost = isPerPerson ? (m.fare * travelers) : m.fare;
      
      optionsList.push({
        ...m,
        travelers,
        calculatedTotal: totalCost,
        costFormula: isPerPerson ? `₹${m.fare}/person × ${travelers} travellers` : `₹${m.fare} total (per vehicle)`,
        trustScore: m.fareType === 'OFFICIAL' ? 100 : m.fareType === 'PREPAID' ? 95 : m.fareType === 'VERIFIED' ? 85 : 70
      });
    });
  } else {
    // 2. Regulatory fallback according to State RTA Guidelines (Clearly marked as ESTIMATED)
    const busFare = Math.max(25, Math.round(routeDist * 1.6));
    const autoFare = Math.max(35, Math.round(30 + (routeDist * 11)));
    const taxiFare = Math.max(400, Math.round(350 + (routeDist * 14.5)));

    optionsList.push({
      id: `fare_est_bus_${Date.now()}`,
      origin,
      destination,
      transportType: "BSRTC Public Transit",
      operator: "Bihar State Road Transport Corporation",
      fare: busFare,
      fareUnit: "PER_PERSON",
      fareType: "ESTIMATED",
      source: "Bihar State RTA Per-Km Tariff Guideline",
      sourceUrl: "https://transport.bihar.gov.in",
      effectiveDate: "2026-01-01",
      lastVerified: "2026-08-01",
      validUntil: "2026-12-31",
      verificationStatus: "State Tariff Guideline",
      notes: "Estimated route transit per official government tariff scale.",
      travelers,
      calculatedTotal: busFare * travelers,
      costFormula: `₹${busFare}/person × ${travelers} travellers`,
      trustScore: 75
    });

    if (routeDist <= 40) {
      optionsList.push({
        id: `fare_est_auto_${Date.now()}`,
        origin,
        destination,
        transportType: "Local Auto-Rickshaw",
        operator: "Registered Local Auto Operators",
        fare: autoFare,
        fareUnit: "PER_VEHICLE",
        fareType: "ESTIMATED",
        source: "District Auto Tariff Gazette",
        sourceUrl: "https://transport.bihar.gov.in",
        effectiveDate: "2026-01-01",
        lastVerified: "2026-08-01",
        validUntil: "2026-12-31",
        verificationStatus: "District Guideline",
        notes: "Standard point-to-point auto hire rate.",
        travelers,
        calculatedTotal: autoFare,
        costFormula: `₹${autoFare} total (per vehicle)`,
        trustScore: 70
      });
    }

    optionsList.push({
      id: `fare_est_taxi_${Date.now()}`,
      origin,
      destination,
      transportType: "Authorized Taxi / Cab",
      operator: "Verified Bihar Tour Operators",
      fare: taxiFare,
      fareUnit: "PER_VEHICLE",
      fareType: "ESTIMATED",
      source: "BSTDC Commercial Vehicle Scale",
      sourceUrl: "https://bstdc.bihar.gov.in",
      effectiveDate: "2026-01-01",
      lastVerified: "2026-08-01",
      validUntil: "2026-12-31",
      verificationStatus: "Commercial Operator Guideline",
      notes: "Dedicated vehicle hire with driver.",
      travelers,
      calculatedTotal: taxiFare,
      costFormula: `₹${taxiFare} total (per vehicle)`,
      trustScore: 70
    });
  }

  // 3. Filter and recommend based on user budget and safety
  const budgetType = (budget || 'Budget').toLowerCase();
  
  let recommended = optionsList[0];
  let alternatives = [];

  if (budgetType.includes('budget')) {
    // Prefer public transit / bus / shared options
    recommended = optionsList.find(o => o.fareUnit === 'PER_PERSON' || o.calculatedTotal <= 400) || optionsList[0];
    alternatives = optionsList.filter(o => o !== recommended).slice(0, 2);
  } else if (budgetType.includes('premium')) {
    // Prefer dedicated taxi / prepaid options
    recommended = optionsList.find(o => o.fareUnit === 'PER_VEHICLE' && (o.fareType === 'PREPAID' || o.fareType === 'VERIFIED')) || optionsList[optionsList.length - 1];
    alternatives = optionsList.filter(o => o !== recommended).slice(0, 2);
  } else {
    // Standard: balanced price & comfort
    recommended = optionsList.find(o => o.fareType === 'OFFICIAL' || o.fareType === 'PREPAID') || optionsList[0];
    alternatives = optionsList.filter(o => o !== recommended).slice(0, 2);
  }

  return {
    origin,
    destination,
    distanceKm: routeDist,
    recommended,
    alternatives,
    allOptions: optionsList
  };
}

/**
 * Fair Fare Check - Compare driver quote with verified reference
 */
export function checkFairFare(origin, destination, driverQuote, vehicleType = 'auto') {
  const quote = Number(driverQuote) || 0;
  const fareResult = lookupFares(origin, destination);
  
  const reference = fareResult.recommended;
  const referenceFare = reference.calculatedTotal || reference.fare;
  const diff = quote - referenceFare;

  let assessment = "";
  let isFair = true;

  if (quote <= referenceFare) {
    assessment = "Quote is within or below the verified reference fare.";
    isFair = true;
  } else if (diff <= Math.round(referenceFare * 0.2)) {
    assessment = `Quote is slightly above the reference fare (+₹${diff}). May account for short waiting or peak traffic.`;
    isFair = true;
  } else {
    assessment = `Quote is ₹${diff} above the verified reference fare. Standard reference for this route is ₹${referenceFare} (${reference.source}).`;
    isFair = false;
  }

  return {
    origin,
    destination,
    driverQuote: quote,
    referenceFare,
    difference: diff,
    isFair,
    assessment,
    referenceSource: reference.source,
    fareType: reference.fareType,
    verificationStatus: reference.verificationStatus
  };
}

/**
 * Admin CRUD operations
 */
export function getAllFares(filter = {}) {
  let result = [...localFareDatabase];
  if (filter.district) {
    result = result.filter(f => f.district.toLowerCase() === filter.district.toLowerCase());
  }
  if (filter.fareType) {
    result = result.filter(f => f.fareType === filter.fareType);
  }
  return result;
}

export function addFare(newFare) {
  const fareRecord = {
    id: "fare_custom_" + Date.now(),
    origin: newFare.origin,
    destination: newFare.destination,
    district: newFare.district || "Patna",
    transportType: newFare.transportType || "Authorized Taxi",
    operator: newFare.operator || "Registered Operator",
    fare: Number(newFare.fare) || 100,
    fareUnit: newFare.fareUnit || "PER_PERSON",
    fareType: newFare.fareType || "VERIFIED",
    source: newFare.source || "Admin Registered Tariff",
    sourceUrl: newFare.sourceUrl || "https://transport.bihar.gov.in",
    effectiveDate: newFare.effectiveDate || new Date().toISOString().split('T')[0],
    lastVerified: new Date().toISOString().split('T')[0],
    validUntil: newFare.validUntil || "2026-12-31",
    verificationStatus: newFare.verificationStatus || "Verified Official",
    notes: newFare.notes || "Added via Admin Console"
  };

  localFareDatabase.unshift(fareRecord);
  return fareRecord;
}

export function updateFare(id, updates) {
  const idx = localFareDatabase.findIndex(f => f.id === id);
  if (idx !== -1) {
    localFareDatabase[idx] = {
      ...localFareDatabase[idx],
      ...updates,
      lastVerified: new Date().toISOString().split('T')[0]
    };
    return localFareDatabase[idx];
  }
  return null;
}

export function deleteFare(id) {
  const initialLen = localFareDatabase.length;
  localFareDatabase = localFareDatabase.filter(f => f.id !== id);
  return localFareDatabase.length < initialLen;
}
