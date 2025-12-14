from pydantic import BaseModel

class NDVIRequest(BaseModel):
    forest_id: str
    min_lon:float
    max_lon:float
    min_lat:float
    max_lat:float


