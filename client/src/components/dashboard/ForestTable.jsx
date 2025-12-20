import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MagicCard } from './MagicBento';
import { getForests } from '../../ApiFactory/ForestAPI';
import { useSelectedForest } from '../../contexts/SelectedForestContext';

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

const ForestTable = ({ forests: propForests, loading: propLoading, error: propError }) => {
    const { selectedForest, setSelectedForest } = useSelectedForest();
    const [forests, setForests] = useState(propForests || []);
    const [loading, setLoading] = useState(propLoading !== undefined ? propLoading : true);
    const [error, setError] = useState(propError || null);

    // Update state when props change
    useEffect(() => {
        if (propForests) setForests(propForests);
        if (propLoading !== undefined) setLoading(propLoading);
        if (propError !== undefined) setError(propError);
    }, [propForests, propLoading, propError]);


    const handleExportData = async () => {
        try {
            // Check if there's data to export
            if (!forests || forests.length === 0) {
                alert('No forest data available to export');
                return;
            }

            // CSV escape function to handle commas, quotes, and newlines
            const escapeCSV = (value) => {
                if (value === null || value === undefined) return '';
                const stringValue = String(value);
                // If value contains comma, quote, or newline, wrap in quotes and escape quotes
                if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
                    return `"${stringValue.replace(/"/g, '""')}"`;
                }
                return stringValue;
            };

            // Define CSV headers
            const headers = ['ID', 'Area (ha)', 'NDVI Δ', 'Confidence', 'Carbon (t)', 'Status'];

            // Create CSV rows
            const csvRows = [
                headers.join(','), // Header row
                ...forests.map(forest => {
                    // Extract numeric value from carbon (remove commas)
                    const carbonValue = forest.carbon ? forest.carbon.replace(/,/g, '') : '0';

                    return [
                        escapeCSV(forest.id || 'N/A'),
                        escapeCSV(typeof forest.area === 'number' ? forest.area.toFixed(2) : forest.area || '0'),
                        escapeCSV(forest.ndvi || 'N/A'),
                        escapeCSV(forest.conf || 'N/A'),
                        escapeCSV(carbonValue),
                        escapeCSV(forest.status || 'N/A')
                    ].join(',');
                })
            ];

            // Combine all rows into CSV string
            const csvContent = csvRows.join('\n');

            // Create blob and download
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);

            // Generate filename with timestamp
            const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
            link.setAttribute('href', url);
            link.setAttribute('download', `forest-registry-${timestamp}.csv`);
            link.style.visibility = 'hidden';

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Clean up the URL object
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Error exporting CSV:', err);
            alert('Failed to export data. Please try again.');
        }
    }
    // Debug: Log state changes
    useEffect(() => {
        console.log("ForestTable: State changed - forests:", forests);
        console.log("ForestTable: State changed - forests.length:", forests.length);
        console.log("ForestTable: State changed - loading:", loading);
        console.log("ForestTable: State changed - error:", error);
    }, [forests, loading, error]);

    //we are fetching real data from backend
    useEffect(() => {
        if (propForests) return; // Skip internal fetch if props are provided

        const fetchForests = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await getForests();
                console.log("ForestTable: Full response:", response);
                console.log("ForestTable: Response data:", response.data);
                console.log("ForestTable: Response data.forests:", response.data?.forests);

                // Handle both possible response structures
                let forestsArray = [];
                if (response && response.success && response.data) {
                    // Backend returns {forests: [...]}
                    if (response.data.forests && Array.isArray(response.data.forests)) {
                        forestsArray = response.data.forests;
                    } else if (Array.isArray(response.data)) {
                        // Fallback: if data itself is an array
                        forestsArray = response.data;
                    } else if (response.data && typeof response.data === 'object') {
                        // Try k find any array property
                        const keys = Object.keys(response.data);
                        console.log("ForestTable: Response.data keys:", keys);
                        for (const key of keys) {
                            if (Array.isArray(response.data[key])) {
                                console.log(`ForestTable: Found array at response.data.${key}`);
                                forestsArray = response.data[key];
                                break;
                            }
                        }
                    }
                } else if (response && Array.isArray(response)) {
                    // Direct array response
                    forestsArray = response;
                } else if (response && response.data && Array.isArray(response.data)) {
                    // Response with data as array
                    forestsArray = response.data;
                }

                console.log("ForestTable: Forests array:", forestsArray);
                console.log("ForestTable: Found", forestsArray.length, "forests");

                if (forestsArray.length > 0) {
                    console.log("ForestTable: Processing", forestsArray.length, "forests");
                    // Transform backend data to match component expectations
                    const transformedForests = forestsArray.map((forest, index) => {
                        try {
                            console.log(`ForestTable: Processing forest ${index + 1}:`, forest);

                            // Convert area from square meters to hectares
                            // Handle bigint/string area values
                            const areaValue = forest.area ? (typeof forest.area === 'string' ? parseFloat(forest.area) : Number(forest.area)) : 0;
                            const areaHectares = areaValue > 0 ? (areaValue / 10000).toFixed(2) : '0.00';

                            // Format NDVI - add + sign if positive, handle undefined
                            let ndvi = 'N/A';
                            if (forest.lastNDVI) {
                                const ndviValue = parseFloat(forest.lastNDVI);
                                if (!isNaN(ndviValue)) {
                                    ndvi = ndviValue >= 0 ? `+${ndviValue.toFixed(2)}` : ndviValue.toFixed(2);
                                }
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

                            const transformed = {
                                id: `FST-${String(forest.forestId).padStart(4, '0')}`, // Format ID like FST-0001
                                area: parseFloat(areaHectares),
                                ndvi: ndvi,
                                conf: conf,
                                carbon: carbon,
                                status: status,
                                // Keep original data for reference
                                original: forest
                            };

                            console.log(`ForestTable: Transformed forest ${index + 1}:`, transformed);
                            return transformed;
                        } catch (transformError) {
                            console.error(`ForestTable: Error transforming forest ${index + 1}:`, transformError, forest);
                            // Return a fallback object so we don't lose the forest
                            return {
                                id: `FST-${String(forest.forestId || index + 1).padStart(4, '0')}`,
                                area: 0,
                                ndvi: 'N/A',
                                conf: 'N/A',
                                carbon: '0',
                                status: 'ACTIVE',
                                original: forest
                            };
                        }
                    });

                    console.log("ForestTable: All transformed forests:", transformedForests);
                    console.log("ForestTable: Setting forests state with", transformedForests.length, "items");
                    setForests(transformedForests);
                    console.log("ForestTable: State set successfully");

                    // Set the latest forest as default selected (most recent by forestId or createdAt)
                    if (transformedForests.length > 0 && transformedForests[0].original) {
                        const latestForest = transformedForests.reduce((latest, current) => {
                            if (!current.original) return latest;
                            if (!latest.original) return current;

                            // Compare by createdAt if available, otherwise by forestId
                            const latestDate = latest.original.createdAt ? new Date(latest.original.createdAt) : null;
                            const currentDate = current.original.createdAt ? new Date(current.original.createdAt) : null;

                            if (latestDate && currentDate) {
                                return currentDate > latestDate ? current : latest;
                            }

                            // Fallback to forestId
                            const latestId = parseInt(latest.original.forestId || 0);
                            const currentId = parseInt(current.original.forestId || 0);
                            return currentId > latestId ? current : latest;
                        });

                        if (latestForest.original) {
                            console.log("ForestTable: Setting default selected forest:", latestForest.original.forestId);
                            setSelectedForest(latestForest.original);
                        }
                    }
                } else {
                    console.warn("ForestTable: No forests found in response");
                    console.log("ForestTable: Response structure:", JSON.stringify(response, null, 2));
                    console.log("ForestTable: Response.success:", response.success);
                    console.log("ForestTable: Response.data:", response.data);
                    setForests([]); // Set empty array instead of error if no forests
                }
            } catch (err) {
                console.error("ForestTable: Error fetching forests:", err);
                console.error("ForestTable: Error details:", {
                    message: err.message,
                    stack: err.stack,
                    name: err.name
                });
                setError(err.message || "Failed to fetch forests");
                setForests([]); // Set empty array on error
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
            setHeight={200} // 200 px
        >
            <div className="px-5 py-4 border-b border-white/5 flex justify-between items-center relative z-10">
                <h3 className="text-sm font-medium text-white">Forest Registry</h3>
                <button className="text-xs text-emerald-500 hover:text-emerald-400 font-mono transition-colors" onClick={handleExportData}>
                    EXPORT DATA
                </button>
            </div>

            <div className="overflow-x-auto relative z-10 min-h-[200px]  scrollbar-hide"> {/* This is the table container */}
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
                                    <br />
                               </td>
                            </tr>
                        ) : (
                            forests.map((forest, i) => {
                                console.log(`ForestTable: Rendering forest ${i}:`, forest);
                                return (
                                    <motion.tr
                                        key={forest.id || `forest-${i}`}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        onClick={() => {
                                            console.log("ForestTable: Forest clicked:", forest);
                                            if (forest.original) {
                                                setSelectedForest(forest.original);
                                            }
                                        }}
                                        className={`hover:bg-white/[0.02] transition-colors cursor-pointer group ${selectedForest?.forestId === forest.original?.forestId ? 'bg-emerald-500/10 border-l-2 border-emerald-500' : ''
                                            }`}
                                    >
                                        <td className="px-5 py-3 font-mono text-gray-300 group-hover:text-emerald-400 transition-colors">{forest.id || 'N/A'}</td>
                                        <td className="px-5 py-3 text-gray-400">{typeof forest.area === 'number' ? forest.area.toLocaleString() : String(forest.area || '0')}</td>
                                        <td className={`px-5 py-3 font-mono ${forest.ndvi && forest.ndvi.startsWith('+') ? 'text-emerald-500' : 'text-yellow-500'}`}>
                                            {forest.ndvi}
                                        </td>
                                        <td className="px-5 py-3 text-gray-400">{forest.conf}</td>
                                        <td className="px-5 py-3 text-right text-white font-medium">{forest.carbon}</td>
                                        <td className="px-5 py-3 text-right">
                                            <StatusBadge status={forest.status} />
                                        </td>
                                    </motion.tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </MagicCard>
    );
};

export default ForestTable;
