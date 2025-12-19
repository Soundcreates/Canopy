import React from 'react';

/**
 * PlotInfo Component
 * Displays the drawn plot information (area, centroid, GeoJSON)
 */
const PlotInfo = ({ plotData }) => {
  if (!plotData) {
    return null;
  }

  const { areaSqMeters, centroid, geojson, min_lon, max_lon, min_lat, max_lat, areaHectares } = plotData;
  
  // Convert square meters to hectares and acres for display
  const hectares = (areaSqMeters / 10000).toFixed(4);
  const acres = (areaSqMeters * 0.000247105).toFixed(4);

  return (
    <div className="bg-[#11141a]/90 backdrop-blur-md border border-emerald-500/30 rounded-sm p-4 space-y-3">
      <div className="flex items-center justify-between border-b border-white/5 pb-2">
        <h3 className="text-xs font-mono text-emerald-500 font-medium uppercase tracking-wider">
          PLOT DEFINED
        </h3>
        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
      </div>
      
      <div className="space-y-2 text-xs font-mono">
        <div className="flex justify-between">
          <span className="text-gray-400">Area:</span>
          <span className="text-gray-200">
            {hectares} ha ({acres} ac)
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Centroid:</span>
          <span className="text-gray-200">
            {centroid.lat.toFixed(6)}, {centroid.lng.toFixed(6)}
          </span>
        </div>
        
        {/* Bounding Box Coordinates (Required for NDVI processing) */}
        {min_lon !== undefined && (
          <div className="pt-2 border-t border-white/5 space-y-1">
            <div className="text-[10px] text-gray-500 mb-1">Bounding Box (for NDVI):</div>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div>
                <span className="text-gray-500">Min Lon:</span>
                <span className="text-gray-300 ml-1">{min_lon.toFixed(6)}</span>
              </div>
              <div>
                <span className="text-gray-500">Max Lon:</span>
                <span className="text-gray-300 ml-1">{max_lon.toFixed(6)}</span>
              </div>
              <div>
                <span className="text-gray-500">Min Lat:</span>
                <span className="text-gray-300 ml-1">{min_lat.toFixed(6)}</span>
              </div>
              <div>
                <span className="text-gray-500">Max Lat:</span>
                <span className="text-gray-300 ml-1">{max_lat.toFixed(6)}</span>
              </div>
            </div>
          </div>
        )}
        
        <div className="pt-2 border-t border-white/5">
          <div className="text-[10px] text-gray-500 mb-1">GeoJSON:</div>
          <div className="text-[10px] text-gray-400 break-all max-h-20 overflow-y-auto">
            {JSON.stringify(geojson, null, 2)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlotInfo;

