import React from 'react';
import { useNavigate } from 'react-router-dom';
import TopNav from '../components/dashboard/TopNav';
import { MagicCard } from '../components/dashboard/MagicBento';
import { motion } from 'framer-motion';

const OrgCard = ({ org }) => (
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
            <div className="grid grid-cols-3 gap-2 mt-auto">
                <button className="py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/20 rounded text-xs font-mono font-medium transition-colors">
                    INVEST
                </button>
                <button className="py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded text-xs font-mono font-medium transition-colors">
                    BUY
                </button>
                <button className="py-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/10 rounded text-xs font-mono font-medium transition-colors">
                    DATA
                </button>
            </div>
        </div>
    </MagicCard>
);

const OrganisationMarketplace = () => {
    const navigate = useNavigate();

    // Mock Data
    const organizations = [
        {
            id: 1,
            name: "Green Earth Alliance",
            description: "Collaborative effort to reforest the Amazon basin using decentralized verification protocols. Focusing on high-impact zones.",
            members: 124,
            progress: 65,
            startDate: "2024-01-01",
            endDate: "2025-12-31"
        },
        {
            id: 2,
            name: "Oceanic Carbon DAO",
            description: "Restoring mangrove forests in Southeast Asia. Mangroves sequester 4x more carbon than rainforests. Join us in protecting the coastlines.",
            members: 89,
            progress: 32,
            startDate: "2024-03-15",
            endDate: "2026-03-15"
        },
        {
            id: 3,
            name: "Highland Reforest Initiative",
            description: "Replanting native trees in the Scottish Highlands to restore biodiversity and create natural carbon sinks.",
            members: 45,
            progress: 12,
            startDate: "2024-06-01",
            endDate: "2029-01-01"
        },
        {
            id: 4,
            name: "Urban Canopy Project",
            description: "Increasing green cover in major metropolitan areas to reduce heat islands and improve air quality.",
            members: 210,
            progress: 88,
            startDate: "2023-11-20",
            endDate: "2025-05-20"
        },
        {
            id: 5,
            name: "Savanna Guardians",
            description: "Protecting African savannas from desertification through community-led sustainable land management.",
            members: 56,
            progress: 45,
            startDate: "2024-02-10",
            endDate: "2025-08-30"
        }
    ];

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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
                        {organizations.map((org, index) => (
                            <motion.div
                                key={org.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <OrgCard org={org} />
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrganisationMarketplace;
