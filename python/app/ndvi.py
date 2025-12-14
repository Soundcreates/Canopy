import numpy as np 
import rasterio

def compute_ndvi(red_path, nir_path):
    with rasterio.open(red_path) as red:
        red_band=red.read(1).astype(float)

    with rasterio.open(nir_path) as nir:
        nir_band = nir.read(1).astype(float)

    ndvi = (nir_band-red_band)/(nir_band +red_band + 1e-6)
    return float(np.nanmean(ndvi))