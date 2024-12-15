import React, { useState, useEffect } from 'react';
import './VotePopup.css';

function VotePopup() {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if user has dismissed the popup before
    const hasSeenPopup = localStorage.getItem('l1beat_vote_popup_seen');
    if (!hasSeenPopup) {
      // Show popup after 3 seconds
      const timer = setTimeout(() => setIsVisible(true), 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    localStorage.setItem('l1beat_vote_popup_seen', 'true');
  };

  const handleVoteClick = () => {
    window.open('https://retro9000.avax.network/discover-builders/cm3wzqhj8006gcc6ce6h9yuhi', '_blank');
    handleDismiss();
  };

  if (!isVisible || isDismissed) return null;

  return (
    <div className="vote-popup-overlay">
      <div className="vote-popup">
        <button className="close-button" onClick={handleDismiss}>×</button>
        <h3>Support L1Beat! 🚀</h3>
        <p>Help us grow by voting for L1Beat in the Avalanche Retro9000 grant program!</p>
        <div className="popup-buttons">
          <button className="vote-button" onClick={handleVoteClick}>
            Vote Now
          </button>
          <button className="dismiss-button" onClick={handleDismiss}>
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
}

export default VotePopup; 