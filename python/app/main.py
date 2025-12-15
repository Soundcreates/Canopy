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
    
    # Validate coordinates
    print("Validating coordinate ranges")
    if req.min_lon >= req.max_lon:
        print("Validation failed: min_lon must be less than max_lon")
        raise HTTPException(
            status_code=400,
            detail=f"Invalid longitude range: min_lon ({req.min_lon}) must be less than max_lon ({req.max_lon})"
        )
    
    if req.min_lat >= req.max_lat:
        print("Validation failed: min_lat must be less than max_lat")
        raise HTTPException(
            status_code=400,
            detail=f"Invalid latitude range: min_lat ({req.min_lat}) must be less than max_lat ({req.max_lat})"
        )
    
    # Validate coordinate bounds (longitude: -180 to 180, latitude: -90 to 90)
    if not (-180 <= req.min_lon <= 180) or not (-180 <= req.max_lon <= 180):
        print("Validation failed: longitude out of valid range")
        raise HTTPException(
            status_code=400,
            detail=f"Longitude must be between -180 and 180. Received: min_lon={req.min_lon}, max_lon={req.max_lon}"
        )
    
    if not (-90 <= req.min_lat <= 90) or not (-90 <= req.max_lat <= 90):
        print("Validation failed: latitude out of valid range")
        raise HTTPException(
            status_code=400,
            detail=f"Latitude must be between -90 and 90. Received: min_lat={req.min_lat}, max_lat={req.max_lat}"
        )
    
    # Validate area is not too small (at least 0.0001 degrees difference)
    lon_diff = abs(req.max_lon - req.min_lon)
    lat_diff = abs(req.max_lat - req.min_lat)
    if lon_diff < 0.0001 or lat_diff < 0.0001:
        print("Validation failed: area too small")
        raise HTTPException(
            status_code=400,
            detail=f"Area too small. Minimum difference: 0.0001 degrees. Received: lon_diff={lon_diff}, lat_diff={lat_diff}"
        )
    
    print("Coordinate validation passed")
    
    try:
        print("Calling compute_ndvi_gee function")
        print(f"Coordinates being passed to GEE: min_lon={req.min_lon}, min_lat={req.min_lat}, max_lon={req.max_lon}, max_lat={req.max_lat}")
        ndvi_value = compute_ndvi_gee(req.min_lon, req.min_lat, req.max_lon, req.max_lat)
        print(f"NDVI value computed for coordinates [{req.min_lon}, {req.min_lat}, {req.max_lon}, {req.max_lat}]: {ndvi_value}")
        
        # Check if NDVI value is None or invalid
        if ndvi_value is None:
            print("NDVI value is None - no satellite data available")
            raise HTTPException(
                status_code=404,
                detail="No satellite data available for the specified coordinates and date range. Try different coordinates or a different date range."
            )
        
        # Validate NDVI value is a number
        try:
            ndvi_float = float(ndvi_value)
        except (ValueError, TypeError):
            print("NDVI value is not a valid number:", ndvi_value)
            raise HTTPException(
                status_code=500,
                detail=f"Invalid NDVI value returned: {ndvi_value}"
            )
        
        print("Rounding NDVI value to 4 decimal places")
        rounded_ndvi = round(ndvi_float, 4)
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
    
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        print(f"Error during NDVI computation: {e}")
        print(f"Error type: {type(e).__name__}")
        import traceback
        print("Traceback:", traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail=f"Failed to compute NDVI: {str(e)}"
        )

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