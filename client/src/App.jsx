import DevConsole from './DevConsole'
import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'

function App() {
  // For dev testing, just render the DevConsole
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

