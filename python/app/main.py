from fastapi import FastAPI as fa 
from .types import NDVIRequest
from dotenv import load_dotenv

load_dotenv()

app = fa(
    title="Canopy NDVI service",
    description = "Satellite-based NDVI verification service",
    version="0.0.1"
)

@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service" : "canopy-ndvi",
        "version" : "0.1.0"
    }

@app.post("/ndvi")
def compute_ndvi(req: NDVIRequest):
 return {
    "forestId": req.forest_id,
    "ndvi": 0.5,
    "ndvi_delta": 0.031,
    "confidence": 0.93 
 }   

