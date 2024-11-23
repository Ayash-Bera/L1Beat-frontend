import { useParams, useNavigate } from 'react-router-dom'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { useState, useEffect, useMemo } from 'react'
import useStore from '../../appStore'
import './BlockchainDetails.css'
import copy from 'clipboard-copy';

// 1. Move helper functions outside of the component
const calculateStakeDistribution = (validators) => {
  if (!validators?.length) return [];

  const activeValidators = validators.filter(validator => 
    validator.validationStatus === 'active'
  );

  const totalStake = activeValidators.reduce((sum, validator) => {
    return sum + (parseFloat(validator.amountStaked) || 0);
  }, 0);

  return activeValidators.map(validator => {
    const stake = parseFloat(validator.amountStaked) || 0;
    const percentage = (stake / totalStake) * 100;
    
    return {
      name: validator.nodeId,
      value: Number(percentage.toFixed(2)),
      stake: stake,
      fill: `hsl(${Math.random() * 360}, 70%, 50%)`
    };
  }).sort((a, b) => b.value - a.value);
};

const calculateAverageUptime = (validators) => {
  if (!validators?.length) return 0;
  const total = validators.reduce((acc, v) => acc + (v.uptimePerformance || 0), 0);
  return (total / validators.length).toFixed(2);
};

// Update the copyToClipboard function
const copyToClipboard = (text) => {
  copy(text)
    .catch(err => console.error('Copy failed:', err));
};

function BlockchainDetails() {
  // 2. Define all hooks at the top level
  const { id } = useParams();
  const navigate = useNavigate();
  const fetchBlockchainData = useStore((state) => state.fetchBlockchainData);
  const blockchain = useStore((state) => 
    state.blockchainData.find(chain => chain.name.toLowerCase() === id.toLowerCase())
  );
  const isDataLoaded = useStore((state) => state.blockchainData.length > 0);
  const [addingNetwork, setAddingNetwork] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // 3. Use useEffect for data fetching
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        if (!isDataLoaded) {
          await fetchBlockchainData();
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [fetchBlockchainData, isDataLoaded]);

  // 4. Memoize calculations
  const stakeDistribution = useMemo(() => 
    calculateStakeDistribution(blockchain?.validators || []),
    [blockchain?.validators]
  );

  const averageUptime = useMemo(() => 
    calculateAverageUptime(blockchain?.validators),
    [blockchain?.validators]
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="details-container" role="alert" aria-busy="true">
        <div className="loading">
          <h2>Loading blockchain data...</h2>
        </div>
      </div>
    );
  }

  // Not found state
  if (!blockchain) {
    return (
      <div className="details-container">
        <div className="not-found">
          <h2>Blockchain not found</h2>
          <button onClick={() => navigate('/')}>Back to Dashboard</button>
        </div>
      </div>
    );
  }

  // Helper functions (defined outside of render cycle)
  const addToMetaMask = async () => {
    if (!window.ethereum) {
      alert('Please install MetaMask to add this network!');
      return;
    }

    setAddingNetwork(true);
    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: `0x${Number(blockchain.chainId).toString(16)}`,
          chainName: blockchain.name,
          nativeCurrency: {
            name: blockchain.networkToken?.name || 'AVAX',
            symbol: blockchain.networkToken?.symbol || 'AVAX',
            decimals: blockchain.networkToken?.decimals || 18
          },
          rpcUrls: [blockchain.rpcUrl],
          blockExplorerUrls: [blockchain.explorerUrl]
        }]
      });
      setAddSuccess(true);
      setTimeout(() => setAddSuccess(false), 2000);
    } catch (error) {
      console.error('Error adding network to MetaMask:', error);
      alert('Failed to add network to MetaMask. Please try again.');
    } finally {
      setAddingNetwork(false);
    }
  };

  return (
    <div className="details-container">
      <div className="cards-row">
        <div className="details-header">
          <div className="header-content">
            <div className="header-left">
              <img 
                src={blockchain.chainLogoUri} 
                alt={blockchain.name} 
                className="chain-logo"
              />
              <h1>{blockchain.name}</h1>
              <span className={`score score-${blockchain.score >= 80 ? 'high' : blockchain.score >= 50 ? 'medium' : 'low'}`}>
                Score: {blockchain.score}
              </span>
            </div>
            <div className="header-right">
              <a href={blockchain.explorerUrl} target="_blank" rel="noopener noreferrer">
                Explorer
              </a>
              <button 
                onClick={addToMetaMask} 
                className={`add-network-btn ${addingNetwork ? 'loading' : ''} ${addSuccess ? 'success' : ''}`}
                disabled={addingNetwork}
                title="Add to MetaMask"
              >
                <img 
                  src="/metamask-fox.svg" 
                  alt="MetaMask" 
                  className="metamask-icon"
                />
                {addingNetwork ? 'Adding...' : addSuccess ? 'Added!' : 'Add Network'}
              </button>
            </div>
          </div>
          <p className="chain-description">{blockchain.description}</p>
        </div>
      </div>

      <div className="details-grid">
        <div className="cards-row">
          <div className="detail-card validator-info-card">
            <h3>Validator Information</h3>
            <div className="validator-stats">
              <div className="stat-item">
                <span className="stat-label">Active Validators</span>
                <span className="stat-value">
                  {blockchain.validators?.filter(v => v.validationStatus === 'active').length || 0}
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Average Uptime</span>
                <span className="stat-value">{averageUptime}%</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Total Validators</span>
                <span className="stat-value">{blockchain.validators?.length || 0}</span>
              </div>
            </div>
            <div className="detail-content">
              {blockchain.validators && blockchain.validators.length > 0 && (
                <div className="validators-list">
                  <table className="validators-table">
                    <thead>
                      <tr>
                        <th>Node ID</th>
                        <th>Status</th>
                        <th>Uptime</th>
                        <th>Stake</th>
                      </tr>
                    </thead>
                    <tbody>
                      {blockchain.validators.map((validator) => (
                        <tr key={validator.nodeId}>
                          <td className="node-id-cell">
                            <div className="node-id-container">
                              <span 
                                className="node-id" 
                                onClick={() => copyToClipboard(validator.nodeId)}
                                title="Click to copy"
                              >
                                {validator.nodeId}
                              </span>
                            </div>
                          </td>
                          <td>
                            <span className={`status-${validator.validationStatus?.toLowerCase()}`}>
                              {validator.validationStatus || 'Unknown'}
                            </span>
                          </td>
                          <td>{validator.uptimePerformance?.toFixed(2) || 0}%</td>
                          <td>{validator.amountStaked || 0} AVAX</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className="detail-card stake-distribution-card">
            <h3>Active Validators Stake Distribution</h3>
            <div className="stake-summary">
              <div className="stat-item">
                <span className="stat-label">Total Active Stake</span>
                <span className="stat-value">
                  {stakeDistribution.reduce((sum, item) => sum + item.stake, 0).toLocaleString()} AVAX
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Active Validators</span>
                <span className="stat-value">
                  {stakeDistribution.length}
                </span>
              </div>
            </div>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={stakeDistribution}
                    cx={200}
                    cy={200}
                    labelLine={false}
                    outerRadius={120}
                    innerRadius={60}
                    fill="#8884d8"
                    dataKey="value"
                    paddingAngle={2}
                    label={({ value }) => `${value.toFixed(1)}%`}
                  >
                    {stakeDistribution.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.fill}
                        stroke="#1a1a1a"
                        strokeWidth={1}
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name, props) => [
                      `${value.toFixed(1)}% (${props.payload.stake.toLocaleString()} AVAX)`,
                      `NodeID: ${props.payload.name}`
                    ]}
                    contentStyle={{ 
                      background: '#1a1a1a', 
                      border: '1px solid #333',
                      borderRadius: '8px',
                      padding: '12px',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
                      fontFamily: 'monospace'
                    }}
                    itemStyle={{ 
                      color: '#ffffff',
                      padding: '4px 0'
                    }}
                    wrapperStyle={{
                      zIndex: 100
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="validators-legend">
              <table className="validator-list-table">
                <thead>
                  <tr>
                    <th></th>
                    <th>Node ID</th>
                    <th>Stake</th>
                    <th>Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {stakeDistribution.map((validator, index) => (
                    <tr key={index}>
                      <td>
                        <div 
                          className="color-dot" 
                          style={{ backgroundColor: validator.fill }}
                        ></div>
                      </td>
                      <td className="nodeid-cell">
                        <span 
                          className="node-id"
                          onClick={() => copyToClipboard(validator.name)}
                          title="Click to copy"
                        >
                          {validator.name.slice(0, 8)}...{validator.name.slice(-8)}
                        </span>
                      </td>
                      <td>{validator.stake.toLocaleString()} AVAX</td>
                      <td>{validator.value.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="cards-row bottom-row">
          <div className="detail-card">
            <h3>Network Statistics</h3>
            <div className="detail-content">
              <p>Block Time: {blockchain.networkStats.blockTime}</p>
              <p>Finality: {blockchain.networkStats.finality}</p>
              <p>Network Usage: {blockchain.networkStats.networkUsage}</p>
              <p>Stake Requirement: {blockchain.networkStats.stakeRequirement}</p>
              <p>Uptime: {blockchain.networkStats.uptime}</p>
            </div>
          </div>

          <div className="detail-card">
            <h3>Economics</h3>
            <div className="detail-content">
              <p>Market Cap: ${blockchain.economics.marketCap}</p>
              <p>Circulating Supply: {blockchain.economics.circulatingSupply}</p>
              <p>Total Supply: {blockchain.economics.totalSupply}</p>
              <p>Staking APR: {blockchain.economics.stakingAPR}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BlockchainDetails
