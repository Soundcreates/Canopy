import React from 'react';
import { motion } from 'framer-motion';
import Squares from '../components/SquareGrid';
import HeroSection from '../components/LandingPage/HeroSection';
import FeatureGrid from '../components/LandingPage/FeatureGrid';
import SystemFlow from '../components/LandingPage/SystemFlow';
import DashboardPreview from '../components/LandingPage/DashboardPreview';
import PageFooter from '../components/LandingPage/PageFooter';

const LandingPage = () => {
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
        <HeroSection itemVariants={itemVariants} />
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
          <FeatureGrid itemVariants={itemVariants} />
          <SystemFlow />
          <DashboardPreview />
          <PageFooter />
        </div>
      </div>
    </motion.div>
  );
};

export default LandingPage;
