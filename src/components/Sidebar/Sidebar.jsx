import { NavLink, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import './Sidebar.css'
import logo from '../../assets/l1_logo_main_2_hat.png'

function Sidebar({ isOpen, onClose, toggleSidebar }) {
  const navigate = useNavigate()
  const [animateLogo, setAnimateLogo] = useState(true)
  const [showComingSoon, setShowComingSoon] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimateLogo(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  const handleLogoClick = () => {
    if (window.innerWidth <= 768) {
      onClose();
    }
    setAnimateLogo(true)
    navigate('/')
    setTimeout(() => {
      setAnimateLogo(false)
    }, 1000)
  }

  // Handler for link clicks
  const handleLinkClick = () => {
    if (window.innerWidth <= 768) {
      onClose();
    }
  };

  const handleComingSoonClick = (e) => {
    e.preventDefault();
    setShowComingSoon(true);
    setTimeout(() => setShowComingSoon(false), 2000);
  };

  return (
    <>
      <button 
        className="mobile-menu-btn" 
        onClick={toggleSidebar}
        aria-label="Toggle menu"
      >
        <div className="hamburger">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </button>

      {isOpen && (
        <div 
          className="sidebar-overlay" 
          onClick={onClose}
        ></div>
      )}
      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div 
          className={`sidebar-logo ${animateLogo ? 'animate' : ''}`} 
          onClick={handleLogoClick}
        >
          <img src={logo} alt="Logo" />
        </div>
        <nav className="sidebar-nav">
          <ul className="sidebar-menu">
            <li className="sidebar-item">
              <NavLink 
                to="/" 
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                onClick={handleLinkClick}
              >
                <span className="sidebar-icon">📊</span>
                Dashboard
              </NavLink>
            </li>
            <li className="sidebar-item">
              <NavLink 
                to="/launch" 
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                onClick={handleLinkClick}
              >
                <span className="sidebar-icon">🔺</span>
                Launchpad
              </NavLink>
            </li>
            <li className="sidebar-item">
              <a 
                href="#" 
                className={`sidebar-link ${showComingSoon ? 'coming-soon' : ''}`}
                onClick={handleComingSoonClick}
              >
                <span className="sidebar-icon">🔗</span>
                {showComingSoon ? '🚀 Coming Soon!' : 'Native Bridge'}
              </a>
            </li>
            <li className="sidebar-item">
              <NavLink 
                to="/acps" 
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                onClick={handleLinkClick}
              >
                <span className="sidebar-icon">📑</span>
                ACPs
              </NavLink>
            </li>
          </ul>
          
          <div className="vote-section">
            <a 
              href="https://retro9000.avax.network/discover-builders/cm3wzqhj8006gcc6ce6h9yuhi" 
              target="_blank" 
              rel="noopener noreferrer"
              className="vote-button"
            >
              <span className="vote-icon">🗳️</span>
              Vote for L1Beat
              <span className="vote-badge">Retro9000</span>
            </a>
          </div>

          <div className="social-links">
            <a href="https://x.com/l1beat_io" target="_blank" rel="noopener noreferrer" className="social-link">
              <span className="social-icon">𝕏</span>
              Twitter
            </a>
            <a href="https://github.com/muhammetselimfe/L1Beat-frontend" target="_blank" rel="noopener noreferrer" className="social-link">
              <span className="social-icon">
                <svg height="20" width="20" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
                </svg>
              </span>
              GitHub
            </a>
            {/* <a href="https://t.me/YourHandle" target="_blank" rel="noopener noreferrer" className="social-link">
              <span className="social-icon">✈️</span>
              Telegram
            </a>
            <a href="https://discord.gg/YourServer" target="_blank" rel="noopener noreferrer" className="social-link">
              <span className="social-icon">💬</span>
              Discord
            </a> */}
            <a href="mailto:hello@l1beat.io" className="social-link">
              <span className="social-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </span>
              Email
            </a>
          </div>
        </nav>
      </div>
    </>
  )
}

export default Sidebar
