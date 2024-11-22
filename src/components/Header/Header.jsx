import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './Header.css'
import logo from '../../assets/l1_logo_main.png'

function Header({ onMenuClick }) {
  const navigate = useNavigate()
  const [prevScrollPos, setPrevScrollPos] = useState(window.pageYOffset)
  const [visible, setVisible] = useState(true)
  const [animateLogo, setAnimateLogo] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollPos = window.pageYOffset
      const isVisible = prevScrollPos > currentScrollPos || currentScrollPos < 10

      setPrevScrollPos(currentScrollPos)
      setVisible(isVisible)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [prevScrollPos])

  const handleLogoClick = () => {
    setAnimateLogo(true);
    navigate('/');
    setTimeout(() => {
      setAnimateLogo(false);
    }, 1000);
  }

  return (
    <header className={`header ${visible ? '' : 'header-hidden'}`}>
      <div className="header-container">
        <button className="mobile-menu-btn" onClick={onMenuClick}>
          <div className="hamburger">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </button>
        <div 
          className={`logo ${animateLogo ? 'animate' : ''}`} 
          onClick={handleLogoClick} 
          style={{ cursor: 'pointer' }}
        >
          <img src={logo} alt="L1Beat Logo" />
        </div>
        <div className="search-container">
          <input 
            type="text" 
            className="search-input" 
            placeholder="Search..."
          />
        </div>
      </div>
    </header>
  )
}

export default Header
