import axios from 'axios';
import { getCoordinatesForPlace } from './routeService.js';

// Weather code translation for WMO weather codes (Open-Meteo)
const WMO_CODE_MAP = {
  0: { condition: "Clear Sky", rain: 0 },
  1: { condition: "Mainly Clear", rain: 5 },
  2: { condition: "Partly Cloudy", rain: 15 },
  3: { condition: "Overcast", rain: 25 },
  45: { condition: "Foggy", rain: 10 },
  48: { condition: "Depositing Rime Fog", rain: 10 },
  51: { condition: "Light Drizzle", rain: 45 },
  53: { condition: "Moderate Drizzle", rain: 60 },
  55: { condition: "Dense Drizzle", rain: 75 },
  61: { condition: "Slight Rain", rain: 65 },
  63: { condition: "Moderate Rain", rain: 80 },
  65: { condition: "Heavy Rain", rain: 95 },
  80: { condition: "Rain Showers", rain: 70 },
  81: { condition: "Moderate Showers", rain: 85 },
  82: { condition: "Violent Showers", rain: 95 },
  95: { condition: "Thunderstorm", rain: 85 }



  
};

// Dynamic backpack checklist generator based on weather metrics
export function generateBackpackList(temp, rainProb, condition) {
  const backpack = [
    { name: "Comfortable Walking Shoes", description: "Essential for stone courtyards & archaeological trails", required: true },
    { name: "Reusable Water Bottle", description: "Stay hydrated during heritage excursions", required: true },
    { name: "Power Bank", description: "Keep your offline map devices charged", required: true }
  ];

  if (rainProb >= 30 || condition.toLowerCase().includes("rain") || condition.toLowerCase().includes("drizzle")) {
    backpack.unshift({
      name: "Umbrella / Rain Poncho",
      description: "Recommended for afternoon monsoon showers and rain protection",
      required: true
    });
    backpack.push({
      name: "Waterproof Phone Pouch",
      description: "Protects electronic devices during outdoor rain walks",
      required: false
    });
  } else if (temp >= 33) {
    backpack.unshift({
      name: "Sun Hat & UV Sunglasses",
      description: "Protection against intense afternoon sun on open monument grounds",
      required: true
    });
    backpack.push({
      name: "Electrolyte / ORS Sachets",
      description: "Vital for energy during warm weather sightseeing",
      required: true
    });
  } else if (temp <= 18) {
    backpack.unshift({
      name: "Light Woolen / Fleece Jacket",
      description: "Comfortable for cool morning and late evening temple visits",
      required: true
    });
  } else {
    backpack.push({
      name: "Light Breathable Cotton Wear",
      description: "Ideal for pleasant daytime exploration",
      required: true
    });
  }

  return backpack;
}

export async function getDestinationWeather(destination, startDateStr = '', daysCount = 3) {
  const coords = getCoordinatesForPlace(destination || 'Patna');
  const targetDate = startDateStr ? new Date(startDateStr) : new Date();
  
  // Try fetching from Open-Meteo live API with 3s timeout
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lng}&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max,windspeed_10m_max&timezone=auto`;
    const res = await axios.get(url, { timeout: 3000 });
    
    if (res.data && res.data.daily) {
      const daily = res.data.daily;
      const todayIso = targetDate.toISOString().split('T')[0];
      
      // Find index for the requested date or fallback to index 0
      let dateIdx = daily.time.findIndex(t => t === todayIso);
      if (dateIdx === -1) dateIdx = 0;
      
      const code = daily.weathercode[dateIdx] ?? 2;
      const wInfo = WMO_CODE_MAP[code] || { condition: "Partly Cloudy", rain: 20 };
      const tempMax = Math.round(daily.temperature_2m_max[dateIdx]);
      const tempMin = Math.round(daily.temperature_2m_min[dateIdx]);
      const currentTemp = Math.round((tempMax + tempMin) / 2);
      const rainProb = daily.precipitation_probability_max[dateIdx] ?? wInfo.rain;
      const windSpeed = Math.round(daily.windspeed_10m_max[dateIdx] || 12);
      
      const forecast = [];
      const numDays = Math.min(daysCount, daily.time.length);
      for (let i = 0; i < numDays; i++) {
        const idx = (dateIdx + i) % daily.time.length;
        const dayCode = daily.weathercode[idx] ?? 2;
        const info = WMO_CODE_MAP[dayCode] || { condition: "Sunny", rain: 10 };
        const dayDate = new Date(daily.time[idx]);
        const dayName = i === 0 ? "Day 1" : i === 1 ? "Day 2" : `Day ${i + 1}`;
        
        forecast.push({
          day: dayName,
          date: dayDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
          temp: Math.round(daily.temperature_2m_max[idx]),
          condition: info.condition,
          rainProbability: daily.precipitation_probability_max[idx] ?? info.rain
        });
      }
      
      return {
        destination: coords.name,
        temp: currentTemp,
        tempMax,
        tempMin,
        rainProbability: rainProb,
        condition: wInfo.condition,
        wind: `${windSpeed} km/h`,
        forecast,
        backpack: generateBackpackList(currentTemp, rainProb, wInfo.condition),
        isEstimated: false
      };
    }
  } catch (err) {
    // Open-Meteo unreachable or offline, calculate seasonal Bihar weather
  }
  
  // Seasonal Bihar fallback based on month of travel
  const month = targetDate.getMonth(); // 0-11
  let baseTemp = 28;
  let condition = "Sunny Intervals";
  let rainProb = 20;
  
  if (month >= 5 && month <= 8) { // Jun - Sep (Monsoon)
    baseTemp = 29;
    condition = "Warm & Humid with Light Showers";
    rainProb = 45;
  } else if (month >= 9 && month <= 10) { // Oct - Nov (Autumn/Festive)
    baseTemp = 26;
    condition = "Pleasant & Clear";
    rainProb = 10;
  } else if (month >= 11 || month <= 1) { // Dec - Feb (Winter)
    baseTemp = 18;
    condition = "Cool & Sunny";
    rainProb = 5;
  } else { // Mar - May (Summer)
    baseTemp = 34;
    condition = "Hot & Sunny";
    rainProb = 15;
  }
  
  const forecast = [];
  for (let i = 1; i <= daysCount; i++) {
    const d = new Date(targetDate);
    d.setDate(targetDate.getDate() + (i - 1));
    forecast.push({
      day: `Day ${i}`,
      date: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      temp: baseTemp + (i % 2 === 0 ? 1 : -1),
      condition: condition,
      rainProbability: rainProb
    });
  }
  
  return {
    destination: coords.name,
    temp: baseTemp,
    tempMax: baseTemp + 3,
    tempMin: baseTemp - 4,
    rainProbability: rainProb,
    condition: condition,
    wind: "11 km/h",
    forecast,
    backpack: generateBackpackList(baseTemp, rainProb, condition),
    isEstimated: true
  };
}

/**
 * Route Pulse: Multi-stop weather evaluation along intermediate route points
 */
export async function getRoutePulseData(waypoints = []) {
  const currentHour = new Date().getHours();
  const isNight = currentHour >= 19 || currentHour < 5;

  const validWaypoints = Array.isArray(waypoints) && waypoints.length > 0 
    ? waypoints 
    : [{ name: 'Patna' }, { name: 'Bodh Gaya' }];

  const routeStops = [];
  const precautions = [];

  for (let i = 0; i < Math.min(4, validWaypoints.length); i++) {
    const wp = validWaypoints[i];
    const name = wp.name || wp.displayName || `Stop ${i + 1}`;
    const weather = await getDestinationWeather(name);
    routeStops.push({
      stopName: name,
      temp: weather.temp,
      condition: weather.condition,
      rainProbability: weather.rainProbability
    });
  }

  const primaryWeather = routeStops[0] || { temp: 29, condition: "Clear", rainProbability: 10 };
  const destWeather = routeStops[routeStops.length - 1] || primaryWeather;

  // Generate intelligent route precautions based on conditions along route
  if (routeStops.some(s => s.rainProbability >= 35 || s.condition.toLowerCase().includes('rain'))) {
    precautions.push({
      id: 'rain_ahead',
      icon: '🌧',
      title: 'Rain Ahead · 38 km',
      message: 'Slow down and expect reduced visibility on wet asphalt.'
    });
  }

  if (routeStops.some(s => s.condition.toLowerCase().includes('fog'))) {
    precautions.push({
      id: 'fog_zone',
      icon: '🌫',
      title: 'Fog Zone · 22 km',
      message: 'Visibility may reduce near lower river basin sections.'
    });
  }

  if (routeStops.some(s => s.temp >= 33)) {
    precautions.push({
      id: 'heat_alert',
      icon: '☀',
      title: 'Heat Alert · 61 km',
      message: 'Carry water and plan a short break near major stop.'
    });
  }

  if (isNight) {
    precautions.push({
      id: 'night_route',
      icon: '🌙',
      title: 'Night Route',
      message: 'Avoid unnecessary stops on unlit isolated highway stretches.'
    });
  }

  // Default road caution
  precautions.push({
    id: 'road_caution',
    icon: '🛣',
    title: 'Road Insight',
    message: 'Normal road conditions · Drive carefully around sharp bends.'
  });

  return {
    summary: {
      temp: primaryWeather.temp,
      condition: primaryWeather.condition,
      status: precautions.some(p => p.id === 'rain_ahead' || p.id === 'fog_zone') ? 'Alert' : 'Safe'
    },
    routeStops,
    precautions,
    destinationWeather: destWeather
  };
}
