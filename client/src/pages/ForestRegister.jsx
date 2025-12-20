import React, { useState, useRef, useEffect } from 'react';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import { motion } from 'framer-motion';
import Squares from '../components/SquareGrid';
import Dither from '../components/DitherBackground';
import PlotInfo from '../components/PlotInfo';
import { registerForest, requestNDVI, startNDVIMonitoring } from '../ApiFactory/ForestAPI';
import { useWallet } from '../contexts/WalletContext';
import mapboxgl from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import * as turf from '@turf/turf';
import { useNavigate } from 'react-router-dom';

//if you need to run the mapbox map, u need to have a mapbox account which provides a public access token
//mapbox is free for limited usage , just need to signup using a card
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN?.trim();
// --- Components ---

const IconWallet = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" /><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" /></svg>
);
const IconCheck = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M20 6 9 17l-5-5" /></svg>
);

const SectionLabel = ({ children, required }) => (
  <label className="block text-[11px] font-mono uppercase tracking-wider text-gray-400 mb-1.5 flex items-center gap-1">
    {children}
    {required && <span className="text-emerald-500">*</span>}
  </label>
);

const InputField = ({ value, onChange, placeholder, readOnly = false, className = '' }) => (
  <input
    type="text"
    value={value}
    onChange={onChange}
    readOnly={readOnly}
    placeholder={placeholder}
    className={`w-full bg-[#0b0f14]/80 border ${readOnly ? 'border-white/5 text-gray-500 cursor-not-allowed' : 'border-white/10 text-gray-200 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20'} rounded-sm px-3 py-2 text-sm font-light transition-all outline-none backdrop-blur-sm ${className}`}
  />
);

const ForestRegister = () => {
  const { account } = useWallet();
  const navigate = useNavigate();
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const drawRef = useRef(null);

  // State for plot data
  const [plotData, setPlotData] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authStatus, setAuthStatus] = useState(null); // null = checking, true = authenticated, false = not authenticated
  const monitoringStopRef = useRef(null); // Store the stop function for monitoring

  // Check authentication status on mount and when account changes
  useEffect(() => {
    if (!account) {
      setAuthStatus(false);
      return;
    }

    const storedAuth = localStorage.getItem(`canopy_auth_${account.toLowerCase()}`);
    if (!storedAuth) {
      setAuthStatus(false);
      return;
    }

    try {
      const authData = JSON.parse(storedAuth);
      if (authData.signature && authData.message && authData.address) {
        setAuthStatus(true);
      } else {
        setAuthStatus(false);
      }
    } catch {
      setAuthStatus(false);
    }
  }, [account]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    if (!import.meta.env.VITE_MAPBOX_TOKEN) {
      console.error('Mapbox access token is not set in env');
      return;
    } else {
      console.log('Mapbox access token is set in env: ', import.meta.env.VITE_MAPBOX_TOKEN);
    }
    // Ensure access token is set
    if (!mapboxgl.accessToken) {
      console.error('Mapbox access token is not set');
      return;
    }

    // Initialize map - only if token exists
    if (mapboxgl.accessToken) {
      if (!mapContainerRef.current) return;

      try {
        mapRef.current = new mapboxgl.Map({
          container: mapContainerRef.current,
          style: 'mapbox://styles/mapbox/dark-v11',
          center: [-62.2159, -3.4653],
          zoom: 3.5,
          pitch: 45,
          bearing: -17,
          antialias: true,
        });
      } catch (error) {
        console.error("Error initializing Mapbox:", error);
        return;
      }
    } else {
      return; // Don't try to initialize if no token
    }

    // Add navigation controls
    mapRef.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add geolocate control
    mapRef.current.addControl(new mapboxgl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true
      },
      trackUserLocation: true,
      showUserHeading: true
    }), 'top-right');

    // Initialize MapboxDraw after map loads
    mapRef.current.on('load', () => {
      // Configure Draw to only allow polygon drawing
      const draw = new MapboxDraw({
        displayControlsDefault: false,
        controls: {
          polygon: true,
          trash: true,
        },
        defaultMode: 'draw_polygon',
        styles: [
          // Style for the polygon being drawn
          {
            'id': 'gl-draw-polygon-fill-inactive',
            'type': 'fill',
            'filter': ['all', ['==', 'active', 'false'], ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
            'paint': {
              'fill-color': '#10b981',
              'fill-opacity': 0.2
            }
          },
          {
            'id': 'gl-draw-polygon-fill-active',
            'type': 'fill',
            'filter': ['all', ['==', 'active', 'true'], ['==', '$type', 'Polygon']],
            'paint': {
              'fill-color': '#10b981',
              'fill-opacity': 0.3
            }
          },
          {
            'id': 'gl-draw-polygon-stroke-inactive',
            'type': 'line',
            'filter': ['all', ['==', 'active', 'false'], ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
            'layout': {
              'line-cap': 'round',
              'line-join': 'round'
            },
            'paint': {
              'line-color': '#10b981',
              'line-width': 2,
              'line-dasharray': [0.2, 2]
            }
          },
          {
            'id': 'gl-draw-polygon-stroke-active',
            'type': 'line',
            'filter': ['all', ['==', 'active', 'true'], ['==', '$type', 'Polygon']],
            'layout': {
              'line-cap': 'round',
              'line-join': 'round'
            },
            'paint': {
              'line-color': '#10b981',
              'line-width': 2
            }
          },
          {
            'id': 'gl-draw-polygon-midpoint',
            'type': 'circle',
            'filter': ['all', ['==', '$type', 'Point'], ['==', 'meta', 'midpoint']],
            'paint': {
              'circle-radius': 3,
              'circle-color': '#10b981'
            }
          },
          {
            'id': 'gl-draw-polygon-vertex',
            'type': 'circle',
            'filter': ['all', ['==', 'meta', 'vertex'], ['==', '$type', 'Point']],
            'paint': {
              'circle-radius': 4,
              'circle-color': '#10b981'
            }
          }
        ]
      });

      // Add Draw control to map
      mapRef.current.addControl(draw, 'top-left');
      drawRef.current = draw;

      // Handle draw.create event - convert polygon to square
      mapRef.current.on('draw.create', (e) => {
        handleDrawCreate(draw, e);
      });

      // Handle draw.update event (if user edits the polygon)
      mapRef.current.on('draw.update', (e) => {
        handleDrawCreate(draw, e);
      });

      // Handle draw.delete event - clear plot data
      mapRef.current.on('draw.delete', () => {
        setPlotData(null);
        setIsDrawing(false);
      });

      // Handle mode change
      mapRef.current.on('draw.modechange', (e) => {
        if (e.mode === 'draw_polygon') {
          setIsDrawing(true);
        } else if (e.mode === 'simple_select') {
          setIsDrawing(false);
        }
      });
    });

    // Cleanup function
    return () => {
      if (mapRef.current) {
        // Remove event listeners
        mapRef.current.off('draw.create');
        mapRef.current.off('draw.update');
        mapRef.current.off('draw.delete');
        mapRef.current.off('draw.modechange');

        mapRef.current.remove();
        mapRef.current = null;
        drawRef.current = null;
      }

      // Stop monitoring if component unmounts
      if (monitoringStopRef.current) {
        monitoringStopRef.current();
        monitoringStopRef.current = null;
      }
    };
  }, []);

  /**
   * Converts a drawn polygon to a perfect square (bounding box)
   * and calculates area and centroid using Turf.js
   */
  const handleDrawCreate = (draw, e) => {
    try {
      // Get all features from draw
      const features = draw.getAll();

      if (features.features.length === 0) {
        return;
      }

      // Get the first (and should be only) polygon feature
      const polygonFeature = features.features[0];

      if (!polygonFeature || polygonFeature.geometry.type !== 'Polygon') {
        return;
      }

      // Extract coordinates from polygon
      const coordinates = polygonFeature.geometry.coordinates[0];

      // Calculate bounding box to create a perfect square
      let minLng = coordinates[0][0];
      let maxLng = coordinates[0][0];
      let minLat = coordinates[0][1];
      let maxLat = coordinates[0][1];

      coordinates.forEach((coord) => {
        minLng = Math.min(minLng, coord[0]);
        maxLng = Math.max(maxLng, coord[0]);
        minLat = Math.min(minLat, coord[1]);
        maxLat = Math.max(maxLat, coord[1]);
      });

      // Calculate the side length to make it a perfect square
      const lngDiff = maxLng - minLng;
      const latDiff = maxLat - minLat;
      const sideLength = Math.max(lngDiff, latDiff);

      // Center point of the bounding box
      const centerLng = (minLng + maxLng) / 2;
      const centerLat = (minLat + maxLat) / 2;

      // Create square coordinates (half side length in each direction)
      const halfSideLng = sideLength / 2;
      const halfSideLat = sideLength / 2;

      // Calculate final square bounding box coordinates
      const finalMinLng = centerLng - halfSideLng;
      const finalMaxLng = centerLng + halfSideLng;
      const finalMinLat = centerLat - halfSideLat;
      const finalMaxLat = centerLat + halfSideLat;

      const squareCoordinates = [
        [finalMinLng, finalMinLat], // SW
        [finalMaxLng, finalMinLat], // SE
        [finalMaxLng, finalMaxLat], // NE
        [finalMinLng, finalMaxLat], // NW
        [finalMinLng, finalMinLat], // Close polygon
      ];

      // Create square GeoJSON feature
      const squareFeature = {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [squareCoordinates],
        },
        properties: {},
      };

      // Delete all existing features (ensure only one plot)
      draw.deleteAll();

      // Add the square polygon
      draw.add(squareFeature);

      // Calculate area using Turf.js (returns area in square meters)
      const areaSqMeters = turf.area(squareFeature);

      // Calculate centroid using Turf.js
      const centroidFeature = turf.centroid(squareFeature);
      const centroid = {
        lng: centroidFeature.geometry.coordinates[0],
        lat: centroidFeature.geometry.coordinates[1],
      };

      // Generate geoHash for backend (string representation of coordinates)
      // Format: "minLng,maxLng,minLat,maxLat" for easy parsing
      const geoHash = `${finalMinLng.toFixed(6)},${finalMaxLng.toFixed(6)},${finalMinLat.toFixed(6)},${finalMaxLat.toFixed(6)}`;

      // Store plot data in state with backend-required fields
      setPlotData({
        // Original data
        geojson: squareFeature,
        areaSqMeters,
        centroid,

        // Backend-required fields for registerForest
        area: areaSqMeters, // Area in square meters (as required by backend)
        geoHash: geoHash, // String representation of bounding box

        // Backend-required fields for getNDVI
        min_lon: finalMinLng,
        max_lon: finalMaxLng,
        min_lat: finalMinLat,
        max_lat: finalMaxLat,

        // Additional computed fields that might be useful
        areaHectares: areaSqMeters / 10000, // Convert to hectares (used in NDVI handler)
      });
    } catch (error) {
      console.error('Error processing draw:', error);
    }
  };

  /**
   * Toggle drawing mode
   */
  const toggleDrawing = () => {
    if (!drawRef.current || !mapRef.current) return;

    const currentMode = drawRef.current.getMode();

    if (currentMode === 'draw_polygon') {
      // Switch to simple_select mode (stop drawing)
      drawRef.current.changeMode('simple_select');
      setIsDrawing(false);
    } else {
      // Switch to draw_polygon mode
      drawRef.current.changeMode('draw_polygon');
      setIsDrawing(true);
    }
  };

  /**
   * Clear the drawn plot
   */
  const clearPlot = () => {
    if (!drawRef.current) return;
    drawRef.current.deleteAll();
    setPlotData(null);
    setIsDrawing(false);
  };

  /**
   * Handle form submission
   * Formats plotData according to backend requirements and submits to API
   * 
   * Backend expects:
   * - registerForest: { area (m²), geoHash (string) }
   * - getNDVI (for later): { forest_id, min_lon, max_lon, min_lat, max_lat, area_hectares, ... }
   */
  const handleSubmit = async () => {
    if (!plotData) {
      return;
    }

    if (!formData.name.trim()) {
      return;
    }

    if (!account) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare submission payload according to backend requirements
      // ForestHandler.registerForest expects: { area, geoHash }
      // Note: Smart contract expects integer area (whole square meters), not decimal
      const areaInteger = Math.floor(plotData.area); // Convert to integer (floor to avoid rounding up)

      const registrationPayload = {
        area: areaInteger, // Area in square meters as integer (required by smart contract)
        geoHash: plotData.geoHash, // String representation: "minLng,maxLng,minLat,maxLat"
      };

      console.log('Submitting forest registration:', registrationPayload);
      console.log('Area conversion:', {
        original: plotData.area,
        converted: areaInteger,
        unit: 'square meters (integer)'
      });
      console.log('Full plot data available:', {
        // For registration
        area: plotData.area,
        geoHash: plotData.geoHash,
        // For NDVI processing (to be used after registration with forest_id)
        ndviParams: {
          min_lon: plotData.min_lon,
          max_lon: plotData.max_lon,
          min_lat: plotData.min_lat,
          max_lat: plotData.max_lat,
          area_hectares: plotData.areaHectares,
        },
        // Additional data
        centroid: plotData.centroid,
        geojson: plotData.geojson,
      });

      // Call registerForest API with backend-required format
      // Note: area must be an integer for smart contract compatibility
      const response = await registerForest(
        areaInteger,
        plotData.geoHash,
        account
      );

      console.log('Forest registration successful:', response);

      // Extract forest ID from response
      const forestId = response.forest?.[0]?.forestId || response.forest?.forestId;

      if (!forestId) {
        console.error('Forest ID not found in response:', response);
        throw new Error('Forest registration succeeded but forest ID not found in response');
      }

      console.log('Forest ID received:', forestId);

      // Immediately call NDVI endpoint after registration
      console.log('Calling NDVI endpoint immediately after registration');
      try {
        await requestNDVI(
          forestId,
          plotData.min_lon,
          plotData.max_lon,
          plotData.min_lat,
          plotData.max_lat,
          {
            area_hectares: plotData.areaHectares,
            status: 'ACTIVE'
          }
        );
        console.log('Initial NDVI computation completed successfully');
      } catch (ndviError) {
        console.error('Error calling initial NDVI:', ndviError);
        // Don't throw - allow registration to succeed even if initial NDVI fails
        // The monitoring will retry later
      }

      // Start 3-hour monitoring for this forest
      console.log('Starting 3-hour NDVI monitoring');
      const stopMonitoring = startNDVIMonitoring(
        forestId,
        plotData.min_lon,
        plotData.max_lon,
        plotData.min_lat,
        plotData.max_lat,
        {
          area_hectares: plotData.areaHectares,
          status: 'ACTIVE'
        },
        (ndviData) => {
          console.log('NDVI update received from monitoring:', ndviData);
        },
        (error) => {
          console.error('NDVI monitoring error:', error);
        }
      );

      // Store the stop function (in case we need to stop it later)
      monitoringStopRef.current = stopMonitoring;



      // Clear the form and plot
      setPlotData(null);

      // Navigate to dashboard
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);

    } catch (error) {
      console.error('Error submitting forest registration:', error);
      setIsSubmitting(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'Tropical Rainforest',
    tags: ''
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-[#060010] text-gray-300 font-sans relative overflow-hidden"
    >
      {/* Background Layer: SquareGrid for technical feel */}
      <div className="fixed inset-0 z-0 opacity-40 pointer-events-none">
        <Squares
          direction="diagonal"
          speed={0.5}
          squareSize={50}
          borderColor="#ffffff10"
          hoverFillColor="#10b98110"
        />
      </div>

      {/* Dither Overlay for texture */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-20 mix-blend-overlay">
        <Dither
          colorNum={4}
          pixelSize={4}
          disableAnimation
          waveColor={[0, 0, 0]}
        />
      </div>

      <main className="relative z-10 p-6 md:p-12 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Header Section */}
        <motion.div

          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="lg:col-span-12 space-y-2 border-l-2 border-emerald-500 pl-4"
        >
          <h1 className="text-3xl font-light text-white tracking-wide">Protocol Registration</h1>
          <p className="text-sm text-gray-500">Define a new ecological asset for satellite monitoring.</p>
        </motion.div>

        {/* Left Column: Map & Context */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="lg:col-span-8 flex flex-col gap-6"
        >
          {/* Wallet Status */}
          <div className="bg-[#11141a]/90 backdrop-blur-md border border-white/10 rounded-sm p-4 flex justify-between items-center shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-gradient-to-br from-emerald-900/50 to-gray-900 border border-white/10 flex items-center justify-center">
                <IconWallet className="w-4 h-4 text-emerald-500" />
              </div>
              <div>
                <div className="text-[10px] font-mono text-emerald-500 font-medium">
                  {account ? 'WALLET CONNECTED' : 'WALLET NOT CONNECTED'}
                </div>
                <div className="text-xs font-mono text-gray-300">
                  {account ? `${account.substring(0, 6)}...${account.substring(account.length - 4)}` : 'Please connect wallet'}
                </div>
              </div>
            </div>
            {authStatus === true ? (
              <div className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded text-[10px] text-emerald-500 font-medium uppercase tracking-wider flex items-center gap-1">
                <IconCheck className="w-3 h-3" /> Authenticated
              </div>
            ) : authStatus === false ? (
              <div className="px-2 py-1 bg-amber-500/10 border border-amber-500/20 rounded text-[10px] text-amber-500 font-medium uppercase tracking-wider flex items-center gap-1">
                ⚠ Not Authenticated
              </div>
            ) : null}
          </div>

          {/* Authentication Warning */}
          {authStatus === false && account && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-sm p-4 space-y-2">
              <div className="text-xs font-mono text-amber-400 font-medium uppercase tracking-wider">
                ⚠ Authentication Required
              </div>
              <p className="text-xs text-gray-400">
                Please sign in before registering a forest. Go to the{' '}
                <a href="/" className="text-emerald-400 hover:text-emerald-300 underline">
                  landing page
                </a>
                {' '}to connect your wallet and sign the authentication message.
              </p>
            </div>
          )}

          {/* Map Container */}
          <div className="relative aspect-[16/9] w-full bg-[#0b0f14] border border-white/10 rounded-sm overflow-hidden shadow-2xl group">
            {mapboxgl.accessToken ? (
              <div ref={mapContainerRef} className="w-full h-full" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-[#05080c] relative overflow-hidden">
                {/* Fallback Grid Background */}
                <div className="absolute inset-0 opacity-20 pointer-events-none">
                  <Squares direction="diagonal" speed={0.2} squareSize={40} borderColor="#ef4444" hoverFillColor="#ef4444" />
                </div>

                <div className="z-10 text-center p-8 max-w-md border border-red-500/30 bg-red-500/5 rounded backdrop-blur-sm">
                  <div className="text-red-500 mb-4 flex justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="12"></line>
                      <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                  </div>
                  <h3 className="text-xl font-mono text-red-500 mb-2 uppercase tracking-wide">Mapbox Token Missing</h3>
                  <p className="text-gray-400 text-sm font-light">
                    The Mapbox public access token is not available in the production environment.
                    Please configure <code className="bg-white/10 px-1 py-0.5 rounded text-white">VITE_MAPBOX_TOKEN</code> in your environment variables to enable the satellite interface.
                  </p>
                </div>
              </div>
            )}
            {/* Map overlay elements */}
            <div className="absolute top-4 left-10 bg-black/50 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-sm z-10">
              <span className="text-[10px] font-mono text-emerald-500 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                LIVE SATELLITE FEED
              </span>
            </div>

            {/* Draw Plot Controls */}
            <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
              <button
                onClick={toggleDrawing}
                className={`px-4 py-2 text-xs font-mono uppercase tracking-wider rounded-sm backdrop-blur-md border transition-all ${isDrawing
                  ? 'bg-emerald-600/30 border-emerald-500/50 text-emerald-400 hover:bg-emerald-600/40'
                  : 'bg-black/50 border-white/10 text-gray-300 hover:border-emerald-500/30 hover:text-emerald-400'
                  }`}
              >
                {isDrawing ? 'Stop Drawing' : 'Draw Plot'}
              </button>
              {plotData && (
                <button
                  onClick={clearPlot}
                  className="px-4 py-2 text-xs font-mono uppercase tracking-wider rounded-sm backdrop-blur-md border border-white/10 text-gray-400 hover:border-red-500/30 hover:text-red-400 bg-black/50 transition-all"
                >
                  Clear Plot
                </button>
              )}
            </div>
          </div>

          {/* Plot Info Display */}
          {plotData && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <PlotInfo plotData={plotData} />
            </motion.div>
          )}
        </motion.div>

        {/* Right Column: Form Data */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="lg:col-span-4 space-y-6"
        >
          <div className="bg-[#11141a]/90 backdrop-blur-md border border-white/10 rounded-sm p-6 space-y-6 shadow-lg">
            <h2 className="text-sm font-medium text-white border-b border-white/5 pb-2">Asset Metadata</h2>

            <div className="space-y-4">
              <div>
                <SectionLabel required>Forest Name</SectionLabel>
                <InputField
                  placeholder="e.g. Sector 7 Alpha"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div>
                <SectionLabel required>Ecosystem</SectionLabel>
                <div className="relative">
                  <select
                    className="w-full appearance-none bg-[#0b0f14]/80 border border-white/10 text-gray-200 rounded-sm px-3 py-2 text-sm font-light focus:border-emerald-500/50 outline-none backdrop-blur-sm"
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                  >
                    <option>Tropical Rainforest</option>
                    <option>Temperate Forest</option>
                    <option>Mangrove</option>
                    <option>Boreal</option>
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 text-[10px]">▼</div>
                </div>
              </div>

              <div>
                <SectionLabel>Description</SectionLabel>
                <textarea
                  className="w-full bg-[#0b0f14]/80 border border-white/10 text-gray-200 rounded-sm px-3 py-2 text-sm font-light min-h-[100px] focus:border-emerald-500/50 outline-none resize-y backdrop-blur-sm"
                  placeholder="Terrain details..."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </div>

            <div className="pt-4 border-t border-white/5 space-y-3">
              {!plotData && (
                <div className="text-[10px] text-amber-500/70 font-mono text-center py-2 px-3 bg-amber-500/10 border border-amber-500/20 rounded-sm">
                  ⚠ Draw a plot on the map to proceed
                </div>
              )}
              {!account && (
                <div className="text-[10px] text-amber-500/70 font-mono text-center py-2 px-3 bg-amber-500/10 border border-amber-500/20 rounded-sm">
                  ⚠ Connect wallet to register
                </div>
              )}
              <button
                onClick={handleSubmit}
                disabled={!plotData || !account || isSubmitting}
                className={`w-full py-3 text-xs font-mono uppercase tracking-wider rounded-sm transition-all ${plotData && account && !isSubmitting
                  ? 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-500 hover:text-emerald-400 border border-emerald-500/50 hover:border-emerald-400'
                  : 'bg-gray-800/20 text-gray-600 border border-gray-700/30 cursor-not-allowed'
                  }`}
              >
                {isSubmitting ? 'Registering...' : 'Initialize Registration'}
              </button>
              <p className="text-[10px] text-gray-500 text-center">
                Gas fees apply for on-chain proof.
              </p>
            </div>
          </div>
        </motion.div>

      </main>
    </motion.div>
  );
}

export default ForestRegister;