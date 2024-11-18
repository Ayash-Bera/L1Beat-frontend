import { useState } from 'react';
import './LaunchPad.css';

function LaunchPad() {
  const [formData, setFormData] = useState({
    chainName: '',
    symbol: '',
    initialSupply: '',
    precompiles: []
  });

  const [showComingSoon, setShowComingSoon] = useState(false);

  const precompileOptions = [
    'Restrict Contract Deployers',
    'Restrict Transactions',
    'Mint Native Tokens'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handlePrecompileChange = (option) => {
    setFormData(prevState => ({
      ...prevState,
      precompiles: prevState.precompiles.includes(option)
        ? prevState.precompiles.filter(item => item !== option)
        : [...prevState.precompiles, option]
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setShowComingSoon(true);
    setTimeout(() => setShowComingSoon(false), 2000);
  };

  return (
    <div className="launch-pad">
      <div className="launch-card">
        <h2>Launch Avalanche L1</h2>
        <form onSubmit={handleSubmit} className="launch-form">
          <div className="form-group">
            <label htmlFor="chainName">Chain Name</label>
            <input
              type="text"
              id="chainName"
              name="chainName"
              value={formData.chainName}
              onChange={handleChange}
              placeholder="Enter chain name"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="symbol">Token Symbol</label>
            <input
              type="text"
              id="symbol"
              name="symbol"
              value={formData.symbol}
              onChange={handleChange}
              placeholder="Enter token symbol"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="initialSupply">Initial Token Supply</label>
            <div className="input-with-suffix">
              <input
                type="number"
                id="initialSupply"
                name="initialSupply"
                value={formData.initialSupply}
                onChange={handleChange}
                placeholder="Enter initial supply"
                required
              />
              <span className="input-suffix">{formData.symbol || 'Tokens'}</span>
            </div>
          </div>

          <div className="form-group">
            <label>Precompiles</label>
            <div className="precompiles-container">
              {precompileOptions.map((option) => (
                <div key={option} className="precompile-option">
                  <input
                    type="checkbox"
                    id={option}
                    checked={formData.precompiles.includes(option)}
                    onChange={() => handlePrecompileChange(option)}
                  />
                  <label htmlFor={option}>{option}</label>
                </div>
              ))}
            </div>
          </div>

          <button 
            type="submit" 
            className={`launch-button ${showComingSoon ? 'coming-soon' : ''}`}
            onClick={handleSubmit}
          >
            {showComingSoon ? '🚀 Coming Soon!' : 'Launch Blockchain'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default LaunchPad;
