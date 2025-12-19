import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopNav from '../components/dashboard/TopNav';
import { MagicBentoGrid, MagicCard } from '../components/dashboard/MagicBento';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-[#11141a] border border-white/10 p-3 rounded shadow-xl">
                <p className="text-gray-400 text-xs font-mono mb-1">{label}</p>
                <p className="text-emerald-400 text-sm font-medium font-mono">
                    {payload[0].value.toLocaleString()} Credits
                </p>
            </div>
        );
    }
    return null;
};

const ProfilePage = () => {
    const navigate = useNavigate();
    const [displayName, setDisplayName] = useState('0xUser...Dev');
    const [isEditingName, setIsEditingName] = useState(false);
    const [tempName, setTempName] = useState(displayName);

    const handleSaveName = () => {
        setDisplayName(tempName);
        setIsEditingName(false);
    };

    // Mock Data for Chart
    const data = [
        { name: 'Jan', credits: 4000 },
        { name: 'Feb', credits: 3000 },
        { name: 'Mar', credits: 5000 },
        { name: 'Apr', credits: 7500 },
        { name: 'May', credits: 6800 },
        { name: 'Jun', credits: 9000 },
        { name: 'Jul', credits: 12000 },
    ];

    return (
        <div className="h-screen w-full bg-[#0b0f14] text-gray-300 font-sans selection:bg-emerald-500/30 flex flex-col overflow-hidden">
            <div className="flex-none z-50">
                <TopNav title="Profile" />
            </div>

            <div className="flex-1 min-h-0 overflow-hidden relative">
                <MagicBentoGrid className="h-full w-full max-w-[1200px] mx-auto p-4 flex flex-col gap-6 overflow-y-auto scrollbar-hide pb-20">

                    {/* Header Section */}
                    <div className="flex flex-col gap-2">
                        <h1 className="text-2xl font-medium text-white">Profile Settings</h1>
                        <p className="text-sm text-gray-500">Manage your identity and view your contributions.</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Profile Info Card */}
                        <MagicCard className="lg:col-span-1 !bg-[#11141a]/80 !p-6 flex flex-col gap-6 h-fit">
                            <div className="flex items-center gap-4">
                                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-500/20 to-emerald-900/20 border border-emerald-500/30 flex items-center justify-center">
                                    <span className="text-2xl text-emerald-500 font-mono">
                                        {displayName.slice(0, 2).toUpperCase()}
                                    </span>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500 font-mono uppercase tracking-wider mb-1">Display Name</div>
                                    {isEditingName ? (
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={tempName}
                                                onChange={(e) => setTempName(e.target.value)}
                                                className="bg-black/20 border border-emerald-500/30 rounded px-2 py-1 text-sm text-white focus:outline-none w-32"
                                            />
                                            <button onClick={handleSaveName} className="text-emerald-500 hover:text-emerald-400 text-xs font-mono">SAVE</button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 group">
                                            <h2 className="text-xl text-white font-medium">{displayName}</h2>
                                            <button onClick={() => setIsEditingName(true)}>
                                                <svg className="w-4 h-4 text-gray-600 group-hover:text-emerald-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                </svg>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-white/5">
                                <div>
                                    <label className="text-xs text-gray-500 font-mono uppercase tracking-wider block mb-1">Organization</label>
                                    <div className="flex items-center gap-3 bg-white/5 p-3 rounded-lg border border-white/5">
                                        <div className="w-8 h-8 rounded bg-blue-500/20 flex items-center justify-center text-blue-400">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                            </svg>
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-white">Green Earth Alliance</div>
                                            <div className="text-xs text-gray-500">Member since 2024</div>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs text-gray-500 font-mono uppercase tracking-wider block mb-1">Wallet Status</label>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-400">Connected</span>
                                        <span className="text-emerald-500 font-mono">Active</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm mt-1">
                                        <span className="text-gray-400">Network</span>
                                        <span className="text-purple-400 font-mono">Sepolia</span>
                                    </div>
                                </div>
                            </div>
                        </MagicCard>

                        {/* Chart Card */}
                        <MagicCard className="lg:col-span-2 !bg-[#11141a]/80 !p-6 flex flex-col h-[400px]">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h3 className="text-lg font-medium text-white">Credit History</h3>
                                    <p className="text-xs text-gray-500 font-mono mt-1">TOKEN PERFORMANCE OVER TIME</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-medium text-white">12,000</div>
                                    <div className="text-xs text-emerald-500 font-mono">+24.5% THIS MONTH</div>
                                </div>
                            </div>

                            <div className="flex-1 w-full min-h-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={data}>
                                        <defs>
                                            <linearGradient id="colorCredits" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                                        <XAxis
                                            dataKey="name"
                                            stroke="#6b7280"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                        />
                                        <YAxis
                                            stroke="#6b7280"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                            tickFormatter={(value) => `${value / 1000}k`}
                                        />
                                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#ffffff20' }} />
                                        <Area
                                            type="monotone"
                                            dataKey="credits"
                                            stroke="#10b981"
                                            strokeWidth={2}
                                            fillOpacity={1}
                                            fill="url(#colorCredits)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </MagicCard>
                    </div>


                </MagicBentoGrid>
            </div>
        </div>
    );
};

export default ProfilePage;
