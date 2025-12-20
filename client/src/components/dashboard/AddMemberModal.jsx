import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWallet } from '../../contexts/WalletContext';
import { useParams } from 'react-router-dom';
import { searchUsers } from '../../ApiFactory/UserAPI';
import { sendInvitation } from '../../ApiFactory/InvitationAPI';
import { toast } from 'react-toastify';

const AddMemberModal = ({ isOpen, onClose, organisationId }) => {
    const { account, signer } = useWallet();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [invitedUsers, setInvitedUsers] = useState(new Set());
    const [sendingInvite, setSendingInvite] = useState(false);

    useEffect(() => {
        // Load default list when modal opens
        if (isOpen && query.length === 0) {
            loadDefaultUsers();
        }
    }, [isOpen]);

    useEffect(() => {
        // Debounce search
        const timer = setTimeout(() => {
            if (query.length > 0) {
                handleSearch(query);
            } else if (isOpen) {
                loadDefaultUsers();
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query, isOpen]);

    const loadDefaultUsers = async () => {
        setLoading(true);
        try {
            const response = await searchUsers('', 50);
            setResults(response.users || []);
        } catch (error) {
            console.error('Error loading users:', error);
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (searchQuery) => {
        setLoading(true);
        try {
            const response = await searchUsers(searchQuery, 50);
            setResults(response.users || []);
        } catch (error) {
            console.error('Error searching users:', error);
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    const handleInvite = async (userAddress) => {
        if (!account || !signer || !organisationId) {
            toast.error('Please connect your wallet');
            return;
        }

        if (invitedUsers.has(userAddress)) {
            return; // Already invited
        }

        setSendingInvite(true);
        try {
            // Sign message for authentication
            const message = 'Canopy invitation verification';
            const signature = await signer.signMessage(message);

            // Send invitation (pass signature, not message - API will use the message)
            await sendInvitation(account, signature, organisationId, userAddress, 'user');

            setInvitedUsers(prev => new Set(prev).add(userAddress));
            toast.success('Invitation sent successfully!', {
                position: 'top-right',
                autoClose: 3000,
            });
        } catch (error) {
            console.error('Error sending invitation:', error);
            toast.error(error.message || 'Failed to send invitation', {
                position: 'top-right',
                autoClose: 3000,
            });
        } finally {
            setSendingInvite(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
                    >
                        {/* Modal Content */}
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 10 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 10 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-lg bg-[#11141a] border border-white/10 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[600px]"
                        >
                            {/* Header */}
                            <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                                <div>
                                    <h3 className="text-lg font-medium text-white">Add Members</h3>
                                    <p className="text-xs text-gray-500 font-mono mt-1">SEARCH DATABASE FOR REGISTERED USERS</p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-1.5 rounded-md hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                </button>
                            </div>

                            {/* Search Input */}
                            <div className="p-5 pb-0">
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <svg className={`w-4 h-4 transition-colors ${loading ? 'text-emerald-500 animate-pulse' : 'text-gray-500 group-focus-within:text-emerald-500'}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="11" cy="11" r="8"></circle>
                                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                        </svg>
                                    </div>
                                    <input
                                        type="text"
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        placeholder="Search by display name or address..."
                                        className="block w-full pl-10 pr-3 py-2.5 bg-black/20 border border-white/10 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all font-mono"
                                        autoFocus
                                    />
                                    {loading && (
                                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                            <div className="w-3 h-3 rounded-full border-2 border-emerald-500/30 border-t-emerald-500 animate-spin"></div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Results Area */}
                            <div className="flex-1 overflow-y-auto p-2 scrollbar-hide min-h-[300px]">
                                {query.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-gray-600 space-y-3">
                                        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                                            <svg className="w-6 h-6 opacity-50" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                            </svg>
                                        </div>
                                        <p className="text-sm font-medium">Search for people to invite</p>
                                    </div>
                                ) : results.length === 0 && !loading ? (
                                    <div className="h-full flex flex-col items-center justify-center text-gray-500">
                                        <p className="text-sm">No users found matching "{query}"</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-1 mt-2">
                                        {results.map((user) => {
                                            const isInvited = invitedUsers.has(user.address);
                                            return (
                                                <motion.div
                                                    layout
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    key={user.address}
                                                    className="p-3 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/5 transition-all flex items-center gap-4 group"
                                                >
                                                    {/* Avatar */}
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500/20 to-purple-500/20 overflow-hidden flex-none border border-white/10 flex items-center justify-center">
                                                        <span className="text-xs font-mono text-emerald-400">
                                                            {user.displayName ? user.displayName.charAt(0).toUpperCase() : user.address.slice(2, 3).toUpperCase()}
                                                        </span>
                                                    </div>

                                                    {/* Details */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="text-sm font-medium text-gray-200 group-hover:text-emerald-400 transition-colors truncate">
                                                                {user.displayName || 'Anonymous User'}
                                                            </h4>
                                                            {isInvited && <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-1.5 rounded border border-emerald-500/20">INVITED</span>}
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <span className="text-xs text-gray-500 font-mono truncate max-w-[200px]">
                                                                {user.address}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Action */}
                                                    <button
                                                        onClick={() => handleInvite(user.address)}
                                                        disabled={isInvited || sendingInvite}
                                                        className={`px-3 py-1.5 text-xs font-mono font-medium rounded transition-all ${isInvited || sendingInvite
                                                                ? 'bg-transparent text-gray-500 cursor-not-allowed'
                                                                : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border border-emerald-500/20 hover:border-emerald-500/30'
                                                            }`}
                                                    >
                                                        {isInvited ? 'SENT' : sendingInvite ? 'SENDING...' : 'ADD +'}
                                                    </button>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="p-4 border-t border-white/5 bg-white/[0.02] flex justify-between items-center text-[10px] text-gray-600 font-mono uppercase">
                                <span>Canopy Network Directory</span>
                                <span>{results.length} results</span>
                            </div>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default AddMemberModal;
