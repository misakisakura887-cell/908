"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/navbar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, ArrowRight, Wallet, CheckCircle, AlertCircle, Zap, Shield, ChevronRight } from 'lucide-react';
import Link from 'next/link';

import { API_BASE } from '@/lib/config';

interface Strategy {
  id: string;
  name: string;
  description: string;
  return7d: number;
  return30d: number;
  riskLevel: number;
  followers: number;
  minInvest: number;
}

interface Position {
  id: string;
  strategyId: string;
  strategyName: string;
  invested: string;
  current: string;
  pnl: string;
  pnlPct: string;
}

interface Summary {
  balance: string;
  totalInvested: string;
  totalCurrent: string;
  totalPnl: string;
  pnlPct: string;
  positionCount: number;
}

const riskLabels: Record<number, { label: string; color: string }> = {
  1: { label: '低风险', color: 'text-emerald-400 bg-emerald-400/10' },
  2: { label: '中风险', color: 'text-yellow-400 bg-yellow-400/10' },
  3: { label: '高风险', color: 'text-red-400 bg-red-400/10' },
};

export default function InvestPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null);
  const [investAmount, setInvestAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const savedToken = localStorage.getItem('mirror_token');
    if (savedToken) {
      setToken(savedToken);
    }
    
    // 加载策略列表
    loadStrategies();
  }, []);

  const loadStrategies = async () => {
    try {
      const response = await fetch(`${API_BASE}/invest/strategies`);
      if (response.ok) {
        const data = await response.json();
        setStrategies(data);
      }
    } catch (error) {
      console.error('Failed to load strategies:', error);
    }
  };

  useEffect(() => {
    if (token) {
      loadData();
    }
  }, [token]);

  const loadData = async () => {
    try {
      const [pos, sum] = await Promise.all([
        fetch(`${API_BASE}/invest/positions`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
        fetch(`${API_BASE}/invest/summary`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      ]);
      setPositions(pos);
      setSummary(sum);
    } catch {}
  };

  const handleInvest = async () => {
    if (!selectedStrategy || !investAmount) return;
    
    // 检查是否登录
    if (!token) {
      setError('请先连接钱包并登录');
      return;
    }

    // 检查是否绑定 HL
    // 从 localStorage 获取用户信息检查 hlAddress
    const savedUser = localStorage.getItem('mirror_user');
    const user = savedUser ? JSON.parse(savedUser) : null;
    if (!user?.hlAddress) {
      setError('请先绑定 Hyperliquid 钱包');
      setTimeout(() => {
        router.push('/dashboard/bind-hl');
      }, 1500);
      return;
    }

    const amount = parseFloat(investAmount);
    if (amount < 1) return setError('最低投资 1 USDT');
    if (summary && amount > parseFloat(summary.balance)) return setError('余额不足，请先入金');

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`${API_BASE}/copytrade/follow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ strategyId: selectedStrategy.id, amount }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setSuccess(`成功跟单 ${amount} USDT 到 ${selectedStrategy.name}！`);
      setSelectedStrategy(null);
      setInvestAmount('');
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (strategyId: string, amount: number) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/invest/withdraw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ strategyId, amount }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      loadData();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // 未登录
  if (!token) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen pt-24 px-4 pb-8">
          <div className="max-w-2xl mx-auto text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <TrendingUp className="text-white" size={40} />
            </div>
            <h1 className="text-3xl font-bold mb-4">一键跟单，躺赚收益</h1>
            <p className="text-[hsl(var(--muted-foreground))] mb-8">
              选择专业策略，自动复制交易，让 AI 帮你赚钱
            </p>
            
            {/* Strategies Preview */}
            <div className="grid gap-4 mb-8">
              {strategies.map(s => (
                <Card key={s.id} className="p-4 text-left">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold">{s.name}</h3>
                      <p className="text-sm text-[hsl(var(--muted-foreground))]">{s.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-emerald-400">+{s.return7d}%</p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">7日收益</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            
            <Link href="/ramp">
              <Button size="lg" className="w-full max-w-sm">
                <Wallet size={18} />
                登录并入金开始投资
                <ArrowRight size={18} />
              </Button>
            </Link>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 px-4 pb-8">
        <div className="max-w-4xl mx-auto">
          {/* Summary Card */}
          {summary && (
            <Card className="p-6 mb-6 bg-gradient-to-br from-[hsl(var(--card))] to-cyan-950/20">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">可用余额</p>
                  <p className="text-2xl font-bold">{parseFloat(summary.balance).toFixed(2)} <span className="text-sm text-[hsl(var(--muted-foreground))]">USDT</span></p>
                </div>
                <div>
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">投资中</p>
                  <p className="text-2xl font-bold">{parseFloat(summary.totalCurrent).toFixed(2)} <span className="text-sm text-[hsl(var(--muted-foreground))]">USDT</span></p>
                </div>
                <div>
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">总收益</p>
                  <p className={`text-2xl font-bold ${parseFloat(summary.totalPnl) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {parseFloat(summary.totalPnl) >= 0 ? '+' : ''}{parseFloat(summary.totalPnl).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">收益率</p>
                  <p className={`text-2xl font-bold ${parseFloat(summary.pnlPct) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {parseFloat(summary.pnlPct) >= 0 ? '+' : ''}{parseFloat(summary.pnlPct).toFixed(2)}%
                  </p>
                </div>
              </div>
              
              {parseFloat(summary.balance) < 10 && (
                <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2 text-yellow-400">
                    <AlertCircle size={16} />
                    <span className="text-sm">余额不足，先入金再投资</span>
                  </div>
                  <Link href="/ramp">
                    <Button size="sm" variant="ghost">去入金 <ChevronRight size={14} /></Button>
                  </Link>
                </div>
              )}
            </Card>
          )}

          {/* Messages */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl mb-4 text-sm flex items-center gap-2">
              <AlertCircle size={16} />
              {error}
              <button onClick={() => setError('')} className="ml-auto">✕</button>
            </div>
          )}
          {success && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-xl mb-4 text-sm flex items-center gap-2">
              <CheckCircle size={16} />
              {success}
              <button onClick={() => setSuccess('')} className="ml-auto">✕</button>
            </div>
          )}

          {/* My Positions */}
          {positions.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-4">我的持仓</h2>
              <div className="grid gap-4">
                {positions.map(p => {
                  const pnl = parseFloat(p.pnl);
                  const pnlPct = parseFloat(p.pnlPct);
                  return (
                    <Card key={p.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-bold">{p.strategyName}</h3>
                          <p className="text-sm text-[hsl(var(--muted-foreground))]">
                            投入 {parseFloat(p.invested).toFixed(2)} USDT
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold">{parseFloat(p.current).toFixed(2)} <span className="text-sm text-[hsl(var(--muted-foreground))]">USDT</span></p>
                          <p className={`text-sm ${pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)} ({pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(2)}%)
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => { setSelectedStrategy(strategies.find(s => s.id === p.strategyId) || null); }}
                          className="flex-1"
                        >
                          追加投资
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => handleWithdraw(p.strategyId, parseFloat(p.current))}
                          className="flex-1 text-red-400 hover:text-red-300"
                        >
                          全部赎回
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Strategies */}
          <div>
            <h2 className="text-xl font-bold mb-4">选择策略跟投</h2>
            <div className="grid gap-4">
              {strategies.map(s => {
                const risk = riskLabels[s.riskLevel];
                const hasPosition = positions.some(p => p.strategyId === s.id);
                return (
                  <Card 
                    key={s.id} 
                    className={`p-5 cursor-pointer transition-all ${selectedStrategy?.id === s.id ? 'ring-2 ring-cyan-500' : ''}`}
                    onClick={() => setSelectedStrategy(s)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-bold">{s.name}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${risk.color}`}>{risk.label}</span>
                          {hasPosition && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-400/10 text-cyan-400">已投资</span>
                          )}
                        </div>
                        <p className="text-sm text-[hsl(var(--muted-foreground))]">{s.description}</p>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-2xl font-bold text-emerald-400">+{s.return7d}%</p>
                        <p className="text-xs text-[hsl(var(--muted-foreground))]">7日收益</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[hsl(var(--muted-foreground))]">{s.followers} 人跟投</span>
                      <span className="text-[hsl(var(--muted-foreground))]">30日收益 <span className="text-emerald-400">+{s.return30d}%</span></span>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Invest Modal */}
          {selectedStrategy && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
              <Card className="w-full max-w-md p-6">
                <h2 className="text-xl font-bold mb-2">投资 {selectedStrategy.name}</h2>
                <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4">{selectedStrategy.description}</p>
                
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 mb-4">
                  <div className="flex justify-between">
                    <span className="text-[hsl(var(--muted-foreground))]">预期7日收益</span>
                    <span className="text-emerald-400 font-bold">+{selectedStrategy.return7d}%</span>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="text-sm text-[hsl(var(--muted-foreground))] mb-2 block">投资金额 (USDT)</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="最低 1 USDT"
                      value={investAmount}
                      onChange={e => setInvestAmount(e.target.value)}
                      className="flex-1 bg-[hsl(var(--secondary))] border border-[hsl(var(--border))] rounded-xl p-4 text-xl focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                    {summary && (
                      <button
                        onClick={() => setInvestAmount(summary.balance)}
                        className="px-4 bg-[hsl(var(--secondary))] border border-[hsl(var(--border))] rounded-xl text-cyan-400"
                      >
                        全部
                      </button>
                    )}
                  </div>
                  {summary && (
                    <p className="text-xs text-[hsl(var(--muted-foreground))] mt-2">
                      可用余额: {parseFloat(summary.balance).toFixed(2)} USDT
                    </p>
                  )}
                </div>

                <div className="flex gap-3">
                  <Button variant="ghost" onClick={() => { setSelectedStrategy(null); setInvestAmount(''); }} className="flex-1">
                    取消
                  </Button>
                  <Button onClick={handleInvest} loading={loading} className="flex-1" disabled={!investAmount || parseFloat(investAmount) < 1}>
                    确认投资
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
