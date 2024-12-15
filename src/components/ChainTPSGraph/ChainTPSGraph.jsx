import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './ChainTPSGraph.css';

function ChainTPSGraph({ chainId }) {
  const [tpsHistory, setTpsHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchChainTPS = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL;
        const timestamp = new Date().getTime();
        const response = await fetch(`${API_URL}/api/chains/${chainId}/tps/history?t=${timestamp}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch TPS history');
        }
        
        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
          const sortedData = [...data.data].sort((a, b) => a.timestamp - b.timestamp);
          setTpsHistory(sortedData);
        }
      } catch (error) {
        console.error('Error fetching chain TPS history:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChainTPS();
  }, [chainId]);

  const formatDate = (timestamp) => {
    const date = new Date(
      timestamp.toString().length === 13 ? timestamp : timestamp * 1000
    );
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).replace(',', '');
  };

  if (isLoading) {
    return <div className="loading">Loading TPS data...</div>;
  }

  if (!tpsHistory.length) {
    return <div className="no-data">No TPS data available</div>;
  }

  return (
    <div className="chain-tps-graph">
      <div className="graph-header">
        <h3>Transaction Per Second</h3>
        <div className="refresh-info">Data refreshes every 24 hours</div>
      </div>
      <div className="graph-container">
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart
            data={tpsHistory}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="tpsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="timestamp"
              tickFormatter={formatDate}
              tick={{ fill: '#a0a0a0', fontSize: '12px' }}
              interval="preserveEnd"
              minTickGap={50}
            />
            <YAxis
              tick={{ fill: '#a0a0a0' }}
            />
            <Tooltip
              formatter={(value) => [`${Number(value).toFixed(2)} TPS`, 'TPS']}
              labelFormatter={formatDate}
              contentStyle={{
                background: '#1a1a1a',
                border: '1px solid #333',
                borderRadius: '4px'
              }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#82ca9d"
              fillOpacity={1}
              fill="url(#tpsGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default ChainTPSGraph; 