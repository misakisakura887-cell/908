"use client";

import { use, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Navbar } from '@/components/layout/navbar';
import { PerformanceChart } from '@/components/charts/performance-chart';
import { useStore } from '@/lib/store';
import { getToken, getUser, setUser as saveUser, getCurrentUser } from '@/lib/auth';
import { toast } from 'sonner';

import { 
  TrendingUp, Shield, Activity, Users, ArrowUpRight, ArrowDownRight, 
  ChevronLeft, AlertCircle, CheckCircle2, Info, Key, X, Loader2, ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export default function StrategyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { getStrategyById, investAmount, setInvestAmount, user } = useStore();
  
  const strategy = getStrategyById(id);
  const [investSuccess, setInvestSuccess] = useState(false);
  const [isInvesting, setIsInvesting] = useState(false);
  
  // HL 绑定弹窗状态
  const [showHLModal, setShowHLModal] = useState(false);
  const [hlAddress, setHlAddress] = useState('');
  const [hlPrivateKey, setHlPrivateKey] = useState('');
  const [hlBinding, setHlBinding] = useState(false);
  const [hlVerified, setHlVerified] = useState(false);
  const [pendingAmount, setPendingAmount] = useState(0);

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
    if (investAmount <= 0) return;
    const token = getToken();
    if (!token) { toast.error('请先连接钱包'); return; }

    setIsInvesting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/copytrade/follow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ strategyId: strategy.id, amount: investAmount }),
      });
      const data = await res.json();

      if (res.ok) {
        setInvestSuccess(true);
        toast.success('跟单成功！仓位将按策略比例自动同步到您的 HL 账户');
      } else if (data.error === 'NEED_HL_BINDING') {
        // 未绑定 HL API Key → 弹出绑定弹窗
        setPendingAmount(investAmount);
        setShowHLModal(true);
        setHlVerified(false);
      } else if (data.error?.startsWith('HL_VERIFY_FAILED')) {
        toast.error('HL API Key 验证失败，请重新绑定');
        setPendingAmount(investAmount);
        setShowHLModal(true);
        setHlVerified(false);
      } else {
        toast.error(data.error || '投资失败');
      }
    } catch { toast.error('网络错误'); }
    finally { setIsInvesting(false); }
  };

  // 绑定 HL API Key + 验证 + 自动投资
  const handleHLBind = async () => {
    if (!hlAddress || !hlAddress.startsWith('0x') || hlAddress.length !== 42) {
      toast.error('请输入有效的 HL 钱包地址'); return;
    }
    if (!hlPrivateKey || !hlPrivateKey.startsWith('0x')) {
      toast.error('请输入有效的 HL API Private Key'); return;
    }
    const token = getToken();
    if (!token) { toast.error('请先登录'); return; }

    setHlBinding(true);
    try {
      // Step 1: 绑定 HL API Key
      const bindRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/bindhl`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ hlAddress, hlPrivateKey }),
      });
      if (!bindRes.ok) {
        const err = await bindRes.json();
        toast.error(err.error || '绑定失败'); setHlBinding(false); return;
      }

      // 更新本地用户信息
      const currentUser = getUser();
      if (currentUser) saveUser({ ...currentUser, hlAddress: hlAddress.toLowerCase() });

      setHlVerified(true);
      toast.success('✅ HL API Key 绑定成功，正在投资...');

      // Step 2: 自动重新投资
      if (pendingAmount > 0) {
        const followRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/copytrade/follow`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ strategyId: strategy.id, amount: pendingAmount }),
        });
        const followData = await followRes.json();
        if (followRes.ok) {
          toast.success(`🎉 投资成功！$${pendingAmount} 已按策略仓位比例同步到您的 HL 账户`);
          setInvestSuccess(true);
          setTimeout(() => setShowHLModal(false), 2000);
        } else {
          toast.error(followData.error || '投资失败，请稍后重试');
        }
      }
    } catch { toast.error('操作失败'); }
    finally { setHlBinding(false); }
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

              {/* Strategy Features */}
              {strategy.detailedFeatures && strategy.detailedFeatures.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      策略详情
                      {strategy.managerName && (
                        <span className="text-sm font-normal text-[hsl(var(--muted-foreground))]">
                          · 基金经理：{strategy.managerName}
                        </span>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid sm:grid-cols-2 gap-6">
                      {strategy.detailedFeatures.map((feature, index) => (
                        <div key={index} className="space-y-2">
                          <h4 className="font-semibold text-cyan-400 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                            {feature.title}
                          </h4>
                          <ul className="space-y-1.5 text-sm text-[hsl(var(--muted-foreground))]">
                            {feature.items.map((item, itemIndex) => (
                              <li key={itemIndex} className="flex items-start gap-2">
                                <span className="text-[hsl(var(--border))] mt-1.5">•</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

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
                    <span className="text-[hsl(var(--muted-foreground))]">手续费</span>
                    <span className="text-emerald-400 font-mono">$0（零手续费）</span>
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
                      disabled={ investAmount <= 0}
                      loading={isInvesting}
                    >
                      { investAmount <= 0 ? '请输入金额' : `投资 $${investAmount}`}
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Strategy Info */}
              <Card>
                <CardHeader>
                  <CardTitle>投资须知</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-2 text-sm">
                    <CheckCircle2 size={16} className="text-emerald-400 mt-0.5 shrink-0" />
                    <span className="text-[hsl(var(--muted-foreground))]">
                      适合{riskLabels[strategy.riskLevel].replace('风险', '')}风险偏好的投资者
                    </span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <CheckCircle2 size={16} className="text-emerald-400 mt-0.5 shrink-0" />
                    <span className="text-[hsl(var(--muted-foreground))]">
                      所有交易记录链上可查，透明公开
                    </span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <CheckCircle2 size={16} className="text-emerald-400 mt-0.5 shrink-0" />
                    <span className="text-[hsl(var(--muted-foreground))]">
                      资产由智能合约托管，安全可靠
                    </span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <AlertCircle size={16} className="text-yellow-400 mt-0.5 shrink-0" />
                    <span className="text-[hsl(var(--muted-foreground))]">
                      投资有风险，历史收益不代表未来表现
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* HL API Key 绑定弹窗 */}
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
                      连接 Hyperliquid API
                    </CardTitle>
                    <button onClick={() => setShowHLModal(false)} className="text-[hsl(var(--muted-foreground))] hover:text-white">
                      <X size={18} />
                    </button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {hlVerified ? (
                    <div className="text-center py-8">
                      <CheckCircle2 size={48} className="mx-auto mb-4 text-emerald-400" />
                      <h3 className="text-lg font-bold text-emerald-400 mb-2">连接成功！</h3>
                      <p className="text-sm text-[hsl(var(--muted-foreground))]">
                        ${pendingAmount} USDT 正在按策略仓位配比投入...
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Tips: 如何获取 HL API */}
                      <div className="p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-xl">
                        <h4 className="text-sm font-bold text-cyan-400 mb-2">📋 如何获取 Hyperliquid API Key</h4>
                        <ol className="text-xs text-[hsl(var(--muted-foreground))] space-y-2 list-decimal list-inside">
                          <li>打开 <a href="https://app.hyperliquid.xyz/API" target="_blank" rel="noopener" className="text-cyan-400 underline inline-flex items-center gap-0.5">app.hyperliquid.xyz/API <ExternalLink size={10} /></a></li>
                          <li>连接你的钱包并登录</li>
                          <li>点击 <span className="text-white font-medium">"Create API Key"</span></li>
                          <li>设置权限为 <span className="text-white font-medium">"Trade"</span>（需要交易权限）</li>
                          <li>复制生成的 <span className="text-white font-medium">Wallet Address</span> 和 <span className="text-white font-medium">API Private Key</span></li>
                          <li>粘贴到下方输入框中</li>
                        </ol>
                      </div>

                      <div>
                        <Label className="text-sm">API Wallet Address</Label>
                        <Input
                          placeholder="0x..."
                          value={hlAddress}
                          onChange={e => setHlAddress(e.target.value)}
                          className="mt-1 font-mono text-sm"
                        />
                      </div>

                      <div>
                        <Label className="text-sm">API Private Key</Label>
                        <Input
                          type="password"
                          placeholder="0x..."
                          value={hlPrivateKey}
                          onChange={e => setHlPrivateKey(e.target.value)}
                          className="mt-1 font-mono text-sm"
                        />
                        <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                          🔒 使用 AES-256 加密存储，仅用于同步策略交易
                        </p>
                      </div>

                      <div className="p-3 bg-[hsl(var(--secondary))]/50 rounded-xl text-xs space-y-1.5">
                        <h5 className="font-medium text-[hsl(var(--foreground))]">连接后系统将：</h5>
                        <div className="text-[hsl(var(--muted-foreground))] space-y-1">
                          <p>1. ✅ 验证 API Key 连通性</p>
                          <p>2. 💰 将 ${pendingAmount} USDT 按策略仓位配比投入</p>
                          <p>3. 📊 同步策略的持仓和挂单到您的 HL 账户</p>
                          <p>4. 🔄 后续策略变动将自动等比同步</p>
                        </div>
                      </div>

                      <Button
                        onClick={handleHLBind}
                        disabled={hlBinding || !hlAddress || !hlPrivateKey}
                        className="w-full"
                        size="lg"
                      >
                        {hlBinding ? (
                          <><Loader2 size={16} className="mr-2 animate-spin" /> 连接验证中...</>
                        ) : (
                          <><Key size={16} className="mr-2" /> 连接 API 并投资 ${pendingAmount}</>
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
