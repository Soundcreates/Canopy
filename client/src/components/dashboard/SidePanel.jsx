import React from 'react';
import { NDVIChart, CarbonChart } from './Charts';

const DetailRow = ({ label, value }) => (
    <div className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
        <span className="text-xs text-gray-500">{label}</span>
        <span className="text-sm font-mono text-gray-300">{value}</span>
    </div>
);

const SidePanel = () => {
    return (
        <div className="space-y-6">
            {/* Selected Asset Card */}
            <div className="bg-[#11141a] border border-white/5 rounded-sm p-1">
                <div className="aspect-square bg-black relative flex items-center justify-center overflow-hidden rounded-sm">
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?q=80&w=2074&auto=format&fit=crop')] bg-cover bg-center opacity-50 grayscale hover:grayscale-0 transition-all duration-700"></div>
                    <div className="relative z-10 text-center">
                        <div className="text-[10px] font-mono text-emerald-500 tracking-widest mb-1">SELECTED ASSET</div>
                        <div className="text-2xl font-bold text-white tracking-tighter">AMZ-552</div>
                    </div>

                    {/* Decorative overlay */}
                    <div className="absolute top-4 right-4 w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_#10b981]"></div>
                    <div className="absolute bottom-4 left-4 text-[10px] font-mono text-white/50">lat: -3.4653 lon: -62.2159</div>
                </div>

                <div className="p-4">
                    <h3 className="text-sm font-medium text-white mb-4">NFT Metadata</h3>
                    <DetailRow label="Minted" value="Oct 24, 2023" />
                    <DetailRow label="Biome" value="Tropical Rainforest" />
                    <DetailRow label="Auditor" value="Verra (Auto-bridge)" />
                    <DetailRow label="Token ID" value="#882910" />

                    <div className="grid grid-cols-2 gap-2 mt-4">
                        <button className="py-2 bg-white/5 hover:bg-white/10 text-xs text-white font-medium rounded transition-colors border border-white/5">
                            VIEW ON IPFS
                        </button>
                        <button className="py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-xs text-emerald-500 font-medium rounded transition-colors border border-emerald-500/20">
                            OPENSEA
                        </button>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="bg-[#11141a] border border-white/5 rounded-sm p-5">
                <h3 className="text-xs font-mono text-gray-500 uppercase tracking-wider mb-4">NDVI Trend (6mo)</h3>
                <NDVIChart />
            </div>

            <div className="bg-[#11141a] border border-white/5 rounded-sm p-5">
                <h3 className="text-xs font-mono text-gray-500 uppercase tracking-wider mb-4">Issuance History</h3>
                <CarbonChart />
            </div>
        </div>
    );
};

export default SidePanel;
