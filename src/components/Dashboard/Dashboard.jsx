import { useEffect } from 'react';
import useStore from '../../appStore';
import TVLGraph from '../TVLGraph/TVLGraph'
import TPSData from '../TPSData/TPSData'
import BlockchainList from '../BlockchainList/BlockchainList';

function Dashboard() {
  const fetchBlockchainData = useStore(state => state.fetchBlockchainData);

  useEffect(() => {
    fetchBlockchainData();
  }, [fetchBlockchainData]);

  return (
    <div className="dashboard-container">
      <div className="top-row">
        <TVLGraph />
        <TPSData />
      </div>
      <BlockchainList />
    </div>
  )
}

export default Dashboard
