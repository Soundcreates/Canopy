import React, { useState, useEffect } from 'react';
import { MagicCard } from './MagicBento';
import { getForests } from '../../ApiFactory/ForestAPI';

const KPICard = ({ title, value, unit, change, trend = 'neutral' }) => (
    <MagicCard
        enableStars={false}
        enableTilt={false}
        enableMagnetism={false}
        className="group !p-5 !bg-[#11141a]/80"
    >
        <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-emerald-500/0 via-emerald-500/50 to-emerald-500/0 opacity-50 group-hover:opacity-100 transition-opacity"></div>

        <h3 className="text-xs font-mono text-gray-500 uppercase tracking-wider mb-2 relative z-10">{title}</h3>
        <div className="flex items-end gap-2 mb-1 relative z-10">
            <span className="text-2xl text-white font-medium tracking-tight">{value}</span>
            {unit && <span className="text-sm text-gray-500 mb-1">{unit}</span>}
        </div>

        {change && (
            <div className={`text-xs font-mono ${trend === 'up' ? 'text-emerald-500' : 'text-gray-500'} flex items-center gap-1 relative z-10`}>
                {trend === 'up' ? '↑' : '•'} {change}
            </div>
        )}
    </MagicCard>
);

const KPIGrid = () => {
    const [kpiData, setKpiData] = useState({
        forestsCount: 0,
        verifiedArea: 0,
        carbonIssued: 0,
        networkHealth: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchKPIData = async () => {
            try {
                setLoading(true);
                const response = await getForests();

                if (response.success && response.data && response.data.forests) {
                    const forests = response.data.forests;

                    // Calculate KPIs
                    const forestsCount = forests.length;

                    // Calculate total area in hectares (area is in square meters)
                    const totalAreaSqMeters = forests.reduce((sum, f) => sum + (Number(f.area) || 0), 0);
                    const verifiedArea = totalAreaSqMeters / 10000; // Convert to hectares

                    // Calculate total carbon credits
                    const carbonIssued = forests.reduce((sum, f) => sum + (Number(f.totalCarbonCredits) || 0), 0);

                    // Calculate average confidence (if available)
                    const forestsWithConfidence = forests.filter(f => f.lastConfidence);
                    const avgConfidence = forestsWithConfidence.length > 0
                        ? forestsWithConfidence.reduce((sum, f) => sum + parseFloat(f.lastConfidence || 0), 0) / forestsWithConfidence.length
                        : 0;

                    setKpiData({
                        forestsCount,
                        verifiedArea,
                        carbonIssued: carbonIssued / 1000, // Convert to metric tons (assuming credits are in kg)
                        networkHealth: avgConfidence
                    });
                }
            } catch (error) {
                console.error("Error fetching KPI data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchKPIData();
    }, []);

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
                title="Forests Registered"
                value={loading ? "..." : kpiData.forestsCount.toLocaleString()}
                change={kpiData.forestsCount > 0 ? `${kpiData.forestsCount} registered` : "No forests yet"}
                trend={kpiData.forestsCount > 0 ? "up" : "neutral"}
            />
            <KPICard
                title="Verified Area"
                value={loading ? "..." : kpiData.verifiedArea.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                unit="ha"
                change={kpiData.verifiedArea > 0 ? "Total verified" : "No area verified"}
                trend={kpiData.verifiedArea > 0 ? "up" : "neutral"}
            />
            <KPICard
                title="Carbon Issued"
                value={loading ? "..." : kpiData.carbonIssued.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                unit="MT"
                change={kpiData.carbonIssued > 0 ? "Verified Supply" : "No credits issued"}
                trend="neutral"
            />
            <KPICard
                title="Network Health"
                value={loading ? "..." : kpiData.networkHealth.toFixed(1)}
                unit="%"
                change={kpiData.networkHealth > 0 ? "Avg. Confidence" : "No data yet"}
                trend={kpiData.networkHealth > 80 ? "up" : "neutral"}
            />
        </div>
    );
};

export default KPIGrid;
