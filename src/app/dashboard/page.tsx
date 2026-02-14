'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { TrendingUp, TrendingDown, DollarSign, Clock, Activity, Target, Award, AlertTriangle } from 'lucide-react';

// Mock data
const portfolioData = {
  totalValue: 5234.56,
  totalInvested: 4500.0,
  totalPnl: 734.56,
  totalPnlPercent: 16.33,
  todayPnl: 45.23,
  todayPnlPercent: 0.87,
};

const positions = [
  {
    id: '1',
    strategyName: '黄金量化策略',
    strategyId: '1',
    invested: 2000,
    currentValue: 2246,
    pnl: 246,
    pnlPercent: 12.3,
    status: 'active',
  },
  {
    id: '2',
    strategyName: 'BTC 量化策略',
    strategyId: '2',
    invested: 1500,
    currentValue: 1628,
    pnl: 128,
    pnlPercent: 8.53,
    status: 'active',
  },
  {
    id: '3',
    strategyName: '龙头主观策略',
    strategyId: '3',
    invested: 1000,
    currentValue: 1360,
    pnl: 360,
    pnlPercent: 36.0,
    status: 'active',
  },
];

const recentTrades = [
  { time: '02-14 10:32', strategy: '黄金量化', action: '买入', symbol: 'XAU', amount: 500 },
  { time: '02-13 15:47', strategy: 'BTC量化', action: '卖出', symbol: 'BTC', amount: 300, pnl: 24 },
  { time: '02-12 09:15', strategy: '龙头主观', action: '买入', symbol: 'NVDA', amount: 200, pnl: 36 },
];

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-bg-primary/80 backdrop-blur-lg border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-accent-blue to-accent-purple rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">M</span>
            </div>
            <span className="text-xl font-bold text-white">Mirror-AI</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-8">
            <Link href="/strategies" className="text-gray-300 hover:text-white transition-colors">
              策略广场
            </Link>
            <Link href="/dashboard" className="text-white font-medium">
              我的投资
            </Link>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-400">
              <span className="text-white font-mono">0x742d...4a8f</span>
            </div>
            <Button variant="secondary" size="sm">断开连接</Button>
          </div>
        </div>
      </nav>

      <div className="pt-24 px-6 pb-12">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">我的投资</h1>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-400">实时更新</span>
            </div>
          </div>

          {/* Core Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <MetricCard
              icon={<DollarSign size={20} />}
              label="总资产"
              value={`$${portfolioData.totalValue.toFixed(2)}`}
              change={`+${portfolioData.totalPnlPercent.toFixed(2)}%`}
              positive
            />
            <MetricCard
              icon={<TrendingDown size={20} />}
              label="总投入"
              value={`$${portfolioData.totalInvested.toFixed(2)}`}
            />
            <MetricCard
              icon={<TrendingUp size={20} />}
              label="累计收益"
              value={`$${portfolioData.totalPnl.toFixed(2)}`}
              change={`+${portfolioData.totalPnlPercent.toFixed(2)}%`}
              positive
            />
            <MetricCard
              icon={<Clock size={20} />}
              label="今日收益"
              value={`$${portfolioData.todayPnl.toFixed(2)}`}
              change={`+${portfolioData.todayPnlPercent.toFixed(2)}%`}
              positive
              highlight
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Asset Distribution */}
            <Card>
              <h2 className="text-xl font-bold mb-4">资产分布</h2>
              <div className="h-64 bg-black/20 rounded-lg flex items-center justify-center text-gray-500">
                资产分布饼图（Recharts）
              </div>
            </Card>

            {/* Returns Chart */}
            <Card>
              <h2 className="text-xl font-bold mb-4">累计收益曲线</h2>
              <div className="h-64 bg-black/20 rounded-lg flex items-center justify-center text-gray-500">
                累计收益曲线（Recharts）
              </div>
            </Card>
          </div>

          {/* Quantitative Metrics */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">量化分析指标</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <QuantCard icon={<Activity />} label="交易次数" value="47 次" />
              <QuantCard icon={<DollarSign />} label="交易额" value="$12,345" />
              <QuantCard icon={<Clock />} label="平均持仓" value="3.2 天" />
              <QuantCard icon={<Target />} label="胜率" value="68.3%" positive />
              <QuantCard icon={<TrendingUp />} label="最大单笔收益" value="+$234" subvalue="(+12%)" positive />
              <QuantCard icon={<TrendingDown />} label="最大单笔亏损" value="-$87" subvalue="(-4%)" negative />
              <QuantCard icon={<Award />} label="夏普比率" value="1.82" />
              <QuantCard icon={<AlertTriangle />} label="最大回撤" value="-8.3%" negative />
            </div>
          </div>

          {/* Positions */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">我的策略</h2>
            <div className="space-y-4">
              {positions.map((position) => (
                <PositionCard key={position.id} position={position} />
              ))}
            </div>
          </div>

          {/* Recent Trades */}
          <Card>
            <h2 className="text-xl font-bold mb-4">交易记录</h2>
            <div className="space-y-4">
              {recentTrades.map((trade, i) => (
                <TradeItem key={i} trade={trade} />
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon, label, value, change, positive, negative, highlight }: any) {
  return (
    <Card className={highlight ? 'border-accent-blue' : ''}>
      <div className="flex items-center gap-2 mb-2 text-gray-400">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <div className="flex items-end gap-3 mb-2">
        <span className="text-3xl font-bold text-white">{value}</span>
        {change && (
          <span className={`text-lg mb-1 ${positive ? 'text-accent-green' : negative ? 'text-accent-red' : ''}`}>
            {change}
          </span>
        )}
      </div>
      {highlight && (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-700">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-xs text-gray-400">实时更新</span>
        </div>
      )}
    </Card>
  );
}

function QuantCard({ icon, label, value, subvalue, positive, negative }: any) {
  return (
    <Card className="text-center">
      <div className="text-gray-400 mb-2 flex justify-center">{icon}</div>
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className={`text-xl font-bold ${positive ? 'text-accent-green' : negative ? 'text-accent-red' : 'text-white'}`}>
        {value}
      </p>
      {subvalue && <p className="text-xs text-gray-500 mt-1">{subvalue}</p>}
    </Card>
  );
}

function PositionCard({ position }: any) {
  return (
    <Card>
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
        {/* Strategy Name */}
        <div className="md:col-span-2 flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold">黄</span>
          </div>
          <div>
            <h3 className="font-semibold">{position.strategyName}</h3>
            <span className="text-xs text-gray-400">活跃中</span>
          </div>
        </div>

        {/* Invested */}
        <div>
          <p className="text-xs text-gray-400 mb-1">投入金额</p>
          <p className="font-mono font-semibold">${position.invested.toFixed(2)}</p>
        </div>

        {/* Current Value */}
        <div>
          <p className="text-xs text-gray-400 mb-1">当前价值</p>
          <p className="font-mono font-semibold">${position.currentValue.toFixed(2)}</p>
        </div>

        {/* PnL */}
        <div>
          <p className="text-xs text-gray-400 mb-1">收益率</p>
          <p className={`font-bold font-mono ${position.pnl > 0 ? 'text-accent-green' : 'text-accent-red'}`}>
            +{position.pnlPercent.toFixed(2)}%
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Link href={`/strategies/${position.strategyId}`}>
            <Button size="sm" variant="secondary">详情</Button>
          </Link>
          <Button size="sm" variant="primary">追加</Button>
        </div>
      </div>
    </Card>
  );
}

function TradeItem({ trade }: any) {
  return (
    <div className="flex gap-4">
      {/* Timeline dot */}
      <div className="flex flex-col items-center flex-shrink-0">
        <div className={`w-3 h-3 rounded-full ${trade.action === '买入' ? 'bg-green-400' : 'bg-red-400'}`}></div>
        <div className="w-0.5 h-16 bg-gray-700 mt-2"></div>
      </div>

      {/* Trade Details */}
      <div className="flex-1 pb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <span className="font-medium">{trade.strategy}</span>
            <span className={`px-2 py-1 rounded text-xs font-semibold ${
              trade.action === '买入' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
            }`}>
              {trade.action}
            </span>
          </div>
          <span className="text-sm text-gray-400">{trade.time}</span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <span className="text-gray-400">标的: <span className="text-white">{trade.symbol}</span></span>
            <span className="text-gray-400">金额: <span className="text-white font-mono">${trade.amount}</span></span>
          </div>
          {trade.pnl && (
            <span className="text-accent-green font-semibold font-mono">+${trade.pnl}</span>
          )}
        </div>
      </div>
    </div>
  );
}
