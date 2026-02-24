"use client";

import { use, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Navbar } from '@/components/layout/navbar';
import { PerformanceChart } from '@/components/charts/performance-chart';
import { useStore } from '@/lib/store';
import { useAccount } from 'wagmi';
import { 
  TrendingUp, Shield, Activity, Users, ArrowUpRight, ArrowDownRight, 
  ChevronLeft, AlertCircle, CheckCircle2, Info
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function StrategyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { getStrategyById, investAmount, setInvestAmount, invest, isInvesting, user } = useStore();
  const { isConnected } = useAccount();
  const strategy = getStrategyById(id);
  const [investSuccess, setInvestSuccess] = useState(false);

  if (!strategy) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen pt-24 pb-12 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto">
            <Card className="text-center py-12">
              <AlertCircle size={48} className="mx-auto mb-4 text-[hsl(var(--muted-foreground))]" />
              <h2 className="text-xl font-bold mb-2">策略不存在</h2>
              <p className="text-[hsl(var(--muted-foreground))] mb-4">该策略可能已被删除或ID无效</p>
              <Link href="/strategies">
                <Button>返回策略广场</Button>
              </Link>
            </Card>
          </div>
        </main>
      </>
    );
  }

  const handleInvest = async () => {
    if (!isConnected || investAmount <= 0) return;
    const success = await invest(strategy.id, investAmount);
    if (success) {
      setInvestSuccess(true);
      setTimeout(() => setInvestSuccess(false), 3000);
    }
  };

  const fee = investAmount * 0.005;
  const existingPosition = user.positions.find((p) => p.strategyId === strategy.id);

  const riskLabels = { 1: '低风险', 2: '中风险', 3: '高风险' };
  const riskColors = { 
    1: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20', 
    2: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20', 
    3: 'bg-red-400/10 text-red-400 border-red-400/20' 
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-12 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumb */}
          <Link 
            href="/strategies" 
            className="inline-flex items-center gap-1 text-sm text-[hsl(var(--muted-foreground))] hover:text-white mb-6 transition-colors"
          >
            <ChevronLeft size={16} />
            返回策略广场
          </Link>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Header */}
              <div>
                <div className="flex items-start justify-between mb-2">
                  <h1 className="text-3xl sm:text-4xl font-bold">{strategy.name}</h1>
                  <span className={cn(
                    "px-3 py-1 rounded-full text-sm font-medium border",
                    riskColors[strategy.riskLevel]
                  )}>
                    {riskLabels[strategy.riskLevel]}
                  </span>
                </div>
                <p className="text-[hsl(var(--muted-foreground))]">{strategy.description}</p>
              </div>

              {/* Performance Chart */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>收益曲线</CardTitle>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-emerald-400">
                        +{strategy.returnTotal}%
                      </span>
                      <span className="text-sm text-[hsl(var(--muted-foreground))]">累计</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <PerformanceChart 
                    data={strategy.performanceHistory} 
                    height={280}
                    showGrid
                    showAxis
                  />
                </CardContent>
              </Card>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <MetricCard
                  icon={<TrendingUp size={20} className="text-emerald-400" />}
                  label="7日收益"
                  value={`+${strategy.return7d}%`}
                  valueColor="text-emerald-400"
                />
                <MetricCard
                  icon={<TrendingUp size={20} className="text-emerald-400" />}
                  label="30日收益"
                  value={`+${strategy.return30d}%`}
                  valueColor="text-emerald-400"
                />
                <MetricCard
                  icon={<Shield size={20} className="text-cyan-400" />}
                  label="夏普比率"
                  value={strategy.sharpeRatio.toString()}
                />
                <MetricCard
                  icon={<Activity size={20} className="text-red-400" />}
                  label="最大回撤"
                  value={`${strategy.maxDrawdown}%`}
                  valueColor="text-red-400"
                />
              </div>

              {/* Additional Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>策略统计</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                    <StatItem label="胜率" value={`${strategy.winRate}%`} />
                    <StatItem label="跟投人数" value={strategy.followers.toString()} />
                    <StatItem label="管理资产" value={`$${(strategy.aum / 1000).toFixed(0)}K`} />
                    <StatItem label="运行时间" value="90天" />
                  </div>
                </CardContent>
              </Card>

              {/* Recent Trades */}
              <Card>
                <CardHeader>
                  <CardTitle>最近交易</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {strategy.recentTrades.map((trade) => (
                    <div 
                      key={trade.id} 
                      className="flex items-center justify-between py-3 border-b border-[hsl(var(--border))] last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center",
                          trade.action === 'buy' 
                            ? "bg-emerald-400/10 text-emerald-400" 
                            : "bg-red-400/10 text-red-400"
                        )}>
                          {trade.action === 'buy' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                        </div>
                        <div>
                          <p className="font-medium">{trade.symbol}</p>
                          <p className="text-xs text-[hsl(var(--muted-foreground))]">{trade.time}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={cn(
                          "font-bold",
                          trade.pnl >= 0 ? "text-emerald-400" : "text-red-400"
                        )}>
                          {trade.pnl >= 0 ? '+' : ''}${trade.pnl}
                        </p>
                        <p className={cn(
                          "text-xs",
                          trade.pnl >= 0 ? "text-emerald-400" : "text-red-400"
                        )}>
                          {trade.pnl >= 0 ? '+' : ''}{trade.pct}%
                        </p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Invest Card */}
              <Card glow className="sticky top-24">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity size={20} className="text-cyan-400" />
                    投资此策略
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {existingPosition && (
                    <div className="p-3 bg-cyan-400/10 border border-cyan-400/20 rounded-xl">
                      <div className="flex items-center gap-2 text-cyan-400 text-sm mb-1">
                        <Info size={14} />
                        已投资此策略
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-[hsl(var(--muted-foreground))]">当前持仓</span>
                        <span className="font-bold">${existingPosition.current.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-[hsl(var(--muted-foreground))]">收益</span>
                        <span className={cn("font-bold", existingPosition.pnl >= 0 ? "text-emerald-400" : "text-red-400")}>
                          {existingPosition.pnl >= 0 ? '+' : ''}${existingPosition.pnl} ({existingPosition.pnlPct}%)
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-[hsl(var(--muted-foreground))] mb-1">跟投人数</p>
                      <p className="text-2xl font-bold">{strategy.followers}</p>
                    </div>
                    <div>
                      <p className="text-sm text-[hsl(var(--muted-foreground))] mb-1">总锁仓</p>
                      <p className="text-2xl font-bold">${(strategy.aum / 1000).toFixed(1)}K</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[hsl(var(--border))]">
                    <Input
                      type="number"
                      label="投资金额 (USDT)"
                      placeholder="100"
                      value={investAmount || ''}
                      onChange={(e) => setInvestAmount(Number(e.target.value))}
                      min={1}
                    />
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-[hsl(var(--muted-foreground))]">手续费 (0.5%)</span>
                    <span className="text-cyan-400 font-mono">≈ ${fee.toFixed(2)} USDT</span>
                  </div>

                  {investSuccess ? (
                    <Button className="w-full" variant="success" disabled>
                      <CheckCircle2 size={18} />
                      投资成功！
                    </Button>
                  ) : (
                    <Button 
                      className="w-full" 
                      onClick={handleInvest}
                      disabled={!isConnected || investAmount <= 0}
                      loading={isInvesting}
                    >
                      {!isConnected ? '请先连接钱包' : investAmount <= 0 ? '请输入金额' : `投资 $${investAmount}`}
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Strategy Info */}
              <Card>
                <CardHeader>
                  <CardTitle>策略说明</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">
                    {strategy.description}
                    <br /><br />
                    该策略通过机器学习算法识别市场信号，自动执行交易决策。
                    适合{riskLabels[strategy.riskLevel].replace('风险', '')}风险偏好的投资者。
                    所有交易记录链上可查，资产由智能合约托管，确保安全透明。
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

function MetricCard({ 
  icon, 
  label, 
  value, 
  valueColor = 'text-white' 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: string;
  valueColor?: string;
}) {
  return (
    <Card hover={false} className="p-4">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-sm text-[hsl(var(--muted-foreground))]">{label}</span>
      </div>
      <p className={cn("text-2xl font-bold", valueColor)}>{value}</p>
    </Card>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm text-[hsl(var(--muted-foreground))] mb-1">{label}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}
