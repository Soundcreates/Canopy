from sentinelsat import SentinelAPI
import os

def get_sentinel_client():
    return SentinelAPI(
        os.getenv("SENTINEL_USER"),
        os.getenv("SENTINEL_PASSWORD"),
        "https://scihub.copernicus.eu/apihub"
    )

def find_scene(api, footprint):
    products =  api.query(
        footprint,
        date=("20220101", "20221231"),
        platformname="Sentinel-2",
        processinglevel="Level-2A",
        cloudcoverpercentage=(0, 20),
    )

    if not products:
        raise Exception("No products found")

    return list(products.keys())[0]

def download_scene(api, scene_id):
    api.download(scene_id)

def find_band(scene_dir, band_name):
    for root, _, files in os.walk(scene_dir):
        for file in files:
            if band_name in file:
                return os.path.join(root, file)
    raise Exception(f"Band {band_name} not found")