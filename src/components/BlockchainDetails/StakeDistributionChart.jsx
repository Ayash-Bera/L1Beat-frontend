import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

function StakeDistributionChart({ stakeDistribution }) {
  return (
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
  );
}

export default StakeDistributionChart;