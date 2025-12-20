import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopNav from '../components/dashboard/TopNav';
import { MagicCard } from '../components/dashboard/MagicBento';
import { motion } from 'framer-motion';
import { useOrganisation } from '../contexts/OrganisationContext';
import { useWallet } from '../contexts/WalletContext';
import { removeCachedData, getOrganisationsCacheKey } from '../utils/cache';

const CreateOrganisation = () => {
    const navigate = useNavigate();
    const { createOrganisation, isLoading } = useOrganisation();
    const { account, isConnected, connectWallet } = useWallet();
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        startDate: '',
        endDate: '',
        image: null
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFormData(prev => ({ ...prev, image: e.target.files[0] }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Check if wallet is connected
        if (!isConnected || !account) {
            try {
                await connectWallet();
            } catch (err) {
                return;
            }
        }

        // Validate required fields
        if (!formData.name || !formData.description || !formData.startDate || !formData.endDate) {
            return;
        }

        // Validate dates
        const startDate = new Date(formData.startDate);
        const endDate = new Date(formData.endDate);
        if (endDate <= startDate) {
            return;
        }

        try {
            const result = await createOrganisation({
                name: formData.name,
                description: formData.description,
                startDate: formData.startDate,
                endDate: formData.endDate,
                image: formData.image,
                owners: [], // Can be extended to add owners in the form
                users: []   // Can be extended to add users in the form
            });

            console.log("Organisation created:", result);
            
            // Invalidate cache to ensure fresh data is fetched
            if (account) {
                removeCachedData(getOrganisationsCacheKey(account));
            }
            
            // Small delay to ensure cache is cleared before navigation
            setTimeout(() => {
                navigate('/organisation'); // Redirect to the org page
            }, 100);
        } catch (error) {
            console.error("Error creating organisation:", error);
        }
    };

    return (
        <div className="h-screen w-full bg-[#0b0f14] text-gray-300 font-sans selection:bg-emerald-500/30 flex flex-col overflow-hidden">
            <div className="flex-none z-50">
                <TopNav title="Create Organization" />
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide p-4 md:p-8 flex items-center justify-center relative">

                {/* Background Decor */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/5 rounded-full blur-[100px]"></div>
                    <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/5 rounded-full blur-[100px]"></div>
                </div>

                <div className="w-full max-w-2xl relative z-10">
                    <div className="mb-6 text-center">
                        <h1 className="text-3xl font-medium text-white mb-2">Establish New Protocol</h1>
                        <p className="text-gray-500 font-mono text-sm max-w-md mx-auto">
                            INITIALIZE A NEW DECENTRALIZED ORGANIZATION FOR CARBON VERIFICATION AND ASSET MANAGEMENT.
                        </p>
                    </div>

                    <MagicCard className="!bg-[#11141a]/90 !p-8 !border-white/10 backdrop-blur-xl">
                        <form onSubmit={handleSubmit} className="flex flex-col gap-6">

                            {/* Organization Name */}
                            <div className="space-y-2">
                                <label className="text-xs font-mono text-emerald-500 uppercase tracking-wider">Organization Name</label>
                                <input
                                    required
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder="e.g. Amazonia Preservation DAO"
                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                                />
                            </div>

                            {/* Description */}
                            <div className="space-y-2">
                                <label className="text-xs font-mono text-emerald-500 uppercase tracking-wider">Mission / Description</label>
                                <textarea
                                    required
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    rows="4"
                                    placeholder="Describe the organization's goals..."
                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all resize-none"
                                />
                            </div>

                            {/* Timeline Group */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-mono text-emerald-500 uppercase tracking-wider">Start Date</label>
                                    <input
                                        required
                                        type="date"
                                        name="startDate"
                                        value={formData.startDate}
                                        onChange={handleInputChange}
                                        className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all [color-scheme:dark]"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-mono text-emerald-500 uppercase tracking-wider">End Date (Deadline)</label>
                                    <input
                                        required
                                        type="date"
                                        name="endDate"
                                        value={formData.endDate}
                                        onChange={handleInputChange}
                                        className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all [color-scheme:dark]"
                                    />
                                </div>
                            </div>

                            {/* Profile Picture (Optional) */}
                            <div className="space-y-2">
                                <label className="text-xs font-mono text-emerald-500 uppercase tracking-wider">
                                    Sovereign Identity (Image) <span className="text-gray-600 normal-case tracking-normal">- Optional</span>
                                </label>
                                <div className="border border-dashed border-white/20 rounded-lg p-6 bg-white/[0.02] hover:bg-white/[0.04] transition-colors flex flex-col items-center justify-center text-center cursor-pointer relative group">
                                    <input
                                        type="file"
                                        onChange={handleFileChange}
                                        accept="image/*"
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    />
                                    {formData.image ? (
                                        <div className="flex items-center gap-2 text-emerald-400">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            <span className="text-sm font-medium truncate max-w-[200px]">{formData.image.name}</span>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                            </div>
                                            <p className="text-sm text-gray-400">Click to upload or drag and drop</p>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isLoading || !isConnected}
                                className="mt-4 w-full bg-emerald-500 hover:bg-emerald-400 text-black font-medium py-3 rounded-lg transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed font-mono tracking-wide"
                            >
                                {isLoading ? 'INITIALIZING PROTOCOL...' : !isConnected ? 'CONNECT WALLET TO CONTINUE' : 'CREATE ORGANIZATION'}
                            </button>

                        </form>
                    </MagicCard>
                </div>
            </div>
        </div>
    );
};

export default CreateOrganisation;
