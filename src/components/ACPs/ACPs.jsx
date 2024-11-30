import { useState, useEffect } from 'react';
import './ACPs.css';

const STATUS_COLORS = {
  'Proposed': { bg: '#2d4052', text: '#81a5c6' },
  'Implementable': { bg: '#2d523d', text: '#81c69b' },
  'Activated': { bg: '#4b2d52', text: '#c681c6' },
  'Stale': { bg: '#522d2d', text: '#c68181' }
};

// Hardcoded ACP list with added GitHub URLs
const ACP_LIST = [
  { number: '151', title: 'Use current block P-Chain height as context', path: '151-use-current-block-pchain-height-as-context', status: 'Implementable' },
  { number: '131', title: 'Cancun EIPs', path: '131-cancun-eips', status: 'Implementable' },
  { number: '125', title: 'Basefee Reduction', path: '125-basefee-reduction', status: 'Implementable' },
  { number: '118', title: 'Warp Signature Request', path: '118-warp-signature-request', status: 'Implementable' },
  { number: '113', title: 'Provable Randomness', path: '113-provable-randomness', status: 'Proposed' },
  { number: '108', title: 'EVM Event Importing', path: '108-evm-event-importing', status: 'Proposed' },
  { number: '103', title: 'Dynamic Fees', path: '103-dynamic-fees', status: 'Proposed' },
  { number: '99', title: 'Validator Manager Solidity Standard', path: '99-validator-manager-solidity-standard', status: 'Proposed' },
  { number: '84', title: 'P4-table-preamble', path: '84-table-preamble', status: 'Activated' },
  { number: '83', title: 'Dynamic Multidimensional Fees', path: '83-dynamic-multidimensional-fees', status: 'Stale' },
  { number: '77', title: 'Reinventing Subnets', path: '77-reinventing-subnets', status: 'Implementable' },
  { number: '75', title: 'Acceptance Proofs', path: '75-acceptance-proofs', status: 'Proposed' },
  { number: '62', title: 'Disable addValidatorTx and addDelegatorTx', path: '62-disable-addvalidatortx-and-adddelegatortx', status: 'Activated' },
  { number: '41', title: 'Remove Pending Stakers', path: '41-remove-pending-stakers', status: 'Activated' },
  { number: '31', title: 'Enable Subnet Ownership Transfer', path: '31-enable-subnet-ownership-transfer', status: 'Activated' },
  { number: '30', title: 'Avalanche Warp X EVM', path: '30-avalanche-warp-x-evm', status: 'Activated' },
  { number: '25', title: 'VM Application Errors', path: '25-vm-application-errors', status: 'Activated' },
  { number: '24', title: 'Shanghai EIPs', path: '24-shanghai-eips', status: 'Activated' },
  { number: '23', title: 'P-Chain Native Transfers', path: '23-p-chain-native-transfers', status: 'Activated' },
  { number: '20', title: 'ED25519 P2P', path: '20-ed25519-p2p', status: 'Proposed' },
  { number: '13', title: 'Subnet Only Validators', path: '13-subnet-only-validators', status: 'Stale' }
].map(acp => ({
  ...acp,
  githubUrl: `https://github.com/avalanche-foundation/ACPs/tree/main/ACPs/${acp.path}`
}));

function ACPs() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [filteredACPs, setFilteredACPs] = useState(ACP_LIST);

  useEffect(() => {
    const filtered = ACP_LIST.filter(acp =>
      (statusFilter === 'All' || acp.status === statusFilter) &&
      (acp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
       acp.number.includes(searchTerm))
    );
    setFilteredACPs(filtered);
  }, [searchTerm, statusFilter]);

  return (
    <div className="acps-container">
      <h1>Avalanche Community Proposals (ACPs)</h1>
      
      <div className="acps-filters">
        <div className="acps-search">
          <input
            type="text"
            placeholder="Search ACPs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="status-filters">
          <button
            className={`status-filter ${statusFilter === 'All' ? 'active' : ''}`}
            onClick={() => setStatusFilter('All')}
          >
            All
          </button>
          {Object.keys(STATUS_COLORS).map(status => (
            <button
              key={status}
              className={`status-filter ${statusFilter === status ? 'active' : ''}`}
              onClick={() => setStatusFilter(status)}
              style={{
                backgroundColor: STATUS_COLORS[status].bg,
                color: STATUS_COLORS[status].text
              }}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div className="acps-list">
        {filteredACPs.map((acp) => (
          <a 
            href={acp.githubUrl}
            key={acp.number}
            className="acp-card-link"
            target="_blank"
            rel="noopener noreferrer"
          >
            <div className="acp-card">
              <div className="acp-card-header">
                <div className="acp-number">ACP-{acp.number}</div>
                <div 
                  className="acp-status"
                  style={{
                    backgroundColor: STATUS_COLORS[acp.status].bg,
                    color: STATUS_COLORS[acp.status].text
                  }}
                >
                  {acp.status}
                </div>
              </div>
              <h3>{acp.title}</h3>
              <div className="acp-view-details">
                View Details →
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

export default ACPs; 