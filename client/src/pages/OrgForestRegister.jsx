import React, { useState, useRef, useEffect, useMemo } from 'react';
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
import { fetchOrganisationById } from '../ApiFactory/OrganisationAPI';
import { createRegistrationSession, getActiveRegistrationSession, endRegistrationSession } from '../ApiFactory/RegistrationSessionAPI';
import { useWebSocket } from '../hooks/useWebSocket';


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
    const { orgId } = useParams();
    // State
    const [plotData, setPlotData] = useState(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [authStatus, setAuthStatus] = useState(null);
    const [organisation, setOrganisation] = useState(null);
    const [orgLoading, setOrgLoading] = useState(false);
    const [sessionId, setSessionId] = useState(null);
    const [isOwner, setIsOwner] = useState(false);

    // Determine if current user is owner
    const checkIsOwner = useMemo(() => {
        if (!organisation || !account) return false;
        return organisation.owner?.toLowerCase() === account.toLowerCase() ||
            organisation.role === 'owner';
    }, [organisation, account]);
    useEffect(() => {
        if (!orgId) return;

        const fetchOrg = async () => {
            setOrgLoading(true);
            console.log("Fetching orgdetails from orgforestregister.jsx");
            try {
                const response = await fetchOrganisationById(account || null, orgId);
                console.log("Organisation fetched successfully:", response);
                // Handle response structure - could be { organisation, members } or just the organisation object
                if (response.organisation) {
                    setOrganisation({ ...response.organisation, members: response.members || [] });
                } else {
                    setOrganisation(response);
                }
                setOrgLoading(false);
            } catch (err) {
                console.error('Error fetching the orgs from orgforestregister.jsx:', err);
                setOrgLoading(false);
                // Only show error if it's not a connection refused (server might not be running)
                // Error handling removed - no toast
            }
        };

        fetchOrg();
    }, [orgId, account]); // Include both dependencies - account will be null initially, then string

    // Create registration session when owner loads page
    // Create registration session when owner loads page, or fetch for members
    useEffect(() => {
        if (!orgId || !account || !organisation) return;
        if (sessionId) return; // Already have session

        const handleSession = async () => {
            if (checkIsOwner) {
                // For owner: Try to get active session first, else create
                try {
                    console.log("Checking for existing active session for owner");
                    try {
                        const active = await getActiveRegistrationSession(orgId);
                        if (active.success && active.session) {
                            setSessionId(active.session.sessionId);
                            setIsOwner(true);
                            console.log("Found existing active session:", active.session.sessionId);
                            return;
                        }
                    } catch (e) {
                        // ignore, create new
                    }

                    console.log("Creating new registration session for owner");
                    const response = await createRegistrationSession(parseInt(orgId), account);
                    if (response.success && response.session) {
                        setSessionId(response.session.sessionId);
                        setIsOwner(true);
                        console.log("Registration session created:", response.session.sessionId);
                    }
                } catch (err) {
                    console.error("Error managing registration session:", err);
                }
            } else {
                // For member: Fetch active session
                try {
                    console.log("Fetching active session for member");
                    const response = await getActiveRegistrationSession(orgId);
                    if (response.success && response.session) {
                        setSessionId(response.session.sessionId);
                        console.log("Joined active session:", response.session.sessionId);
                    } else {
                        console.log("No active session found for member");
                    }
                } catch (err) {
                    console.error("Error fetching active session:", err);
                }
            }
        };

        handleSession();
    }, [orgId, account, organisation, checkIsOwner, sessionId]);

    // Initialize WebSocket connection
    const {
        isConnected,
        plotData: wsPlotData,
        votes,
        members: wsMembers,
        votingStatus,
        sendPlotUpdate,
        sendMapUpdate,
        mapState,
        submitVote
    } = useWebSocket(sessionId, parseInt(orgId), account, isOwner);

    // Update plot data from WebSocket
    useEffect(() => {
        if (wsPlotData && !isOwner) {
            // If not owner, update plot from WebSocket
            setPlotData(wsPlotData);
            // Update map if it exists
            if (mapRef.current && drawRef.current && wsPlotData.geojson) {
                drawRef.current.deleteAll();
                drawRef.current.add(wsPlotData.geojson);
            }
        }
    }, [wsPlotData, isOwner]);

    // Broadcast Map State (Owner) & Sync Map State (Member)
    useEffect(() => {
        if (!mapRef.current) return;

        const map = mapRef.current;

        if (isOwner) {
            // Owner broadcasts movements
            const handleMoveEnd = () => {
                if (sendMapUpdate) {
                    sendMapUpdate({
                        center: map.getCenter(),
                        zoom: map.getZoom(),
                        pitch: map.getPitch(),
                        bearing: map.getBearing()
                    });
                }
            };

            map.on('moveend', handleMoveEnd);
            return () => map.off('moveend', handleMoveEnd);
        } else {
            // Member syncs
            if (mapState) {
                map.flyTo({
                    center: mapState.center,
                    zoom: mapState.zoom,
                    pitch: mapState.pitch,
                    bearing: mapState.bearing,
                    essential: true
                });
            }
        }
    }, [isOwner, sendMapUpdate, mapState]);

    // Get voting members from organization and WebSocket
    const votingMembers = useMemo(() => {
        if (!organisation?.members) return [];

        // Identify owner logic
        const ownerAddress = organisation.owner?.toLowerCase();

        // Ensure owner is always in the list, even if not explicitly in members array (though createOrg logic adds them)
        // If members array is populated from backend, owner should be there.

        let membersList = [...organisation.members];

        // Safety check: if owner not potentially in list? 
        // Backend `getOrganisationById` returns all members.

        return membersList.filter(member => {
            // Filter to show only connected members (User Request: "other user haven't joined... still showing")
            // Also keep self
            const isConnected = wsMembers.some(m => m.address === member.userAddress) ||
                (member.userAddress === account?.toLowerCase());
            return isConnected;
        }).map(member => {
            const vote = votes.get(member.userAddress);

            // Check connection again (it's true due to filter but good for logic flow)
            const isConnected = wsMembers.some(m => m.address === member.userAddress) ||
                (member.userAddress === account?.toLowerCase());

            let status = 'PENDING';
            if (vote) {
                status = vote.vote === 'approve' ? 'VOTED' : 'REJECTED';
            }

            return {
                id: member.id || member.userAddress,
                name: member.userAddress?.slice(0, 6) + '...' + member.userAddress?.slice(-4) || 'Unknown',
                address: member.userAddress,
                role: (member.role === 'owner' || member.userAddress === ownerAddress) ? 'Owner' : 'Member',
                status: status,
                isConnected: isConnected,
                avatar: `https://i.pravatar.cc/150?u=${member.userAddress}`
            };
        }).sort((a, b) => {
            // Sort owner to top
            if (a.role === 'Owner') return -1;
            if (b.role === 'Owner') return 1;
            return 0;
        });
    }, [organisation?.members, votes, wsMembers, account, organisation?.owner]);

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
            } catch (e) {
                console.error("Error creating mapbox instance", e);
                return;
            }
        } else {
            return;
        }

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

        const newPlotData = {
            geojson: squareFeature,
            areaSqMeters: turf.area(squareFeature),
            centroid: { lng: centerLng, lat: centerLat },
            geoHash: `${(centerLng - half).toFixed(6)},${(centerLng + half).toFixed(6)},${(centerLat - half).toFixed(6)},${(centerLat + half).toFixed(6)}`
        };

        setPlotData(newPlotData);

        // Broadcast plot update via WebSocket (only if owner)
        if (isOwner && isConnected && sendPlotUpdate) {
            sendPlotUpdate(newPlotData);
        }
    };

    const toggleDrawing = () => {
        if (!drawRef.current) return;
        const currentMode = drawRef.current.getMode();
        const newMode = currentMode === 'draw_polygon' ? 'simple_select' : 'draw_polygon';
        drawRef.current.changeMode(newMode);
        setIsDrawing(newMode === 'draw_polygon');
    };

    const handleExit = async () => {
        if (isOwner) {
            if (window.confirm("Are you sure you want to exit? Since you are the owner, this will END the session for everyone.")) {
                try {
                    if (sessionId) {
                        await endRegistrationSession(sessionId, account);
                        // Send WebSocket message if possible? WS will disconnect on navigation anyway.
                        // Backend endSession updates DB state to isActive: false.
                    }
                } catch (err) {
                    console.error("Error ending session:", err);
                }
                navigate('/organisation');
            }
        } else {
            // For members, just leave
            if (window.confirm("Are you sure you want to leave the session?")) {
                navigate('/organisation');
            }
        }
    };

    const handleSubmit = async () => {
        if (!plotData) { return; }
        if (!votingStatus || votingStatus.result !== 'approved') {
            console.log('Voting not complete or not approved yet');
            return;
        }

        setIsSubmitting(true);

        try {
            // DAO contract voting is now integrated:
            // 1. On-chain proposal is created automatically when room is created
            // 2. On-chain votes are cast automatically when users vote in real-time
            // 3. Proposal ID is available in votingStatus for execution if needed

            console.log('Voting approved, proceeding with registration...');
            console.log('Plot data:', plotData);
            console.log('Form data:', formData);

            // Simulate registration process
            // In production, this would call the forest registration API
            // which would then interact with the smart contract

            setTimeout(() => {
                setIsSubmitting(false);
                navigate('/organisation');
            }, 2000);
        } catch (error) {
            console.error('Error submitting proposal:', error);
            setIsSubmitting(false);
        }
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
                        {mapboxgl.accessToken ? (
                            <div ref={mapContainerRef} className="w-full h-full" />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-[#05080c] relative overflow-hidden">
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
                                        The Mapbox public access token is not available. Please add <code className="bg-white/10 px-1 py-0.5 rounded text-white">VITE_MAPBOX_TOKEN</code> to your environment configuration to enable satellite views.
                                    </p>
                                </div>
                            </div>
                        )}
                        <div className="absolute top-4 left-4 bg-black/50 backdrop-blur border border-white/10 px-3 py-1.5 rounded-sm z-10 flex gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mt-1"></span>
                            <span className="text-[10px] font-mono text-emerald-500">LIVE SATELLITE FEED</span>
                        </div>
                        <div className="absolute top-4 right-14 flex flex-col gap-2 z-10">
                            <button
                                onClick={toggleDrawing}
                                className={`px-4 py-2 text-xs font-mono uppercase tracking-wider rounded-sm backdrop-blur-md border transition-all shadow-lg ${isDrawing
                                    ? 'bg-emerald-500 border-emerald-400 text-black shadow-emerald-500/20 font-bold'
                                    : 'bg-black/50 border-white/10 text-gray-300 hover:bg-black/70'
                                    }`}
                            >
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
                    <div className="bg-[#11141a]/90 backdrop-blur-md border border-white/10 rounded-sm p-5 shadow-lg flex-1 flex flex-col min-h-0 overflow-hidden relative">
                        {/* Exit Button at bottom right specific to this container or global page?
                            User said "At the bottom right of the page". 
                            But this layout is a grid. putting it at page bottom right might be outside grid.
                            Let's interpret "bottom right of the page" (fixed) or "bottom right of the voting panel".
                            Usually users want it in the workflow panel.
                            Actually, let's put it fixed at bottom right of screen or bottom of panel.
                            "Exit where when the owner clicks on the Exit...".
                            I'll place it in the bottom right of the panel for better UX, or fixed.
                            Let's try bottom of panel FIRST, but make it distinct.
                        */}

                        <div className="flex justify-between items-center border-b border-white/5 pb-3">
                            <h2 className="text-xs font-mono text-emerald-500 uppercase tracking-wider">DAO Consensus</h2>
                            <div className="flex items-center gap-2">
                                {isConnected && (
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                )}
                                <div className="text-[10px] text-gray-500 font-mono">
                                    {votingStatus ? `${votingStatus.votesCount}/${votingStatus.totalMembers} VOTED` : '0/0 VOTED'}
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto scrollbar-hide py-3 space-y-2 mb-12">
                            {/* mb-12 to make space for fixed button if inside, or just flow */}
                            {votingMembers.map((member) => (
                                <div key={member.id} className="flex items-center justify-between p-2 rounded hover:bg-white/5 transition-colors group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gray-800 overflow-hidden border border-white/10 relative">
                                            <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                                            {/* Status Dot */}
                                            <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#11141a] ${member.status === 'VOTED' ? 'bg-emerald-500' :
                                                member.status === 'REJECTED' ? 'bg-red-500' :
                                                    member.isConnected ? 'bg-emerald-500' : 'bg-gray-500'
                                                }`} ></div>
                                            {/* Logic: Voted green, Rejected red, Connected (but not voted) green/active, else gray */}
                                        </div>
                                        <div>
                                            <div className="text-sm text-gray-200 font-medium group-hover:text-emerald-400 transition-colors">{member.name} {member.role === 'Owner' && '(Owner)'}</div>
                                            <div className="text-[10px] text-gray-500 font-mono flex items-center gap-1">
                                                {member.role.toUpperCase()}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {/* isConnected indicator redundant if avatar dot exists, but kept for clarity if needed */}
                                        {/* 
                                        {member.isConnected && (
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                        )}
                                        */}
                                        <div className={`text-[10px] font-mono px-2 py-0.5 rounded border ${member.status === 'VOTED' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                            member.status === 'REJECTED' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                                'bg-white/5 text-gray-500 border-white/10'
                                            }`}>
                                            {member.status}
                                        </div>
                                        {member.address?.toLowerCase() === account?.toLowerCase() && member.status === 'PENDING' && (
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={() => submitVote('approve')}
                                                    className="px-2 py-0.5 text-[10px] bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 rounded"
                                                >
                                                    ✓
                                                </button>
                                                <button
                                                    onClick={() => submitVote('reject')}
                                                    className="px-2 py-0.5 text-[10px] bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded"
                                                >
                                                    ✗
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="pt-3 border-t border-white/5">
                            {/* Progress Bar */}
                            <div className="flex justify-between text-[10px] text-gray-500 mb-1 font-mono">
                                <span>CONSENSUS PROGRESS</span>
                                <div className="flex gap-4">
                                    <span className="text-emerald-500">{votingStatus ? Math.round((votingStatus.approveVotes / votingStatus.totalMembers) * 100) : 0}% APPROVED</span>
                                    <span className="text-red-500">{votingStatus ? Math.round((votingStatus.rejectVotes / votingStatus.totalMembers) * 100) : 0}% REJECTED</span>
                                </div>
                            </div>
                            <div className="h-2 bg-gray-800 rounded-full overflow-hidden flex relative mb-4">
                                <div
                                    className="h-full bg-emerald-500 transition-all duration-500"
                                    style={{ width: votingStatus ? `${(votingStatus.approveVotes / votingStatus.totalMembers) * 100}%` : '0%' }}
                                />
                                <div className="flex-1 bg-transparent" />
                                <div
                                    className="h-full bg-red-500 transition-all duration-500"
                                    style={{ width: votingStatus ? `${(votingStatus.rejectVotes / votingStatus.totalMembers) * 100}%` : '0%' }}
                                />
                            </div>

                            {votingStatus?.result && (
                                <div className={`mb-4 p-2 rounded border text-xs font-mono text-center ${votingStatus.result === 'approved'
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                    : 'bg-red-500/10 text-red-400 border-red-500/30'
                                    }`}>
                                    VOTING {votingStatus.result.toUpperCase()} - {votingStatus.approveVotes} approve, {votingStatus.rejectVotes} reject
                                </div>
                            )}

                            <button
                                onClick={handleSubmit}
                                disabled={!plotData || isSubmitting}
                                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-medium text-xs font-mono rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider mb-2"
                            >
                                {isSubmitting ? 'INITIATING...' : 'SUBMIT PROPOSAL'}
                            </button>
                        </div>

                        {/* Exit Button - Bottom Right of the panel/container */}
                        <div className="absolute bottom-3 right-3">
                            {/* Or better, render it outside the flow or fixed. 
                                User asked "At the bottom right of the page".
                                I will put it fixed z-index at page bottom right.
                             */}
                        </div>
                    </div>

                </motion.div>

                {/* Exit Button Fixed Position */}
                <div className="fixed bottom-6 right-6 z-50">
                    <button
                        onClick={handleExit}
                        className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white font-mono text-xs font-bold rounded shadow-lg transition-colors uppercase tracking-wider flex items-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                        {isOwner ? 'END SESSION' : 'EXIT SESSION'}
                    </button>
                </div>
            </main>
        </div>
    );
};

export default OrgForestRegister;
