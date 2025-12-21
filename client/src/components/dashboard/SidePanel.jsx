import React, { useState, useEffect } from 'react';
import { NDVIChart, CarbonChart } from './Charts';
import { MagicCard } from './MagicBento';
import { useSelectedForest } from '../../contexts/SelectedForestContext';
import { useCarbonCreditNFT } from '../../contexts/CarbonCreditNFTContext';
import { getForestNFTData } from '../../ApiFactory/ForestAPI';

const DetailRow = ({ label, value }) => (
    <div className="flex justify-between items-center py-2 border-b border-white/5 last:border-0 relative z-10">
        <span className="text-xs text-gray-500">{label}</span>
        <span className="text-sm font-mono text-gray-300">{value || 'N/A'}</span>
    </div>
);

const SidePanel = () => {
    const { selectedForest } = useSelectedForest();
    const { readOnlyContract, getForestHealthStatus, ownerOf, contractAddress } = useCarbonCreditNFT();
    const [nftData, setNftData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [healthStatus, setHealthStatus] = useState(null);
    const [tokenOwner, setTokenOwner] = useState(null);

    // Fetch NFT data when forest is selected
    useEffect(() => {
        const fetchNFTData = async () => {
            if (!selectedForest) {
                console.log("SidePanel: No forest selected");
                setNftData(null);
                return;
            }

            console.log("SidePanel: Fetching NFT data for forest:", selectedForest.forestId);
            setLoading(true);
            setError(null);

            try {
                // Fetch NFT metadata from IPFS
                const nft = await getForestNFTData(selectedForest);
                console.log("SidePanel: NFT data fetched:", nft);
                setNftData(nft);

                // Fetch contract data if token exists
                if (nft && nft.tokenId && readOnlyContract) {
                    try {
                        // Get health status
                        const status = await getForestHealthStatus(selectedForest.forestId);
                        console.log("SidePanel: Health status:", status);
                        setHealthStatus(status);

                        // Get token owner
                        const owner = await ownerOf(nft.tokenId);
                        console.log("SidePanel: Token owner:", owner);
                        setTokenOwner(owner);
                    } catch (contractError) {
                        console.error("SidePanel: Error fetching contract data:", contractError);
                        // Don't fail the whole operation if contract calls fail
                    }
                }
            } catch (err) {
                console.error("SidePanel: Error fetching NFT data:", err);
                setError(err.message || 'Failed to fetch NFT data');
            } finally {
                setLoading(false);
            }
        };

        fetchNFTData();
    }, [selectedForest, readOnlyContract, getForestHealthStatus, ownerOf]);

    // Format health status
    const formatHealthStatus = (status) => {
        const statusMap = {
            0: 'UNKNOWN',
            1: 'HEALTHY',
            2: 'DEGRADED',
            3: 'INVALID'
        };
        return statusMap[status] || 'UNKNOWN';
    };

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch {
            return dateString;
        }
    };

    // Get IPFS gateway URL for metadata
    const getIPFSUrl = (ipfsUri) => {
        if (!ipfsUri) return null;
        let hash = ipfsUri;
        if (hash.startsWith('ipfs://')) {
            hash = hash.replace('ipfs://', '');
        }
        // Use Pinata gateway
        return `https://gateway.pinata.cloud/ipfs/${hash}`;
    };

    // Get IPFS gateway URL for image
    const getIPFSImageUrl = (imageUri) => {
        if (!imageUri) return null;
        let hash = imageUri;
        if (hash.startsWith('ipfs://')) {
            hash = hash.replace('ipfs://', '');
        }
        // Use Pinata gateway
        return `https://gateway.pinata.cloud/ipfs/${hash}`;
    };

    // Extract coordinates from geoHash if available
    const getCoordinates = () => {
        if (!selectedForest?.geoHash) return null;
        try {
            // geoHash format: "minLng,maxLng,minLat,maxLat"
            const coords = selectedForest.geoHash.split(',');
            if (coords.length === 4) {
                return {
                    lat: parseFloat(coords[2]),
                    lon: parseFloat(coords[0])
                };
            }
        } catch {
            // Ignore parsing errors
        }
        return null;
    };

    const coordinates = getCoordinates();
    const ipfsMetadataUrl = nftData?.metadataUri ? getIPFSUrl(nftData.metadataUri) : null;
    const ipfsImageUrl = nftData?.imageUrl || (nftData?.metadata?.image ? getIPFSImageUrl(nftData.metadata.image) : null);

    return (
        <>
            {/* Selected Asset Card */}
            <MagicCard
                enableStars={false}
                className="!p-1 !bg-[#11141a]/80"
            >
                {loading ? (
                    <div className="aspect-square bg-black relative flex items-center justify-center rounded-sm z-10">
                        <div className="text-xs text-gray-500">Loading NFT data...</div>
                    </div>
                ) : !selectedForest ? (
                    <div className="aspect-square bg-black relative flex items-center justify-center rounded-sm z-10">
                        <div className="text-center">
                            <div className="text-[10px] font-mono text-gray-500 tracking-widest mb-2">NO ASSET SELECTED</div>
                            <div className="text-xs text-gray-600">Click on a forest to view NFT</div>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="aspect-square bg-black relative flex items-center justify-center overflow-hidden rounded-sm z-10">
                            {ipfsImageUrl ? (
                                <img
                                    src={ipfsImageUrl}
                                    alt={`Forest ${selectedForest.forestId} NFT`}
                                    className="absolute inset-0 w-full h-full object-cover opacity-90"
                                    onError={(e) => {
                                        console.error("SidePanel: Error loading NFT image from IPFS");
                                        e.target.style.display = 'none';
                                    }}
                                />
                            ) : (
                                <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/20 to-gray-900 flex items-center justify-center">
                                    <div className="text-center">
                                        <div className="text-[10px] font-mono text-emerald-500 tracking-widest mb-1">NO NFT IMAGE</div>
                                        <div className="text-xs text-gray-500">NFT not minted yet</div>
                                    </div>
                                </div>
                            )}
                            <div className="relative z-10 text-center">
                                <div className="text-[10px] font-mono text-emerald-500 tracking-widest mb-1">SELECTED ASSET</div>
                                <div className="text-2xl font-bold text-white tracking-tighter">
                                    FST-{String(selectedForest.forestId || 'N/A').padStart(4, '0')}
                                </div>
                            </div>

                            {/* Decorative overlay */}
                            {nftData && (
                                <div className="absolute top-4 right-4 w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_#10b981]"></div>
                            )}
                            {coordinates && (
                                <div className="absolute bottom-4 left-4 text-[10px] font-mono text-white/50">
                                    lat: {coordinates.lat.toFixed(4)} lon: {coordinates.lon.toFixed(4)}
                                </div>
                            )}
                        </div>

                        <div className="p-4 relative z-10">
                            <h3 className="text-sm font-medium text-white mb-4">NFT Metadata</h3>

                            {error && (
                                <div className="mb-4 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded text-xs text-red-400">
                                    {error}
                                </div>
                            )}

                            {nftData ? (
                                <>
                                    <DetailRow label="Token ID" value={`#${nftData.tokenId}`} />
                                    <DetailRow label="Forest ID" value={nftData.forestId} />
                                    <DetailRow label="Owner" value={tokenOwner ? `${tokenOwner.slice(0, 6)}...${tokenOwner.slice(-4)}` : selectedForest.owner?.slice(0, 6) + '...' + selectedForest.owner?.slice(-4)} />
                                    <DetailRow label="Health Status" value={healthStatus !== null ? formatHealthStatus(healthStatus) : 'N/A'} />
                                    <DetailRow label="Minted" value={formatDate(selectedForest.createdAt)} />
                                    <DetailRow label="Last Verified" value={formatDate(selectedForest.lastVerificationDate)} />
                                    <DetailRow label="NDVI" value={nftData.lastNDVI || 'N/A'} />
                                    <DetailRow label="Confidence" value={nftData.lastConfidence ? `${nftData.lastConfidence}%` : 'N/A'} />
                                    <DetailRow label="Area" value={nftData.area ? `${(nftData.area / 10000).toFixed(2)} ha` : 'N/A'} />
                                    <DetailRow label="Carbon Credits" value={nftData.totalCarbonCredits?.toLocaleString() || '0'} />
                                    <DetailRow label="TX Hash" value={nftData.txHash ? `${nftData.txHash.slice(0, 10)}...${nftData.txHash.slice(-8)}` : 'N/A'} />
                                    <DetailRow label="Status" value={nftData.isActive ? 'ACTIVE' : 'INACTIVE'} />

                                    {/* Metadata attributes from IPFS */}
                                    {nftData.metadata?.attributes && nftData.metadata.attributes.length > 0 && (
                                        <div className="mt-4 pt-4 border-t border-white/5">
                                            <div className="text-xs text-gray-500 mb-2">IPFS Attributes</div>
                                            {nftData.metadata.attributes.map((attr, idx) => (
                                                <DetailRow
                                                    key={idx}
                                                    label={attr.trait_type || 'Attribute'}
                                                    value={String(attr.value || 'N/A')}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="text-xs text-gray-500 text-center py-4">
                                    No NFT minted for this forest yet
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-2 mt-4">
                                {ipfsMetadataUrl && (
                                    <button
                                        onClick={() => {
                                            console.log("SidePanel: Opening IPFS URL:", ipfsMetadataUrl);
                                            window.open(ipfsMetadataUrl, '_blank');
                                        }}
                                        className="py-2 bg-white/5 hover:bg-white/10 text-xs text-white font-medium rounded transition-colors border border-white/5"
                                    >
                                        VIEW ON IPFS
                                    </button>
                                )}
                                {nftData?.tokenId && contractAddress && (
                                    <button
                                        onClick={() => {
                                            // OpenSea URL format: https://opensea.io/assets/{chain}/{contract_address}/{token_id}
                                            const chain = 'sepolia'; // Change to 'ethereum' for mainnet
                                            const openseaUrl = `https://opensea.io/assets/${chain}/${contractAddress}/${nftData.tokenId}`;
                                            console.log("SidePanel: Opening OpenSea URL:", openseaUrl);
                                            window.open(openseaUrl, '_blank');
                                        }}
                                        className="py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-xs text-emerald-500 font-medium rounded transition-colors border border-emerald-500/20"
                                    >
                                        OPENSEA
                                    </button>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </MagicCard>

            {/* Charts Section
            <MagicCard
                enableStars={false}
                className="!p-5 !bg-[#11141a]/80 !h-fit"
            >
                <h3 className="text-xs font-mono text-gray-500 uppercase tracking-wider mb-4 relative z-10">NDVI Trend (6mo)</h3>
                <div className="relative z-10">
                    <NDVIChart />
                </div>
            </MagicCard>

            <MagicCard
                enableStars={false}
                className="!p-5 !bg-[#11141a]/80 !h-fit"
            >
                <h3 className="text-xs font-mono text-gray-500 uppercase tracking-wider mb-4 relative z-10">Issuance History</h3>
                <div className="relative z-10">
                    <CarbonChart />
                </div>
            </MagicCard> */}
        </>
    );
};

export default SidePanel;
