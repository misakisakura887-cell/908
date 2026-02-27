"use client";

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface PerformanceChartProps {
  data: { date: string; value: number }[];
  height?: number;
  showGrid?: boolean;
  showAxis?: boolean;
  gradient?: boolean;
}

export function PerformanceChart({ 
  data, 
  height = 200, 
  showGrid = false, 
  showAxis = true,
  gradient = true 
}: PerformanceChartProps) {
  const isPositive = data.length > 1 && data[data.length - 1].value >= data[0].value;
  const color = isPositive ? '#10b981' : '#ef4444';
  const gradientId = `gradient-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: showAxis ? 0 : -30 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        
        {showGrid && (
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="hsl(220 20% 14%)" 
            vertical={false} 
          />
        )}
        
        {showAxis && (
          <>
            <XAxis 
              dataKey="date" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(215 20% 55%)', fontSize: 11 }}
              tickFormatter={(value) => {
                const date = new Date(value);
                return `${date.getMonth() + 1}/${date.getDate()}`;
              }}
              interval="preserveStartEnd"
              minTickGap={50}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(215 20% 55%)', fontSize: 11 }}
              tickFormatter={(value) => `$${value.toFixed(0)}`}
              domain={['auto', 'auto']}
              width={50}
            />
          </>
        )}
        
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(220 20% 7%)',
            border: '1px solid hsl(220 20% 14%)',
            borderRadius: '12px',
            padding: '12px',
          }}
          labelStyle={{ color: 'hsl(215 20% 55%)', marginBottom: '4px' }}
          itemStyle={{ color: 'white' }}
          formatter={(value) => [`$${Number(value).toFixed(2)}`, '净值']}
          labelFormatter={(label) => new Date(label).toLocaleDateString('zh-CN')}
        />
        
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          fill={gradient ? `url(#${gradientId})` : 'transparent'}
          dot={false}
          activeDot={{ r: 4, fill: color, stroke: 'white', strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

interface MiniChartProps {
  data: { date: string; value: number }[];
  height?: number;
}

export function MiniChart({ data, height = 60 }: MiniChartProps) {
  const isPositive = data.length > 1 && data[data.length - 1].value >= data[0].value;
  const color = isPositive ? '#10b981' : '#ef4444';

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={`mini-gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.2} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={1.5}
          fill={`url(#mini-gradient-${color})`}
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
