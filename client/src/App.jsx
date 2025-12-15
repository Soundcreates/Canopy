import DevConsole from './DevConsole'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import ForestRegister from './pages/ForestRegister'
import Transparent from './pages/Transparent'
import Credits from './pages/Credits'

import './index.css'

function App() {
  

  // This is a standalone component that doesn't use context providers
  return(
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/register" element={<ForestRegister />} />
        <Route path="/transparent" element={<Transparent />} />
        <Route path="/credits" element={<Credits />} />
        <Route path="/dev" element={<DevConsole />} />
      </Routes>
    </Router>
  )
}
export default App

