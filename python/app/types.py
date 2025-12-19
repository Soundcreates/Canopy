
from datetime import date
from pydantic import BaseModel

class NDVIRequest(BaseModel):
    forest_id: int
    min_lon:float
    max_lon:float
    min_lat:float
    max_lat:float


class NFTImageRequest(BaseModel):
    forest_id: int
    epoch_start: str
    epoch_end: str

    ndvi_delta: float        # e.g. 0.18
    confidence: float        # e.g. 0.93
    carbon_tons: float       # e.g. 38.6
    area_hectares: float     # e.g. 12.4

    status: str 

class GraphRequest(BaseModel):
    ndvi_delta:float
    forest_id:int
    time:str