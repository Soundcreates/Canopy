import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Mock database of users to search from
const MOCK_USERS_DB = [
    { id: '1', name: 'Dr. Emily Chen', address: '0x71C...9A21', email: 'emily.c@research.org', avatar: 'https://i.pravatar.cc/150?u=1' },
    { id: '2', name: 'Marcus Thorne', address: '0x3B2...44F2', email: 'm.thorne@eco-fund.com', avatar: 'https://i.pravatar.cc/150?u=2' },
    { id: '3', name: 'Sarah Oconnell', address: '0x9A1...88B0', email: 's.oconnell@forest-guard.org', avatar: 'https://i.pravatar.cc/150?u=3' },
    { id: '4', name: 'David Kim', address: '0xF22...11C9', email: 'david.kim@carbon-registry.io', avatar: 'https://i.pravatar.cc/150?u=4' },
    { id: '5', name: 'Elena Rodriguez', address: '0x1D4...99E3', email: 'elena.r@amazonia.br', avatar: 'https://i.pravatar.cc/150?u=5' },
    { id: '6', name: 'James Wilson', address: '0x5C8...22A1', email: 'j.wilson@green-tech.co', avatar: 'https://i.pravatar.cc/150?u=6' },
    { id: '7', name: 'Aisha Patel', address: '0x8B3...77D4', email: 'a.patel@climate-dao.eth', avatar: 'https://i.pravatar.cc/150?u=7' },
];

const AddMemberModal = ({ isOpen, onClose }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [invitedUsers, setInvitedUsers] = useState(new Set());

    useEffect(() => {
        // Debounce search simulation
        const timer = setTimeout(() => {
            if (query.length > 0) {
                handleSearch(query);
            } else {
                setResults([]);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    const handleSearch = async (searchQuery) => {
        setLoading(true);
        // Simulate API latency
        await new Promise(resolve => setTimeout(resolve, 600));

        const filtered = MOCK_USERS_DB.filter(user =>
            user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase())
        );

        setResults(filtered);
        setLoading(false);
    };

    const handleInvite = (userId) => {
        // In a real app, invite logic here
        setInvitedUsers(prev => new Set(prev).add(userId));
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
                                        placeholder="Search by name, address, or email..."
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
                                        {results.map((user) => (
                                            <motion.div
                                                layout
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                key={user.id}
                                                className="p-3 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/5 transition-all flex items-center gap-4 group"
                                            >
                                                {/* Avatar */}
                                                <div className="w-10 h-10 rounded-full bg-gray-800 overflow-hidden flex-none border border-white/10">
                                                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                                                </div>

                                                {/* Details */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="text-sm font-medium text-gray-200 group-hover:text-emerald-400 transition-colors truncate">{user.name}</h4>
                                                        {invitedUsers.has(user.id) && <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-1.5 rounded border border-emerald-500/20">INVITED</span>}
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className="text-xs text-gray-500 font-mono truncate max-w-[120px]">{user.address}</span>
                                                        <span className="text-[10px] text-gray-600">•</span>
                                                        <span className="text-xs text-gray-500 truncate">{user.email}</span>
                                                    </div>
                                                </div>

                                                {/* Action */}
                                                <button
                                                    onClick={() => handleInvite(user.id)}
                                                    disabled={invitedUsers.has(user.id)}
                                                    className={`px-3 py-1.5 text-xs font-mono font-medium rounded transition-all ${invitedUsers.has(user.id)
                                                            ? 'bg-transparent text-gray-500 cursor-not-allowed'
                                                            : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border border-emerald-500/20 hover:border-emerald-500/30'
                                                        }`}
                                                >
                                                    {invitedUsers.has(user.id) ? 'SENT' : 'ADD +'}
                                                </button>
                                            </motion.div>
                                        ))}
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
