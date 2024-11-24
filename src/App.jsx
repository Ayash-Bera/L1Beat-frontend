import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useState } from 'react'
import { Web3Provider } from '@0xstt/builderkit'
import { SpeedInsights } from '@vercel/speed-insights/react'
import { Analytics } from '@vercel/analytics/react'
import Header from './components/Header/Header'
import Sidebar from './components/Sidebar/Sidebar'
import Dashboard from './components/Dashboard/Dashboard'
import BlockchainDetails from './components/BlockchainDetails/BlockchainDetails'
import LaunchPad from './components/LaunchPad/LaunchPad'
import './App.css'
import HowItWorks from './components/HowItWorks/HowItWorks'
import Bridge from './components/Bridge/Bridge'
import { PoweredByAvalanche } from '@0xstt/builderkit';
import ScrollToTop from './utils/ScrollToTop';


// Define your chains
const CHAINS = [
  {
    id: 43113,
    name: "Avalanche Fuji",
    // Add other chain properties as needed
  },
  {
    id: 173750,
    name: "Your Destination Chain",
    // Add other chain properties as needed
  }
];

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  const closeSidebar = () => {
    setIsSidebarOpen(false)
  }

  // Close sidebar when clicking outside
  const handleMainClick = () => {
    if (isSidebarOpen) {
      setIsSidebarOpen(false)
    }
  }

  return (
    <Router>
      <ScrollToTop />
      <div className="app">
        <Header 
          isOpen={isSidebarOpen} 
          toggleSidebar={toggleSidebar}
          onClose={closeSidebar}
        />
        <Sidebar 
          isOpen={isSidebarOpen} 
          onClose={closeSidebar}
        />
        <main className="main-content" onClick={handleMainClick}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/blockchain/:id" element={<BlockchainDetails />} />
            <Route path="/launch" element={<LaunchPad />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/bridge" element={<Bridge />} />
          </Routes>
        </main>
        <SpeedInsights />
        <Analytics 
          debug={import.meta.env.DEV} // Enable debug mode in development
          mode={import.meta.env.DEV ? 'development' : 'production'}
        />
      </div>
    </Router>
  )
}

export default App
