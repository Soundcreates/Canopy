import DevConsole from './DevConsole'
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import LandingPage from './pages/LandingPage'
import ForestRegister from './pages/ForestRegister'
import Transparent from './pages/Transparent'
import Credits from './pages/Credits'
import LandingPage2 from './pages/LandingPage2'
import ClickSpark from './components/ClickSpark'
import './index.css'
import DashboardPage from './pages/DashboardPage'

function App() {


  // This is a standalone component that doesn't use context providers
  return (
    <Router>
      <ClickSpark
        sparkColor='#10b981'
        sparkSize={10}
        sparkRadius={20}
        sparkCount={8}
        duration={400}
      >
        <AnimatedRoutes />
      </ClickSpark>
    </Router>
  )
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/register" element={<ForestRegister />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/transparent" element={<Transparent />} />
        <Route path="/credits" element={<Credits />} />
        <Route path="/v2" element={<LandingPage2 />} />
        <Route path="/dev" element={<DevConsole />} />
      </Routes>
    </AnimatePresence>
  );
}
export default App

