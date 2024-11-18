import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import useStore from '../../appStore';
import './TPSData.css';

function TPSData() {
  const tpsData = useStore((state) => state.tpsData);

  return (
    <div className="tps-data">
      <div className="tps-header">
        <h2>Transactions Per Second</h2>
        <div className="tps-current">
          {tpsData[tpsData.length - 1].tps} TPS
        </div>
      </div>
      <div className="graph-container">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={tpsData} 
            margin={{ 
              top: 10, 
              right: 10, /* Reduced right margin */
              left: 0, 
              bottom: 0 
            }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis 
              dataKey="name"
              tick={{ fill: '#a0a0a0', fontSize: '12px' }} /* Smaller font size */
              interval={0} /* Show all ticks */
            />
            <YAxis 
              tick={{ fill: '#a0a0a0' }}
            />
            <Tooltip />
            <Bar dataKey="tps" fill="#82ca9d" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default TPSData;
