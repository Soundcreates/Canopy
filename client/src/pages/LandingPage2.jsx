
import React, { useRef, useState, useEffect } from "react";
import { motion, useScroll, useTransform, useSpring, useInView } from "framer-motion";

// --- Components ---

const HeroSection = () => {
    const { scrollY } = useScroll();
    const y1 = useTransform(scrollY, [0, 500], [0, 200]);
    const y2 = useTransform(scrollY, [0, 500], [0, -150]);
    const scale = useTransform(scrollY, [0, 300], [1, 0.9]);
    const opacity = useTransform(scrollY, [0, 300], [1, 0]);

    return (
        <div className="relative h-screen flex flex-col items-center justify-center overflow-hidden bg-slate-950 text-white perspective-1000">
            {/* Background Atmosphere */}
            <motion.div
                className="absolute inset-0 bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 opacity-50"
                animate={{
                    backgroundPosition: ["0% 0%", "100% 100%"],
                    scale: [1, 1.1, 1]
                }}
                transition={{
                    duration: 20,
                    repeat: Infinity,
                    repeatType: "reverse",
                    ease: "linear"
                }}
            />

            {/* Hero Content */}
            <motion.div
                style={{ y: y1, scale, opacity }}
                className="z-10 text-center px-6 max-w-4xl"
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.8, filter: "blur(10px)" }}
                    animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                >
                    <h1 className="text-6xl md:text-8xl font-bold tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-r from-teal-200 to-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]">
                        CANOPY
                    </h1>
                </motion.div>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
                    className="text-xl md:text-2xl text-slate-300 font-light tracking-wide mb-10"
                >
                    Satellite-verified carbon credits. <br />
                    <span className="text-teal-400 font-normal">Deterministic. Transparent. Liquid.</span>
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.8 }}
                    className="flex flex-col sm:flex-row gap-4 justify-center"
                >
                    <motion.button
                        whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(45, 212, 191, 0.5)" }}
                        whileTap={{ scale: 0.95 }}
                        className="px-8 py-3 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-full transition-colors cursor-pointer"
                    >
                        Initialize Protocol
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.05, borderColor: "rgba(45, 212, 191, 0.8)", boxShadow: "0 0 10px rgba(45, 212, 191, 0.2)" }}
                        whileTap={{ scale: 0.95 }}
                        className="px-8 py-3 border border-slate-600 hover:border-teal-400 text-slate-300 rounded-full transition-colors cursor-pointer"
                    >
                        View Documentation
                    </motion.button>
                </motion.div>
            </motion.div>

            {/* Floating abstract elements */}
            <motion.div
                style={{ y: y2, x: -100 }}
                className="absolute top-1/4 left-10 w-32 h-32 rounded-full border border-teal-500/20 blur-sm"
                animate={{ rotate: 360 }}
                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
                style={{ y: y2, x: 100 }}
                className="absolute bottom-1/4 right-10 w-48 h-48 rounded-full border border-emerald-500/10 blur-md"
                animate={{ rotate: -360 }}
                transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
                className="absolute bottom-10"
                animate={{ y: [0, 10, 0], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
                <div className="w-1 h-16 rounded-full bg-gradient-to-b from-teal-500 to-transparent"></div>
            </motion.div>
        </div>
    );
};

const FeatureCard = ({ title, description, delay }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 50, rotateX: 10 }}
            whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
            viewport={{ once: false, amount: 0.2 }}
            transition={{ duration: 0.8, delay, type: "spring", bounce: 0.4 }}
            whileHover={{ scale: 1.03, y: -5, boxShadow: "0 20px 40px -10px rgba(20, 184, 166, 0.2)" }}
            className="p-8 rounded-2xl bg-slate-900 border border-slate-800 hover:border-teal-500/50 transition-colors group cursor-default"
        >
            <div className="h-12 w-12 rounded-lg bg-teal-500/10 flex items-center justify-center mb-6 group-hover:bg-teal-500/20 transition-colors">
                <div className="h-2 w-2 rounded-full bg-teal-500 group-hover:scale-150 transition-transform" />
            </div>
            <h3 className="text-xl font-bold text-slate-100 mb-3">{title}</h3>
            <p className="text-slate-400 leading-relaxed">{description}</p>
        </motion.div>
    );
};

const FeatureGrid = () => {
    const features = [
        { title: "Satellite Analysis", description: "Multi-spectral imaging verifies biomass density and forest health in real-time." },
        { title: "AI Verification", description: "Computer vision models detect unauthorized logging or degradation events instantly." },
        { title: "On-Chain Registry", description: "Immutable proof of carbon capture stored on verified public ledgers." },
    ];

    return (
        <div className="py-24 px-6 bg-slate-950">
            <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
                {features.map((f, i) => (
                    <FeatureCard key={i} {...f} delay={i * 0.2} />
                ))}
            </div>
        </div>
    );
};

const PipelineStep = ({ number, title, active }) => {
    return (
        <motion.div
            className={`flex items-center gap-6 p-6 rounded-xl border transition-colors duration-500 ${active ? 'border-teal-500/50 bg-teal-950/10' : 'border-slate-800/50 opacity-50'}`}
            initial={{ x: -50, opacity: 0 }}
            whileInView={{ x: 0, opacity: active ? 1 : 0.5 }}
            transition={{ duration: 0.5 }}
        >
            <div className={`text-4xl font-mono font-bold ${active ? 'text-teal-400' : 'text-slate-700'}`}>0{number}</div>
            <div className="flex-1">
                <h3 className={`text-xl font-bold ${active ? 'text-white' : 'text-slate-500'}`}>{title}</h3>
                {active && (
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: "100%" }}
                        className="h-0.5 bg-teal-500 mt-2"
                    />
                )}
            </div>
        </motion.div>
    )
}

const PipelineSection = () => {
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start center", "end center"]
    });

    // Quick way to map scroll progress to active steps
    const [step, setStep] = useState(0);

    // This is a bit imperative but works well for the "scroll triggers specific states" feel
    useEffect(() => {
        return scrollYProgress.on('change', (v) => {
            if (v < 0.2) setStep(1);
            else if (v < 0.4) setStep(2);
            else if (v < 0.6) setStep(3);
            else if (v < 0.8) setStep(4);
            else setStep(5);
        })
    }, [scrollYProgress]);

    return (
        <div ref={ref} className="py-24 px-6 bg-slate-950 min-h-[150vh] relative">
            <div className="sticky top-1/4 max-w-2xl mx-auto space-y-4">
                <motion.h2
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    className="text-3xl font-bold text-center mb-12 text-slate-200"
                >
                    Verification Pipeline
                </motion.h2>

                <PipelineStep number={1} title="Register Forest" active={step >= 1} />
                <PipelineStep number={2} title="Satellite Scan" active={step >= 2} />
                <PipelineStep number={3} title="AI Verification" active={step >= 3} />
                <PipelineStep number={4} title="Oracle Attestation" active={step >= 4} />
                <PipelineStep number={5} title="Credit Retired" active={step >= 5} />
            </div>
        </div>
    )
}


const DashboardPreview = () => {
    return (
        <div className="py-32 px-6 bg-slate-900 border-t border-slate-800">
            <div className="max-w-5xl mx-auto text-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8 }}
                    className="relative rounded-xl overflow-hidden shadow-2xl border border-slate-700 bg-slate-950 p-4"
                >
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-500 to-purple-500" />
                    <div className="grid grid-cols-4 gap-4 text-left p-4 text-sm text-slate-400 font-mono border-b border-slate-800">
                        <div>ID</div>
                        <div>REGION</div>
                        <div>STATUS</div>
                        <div>CREDITS</div>
                    </div>
                    {[1, 2, 3, 4].map((i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ margin: "-50px" }}
                            transition={{ delay: i * 0.1, duration: 0.5 }}
                            whileHover={{ scale: 1.01, backgroundColor: "rgba(255,255,255,0.03)" }}
                            className="grid grid-cols-4 gap-4 text-left p-4 text-sm text-slate-300 border-b border-slate-800/50"
                        >
                            <div className="text-teal-500">#8F2{i}A</div>
                            <div>Amazonia Sector {i}</div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Verified
                            </div>
                            <div>+{(Math.random() * 1000).toFixed(2)}</div>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </div>
    )
}

export default function LandingPage2() {
    return (
        <div className="bg-slate-950 min-h-screen text-slate-200 selection:bg-teal-500/30">
            <HeroSection />
            <FeatureGrid />
            <PipelineSection />
            <DashboardPreview />

            <motion.footer
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                className="py-12 text-center text-slate-600 text-sm"
            >
                <p>SYSTEM STATUS: OPERATIONAL</p>
                <p className="mt-2">CANOPY PROTOCOL V2.0</p>
            </motion.footer>
        </div>
    );
}