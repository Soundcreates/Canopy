import React from 'react';
import { useNavigate } from 'react-router-dom';
import TopNav from '../components/dashboard/TopNav';
import KPIGrid from '../components/dashboard/KPIGrid';
import ForestTable from '../components/dashboard/ForestTable';
import VerificationTimeline from '../components/dashboard/VerificationTimeline';
import SidePanel from '../components/dashboard/SidePanel';
import { MagicBentoGrid } from '../components/dashboard/MagicBento';

const DashboardPage = () => {
    const navigate = useNavigate();

    return (
        <div className="h-screen w-full bg-[#0b0f14] text-gray-300 font-sans selection:bg-emerald-500/30 flex flex-col overflow-hidden">
            {/* Top Navigation - Fixed Height */}
            <div className="flex-none z-50">
                <TopNav />
            </div>

            {/* Main Content Area - Split Pane */}
            <div className="flex-1 min-h-0 overflow-hidden relative">
                <MagicBentoGrid className="h-full w-full max-w-[1800px] mx-auto p-4 flex gap-6">

                    {/* Left Pane: Main Data - Scrollable */}
                    <div className="flex-1 flex flex-col gap-6 overflow-y-auto scrollbar-hide pr-2 pb-20">
                        <div className="flex flex-col gap-6">
                            {/* Header Actions */}
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-medium text-white/90">Overview</h2>
                                <button
                                    onClick={() => navigate('/register')}
                                    className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 text-xs font-mono font-medium rounded border border-emerald-500/20 transition-colors flex items-center gap-2 tracking-wide"
                                >
                                    + REGISTER FOREST
                                </button>
                            </div>

                            <KPIGrid />
                            <ForestTable />
                            <VerificationTimeline />
                        </div>
                    </div>

                    {/* Right Pane: Side Panel - Independent Scroll / Fixed Grid */}
                    <div className="w-[420px] flex-none flex flex-col gap-4 overflow-y-auto scrollbar-hide h-full pb-20">
                        {/* Sticky wrapper to keep it at top if content is short, 
                             but scrollable if content is long (due to parent overflow-y-auto) */}
                        <div className="flex flex-col gap-4">
                            <SidePanel />
                        </div>
                    </div>

                </MagicBentoGrid>
            </div>
        </div>
    );
};

export default DashboardPage;
