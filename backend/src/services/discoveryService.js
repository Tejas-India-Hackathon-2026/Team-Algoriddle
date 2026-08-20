import { HIDDEN_DISCOVERIES } from '../data/hiddenGemsData.js';
import { getCoordinatesForPlace, calculateHaversineDistance, calculateDualRoutes } from './routeService.js';

/**
 * Calculate perpendicular distance from a candidate point to a route polyline
 */
function calculateMinDistanceToPolyline(lat, lng, polyline) {
  if (!polyline || polyline.length === 0) return 999;
  
  let minDist = Infinity;
  for (let i = 0; i < polyline.length; i++) {
    const pt = polyline[i];
    const d = calculateHaversineDistance(lat, lng, pt[0], pt[1]);
    if (d < minDist) {
      minDist = d;
    }
  }
  return Math.round(minDist * 10) / 10;
}

/**
 * Route-Aware Hidden Bihar Discovery Engine
 */
export async function findDiscoveriesNearRoute(params = {}) {
  const {
    origin = 'Patna',
    destination = 'Rajgir',
    userCoordinates,
    maxDetourKm = 40,
    category = 'All',
    budget = 'Standard',
    timeAvailableMin = 180,
    weather
  } = params;

  const origInput = userCoordinates && (userCoordinates.lat || userCoordinates.latitude)
    ? { lat: userCoordinates.lat || userCoordinates.latitude, lng: userCoordinates.lng || userCoordinates.longitude }
    : origin;

  const origCoords = getCoordinatesForPlace(origInput);
  const destCoords = getCoordinatesForPlace(destination);

  // 1. Get real route corridor geometry
  let routePolyline = [];
  try {
    const dual = await calculateDualRoutes(origInput, destination, 'Mixed');
    if (dual?.fastest?.polyline && dual.fastest.polyline.length > 0) {
      routePolyline = dual.fastest.polyline;
    }
  } catch (err) {
    console.warn("[DISCOVERY] Fallback to direct corridor geometry:", err.message);
  }

  if (routePolyline.length === 0) {
    routePolyline = [
      [origCoords.lat, origCoords.lng],
      [(origCoords.lat + destCoords.lat) / 2, (origCoords.lat + destCoords.lng) / 2],
      [destCoords.lat, destCoords.lng]
    ];
  }

  const baseRouteDirectDist = calculateHaversineDistance(origCoords.lat, origCoords.lng, destCoords.lat, destCoords.lng);

  // 2. Evaluate all verified discoveries
  const evaluated = HIDDEN_DISCOVERIES.map(gem => {
    // Avoid recommending destination itself or exact origin
    const isDestination = gem.name.toLowerCase().includes(destCoords.name.toLowerCase()) || 
                          destCoords.name.toLowerCase().includes(gem.name.toLowerCase());
    const isOrigin = gem.name.toLowerCase().includes(origCoords.name.toLowerCase()) ||
                     origCoords.name.toLowerCase().includes(gem.name.toLowerCase());

    if (isDestination || isOrigin) {
      return null;
    }

    // Perpendicular distance to the actual road route
    const distFromRoute = calculateMinDistanceToPolyline(gem.lat, gem.lng, routePolyline);

    // Total detour distance: Origin -> Gem -> Destination vs Origin -> Destination
    const origToGem = calculateHaversineDistance(origCoords.lat, origCoords.lng, gem.lat, gem.lng);
    const gemToDest = calculateHaversineDistance(gem.lat, gem.lng, destCoords.lat, destCoords.lng);
    const totalWithDetour = origToGem + gemToDest;
    const additionalKm = Math.max(0, Math.round((totalWithDetour - baseRouteDirectDist) * 10) / 10);
    
    // Detour time in minutes (assumes ~40 km/h regional connecting speed)
    const detourMin = Math.max(4, Math.round((additionalKm / 40) * 60));

    // Calculate intelligent Discovery Score (0 - 100)
    let discoveryScore = gem.hiddenScore || 90;

    // Proximity factor (up to 40 pts)
    const proximityScore = Math.max(0, (1 - (distFromRoute / Math.max(1, maxDetourKm))) * 40);
    discoveryScore = (discoveryScore * 0.4) + proximityScore;

    // Direct on-route bonus
    if (distFromRoute <= 4.0) {
      discoveryScore += 15;
    } else if (distFromRoute <= 10.0) {
      discoveryScore += 8;
    }

    // Category match
    if (category !== 'All' && gem.category.toLowerCase() === category.toLowerCase()) {
      discoveryScore += 10;
    }

    // Budget compatibility
    if (budget === 'Budget' && gem.costNum === 0) {
      discoveryScore += 5;
    }

    return {
      ...gem,
      distFromRouteKm: distFromRoute,
      distanceFromRouteText: `${distFromRoute.toFixed(1)} km from your route`,
      detourKm: additionalKm,
      detourMin,
      detourText: `+${detourMin} min`,
      discoveryScore: Math.min(100, Math.round(discoveryScore)),
      dataConfidence: "HIGH",
      isDirectOnRoute: distFromRoute <= 4.0,
      coordinates: [gem.lat, gem.lng]
    };
  }).filter(Boolean);

  // 3. Filter by category
  let filtered = evaluated;
  if (category !== 'All') {
    filtered = filtered.filter(g => g.category.toLowerCase() === category.toLowerCase());
  }

  // 4. Filter by corridor proximity
  let corridorMatches = filtered.filter(g => g.distFromRouteKm <= maxDetourKm);

  // If strict threshold is too narrow, broaden to closest discoveries along the broader regional corridor
  if (corridorMatches.length < 3) {
    corridorMatches = filtered.sort((a, b) => a.distFromRouteKm - b.distFromRouteKm).slice(0, 8);
  }

  // 5. Rank by discovery score descending
  corridorMatches.sort((a, b) => b.discoveryScore - a.discoveryScore);

  return {
    origin: origCoords.name,
    destination: destCoords.name,
    totalRouteDistanceKm: baseRouteDirectDist,
    discoveries: corridorMatches
  };
}
