import { Routes, Route } from 'react-router-dom'
import { useState } from 'react'
import { SpeedInsights } from '@vercel/speed-insights/react'
import { Analytics } from '@vercel/analytics/react'
import Sidebar from './components/Sidebar/Sidebar'
import Dashboard from './components/Dashboard/Dashboard'
import BlockchainDetails from './components/BlockchainDetails/BlockchainDetails'
import LaunchPad from './components/LaunchPad/LaunchPad'
import ACPs from './components/ACPs/ACPs'
import './App.css'
import Bridge from './components/Bridge/Bridge'
import VotePopup from './components/VotePopup/VotePopup'

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  const closeSidebar = () => {
    setIsSidebarOpen(false)
  }

  return (
    <div className="app">
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={closeSidebar}
        toggleSidebar={toggleSidebar}
      />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/blockchain/:id" element={<BlockchainDetails />} />
          <Route path="/launch" element={<LaunchPad />} />
          <Route path="/bridge" element={<Bridge />} />
          <Route path="/acps" element={<ACPs />} />
        </Routes>
      </main>
      <VotePopup />
      <SpeedInsights />
      <Analytics 
        debug={import.meta.env.DEV}
        mode={import.meta.env.DEV ? 'development' : 'production'}
      />
    </div>
  )
}

export default App
