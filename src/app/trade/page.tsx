"use client";

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/layout/navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TrendingUp, RefreshCw, AlertCircle, Activity, DollarSign, BarChart3, Plus, Bot, Zap, Shield, Brain, Grid3X3, X, Key, CheckCircle, Loader2 } from 'lucide-react';
import { getToken, getUser } from '@/lib/auth';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

const BOT_ICONS: Record<string, any> = {
  trend_following: TrendingUp,
  swing_trading: RefreshCw,
  grid_martin: Grid3X3,
  arbitrage_hedge: Shield,
  sentiment_nlp: Brain,
  dca_conservative: Shield,
}

interface BotType {
  id: string; name: string; icon: string; description: string;
  riskLevel: string; category: string; defaultParams: any;
}

interface MarketplaceBot {
  id: string; name: string; type: string; description: string;
  riskLevel: string; status: string; followers: number;
  totalPnl: string; totalTrades: number; creator: string; symbols: string[];
}

interface Position {
  coin: string; direction: string; size: number; entryPrice: number;
  currentPrice: number; pnl: number; pnlPct: number; value: number;
}

interface LongtouData {
  positions: Position[]; totalValue: number; accountValue: number;
  marginUsed: number; withdrawable: number;
}

export default function TradePage() {
  const router = useRouter();
  const [tab, setTab] = useState<'longtou' | 'marketplace' | 'mybots'>('longtou');
  const [data, setData] = useState<LongtouData | null>(null);
  const [botTypes, setBotTypes] = useState<BotType[]>([]);
  const [marketplace, setMarketplace] = useState<MarketplaceBot[]>([]);
  const [myBots, setMyBots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showHLModal, setShowHLModal] = useState(false);
  const [hlAddress, setHlAddress] = useState('');
  const [hlPrivateKey, setHlPrivateKey] = useState('');
  const [hlBinding, setHlBinding] = useState(false);
  const [hlVerified, setHlVerified] = useState(false);
  const [pendingAmount, setPendingAmount] = useState(0);
  const autoRef = useRef<NodeJS.Timeout>(null);
  const token = getToken();

  useEffect(() => {
    loadPositions();
    loadBotTypes();
    loadMarketplace();
    if (token) loadMyBots();
    autoRef.current = setInterval(() => loadPositions(true), 30000);
    return () => { if (autoRef.current) clearInterval(autoRef.current); };
  }, []);

  const loadPositions = async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/strategy/longtou/positions`);
      if (res.ok) { setData(await res.json()); setLastUpdated(new Date()); }
    } catch {} finally { setLoading(false); setRefreshing(false); }
  };

  const loadBotTypes = async () => {
    try { const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/bots/types`); if (res.ok) setBotTypes(await res.json()); } catch {}
  };

  const loadMarketplace = async () => {
    try { const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/bots/marketplace`); if (res.ok) setMarketplace(await res.json()); } catch {}
  };

  const loadMyBots = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/bots/my`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) setMyBots(await res.json());
    } catch {}
  };

  const handleFollow = async () => {
    if (!token) { toast.error('请先连接钱包'); return; }
    const investAmount = parseFloat(amount);
    if (!investAmount || investAmount <= 0) { toast.error('请输入有效金额'); return; }

    // 先尝试跟单，后端会检查 HL 绑定
    setSubmitting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/copytrade/follow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ strategyId: 'longtou', amount: investAmount }),
      });
      const data = await res.json();
      
      if (res.ok) {
        toast.success('跟单成功！策略仓位将自动同步到您的 HL 账户');
        router.push('/portfolio');
      } else if (data.error === 'NEED_HL_BINDING') {
        // 未绑定 HL → 弹出绑定弹窗
        setPendingAmount(investAmount);
        setShowHLModal(true);
        setHlVerified(false);
      } else if (data.error?.startsWith('HL_VERIFY_FAILED')) {
        toast.error('HL API Key 验证失败，请重新绑定');
        setPendingAmount(investAmount);
        setShowHLModal(true);
        setHlVerified(false);
      } else {
        toast.error(data.error || '跟单失败');
      }
    } catch { toast.error('网络错误'); }
    finally { setSubmitting(false); }
  };

  // 绑定 HL + 验证 + 自动重新跟单
  const handleHLBind = async () => {
    if (!hlAddress || !hlAddress.startsWith('0x') || hlAddress.length !== 42) {
      toast.error('请输入有效的 HL 钱包地址 (0x...)'); return;
    }
    if (!hlPrivateKey || !hlPrivateKey.startsWith('0x')) {
      toast.error('请输入有效的 HL API Private Key (0x...)'); return;
    }

    setHlBinding(true);
    try {
      // Step 1: 绑定 HL
      const bindRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/bindhl`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ hlAddress, hlPrivateKey }),
      });
      
      if (!bindRes.ok) {
        const err = await bindRes.json();
        toast.error(err.error || '绑定失败');
        setHlBinding(false);
        return;
      }

      // 更新 localStorage
      const { setUser: saveUser, getUser: loadUser } = await import('@/lib/auth');
      const currentUser = loadUser();
      if (currentUser) saveUser({ ...currentUser, hlAddress: hlAddress.toLowerCase() });

      setHlVerified(true);
      toast.success('✅ HL 钱包绑定成功，正在验证连通性...');

      // Step 2: 自动重新跟单
      if (pendingAmount > 0) {
        const followRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/copytrade/follow`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ strategyId: 'longtou', amount: pendingAmount }),
        });
        const followData = await followRes.json();

        if (followRes.ok) {
          toast.success(`🎉 跟单成功！$${pendingAmount} 已投入龙头策略，仓位将自动同步`);
          setTimeout(() => { setShowHLModal(false); router.push('/portfolio'); }, 1500);
        } else {
          toast.error(followData.error || '跟单失败，请稍后重试');
        }
      } else {
        setTimeout(() => setShowHLModal(false), 1500);
      }
    } catch (err) {
      toast.error('操作失败');
    } finally { setHlBinding(false); }
  };

  const toggleBot = async (botId: string, isRunning: boolean) => {
    const action = isRunning ? 'stop' : 'start';
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/bots/${botId}/${action}`, {
        method: 'POST', headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) { toast.success(isRunning ? '已停止' : '已启动'); loadMyBots(); }
    } catch { toast.error('操作失败'); }
  };

  const riskColors: Record<string, string> = {
    conservative: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    balanced: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    aggressive: 'text-red-400 bg-red-500/10 border-red-500/20',
  };
  const riskLabels: Record<string, string> = { conservative: '🛡️ 保守', balanced: '⚖️ 稳健', aggressive: '🔥 激进' };

  const totalPnl = data?.positions.reduce((s, p) => s + p.pnl, 0) || 0;

  return (
    <div className="min-h-screen bg-[#040405]">
      <Navbar />
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-12">
        {/* Tabs */}
        <div className="flex items-center gap-1 mb-6 bg-[hsl(var(--card))]/40 rounded-xl p-1 w-fit">
          {[
            { key: 'longtou', label: '龙头策略', icon: Activity },
            { key: 'marketplace', label: '策略广场', icon: Bot },
            { key: 'mybots', label: '我的机器人', icon: Zap },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as any)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm transition-all ${
                tab === t.key ? 'bg-cyan-500/20 text-cyan-400' : 'text-[hsl(var(--muted-foreground))] hover:text-white'
              }`}
            >
              <t.icon size={14} /> {t.label}
            </button>
          ))}
        </div>

        {/* Longtou Tab */}
        {tab === 'longtou' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3 space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: '账户权益', value: `$${(data?.accountValue ?? 0).toFixed(2)}`, icon: DollarSign },
                  { label: '持仓价值', value: `$${(data?.totalValue ?? 0).toFixed(2)}`, icon: BarChart3 },
                  { label: '已用保证金', value: `$${(data?.marginUsed ?? 0).toFixed(2)}`, icon: Activity },
                  { label: '总盈亏', value: `${totalPnl >= 0 ? '+' : ''}$${totalPnl.toFixed(2)}`, icon: TrendingUp, color: totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400' },
                ].map((s, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                    <Card className="bg-[hsl(var(--card))]/60 backdrop-blur-sm">
                      <CardContent className="pt-4 pb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <s.icon size={14} className="text-[hsl(var(--muted-foreground))]" />
                          <span className="text-xs text-[hsl(var(--muted-foreground))]">{s.label}</span>
                        </div>
                        <p className={`text-lg font-bold ${(s as any).color || ''}`}>{s.value}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* Positions */}
              <Card className="bg-[hsl(var(--card))]/60 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">金明老师 · 实时持仓 <span className="text-xs font-normal text-[hsl(var(--muted-foreground))]">{lastUpdated && `更新于 ${lastUpdated.toLocaleTimeString('zh-CN')}`}</span></CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => { setRefreshing(true); loadPositions(); }} disabled={refreshing}>
                      <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {!data || data.positions.length === 0 ? (
                    <div className="text-center py-12">
                      <BarChart3 size={36} className="mx-auto mb-3 text-[hsl(var(--muted-foreground))]/40" />
                      <p className="text-[hsl(var(--muted-foreground))]">金明老师当前暂无开仓</p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]/60 mt-1">每30秒自动刷新</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead><tr className="text-[hsl(var(--muted-foreground))] text-xs border-b border-[hsl(var(--border))]/30">
                          <th className="text-left py-3">币种</th><th className="text-left py-3">方向</th><th className="text-right py-3">数量</th>
                          <th className="text-right py-3">开仓价</th><th className="text-right py-3">当前价</th><th className="text-right py-3">盈亏</th>
                        </tr></thead>
                        <tbody>
                          {data.positions.map((p, i) => (
                            <motion.tr key={p.coin} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="border-b border-[hsl(var(--border))]/10 hover:bg-[hsl(var(--secondary))]/30">
                              <td className="py-3 font-medium">{p.coin}</td>
                              <td className="py-3"><span className={`px-2 py-0.5 rounded text-xs ${p.direction === 'LONG' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>{p.direction}</span></td>
                              <td className="py-3 text-right font-mono">{p.size.toFixed(4)}</td>
                              <td className="py-3 text-right font-mono">${p.entryPrice.toFixed(2)}</td>
                              <td className="py-3 text-right font-mono">${p.currentPrice.toFixed(2)}</td>
                              <td className={`py-3 text-right font-mono ${p.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{p.pnl >= 0 ? '+' : ''}{p.pnlPct.toFixed(2)}%</td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Follow Panel */}
            <div>
              <Card className="sticky top-24 bg-[hsl(var(--card))]/60 backdrop-blur-sm border-cyan-500/20">
                <CardHeader className="pb-3"><CardTitle className="text-base">一键跟单</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 rounded-lg bg-cyan-500/5 border border-cyan-500/10 text-xs text-[hsl(var(--muted-foreground))]">
                    <p className="mb-1">💡 资金使用您自己的 Hyperliquid 钱包</p>
                    <p>跟单后仓位建在您的 HL 账户上，您可随时在 HL 查看。需先绑定 HL 钱包并确保有足够 USDC。</p>
                  </div>
                  <div><Label className="text-xs text-[hsl(var(--muted-foreground))]">跟单金额 (USDC) — 将从您的 HL 余额使用</Label>
                    <Input type="number" placeholder="10" min="10" value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-1" /></div>
                  <div className="flex flex-wrap gap-1.5">{[10, 50, 100, 500].map(q => (
                    <button key={q} onClick={() => setAmount(String(q))} className={`px-3 py-1 rounded text-xs border transition-all ${amount === String(q) ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400' : 'border-[hsl(var(--border))]'}`}>${q}</button>
                  ))}</div>
                  <Button onClick={handleFollow} disabled={submitting} className="w-full" size="lg">
                    <TrendingUp size={16} className="mr-1" /> {submitting ? '处理中...' : '确认跟单'}
                  </Button>
                  <p className="text-[10px] text-[hsl(var(--muted-foreground))]/60 text-center">最低跟单 $10 · 仓位实时同步至您的 HL</p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Marketplace Tab */}
        {tab === 'marketplace' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">策略广场</h2>
              <Button onClick={() => router.push('/trade/create')} size="sm">
                <Plus size={14} className="mr-1" /> 创建策略
              </Button>
            </div>

            {/* Bot Types */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {botTypes.map((bt, i) => (
                <motion.div key={bt.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Card className="bg-[hsl(var(--card))]/60 backdrop-blur-sm hover:border-cyan-500/30 transition-all cursor-pointer group"
                    onClick={() => router.push(`/trade/create?type=${bt.id}`)}>
                    <CardContent className="pt-5 pb-5">
                      <div className="flex items-start justify-between mb-3">
                        <span className="text-2xl">{bt.icon}</span>
                        <span className={`px-2 py-0.5 rounded text-xs border ${riskColors[bt.riskLevel] || riskColors.balanced}`}>
                          {riskLabels[bt.riskLevel] || '⚖️ 稳健'}
                        </span>
                      </div>
                      <h3 className="font-bold mb-1 group-hover:text-cyan-400 transition-colors">{bt.name}</h3>
                      <p className="text-xs text-[hsl(var(--muted-foreground))] leading-relaxed">{bt.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Public Bots */}
            {marketplace.length > 0 && (
              <>
                <h3 className="text-lg font-bold mt-8">社区策略</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {marketplace.map((bot) => (
                    <Card key={bot.id} className="bg-[hsl(var(--card))]/60 backdrop-blur-sm">
                      <CardContent className="pt-5 pb-5">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{bot.name}</h4>
                          <span className={`px-2 py-0.5 rounded text-xs border ${riskColors[bot.riskLevel] || riskColors.balanced}`}>{riskLabels[bot.riskLevel]}</span>
                        </div>
                        <p className="text-xs text-[hsl(var(--muted-foreground))] mb-3">{bot.description}</p>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[hsl(var(--muted-foreground))]">{bot.creator} · {bot.followers} 跟随</span>
                          <span className={`font-medium ${parseFloat(bot.totalPnl) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            PnL: {parseFloat(bot.totalPnl) >= 0 ? '+' : ''}${parseFloat(bot.totalPnl).toFixed(2)}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* My Bots Tab */}
        {tab === 'mybots' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">我的机器人</h2>
              <Button onClick={() => router.push('/trade/create')} size="sm"><Plus size={14} className="mr-1" /> 新建</Button>
            </div>

            {!token ? (
              <Card className="bg-[hsl(var(--card))]/60"><CardContent className="py-12 text-center">
                <p className="text-[hsl(var(--muted-foreground))]">请先连接钱包</p>
              </CardContent></Card>
            ) : myBots.length === 0 ? (
              <Card className="bg-[hsl(var(--card))]/60"><CardContent className="py-12 text-center">
                <Bot size={36} className="mx-auto mb-3 text-[hsl(var(--muted-foreground))]/40" />
                <p className="text-[hsl(var(--muted-foreground))] mb-3">还没有创建机器人</p>
                <Button onClick={() => router.push('/trade/create')}><Plus size={14} className="mr-1" /> 创建第一个机器人</Button>
              </CardContent></Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myBots.map((bot) => (
                  <Card key={bot.id} className="bg-[hsl(var(--card))]/60 backdrop-blur-sm">
                    <CardContent className="pt-5 pb-5">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{bot.name}</h4>
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          bot.status === 'RUNNING' ? 'bg-emerald-500/20 text-emerald-400' :
                          bot.status === 'ERROR' ? 'bg-red-500/20 text-red-400' :
                          'bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))]'
                        }`}>{bot.status === 'RUNNING' ? '🟢 运行中' : bot.status === 'ERROR' ? '❌ 错误' : '⏸ 停止'}</span>
                      </div>
                      <p className="text-xs text-[hsl(var(--muted-foreground))] mb-3">{bot.type} · {bot.symbols?.join(', ')} · {bot.totalTrades} 笔交易</p>
                      <div className="flex gap-2">
                        <Button size="sm" variant={bot.status === 'RUNNING' ? 'danger' : 'primary'} onClick={() => toggleBot(bot.id, bot.status === 'RUNNING')}>
                          {bot.status === 'RUNNING' ? '停止' : '启动'}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => router.push(`/trade/bot/${bot.id}`)}>详情</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
        {/* HL Binding Modal */}
        <AnimatePresence>
          {showHLModal && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
              onClick={(e) => { if (e.target === e.currentTarget) setShowHLModal(false); }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="w-full max-w-lg"
              >
                <Card className="bg-[#0a0a0b] border-cyan-500/30">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Key size={20} className="text-cyan-400" />
                        绑定 Hyperliquid API Key
                      </CardTitle>
                      <button onClick={() => setShowHLModal(false)} className="text-[hsl(var(--muted-foreground))] hover:text-white">
                        <X size={18} />
                      </button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {hlVerified ? (
                      <div className="text-center py-8">
                        <CheckCircle size={48} className="mx-auto mb-4 text-emerald-400" />
                        <h3 className="text-lg font-bold text-emerald-400 mb-2">绑定成功！</h3>
                        <p className="text-sm text-[hsl(var(--muted-foreground))]">
                          正在将 ${pendingAmount} USDT 投入龙头策略...
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-lg text-sm">
                          <p className="text-cyan-400 font-medium mb-1">📋 操作说明</p>
                          <ol className="text-xs text-[hsl(var(--muted-foreground))] space-y-1 list-decimal list-inside">
                            <li>登录 <a href="https://app.hyperliquid.xyz" target="_blank" className="text-cyan-400 underline">app.hyperliquid.xyz</a></li>
                            <li>进入 Settings → API → 创建 API Key</li>
                            <li>将 Wallet Address 和 Private Key 填入下方</li>
                            <li>绑定验证通过后，系统将自动同步策略仓位到你的账户</li>
                          </ol>
                        </div>

                        <div>
                          <Label className="text-sm">HL 钱包地址</Label>
                          <Input
                            placeholder="0x..."
                            value={hlAddress}
                            onChange={e => setHlAddress(e.target.value)}
                            className="mt-1 font-mono"
                          />
                        </div>

                        <div>
                          <Label className="text-sm">HL API Private Key</Label>
                          <Input
                            type="password"
                            placeholder="0x..."
                            value={hlPrivateKey}
                            onChange={e => setHlPrivateKey(e.target.value)}
                            className="mt-1 font-mono"
                          />
                          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                            🔒 Private Key 将使用 AES-256 加密存储，仅用于同步交易
                          </p>
                        </div>

                        <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                          <div className="flex items-start gap-2">
                            <AlertCircle size={14} className="text-yellow-400 mt-0.5 flex-shrink-0" />
                            <div className="text-xs text-yellow-400/80">
                              <p>绑定后，系统将：</p>
                              <p>1. 验证 API Key 连通性</p>
                              <p>2. 将 ${pendingAmount} USDT 按策略比例同步仓位</p>
                              <p>3. 后续金明老师的持仓变动将自动同步</p>
                            </div>
                          </div>
                        </div>

                        <Button
                          onClick={handleHLBind}
                          disabled={hlBinding || !hlAddress || !hlPrivateKey}
                          className="w-full"
                          size="lg"
                        >
                          {hlBinding ? (
                            <><Loader2 size={16} className="mr-2 animate-spin" /> 绑定验证中...</>
                          ) : (
                            <><Key size={16} className="mr-2" /> 绑定并投资 ${pendingAmount}</>
                          )}
                        </Button>
                      </>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
