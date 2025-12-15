import React, { useState } from 'react';
import { motion } from 'framer-motion';
import CurvedLoop from '../components/CurvedLoop';
import FaultyTerminal from '../components/FaultyTerminal';
import Squares from '../components/SquareGrid';
import { useWallet } from '../contexts/WalletContext';

/**
 * LandingPage
 * 
 * Design Philosophy:
 * - "Research-grade" aesthetic: functional, precise, minimal.
 * - Color Palette: #0b0f14 (Background), #15191e (Surface), Emerald/Teal (Accents).
 * - Typography: Inter/Sans (UI), Mono (Data).
 * - Layout: Single column stack with extensive negative space.
 */

const LandingPage = () => {

  //metamask logic
    const {connectWallet} = useWallet();

    const handleMetaMask = () => {
      connectWallet();
    };



  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    },
    exit: {
      opacity: 0,
      filter: 'blur(10px)',
      transition: { duration: 0.5 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
    }
  };

  return (
    <motion.div
      className="min-h-screen font-sans text-gray-400 bg-black selection:bg-emerald-500/30 selection:text-emerald-200 overflow-x-hidden relative"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >

      <div className="relative z-10">

        {/* 
        HERO SECTION 
        Uses a subtle top gradient to create depth without overwhelming the dark theme.
      */}
        <section className="relative min-h-[90vh] flex flex-col items-center justify-center border-b border-white/5 overflow-hidden">
          <div className="absolute inset-0 z-0">
            <FaultyTerminal tint="#064e3b" scale={2.7} />
          </div>

          {/* Navigation / Header Brand */}
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
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-3 bg-gray-100 text-[#0b0f14] text-sm font-semibold rounded hover:bg-white transition-colors"
                onClick = {handleMetaMask}
              >
                Connect Wallet
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-3 bg-transparent border border-white/10 text-gray-300 text-sm font-medium rounded hover:border-white/20 hover:text-white transition-colors"
              >
                View Architecture
              </motion.button>
            </motion.div>
          </div>
        </section>
      </div>

      <div className="relative bg-black">
        <div className="absolute inset-0 z-0 h-full w-full">
          <Squares
            direction="diagonal"
            speed={0.5}
            borderColor="#333"
            squareSize={40}
            hoverFillColor="#222"
          />
        </div>
        <div className="relative z-10">


          {/* 
        FEATURE GRID 
        Grid layout imitating technical specification cards.
      */}
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


          {/* 
        SYSTEM FLOW 
        Horizontal process pipeline design.
      */}
          <section className="py-24 px-6 border-b border-white/5">
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


          {/* 
        DASHBOARD PREVIEW 
        Static mock interface showing data visualization layout.
      */}
          <section className="py-32 px-6 relative overflow-hidden">
            {/* Background Glow */}
            <motion.div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none"
              animate={{ opacity: [0.5, 0.8, 0.5], scale: [1, 1.1, 1] }}
              transition={{ duration: 8, repeat: Infinity }}
            />

            <div className="max-w-5xl mx-auto relative z-10">
              <motion.div
                className="text-center mb-12"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <h2 className="text-sm font-mono text-gray-500 tracking-wide uppercase">Live Network State</h2>
              </motion.div>

              <motion.div
                className="bg-[#0b0f14] border border-white/10 rounded-lg shadow-2xl overflow-hidden"
                initial={{ opacity: 0, y: 50, rotateX: 5 }}
                whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              >
                {/* Dashboard Header */}
                <div className="bg-[#0e1117] border-b border-white/5 px-6 py-4 flex justify-between items-center">
                  <div className="flex gap-4 text-sm font-mono text-gray-400">
                    <span className="text-white border-b border-emerald-500 pb-0.5">Forests</span>
                    <span className="hover:text-gray-200 cursor-pointer">Validators</span>
                    <span className="hover:text-gray-200 cursor-pointer">Transactions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-xs font-mono text-gray-500">WS: CONNECTED</span>
                  </div>
                </div>

                {/* Dashboard Table */}
                <div className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-white/[0.02] text-xs font-mono text-gray-500 uppercase">
                          <th className="px-6 py-4 font-normal">Asset ID</th>
                          <th className="px-6 py-4 font-normal">Region</th>
                          <th className="px-6 py-4 font-normal">Biomass (est)</th>
                          <th className="px-6 py-4 font-normal">Status</th>
                          <th className="px-6 py-4 font-normal text-right">Credits Minted</th>
                        </tr>
                      </thead>
                      <motion.tbody
                        className="divide-y divide-white/5 text-sm"
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, amount: 0.5 }}
                        variants={{
                          visible: { transition: { staggerChildren: 0.1 } }
                        }}
                      >
                        <DashboardRow
                          id="AMZ-0921"
                          region="Amazonas, BR"
                          biomass="14,230 t"
                          status="Verified"
                          credits="12,500"
                        />
                        <DashboardRow
                          id="CGO-4412"
                          region="Congo Basin, CG"
                          biomass="8,105 t"
                          status="Analyzing..."
                          credits="-"
                          statusColor="text-yellow-500"
                        />
                        <DashboardRow
                          id="BOR-1102"
                          region="Borneo, ID"
                          biomass="5,600 t"
                          status="Verified"
                          credits="4,200"
                        />
                      </motion.tbody>
                    </table>
                  </div>
                </div>

                {/* Dashboard Footer / Stats */}
                <div className="bg-[#0e1117] border-t border-white/5 px-6 py-4 flex justify-between items-center text-xs font-mono text-gray-500">
                  <div>Total Bio-Capacity: 4.2MT</div>
                  <div>24h Volume: $1.2M</div>
                </div>
              </motion.div>
            </div>

            <div className="mt-12 overflow-hidden">
              <CurvedLoop
                marqueeText="Made with love "
                className="text-emerald-500/20 font-mono tracking-tighter"
                speed={3}
                curveAmount={100}
              />
            </div>
          </section>



          {/* Footer */}
          <footer className="py-8 text-center text-xs text-gray-600 border-t border-white/5 font-mono">
            CANOPY PROTOCOL v1.0 // HACKATHON BUILD
          </footer>
        </div>
      </div>

    </motion.div>
  );
};

// --- Subcomponents for Cleanliness ---

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

const DashboardRow = ({ id, region, biomass, status, credits, statusColor = "text-emerald-400" }) => (
  <motion.tr
    variants={{
      hidden: { opacity: 0, x: -10 },
      visible: { opacity: 1, x: 0 }
    }}
    className="hover:bg-white/[0.02] transition-colors"
  >
    <td className="px-6 py-4 font-mono text-gray-400">{id}</td>
    <td className="px-6 py-4 text-white">{region}</td>
    <td className="px-6 py-4 text-gray-400">{biomass}</td>
    <td className={`px-6 py-4 text-xs font-mono uppercase ${statusColor}`}>
      <span className="flex items-center gap-2">
        {status === 'Verified' && <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>}
        {status}
      </span>
    </td>
    <td className="px-6 py-4 text-right font-mono text-white">{credits}</td>
  </motion.tr>
);

// --- Icons ---

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

export default LandingPage;
