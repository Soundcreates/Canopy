import React from 'react';
import { motion } from 'framer-motion';
import CurvedLoop from '../CurvedLoop';

const DashboardRow = ({ id, region, biomass, status, credits, statusColor = "text-emerald-400" }) => (
    <motion.tr
        variants={{
            hidden: { opacity: 0, x: -10 },
            visible: { opacity: 1, x: 0 }
        }}
        className="hover:bg-white/[0.02] transition-colors"
    >
        <td className="px-6 py-4 font-mono text-gray-400">{id}</td>
        <td className="px-6 py-4 text-white">{region}</td>
        <td className="px-6 py-4 text-gray-400">{biomass}</td>
        <td className={`px-6 py-4 text-xs font-mono uppercase ${statusColor}`}>
            <span className="flex items-center gap-2">
                {status === 'Verified' && <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>}
                {status}
            </span>
        </td>
        <td className="px-6 py-4 text-right font-mono text-white">{credits}</td>
    </motion.tr>
);

const DashboardPreview = () => {
    return (
        <section className="py-32 px-6 relative overflow-hidden">
            {/* Background Glow */}
            <motion.div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none"
                animate={{ opacity: [0.5, 0.8, 0.5], scale: [1, 1.1, 1] }}
                transition={{ duration: 8, repeat: Infinity }}
            />

            <div className="max-w-5xl mx-auto relative z-10">
                <motion.div
                    className="text-center mb-12"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <h2 className="text-sm font-mono text-gray-500 tracking-wide uppercase">Live Network State</h2>
                </motion.div>

                <motion.div
                    className="bg-[#0b0f14] border border-white/10 rounded-lg shadow-2xl overflow-hidden"
                    initial={{ opacity: 0, y: 50, rotateX: 5 }}
                    whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                >
                    {/* Dashboard Header */}
                    <div className="bg-[#0e1117] border-b border-white/5 px-6 py-4 flex justify-between items-center">
                        <div className="flex gap-4 text-sm font-mono text-gray-400">
                            <span className="text-white border-b border-emerald-500 pb-0.5">Forests</span>
                            <span className="hover:text-gray-200 cursor-pointer">Validators</span>
                            <span className="hover:text-gray-200 cursor-pointer">Transactions</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                            <span className="text-xs font-mono text-gray-500">WS: CONNECTED</span>
                        </div>
                    </div>

                    {/* Dashboard Table */}
                    <div className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-white/[0.02] text-xs font-mono text-gray-500 uppercase">
                                        <th className="px-6 py-4 font-normal">Asset ID</th>
                                        <th className="px-6 py-4 font-normal">Region</th>
                                        <th className="px-6 py-4 font-normal">Biomass (est)</th>
                                        <th className="px-6 py-4 font-normal">Status</th>
                                        <th className="px-6 py-4 font-normal text-right">Credits Minted</th>
                                    </tr>
                                </thead>
                                <motion.tbody
                                    className="divide-y divide-white/5 text-sm"
                                    initial="hidden"
                                    whileInView="visible"
                                    viewport={{ once: true, amount: 0.5 }}
                                    variants={{
                                        visible: { transition: { staggerChildren: 0.1 } }
                                    }}
                                >
                                    <DashboardRow
                                        id="AMZ-0921"
                                        region="Amazonas, BR"
                                        biomass="14,230 t"
                                        status="Verified"
                                        credits="12,500"
                                    />
                                    <DashboardRow
                                        id="CGO-4412"
                                        region="Congo Basin, CG"
                                        biomass="8,105 t"
                                        status="Analyzing..."
                                        credits="-"
                                        statusColor="text-yellow-500"
                                    />
                                    <DashboardRow
                                        id="BOR-1102"
                                        region="Borneo, ID"
                                        biomass="5,600 t"
                                        status="Verified"
                                        credits="4,200"
                                    />
                                </motion.tbody>
                            </table>
                        </div>
                    </div>

                    {/* Dashboard Footer / Stats */}
                    <div className="bg-[#0e1117] border-t border-white/5 px-6 py-4 flex justify-between items-center text-xs font-mono text-gray-500">
                        <div>Total Bio-Capacity: 4.2MT</div>
                        <div>24h Volume: $1.2M</div>
                    </div>
                </motion.div>
            </div>

            <div className="mt-12 overflow-hidden">
                <CurvedLoop
                    marqueeText="Made with love "
                    className="text-emerald-500/20 font-mono tracking-tighter"
                    speed={3}
                    curveAmount={100}
                />
            </div>
        </section>
    );
};

export default DashboardPreview;
