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
        console.log(`Raw TPS history response for chain ${chainId}:`, data);

        if (data.success) {
          let sortedData;
          
          // Handle both single point and historical data formats
          if (Array.isArray(data.data)) {
            sortedData = [...data.data].sort((a, b) => a.timestamp - b.timestamp);
          } else if (data.data && typeof data.data.value === 'number') {
            sortedData = [{
              timestamp: data.data.timestamp,
              value: data.data.value
            }];
          } else {
            console.error('Unexpected data format:', data);
            return;
          }
          
          // Data freshness check
          const latestTimestamp = sortedData[sortedData.length - 1]?.timestamp;
          const currentTime = Math.floor(Date.now() / 1000);
          const dataAge = currentTime - latestTimestamp;
          const hoursOld = dataAge / 3600;
          
          // Always log data age
          console.warn(`Chain ${chainId} data age check:`, {
            chainName: data.chainName,
            latestDataTime: new Date(latestTimestamp * 1000).toISOString(),
            currentTime: new Date(currentTime * 1000).toISOString(),
            hoursOld: hoursOld.toFixed(1)
          });

          // Explicitly warn if data is more than 24 hours old
          if (hoursOld > 24) {
            console.error(`WARNING: Chain ${chainId} data is ${hoursOld.toFixed(1)} hours old!`);
          }
          
          const processedData = sortedData.map(item => ({
            ...item,
            timestamp: item.timestamp * 1000
          }));
          
          setTpsHistory(processedData);
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
        <div className="refresh-info">
          Data refreshes every 24 hours
          {import.meta.env.DEV && (
            <div style={{fontSize: '12px', color: '#666'}}>
              Points: {tpsHistory.length}, 
              Latest: {tpsHistory.length > 0 ? tpsHistory[tpsHistory.length-1].value.toFixed(2) : 'N/A'} TPS
            </div>
          )}
        </div>
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