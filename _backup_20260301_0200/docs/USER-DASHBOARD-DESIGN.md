# Mirror-AI 用户面板设计文档

> 版本：v1.0  
> 创建日期：2026-02-14  
> 基于：见崎提供的参考图  
> 目标：打造专业级量化投资用户面板

---

## 1. 设计理念

### 核心原则
1. **数据为王**：突出关键指标，一目了然
2. **专业感**：参考专业量化平台（如 TradingView、Coinbase Pro）
3. **实时性**：所有数据实时更新，动态展示
4. **可视化**：图表优先，数字辅助

---

## 2. 用户面板整体布局

```
+------------------------------------------------------------------+
|  Header: Logo | 总资产 $5,234.56 (+12.3%) | 钱包地址 | 设置      |
+------------------------------------------------------------------+
|                                                                  |
|  [核心指标卡片区域 - 4 列]                                          |
|  +-------------+  +-------------+  +-------------+  +----------+ |
|  | 总资产      |  | 总投入      |  | 累计收益    |  | 今日收益 | |
|  | $5,234.56   |  | $4,500.00   |  | +$734.56    |  | +$45.23  | |
|  | +12.3% ↑    |  | -           |  | +16.3%      |  | +0.9%    | |
|  +-------------+  +-------------+  +-------------+  +----------+ |
|                                                                  |
|  [资产分布 + 收益曲线 - 2 列布局]                                   |
|  +----------------------------+  +-----------------------------+ |
|  | 资产分布饼图                |  | 累计收益曲线图               | |
|  | [Pie Chart]                |  | [Line Chart]                | |
|  | 黄金: 40%  BTC: 35%        |  | 显示近 30 日收益走势         | |
|  | 龙头: 25%                  |  | 可切换时间维度               | |
|  +----------------------------+  +-----------------------------+ |
|                                                                  |
|  [量化分析指标 - 网格布局]                                          |
|  +-------------+  +-------------+  +-------------+  +----------+ |
|  | 交易次数    |  | 交易额      |  | 平均持仓    |  | 胜率     | |
|  | 47 次       |  | $12,345     |  | 3.2 天      |  | 68.3%    | |
|  +-------------+  +-------------+  +-------------+  +----------+ |
|  +-------------+  +-------------+  +-------------+  +----------+ |
|  | 最大单笔收益|  | 最大单笔亏损|  | 夏普比率    |  | 最大回撤 | |
|  | +$234 (12%)|  | -$87 (-4%) |  | 1.82        |  | -8.3%    | |
|  +-------------+  +-------------+  +-------------+  +----------+ |
|                                                                  |
|  [我的策略列表 - 表格视图]                                          |
|  +--------------------------------------------------------------+ |
|  | 策略名称    | 投入金额 | 当前价值 | 收益率 | 状态 | 操作      | |
|  |------------|---------|---------|--------|------|----------| |
|  | 黄金量化    | $2,000  | $2,246  | +12.3% | 运行 | 详情/追加 | |
|  | BTC 量化    | $1,500  | $1,628  | +8.5%  | 运行 | 详情/赎回 | |
|  | 龙头主观    | $1,000  | $1,360  | +36.0% | 运行 | 详情/追加 | |
|  +--------------------------------------------------------------+ |
|                                                                  |
|  [交易记录 - 时间轴视图]                                            |
|  +--------------------------------------------------------------+ |
|  | 时间          | 策略     | 操作 | 标的 | 金额    | 收益      | |
|  |--------------|---------|------|------|--------|----------| |
|  | 02-14 10:32  | 黄金量化 | 买入 | XAU  | $500   | -        | |
|  | 02-13 15:47  | BTC量化  | 卖出 | BTC  | $300   | +$24     | |
|  | 02-12 09:15  | 龙头主观 | 买入 | NVDA | $200   | +$36     | |
|  +--------------------------------------------------------------+ |
+------------------------------------------------------------------+
```

---

## 3. 核心指标卡片设计

### 3.1 总资产卡片
```tsx
<div className="bg-gradient-to-br from-[#1e2746] to-[#2a3558] border border-[#2d3752] rounded-xl p-6">
  {/* 标签 */}
  <div className="flex items-center gap-2 mb-2">
    <Wallet size={20} className="text-gray-400" />
    <span className="text-sm text-gray-400">总资产</span>
  </div>
  
  {/* 金额 */}
  <div className="flex items-end gap-3 mb-2">
    <span className="text-4xl font-bold text-white">$5,234.56</span>
    <span className="text-lg text-green-400 mb-1">+12.3%</span>
  </div>
  
  {/* 趋势图（迷你） */}
  <div className="h-12 mt-4">
    <MiniSparkline data={data} color="#00ff88" />
  </div>
  
  {/* 实时状态 */}
  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-700">
    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
    <span className="text-xs text-gray-400">实时更新</span>
  </div>
</div>
```

**视觉效果**：
- 渐变背景（深蓝 → 紫）
- 大字号突出金额
- 绿色表示盈利（红色表示亏损）
- 底部迷你趋势图
- 实时状态指示器

---

### 3.2 其他核心指标

#### A. 总投入
```tsx
<MetricCard
  icon={<DollarSign />}
  label="总投入"
  value="$4,500.00"
  // 无变化率
/>
```

#### B. 累计收益
```tsx
<MetricCard
  icon={<TrendingUp />}
  label="累计收益"
  value="$734.56"
  change="+16.3%"
  trend="up"
  sparkline={profitData}
/>
```

#### C. 今日收益
```tsx
<MetricCard
  icon={<Clock />}
  label="今日收益"
  value="$45.23"
  change="+0.9%"
  trend="up"
  highlight={true} // 高亮显示
/>
```

---

## 4. 量化分析指标详解

### 4.1 交易统计

#### 交易次数
- **含义**：累计执行的交易次数（买入 + 卖出）
- **展示**：`47 次`
- **颜色**：中性灰色

#### 交易额
- **含义**：累计交易金额（买入 + 卖出总和）
- **展示**：`$12,345`
- **备注**：体现账户活跃度

#### 平均持仓时间
- **含义**：每笔仓位的平均持有天数
- **展示**：`3.2 天`
- **用途**：判断策略风格（高频 vs 长持）

#### 胜率
- **含义**：盈利交易次数 / 总交易次数
- **展示**：`68.3%`
- **颜色**：≥60% 绿色，否则红色

---

### 4.2 风险指标

#### 最大单笔收益
- **含义**：单笔交易的最大盈利
- **展示**：`+$234 (+12%)`
- **颜色**：绿色

#### 最大单笔亏损
- **含义**：单笔交易的最大亏损
- **展示**：`-$87 (-4%)`
- **颜色**：红色
- **警示**：超过 -10% 显示警告图标

#### 夏普比率
- **含义**：风险调整后的收益率
- **公式**：(策略收益率 - 无风险收益率) / 收益率标准差
- **展示**：`1.82`
- **评级**：
  - \> 2.0：优秀（绿色）
  - 1.0-2.0：良好（黄色）
  - < 1.0：一般（灰色）

#### 最大回撤
- **含义**：从峰值到谷底的最大跌幅
- **展示**：`-8.3%`
- **颜色**：始终红色
- **警示**：超过 -20% 高亮警告

---

### 4.3 收益分析

#### 月度收益率
```tsx
<div className="grid grid-cols-6 gap-2">
  {months.map(month => (
    <div key={month.name} className="text-center">
      <p className="text-xs text-gray-400">{month.name}</p>
      <p className={cn(
        "text-sm font-semibold",
        month.return > 0 ? "text-green-400" : "text-red-400"
      )}>
        {month.return > 0 ? '+' : ''}{month.return.toFixed(1)}%
      </p>
    </div>
  ))}
</div>
```

#### 年化收益率
- **含义**：按年度计算的预期收益率
- **公式**：((1 + 累计收益率) ^ (365 / 持有天数)) - 1
- **展示**：`+45.2%`

---

## 5. 资产分布可视化

### 5.1 饼图设计
```tsx
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

const data = [
  { name: '黄金量化', value: 2246, color: '#FFD700' },
  { name: 'BTC 量化', value: 1628, color: '#F7931A' },
  { name: '龙头主观', value: 1360, color: '#5f72ff' },
];

<ResponsiveContainer width="100%" height={300}>
  <PieChart>
    <Pie
      data={data}
      cx="50%"
      cy="50%"
      labelLine={false}
      label={renderCustomLabel}
      outerRadius={100}
      fill="#8884d8"
      dataKey="value"
    >
      {data.map((entry, index) => (
        <Cell key={`cell-${index}`} fill={entry.color} />
      ))}
    </Pie>
    <Tooltip 
      contentStyle={{
        backgroundColor: '#1e2746',
        border: '1px solid #2d3752',
        borderRadius: '8px'
      }}
    />
    <Legend />
  </PieChart>
</ResponsiveContainer>
```

**交互**：
- 悬停显示详细数据
- 点击策略名跳转详情页

---

### 5.2 收益曲线图
```tsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

<ResponsiveContainer width="100%" height={300}>
  <LineChart data={performanceData}>
    <CartesianGrid strokeDasharray="3 3" stroke="#2d3752" />
    <XAxis 
      dataKey="date" 
      stroke="#6b7280"
      style={{ fontSize: 12 }}
    />
    <YAxis 
      stroke="#6b7280"
      style={{ fontSize: 12 }}
      tickFormatter={(value) => `$${value}`}
    />
    <Tooltip
      contentStyle={{
        backgroundColor: '#1e2746',
        border: '1px solid #2d3752',
        borderRadius: '8px'
      }}
    />
    <Line 
      type="monotone" 
      dataKey="value" 
      stroke="#00ff88" 
      strokeWidth={2}
      dot={false}
      activeDot={{ r: 6 }}
    />
    {/* 基准线（投入金额） */}
    <Line
      type="monotone"
      dataKey="invested"
      stroke="#6b7280"
      strokeWidth={1}
      strokeDasharray="5 5"
      dot={false}
    />
  </LineChart>
</ResponsiveContainer>
```

**功能**：
- 时间维度切换（7日/30日/90日/全部）
- 显示基准线（投入金额）
- 悬停显示具体数值
- 支持缩放

---

## 6. 策略列表表格

### 6.1 表格设计
```tsx
<div className="bg-[#1e2746] border border-[#2d3752] rounded-xl overflow-hidden">
  {/* 表头 */}
  <div className="grid grid-cols-6 gap-4 px-6 py-4 bg-[#141b34] border-b border-[#2d3752]">
    <span className="text-sm font-semibold text-gray-400">策略名称</span>
    <span className="text-sm font-semibold text-gray-400">投入金额</span>
    <span className="text-sm font-semibold text-gray-400">当前价值</span>
    <span className="text-sm font-semibold text-gray-400">收益率</span>
    <span className="text-sm font-semibold text-gray-400">状态</span>
    <span className="text-sm font-semibold text-gray-400">操作</span>
  </div>
  
  {/* 策略行 */}
  {positions.map(position => (
    <div key={position.id} className="grid grid-cols-6 gap-4 px-6 py-4 border-b border-[#2d3752] hover:bg-white/5 transition-colors">
      {/* 策略名称 */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold">黄</span>
        </div>
        <span className="text-white font-medium">{position.strategyName}</span>
      </div>
      
      {/* 投入金额 */}
      <span className="text-white font-mono">${position.invested.toFixed(2)}</span>
      
      {/* 当前价值 */}
      <span className="text-white font-mono">${position.currentValue.toFixed(2)}</span>
      
      {/* 收益率 */}
      <span className={cn(
        "font-semibold font-mono",
        position.pnlPercent > 0 ? "text-green-400" : "text-red-400"
      )}>
        {position.pnlPercent > 0 ? '+' : ''}{position.pnlPercent.toFixed(2)}%
      </span>
      
      {/* 状态 */}
      <span className="inline-flex items-center gap-2">
        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
        <span className="text-sm text-gray-400">运行中</span>
      </span>
      
      {/* 操作 */}
      <div className="flex items-center gap-2">
        <button className="px-3 py-1 bg-accent-blue/20 text-accent-blue rounded hover:bg-accent-blue/30 transition-colors text-sm">
          详情
        </button>
        <button className="px-3 py-1 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30 transition-colors text-sm">
          追加
        </button>
      </div>
    </div>
  ))}
</div>
```

---

## 7. 交易记录时间轴

### 7.1 时间轴设计
```tsx
<div className="space-y-4">
  {trades.map((trade, index) => (
    <div key={trade.id} className="flex gap-4">
      {/* 时间线 */}
      <div className="flex flex-col items-center">
        <div className={cn(
          "w-3 h-3 rounded-full",
          trade.side === 'BUY' ? "bg-green-400" : "bg-red-400"
        )} />
        {index < trades.length - 1 && (
          <div className="w-0.5 h-16 bg-gray-700" />
        )}
      </div>
      
      {/* 交易卡片 */}
      <div className="flex-1 bg-[#1e2746] border border-[#2d3752] rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <span className="text-white font-medium">{trade.strategyName}</span>
            <span className={cn(
              "px-2 py-1 rounded text-xs font-semibold",
              trade.side === 'BUY' 
                ? "bg-green-500/20 text-green-400" 
                : "bg-red-500/20 text-red-400"
            )}>
              {trade.side === 'BUY' ? '买入' : '卖出'}
            </span>
          </div>
          <span className="text-sm text-gray-400">{trade.timestamp}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-gray-400">标的：<span className="text-white">{trade.symbol}</span></span>
            <span className="text-gray-400">金额：<span className="text-white font-mono">${trade.amount}</span></span>
          </div>
          {trade.pnl && (
            <span className={cn(
              "font-semibold font-mono",
              trade.pnl > 0 ? "text-green-400" : "text-red-400"
            )}>
              {trade.pnl > 0 ? '+' : ''}${trade.pnl.toFixed(2)}
            </span>
          )}
        </div>
      </div>
    </div>
  ))}
</div>
```

---

## 8. 实时数据更新动画

### 8.1 闪烁效果
```tsx
const [flash, setFlash] = useState(false);

useEffect(() => {
  if (value !== prevValue) {
    setFlash(true);
    const timer = setTimeout(() => setFlash(false), 300);
    return () => clearTimeout(timer);
  }
}, [value, prevValue]);

<span className={cn(
  "transition-all duration-300",
  flash && "text-green-400 scale-110"
)}>
  ${value}
</span>
```

### 8.2 数字滚动
```tsx
import { useSpring, animated } from '@react-spring/web';

function AnimatedNumber({ value }: { value: number }) {
  const { number } = useSpring({
    from: { number: 0 },
    number: value,
    config: { duration: 1000 }
  });
  
  return (
    <animated.span>
      {number.to(n => `$${n.toFixed(2)}`)}
    </animated.span>
  );
}
```

---

## 9. 响应式适配

### 9.1 移动端布局
```tsx
{/* 桌面端：4 列 */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  <MetricCard />
  <MetricCard />
  <MetricCard />
  <MetricCard />
</div>

{/* 移动端：垂直堆叠 */}
<div className="lg:hidden space-y-4">
  <MetricCard />
  <MetricCard />
</div>
```

---

## 10. 性能优化

### 10.1 虚拟滚动（大量交易记录）
```tsx
import { useVirtualizer } from '@tanstack/react-virtual';

const parentRef = useRef(null);

const virtualizer = useVirtualizer({
  count: trades.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 80,
});

<div ref={parentRef} className="h-96 overflow-auto">
  <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
    {virtualizer.getVirtualItems().map(virtualItem => (
      <div key={virtualItem.index} style={{ ... }}>
        <TradeItem trade={trades[virtualItem.index]} />
      </div>
    ))}
  </div>
</div>
```

---

*文档版本：v1.0*  
*最后更新：2026-02-14*  
*基于见崎提供的参考图优化*
