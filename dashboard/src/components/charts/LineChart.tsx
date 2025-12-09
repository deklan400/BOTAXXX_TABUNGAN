import React from 'react';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface LineChartProps {
  data: any[];
  dataKey?: string;
  xKey: string;
  lines: { key: string; name: string; color: string }[];
}

export const LineChart: React.FC<LineChartProps> = ({ data, xKey, lines }) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <RechartsLineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
        <XAxis 
          dataKey={xKey} 
          stroke="#94a3b8"
          style={{ fontSize: '12px' }}
        />
        <YAxis 
          stroke="#94a3b8"
          style={{ fontSize: '12px' }}
        />
        <Tooltip 
          contentStyle={{
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '8px',
            color: '#f1f5f9'
          }}
        />
        <Legend 
          wrapperStyle={{ color: '#cbd5e1', fontSize: '12px' }}
        />
        {lines.map((line) => (
          <Line
            key={line.key}
            type="monotone"
            dataKey={line.key}
            name={line.name}
            stroke={line.color}
            strokeWidth={3}
            dot={{ fill: line.color, r: 4 }}
            activeDot={{ r: 6 }}
          />
        ))}
      </RechartsLineChart>
    </ResponsiveContainer>
  );
};
