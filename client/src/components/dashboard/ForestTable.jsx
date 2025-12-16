import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MagicCard } from './MagicBento';
import { getForests } from '../../ApiFactory/ForestAPI';

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
    const [forests, setForests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    //we are fetching real data from backend
    useEffect(() => {
        const fetchForests = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await getForests();
                if(response.success && response.data && response.data.forests){
                    // Transform backend data to match component expectations
                    const transformedForests = response.data.forests.map(forest => {
                        // Convert area from square meters to hectares
                        const areaHectares = forest.area ? (forest.area / 10000).toFixed(2) : 0;
                        
                        // Format NDVI - add + sign if positive, handle undefined
                        let ndvi = 'N/A';
                        if (forest.lastNDVI) {
                            const ndviValue = parseFloat(forest.lastNDVI);
                            ndvi = ndviValue >= 0 ? `+${ndviValue.toFixed(2)}` : ndviValue.toFixed(2);
                        }
                        
                        // Format confidence - add % sign, handle undefined
                        const conf = forest.lastConfidence ? `${parseFloat(forest.lastConfidence).toFixed(1)}%` : 'N/A';
                        
                        // Format carbon credits
                        const carbon = forest.totalCarbonCredits ? forest.totalCarbonCredits.toLocaleString() : '0';
                        
                        // Determine status based on isActive
                        let status = 'ACTIVE';
                        if (!forest.isActive) {
                            status = 'REVOKED';
                        } else if (!forest.lastNDVI) {
                            status = 'ANALYZING';
                        }
                        
                        return {
                            id: `FST-${String(forest.forestId).padStart(4, '0')}`, // Format ID like FST-0001
                            area: parseFloat(areaHectares),
                            ndvi: ndvi,
                            conf: conf,
                            carbon: carbon,
                            status: status,
                            // Keep original data for reference
                            original: forest
                        };
                    });
                    
                    setForests(transformedForests);
                    console.log("Successfully fetched and transformed forests:", transformedForests);
                } else {
                    console.error("Error fetching forests:", response.error);
                    setError(response.error || "Failed to fetch forests");
                }
            } catch (err) {
                console.error("Error fetching forests:", err);
                setError(err.message || "Failed to fetch forests");
            } finally {
                setLoading(false);
            }
        };
        fetchForests();
    }, [])


    //This below is mock data
    // const forests = [
    //     { id: 'AMZ-291', area: 12500, ndvi: '+0.12', conf: '99.1%', carbon: '142,000', status: 'ACTIVE' },
    //     { id: 'CGO-112', area: 8400, ndvi: '-0.04', conf: '94.2%', carbon: '82,100', status: 'ANALYZING' },
    //     { id: 'BOR-449', area: 3200, ndvi: '+0.08', conf: '98.5%', carbon: '31,500', status: 'ACTIVE' },
    //     { id: 'SUM-881', area: 1500, ndvi: '-0.15', conf: '72.0%', carbon: '0', status: 'REVOKED' },
    //     { id: 'AMZ-552', area: 41000, ndvi: '+0.02', conf: '99.8%', carbon: '410,000', status: 'ACTIVE' },
    // ];

    return (
        <MagicCard
            enableStars={false}
            className="!p-0 !bg-[#11141a]/80 !h-fit"
            enableTilt={false}
        >
            <div className="px-5 py-4 border-b border-white/5 flex justify-between items-center relative z-10">
                <h3 className="text-sm font-medium text-white">Forest Registry</h3>
                <button className="text-xs text-emerald-500 hover:text-emerald-400 font-mono transition-colors">
                    EXPORT DATA
                </button>
            </div>

            <div className="overflow-x-auto relative z-10">
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
                        {loading ? (
                            <tr>
                                <td colSpan="6" className="px-5 py-8 text-center text-xs text-gray-500">
                                    Loading forests...
                                </td>
                            </tr>
                        ) : error ? (
                            <tr>
                                <td colSpan="6" className="px-5 py-8 text-center text-xs text-red-400">
                                    Error: {error}
                                </td>
                            </tr>
                        ) : forests.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="px-5 py-8 text-center text-xs text-gray-500">
                                    No forests registered yet
                                </td>
                            </tr>
                        ) : (
                            forests.map((forest, i) => (
                                <motion.tr
                                    key={forest.id || i}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="hover:bg-white/[0.02] transition-colors cursor-pointer group"
                                >
                                    <td className="px-5 py-3 font-mono text-gray-300 group-hover:text-emerald-400 transition-colors">{forest.id}</td>
                                    <td className="px-5 py-3 text-gray-400">{forest.area.toLocaleString()}</td>
                                    <td className={`px-5 py-3 font-mono ${forest.ndvi && forest.ndvi.startsWith('+') ? 'text-emerald-500' : 'text-yellow-500'}`}>
                                        {forest.ndvi}
                                    </td>
                                    <td className="px-5 py-3 text-gray-400">{forest.conf}</td>
                                    <td className="px-5 py-3 text-right text-white font-medium">{forest.carbon}</td>
                                    <td className="px-5 py-3 text-right">
                                        <StatusBadge status={forest.status} />
                                    </td>
                                </motion.tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </MagicCard>
    );
};

export default ForestTable;
