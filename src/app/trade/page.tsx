"use client";

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TrendingUp, RefreshCw, AlertCircle, Activity, DollarSign, BarChart3, Users } from 'lucide-react';
import { getToken, getUser } from '@/lib/auth';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface Position {
  coin: string;
  direction: string;
  size: number;
  entryPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPct: number;
  value: number;
}

interface LongtouData {
  positions: Position[];
  totalValue: number;
  accountValue: number;
  marginUsed: number;
  withdrawable: number;
}

export default function TradePage() {
  const router = useRouter();
  const [data, setData] = useState<LongtouData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const autoRefreshRef = useRef<NodeJS.Timeout>(null);

  useEffect(() => {
    loadPositions();
    // 自动刷新 30秒
    autoRefreshRef.current = setInterval(() => {
      loadPositions(true);
    }, 30000);
    return () => { if (autoRefreshRef.current) clearInterval(autoRefreshRef.current); };
  }, []);

  const loadPositions = async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/strategy/longtou/positions`);
      if (res.ok) {
        setData(await res.json());
        setLastUpdated(new Date());
      }
    } catch (err) {
      if (!silent) toast.error('加载失败');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleFollow = async () => {
    const token = getToken();
    if (!token) { toast.error('请先连接钱包'); return; }
    const user = getUser();
    if (!user?.hlAddress) {
      toast.error('请先绑定 Hyperliquid 钱包');
      router.push('/portfolio');
      return;
    }
    const investAmount = parseFloat(amount);
    if (!investAmount || investAmount <= 0) { toast.error('请输入有效金额'); return; }

    setSubmitting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/copytrade/follow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ strategyId: 'longtou', amount: investAmount }),
      });
      if (res.ok) {
        toast.success('跟单成功！');
        router.push('/portfolio');
      } else {
        const err = await res.json();
        toast.error(err.error || '跟单失败');
      }
    } catch { toast.error('跟单失败'); }
    finally { setSubmitting(false); }
  };

  const totalPnl = data?.positions.reduce((s, p) => s + p.pnl, 0) || 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#040405]">
        <Navbar />
        <div className="flex items-center justify-center h-screen">
          <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#040405]">
      <Navbar />
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-12"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Activity size={24} className="text-cyan-400" />
              龙头多头策略
            </h1>
            <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
              基金经理金明主理 · 实时跟单 Hyperliquid 仓位
              {lastUpdated && <span className="ml-2">· {lastUpdated.toLocaleTimeString('zh-CN')}</span>}
            </p>
          </div>
          <Button
            variant="ghost" size="sm"
            onClick={() => { setRefreshing(true); loadPositions(); }}
            disabled={refreshing}
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left: Stats + Positions (3 cols) */}
          <div className="lg:col-span-3 space-y-6">
            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: '账户权益', value: `$${(data?.accountValue ?? 0).toFixed(2)}`, icon: DollarSign },
                { label: '持仓价值', value: `$${(data?.totalValue ?? 0).toFixed(2)}`, icon: BarChart3 },
                { label: '已用保证金', value: `$${(data?.marginUsed ?? 0).toFixed(2)}`, icon: Activity },
                { label: '总盈亏', value: `${totalPnl >= 0 ? '+' : ''}$${totalPnl.toFixed(2)}`, icon: TrendingUp, color: totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400' },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="bg-[hsl(var(--card))]/60 backdrop-blur-sm border-[hsl(var(--border))]/50">
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <stat.icon size={14} className="text-[hsl(var(--muted-foreground))]" />
                        <span className="text-xs text-[hsl(var(--muted-foreground))]">{stat.label}</span>
                      </div>
                      <p className={`text-lg font-bold ${stat.color || 'text-white'}`}>{stat.value}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Positions Table */}
            <Card className="bg-[hsl(var(--card))]/60 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  当前持仓
                  <span className="text-xs text-[hsl(var(--muted-foreground))] font-normal">
                    {data?.positions.length || 0} 个持仓
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!data || data.positions.length === 0 ? (
                  <div className="text-center py-16">
                    <BarChart3 size={40} className="mx-auto mb-3 text-[hsl(var(--muted-foreground))]/50" />
                    <p className="text-[hsl(var(--muted-foreground))]">金明老师当前暂无开仓</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]/60 mt-1">持仓将在开仓后自动显示，每30秒刷新</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-[hsl(var(--muted-foreground))] text-xs border-b border-[hsl(var(--border))]/30">
                          <th className="text-left py-3 font-medium">币种</th>
                          <th className="text-left py-3 font-medium">方向</th>
                          <th className="text-right py-3 font-medium">数量</th>
                          <th className="text-right py-3 font-medium">开仓价</th>
                          <th className="text-right py-3 font-medium">当前价</th>
                          <th className="text-right py-3 font-medium">价值</th>
                          <th className="text-right py-3 font-medium">盈亏</th>
                        </tr>
                      </thead>
                      <tbody>
                        <AnimatePresence>
                          {data.positions.map((pos, idx) => (
                            <motion.tr
                              key={pos.coin}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: idx * 0.03 }}
                              className="border-b border-[hsl(var(--border))]/10 hover:bg-[hsl(var(--secondary))]/30 transition-colors"
                            >
                              <td className="py-3 font-medium">{pos.coin}</td>
                              <td className="py-3">
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                  pos.direction === 'LONG' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                                }`}>
                                  {pos.direction}
                                </span>
                              </td>
                              <td className="py-3 text-right font-mono">{pos.size.toFixed(4)}</td>
                              <td className="py-3 text-right font-mono">${pos.entryPrice.toFixed(2)}</td>
                              <td className="py-3 text-right font-mono">${pos.currentPrice.toFixed(2)}</td>
                              <td className="py-3 text-right font-mono">${pos.value.toFixed(2)}</td>
                              <td className={`py-3 text-right font-mono font-medium ${pos.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {pos.pnl >= 0 ? '+' : ''}{pos.pnlPct.toFixed(2)}%
                                <div className="text-xs opacity-70">${pos.pnl.toFixed(2)}</div>
                              </td>
                            </motion.tr>
                          ))}
                        </AnimatePresence>
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right: Follow Panel (1 col) */}
          <div>
            <Card className="sticky top-24 bg-[hsl(var(--card))]/60 backdrop-blur-sm border-cyan-500/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">一键跟单</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-xs text-[hsl(var(--muted-foreground))]">投入金额 (USDT)</Label>
                  <Input
                    type="number"
                    placeholder="100"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {[10, 50, 100, 500].map(q => (
                    <button
                      key={q}
                      onClick={() => setAmount(String(q))}
                      className={`px-3 py-1 rounded text-xs border transition-all ${
                        amount === String(q) ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400' : 'border-[hsl(var(--border))] hover:border-cyan-500/50'
                      }`}
                    >
                      ${q}
                    </button>
                  ))}
                </div>

                {data && data.totalValue > 0 && amount && parseFloat(amount) > 0 && (
                  <div className="p-2.5 bg-[hsl(var(--secondary))]/50 rounded-lg text-xs space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-[hsl(var(--muted-foreground))]">策略总仓位</span>
                      <span>${data.totalValue.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[hsl(var(--muted-foreground))]">跟单比例</span>
                      <span className="text-cyan-400">{((parseFloat(amount) / data.totalValue) * 100).toFixed(4)}%</span>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-2 p-2.5 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <AlertCircle size={14} className="text-yellow-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-yellow-400/80">跟单将按比例复制策略仓位</p>
                </div>

                <Button onClick={handleFollow} disabled={submitting} className="w-full" size="lg">
                  <TrendingUp size={16} className="mr-1" />
                  {submitting ? '处理中...' : '确认跟单'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
