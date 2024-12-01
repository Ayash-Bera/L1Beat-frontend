import { useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import useStore from '../../appStore'
import './TVLGraph.css'

function TVLGraph() {
  const { tvlData, fetchTVLData } = useStore();

  useEffect(() => {
    fetchTVLData();
  }, []);

  const deduplicateByDate = (data) => {
    const dateMap = new Map();
    
    data.forEach(entry => {
      const date = new Date(entry.date * 1000).setHours(0, 0, 0, 0);
      if (!dateMap.has(date) || dateMap.get(date).date < entry.date) {
        dateMap.set(date, entry);
      }
    });

    return Array.from(dateMap.values()).sort((a, b) => a.date - b.date);
  };

  const uniqueTVLData = tvlData ? deduplicateByDate(tvlData) : [];

  const formatTVL = (value) => {
    if (value >= 1000000000) {
      return `$${(value / 1000000000).toFixed(1)}B`
    }
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`
    }
    return `$${value.toFixed(0)}`
  }

  const formatDate = (timestamp) => {
    const date = new Date(timestamp * 1000)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit' 
    }).split(',')[0]
  }

  if (!uniqueTVLData || uniqueTVLData.length === 0) {
    return (
      <div className="tvl-graph">
        <div className="tvl-header">
          <h2>Total Value Locked</h2>
          <div className="tvl-current">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="tvl-graph">
      <div className="tvl-header">
        <h2>Total Value Locked(Just Avalanche C-Chain)</h2>
        <div className="tvl-current">
          {formatTVL(uniqueTVLData[uniqueTVLData.length - 1]?.tvl)}
        </div>
      </div>
      <div className="graph-container">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart 
            data={uniqueTVLData} 
            margin={{ 
              top: 10, 
              right: 10, 
              left: 0, 
              bottom: 0 
            }}
          >
            <defs>
              <linearGradient id="tvlGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis 
              dataKey="date" 
              tickFormatter={formatDate}
              tick={{ fill: '#a0a0a0', fontSize: '12px' }}
              interval="preserveStartEnd"
            />
            <YAxis 
              tickFormatter={formatTVL}
              tick={{ fill: '#a0a0a0' }}
            />
            <Tooltip 
              formatter={(value) => [formatTVL(value), 'TVL']}
              labelFormatter={formatDate}
            />
            <Area 
              type="monotone" 
              dataKey="tvl" 
              stroke="#8884d8" 
              fillOpacity={1} 
              fill="url(#tvlGradient)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default TVLGraph
