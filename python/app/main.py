from fastapi import FastAPI, HTTPException, Response
from dotenv import load_dotenv
import io
from app.sentinel import get_sentinel_client, find_scene, download_scene, find_band
from app.image.pillow import generate_base_image
from .types import NDVIRequest, NFTImageRequest
from app.gee import compute_ndvi_gee
from app.utils.utils import generate_seed

load_dotenv()

app = FastAPI(
    title="Canopy NDVI service",
    description = "Satellite-based NDVI verification service",
    version="0.0.1"
)
#base url: http://localhost:8000

@app.get("/health") #this endpoint checks the health of the service
def health_check():
    return {
        "status": "ok",
        "service" : "canopy-ndvi",
        "version" : "0.1.0"
    }

@app.post("/ndvi") #this endpoint computes the ndvi value based on the data provided
def compute_ndvi_endpoint(req: NDVIRequest): #this endpoint computes the ndvi value based on the data provided
    print("NDVI computation endpoint called")
    print("Extracting request parameters")
    print("Forest ID:", req.forest_id)
    print("Min Longitude:", req.min_lon)
    print("Max Longitude:", req.max_lon)
    print("Min Latitude:", req.min_lat)
    print("Max Latitude:", req.max_lat)
    
    print("Calling compute_ndvi_gee function")
    ndvi_value = compute_ndvi_gee(req.min_lon, req.min_lat, req.max_lon, req.max_lat)
    print("NDVI value computed:", ndvi_value)
    
    print("Rounding NDVI value to 4 decimal places")
    rounded_ndvi = round(ndvi_value, 4)
    print("Rounded NDVI value:", rounded_ndvi)
    
    print("Preparing response data")
    response_data = {
        "forestId": req.forest_id,
        "ndvi": rounded_ndvi, 
        "confidence": 0.95,
        "min_lon": req.min_lon,
        "max_lon": req.max_lon,
        "min_lat": req.min_lat,
        "max_lat": req.max_lat
    }
    print("Response data prepared:", response_data)
    print("Returning NDVI computation result")
    return response_data

def build_footprint(req):
    return (
        req.min_lat,
        req.min_lon,
        req.max_lat,
        req.max_lon
    )

@app.post("/generate-nft-image") #this endpoint generates the nft image based on the data provided
def compute_image_endpoint(req: NFTImageRequest):
    print("NFT image generation endpoint called")
    print("Extracting request parameters")
    print("Forest ID:", req.forest_id)
    print("Epoch Start:", req.epoch_start)
    print("Epoch End:", req.epoch_end)
    print("NDVI Delta:", req.ndvi_delta)
    print("Confidence:", req.confidence)
    print("Carbon Tons:", req.carbon_tons)
    print("Area Hectares:", req.area_hectares)
    print("Status:", req.status)
    
    print("Generating seed from forest_id, epoch_start, and epoch_end")
    seed = generate_seed(
        req.forest_id,
        req.epoch_start,
        req.epoch_end
    )
    print("Seed generated:", seed)
    
    print("Preparing data dict for generate_base_image")
    data = {
        "ndvi_delta": req.ndvi_delta,
        "confidence": req.confidence,
        "status": req.status
    }
    print("Data dict prepared:", data)
    
    print("Calling generate_base_image function")
    base_img = generate_base_image(data)
    print("Base image generated")
    print("Base image size:", base_img.size)
    print("Base image mode:", base_img.mode)
    
    print("Using base image directly (no SDXL refinement)")
    final_img = base_img

    print("Creating BytesIO buffer for image")
    buf = io.BytesIO()
    print("Saving final image to buffer in PNG format")
    final_img.save(buf, format="PNG")
    print("Image saved to buffer")
    print("Buffer size:", buf.tell(), "bytes")
    
    print("Seeking buffer to beginning")
    buf.seek(0)
    print("Reading buffer content")
    image_content = buf.read()
    print("Image content read, size:", len(image_content), "bytes")
    
    print("Preparing response headers")
    response_headers = {
        "X-Seed": str(seed),
        "X-Forest-Id": str(req.forest_id),
        "X-NDVI-Delta": str(req.ndvi_delta),
        "X-Confidence": str(req.confidence),
        "X-Status": req.status
    }
    print("Response headers prepared:", response_headers)
    
    print("Creating Response object")
    response = Response(
        content=image_content,
        media_type="image/png",
        headers=response_headers
    )
    print("Response object created")
    print("Returning image response")
    return response