import React, { useState, useRef, useEffect } from 'react';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import { motion } from 'framer-motion';
import Squares from '../components/SquareGrid';
import Dither from '../components/DitherBackground';
import PlotInfo from '../components/PlotInfo';
import { useWallet } from '../contexts/WalletContext';
import mapboxgl from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import * as turf from '@turf/turf';
import { useNavigate, useParams } from 'react-router-dom';
import { showToast } from '../utils/toast';
import { fetchOrganisationById } from '../ApiFactory/OrganisationAPI';


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

const OrgForestRegister = () => {
    const { account } = useWallet();
    const navigate = useNavigate();
    const mapContainerRef = useRef(null);
    const mapRef = useRef(null);
    const drawRef = useRef(null);
    const {orgId} = useParams();
    // State
    const [plotData, setPlotData] = useState(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [authStatus, setAuthStatus] = useState(null);
    const [organisation, setOrganisation] = useState(null);
    const [orgLoading, setOrgLoading] = useState(false);
    useEffect(() => {
        if (!orgId) return;
        
        const fetchOrg = async () => {
            setOrgLoading(true);
            console.log("Fetching orgdetails from orgforestregister.jsx");
            try{
                const response = await fetchOrganisationById(account || null, orgId);
                console.log("Organisation fetched successfully:", response);
                // Handle response structure - could be { organisation, members } or just the organisation object
                if (response.organisation) {
                    setOrganisation(response.organisation);
                } else {
                    setOrganisation(response);
                }
                setOrgLoading(false);
            }catch(err){
                console.error('Error fetching the orgs from orgforestregister.jsx:', err);
                setOrgLoading(false);
                // Only show error if it's not a connection refused (server might not be running)
                if (err.message && !err.message.includes('Failed to fetch') && !err.message.includes('ERR_CONNECTION_REFUSED')) {
                    showToast.error('Failed to load organization details');
                }
            }
        };
        
        fetchOrg();
    }, [orgId, account]); // Include both dependencies - account will be null initially, then string

    // Org Voting Mock Data
    const [votingMembers, setVotingMembers] = useState([
        { id: 1, name: 'Alice Walker', role: 'Owner', status: 'VOTED', avatar: 'https://i.pravatar.cc/150?u=a' },
        { id: 2, name: 'Bob Smith', role: 'Member', status: 'VOTED', avatar: 'https://i.pravatar.cc/150?u=b' },
        { id: 3, name: 'Charlie Day', role: 'Member', status: 'PENDING', avatar: 'https://i.pravatar.cc/150?u=c' },
        { id: 4, name: 'Danaerys T.', role: 'Member', status: 'PENDING', avatar: 'https://i.pravatar.cc/150?u=d' },
        { id: 5, name: 'Elon M.', role: 'Member', status: 'REJECTED', avatar: 'https://i.pravatar.cc/150?u=e' },
    ]);

    // Check authentication
    useEffect(() => {
        if (!account) { setAuthStatus(false); return; }
        const storedAuth = localStorage.getItem(`canopy_auth_${account.toLowerCase()}`);
        if (!storedAuth) { setAuthStatus(false); return; }
        try {
            const authData = JSON.parse(storedAuth);
            if (authData.signature && authData.message) setAuthStatus(true);
            else setAuthStatus(false);
        } catch { setAuthStatus(false); }
    }, [account]);

    // Map Initialization
    useEffect(() => {
        if (!mapContainerRef.current || mapRef.current || !mapboxgl.accessToken) return;

        mapRef.current = new mapboxgl.Map({
            container: mapContainerRef.current,
            style: 'mapbox://styles/mapbox/dark-v11',
            center: [-62.2159, -3.4653],
            zoom: 3.5,
            pitch: 45,
            bearing: -17,
            antialias: true,
        });

        mapRef.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
        mapRef.current.addControl(new mapboxgl.GeolocateControl({
            positionOptions: { enableHighAccuracy: true },
            trackUserLocation: true,
            showUserHeading: true
        }), 'top-right');

        mapRef.current.on('load', () => {
            const draw = new MapboxDraw({
                displayControlsDefault: false,
                controls: { polygon: true, trash: true },
                defaultMode: 'draw_polygon',
                styles: [
                    // Simplified styles for brevity - reusing theme
                    { 'id': 'gl-draw-polygon-fill-inactive', 'type': 'fill', 'filter': ['all', ['==', 'active', 'false'], ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']], 'paint': { 'fill-color': '#10b981', 'fill-opacity': 0.2 } },
                    { 'id': 'gl-draw-polygon-fill-active', 'type': 'fill', 'filter': ['all', ['==', 'active', 'true'], ['==', '$type', 'Polygon']], 'paint': { 'fill-color': '#10b981', 'fill-opacity': 0.3 } },
                    { 'id': 'gl-draw-polygon-stroke-inactive', 'type': 'line', 'filter': ['all', ['==', 'active', 'false'], ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']], 'layout': { 'line-cap': 'round', 'line-join': 'round' }, 'paint': { 'line-color': '#10b981', 'line-width': 2, 'line-dasharray': [0.2, 2] } },
                    { 'id': 'gl-draw-polygon-stroke-active', 'type': 'line', 'filter': ['all', ['==', 'active', 'true'], ['==', '$type', 'Polygon']], 'layout': { 'line-cap': 'round', 'line-join': 'round' }, 'paint': { 'line-color': '#10b981', 'line-width': 2 } },
                    { 'id': 'gl-draw-polygon-midpoint', 'type': 'circle', 'filter': ['all', ['==', '$type', 'Point'], ['==', 'meta', 'midpoint']], 'paint': { 'circle-radius': 3, 'circle-color': '#10b981' } },
                    { 'id': 'gl-draw-polygon-vertex', 'type': 'circle', 'filter': ['all', ['==', 'meta', 'vertex'], ['==', '$type', 'Point']], 'paint': { 'circle-radius': 4, 'circle-color': '#10b981' } }
                ]
            });

            mapRef.current.addControl(draw, 'top-left');
            drawRef.current = draw;

            const handleDraw = (e) => {
                handleDrawCreate(draw, e);
            }

            mapRef.current.on('draw.create', handleDraw);
            mapRef.current.on('draw.update', handleDraw);
            mapRef.current.on('draw.delete', () => { setPlotData(null); setIsDrawing(false); });
            mapRef.current.on('draw.modechange', (e) => setIsDrawing(e.mode === 'draw_polygon'));
        });

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, []);

    const handleDrawCreate = (draw, e) => {
        const features = draw.getAll();
        if (features.features.length === 0) return;
        const polygonFeature = features.features[0];
        if (!polygonFeature || polygonFeature.geometry.type !== 'Polygon') return;

        const coordinates = polygonFeature.geometry.coordinates[0];
        // Bounding box logic
        let minLng = coordinates[0][0], maxLng = coordinates[0][0], minLat = coordinates[0][1], maxLat = coordinates[0][1];
        coordinates.forEach(c => {
            minLng = Math.min(minLng, c[0]); maxLng = Math.max(maxLng, c[0]); minLat = Math.min(minLat, c[1]); maxLat = Math.max(maxLat, c[1]);
        });

        // Make it a square
        const side = Math.max(maxLng - minLng, maxLat - minLat);
        const centerLng = (minLng + maxLng) / 2, centerLat = (minLat + maxLat) / 2;
        const half = side / 2;

        const squareCoords = [[centerLng - half, centerLat - half], [centerLng + half, centerLat - half], [centerLng + half, centerLat + half], [centerLng - half, centerLat + half], [centerLng - half, centerLat - half]];
        const squareFeature = { type: 'Feature', geometry: { type: 'Polygon', coordinates: [squareCoords] }, properties: {} };

        draw.deleteAll();
        draw.add(squareFeature);

        setPlotData({
            geojson: squareFeature,
            areaSqMeters: turf.area(squareFeature),
            centroid: { lng: centerLng, lat: centerLat },
            geoHash: `${(centerLng - half).toFixed(6)},${(centerLng + half).toFixed(6)},${(centerLat - half).toFixed(6)},${(centerLat + half).toFixed(6)}`
        });
    };

    const toggleDrawing = () => {
        if (!drawRef.current) return;
        drawRef.current.changeMode(drawRef.current.getMode() === 'draw_polygon' ? 'simple_select' : 'draw_polygon');
    };

    const handleSubmit = async () => {
        if (!plotData) { showToast.warning('Draw a plot first.'); return; }
        setIsSubmitting(true);
        // Simulate org submission
        setTimeout(() => {
            showToast.success('Proposal Created! Voting initiated.');
            setIsSubmitting(false);
            navigate('/organisation');
        }, 1500);
    };

    const [formData, setFormData] = useState({ name: '', description: '', type: 'Tropical Rainforest' });

    return (
        <div className="min-h-screen bg-[#060010] text-gray-300 font-sans relative overflow-hidden flex flex-col">
            {/* Backgrounds */}
            <div className="fixed inset-0 z-0 opacity-40 pointer-events-none"><Squares direction="diagonal" speed={0.5} squareSize={50} borderColor="#ffffff10" hoverFillColor="#10b98110" /></div>
            <div className="fixed inset-0 z-0 pointer-events-none opacity-20 mix-blend-overlay"><Dither colorNum={4} pixelSize={4} disableAnimation waveColor={[0, 0, 0]} /></div>

            <main className="relative z-10 p-6 md:p-8 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Left Col: Map (Span 8) */}
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-8 flex flex-col gap-4">
                    <div className="flex justify-between items-end border-b border-emerald-500/30 pb-4 mb-2">
                        <div>
                            <h1 className="text-2xl font-light text-white tracking-wide">Protocol Registration <span className="text-emerald-500 font-mono text-sm ml-2">DAO MODEL</span></h1>
                            <p className="text-sm text-gray-500">Register ecological asset on behalf of Organization.</p>
                        </div>
                        <div className="text-right hidden sm:block">
                            <div className="text-[10px] font-mono text-gray-400">ORGANIZATION</div>
                            <div className="text-white font-medium">{organisation?.name}</div>
                        </div>
                    </div>

                    {/* Map */}
                    <div className="relative aspect-[16/9] w-full bg-[#0b0f14] border border-white/10 rounded-sm overflow-hidden shadow-2xl group flex-1 min-h-[400px]">
                        <div ref={mapContainerRef} className="w-full h-full" />
                        <div className="absolute top-4 left-4 bg-black/50 backdrop-blur border border-white/10 px-3 py-1.5 rounded-sm z-10 flex gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mt-1"></span>
                            <span className="text-[10px] font-mono text-emerald-500">LIVE SATELLITE FEED</span>
                        </div>
                        <div className="absolute top-4 right-14 flex flex-col gap-2 z-10">
                            <button onClick={toggleDrawing} className={`px-4 py-2 text-xs font-mono uppercase tracking-wider rounded-sm backdrop-blur-md border transition-all ${isDrawing ? 'bg-emerald-600/30 border-emerald-500/50 text-emerald-400' : 'bg-black/50 border-white/10 text-gray-300'}`}>
                                {isDrawing ? 'Stop Drawing' : 'Draw Plot'}
                            </button>
                        </div>
                    </div>

                    {plotData && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                            <PlotInfo plotData={plotData} />
                        </motion.div>
                    )}
                </motion.div>

                {/* Right Col: DAO Voting & Form (Span 4) */}
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-4 space-y-4 flex flex-col h-full">

                    {/* Asset Metadata Form */}
                    <div className="bg-[#11141a]/90 backdrop-blur-md border border-white/10 rounded-sm p-5 space-y-4 shadow-lg shrink-0">
                        <h2 className="text-xs font-mono text-emerald-500 uppercase tracking-wider border-b border-white/5 pb-2">Poll Proposal Details</h2>
                        <div className="space-y-3">
                            <div>
                                <SectionLabel required>Proposal Title / Forest Name</SectionLabel>
                                <InputField placeholder="e.g. Amazonia Sector 4 Expansion" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div>
                                <SectionLabel>Description</SectionLabel>
                                <textarea className="w-full bg-[#0b0f14]/80 border border-white/10 text-gray-200 rounded-sm px-3 py-2 text-sm font-light min-h-[60px] focus:border-emerald-500/50 outline-none resize-none backdrop-blur-sm"
                                    placeholder="Rationale for registration..."
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Voting Members Side Panel */}
                    <div className="bg-[#11141a]/90 backdrop-blur-md border border-white/10 rounded-sm p-5 shadow-lg flex-1 flex flex-col min-h-0 overflow-hidden">
                        <div className="flex justify-between items-center border-b border-white/5 pb-3">
                            <h2 className="text-xs font-mono text-emerald-500 uppercase tracking-wider">DAO Consensus</h2>
                            <div className="text-[10px] text-gray-500 font-mono">2/5 VOTED</div>
                        </div>

                        <div className="flex-1 overflow-y-auto scrollbar-hide py-3 space-y-2">
                            {votingMembers.map((member) => (
                                <div key={member.id} className="flex items-center justify-between p-2 rounded hover:bg-white/5 transition-colors group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gray-800 overflow-hidden border border-white/10 relative">
                                            <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                                            {/* Status Dot */}
                                            <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#11141a] ${member.status === 'VOTED' ? 'bg-emerald-500' :
                                                    member.status === 'REJECTED' ? 'bg-red-500' : 'bg-gray-500'
                                                }`} ></div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-gray-200 font-medium group-hover:text-emerald-400 transition-colors">{member.name}</div>
                                            <div className="text-[10px] text-gray-500 font-mono flex items-center gap-1">
                                                {member.role.toUpperCase()}
                                            </div>
                                        </div>
                                    </div>
                                    <div className={`text-[10px] font-mono px-2 py-0.5 rounded border ${member.status === 'VOTED' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                            member.status === 'REJECTED' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                                'bg-white/5 text-gray-500 border-white/10'
                                        }`}>
                                        {member.status}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="pt-3 border-t border-white/5">
                            {/* Progress Bar */}
                            <div className="flex justify-between text-[10px] text-gray-500 mb-1 font-mono">
                                <span>CONSENSUS REQUIRED</span>
                                <span>40%</span>
                            </div>
                            <div className="h-1 bg-white/10 rounded-full overflow-hidden mb-4">
                                <div className="h-full bg-emerald-500 w-[40%]"></div>
                            </div>

                            <button
                                onClick={handleSubmit}
                                disabled={!plotData || isSubmitting}
                                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-medium text-xs font-mono rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider"
                            >
                                {isSubmitting ? 'INITIATING...' : 'SUBMIT PROPOSAL'}
                            </button>
                        </div>
                    </div>

                </motion.div>
            </main>
        </div>
    );
};

export default OrgForestRegister;
