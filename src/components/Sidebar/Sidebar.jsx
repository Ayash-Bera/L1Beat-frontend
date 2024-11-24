import { NavLink } from 'react-router-dom'
import './Sidebar.css'

function Sidebar({ isOpen, onClose }) {
  // Handler for link clicks
  const handleLinkClick = () => {
    if (window.innerWidth <= 768) { // Only close on mobile
      onClose();
    }
  };

  return (
    <>
      {isOpen && (
        <div 
          className="sidebar-overlay" 
          onClick={onClose}
        ></div>
      )}
      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
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
              <div className="sidebar-link coming-soon-link">
                <span className="sidebar-icon">🔗</span>
                Native Bridge
                <span className="coming-soon-badge">Coming Soon</span>
              </div>
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
