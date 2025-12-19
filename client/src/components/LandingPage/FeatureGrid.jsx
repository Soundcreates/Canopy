import React from 'react';
import { motion } from 'framer-motion';

const SatelliteIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5" />
        <path d="M8.5 8.5 15.5 15.5" />
        <path d="M5.5 5.5 2 2" />
    </svg>
)

const MicrochipIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="4" width="16" height="16" rx="2" />
        <rect x="9" y="9" width="6" height="6" />
        <path d="M15 2v2" /><path d="M15 20v2" /><path d="M2 15h2" /><path d="M2 9h2" /><path d="M20 15h2" /><path d="M20 9h2" /><path d="M9 2v2" /><path d="M9 20v2" />
    </svg>
)

const ShieldIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
)

const HexIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    </svg>
)

const Card = ({ title, icon, desc, delay }) => (
    <motion.div
        variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 }
        }}
        whileHover={{ y: -5, borderColor: "rgba(16, 185, 129, 0.3)" }}
        className="group p-6 bg-[#12151a] border border-white/5 rounded-sm transition-all duration-300 cursor-default"
    >
        <div className="w-10 h-10 mb-4 flex items-center justify-center bg-white/5 rounded text-emerald-400 group-hover:bg-emerald-500/10 transition-colors">
            {icon}
        </div>
        <h3 className="text-white font-medium mb-2">{title}</h3>
        <p className="text-sm text-gray-500 leading-relaxed font-light">{desc}</p>
    </motion.div>
);

const FeatureGrid = ({ itemVariants }) => {
    return (
        <section className="py-24 px-6 border-b border-white/5">
            <motion.div
                className="max-w-6xl mx-auto"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                variants={{
                    visible: { transition: { staggerChildren: 0.1 } }
                }}
            >
                <motion.div variants={itemVariants} className="mb-12">
                    <h2 className="text-sm font-mono text-emerald-500 tracking-wider uppercase mb-2">/ Core Infrastructure</h2>
                    <p className="text-2xl text-white tracking-tight">Protocol Modules</p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card
                        title="Satellite Analysis"
                        icon={<SatelliteIcon />}
                        desc="Multi-spectral imagery ingestion for biomass estimation."
                        delay={0}
                    />
                    <Card
                        title="AI Verification"
                        icon={<MicrochipIcon />}
                        desc="Computer vision models detect deforestation in real-time."
                        delay={0.1}
                    />
                    <Card
                        title="Oracle Trust"
                        icon={<ShieldIcon />}
                        desc="Cryptographic proof of off-chain verification data."
                        delay={0.2}
                    />
                    <Card
                        title="Dynamic NFTs"
                        icon={<HexIcon />}
                        desc="Metadata updates reflecting current forest health states."
                        delay={0.3}
                    />
                </div>
            </motion.div>
        </section>
    );
};

export default FeatureGrid;
