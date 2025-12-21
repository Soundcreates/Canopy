import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import TopNav from '../components/dashboard/TopNav';
import OrgKPIGrid from '../components/dashboard/OrgKPIGrid';
import MembersTable from '../components/dashboard/MembersTable';
import ForestTable from '../components/dashboard/ForestTable';
import { MagicBentoGrid, MagicCard } from '../components/dashboard/MagicBento';
import { useWallet } from '../contexts/WalletContext';
import { getForests } from '../ApiFactory/ForestAPI';
import { fetchOrganisationById } from '../ApiFactory/OrganisationAPI';
import { getActiveRegistrationSession, joinSession } from '../ApiFactory/RegistrationSessionAPI';
import { useOrganisation } from '../contexts/OrganisationContext'; // If needed for refetch logic

const OrganisationAnalytics = () => {
    const { orgId } = useParams();
    const navigate = useNavigate();
    const { account } = useWallet();
    const [organisation, setOrganisation] = useState(null);
    const [members, setMembers] = useState([]);
    const [forests, setForests] = useState([]);
    const [orgForests, setOrgForests] = useState([]); // Organization's forests
    const [loading, setLoading] = useState(true);
    const [forestsLoading, setForestsLoading] = useState(true);
    const [isSessionActive, setIsSessionActive] = useState(false);
    const [isMember, setIsMember] = useState(false);

    // Fetch Organization Details
    useEffect(() => {
        const loadOrgDetails = async () => {
            if (!orgId || !account) return;
            try {
                const response = await fetchOrganisationById(account, orgId);
                console.log("Org Analytics: Fetched org details:", response);

                if (response.organisation) {
                    setOrganisation(response.organisation);
                    setIsMember(response.isMember || false);

                    if (response.members) {
                        console.log("Org Analytics: Members found:", response.members.length, response.members);
                        setMembers(response.members);
                    } else {
                        console.warn("Org Analytics: No members returned in response.members object");
                        setMembers([]);
                    }

                    // Fetch organization's forests if forest IDs are available
                    if (response.organisation.forests && response.organisation.forests.length > 0) {
                        try {
                            const forestPromises = response.organisation.forests.map(async (forestId) => {
                                try {
                                    const forestResponse = await fetch(`${import.meta.env.VITE_BASE_URL || 'http://localhost:3000'}/api/forests/${forestId}`);
                                    if (forestResponse.ok) {
                                        return await forestResponse.json();
                                    }
                                } catch (err) {
                                    console.error(`Error fetching forest ${forestId}:`, err);
                                }
                                return null;
                            });
                            const forestsData = await Promise.all(forestPromises);
                            const validForests = forestsData.filter(f => f !== null);
                            setOrgForests(validForests);
                        } catch (err) {
                            console.error('Error fetching organization forests:', err);
                            setOrgForests([]);
                        }
                    }
                } else {
                    console.warn("Org Analytics: Unexpected response structure:", response);
                    setOrganisation(response);
                    setMembers([]);
                }

                // Check for active session
                try {
                    const session = await getActiveRegistrationSession(orgId);
                    setIsSessionActive(session && session.session && session.session.isActive);
                } catch (err) {
                    // Silent fail for session check
                    setIsSessionActive(false);
                }
            } catch (error) {
                console.error("Error loading org details:", error);
            } finally {
                setLoading(false);
            }
        };

        loadOrgDetails();
    }, [orgId, account]);

    // Fetch User's Forests ("His Plots") - Only if user is a member
    useEffect(() => {
        const loadForests = async () => {
            if (!account || !isMember) return;
            setForestsLoading(true);
            try {
                const response = await getForests();
                console.log("Org Analytics: Fetched forests:", response);

                // Reuse ForestTable logic to extract forests array
                let forestsArray = [];
                if (response && response.success && response.data) {
                    if (response.data.forests) forestsArray = response.data.forests;
                    else if (Array.isArray(response.data)) forestsArray = response.data;
                } else if (Array.isArray(response)) {
                    forestsArray = response;
                } else if (response && response.data && Array.isArray(response.data)) {
                    forestsArray = response.data;
                }


                // Transform forests immediately for the table
                const transformed = forestsArray.map((forest, i) => {
                    // Reuse transformation logic locally or assume ForestTable handles raw props?
                    // ForestTable logic expects props to be formatted or raw? 
                    // Looking at ForestTable code: "Transform backend data to match component expectations".
                    // Ideally we pass raw data and let ForestTable transform it, but ForestTable's prop logic
                    // just sets state. It doesn't re-run transformation on props if props are already transformed?
                    // Actually ForestTable's useEffect for props just sets forests state. It assumes props are ready?
                    // Wait, ForestTable main internal fetch does transformation.
                    // If I pass props, I should probably pass TRANSFORMED props or modify ForestTable to transform props.
                    // IMPORTANT: ForestTable's useEffect for props simply sets `forests`. 
                    // Step 58 diff shows: `setForests(propForests || [])`.
                    // It does NOT run the transformation logic found in the internal fetch block.
                    // So I MUST transform here.

                    const areaValue = forest.area ? (typeof forest.area === 'string' ? parseFloat(forest.area) : Number(forest.area)) : 0;
                    const areaHectares = areaValue > 0 ? (areaValue / 10000).toFixed(2) : '0.00';

                    let ndvi = 'N/A';
                    if (forest.lastNDVI) {
                        const ndviValue = parseFloat(forest.lastNDVI);
                        if (!isNaN(ndviValue)) {
                            ndvi = ndviValue >= 0 ? `+${ndviValue.toFixed(2)}` : ndviValue.toFixed(2);
                        }
                    }

                    const conf = forest.lastConfidence ? `${parseFloat(forest.lastConfidence).toFixed(1)}%` : 'N/A';
                    const carbon = forest.totalCarbonCredits ? forest.totalCarbonCredits.toLocaleString() : '0';

                    let status = 'ACTIVE';
                    if (!forest.isActive) status = 'REVOKED';
                    else if (!forest.lastNDVI) status = 'ANALYZING';

                    return {
                        id: `FST-${String(forest.forestId).padStart(4, '0')}`,
                        area: parseFloat(areaHectares),
                        ndvi: ndvi,
                        conf: conf,
                        carbon: carbon,
                        status: status,
                        original: forest
                    };
                });

                setForests(transformed);
            } catch (error) {
                console.error("Error loading forests:", error);
                setForests([]);
            } finally {
                setForestsLoading(false);
            }
        };

        loadForests();
    }, [account, isMember]);

    // Calculate/Derive Investors
    const investors = members.filter(m => m.role === 'INVESTOR' || m.role === 'investor');
    // If no explicit investors, maybe just show all members for now or mock?
    // Request says "then investors".
    // I will show a filtered table or specific "Investors" table.

    return (
        <div className="h-screen w-full bg-[#0b0f14] text-gray-300 font-sans selection:bg-emerald-500/30 flex flex-col overflow-hidden">
            {/* Top Navigation */}
            <div className="flex-none z-50">
                <TopNav title={organisation?.name || "Organization Analytics"} />
            </div>

            {/* Main Content */}
            <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide p-4">
                <div className="max-w-[1600px] mx-auto space-y-8 pb-20">

                    {/* Header */}
                    <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-start">
                            <div>
                                <h1 className="text-2xl font-light text-white tracking-wide">
                                    {organisation?.name} <span className="text-emerald-500 font-mono text-sm ml-2">ANALYTICS</span>
                                </h1>
                                <p className="text-sm text-gray-500 font-mono">
                                    ID: {organisation?.id} • {members.length} MEMBERS
                                </p>
                            </div>

                            {/* Session Button */}
                            {organisation && members && (
                                (() => {
                                    // Robust check for owner
                                    const isOwner = organisation.owner === account?.toLowerCase() ||
                                        members.some(m => m.userAddress === account?.toLowerCase() && m.role === 'owner');

                                    if (isOwner) {
                                        return (
                                            <button
                                                onClick={() => navigate(`/org/register/${organisation.id}`)}
                                                className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 text-xs font-mono font-medium rounded border border-emerald-500/20 transition-colors flex items-center gap-2 tracking-wide"
                                            >
                                                + REGISTER FOREST
                                            </button>
                                        );
                                    } else if (isSessionActive) {
                                        const handleJoinSession = async () => {
                                            try {
                                                const response = await getActiveRegistrationSession(organisation.id);
                                                if (response && response.session && response.session.isActive) {
                                                    // Explicitly join session
                                                    await joinSession(response.session.sessionId, account);
                                                    navigate(`/org/register/${organisation.id}`);
                                                } else {
                                                    toast.error("There is no ongoing session currently");
                                                    setIsSessionActive(false);
                                                }
                                            } catch (error) {
                                                console.error("Error checking/joining session:", error);
                                                toast.error("Failed to join session. It may have ended.");
                                                setIsSessionActive(false);
                                            }
                                        };

                                        return (
                                            <button
                                                onClick={handleJoinSession}
                                                className="px-4 py-2 bg-blue-500 hover:bg-blue-400 text-black text-xs font-mono font-medium rounded transition-colors flex items-center gap-2 tracking-wide font-bold"
                                            >
                                                JOIN SESSION
                                            </button>
                                        );
                                    }
                                    return null;
                                })()
                            )}
                        </div>
                    </div>

                    {/* 1. Tokens Raised (KPIs) - Placed prominent or as requested "then tokens raised" after plots/members?
                       Request: "show all the data analytics like for his plots, then members, then tokens raised, then investors"
                       I'll follow the order: Plots -> Members -> Tokens/KPIs -> Investors
                    */}

                    {/* Organization Forests */}
                    {orgForests.length > 0 && (
                        <div>
                            <h2 className="text-sm font-mono text-emerald-500 uppercase tracking-wider mb-4">
                                Organization Forests ({orgForests.length})
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {orgForests.map((forest, idx) => (
                                    <MagicCard key={idx} className="!p-6">
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-start">
                                                <div className="text-sm font-mono text-white">
                                                    FST-{String(forest.forestId || idx).padStart(4, '0')}
                                                </div>
                                                <div className={`text-xs px-2 py-0.5 rounded ${forest.isActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                                                    }`}>
                                                    {forest.isActive ? 'ACTIVE' : 'INACTIVE'}
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3 text-xs">
                                                <div>
                                                    <div className="text-gray-500 font-mono">Area</div>
                                                    <div className="text-white font-medium">
                                                        {((forest.area || 0) / 10000).toFixed(2)} ha
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="text-gray-500 font-mono">Carbon</div>
                                                    <div className="text-white font-medium">
                                                        {forest.totalCarbonCredits || 0}
                                                    </div>
                                                </div>
                                            </div>
                                            {forest.lastNDVI && (
                                                <div className="pt-2 border-t border-white/5">
                                                    <div className="text-gray-500 font-mono text-xs">NDVI</div>
                                                    <div className="text-emerald-400 font-medium">
                                                        {parseFloat(forest.lastNDVI).toFixed(2)}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </MagicCard>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* User's Plots (if member) */}
                    {isMember && forests.length > 0 && (
                        <div>
                            <h2 className="text-sm font-mono text-emerald-500 uppercase tracking-wider mb-4">Your Plots ({forests.length})</h2>
                            <ForestTable forests={forests} loading={forestsLoading} />
                        </div>
                    )}

                    {/* 2. Members */}
                    <div>
                        <h2 className="text-sm font-mono text-emerald-500 uppercase tracking-wider mb-4">Organization Members</h2>
                        <MembersTable members={members} />
                    </div>

                    {/* Performance & Tokens (KPIs) */}
                    <div>
                        <h2 className="text-sm font-mono text-emerald-500 uppercase tracking-wider mb-4">Performance & Tokens</h2>
                        <OrgKPIGrid
                            organisation={organisation}
                            stats={{
                                totalMembers: members.length,
                                totalForests: (organisation?.forests?.length || 0) + members.reduce((acc, m) => acc + (m.forestsRegistered || 0), 0),
                                totalArea: members.reduce((acc, m) => acc + (m.verifiedArea || 0), 0),
                                totalCarbon: members.reduce((acc, m) => acc + (m.totalCarbonCredits || 0), 0),
                                tokensRaised: organisation?.addedFunds ? parseFloat((BigInt(organisation.addedFunds) / BigInt(10 ** 18)).toString()) : 0
                            }}
                        />
                    </div>

                    {/* 4. Investors */}
                    <div>
                        <h2 className="text-sm font-mono text-emerald-500 uppercase tracking-wider mb-4">Investors</h2>
                        {investors.length > 0 ? (
                            <MembersTable members={investors} />
                        ) : (
                            <MagicCard className="!p-8 text-center text-gray-500 font-mono text-sm">
                                No investors found in this organization.
                            </MagicCard>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};

export default OrganisationAnalytics;
