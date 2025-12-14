import DevConsole from './DevConsole'
import './App.css'

function App() {
  // For dev testing, just render the DevConsole
  // This is a standalone component that doesn't use context providers
  return <DevConsole />
}

export default App

