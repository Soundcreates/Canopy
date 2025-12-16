import React, { useState, useRef, useEffect } from 'react';
import 'mapbox-gl/dist/mapbox-gl.css';
import { motion } from 'framer-motion';
import Squares from '../components/SquareGrid';
import Dither from '../components/DitherBackground';
import { registerForest } from '../ApiFactory/ForestAPI';
import mapboxgl from 'mapbox-gl';

//if you need to run the mapbox map, u need to have a mapbox account which provides a public access token
//mapbox is free for limited usage , just need to signup using a card
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN?.trim()  ;
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

  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    if(!import.meta.env.VITE_MAPBOX_TOKEN){
      console.error('Mapbox access token is not set in env');
      return;
    }else{
      console.log('Mapbox access token is set in env: ', import.meta.env.VITE_MAPBOX_TOKEN);
    }
    // Ensure access token is set
    if (!mapboxgl.accessToken) {
      console.error('Mapbox access token is not set');
      return;
    }

    // Initialize map
    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [-62.2159, -3.4653],
      zoom: 3.5,
      pitch: 45,
      bearing: -17,
      antialias: true,
    });

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

    // Cleanup function
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'Tropical Rainforest',
    tags: ''
  });

  return (
    <div className="min-h-screen bg-[#060010] text-gray-300 font-sans relative overflow-hidden">
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
                <div className="text-[10px] font-mono text-emerald-500 font-medium">VERIFIED REGISTRAR</div>
                <div className="text-xs font-mono text-gray-300">0x71C...92F1</div>
              </div>
            </div>
            <div className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded text-[10px] text-emerald-500 font-medium uppercase tracking-wider flex items-center gap-1">
              <IconCheck className="w-3 h-3" /> Active
            </div>
          </div>

          {/* Map Container */}
          <div className="relative aspect-[16/9] w-full bg-[#0b0f14] border border-white/10 rounded-sm overflow-hidden shadow-2xl group">
            <div ref={mapContainerRef} className="w-full h-full" />
            {/* Map overlay elements */}
            <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-sm z-10">
              <span className="text-[10px] font-mono text-emerald-500 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                LIVE SATELLITE FEED
              </span>
            </div>
          </div>
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

            <div className="pt-4 border-t border-white/5">
              <button className="w-full py-3 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-500 hover:text-emerald-400 border border-emerald-500/50 hover:border-emerald-400 rounded-sm text-xs font-mono uppercase tracking-wider transition-all">
                Initialize Registration
              </button>
              <p className="text-[10px] text-gray-500 text-center mt-3">
                Gas fees apply for on-chain proof.
              </p>
            </div>
          </div>
        </motion.div>

      </main>
    </div>
  );
}

export default ForestRegister;