import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import useStore from '../../appStore';
import './TPSData.css';

function TPSData() {
  const { tpsData, fetchCombinedTpsData } = useStore();

  // Filter last 7 days of data
  const last7DaysData = tpsData.slice(-7);

  // Format timestamp for X-axis
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp * 1000);
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
          <p className="tooltip-date">{formatTimestamp(label)}</p>
          <p className="tooltip-value">{`${payload[0].value.toFixed(2)} TPS`}</p>
        </div>
      );
    }
    return null;
  };

  // Get the latest TPS value
  const latestTps = last7DaysData.length > 0 
    ? last7DaysData[last7DaysData.length - 1].value.toFixed(2)
    : 'N/A';

  return (
    <div className="tps-data">
      <div className="tps-header">
        <h2>Transactions Per Second (Last 7 Days)</h2>
        <div className="tps-current">
          {latestTps} TPS
        </div>
      </div>
      <div className="graph-container">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={last7DaysData} 
            margin={{ 
              top: 10, 
              right: 10,
              left: 0, 
              bottom: 0 
            }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis 
              dataKey="timestamp"
              tickFormatter={formatTimestamp}
              tick={{ fill: '#a0a0a0', fontSize: '12px' }}
              interval={0} // Show all ticks for 7 days
            />
            <YAxis 
              tick={{ fill: '#a0a0a0' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="value" 
              fill="#82ca9d" 
              name="Combined TPS"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default TPSData;
