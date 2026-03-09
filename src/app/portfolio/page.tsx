"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wallet, TrendingUp, ArrowDownToLine, ArrowUpFromLine, Link as LinkIcon, Shield, RefreshCw } from 'lucide-react';
import { getToken, getCurrentUser, getCopyPositions, setUser as saveUser, getUser } from '@/lib/auth';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

interface User {
  id: string;
  walletAddress?: string | null;
  email?: string | null;
  usdtBalance: string;
  hlAddress?: string | null;
}

interface CopyTradePosition {
  id: string;
  strategyId: string;
  invested: string;
  current: string;
  pnl: string;
  pnlPct: string;
  status: string;
  positions: any[];
}

interface HLBalance {
  perps: { accountValue: number; withdrawable: number; positions: any[] };
  spot: { usdcTotal: number; usdcAvailable: number; positions: any[] };
  totalValue: number;
  totalAvailable: number;
}

export default function PortfolioPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [positions, setPositions] = useState<CopyTradePosition[]>([]);
  const [hlBalance, setHlBalance] = useState<HLBalance | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) { router.push('/'); return; }
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userData = await getCurrentUser();
      setUser(userData);
      saveUser(userData);
      
      const token = getToken();
      // 并行加载跟单仓位 + HL 余额
      const [posResult, hlResult] = await Promise.allSettled([
        getCopyPositions(),
        userData?.hlAddress ? fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/hl-balance`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }).then(r => r.ok ? r.json() : null) : Promise.resolve(null),
      ]);
      
      setPositions(posResult.status === 'fulfilled' && Array.isArray(posResult.value) ? posResult.value : []);
      setHlBalance(hlResult.status === 'fulfilled' ? hlResult.value : null);
    } catch (err) {
      console.error(err);
      toast.error('加载失败');
    } finally { setLoading(false); }
  };

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

  const balance = parseFloat(user?.usdtBalance || '0');
  const hlAccountValue = hlBalance?.totalValue || 0;
  const hlWithdrawable = hlBalance?.totalAvailable || 0;
  const hlSpotUSDC = hlBalance?.spot?.usdcTotal || 0;
  const hlPerpsValue = hlBalance?.perps?.accountValue || 0;
  const hlSpotPositions = hlBalance?.spot?.positions || [];
  const totalInvested = positions.reduce((s, p) => s + parseFloat(p.invested || '0'), 0);
  const totalCurrent = positions.reduce((s, p) => s + parseFloat(p.current || '0'), 0);
  const totalPnl = totalCurrent - totalInvested;
  // 总资产 = 平台余额 + HL 账户总值 + 跟单持仓价值
  const totalAssets = balance + hlAccountValue + totalCurrent;

  return (
    <div className="min-h-screen bg-[#040405]">
      <Navbar />
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-6xl mx-auto px-4 sm:px-6 pt-24 pb-12"
      >
        {/* Total Assets */}
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
          <Card className="mb-6 bg-gradient-to-br from-cyan-500/10 via-[hsl(var(--card))]/80 to-blue-500/5 backdrop-blur-sm border-cyan-500/20">
            <CardContent className="pt-6 pb-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-[hsl(var(--muted-foreground))] mb-1">总资产估值</p>
                  <h2 className="text-4xl font-bold tracking-tight">
                    <span className="text-white">${totalAssets.toFixed(2)}</span>
                    <span className="text-lg text-[hsl(var(--muted-foreground))] ml-2">USDT</span>
                  </h2>
                  <p className="text-sm mt-2">
                    {user?.walletAddress && (
                      <span className="text-[hsl(var(--muted-foreground))] font-mono text-xs">
                        {user.walletAddress.slice(0, 6)}...{user.walletAddress.slice(-4)}
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => router.push('/deposit')}>
                    <ArrowDownToLine size={14} className="mr-1" /> 充值
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => router.push('/withdraw')}>
                    <ArrowUpFromLine size={14} className="mr-1" /> 提现
                  </Button>
                  <Button size="sm" variant="ghost" onClick={loadData}>
                    <RefreshCw size={14} />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Assets + Positions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Asset Breakdown */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'HL 账户价值', value: `$${hlAccountValue.toFixed(2)}`, sub: `Perps: $${hlPerpsValue.toFixed(2)} | Spot: $${hlSpotUSDC.toFixed(2)}`, color: '' },
                { label: '跟单持仓', value: `$${totalCurrent.toFixed(2)}`, sub: totalInvested > 0 ? `投入: $${totalInvested.toFixed(2)}` : '暂无跟单', color: '' },
                { label: '总盈亏', value: `${totalPnl >= 0 ? '+' : ''}$${totalPnl.toFixed(2)}`, sub: totalInvested > 0 ? `${((totalPnl / totalInvested) * 100).toFixed(2)}%` : '—', color: totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400' },
              ].map((item, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.05 }}>
                  <Card className="bg-[hsl(var(--card))]/60 backdrop-blur-sm">
                    <CardContent className="pt-4 pb-4">
                      <p className="text-xs text-[hsl(var(--muted-foreground))] mb-1">{item.label}</p>
                      <p className={`text-xl font-bold ${item.color}`}>{item.value}</p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">{item.sub}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Copy Trade Positions */}
            <Card className="bg-[hsl(var(--card))]/60 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">跟单仓位</CardTitle>
              </CardHeader>
              <CardContent>
                {positions.length === 0 ? (
                  <div className="text-center py-12">
                    <TrendingUp size={36} className="mx-auto mb-3 text-[hsl(var(--muted-foreground))]/40" />
                    <p className="text-[hsl(var(--muted-foreground))] mb-3">暂无跟单仓位</p>
                    <Button onClick={() => router.push('/trade')} size="sm">
                      开始跟单
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {positions.map((pos) => (
                      <div key={pos.id} className="p-4 bg-[hsl(var(--secondary))]/30 rounded-xl border border-[hsl(var(--border))]/30">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{pos.strategyId === 'longtou' ? '龙头多头策略' : pos.strategyId}</h4>
                            <span className={`px-2 py-0.5 rounded text-xs ${
                              pos.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-yellow-500/20 text-yellow-400'
                            }`}>
                              {pos.status === 'active' ? '活跃' : '暂停'}
                            </span>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => router.push('/trade')}>
                            查看
                          </Button>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-xs text-[hsl(var(--muted-foreground))]">投入</p>
                            <p className="font-medium">${parseFloat(pos.invested).toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-[hsl(var(--muted-foreground))]">当前</p>
                            <p className="font-medium">${parseFloat(pos.current).toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-[hsl(var(--muted-foreground))]">盈亏</p>
                            <p className={`font-medium ${parseFloat(pos.pnl) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {parseFloat(pos.pnl) >= 0 ? '+' : ''}{parseFloat(pos.pnl).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right: Actions */}
          <div className="space-y-4">
            {/* HL Binding */}
            <Card className={`bg-[hsl(var(--card))]/60 backdrop-blur-sm ${user?.hlAddress ? 'border-emerald-500/20' : 'border-cyan-500/20'}`}>
              <CardContent className="pt-5 pb-5">
                {user?.hlAddress ? (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-sm font-medium">Hyperliquid 已绑定</span>
                    </div>
                    <p className="text-xs font-mono text-[hsl(var(--muted-foreground))] mb-3">
                      {user.hlAddress.slice(0, 10)}...{user.hlAddress.slice(-6)}
                    </p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" onClick={() => router.push('/dashboard/bind-hl')} className="text-xs">
                        更换钱包
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <LinkIcon size={16} className="text-cyan-400" />
                      <span className="text-sm font-medium">绑定 Hyperliquid</span>
                    </div>
                    <p className="text-xs text-[hsl(var(--muted-foreground))] mb-3">绑定 HL 钱包以启用自动跟单</p>
                    <Button size="sm" onClick={() => router.push('/dashboard/bind-hl')}>
                      <Shield size={14} className="mr-1" /> 立即绑定
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-[hsl(var(--card))]/60 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">快捷操作</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="secondary" className="w-full justify-start" size="sm" onClick={() => router.push('/trade')}>
                  <TrendingUp size={14} className="mr-2" /> 去交易
                </Button>
                <Button variant="secondary" className="w-full justify-start" size="sm" onClick={() => router.push('/deposit')}>
                  <ArrowDownToLine size={14} className="mr-2" /> 充值 USDT
                </Button>
                <Button variant="secondary" className="w-full justify-start" size="sm" onClick={() => router.push('/withdraw')}>
                  <ArrowUpFromLine size={14} className="mr-2" /> 提现
                </Button>
              </CardContent>
            </Card>

            {/* Security */}
            <Card className="bg-[hsl(var(--card))]/60 backdrop-blur-sm border-[hsl(var(--border))]/30">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Shield size={14} className="text-cyan-400" />
                  <span className="text-xs font-medium">安全状态</span>
                </div>
                <div className="space-y-1.5 text-xs text-[hsl(var(--muted-foreground))]">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    钱包已连接
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${user?.hlAddress ? 'bg-emerald-400' : 'bg-yellow-400'}`} />
                    {user?.hlAddress ? 'HL 钱包已绑定' : 'HL 钱包未绑定'}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    AES-256 加密存储
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
