import React from 'react';
import { motion } from 'framer-motion';
import TopNav from '../components/dashboard/TopNav';
import KPIGrid from '../components/dashboard/KPIGrid';
import ForestTable from '../components/dashboard/ForestTable';
import VerificationTimeline from '../components/dashboard/VerificationTimeline';
import SidePanel from '../components/dashboard/SidePanel';

const DashboardPage = () => {
    return (
        <div className="min-h-screen bg-[#0b0f14] text-gray-300 font-sans selection:bg-emerald-500/30">
            <TopNav />

            <main className="p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-[1600px] mx-auto">
                {/* Main Content Area */}
                <div className="lg:col-span-8 space-y-6">
                    <KPIGrid />
                    <ForestTable />
                    <VerificationTimeline />
                </div>

                {/* Side Panel */}
                <div className="lg:col-span-4">
                    <SidePanel />
                </div>
            </main>
        </div>
    );
};

export default DashboardPage;
