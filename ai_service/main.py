from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import random

app = FastAPI(title="Bihar Yatra AI & Routing Service", version="1.0.0")

# Enable CORS for frontend and backend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class RouteScoreRequest(BaseModel):
    start: str
    destination: str
    route_type: str # 'shortest' | 'fastest' | 'safest' | 'scenic' | 'heritage'
    travel_time: Optional[str] = "10:00 AM" # e.g. "08:00 PM" has lower safety score due to lighting

class RouteScoreResponse(BaseModel):
    start: str
    destination: str
    route_type: str
    safety_score: int
    distance_km: float
    duration_min: int
    factors: dict
    coordinates: List[List[float]] # [[lat, lng], ...] for leaflet map pathing
    alternative_routes_scores: dict

# Coordinates database for seed locations
LOCATIONS = {
    "patna": [25.5941, 85.1376],
    "rajgir": [25.0300, 85.4184],
    "nalanda": [25.1328, 85.4450],
    "bodh gaya": [24.6961, 84.9914],
    "gaya": [24.7955, 84.9994],
    "barabar caves": [25.0051, 85.0628],
    "rohtasgarh fort": [24.6300, 83.9161],
    "valmiki tiger reserve": [27.3292, 84.2155],
    "vaishali": [25.9922, 85.1245],
}

def get_coordinates(loc: str):
    l = loc.lower().strip()
    # Fuzzy match
    for k, coords in LOCATIONS.items():
        if k in l or l in k:
            return coords
    # Default to center of Bihar
    return [25.0961, 85.3131]

def generate_route_line(start_coord, end_coord, num_points=12):
    # Generates a slightly curved path between coordinates
    lat1, lon1 = start_coord
    lat2, lon2 = end_coord
    path = []
    for i in range(num_points):
        t = i / (num_points - 1)
        # Interpolate
        lat = lat1 + (lat2 - lat1) * t
        lon = lon1 + (lon2 - lon1) * t
        # Add curve effect
        offset = 0.05 * (t * (1 - t))
        lat += offset
        lon -= offset
        path.append([lat, lon])
    return path

@app.get("/")
def read_root():
    return {"message": "Bihar Yatra AI Service is running."}

@app.post("/api/routes/score", response_model=RouteScoreResponse)
def calculate_route_score(req: RouteScoreRequest):
    start_clean = req.start.lower().strip()
    dest_clean = req.destination.lower().strip()
    
    start_coords = get_coordinates(req.start)
    end_coords = get_coordinates(req.destination)
    
    # Calculate simple distance
    lat_diff = start_coords[0] - end_coords[0]
    lon_diff = start_coords[1] - end_coords[1]
    raw_dist = (lat_diff**2 + lon_diff**2)**0.5
    distance = max(15.0, round(raw_dist * 111.0, 1)) # approx km
    
    # Base speeds based on route type
    speed_kmh = 50.0
    if req.route_type == "fastest":
        speed_kmh = 65.0
    elif req.route_type == "shortest":
        speed_kmh = 40.0
    elif req.route_type == "safest":
        speed_kmh = 55.0
    elif req.route_type == "scenic":
        speed_kmh = 45.0
    elif req.route_type == "heritage":
        speed_kmh = 45.0
        
    duration = int((distance / speed_kmh) * 60)
    
    # Safety factors based on type and hour
    is_night = False
    if req.travel_time:
        hour = 10
        try:
            if "pm" in req.travel_time.lower():
                hour = int(req.travel_time.split(":")[0]) + 12
            else:
                hour = int(req.travel_time.split(":")[0])
        except Exception:
            pass
        if hour < 6 or hour > 19:
            is_night = True

    # Scoring parameters
    road_conditions = 85
    lighting = 90 if not is_night else 35
    emergency_points = 80
    crowd_activity = 75
    risky_zones = 5 # scale of 0-10 where 0 is perfect safety
    
    if req.route_type == "safest":
        road_conditions = 92
        lighting = 95 if not is_night else 60
        emergency_points = 95
        crowd_activity = 85
        risky_zones = 1
    elif req.route_type == "shortest":
        road_conditions = 65
        lighting = 70 if not is_night else 20
        emergency_points = 45
        crowd_activity = 50
        risky_zones = 4
    elif req.route_type == "scenic":
        road_conditions = 75
        lighting = 80 if not is_night else 25
        emergency_points = 60
        crowd_activity = 40
        risky_zones = 3
    elif req.route_type == "heritage":
        road_conditions = 80
        lighting = 85 if not is_night else 40
        emergency_points = 70
        crowd_activity = 80
        risky_zones = 2

    # Calculate overall score
    safety_score = int(
        (road_conditions * 0.25) +
        (lighting * 0.25) +
        (emergency_points * 0.20) +
        (crowd_activity * 0.15) +
        ((10 - risky_zones) * 10 * 0.15)
    )
    
    # Ensure it makes sense
    safety_score = max(30, min(100, safety_score))
    
    # Generate alternative route safety scores
    alternative_scores = {
        "shortest": max(45, safety_score - 15),
        "fastest": max(55, safety_score - 5),
        "safest": max(85, safety_score + 10) if req.route_type != "safest" else safety_score,
        "scenic": max(50, safety_score - 8),
        "heritage": max(60, safety_score - 4)
    }
    
    # Clean alternative scores so we don't have exceeding values
    for k in alternative_scores:
        alternative_scores[k] = min(100, max(30, alternative_scores[k]))

    # Generate coordinates
    coords = generate_route_line(start_coords, end_coords)
    
    return RouteScoreResponse(
        start=req.start,
        destination=req.destination,
        route_type=req.route_type,
        safety_score=safety_score,
        distance_km=distance,
        duration_min=duration,
        factors={
            "road_conditions": f"{road_conditions}/100",
            "street_lighting": f"{lighting}/100",
            "emergency_services": f"{emergency_points}/100",
            "crowd_activity": f"{crowd_activity}/100",
            "police_presence": "High" if emergency_points > 80 else "Moderate" if emergency_points > 60 else "Low"
        },
        coordinates=coords,
        alternative_routes_scores=alternative_scores
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
