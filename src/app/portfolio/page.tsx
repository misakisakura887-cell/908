"use client";

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wallet, TrendingUp, TrendingDown, ArrowDownToLine, ArrowUpFromLine, Link as LinkIcon, Shield, RefreshCw, Activity, Square, AlertTriangle } from 'lucide-react';
import { getToken, getCurrentUser, getCopyPositions, setUser as saveUser } from '@/lib/auth';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const API = process.env.NEXT_PUBLIC_API_URL;

interface User {
  id: string;
  walletAddress?: string | null;
  email?: string | null;
  usdtBalance: string;
  hlAddress?: string | null;
}

interface HLPosition {
  coin: string;
  market: 'perps' | 'spot';
  direction: 'LONG' | 'SHORT';
  size: number;
  entryPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPct: number;
  value: number;
  leverage?: number;
}

interface HLPositionsData {
  positions: HLPosition[];
  perpsAccountValue: number;
  spotUsdcTotal: number;
  spotPositionValue: number;
  totalValue: number;
  totalPnl: number;
  totalPnlPct: number;
  updatedAt: string;
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

export default function PortfolioPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [copyPositions, setCopyPositions] = useState<CopyTradePosition[]>([]);
  const [hlData, setHlData] = useState<HLPositionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 加载用户基本信息（首次）
  const loadUser = useCallback(async () => {
    const token = getToken();
    if (!token) { router.push('/'); return; }
    try {
      const userData = await getCurrentUser();
      setUser(userData);
      saveUser(userData);
    } catch { /* ignore */ }
  }, [router]);

  // 实时获取 HL 持仓（轻量级，5s 一次）
  const fetchHLPositions = useCallback(async (showRefreshing = false) => {
    const token = getToken();
    if (!token) return;
    if (showRefreshing) setRefreshing(true);
    try {
      const res = await fetch(`${API}/user/hl-positions`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setHlData(data);
        setLastUpdate(new Date());
      }
    } catch { /* silent */ }
    if (showRefreshing) setRefreshing(false);
  }, []);

  // 获取跟单记录（不需要频繁刷新）
  const fetchCopyPositions = useCallback(async () => {
    try {
      const data = await getCopyPositions();
      setCopyPositions(Array.isArray(data) ? data : []);
    } catch { /* ignore */ }
  }, []);

  // 停止跟单（退回余额）
  const stopCopyTrade = async (id: string) => {
    if (!confirm('确认停止跟单？投入金额将退回平台余额。')) return;
    const token = getToken();
    try {
      const res = await fetch(`${API}/copytrade/${id}/stop`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        toast.success('跟单已停止，资金已退回');
        await Promise.all([fetchCopyPositions(), loadUser()]);
      } else {
        const data = await res.json();
        toast.error(data.error || '操作失败');
      }
    } catch { toast.error('网络错误'); }
  };

  // 首次加载
  useEffect(() => {
    const init = async () => {
      await loadUser();
      await Promise.all([fetchHLPositions(), fetchCopyPositions()]);
      setLoading(false);
    };
    init();
  }, [loadUser, fetchHLPositions, fetchCopyPositions]);

  // 5秒自动刷新 HL 持仓（实时价格）
  useEffect(() => {
    intervalRef.current = setInterval(() => fetchHLPositions(), 5000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchHLPositions]);

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

  const totalValue = hlData?.totalValue || 0;
  const totalPnl = hlData?.totalPnl || 0;
  const totalPnlPct = hlData?.totalPnlPct || 0;
  const perpsValue = hlData?.perpsAccountValue || 0;
  const spotUsdc = hlData?.spotUsdcTotal || 0;
  const spotPositionValue = hlData?.spotPositionValue || 0;
  const positions = hlData?.positions || [];
  const totalInvested = copyPositions.reduce((s, p) => s + parseFloat(p.invested || '0'), 0);

  return (
    <div className="min-h-screen bg-[#040405]">
      <Navbar />
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-6xl mx-auto px-4 sm:px-6 pt-24 pb-12"
      >
        {/* Total Assets — 实时更新 */}
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
          <Card className="mb-6 bg-gradient-to-br from-cyan-500/10 via-[hsl(var(--card))]/80 to-blue-500/5 backdrop-blur-sm border-cyan-500/20">
            <CardContent className="pt-6 pb-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">总资产估值</p>
                    {lastUpdate && (
                      <div className="flex items-center gap-1">
                        <Activity size={10} className="text-emerald-400 animate-pulse" />
                        <span className="text-[10px] text-emerald-400/70">实时</span>
                      </div>
                    )}
                  </div>
                  <h2 className="text-4xl font-bold tracking-tight">
                    <span className="text-white">${totalValue.toFixed(2)}</span>
                    <span className="text-lg text-[hsl(var(--muted-foreground))] ml-2">USDT</span>
                  </h2>
                  <div className="flex items-center gap-3 mt-2">
                    <span className={`text-sm font-medium ${totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {totalPnl >= 0 ? '+' : ''}{totalPnl.toFixed(2)} USDT
                    </span>
                    <span className={`text-sm font-medium px-2 py-0.5 rounded ${totalPnl >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                      {totalPnlPct >= 0 ? '+' : ''}{totalPnlPct.toFixed(2)}%
                    </span>
                    {user?.walletAddress && (
                      <span className="text-[hsl(var(--muted-foreground))] font-mono text-xs">
                        {user.walletAddress.slice(0, 6)}...{user.walletAddress.slice(-4)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => router.push('/deposit')}>
                    <ArrowDownToLine size={14} className="mr-1" /> 充值
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => router.push('/withdraw')}>
                    <ArrowUpFromLine size={14} className="mr-1" /> 提现
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => fetchHLPositions(true)} disabled={refreshing}>
                    <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* 平台余额提示 */}
        {parseFloat(user?.usdtBalance || '0') > 0 && (
          <div className="mb-4 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-start gap-3">
            <AlertTriangle size={18} className="text-yellow-400 mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="text-yellow-400 font-medium mb-1">平台余额: ${parseFloat(user?.usdtBalance || '0').toFixed(2)} USDT</p>
              <p className="text-[hsl(var(--muted-foreground))]">
                此余额存放在平台账户中。如需交易，请先将资金充值到您的 Hyperliquid 钱包。
                <button onClick={() => router.push('/withdraw')} className="text-cyan-400 hover:underline ml-1">提现 →</button>
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Asset Breakdown */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Perps 账户', value: `$${perpsValue.toFixed(2)}`, sub: `${positions.filter(p => p.market === 'perps').length} 个仓位`, color: '' },
                { label: 'Spot 账户', value: `$${(spotUsdc + spotPositionValue).toFixed(2)}`, sub: `USDC: $${spotUsdc.toFixed(2)} | 持仓: $${spotPositionValue.toFixed(2)}`, color: '' },
                { label: '总盈亏', value: `${totalPnl >= 0 ? '+' : ''}$${totalPnl.toFixed(2)}`, sub: `${totalPnlPct >= 0 ? '+' : ''}${totalPnlPct.toFixed(2)}%`, color: totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400' },
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

            {/* HL 实时持仓 — 每5秒刷新 */}
            <Card className="bg-[hsl(var(--card))]/60 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    HL 持仓
                    <Activity size={12} className="text-emerald-400 animate-pulse" />
                  </CardTitle>
                  {lastUpdate && (
                    <span className="text-[10px] text-[hsl(var(--muted-foreground))]">
                      {lastUpdate.toLocaleTimeString()} 更新
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {positions.length === 0 ? (
                  <div className="text-center py-12">
                    <TrendingUp size={36} className="mx-auto mb-3 text-[hsl(var(--muted-foreground))]/40" />
                    <p className="text-[hsl(var(--muted-foreground))] mb-1">暂无持仓</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]/60 mb-3">跟单策略后，仓位将在此实时显示</p>
                    <Button onClick={() => router.push('/trade')} size="sm">
                      开始跟单
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-0">
                    {/* 表头 */}
                    <div className="grid grid-cols-7 gap-2 text-xs text-[hsl(var(--muted-foreground))] pb-2 border-b border-[hsl(var(--border))]/20 px-2">
                      <span>标的</span>
                      <span>方向</span>
                      <span className="text-right">数量</span>
                      <span className="text-right">开仓价</span>
                      <span className="text-right">现价</span>
                      <span className="text-right">盈亏</span>
                      <span className="text-right">盈亏%</span>
                    </div>
                    {/* 持仓行 */}
                    {positions.map((pos, idx) => (
                      <motion.div
                        key={`${pos.coin}-${pos.market}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: idx * 0.03 }}
                        className="grid grid-cols-7 gap-2 text-sm py-3 px-2 border-b border-[hsl(var(--border))]/10 hover:bg-[hsl(var(--secondary))]/20 transition-colors"
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium">{pos.coin}</span>
                          <span className="text-[10px] px-1 py-0.5 rounded bg-[hsl(var(--secondary))]/50 text-[hsl(var(--muted-foreground))]">
                            {pos.market === 'perps' ? '永续' : '现货'}
                          </span>
                        </div>
                        <div>
                          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                            pos.direction === 'LONG' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                          }`}>
                            {pos.direction === 'LONG' ? '多' : '空'}
                            {pos.leverage && pos.leverage > 1 ? ` ${pos.leverage}x` : ''}
                          </span>
                        </div>
                        <span className="text-right font-mono">{pos.size.toFixed(pos.market === 'spot' ? 4 : 5)}</span>
                        <span className="text-right font-mono">${pos.entryPrice.toFixed(2)}</span>
                        <span className="text-right font-mono">${pos.currentPrice.toFixed(2)}</span>
                        <span className={`text-right font-mono font-medium ${pos.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {pos.pnl >= 0 ? '+' : ''}{pos.pnl.toFixed(2)}
                        </span>
                        <span className={`text-right font-mono ${pos.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {pos.pnlPct >= 0 ? '+' : ''}{pos.pnlPct.toFixed(2)}%
                        </span>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 跟单记录 */}
            <Card className="bg-[hsl(var(--card))]/60 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">跟单记录</CardTitle>
              </CardHeader>
              <CardContent>
                {copyPositions.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-[hsl(var(--muted-foreground))] text-sm">暂无跟单记录</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {copyPositions.map((pos) => {
                      const pnl = parseFloat(pos.pnl);
                      const pnlPct = parseFloat(pos.pnlPct);
                      const tradeablePositions = (pos.positions || []).filter((p: any) => p.tradeable !== false);
                      return (
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
                            {pos.status === 'active' && (
                              <Button variant="danger" size="sm" onClick={() => stopCopyTrade(pos.id)}>
                                <Square size={12} className="mr-1" /> 停止跟单
                              </Button>
                            )}
                          </div>
                          <div className="grid grid-cols-4 gap-4 text-sm mb-3">
                            <div>
                              <p className="text-xs text-[hsl(var(--muted-foreground))]">投入</p>
                              <p className="font-medium">${parseFloat(pos.invested).toFixed(2)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-[hsl(var(--muted-foreground))]">当前价值</p>
                              <p className="font-medium">${parseFloat(pos.current).toFixed(2)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-[hsl(var(--muted-foreground))]">盈亏</p>
                              <p className={`font-medium ${pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-[hsl(var(--muted-foreground))]">收益率</p>
                              <p className={`font-medium ${pnlPct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(2)}%
                              </p>
                            </div>
                          </div>
                          {/* 跟单子持仓（只显示可交易的） */}
                          {tradeablePositions.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-[hsl(var(--border))]/20">
                              <p className="text-xs text-[hsl(var(--muted-foreground))] mb-2">跟单持仓明细</p>
                              {tradeablePositions.map((p: any, i: number) => (
                                <div key={i} className="flex items-center justify-between text-xs py-1.5">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{p.coin}</span>
                                    <span className={`px-1 py-0.5 rounded text-[10px] ${
                                      p.direction === 'LONG' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                                    }`}>{p.direction === 'LONG' ? '多' : '空'}</span>
                                  </div>
                                  <div className="flex items-center gap-4 font-mono">
                                    <span className="text-[hsl(var(--muted-foreground))]">{p.size?.toFixed(4)} 股</span>
                                    <span>入 ${p.entryPrice?.toFixed(2)}</span>
                                    <span>现 ${p.currentPrice?.toFixed(2)}</span>
                                    <span className={p.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                                      {p.pnl >= 0 ? '+' : ''}{p.pnl?.toFixed(2)}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right sidebar */}
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
                    <Button size="sm" variant="ghost" onClick={() => router.push('/dashboard/bind-hl')} className="text-xs">
                      更换钱包
                    </Button>
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
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> 钱包已连接
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${user?.hlAddress ? 'bg-emerald-400' : 'bg-yellow-400'}`} />
                    {user?.hlAddress ? 'HL 钱包已绑定' : 'HL 钱包未绑定'}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> AES-256 加密存储
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
