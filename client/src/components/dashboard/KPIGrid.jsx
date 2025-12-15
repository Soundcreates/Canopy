import React from 'react';
import { motion } from 'framer-motion';

const KPICard = ({ title, value, unit, change, trend = 'neutral' }) => (
    <motion.div
        whileHover={{ y: -2 }}
        className="p-5 bg-[#11141a] border border-white/5 rounded-sm relative overflow-hidden group"
    >
        <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-emerald-500/0 via-emerald-500/50 to-emerald-500/0 opacity-50 group-hover:opacity-100 transition-opacity"></div>

        <h3 className="text-xs font-mono text-gray-500 uppercase tracking-wider mb-2">{title}</h3>
        <div className="flex items-end gap-2 mb-1">
            <span className="text-2xl text-white font-medium tracking-tight">{value}</span>
            {unit && <span className="text-sm text-gray-500 mb-1">{unit}</span>}
        </div>

        {change && (
            <div className={`text-xs font-mono ${trend === 'up' ? 'text-emerald-500' : 'text-gray-500'} flex items-center gap-1`}>
                {trend === 'up' ? '↑' : '•'} {change}
            </div>
        )}
    </motion.div>
);

const KPIGrid = () => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
                title="Forests Registered"
                value="1,240"
                change="+12 this month"
                trend="up"
            />
            <KPICard
                title="Verified Area"
                value="84,300"
                unit="ha"
                change="+2.4% vs last epoch"
                trend="up"
            />
            <KPICard
                title="Carbon Issued"
                value="4.2"
                unit="MT"
                change="Verified Supply"
                trend="neutral"
            />
            <KPICard
                title="Network Health"
                value="98.2"
                unit="%"
                change="Avg. Confidence"
                trend="up"
            />
        </div>
    );
};

export default KPIGrid;
