"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface PieChartData {
  name: string;
  value: number;
  color: string;
}

interface AssetPieChartProps {
  data: PieChartData[];
  height?: number;
  showLegend?: boolean;
}

export function AssetPieChart({ data, height = 200, showLegend = true }: AssetPieChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={80}
          paddingAngle={2}
          dataKey="value"
          stroke="hsl(220 20% 4%)"
          strokeWidth={2}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(220 20% 7%)',
            border: '1px solid hsl(220 20% 14%)',
            borderRadius: '12px',
            padding: '12px',
          }}
          formatter={(value, name) => [
            `$${Number(value).toLocaleString()} (${((Number(value) / total) * 100).toFixed(1)}%)`,
            String(name)
          ]}
        />
        
        {showLegend && (
          <Legend
            verticalAlign="middle"
            align="right"
            layout="vertical"
            iconType="circle"
            iconSize={10}
            formatter={(value) => (
              <span style={{ color: 'hsl(210 40% 98%)', fontSize: '13px' }}>{value}</span>
            )}
          />
        )}
      </PieChart>
    </ResponsiveContainer>
  );
}
