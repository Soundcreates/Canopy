import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TopNav from '../components/dashboard/TopNav';
import { MagicCard } from '../components/dashboard/MagicBento';
import { motion } from 'framer-motion';
import { useOrganisation } from '../contexts/OrganisationContext';
import { useWallet } from '../contexts/WalletContext';
import { toast } from 'react-toastify';

const OrgCard = ({ org, isOwnerOrMember }) => (
    <MagicCard className="!p-0 !bg-[#11141a] border border-white/10 group h-full flex flex-col">
        {/* Banner / Header */}
        <div className="h-32 bg-gradient-to-br from-emerald-900/20 to-black relative overflow-hidden border-b border-white/5">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
            <div className="absolute bottom-4 left-4 z-10 flex items-end gap-3">
                <div className="w-12 h-12 rounded-lg bg-black/50 backdrop-blur border border-white/10 flex items-center justify-center">
                    <span className="text-xl font-bold text-white">{org.name.slice(0, 1)}</span>
                </div>
            </div>
        </div>

        {/* Content */}
        <div className="p-5 flex-1 flex flex-col">
            <h3 className="text-lg font-medium text-white mb-1 group-hover:text-emerald-400 transition-colors">{org.name}</h3>
            <div className="flex items-center gap-2 mb-4">
                <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-gray-400 font-mono border border-white/5">{org.members} MEMBERS</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-mono border border-emerald-500/20">VERIFIED</span>
            </div>

            <p className="text-sm text-gray-500 line-clamp-3 mb-6 flex-1">
                {org.description}
            </p>

            {/* Timeline */}
            <div className="mb-6 space-y-2">
                <div className="flex justify-between text-xs text-gray-500 font-mono">
                    <span>PROGRESS</span>
                    <span>{org.progress}%</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${org.progress}%` }}></div>
                </div>
                <div className="flex justify-between text-[10px] text-gray-600 font-mono mt-1">
                    <span>START: {org.startDate}</span>
                    <span>END: {org.endDate}</span>
                </div>
            </div>

            {/* Actions */}
            <div className={`grid gap-2 mt-auto ${isOwnerOrMember ? 'grid-cols-1' : 'grid-cols-3'}`}>
                {!isOwnerOrMember && (
                    <>
                        <button className="py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/20 rounded text-xs font-mono font-medium transition-colors">
                            INVEST
                        </button>
                        <button className="py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded text-xs font-mono font-medium transition-colors">
                            BUY
                        </button>
                    </>
                )}
                <button className="py-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/10 rounded text-xs font-mono font-medium transition-colors">
                    DATA
                </button>
            </div>
        </div>
    </MagicCard>
);

const OrganisationMarketplace = () => {
    const navigate = useNavigate();
    const { getMarketplaceOrganisations, getOrganisations } = useOrganisation();
    const { account } = useWallet();
    const [organizations, setOrganizations] = useState([]);
    const [userOrganisations, setUserOrganisations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadOrganisations();
    }, [account]);

    const loadOrganisations = async () => {
        setLoading(true);
        try {
            // Load marketplace organizations
            const marketplaceData = await getMarketplaceOrganisations();
            const marketplaceOrgs = marketplaceData.organisations || [];
            
            // Load user's organizations if wallet is connected
            let userOrgIds = [];
            if (account) {
                try {
                    const userData = await getOrganisations();
                    userOrgIds = (userData.organisations || []).map(org => org.id);
                } catch (error) {
                    console.log('User not authenticated or no organizations:', error.message);
                }
            }

            // Mark organizations where user is owner or member
            const orgsWithOwnership = marketplaceOrgs.map(org => {
                const isOwner = account && org.owner && org.owner.toLowerCase() === account.toLowerCase();
                const isMember = userOrgIds.includes(org.id);
                return {
                    ...org,
                    isOwnerOrMember: isOwner || isMember
                };
            });

            setOrganizations(orgsWithOwnership);
            setUserOrganisations(userOrgIds);
        } catch (error) {
            console.error('Error loading organisations:', error);
            toast.error('Failed to load organizations: ' + error.message);
            setOrganizations([]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-screen w-full bg-[#0b0f14] text-gray-300 font-sans selection:bg-emerald-500/30 flex flex-col overflow-hidden">
            <div className="flex-none z-50">
                <TopNav title="Marketplace" />
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide p-6 md:p-8">
                <div className="max-w-[1600px] mx-auto">

                    {/* Header */}
                    <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
                        <div>
                            <h1 className="text-3xl font-medium text-white mb-2">Organization Marketplace</h1>
                            <p className="text-gray-500 font-mono text-sm">
                                DISCOVER, INVEST, AND COLLABORATE WITH DECENTRALIZED ECOLOGICAL PROTOCOLS.
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => navigate('/create-org')}
                                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-medium rounded-lg transition-colors font-mono text-sm flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                CREATE ORGANIZATION
                            </button>
                        </div>
                    </div>

                    {/* Filter/Search Bar (Visual Only for now) */}
                    <div className="mb-8 flex gap-4 overflow-x-auto scrollbar-hide">
                        {['ALL', 'TRENDING', 'NEWEST', 'ENDING SOON'].map((filter, i) => (
                            <button key={filter} className={`px-4 py-1.5 rounded-full text-xs font-mono border ${i === 0 ? 'bg-white text-black border-white' : 'bg-transparent text-gray-500 border-white/10 hover:border-white/30 hover:text-white'} transition-all whitespace-nowrap`}>
                                {filter}
                            </button>
                        ))}
                    </div>

                    {/* Grid */}
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="text-gray-500 font-mono">Loading organizations...</div>
                        </div>
                    ) : organizations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <p className="text-gray-500 font-mono mb-4">No organizations found</p>
                            <button
                                onClick={() => navigate('/create-organisation')}
                                className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-medium rounded-lg transition-colors font-mono tracking-wide"
                            >
                                CREATE FIRST ORGANIZATION
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
                            {organizations.map((org, index) => (
                                <motion.div
                                    key={org.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                >
                                    <OrgCard org={org} isOwnerOrMember={org.isOwnerOrMember || false} />
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OrganisationMarketplace;
