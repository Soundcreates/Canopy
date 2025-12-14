from sentinelsat import SentinelAPI
import os

def get_sentinel_client():
    return SentinelAPI(
        os.getenv("SENTINEL_USER"),
        os.getenv("SENTINEL_PASSWORD"),
        "https://scihub.copernicus.eu/apihub"
    )