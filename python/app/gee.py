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
    
    print("Creating rectangle geometry from coordinates")
    region = ee.Geometry.Rectangle([min_lon, min_lat, max_lon, max_lat])
    print("Rectangle geometry created")
    
    print("Filtering Sentinel-2 image collection")
    print("Collection: COPERNICUS/S2_SR_HARMONIZED")
    collection = (
        ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
        .filterBounds(region)
        .filterDate("2024-10-01", "2024-11-01")
        .filter(ee.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", 20))
    )
    print("Image collection filtered")
    
    print("Getting first image from collection")
    image = collection.first()
    print("Image retrieved")
    
    print("Computing NDVI using normalized difference of B8 and B4 bands")
    ndvi = image.normalizedDifference(["B8", "B4"]).rename("NDVI")
    print("NDVI computed")
    
    print("Computing mean NDVI statistics for the region")
    print("Scale: 10 meters")
    print("Max pixels: 1e9")
    stats = ndvi.reduceRegion(
        reducer=ee.Reducer.mean(),
        geometry=region,
        scale=10,
        maxPixels=1e9
    )
    print("Statistics computed")
    
    print("Extracting NDVI value from statistics")
    ndvi_value = stats.get("NDVI").getInfo()
    print("NDVI value extracted:", ndvi_value)
    print("Returning NDVI value")
    return ndvi_value
