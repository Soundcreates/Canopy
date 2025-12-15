import ee #earthengine
ee.Authenticate()
ee.Initialize(project="canopy-481209")


def compute_ndvi_gee(min_lon, min_lat, max_lon, max_lat):
    print("compute_ndvi_gee function called")
    print("Parameters received:")
    print("Min Longitude:", min_lon)
    print("Min Latitude:", min_lat)
    print("Max Longitude:", max_lon)
    print("Max Latitude:", max_lat)
    
    try:
        print("Creating rectangle geometry from coordinates")
        print(f"Input coordinates: min_lon={min_lon}, min_lat={min_lat}, max_lon={max_lon}, max_lat={max_lat}")
        region = ee.Geometry.Rectangle([min_lon, min_lat, max_lon, max_lat])
        print("Rectangle geometry created")
        
        # Verify geometry bounds
        try:
            region_bounds = region.bounds().getInfo()['coordinates'][0]
            print(f"Geometry bounds verified: {region_bounds}")
            print(f"Expected: [{min_lon}, {min_lat}], [{max_lon}, {max_lat}]")
        except Exception as e:
            print(f"Could not verify geometry bounds: {e}")
        
        print("Filtering Sentinel-2 image collection")
        print("Collection: COPERNICUS/S2_SR_HARMONIZED")
        # Try a wider date range to increase chances of finding data
        # Use last 6 months for better coverage
        from datetime import datetime, timedelta
        end_date = datetime.now().strftime("%Y-%m-%d")
        start_date = (datetime.now() - timedelta(days=180)).strftime("%Y-%m-%d")
        print(f"Date range: {start_date} to {end_date}")
        
        collection = (
            ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
            .filterBounds(region)
            .filterDate(start_date, end_date)
            .filter(ee.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", 30))  # Increased cloud threshold to 30% for better coverage
            .sort("system:time_start", False)  # Sort by date, most recent first
        )
        print("Image collection filtered and sorted by date (most recent first)")
        
        print("Checking collection size")
        collection_size = collection.size().getInfo()
        print(f"Collection size: {collection_size} images")
        
        if collection_size == 0:
            print("No images found in collection for the specified region and date range")
            raise ValueError("No satellite images available for the specified coordinates and date range. The area may be too small, have no coverage, or be outside Sentinel-2 coverage area.")
        
        print("Getting most recent image from collection")
        image = collection.first()
        print("Image retrieved")
        
        # Get image metadata for debugging
        try:
            image_id = image.get("system:id").getInfo()
            image_date = image.date().format("YYYY-MM-dd").getInfo()
            print(f"Using image ID: {image_id}")
            print(f"Image date: {image_date}")
        except Exception as e:
            print(f"Could not retrieve image metadata: {e}")
        
        # Check if image is valid
        if image is None:
            print("Image is None - collection.first() returned None")
            raise ValueError("Failed to retrieve image from collection")
        
        print("Computing NDVI using normalized difference of B8 and B4 bands")
        ndvi = image.normalizedDifference(["B8", "B4"]).rename("NDVI")
        print("NDVI computed")
        
        # Clip the NDVI image to the exact region to ensure we only compute for this specific area
        print("Clipping NDVI image to exact region bounds")
        ndvi_clipped = ndvi.clip(region)
        print("NDVI image clipped to region")
        
        print("Computing mean NDVI statistics for the specific region")
        print("Region bounds:", f"[{min_lon}, {min_lat}, {max_lon}, {max_lat}]")
        print("Scale: 10 meters")
        print("Max pixels: 1e9")
        
        # Use the clipped image and the specific region geometry to ensure we're computing for the exact coordinates
        stats = ndvi_clipped.reduceRegion(
            reducer=ee.Reducer.mean(),
            geometry=region,  # Use the specific region geometry
            scale=10,
            maxPixels=1e9,
            bestEffort=False  # Don't use best effort mode - ensure accuracy
        )
        print("Statistics computed for region")
        
        print("Extracting NDVI value from statistics")
        ndvi_value = stats.get("NDVI").getInfo()
        print(f"NDVI value extracted for region [{min_lon}, {min_lat}, {max_lon}, {max_lat}]: {ndvi_value}")
        
        # Verify the value is actually different from a default
        if ndvi_value is not None:
            print(f"NDVI value type: {type(ndvi_value)}")
            print(f"NDVI value: {ndvi_value}")
        
        # Check if NDVI value is None
        if ndvi_value is None:
            print("NDVI value is None - no valid data in the region")
            raise ValueError("No valid NDVI data found in the specified region. The area may be covered by clouds or have no vegetation.")
        
        print("Returning NDVI value")
        return ndvi_value
    
    except Exception as e:
        print(f"Error in compute_ndvi_gee: {e}")
        print(f"Error type: {type(e).__name__}")
        import traceback
        print("Traceback:", traceback.format_exc())
        # Re-raise the exception so it can be handled by the endpoint
        raise
