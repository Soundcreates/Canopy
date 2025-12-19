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
import Dashboard2 from './pages/Dashboard2'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import OrganisationPage from './pages/OrganisationPage'
import ProfilePage from './pages/ProfilePage'
import CreateOrganisation from './pages/CreateOrganisation'
import OrganisationMarketplace from './pages/OrganisationMarketplace'
import OrgForestRegister from './pages/OrgForestRegister'

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
      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
        toastClassName="!bg-[#11141a] !border !border-white/10 !rounded-sm !shadow-lg"
        bodyClassName="!font-mono !text-sm"
        progressClassName="!bg-emerald-500"
      />
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
        <Route path="/dashboard2" element={<Dashboard2 />} />
        <Route path="/transparent" element={<Transparent />} />
        <Route path="/credits" element={<Credits />} />
        <Route path="/v2" element={<LandingPage2 />} />
        <Route path="/dev" element={<DevConsole />} />
        <Route path="/organisation" element={<OrganisationPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/create-org" element={<CreateOrganisation />} />
        <Route path="/marketplace" element={<OrganisationMarketplace />} />
        <Route path="/org/register/:orgId" element={<OrgForestRegister />} />
      </Routes>
    </AnimatePresence>
  );
}
export default App

