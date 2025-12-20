import React, { useState, useEffect } from "react";
import { useWallet } from "../../contexts/WalletContext";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import NotificationDropdown from "./NotificationDropdown";
import { clearAllCache } from "../../utils/cache";
import { getTokenBalance } from "../../ApiFactory/TokenAPI";

const TopNav = () => {
  const { account, isConnected, disconnectWallet } = useWallet();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [tokenBalance, setTokenBalance] = useState("0");
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const navigate = useNavigate();

  // Fetch token balance when account changes
  useEffect(() => {
    const fetchBalance = async () => {
      if (!account || !isConnected) {
        setTokenBalance("0");
        return;
      }

      setIsLoadingBalance(true);
      try {
        const response = await getTokenBalance(account, true);
        if (response.success) {
          setTokenBalance(parseFloat(response.balance).toFixed(2));
        }
      } catch (error) {
        console.error("Error fetching token balance:", error);
        setTokenBalance("0");
      } finally {
        setIsLoadingBalance(false);
      }
    };

    fetchBalance();
    // Refresh balance every 30 seconds
    const interval = setInterval(fetchBalance, 30000);
    return () => clearInterval(interval);
  }, [account, isConnected]);

  const handleDisconnect = () => {
    setIsDropdownOpen(false);
    disconnectWallet();
    // Clear all cached data
    clearAllCache();
    // Navigate to landing page
    navigate('/');
  };

  return (
    <nav className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#0b0f14] sticky top-0 z-50">
      {/* Left: Logo/Brand */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 mr-2 border-r border-white/5 pr-3">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 rounded-md hover:bg-white/5 text-gray-500 hover:text-white transition-colors"
            title="Go Back"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <button
            onClick={() => navigate(1)}
            className="p-1.5 rounded-md hover:bg-white/5 text-gray-500 hover:text-white transition-colors"
            title="Go Forward"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
        <div className="w-6 h-6 bg-emerald-500 rounded-sm flex items-center justify-center">
          <div className="w-2 h-2 bg-[#0b0f14] rounded-full"></div>
        </div>
        <span
          onClick={() => navigate("/dashboard")}
          className="text-white font-medium tracking-wide"
        >
          CANOPY <span className="text-gray-600">DASHBOARD</span>
        </span>
      </div>

      {/* Center: Context/Title (Hidden on mobile) */}
      <div className="hidden md:block text-xs font-mono text-gray-500 tracking-widest uppercase">
        Carbon Verification Protocol V2.0
      </div>

      {/* Right: Wallet & Network */}
      <div className="flex items-center gap-4">
        {/* Token Balance */}
        {isConnected && account && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded border border-emerald-500/20 bg-emerald-500/5">
            <svg
              className="w-3.5 h-3.5 text-emerald-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-xs font-mono text-emerald-400">
              {isLoadingBalance ? "..." : `${tokenBalance} CTK`}
            </span>
          </div>
        )}

        {/* Notifications */}
        {isConnected && <NotificationDropdown />}

        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded border border-purple-500/20 bg-purple-500/5">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
          <span className="text-xs font-mono text-purple-400">ETH SEPOLIA</span>
        </div>

        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="px-4 py-1.5 rounded border border-white/10 bg-white/5 text-xs font-mono text-gray-300 hover:bg-white/10 transition-colors flex items-center gap-2"
          >
            {isConnected && account
              ? `${account.slice(0, 6)}...${account.slice(-4)}`
              : "Disconnected"}
            <svg
              className={`w-3 h-3 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {/* Dropdown Menu */}
          {/* Dropdown Menu */}
          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="absolute right-0 mt-2 w-48 bg-[#11141a] border border-white/10 rounded-lg shadow-xl overflow-hidden z-50"
              >
                <div className="px-4 py-2 border-b border-white/5">
                  <p className="text-[10px] text-gray-500 font-mono uppercase">
                    Account
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    navigate("/profile");
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-emerald-400 transition-colors flex items-center gap-2"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  Profile Settings
                </button>
                <button
                  onClick={handleDisconnect}
                  className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-red-400 transition-colors flex items-center gap-2"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  Disconnect
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </nav>
  );
};

export default TopNav;
