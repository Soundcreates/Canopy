import React from 'react';
import { motion } from 'framer-motion';

const StatusBadge = ({ status }) => {
    const styles = {
        ACTIVE: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        ANALYZING: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
        REVOKED: 'bg-red-500/10 text-red-400 border-red-500/20',
    };

    const style = styles[status] || styles.ACTIVE;

    return (
        <span className={`px-2 py-0.5 text-[10px] font-mono border rounded uppercase tracking-wider ${style}`}>
            {status}
        </span>
    );
};

const ForestTable = () => {
    const forests = [
        { id: 'AMZ-291', area: 12500, ndvi: '+0.12', conf: '99.1%', carbon: '142,000', status: 'ACTIVE' },
        { id: 'CGO-112', area: 8400, ndvi: '-0.04', conf: '94.2%', carbon: '82,100', status: 'ANALYZING' },
        { id: 'BOR-449', area: 3200, ndvi: '+0.08', conf: '98.5%', carbon: '31,500', status: 'ACTIVE' },
        { id: 'SUM-881', area: 1500, ndvi: '-0.15', conf: '72.0%', carbon: '0', status: 'REVOKED' },
        { id: 'AMZ-552', area: 41000, ndvi: '+0.02', conf: '99.8%', carbon: '410,000', status: 'ACTIVE' },
    ];

    return (
        <div className="bg-[#11141a] border border-white/5 rounded-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-white/5 flex justify-between items-center">
                <h3 className="text-sm font-medium text-white">Forest Registry</h3>
                <button className="text-xs text-emerald-500 hover:text-emerald-400 font-mono transition-colors">
                    EXPORT DATA
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-white/[0.02] text-xs font-mono text-gray-500 uppercase">
                            <th className="px-5 py-3 font-normal">ID</th>
                            <th className="px-5 py-3 font-normal">Area (ha)</th>
                            <th className="px-5 py-3 font-normal">NDVI Δ</th>
                            <th className="px-5 py-3 font-normal">Confidence</th>
                            <th className="px-5 py-3 font-normal text-right">Carbon (t)</th>
                            <th className="px-5 py-3 font-normal text-right">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-sm">
                        {forests.map((forest, i) => (
                            <motion.tr
                                key={forest.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="hover:bg-white/[0.02] transition-colors cursor-pointer group"
                            >
                                <td className="px-5 py-3 font-mono text-gray-300 group-hover:text-emerald-400 transition-colors">{forest.id}</td>
                                <td className="px-5 py-3 text-gray-400">{forest.area.toLocaleString()}</td>
                                <td className={`px-5 py-3 font-mono ${forest.ndvi.startsWith('+') ? 'text-emerald-500' : 'text-yellow-500'}`}>{forest.ndvi}</td>
                                <td className="px-5 py-3 text-gray-400">{forest.conf}</td>
                                <td className="px-5 py-3 text-right text-white font-medium">{forest.carbon}</td>
                                <td className="px-5 py-3 text-right">
                                    <StatusBadge status={forest.status} />
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ForestTable;
