'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/layout/navbar';
import Link from 'next/link';

// Mock data
const strategies = [
  {
    id: '1',
    name: '黄金量化策略',
    description: '基于微软开源模型的黄金量化交易策略',
    type: 'gold_quant',
    assetClass: 'commodity',
    riskLevel: 1,
    return7d: 12.3,
    return30d: 34.1,
    sharpeRatio: 1.82,
    maxDrawdown: -5.2,
    followers: 342,
    aum: 234567.89,
  },
  {
    id: '2',
    name: 'BTC 量化策略',
    description: '针对 BTC 高波动性优化的量化策略',
    type: 'btc_quant',
    assetClass: 'crypto',
    riskLevel: 2,
    return7d: 8.7,
    return30d: 22.5,
    sharpeRatio: 1.34,
    maxDrawdown: -8.1,
    followers: 567,
    aum: 456789.12,
  },
  {
    id: '3',
    name: '龙头主观策略',
    description: '跟单见崎的主观策略，涵盖美股、BTC、黄金',
    type: 'leader_subjective',
    assetClass: 'mixed',
    riskLevel: 2,
    return7d: 15.2,
    return30d: 38.6,
    sharpeRatio: 2.01,
    maxDrawdown: -6.8,
    followers: 189,
    aum: 189234.56,
  },
];

export default function StrategiesPage() {
  const [filterType, setFilterType] = useState<string>('all');
  const [filterRisk, setFilterRisk] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<string>('return7d');

  const filteredStrategies = strategies
    .filter((s) => filterType === 'all' || s.assetClass === filterType)
    .filter((s) => filterRisk === null || s.riskLevel === filterRisk)
    .sort((a, b) => {
      if (sortBy === 'return7d') return b.return7d - a.return7d;
      if (sortBy === 'sharpe') return b.sharpeRatio - a.sharpeRatio;
      if (sortBy === 'followers') return b.followers - a.followers;
      return 0;
    });

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-[#020617]">
        <div className="pt-24 px-6 pb-12">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold mb-2 text-white">策略广场</h1>
              <p className="text-gray-400">发现最适合你的投资策略</p>
            </div>

            {/* Filters */}
            <div className="mb-8 flex flex-wrap gap-4 items-center">
              {/* Asset Type Filter */}
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-sm">资产类型:</span>
                <div className="flex gap-2">
                  <FilterButton active={filterType === 'all'} onClick={() => setFilterType('all')}>
                    全部
                  </FilterButton>
                  <FilterButton active={filterType === 'crypto'} onClick={() => setFilterType('crypto')}>
                    加密
                  </FilterButton>
                  <FilterButton active={filterType === 'commodity'} onClick={() => setFilterType('commodity')}>
                    黄金
                  </FilterButton>
                  <FilterButton active={filterType === 'mixed'} onClick={() => setFilterType('mixed')}>
                    混合
                  </FilterButton>
                </div>
              </div>

              {/* Risk Level Filter */}
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-sm">风险:</span>
                <div className="flex gap-2">
                  <FilterButton active={filterRisk === null} onClick={() => setFilterRisk(null)}>
                    全部
                  </FilterButton>
                  <FilterButton active={filterRisk === 1} onClick={() => setFilterRisk(1)}>
                    低
                  </FilterButton>
                  <FilterButton active={filterRisk === 2} onClick={() => setFilterRisk(2)}>
                    中
                  </FilterButton>
                  <FilterButton active={filterRisk === 3} onClick={() => setFilterRisk(3)}>
                    高
                  </FilterButton>
                </div>
              </div>

              {/* Sort */}
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-gray-400 text-sm">排序:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-cyan-500 focus:outline-none"
                >
                  <option value="return7d">7日收益率</option>
                  <option value="sharpe">夏普比率</option>
                  <option value="followers">跟投人数</option>
                </select>
              </div>
            </div>

            {/* Strategy Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStrategies.map((strategy) => (
                <StrategyCard key={strategy.id} strategy={strategy} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function FilterButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
        active
          ? 'bg-cyan-500 text-slate-950'
          : 'bg-slate-900 text-gray-400 hover:text-white hover:bg-slate-800'
      }`}
    >
      {children}
    </button>
  );
}

function StrategyCard({ strategy }: { strategy: typeof strategies[0] }) {
  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-white">{strategy.name}</h3>
        <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">
          活跃中
        </span>
      </div>

      <p className="text-gray-400 text-sm mb-4">{strategy.description}</p>

      {/* Placeholder chart */}
      <div className="h-24 bg-black/20 rounded-lg mb-4 flex items-center justify-center text-gray-500 text-sm">
        收益曲线图
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-gray-400 text-sm mb-1">7日收益</p>
          <p className="text-2xl font-bold text-green-400">+{strategy.return7d}%</p>
        </div>
        <div>
          <p className="text-gray-400 text-sm mb-1">30日收益</p>
          <p className="text-xl font-bold text-green-400">+{strategy.return30d}%</p>
        </div>
        <div>
          <p className="text-gray-400 text-sm mb-1">夏普比率</p>
          <p className="text-xl font-bold text-white">{strategy.sharpeRatio}</p>
        </div>
        <div>
          <p className="text-gray-400 text-sm mb-1">最大回撤</p>
          <p className="text-xl font-bold text-red-400">{strategy.maxDrawdown}%</p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-700">
        <div className="text-gray-400 text-sm">
          <span className="font-semibold text-white">{strategy.followers}</span> 人跟投
        </div>
        <Link href={`/strategies/${strategy.id}`}>
          <button className="text-cyan-400 hover:text-cyan-300 transition-colors font-medium">
            查看详情 →
          </button>
        </Link>
      </div>
    </Card>
  );
}
