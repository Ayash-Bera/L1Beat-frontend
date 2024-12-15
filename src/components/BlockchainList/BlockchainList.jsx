import { useNavigate } from 'react-router-dom'
import useStore from '../../appStore'
import './BlockchainList.css'
import { useState, useEffect } from 'react'
import { formatDistanceToNow } from 'date-fns'

function BlockchainList() {
  const navigate = useNavigate()
  const blockchainData = useStore((state) => state.blockchainData)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (blockchainData && blockchainData.length > 0) {
      setIsLoading(false)
    }
  }, [blockchainData])

  const getActiveValidatorCount = (validators) => {
    if (!validators) return 0;
    return validators.filter(validator => validator.validationStatus === 'active').length;
  };

  // Sort blockchains by active validator count in descending order
  const sortedBlockchains = [...blockchainData]
    .filter(chain => getActiveValidatorCount(chain.validators) > 0)
    .sort((a, b) => {
      const aValidators = getActiveValidatorCount(a.validators);
      const bValidators = getActiveValidatorCount(b.validators);
      return bValidators - aValidators;
    });

  const handleCardClick = (chainName) => {
    navigate(`/blockchain/${chainName.toLowerCase()}`)
  }

  const formatTVL = (value) => {
    return `$${(value / 1000000000).toFixed(1)}B`
  }

  const formatNumber = (num) => {
    return num.toLocaleString()
  }

  const formatTps = (tpsData) => {
    if (import.meta.env.DEV) {
      console.log('Formatting TPS Data for chain:', tpsData);
    }
    
    // Check for valid number in tpsData.value
    if (!tpsData || !tpsData.value || typeof tpsData.value !== 'number') {
      if (import.meta.env.DEV) {
        console.log('Invalid TPS data:', {
          tpsData,
          hasValue: tpsData?.value !== undefined,
          valueType: tpsData?.value ? typeof tpsData.value : 'undefined'
        });
      }
      return 'N/A';
    }
    
    return (
      <div className="tps-container">
        <span className="stat-value">{tpsData.value.toFixed(2)}</span>
      </div>
    );
  };

  return (
    <div className="data-list">
      <h2>Avalanche L1's Data</h2>
      {isLoading ? (
        <div className="loading-container">
          <div className="loader"></div>
          <p>Loading blockchain data...</p>
        </div>
      ) : (
        <div className="blockchain-cards">
          {sortedBlockchains.map((chain) => (
            <div 
              className="blockchain-card" 
              key={chain.chainId}
              onClick={() => handleCardClick(chain.name)}
              role="button"
              tabIndex={0}
            >
              <div className="card-header">
                <img 
                  src={chain.chainLogoUri} 
                  alt={chain.name} 
                  className="chain-logo"
                />
                <h3>{chain.name}</h3>
              </div>
              <div className="card-content">
                <div className="stat-item">
                  <span className="stat-label">Active Validators</span>
                  <span className="stat-value">{getActiveValidatorCount(chain.validators)}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">TVL</span>
                  <span className="stat-value">{formatTVL(chain.tvl)}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Average TPS</span>
                  {formatTps(chain.tps)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default BlockchainList;
