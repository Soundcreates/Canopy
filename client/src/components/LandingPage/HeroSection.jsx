import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useWallet } from '../../contexts/WalletContext';
import { useNavigate } from 'react-router-dom';
import FaultyTerminal from '../FaultyTerminal';

const API_BASE_URL = 'http://localhost:3000/api';

const HeroSection = ({ itemVariants }) => {
    const navigate = useNavigate();
    const { connectWallet, signer, account, isConnected, isLoading, error: walletError } = useWallet();
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [authError, setAuthError] = useState(null);
    const [authMessage, setAuthMessage] = useState(null);

    // Check if already authenticated (only from localStorage, no MetaMask popup)
    useEffect(() => {
        if (account) {
            checkAuthStatus();
        }
        if (isAuthenticated) {
            navigate("/dashboard");
        }
    }, [account, isAuthenticated, navigate]);

    const checkAuthStatus = () => {
        if (account) {
            const storedAuth = localStorage.getItem(`canopy_auth_${account.toLowerCase()}`);
            if (storedAuth) {
                try {
                    const authData = JSON.parse(storedAuth);
                    setIsAuthenticated(true);
                    setAuthMessage('Authenticated');
                } catch (err) {
                    console.error('Error parsing stored auth:', err);
                }
            }
        }
    };

    const handleMetaMask = async () => {
        try {
            console.log("Initializing Metamask Connection...");
            setAuthError(null);

            const connectedAddress = await connectWallet();
            console.log("Wallet connected, address:", connectedAddress);

            await new Promise(resolve => setTimeout(resolve, 100));

            if (signer && account) {
                console.log("Proceeding to authentication...");
                await authenticateUser();
            }
        } catch (err) {
            console.error("Error connecting wallet:", err);
            setAuthError(err.message || 'Failed to connect wallet');
        }
    };

    const authenticateUser = async () => {
        if (!signer || !account) {
            setAuthError('Wallet not connected');
            return;
        }

        setIsAuthenticating(true);
        setAuthError(null);

        try {
            console.log("Starting authentication process");
            const message = 'Canopy verification login';
            const signature = await signer.signMessage(message);

            const response = await verifyAuth(account, message, signature); //AuthAPi.js

            localStorage.setItem(`canopy_auth_${account.toLowerCase()}`, JSON.stringify({
                address: account,
                authenticated: true,
                timestamp: Date.now(),
                message: message,
                signature: signature
            }));

            setIsAuthenticated(true);
            setAuthMessage('Authentication successful');
        } catch (err) {
            console.error("Authentication error:", err);
            setAuthError(err.message || 'Authentication failed');
            setIsAuthenticated(false);
        } finally {
            setIsAuthenticating(false);
        }
    };

    return (
        <section className="relative min-h-[90vh] flex flex-col items-center justify-center border-b border-white/5 overflow-hidden">
            <div className="absolute inset-0 z-0">
                <FaultyTerminal tint="#064e3b" scale={2.7} />
            </div>

            <motion.div
                className="absolute top-0 left-0 w-full p-8 flex justify-between items-center"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
            >
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-emerald-500 rounded-sm"></div>
                    <span className="text-sm font-medium tracking-widest uppercase text-gray-300">Canopy</span>
                </div>
            </motion.div>

            <div className="max-w-4xl px-6 text-center z-10">
                <motion.div
                    variants={itemVariants}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/5 text-xs font-mono text-emerald-400 mb-8 backdrop-blur-sm"
                >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    NETWORK OPERATIONAL
                </motion.div>

                <motion.h1
                    variants={itemVariants}
                    className="text-5xl md:text-7xl font-semibold tracking-tighter text-white mb-6 leading-[1.1]"
                >
                    Satellite-verified carbon credits,<br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-br from-emerald-400 to-teal-700">automated by AI.</span>
                </motion.h1>

                <motion.p
                    variants={itemVariants}
                    className="max-w-xl mx-auto text-lg md:text-xl text-white leading-relaxed mb-10"
                >
                    High-fidelity natural capital verification on-chain.
                    Real-time satellite analysis, ML-driven auditing, and dynamic carbon NFTs.
                </motion.p>

                <motion.div
                    variants={itemVariants}
                    className="flex flex-col sm:flex-row items-center justify-center gap-4"
                >
                    {!isConnected ? (
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            disabled={isLoading || isAuthenticating}
                            className="px-8 py-3 bg-gray-100 text-[#0b0f14] text-sm font-semibold rounded hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={handleMetaMask}
                        >
                            {isLoading ? 'Connecting...' : 'Connect Wallet'}
                        </motion.button>
                    ) : isAuthenticated ? (
                        <motion.div
                            className="flex flex-col items-center gap-3"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <div className="px-6 py-3 bg-emerald-500/10 border border-emerald-500/30 rounded text-sm font-mono text-emerald-400 flex items-center gap-2">
                                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                                {account?.slice(0, 6)}...{account?.slice(-4)}
                            </div>
                            <p className="text-xs text-gray-500">Authenticated</p>
                        </motion.div>
                    ) : (
                        <motion.div
                            className="flex flex-col items-center gap-2"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                disabled={isAuthenticating}
                                className="px-8 py-3 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-sm font-semibold rounded hover:bg-emerald-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={authenticateUser}
                            >
                                {isAuthenticating ? 'Authenticating...' : 'Sign Message'}
                            </motion.button>
                            <p className="text-xs text-gray-500">{account?.slice(0, 6)}...{account?.slice(-4)}</p>
                        </motion.div>
                    )}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-8 py-3 bg-transparent border border-white/10 text-gray-300 text-sm font-medium rounded hover:border-white/20 hover:text-white transition-colors"
                        onClick={() => document.querySelector('.architecture').scrollIntoView({ behavior: 'smooth' })}
                    >
                        View Architecture
                    </motion.button>
                </motion.div>

                {/* Error Display */}
                {(walletError || authError) && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 px-4 py-2 bg-red-500/10 border border-red-500/30 rounded text-sm text-red-400 text-center max-w-md mx-auto"
                    >
                        {walletError || authError}
                    </motion.div>
                )}
            </div>
        </section>
    );
};

export default HeroSection;
