"use client";

import { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/layout/navbar';
import { PerformanceChart } from '@/components/charts/performance-chart';
import { AssetPieChart } from '@/components/charts/pie-chart';
import { useStore } from '@/lib/store';

import { 
  TrendingUp, Activity, DollarSign, Wallet, ArrowUpRight, ArrowDownRight,
  RefreshCw, Eye, EyeOff, Plus
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
  const { user, strategies, withdraw, isWithdrawing } = useStore();
  
  const [hideBalance, setHideBalance] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 1000));
    setRefreshing(false);
  };

  const pieData = useMemo(() => {
    const colors = ['#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'];
    return user.positions.map((pos, i) => ({
      name: pos.strategyName,
      value: pos.current,
      color: colors[i % colors.length],
    }));
  }, [user.positions]);

  const performanceData = useMemo(() => {
    const data = [];
    let value = user.totalInvested;
    const dailyReturn = Math.pow((user.totalAssets / user.totalInvested), 1 / 90) - 1;
    
    for (let i = 90; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const volatility = (Math.random() - 0.5) * 2;
      value = value * (1 + dailyReturn + volatility / 100);
      data.push({
        date: date.toISOString().split('T')[0],
        value: Math.round(value * 100) / 100,
      });
    }
    return data;
  }, [user.totalInvested, user.totalAssets]);

  // 使用 mock 数据展示，后续可接入真实 API

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-12 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold mb-1">我的投资</h1>
              <p className="text-[hsl(var(--muted-foreground))]">管理你的投资组合</p>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setHideBalance(!hideBalance)}
              >
                {hideBalance ? <EyeOff size={18} /> : <Eye size={18} />}
              </Button>
              <Button 
                variant="secondary" 
                onClick={handleRefresh}
                loading={refreshing}
              >
                <RefreshCw size={16} />
                刷新
              </Button>
            </div>
          </div>

          {/* Core Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl" />
              <CardContent className="relative pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <Wallet size={18} className="text-cyan-400" />
                  <span className="text-sm text-[hsl(var(--muted-foreground))]">总资产</span>
                </div>
                <p className="text-2xl sm:text-3xl font-bold">
                  {hideBalance ? '****' : `$${user.totalAssets.toLocaleString()}`}
                </p>
                <div className="flex items-center gap-1 text-xs text-cyan-400 mt-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  实时
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign size={18} className="text-[hsl(var(--muted-foreground))]" />
                  <span className="text-sm text-[hsl(var(--muted-foreground))]">总投入</span>
                </div>
                <p className="text-2xl sm:text-3xl font-bold">
                  {hideBalance ? '****' : `$${user.totalInvested.toLocaleString()}`}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp size={18} className="text-emerald-400" />
                  <span className="text-sm text-[hsl(var(--muted-foreground))]">累计收益</span>
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-emerald-400">
                  {hideBalance ? '****' : `+$${user.totalPnl.toLocaleString()}`}
                </p>
                <p className="text-sm text-emerald-400">
                  +{((user.totalPnl / user.totalInvested) * 100).toFixed(1)}%
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <Activity size={18} className="text-blue-400" />
                  <span className="text-sm text-[hsl(var(--muted-foreground))]">今日收益</span>
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-blue-400">
                  {hideBalance ? '****' : `+$${user.todayPnl}`}
                </p>
                <p className="text-sm text-blue-400">
                  +{((user.todayPnl / user.totalAssets) * 100).toFixed(2)}%
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>资产分布</CardTitle>
              </CardHeader>
              <CardContent>
                {user.positions.length > 0 ? (
                  <AssetPieChart data={pieData} height={240} />
                ) : (
                  <div className="h-60 flex items-center justify-center text-[hsl(var(--muted-foreground))]">
                    暂无投资
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>收益曲线</CardTitle>
              </CardHeader>
              <CardContent>
                <PerformanceChart 
                  data={performanceData} 
                  height={240}
                  showGrid
                  showAxis
                />
              </CardContent>
            </Card>
          </div>

          {/* Positions */}
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>我的策略</CardTitle>
              <Link href="/strategies">
                <Button size="sm">
                  <Plus size={16} />
                  添加策略
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {user.positions.length > 0 ? (
                <div className="space-y-4">
                  {user.positions.map((position) => {
                    const strategy = strategies.find((s) => s.id === position.strategyId);
                    return (
                      <div 
                        key={position.strategyId}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-[hsl(var(--secondary))]/50 rounded-xl"
                      >
                        <div className="flex-1">
                          <Link href={`/strategies/${position.strategyId}`}>
                            <h3 className="font-bold text-lg hover:text-cyan-400 transition-colors">
                              {position.strategyName}
                            </h3>
                          </Link>
                          <p className="text-sm text-[hsl(var(--muted-foreground))]">
                            投入: ${position.invested.toLocaleString()}
                          </p>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-xl font-bold">
                            {hideBalance ? '****' : `$${position.current.toLocaleString()}`}
                          </p>
                          <p className={cn(
                            "text-sm flex items-center justify-end gap-1",
                            position.pnl >= 0 ? "text-emerald-400" : "text-red-400"
                          )}>
                            {position.pnl >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                            {position.pnl >= 0 ? '+' : ''}{position.pnlPct}%
                          </p>
                        </div>

                        <div className="flex gap-2">
                          <Link href={`/strategies/${position.strategyId}`}>
                            <Button size="sm" variant="secondary">详情</Button>
                          </Link>
                          <Link href={`/strategies/${position.strategyId}`}>
                            <Button size="sm">追加</Button>
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-[hsl(var(--muted-foreground))] mb-4">暂无投资</p>
                  <Link href="/strategies">
                    <Button>浏览策略</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Trade History */}
          <Card>
            <CardHeader>
              <CardTitle>交易记录</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {user.trades.map((trade) => (
                  <div 
                    key={trade.id}
                    className="flex items-center gap-4 py-3 border-b border-[hsl(var(--border))] last:border-0"
                  >
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      trade.pnl >= 0 ? "bg-emerald-400" : "bg-red-400"
                    )} />
                    <div className="flex-1">
                      <p className="font-medium">{trade.symbol}</p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">{trade.time}</p>
                    </div>
                    <span className={cn(
                      "px-2 py-1 rounded-lg text-xs font-medium",
                      trade.action === 'buy' 
                        ? "bg-emerald-400/10 text-emerald-400" 
                        : "bg-red-400/10 text-red-400"
                    )}>
                      {trade.action === 'buy' ? '买入' : '卖出'}
                    </span>
                    <div className="text-right">
                      <p className={cn(
                        "font-bold",
                        trade.pnl >= 0 ? "text-emerald-400" : "text-red-400"
                      )}>
                        {trade.pnl >= 0 ? '+' : ''}${Math.abs(trade.pnl)}
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
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
