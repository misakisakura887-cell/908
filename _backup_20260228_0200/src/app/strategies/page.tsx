'use client';

import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Navbar } from '@/components/layout/navbar';
import { MiniChart } from '@/components/charts/performance-chart';
import { useStore, type Strategy } from '@/lib/store';
import Link from 'next/link';
import { Search, SlidersHorizontal, ArrowRight, TrendingUp, Shield, Users } from 'lucide-react';

type AssetFilter = 'all' | 'commodity' | 'crypto' | 'mixed';
type RiskFilter = 'all' | 1 | 2 | 3;
type SortOption = 'return7d' | 'return30d' | 'sharpe' | 'followers' | 'aum';

export default function StrategiesPage() {
  const { strategies } = useStore();
  const [search, setSearch] = useState('');
  const [filterAsset, setFilterAsset] = useState<AssetFilter>('all');
  const [filterRisk, setFilterRisk] = useState<RiskFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('return7d');
  const [showFilters, setShowFilters] = useState(false);

  const filteredStrategies = useMemo(() => {
    return strategies
      .filter((s) => {
        if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false;
        if (filterAsset !== 'all' && s.assetClass !== filterAsset) return false;
        if (filterRisk !== 'all' && s.riskLevel !== filterRisk) return false;
        return true;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'return7d': return b.return7d - a.return7d;
          case 'return30d': return b.return30d - a.return30d;
          case 'sharpe': return b.sharpeRatio - a.sharpeRatio;
          case 'followers': return b.followers - a.followers;
          case 'aum': return b.aum - a.aum;
          default: return 0;
        }
      });
  }, [strategies, search, filterAsset, filterRisk, sortBy]);

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-12 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">策略广场</h1>
            <p className="text-[hsl(var(--muted-foreground))]">
              发现最适合你的投资策略，一键跟投
            </p>
          </div>

          {/* Search & Filters */}
          <div className="mb-8 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" size={18} />
                <Input
                  placeholder="搜索策略..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-11"
                />
              </div>
              <Button
                variant="secondary"
                onClick={() => setShowFilters(!showFilters)}
                className="sm:hidden"
              >
                <SlidersHorizontal size={18} />
                筛选
              </Button>
            </div>

            {/* Desktop Filters */}
            <div className="hidden sm:flex flex-wrap items-center gap-4">
              <FilterGroup
                label="资产类型"
                options={[
                  { value: 'all', label: '全部' },
                  { value: 'crypto', label: '加密货币' },
                  { value: 'commodity', label: '黄金' },
                  { value: 'mixed', label: '混合' },
                ]}
                value={filterAsset}
                onChange={(v) => setFilterAsset(v as AssetFilter)}
              />
              
              <div className="w-px h-8 bg-[hsl(var(--border))]" />
              
              <FilterGroup
                label="风险等级"
                options={[
                  { value: 'all', label: '全部' },
                  { value: 1, label: '低风险' },
                  { value: 2, label: '中风险' },
                  { value: 3, label: '高风险' },
                ]}
                value={filterRisk}
                onChange={(v) => setFilterRisk(v as RiskFilter)}
              />

              <div className="ml-auto flex items-center gap-2">
                <span className="text-sm text-[hsl(var(--muted-foreground))]">排序:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="bg-[hsl(var(--secondary))] border border-[hsl(var(--border))] rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                >
                  <option value="return7d">7日收益</option>
                  <option value="return30d">30日收益</option>
                  <option value="sharpe">夏普比率</option>
                  <option value="followers">跟投人数</option>
                  <option value="aum">管理资产</option>
                </select>
              </div>
            </div>

            {/* Mobile Filters */}
            {showFilters && (
              <Card className="sm:hidden space-y-4">
                <div>
                  <label className="text-sm text-[hsl(var(--muted-foreground))] mb-2 block">资产类型</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: 'all', label: '全部' },
                      { value: 'crypto', label: '加密货币' },
                      { value: 'commodity', label: '黄金' },
                      { value: 'mixed', label: '混合' },
                    ].map((opt) => (
                      <Button
                        key={opt.value}
                        variant={filterAsset === opt.value ? 'primary' : 'secondary'}
                        size="sm"
                        onClick={() => setFilterAsset(opt.value as AssetFilter)}
                      >
                        {opt.label}
                      </Button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm text-[hsl(var(--muted-foreground))] mb-2 block">风险等级</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: 'all', label: '全部' },
                      { value: 1, label: '低风险' },
                      { value: 2, label: '中风险' },
                      { value: 3, label: '高风险' },
                    ].map((opt) => (
                      <Button
                        key={String(opt.value)}
                        variant={filterRisk === opt.value ? 'primary' : 'secondary'}
                        size="sm"
                        onClick={() => setFilterRisk(opt.value as RiskFilter)}
                      >
                        {opt.label}
                      </Button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm text-[hsl(var(--muted-foreground))] mb-2 block">排序</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="w-full bg-[hsl(var(--secondary))] border border-[hsl(var(--border))] rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  >
                    <option value="return7d">7日收益</option>
                    <option value="return30d">30日收益</option>
                    <option value="sharpe">夏普比率</option>
                    <option value="followers">跟投人数</option>
                    <option value="aum">管理资产</option>
                  </select>
                </div>
              </Card>
            )}
          </div>

          {/* Results count */}
          <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4">
            共 {filteredStrategies.length} 个策略
          </p>

          {/* Strategy Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStrategies.map((strategy) => (
              <StrategyCard key={strategy.id} strategy={strategy} />
            ))}
          </div>

          {filteredStrategies.length === 0 && (
            <Card className="text-center py-12">
              <p className="text-[hsl(var(--muted-foreground))]">没有找到匹配的策略</p>
              <Button variant="ghost" className="mt-4" onClick={() => {
                setSearch('');
                setFilterAsset('all');
                setFilterRisk('all');
              }}>
                清除筛选
              </Button>
            </Card>
          )}
        </div>
      </main>
    </>
  );
}

function FilterGroup<T extends string | number>({ 
  label, 
  options, 
  value, 
  onChange 
}: { 
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-[hsl(var(--muted-foreground))]">{label}:</span>
      <div className="flex gap-1">
        {options.map((opt) => (
          <Button
            key={String(opt.value)}
            variant={value === opt.value ? 'primary' : 'ghost'}
            size="xs"
            onClick={() => onChange(opt.value)}
          >
            {opt.label}
          </Button>
        ))}
      </div>
    </div>
  );
}

function StrategyCard({ strategy }: { strategy: Strategy }) {
  const riskLabels = { 1: '低', 2: '中', 3: '高' };
  const riskColors = { 
    1: 'text-emerald-400', 
    2: 'text-yellow-400', 
    3: 'text-red-400' 
  };
  const assetLabels = { commodity: '黄金', crypto: '加密', mixed: '混合' };

  return (
    <Link href={`/strategies/${strategy.id}`}>
      <Card glow className="h-full flex flex-col cursor-pointer group">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-lg font-bold mb-1 group-hover:text-cyan-400 transition-colors">
              {strategy.name}
            </h3>
            <div className="flex items-center gap-2 text-xs">
              <span className="px-2 py-0.5 bg-[hsl(var(--secondary))] rounded-full">
                {assetLabels[strategy.assetClass]}
              </span>
              <span className={riskColors[strategy.riskLevel]}>
                {riskLabels[strategy.riskLevel]}风险
              </span>
            </div>
          </div>
          <span className="text-xs px-2 py-1 bg-emerald-400/10 text-emerald-400 rounded-full shrink-0">
            {strategy.status === 'active' ? '活跃' : '暂停'}
          </span>
        </div>

        <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4 line-clamp-2">
          {strategy.description}
        </p>

        <div className="h-20 mb-4 -mx-2">
          <MiniChart data={strategy.performanceHistory.slice(-30)} height={80} />
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4 text-center">
          <div className="p-2 bg-[hsl(var(--secondary))]/50 rounded-xl">
            <p className="text-xs text-[hsl(var(--muted-foreground))] mb-0.5">7日</p>
            <p className="font-bold text-emerald-400">+{strategy.return7d}%</p>
          </div>
          <div className="p-2 bg-[hsl(var(--secondary))]/50 rounded-xl">
            <p className="text-xs text-[hsl(var(--muted-foreground))] mb-0.5">30日</p>
            <p className="font-bold text-emerald-400">+{strategy.return30d}%</p>
          </div>
          <div className="p-2 bg-[hsl(var(--secondary))]/50 rounded-xl">
            <p className="text-xs text-[hsl(var(--muted-foreground))] mb-0.5">夏普</p>
            <p className="font-bold">{strategy.sharpeRatio}</p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 mt-auto border-t border-[hsl(var(--border))]">
          <div className="flex items-center gap-4 text-sm text-[hsl(var(--muted-foreground))]">
            <span className="flex items-center gap-1">
              <Users size={14} />
              {strategy.followers}
            </span>
            <span className="flex items-center gap-1">
              <TrendingUp size={14} />
              ${(strategy.aum / 1000).toFixed(0)}K
            </span>
          </div>
          <ArrowRight size={18} className="text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </Card>
    </Link>
  );
}
