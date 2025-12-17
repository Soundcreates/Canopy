import React, {useState, useEffect } from 'react';
import { MagicCard } from './MagicBento';
import { getForests, getNDVIData } from '../../ApiFactory/ForestAPI';


const TimelineEvent = ({ date, title, subtitle, isLast }) => (
    <div className="relative pl-8 pb-8 z-10">
        {!isLast && (
            <div className="absolute top-2 left-[11px] h-full w-px bg-white/10"></div>
        )}
        <div className="absolute top-2 left-1 w-2.5 h-2.5 rounded-full bg-[#11141a] border border-emerald-500 z-10"></div>

        <div className="text-xs font-mono text-gray-500 mb-1">{date}</div>
        <div className="text-sm font-medium text-white mb-0.5">{title}</div>
        <div className="text-xs text-gray-500">{subtitle}</div>
    </div>
);

const VerificationTimeline = () => {
    const [ndviData, setNdviData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch NDVI data continuously
    useEffect(() => {
        console.log("VerificationTimeline: Starting continuous NDVI data fetching");
        
        const fetchNDVIData = async () => {
            try {
                setIsLoading(true);
                setError(null);
                
                console.log("VerificationTimeline: Fetching forests to get NDVI data");
                
                // First, get all forests
                const forestsResponse = await getForests();
                
                if (!forestsResponse.success || !forestsResponse.data) {
                    throw new Error('Failed to fetch forests');
                }

                // Backend returns {forests: [...]}, so we need to access forestsResponse.data.forests
                const forests = forestsResponse.data.forests || [];
                console.log("VerificationTimeline: Found forests:", forests.length);

                // Fetch NDVI data for each forest
                const ndviPromises = forests.map(async (forest) => {
                    try {
                        console.log("VerificationTimeline: Fetching NDVI for forest ID:", forest.forestId);
                        const ndviInfo = await getNDVIData(forest.forestId);
                        
                        if (ndviInfo) {
                            return {
                                forestId: forest.forestId,
                                lastNDVI: ndviInfo.lastNDVI,
                                lastVerificationDate: ndviInfo.lastVerificationDate,
                                forestName: `Forest #${forest.forestId}`,
                                area: forest.area
                            };
                        }
                        return null;
                    } catch (err) {
                        console.error(`VerificationTimeline: Error fetching NDVI for forest ${forest.forestId}:`, err);
                        return null;
                    }
                });

                const ndviResults = await Promise.all(ndviPromises);
                const validNdviData = ndviResults.filter(item => item !== null);
                
                // Sort by last verification date (most recent first)
                validNdviData.sort((a, b) => {
                    const dateA = a.lastVerificationDate ? new Date(a.lastVerificationDate) : new Date(0);
                    const dateB = b.lastVerificationDate ? new Date(b.lastVerificationDate) : new Date(0);
                    return dateB - dateA;
                });

                console.log("VerificationTimeline: NDVI data fetched:", validNdviData.length, "forests");
                setNdviData(validNdviData);
            } catch (err) {
                console.error("VerificationTimeline: Error fetching NDVI data:", err);
                setError(err.message || 'Failed to fetch NDVI data');
            } finally {
                setIsLoading(false);
            }
        };

        // Fetch immediately on mount
        fetchNDVIData();

        // Set up interval to fetch every 30 seconds (for continuous updates)
        const intervalId = setInterval(fetchNDVIData, 30000);

        // Cleanup
        return () => {
            console.log("VerificationTimeline: Cleaning up interval");
            clearInterval(intervalId);
        };
    }, []);

    // Format date for display
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleString('en-US', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'UTC',
                timeZoneName: 'short'
            });
        } catch {
            return dateString;
        }
    };

    return (
        <MagicCard
            enableStars={false}
            enableTilt={false}
            className="!bg-[#11141a]/80 " 
        >
            <h3 className="text-sm font-medium text-white mb-6 relative z-10">Verification Epochs</h3>

            {isLoading && (
                <div className="text-xs text-gray-500 text-center py-4 relative z-10">
                    Loading NDVI data...
                </div>
            )}

            {error && (
                <div className="text-xs text-red-400 text-center py-4 relative z-10">
                    Error: {error}
                </div>
            )}

            {!isLoading && !error && ndviData.length === 0 && (
                <div className="text-xs text-gray-500 text-center py-4 relative z-10">
                    No NDVI verification data available yet.
                </div>
            )}

            {!isLoading && !error && ndviData.length > 0 && (
                <div className="mt-2 relative z-10">
                    {ndviData.map((data, index) => (
                        <TimelineEvent
                            key={data.forestId}
                            date={formatDate(data.lastVerificationDate)}
                            title={`Forest #${data.forestId} Verified`}
                            subtitle={`NDVI: ${data.lastNDVI || 'N/A'} | Area: ${data.area ? (data.area / 10000).toFixed(2) : 'N/A'} hectares`}
                            isLast={index === ndviData.length - 1}
                        />
                    ))}
                </div>
            )}

            <button className="w-full mt-2 py-2 text-xs font-mono text-center text-gray-500 hover:text-white border border-white/5 hover:border-white/10 rounded transition-all relative z-10">
                VIEW FULL HISTORY
            </button>
        </MagicCard>
    );
};

export default VerificationTimeline;
