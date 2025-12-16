import React from 'react';
import { motion } from 'framer-motion';
import TopNav from '../components/dashboard/TopNav';
import KPIGrid from '../components/dashboard/KPIGrid';
import ForestTable from '../components/dashboard/ForestTable';
import VerificationTimeline from '../components/dashboard/VerificationTimeline';
import SidePanel from '../components/dashboard/SidePanel';
import { MagicBentoGrid } from '../components/dashboard/MagicBento';

const DashboardPage = () => {
    return (
        <div className="h-screen w-full bg-[#0b0f14] text-gray-300 font-sans selection:bg-emerald-500/30 flex flex-col overflow-hidden">
            <div className="flex-none z-50">
                <TopNav />
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden relative">
                <MagicBentoGrid className="p-4 grid grid-cols-1 lg:grid-cols-12 gap-4 max-w-[1600px] mx-auto pb-8">
                    {/* Main Content Area */}
                    <div className="lg:col-span-8 flex flex-col gap-4">
                        <KPIGrid />
                        <ForestTable />
                        <VerificationTimeline />
                    </div>

                    {/* Side Panel */}
                    <div className="lg:col-span-4 flex flex-col gap-4">
                        <SidePanel />
                    </div>
                </MagicBentoGrid>
            </div>
        </div>
    );
};

export default DashboardPage;
