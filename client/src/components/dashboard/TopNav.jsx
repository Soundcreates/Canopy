import React from 'react';
import { useWallet } from '../../contexts/WalletContext';

const TopNav = () => {
    const { account, isConnected } = useWallet();

    return (
        <nav className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#0b0f14] sticky top-0 z-50">
            {/* Left: Logo/Brand */}
            <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-emerald-500 rounded-sm flex items-center justify-center">
                    <div className="w-2 h-2 bg-[#0b0f14] rounded-full"></div>
                </div>
                <span className="text-white font-medium tracking-wide">CANOPY <span className="text-gray-600">DASHBOARD</span></span>
            </div>

            {/* Center: Context/Title (Hidden on mobile) */}
            <div className="hidden md:block text-xs font-mono text-gray-500 tracking-widest uppercase">
                Carbon Verification Protocol V2.0
            </div>

            {/* Right: Wallet & Network */}
            <div className="flex items-center gap-4">
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded border border-purple-500/20 bg-purple-500/5">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                    <span className="text-xs font-mono text-purple-400">ETH SEPOLIA</span>
                </div>

                <div className="px-4 py-1.5 rounded border border-white/10 bg-white/5 text-xs font-mono text-gray-300">
                    {isConnected && account
                        ? `${account.slice(0, 6)}...${account.slice(-4)}`
                        : "Disconnected"
                    }
                </div>
            </div>
        </nav>
    );
};

export default TopNav;
