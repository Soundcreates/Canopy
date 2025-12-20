import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import TopNav from '../components/dashboard/TopNav';
import OrgKPIGrid from '../components/dashboard/OrgKPIGrid';
import MembersTable from '../components/dashboard/MembersTable';
import SidePanel from '../components/dashboard/SidePanel';
import { MagicBentoGrid } from '../components/dashboard/MagicBento';
import AddMemberModal from '../components/dashboard/AddMemberModal';
import { useOrganisation } from '../contexts/OrganisationContext';
import { useWallet } from '../contexts/WalletContext';
import { getOrganisations } from '../ApiFactory/OrganisationAPI';
import { fetchOrganisationById } from '../ApiFactory/OrganisationAPI';


const OrganisationPage = () => {
    const navigate = useNavigate();
    const { isLoading } = useOrganisation();
    const { isConnected, connectWallet } = useWallet();
    const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
    const [organisations, setOrganisations] = useState([]);
    const [selectedOrganisation, setSelectedOrganisation] = useState(null);
    const [loadingOrgs, setLoadingOrgs] = useState(false);
    const { account } = useWallet();

    const loadOrganisationDetails = useCallback(async (id) => {
        try {
            const orgDetails = await fetchOrganisationById(account, id);
            // Handle response structure
            if (orgDetails.organisation) {
                setSelectedOrganisation(orgDetails);
            } else {
                setSelectedOrganisation({
                    organisation: orgDetails,
                    members: []
                });
            }
        } catch (err) {
            console.error("Error loading organisation details:", err);
        }
    }, [account]);

    useEffect(() => {
        if (!account) {
            setOrganisations([]);
            setSelectedOrganisation(null);
            return;
        }

        const fetchOrgs = async () => {
            setLoadingOrgs(true);
            try {
                const response = await getOrganisations(account);
                const orgs = response.organisations || [];
                setOrganisations(orgs);
                
                // If we have organizations, load details for the first one
                if (orgs.length > 0) {
                    await loadOrganisationDetails(orgs[0].id);
                } else {
                    setSelectedOrganisation(null);
                }
            } catch (err) {
                console.error("Error loading organisations from page:", err);
                setOrganisations([]);
                setSelectedOrganisation(null);
            } finally {
                setLoadingOrgs(false);
            }
        };
        
        fetchOrgs();
    }, [account, loadOrganisationDetails]);

   const handleAddMember = () => {
        if (!selectedOrganisation) {
            return;
        }
        setIsAddMemberOpen(true);
    };

    return (
        <div className="h-screen w-full bg-[#0b0f14] text-gray-300 font-sans selection:bg-emerald-500/30 flex flex-col overflow-hidden">
            {/* Top Navigation - Fixed Height */}
            <div className="flex-none z-50">
                <TopNav title="Organization" />
            </div>

            {/* Main Content Area - Split Pane */}
            <div className="flex-1 min-h-0 overflow-hidden relative">
                <MagicBentoGrid className="h-full w-full max-w-[1800px] mx-auto p-4 flex gap-6">

                    {/* Left Pane: Main Data - Scrollable */}
                    <div className="flex-1 flex flex-col gap-6 overflow-y-auto scrollbar-hide pr-2 pb-20">
                        <div className="flex flex-col gap-6">
                            {/* Header Actions */}
                            <div className="flex justify-between items-center">
                                <div>
                                    {selectedOrganisation ? (
                                        <>
                                            <h2 className="text-xl font-medium text-white/90">{selectedOrganisation.organisation.name}</h2>
                                            <p className="text-xs text-gray-500 font-mono mt-1">ORGANIZATION ID: {selectedOrganisation.organisation.id}</p>
                                        </>
                                    ) : organisations.length === 0 && !loadingOrgs ? (
                                        <>
                                            <h2 className="text-xl font-medium text-white/90">No Organizations</h2>
                                            <p className="text-xs text-gray-500 font-mono mt-1">Create your first organization to get started</p>
                                        </>
                                    ) : (
                                        <>
                                            <h2 className="text-xl font-medium text-white/90">Select an Organization</h2>
                                            <p className="text-xs text-gray-500 font-mono mt-1">Choose an organization from the list below</p>
                                        </>
                                    )}
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => navigate('/create-org')}
                                        className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 text-xs font-mono font-medium rounded border border-emerald-500/20 transition-colors flex items-center gap-2 tracking-wide"
                                    >
                                        + CREATE ORGANIZATION
                                    </button>
                                    <button
                                        onClick={() => navigate(`/org/register/${selectedOrganisation?.organisation.id}`)}
                                        className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 text-xs font-mono font-medium rounded border border-emerald-500/20 transition-colors flex items-center gap-2 tracking-wide"
                                    >
                                        + REGISTER FOREST
                                    </button>
                                    {selectedOrganisation && (
                                        <>
                                            <button
                                                onClick={() => navigate('/marketplace')}
                                                className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-xs font-mono font-medium rounded border border-blue-500/20 transition-colors flex items-center gap-2 tracking-wide"
                                            >
                                                MARKETPLACE
                                            </button>
                                            <button
                                                onClick={handleAddMember}
                                                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-xs font-mono font-medium rounded border border-white/10 transition-colors flex items-center gap-2 tracking-wide"
                                            >
                                                + ADD MEMBER
                                            </button>
                                       </>
                                    )}
                                </div>
                            </div>

                            {/* Organizations List - Show if multiple organizations or none selected */}
                            {(organisations.length > 1 || (organisations.length > 0 && !selectedOrganisation)) && (
                                <div className="bg-[#11141a]/90 border border-white/10 rounded-lg p-4">
                                    <h3 className="text-sm font-mono text-emerald-500 uppercase tracking-wider mb-3">Your Organizations</h3>
                                    <div className="flex flex-col gap-2">
                                        {organisations.map((org) => (
                                            <button
                                                key={org.id}
                                                onClick={() => loadOrganisationDetails(org.id)}
                                                className={`text-left p-3 rounded border transition-colors ${selectedOrganisation?.organisation.id === org.id
                                                        ? 'bg-emerald-500/10 border-emerald-500/30 text-white'
                                                        : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                                                    }`}
                                            >
                                                <div className="font-medium">{org.name}</div>
                                                <div className="text-xs text-gray-500 font-mono mt-1">
                                                    {org.role === 'owner' ? 'OWNER' : 'MEMBER'} • {org.isActive ? 'ACTIVE' : 'INACTIVE'}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Loading State */}
                            {loadingOrgs && (
                                <div className="flex items-center justify-center p-8">
                                    <div className="text-gray-500 font-mono">Loading organizations...</div>
                                </div>
                            )}

                            {selectedOrganisation ? (
                                <>
                                    <OrgKPIGrid organisation={selectedOrganisation.organisation} />
                                    <MembersTable members={selectedOrganisation.members || []} />
                                </>
                            ) : organisations.length === 0 && !loadingOrgs ? (
                                <div className="flex flex-col items-center justify-center p-12 bg-[#11141a]/90 border border-white/10 rounded-lg">
                                    <p className="text-gray-500 font-mono mb-4">No organizations found</p>
                                    <button
                                        onClick={() => navigate('/create-org')}
                                        className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-medium rounded-lg transition-colors font-mono tracking-wide"
                                    >
                                        CREATE YOUR FIRST ORGANIZATION
                                    </button>
                                </div>
                            ) : null}
                        </div>
                    </div>

                    {/* Right Pane: Side Panel - Independent Scroll / Fixed Grid */}
                    <div className="w-[420px] flex-none flex flex-col gap-4 overflow-y-auto scrollbar-hide h-full pb-20">
                        {/* Reuse SidePanel or create OrgSidePanel if needed. 
                            SidePanel has 'Recent Activity', 'Your Forests' etc specific to user. 
                            Ideally we'd want organization specific side panel, but for now we reuse.
                        */}
                        <div className="flex flex-col gap-4">
                            <SidePanel />
                        </div>
                    </div>

                </MagicBentoGrid>
            </div>
            <AddMemberModal isOpen={isAddMemberOpen} onClose={() => setIsAddMemberOpen(false)} />
        </div>
    );
};

export default OrganisationPage;
