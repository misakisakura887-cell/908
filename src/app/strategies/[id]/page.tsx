'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { ArrowLeft, TrendingUp, Users } from 'lucide-react';

// Mock data - 实际应该从 API 获取
const strategyData = {
  id: '1',
  name: '黄金量化策略',
  description: '基于微软开源模型的黄金量化交易策略，使用双均线系统自动捕捉趋势。适合稳健型投资者。',
  type: 'gold_quant',
  assetClass: 'commodity',
  riskLevel: 1,
  totalReturn: 34.12,
  return7d: 12.3,
  return30d: 34.1,
  sharpeRatio: 1.82,
  maxDrawdown: -5.2,
  winRate: 68.3,
  followers: 342,
  aum: 234567.89,
};

const recentTrades = [
  { time: '02-14 10:32', action: '买入', symbol: 'XAU', price: 2031.45, pnl: null },
  { time: '02-13 15:47', action: '卖出', symbol: 'XAU', price: 2048.12, pnl: 24.5 },
  { time: '02-12 09:15', action: '买入', symbol: 'XAU', price: 2023.67, pnl: null },
];

export default function StrategyDetailPage() {
  const [investAmount, setInvestAmount] = useState('');

  const handleInvest = () => {
    alert(`投资 $${investAmount} 到策略：${strategyData.name}`);
  };

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
            <Link href="/dashboard" className="text-gray-300 hover:text-white transition-colors">
              我的投资
            </Link>
          </div>
          
          <Button variant="primary">连接钱包</Button>
        </div>
      </nav>

      <div className="pt-24 px-6 pb-12">
        <div className="max-w-7xl mx-auto">
          {/* Back Button */}
          <Link href="/strategies" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors">
            <ArrowLeft size={20} />
            返回策略广场
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Strategy Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Header */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h1 className="text-4xl font-bold">{strategyData.name}</h1>
                  <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">
                    活跃中
                  </span>
                </div>
                <p className="text-gray-400">{strategyData.description}</p>
              </div>

              {/* Performance Chart */}
              <Card>
                <h2 className="text-xl font-bold mb-4">收益曲线</h2>
                <div className="h-64 bg-black/20 rounded-lg flex items-center justify-center text-gray-500">
                  收益曲线图（Recharts）
                </div>
                <div className="mt-4 flex gap-2">
                  <button className="px-4 py-2 bg-accent-blue text-white rounded-lg text-sm">7日</button>
                  <button className="px-4 py-2 bg-bg-tertiary text-gray-400 rounded-lg text-sm hover:text-white">30日</button>
                  <button className="px-4 py-2 bg-bg-tertiary text-gray-400 rounded-lg text-sm hover:text-white">90日</button>
                  <button className="px-4 py-2 bg-bg-tertiary text-gray-400 rounded-lg text-sm hover:text-white">全部</button>
                </div>
              </Card>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricCard label="累计收益" value={`+${strategyData.totalReturn}%`} positive />
                <MetricCard label="夏普比率" value={strategyData.sharpeRatio.toString()} />
                <MetricCard label="最大回撤" value={`${strategyData.maxDrawdown}%`} negative />
                <MetricCard label="胜率" value={`${strategyData.winRate}%`} />
              </div>

              {/* Recent Trades */}
              <Card>
                <h2 className="text-xl font-bold mb-4">最近交易</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-gray-400 text-sm border-b border-gray-700">
                        <th className="pb-3">时间</th>
                        <th className="pb-3">操作</th>
                        <th className="pb-3">标的</th>
                        <th className="pb-3">价格</th>
                        <th className="pb-3">收益</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentTrades.map((trade, i) => (
                        <tr key={i} className="border-b border-gray-800 last:border-0">
                          <td className="py-3 text-gray-400">{trade.time}</td>
                          <td className="py-3">
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${
                              trade.action === '买入' 
                                ? 'bg-green-500/20 text-green-400' 
                                : 'bg-red-500/20 text-red-400'
                            }`}>
                              {trade.action}
                            </span>
                          </td>
                          <td className="py-3">{trade.symbol}</td>
                          <td className="py-3 font-mono">${trade.price.toFixed(2)}</td>
                          <td className="py-3">
                            {trade.pnl !== null ? (
                              <span className="text-accent-green font-semibold">+${trade.pnl}</span>
                            ) : (
                              <span className="text-gray-500">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>

            {/* Right Column - Investment Panel */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <h2 className="text-2xl font-bold mb-4">🎯 立即投资</h2>
                
                {/* Stats */}
                <div className="mb-6 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">当前跟投人数</span>
                    <span className="font-semibold">{strategyData.followers} 人</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">总锁仓金额</span>
                    <span className="font-semibold">${strategyData.aum.toLocaleString()}</span>
                  </div>
                </div>

                {/* Wallet Connection Status */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                    <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                    未连接钱包
                  </div>
                  <Button variant="primary" className="w-full">
                    连接钱包
                  </Button>
                </div>

                {/* Investment Amount */}
                <div className="mb-4">
                  <label className="block text-sm text-gray-400 mb-2">
                    投资金额 (USDT)
                  </label>
                  <div className="relative">
                    <Input
                      type="number"
                      placeholder="最低 1 美金"
                      value={investAmount}
                      onChange={(e) => setInvestAmount(e.target.value)}
                      disabled
                    />
                    <button
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-accent-blue text-sm font-semibold"
                      disabled
                    >
                      最大
                    </button>
                  </div>
                </div>

                {/* Fee Estimate */}
                <div className="mb-6 p-3 bg-bg-secondary rounded-lg">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">预估手续费</span>
                    <span className="text-gray-400">~$10 (2%)</span>
                  </div>
                </div>

                {/* Invest Button */}
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={handleInvest}
                  disabled
                >
                  确认投资
                </Button>

                {/* Warning */}
                <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <p className="text-yellow-400 text-xs">
                    ⚠️ 投资有风险，请根据自身情况决策
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, positive, negative }: { label: string; value: string; positive?: boolean; negative?: boolean }) {
  return (
    <Card>
      <p className="text-gray-400 text-sm mb-2">{label}</p>
      <p className={`text-2xl font-bold ${
        positive ? 'text-accent-green' : negative ? 'text-accent-red' : 'text-white'
      }`}>
        {value}
      </p>
    </Card>
  );
}
