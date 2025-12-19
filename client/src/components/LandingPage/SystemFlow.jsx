import React from 'react';
import { motion } from 'framer-motion';

const FlowStep = ({ number, label }) => (
    <motion.div
        variants={{
            hidden: { opacity: 0, scale: 0.8 },
            visible: { opacity: 1, scale: 1 }
        }}
        className="z-10 flex flex-col items-center gap-3 bg-[#0e1117] md:px-4 py-2"
    >
        <div className="w-8 h-8 flex items-center justify-center rounded border border-white/10 bg-[#0b0f14] text-xs font-mono text-gray-400">
            {number}
        </div>
        <span className="text-sm text-gray-300 font-medium">{label}</span>
    </motion.div>
);

const FlowArrow = () => (
    <motion.div
        variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1 }
        }}
        className="hidden md:block text-gray-700"
    >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
            <path d="M5 12h14M15 8l4 4-4 4" />
        </svg>
    </motion.div>
);

const SystemFlow = () => {
    return (
        <section className="architecture py-24 px-6 border-b border-white/5">
            <div className="max-w-6xl mx-auto">
                <motion.div
                    className="mb-16 text-center"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <h2 className="text-2xl font-semibold text-white tracking-tight">Lifecycle Verification Flow</h2>
                </motion.div>

                <motion.div
                    className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0 relative"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.4 }}
                    variants={{
                        visible: { transition: { staggerChildren: 0.15 } }
                    }}
                >
                    {/* Connecting Line (Desktop) */}
                    <motion.div
                        className="hidden md:block absolute top-1/2 left-0 h-px bg-white/5 -z-0"
                        initial={{ width: 0 }}
                        whileInView={{ width: "100%" }}
                        transition={{ duration: 1.5, ease: "easeInOut" }}
                    />

                    <FlowStep number="01" label="Register Forest" />
                    <FlowArrow />
                    <FlowStep number="02" label="Satellite Scan" />
                    <FlowArrow />
                    <FlowStep number="03" label="AI Analyze" />
                    <FlowArrow />
                    <FlowStep number="04" label="Mint Credit" />
                    <FlowArrow />
                    <FlowStep number="05" label="Retire" />
                </motion.div>
            </div>
        </section>
    );
};

export default SystemFlow;
