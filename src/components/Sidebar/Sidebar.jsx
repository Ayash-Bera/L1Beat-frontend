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
            <li className="sidebar-item">
              <NavLink 
                to="/how-it-works" 
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                onClick={handleLinkClick}
              >
                <span className="sidebar-icon">ℹ️</span>
                How Scoring System Works?
              </NavLink>
            </li>
          </ul>
        </nav>
      </div>
    </>
  )
}

export default Sidebar
