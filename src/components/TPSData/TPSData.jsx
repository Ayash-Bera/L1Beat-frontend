import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import useStore from '../../appStore';
import './TPSData.css';

function TPSData() {
  const { tpsData, fetchCombinedTpsData } = useStore();

  React.useEffect(() => {
    fetchCombinedTpsData();
  }, [fetchCombinedTpsData]);

  // Format date for X-axis
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Format tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-date">{formatDate(label)}</p>
          <p className="tooltip-value">{`${Number(payload[0].value).toFixed(2)} TPS`}</p>
          <p className="tooltip-chains">{`Active Chains: ${payload[0].payload.chainCount}`}</p>
        </div>
      );
    }
    return null;
  };

  // Get the latest TPS value
  const latestTps = tpsData.length > 0 
    ? Number(tpsData[tpsData.length - 1].totalTps).toFixed(2)
    : 'N/A';

  return (
    <div className="tps-data">
      <div className="tps-header">
        <div className="header-content">
          <h2>Transactions Per Second (Last 7 Days)</h2>
          <div className="refresh-info">
            Data refreshes every 24 hours
          </div>
        </div>
        <div className="tps-current">
          {latestTps} TPS
        </div>
      </div>
      <div className="graph-container">
        {tpsData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={tpsData} 
              margin={{ 
                top: 10, 
                right: 10,
                left: 0, 
                bottom: 0 
              }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis 
                dataKey="date"
                tickFormatter={formatDate}
                tick={{ fill: '#a0a0a0', fontSize: '12px' }}
                interval={0}
              />
              <YAxis 
                tick={{ fill: '#a0a0a0' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="totalTps" 
                fill="#82ca9d" 
                name="Network TPS"
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="no-data">No TPS data available</div>
        )}
      </div>
    </div>
  );
}

export default TPSData;
