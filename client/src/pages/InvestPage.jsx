import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';
import { useCTKToken } from '../contexts/CTKTokenContext';
import { fetchOrganisationById } from '../ApiFactory/OrganisationAPI';
import Squares from '../components/SquareGrid';
import Dither from '../components/DitherBackground';
import { toast } from 'react-toastify';
import { ethers } from 'ethers';

// Icon Components
const IconWallet = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
        <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
    </svg>
);

const IconTrendingUp = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
        <polyline points="17 6 23 6 23 12" />
    </svg>
);

const IconCoins = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="8" cy="8" r="6" />
        <path d="M18.09 10.37A6 6 0 1 1 10.34 18" />
        <path d="M7 6h1v4" />
        <path d="m16.71 13.88.7.71-2.82 2.82" />
    </svg>
);

const IconCheck = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M20 6 9 17l-5-5" />
    </svg>
);

const InvestPage = () => {
    const { account } = useWallet();
    const { balance, invest, isLoading: tokenLoading, fetchBalance } = useCTKToken();
    const navigate = useNavigate();
    const { orgId } = useParams();

    const [investAmount, setInvestAmount] = useState('');
    const [isInvesting, setIsInvesting] = useState(false);
    const [authStatus, setAuthStatus] = useState(null);
    const [selectedPreset, setSelectedPreset] = useState(null);
    const [organisation, setOrganisation] = useState(null);
    const [loadingOrg, setLoadingOrg] = useState(false);

    // Preset amounts
    const presetAmounts = [100, 500, 1000, 5000, 10000];

    // Check authentication status
    useEffect(() => {
        if (!account) {
            setAuthStatus(false);
            return;
        }

        const storedAuth = localStorage.getItem(`canopy_auth_${account.toLowerCase()}`);
        if (!storedAuth) {
            setAuthStatus(false);
            return;
        }

        try {
            const authData = JSON.parse(storedAuth);
            if (authData.signature && authData.message && authData.address) {
                setAuthStatus(true);
            } else {
                setAuthStatus(false);
            }
        } catch {
            setAuthStatus(false);
        }
    }, [account]);

    // Fetch balance when component mounts
    useEffect(() => {
        if (account && fetchBalance) {
            fetchBalance();
        }
    }, [account, fetchBalance]);

    // Fetch organization by ID from URL parameter
    useEffect(() => {
        const fetchOrg = async () => {
            if (!orgId || !account) return;

            setLoadingOrg(true);
            try {
                const data = await fetchOrganisationById(account, orgId, false);
                if (data && data.organisation) {
                    setOrganisation(data.organisation);
                    console.log('Organization loaded:', data.organisation);
                } else {
                    toast.error('Organization not found');
                    navigate('/marketplace');
                }
            } catch (error) {
                console.error('Error fetching organisation:', error);
                toast.error('Failed to load organization');
                navigate('/marketplace');
            } finally {
                setLoadingOrg(false);
            }
        };

        fetchOrg();
    }, [orgId, account, navigate]);

    const handlePresetClick = (amount) => {
        setInvestAmount(amount.toString());
        setSelectedPreset(amount);
    };

    const handleInvestAmountChange = (e) => {
        const value = e.target.value;
        // Only allow numbers and decimals
        if (value === '' || /^\d*\.?\d*$/.test(value)) {
            setInvestAmount(value);
            setSelectedPreset(null);
        }
    };

    const handleInvest = async () => {
        if (!investAmount || parseFloat(investAmount) <= 0) {
            toast.error('Please enter a valid investment amount');
            return;
        }

        if (!account || !authStatus) {
            toast.error('Please connect your wallet and authenticate');
            return;
        }

        if (!organisation) {
            toast.error('Organization not loaded');
            return;
        }

        // Check if user has enough balance
        const balanceNum = parseFloat(balance);
        const investNum = parseFloat(investAmount);

        if (investNum > balanceNum) {
            toast.error(`Insufficient balance. You have ${balanceNum.toFixed(2)} CTK tokens`);
            return;
        }

        setIsInvesting(true);

        try {
            console.log('Investing tokens:', investAmount, 'to organization:', organisation.name);

            toast.info(`Processing investment to ${organisation.name}...`);

            // Call the invest function with organization's owner address as treasury
            const result = await invest(investAmount, organisation.owner);

            console.log('Investment successful!', result);

            // Record the investment in the database
            try {
                const token = localStorage.getItem('authToken');
                const apiBaseUrl = import.meta.env.VITE_BASE_URL || 'http://localhost:3000';

                const recordResponse = await fetch(`${apiBaseUrl}/api/investments/record`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        organisationId: orgId,
                        amount: result.treasuryAddress ? investAmount : investAmount, // Amount in ether
                        txHash: result.hash,
                        investorAddress: account
                    })
                });

                if (recordResponse.ok) {
                    const recordData = await recordResponse.json();
                    console.log('Investment recorded in database:', recordData);
                    toast.success(`Investment tracked: ${recordData.totalFunds ? ethers.formatEther(recordData.totalFunds) : '?'} CTK total raised`);
                } else {
                    const errorData = await recordResponse.json().catch(() => ({ error: 'Unknown error' }));
                    console.error('Failed to record investment:', errorData);
                    toast.warning(`Tokens transferred successfully, but tracking failed: ${errorData.error || 'Unknown error'}`);
                }
            } catch (recordError) {
                console.error('Error recording investment:', recordError);
                toast.warning('Tokens transferred successfully, but tracking system unavailable');
                // Don't fail the whole investment if recording fails
            }

            toast.success(`Successfully invested ${investAmount} CTK tokens in ${organisation.name}!`);

            // Clear form
            setInvestAmount('');
            setSelectedPreset(null);

            // Refresh balance
            await fetchBalance();

            // Navigate to dashboard after short delay
            setTimeout(() => {
                setIsInvesting(false);
                navigate('/dashboard');
            }, 2000);

        } catch (error) {
            console.error('Error investing tokens:', error);
            toast.error(error.message || 'Failed to invest tokens');
            setIsInvesting(false);
        }
    };

    const investAmountNum = parseFloat(investAmount) || 0;
    const estimatedReturns = investAmountNum * 0.12; // 12% estimated APY
    const estimatedMonthlyReturns = estimatedReturns / 12;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="min-h-screen bg-[#060010] text-gray-300 font-sans relative overflow-hidden"
        >
            {/* Background Layers */}
            <div className="fixed inset-0 z-0 opacity-40 pointer-events-none">
                <Squares
                    direction="diagonal"
                    speed={0.5}
                    squareSize={50}
                    borderColor="#ffffff10"
                    hoverFillColor="#10b98110"
                />
            </div>

            <div className="fixed inset-0 z-0 pointer-events-none opacity-20 mix-blend-overlay">
                <Dither
                    colorNum={4}
                    pixelSize={4}
                    disableAnimation
                    waveColor={[0, 0, 0]}
                />
            </div>

            <main className="relative z-10 p-6 md:p-12 max-w-5xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="mb-8 space-y-2 border-l-2 border-emerald-500 pl-4"
                >
                    <h1 className="text-3xl font-light text-white tracking-wide">Token Investment</h1>
                    <p className="text-sm text-gray-500">Invest in the Canopy ecosystem and earn rewards.</p>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left Column: Investment Form */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="lg:col-span-7 space-y-6"
                    >
                        {/* Wallet Status */}
                        <div className="bg-[#11141a]/90 backdrop-blur-md border border-white/10 rounded-sm p-4 flex justify-between items-center shadow-lg">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded bg-gradient-to-br from-emerald-900/50 to-gray-900 border border-white/10 flex items-center justify-center">
                                    <IconWallet className="w-4 h-4 text-emerald-500" />
                                </div>
                                <div>
                                    <div className="text-[10px] font-mono text-emerald-500 font-medium">
                                        {account ? 'WALLET CONNECTED' : 'WALLET NOT CONNECTED'}
                                    </div>
                                    <div className="text-xs font-mono text-gray-300">
                                        {account ? `${account.substring(0, 6)}...${account.substring(account.length - 4)}` : 'Please connect wallet'}
                                    </div>
                                </div>
                            </div>
                            {authStatus === true ? (
                                <div className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded text-[10px] text-emerald-500 font-medium uppercase tracking-wider flex items-center gap-1">
                                    <IconCheck className="w-3 h-3" /> Authenticated
                                </div>
                            ) : authStatus === false ? (
                                <div className="px-2 py-1 bg-amber-500/10 border border-amber-500/20 rounded text-[10px] text-amber-500 font-medium uppercase tracking-wider flex items-center gap-1">
                                    ⚠ Not Authenticated
                                </div>
                            ) : null}
                        </div>

                        {/* Token Balance Card */}
                        {account && (
                            <div className="bg-[#11141a]/90 backdrop-blur-md border border-white/10 rounded-sm p-4 shadow-lg">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <div className="text-[10px] font-mono text-gray-400 uppercase tracking-wider mb-1">
                                            Your CTK Balance
                                        </div>
                                        <div className="text-2xl font-medium text-white font-mono">
                                            {tokenLoading ? (
                                                <span className="text-gray-500">Loading...</span>
                                            ) : balance && balance !== '0' ? (
                                                parseFloat(balance).toLocaleString(undefined, { maximumFractionDigits: 2 })
                                            ) : (
                                                '0'
                                            )}
                                            <span className="text-sm text-gray-500 ml-2">CTK</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={fetchBalance}
                                        disabled={tokenLoading}
                                        className="px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/20 rounded text-xs font-mono font-medium transition-colors disabled:opacity-50"
                                    >
                                        {tokenLoading ? 'Refreshing...' : 'Refresh'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Authentication Warning */}
                        {authStatus === false && account && (
                            <div className="bg-amber-500/10 border border-amber-500/30 rounded-sm p-4 space-y-2">
                                <div className="text-xs font-mono text-amber-400 font-medium uppercase tracking-wider">
                                    ⚠ Authentication Required
                                </div>
                                <p className="text-xs text-gray-400">
                                    Please sign in before investing. Go to the{' '}
                                    <a href="/" className="text-emerald-400 hover:text-emerald-300 underline">
                                        landing page
                                    </a>
                                    {' '}to connect your wallet and sign the authentication message.
                                </p>
                            </div>
                        )}

                        {/* Organization Info Card */}
                        {account && authStatus && organisation && (
                            <div className="bg-[#11141a]/90 backdrop-blur-md border border-white/10 rounded-sm p-6 space-y-4 shadow-lg">
                                <h2 className="text-sm font-medium text-white border-b border-white/5 pb-2">Investing In</h2>

                                <div className="space-y-3">
                                    <div>
                                        <div className="text-lg font-medium text-white mb-1">{organisation.name}</div>
                                        <div className="text-xs text-gray-400">{organisation.description}</div>
                                    </div>
                                    <div className="flex items-center gap-4 text-[10px] text-gray-500 pt-2 border-t border-white/5">
                                        <span>Owner: {organisation.owner.substring(0, 6)}...{organisation.owner.substring(organisation.owner.length - 4)}</span>
                                        {organisation.memberCount && <span>• {organisation.memberCount} members</span>}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Loading Organization */}
                        {loadingOrg && (
                            <div className="bg-[#11141a]/90 backdrop-blur-md border border-white/10 rounded-sm p-6 text-center shadow-lg">
                                <div className="text-gray-500 text-sm">Loading organization...</div>
                            </div>
                        )}

                        {/* No Organization ID */}
                        {!orgId && account && authStatus && (
                            <div className="bg-amber-500/10 border border-amber-500/30 rounded-sm p-4 space-y-2">
                                <div className="text-xs font-mono text-amber-400 font-medium uppercase tracking-wider">
                                    ⚠ No Organization Selected
                                </div>
                                <p className="text-xs text-gray-400">
                                    Please select an organization from the{' '}
                                    <a href="/marketplace" className="text-emerald-400 hover:text-emerald-300 underline">
                                        marketplace
                                    </a>
                                    {' '}to invest.
                                </p>
                            </div>
                        )}

                        {/* Investment Amount Card */}
                        <div className="bg-[#11141a]/90 backdrop-blur-md border border-white/10 rounded-sm p-6 space-y-6 shadow-lg">
                            <h2 className="text-sm font-medium text-white border-b border-white/5 pb-2">Investment Amount</h2>

                            {/* Amount Input */}
                            <div className="space-y-3">
                                <label className="block text-[11px] font-mono uppercase tracking-wider text-gray-400 mb-1.5">
                                    Amount (Tokens) <span className="text-emerald-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={investAmount}
                                        onChange={handleInvestAmountChange}
                                        placeholder="Enter amount"
                                        className="w-full bg-[#0b0f14]/80 border border-white/10 text-gray-200 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 rounded-sm px-4 py-3 text-lg font-light transition-all outline-none backdrop-blur-sm"
                                    />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                        <IconCoins className="w-5 h-5 text-emerald-500/50" />
                                    </div>
                                </div>
                            </div>

                            {/* Preset Amounts */}
                            <div className="space-y-2">
                                <label className="block text-[11px] font-mono uppercase tracking-wider text-gray-400">
                                    Quick Select
                                </label>
                                <div className="grid grid-cols-5 gap-2">
                                    {presetAmounts.map((amount) => (
                                        <button
                                            key={amount}
                                            onClick={() => handlePresetClick(amount)}
                                            className={`px-3 py-2 text-xs font-mono rounded-sm transition-all ${selectedPreset === amount
                                                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 border'
                                                : 'bg-[#0b0f14]/80 border border-white/10 text-gray-400 hover:border-emerald-500/30 hover:text-emerald-400'
                                                }`}
                                        >
                                            {amount.toLocaleString()}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Investment Button */}
                            <div className="pt-4 border-t border-white/5 space-y-3">
                                {!account && (
                                    <div className="text-[10px] text-amber-500/70 font-mono text-center py-2 px-3 bg-amber-500/10 border border-amber-500/20 rounded-sm">
                                        ⚠ Connect wallet to invest
                                    </div>
                                )}
                                {!organisation && account && authStatus && !loadingOrg && (
                                    <div className="text-[10px] text-amber-500/70 font-mono text-center py-2 px-3 bg-amber-500/10 border border-amber-500/20 rounded-sm">
                                        ⚠ No organization selected
                                    </div>
                                )}
                                {!investAmount && account && organisation && (
                                    <div className="text-[10px] text-amber-500/70 font-mono text-center py-2 px-3 bg-amber-500/10 border border-amber-500/20 rounded-sm">
                                        ⚠ Enter investment amount
                                    </div>
                                )}
                                <button
                                    onClick={handleInvest}
                                    disabled={!account || !authStatus || !organisation || !investAmount || parseFloat(investAmount) <= 0 || isInvesting}
                                    className={`w-full py-3 text-xs font-mono uppercase tracking-wider rounded-sm transition-all ${account && authStatus && organisation && investAmount && parseFloat(investAmount) > 0 && !isInvesting
                                        ? 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-500 hover:text-emerald-400 border border-emerald-500/50 hover:border-emerald-400'
                                        : 'bg-gray-800/20 text-gray-600 border border-gray-700/30 cursor-not-allowed'
                                        }`}
                                >
                                    {isInvesting ? 'Processing Investment...' : 'Invest Tokens'}
                                </button>
                                <p className="text-[10px] text-gray-500 text-center">
                                    {organisation ? `Investing in ${organisation.name}` : 'Transaction will be processed on-chain.'}
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Right Column: Investment Stats & Info */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        className="lg:col-span-5 space-y-6"
                    >
                        {/* Estimated Returns */}
                        <div className="bg-[#11141a]/90 backdrop-blur-md border border-white/10 rounded-sm p-6 space-y-4 shadow-lg">
                            <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                                <IconTrendingUp className="w-4 h-4 text-emerald-500" />
                                <h2 className="text-sm font-medium text-white">Estimated Returns</h2>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-gray-400 font-mono">Investment</span>
                                    <span className="text-lg font-medium text-white font-mono">
                                        {investAmountNum.toLocaleString()} <span className="text-xs text-gray-500">tokens</span>
                                    </span>
                                </div>

                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-gray-400 font-mono">Annual APY</span>
                                    <span className="text-sm font-medium text-emerald-400 font-mono">12%</span>
                                </div>

                                <div className="h-px bg-white/5" />

                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-gray-400 font-mono">Yearly Returns</span>
                                    <span className="text-lg font-medium text-emerald-400 font-mono">
                                        +{estimatedReturns.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                    </span>
                                </div>

                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-gray-400 font-mono">Monthly Returns</span>
                                    <span className="text-sm font-medium text-emerald-400/70 font-mono">
                                        +{estimatedMonthlyReturns.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Investment Benefits */}
                        <div className="bg-[#11141a]/90 backdrop-blur-md border border-white/10 rounded-sm p-6 space-y-4 shadow-lg">
                            <h2 className="text-sm font-medium text-white border-b border-white/5 pb-2">Investment Benefits</h2>

                            <div className="space-y-3">
                                <div className="flex items-start gap-3">
                                    <div className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <IconCheck className="w-3 h-3 text-emerald-500" />
                                    </div>
                                    <div>
                                        <div className="text-xs font-medium text-gray-200">Passive Income</div>
                                        <div className="text-[10px] text-gray-500 mt-0.5">Earn rewards automatically</div>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <IconCheck className="w-3 h-3 text-emerald-500" />
                                    </div>
                                    <div>
                                        <div className="text-xs font-medium text-gray-200">Environmental Impact</div>
                                        <div className="text-[10px] text-gray-500 mt-0.5">Support forest conservation</div>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <IconCheck className="w-3 h-3 text-emerald-500" />
                                    </div>
                                    <div>
                                        <div className="text-xs font-medium text-gray-200">Governance Rights</div>
                                        <div className="text-[10px] text-gray-500 mt-0.5">Vote on protocol decisions</div>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <IconCheck className="w-3 h-3 text-emerald-500" />
                                    </div>
                                    <div>
                                        <div className="text-xs font-medium text-gray-200">Transparent Tracking</div>
                                        <div className="text-[10px] text-gray-500 mt-0.5">Real-time on-chain verification</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Risk Disclaimer */}
                        <div className="bg-amber-500/5 border border-amber-500/20 rounded-sm p-4">
                            <div className="text-[10px] font-mono text-amber-400 font-medium uppercase tracking-wider mb-2">
                                ⚠ Investment Disclaimer
                            </div>
                            <p className="text-[10px] text-gray-400 leading-relaxed">
                                Cryptocurrency investments carry risk. Past performance does not guarantee future results.
                                Please invest responsibly and only what you can afford to lose.
                            </p>
                        </div>
                    </motion.div>
                </div>
            </main>
        </motion.div>
    );
};

export default InvestPage;
