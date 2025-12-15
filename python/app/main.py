from fastapi import FastAPI
from fastapi import HTTPException
from dotenv import load_dotenv
from app.sentinel import get_sentinel_client, find_scene, download_scene, find_band
from .types import NDVIRequest
from app.gee import compute_ndvi_gee


load_dotenv()

app = FastAPI(
    title="Canopy NDVI service",
    description = "Satellite-based NDVI verification service",
    version="0.0.1"
)
#base url: http://localhost:8000

@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service" : "canopy-ndvi",
        "version" : "0.1.0"
    }

@app.post("/ndvi")
def compute_ndvi_endpoint(req: NDVIRequest):
    print("Computing ndvi endpoint")
    ndvi_value = compute_ndvi_gee(req.min_lon, req.min_lat, req.max_lon, req.max_lat)
    return {
        "forestId": req.forest_id,
        "ndvi": round(ndvi_value, 4), 
        "confidence": 0.95
    }

def build_footprint(req):
    return (
        req.min_lat,
        req.min_lon,
        req.max_lat,
        req.max_lon
    )
