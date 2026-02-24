"use client";

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/navbar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Wallet, Clock, CheckCircle, XCircle, AlertCircle, TrendingUp, Shield, Zap, Gift, ArrowDownUp } from 'lucide-react';
import Link from 'next/link';

import { API_BASE } from '@/lib/config';

interface PriceData {
  buyPrice: string;
  sellPrice: string;
}

interface User {
  id: string;
  email: string;
  usdtBalance: string;
}

const statusMap: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  PENDING: { label: '待支付', icon: <Clock size={16} />, color: 'text-yellow-400' },
  PAID: { label: '待确认', icon: <AlertCircle size={16} />, color: 'text-blue-400' },
  PROCESSING: { label: '处理中', icon: <Clock size={16} />, color: 'text-blue-400' },
  COMPLETED: { label: '已完成', icon: <CheckCircle size={16} />, color: 'text-emerald-400' },
  CANCELLED: { label: '已取消', icon: <XCircle size={16} />, color: 'text-gray-400' },
  TIMEOUT: { label: '已超时', icon: <XCircle size={16} />, color: 'text-gray-400' },
  REJECTED: { label: '已拒绝', icon: <XCircle size={16} />, color: 'text-red-400' },
};

export default function RampPage() {
  const [tab, setTab] = useState<'deposit' | 'withdraw' | 'orders'>('deposit');
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [price, setPrice] = useState<PriceData | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  
  // Auth
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [authStep, setAuthStep] = useState<'email' | 'code'>('email');
  const [countdown, setCountdown] = useState(0);
  
  // Deposit
  const [depositAmount, setDepositAmount] = useState('');
  const [depositMethod, setDepositMethod] = useState<'WECHAT' | 'ALIPAY'>('WECHAT');
  const [depositOrder, setDepositOrder] = useState<any>(null);
  
  // Withdraw
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState<'WECHAT' | 'ALIPAY'>('ALIPAY');
  const [withdrawAccount, setWithdrawAccount] = useState('');
  const [withdrawName, setWithdrawName] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('mirror-ramp-auth');
    if (saved) {
      try {
        const { token, user } = JSON.parse(saved);
        setToken(token);
        setUser(user);
      } catch {}
    }
  }, []);

  useEffect(() => {
    fetch(`${API_BASE}/ramp/price`).then(r => r.json()).then(setPrice).catch(() => {});
  }, []);

  useEffect(() => {
    if (token) {
      fetch(`${API_BASE}/ramp/orders`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json()).then(setOrders).catch(() => {});
    }
  }, [token, depositOrder]);

  const api = async (path: string, options?: RequestInit) => {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options?.headers,
      },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '请求失败');
    return data;
  };

  const sendCode = async () => {
    if (!email) return setError('请输入邮箱');
    setLoading(true);
    setError('');
    try {
      await api('/auth/send-code', { method: 'POST', body: JSON.stringify({ email }) });
      setAuthStep('code');
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown(c => { if (c <= 1) clearInterval(timer); return c - 1; });
      }, 1000);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  const verifyCode = async () => {
    if (!code || code.length !== 6) return setError('请输入6位验证码');
    setLoading(true);
    setError('');
    try {
      const data = await api('/auth/verify', { method: 'POST', body: JSON.stringify({ email, code }) });
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('mirror-ramp-auth', JSON.stringify({ token: data.token, user: data.user }));
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  const logout = () => {
    setToken(null); setUser(null);
    localStorage.removeItem('mirror-ramp-auth');
    setAuthStep('email'); setEmail(''); setCode('');
  };

  const createDeposit = async () => {
    const amount = parseFloat(depositAmount);
    if (amount < 10) return setError('最低入金 10 元');
    if (amount > 50000) return setError('单笔最高 50,000 元');
    setLoading(true);
    setError('');
    try {
      const data = await api('/ramp/deposit', {
        method: 'POST',
        body: JSON.stringify({ cnyAmount: amount, paymentMethod: depositMethod }),
      });
      setDepositOrder(data);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  const markPaid = async () => {
    setLoading(true);
    try {
      await api(`/ramp/deposit/${depositOrder.id}/paid`, { method: 'POST' });
      setDepositOrder({ ...depositOrder, status: 'PAID' });
      const me = await api('/auth/me');
      setUser(me);
      localStorage.setItem('mirror-ramp-auth', JSON.stringify({ token, user: me }));
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  const createWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    const balance = parseFloat(user?.usdtBalance || '0');
    if (amount < 10) return setError('最低出金 10 USDT');
    if (amount > balance) return setError('余额不足');
    if (!withdrawAccount) return setError('请输入收款账号');
    if (!withdrawName) return setError('请输入姓名');
    setLoading(true);
    setError('');
    try {
      await api('/ramp/withdraw', {
        method: 'POST',
        body: JSON.stringify({
          usdtAmount: amount,
          paymentMethod: withdrawMethod,
          paymentInfo: { account: withdrawAccount, name: withdrawName },
        }),
      });
      const me = await api('/auth/me');
      setUser(me);
      localStorage.setItem('mirror-ramp-auth', JSON.stringify({ token, user: me }));
      setWithdrawAmount(''); setWithdrawAccount(''); setWithdrawName('');
      setTab('orders');
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  const cnyAmount = parseFloat(depositAmount) || 0;
  const usdtFromDeposit = price ? cnyAmount / parseFloat(price.buyPrice) * 0.995 : 0;
  const usdtToWithdraw = parseFloat(withdrawAmount) || 0;
  const cnyFromWithdraw = price ? usdtToWithdraw * 0.995 * parseFloat(price.sellPrice) : 0;

  // ========== 未登录：展示引导页 ==========
  if (!token) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen pt-20">
          {/* Hero */}
          <section className="relative py-16 px-4 overflow-hidden">
            <div className="absolute inset-0 -z-10">
              <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px]" />
              <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px]" />
            </div>
            
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-sm">
                <Gift size={16} />
                新用户 10 元起投，立即体验 AI 量化收益
              </div>
              
              <h1 className="text-4xl sm:text-5xl font-bold mb-6">
                <span className="text-white">3 步开启</span>
                <span className="gradient-text"> AI 智能投资</span>
              </h1>
              
              <p className="text-lg text-[hsl(var(--muted-foreground))] mb-12 max-w-2xl mx-auto">
                无需复杂操作，微信/支付宝扫码入金，一键跟投专业策略
              </p>
              
              {/* 3 Steps */}
              <div className="grid md:grid-cols-3 gap-6 mb-12">
                <div className="relative">
                  <div className="absolute -top-3 -left-3 w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">1</div>
                  <Card className="p-6 h-full">
                    <div className="w-12 h-12 bg-cyan-500/10 rounded-xl flex items-center justify-center mb-4 mx-auto">
                      <Wallet className="text-cyan-400" size={24} />
                    </div>
                    <h3 className="font-bold mb-2">邮箱注册</h3>
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">输入邮箱，获取验证码，30秒完成注册</p>
                  </Card>
                </div>
                
                <div className="relative">
                  <div className="absolute -top-3 -left-3 w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">2</div>
                  <Card className="p-6 h-full">
                    <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-4 mx-auto">
                      <ArrowDownUp className="text-emerald-400" size={24} />
                    </div>
                    <h3 className="font-bold mb-2">扫码入金</h3>
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">微信/支付宝扫码支付，最低 10 元起</p>
                  </Card>
                </div>
                
                <div className="relative">
                  <div className="absolute -top-3 -left-3 w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">3</div>
                  <Card className="p-6 h-full">
                    <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mb-4 mx-auto">
                      <TrendingUp className="text-purple-400" size={24} />
                    </div>
                    <h3 className="font-bold mb-2">一键跟单</h3>
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">选择策略，自动跟投，坐等收益</p>
                  </Card>
                </div>
              </div>
            </div>
          </section>

          {/* Login Card */}
          <section className="px-4 pb-16">
            <div className="max-w-md mx-auto">
              <Card className="p-8">
                <h2 className="text-xl font-bold text-center mb-6">开始投资</h2>
                
                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl mb-4 text-sm">
                    {error}
                  </div>
                )}

                {authStep === 'email' ? (
                  <>
                    <div className="mb-4">
                      <label className="text-sm text-[hsl(var(--muted-foreground))] mb-2 block">邮箱地址</label>
                      <input
                        type="email"
                        placeholder="请输入您的邮箱"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="w-full bg-[hsl(var(--secondary))] border border-[hsl(var(--border))] rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>
                    <Button onClick={sendCode} loading={loading} className="w-full" size="lg">
                      获取验证码
                      <ArrowRight size={18} />
                    </Button>
                    <p className="text-xs text-center text-[hsl(var(--muted-foreground))] mt-4">
                      首次登录将自动创建账户
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4 text-center">
                      验证码已发送至 <span className="text-white">{email}</span>
                    </p>
                    <input
                      type="text"
                      placeholder="输入 6 位验证码"
                      value={code}
                      onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="w-full bg-[hsl(var(--secondary))] border border-[hsl(var(--border))] rounded-xl p-4 mb-4 text-center text-2xl tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      maxLength={6}
                    />
                    <Button onClick={verifyCode} loading={loading} className="w-full" size="lg">
                      登录
                    </Button>
                    <button
                      onClick={sendCode}
                      disabled={countdown > 0 || loading}
                      className="w-full mt-3 text-cyan-400 text-sm disabled:text-gray-500"
                    >
                      {countdown > 0 ? `${countdown}秒后重新发送` : '重新发送验证码'}
                    </button>
                  </>
                )}
              </Card>
              
              {/* Trust badges */}
              <div className="flex items-center justify-center gap-6 mt-8 text-xs text-[hsl(var(--muted-foreground))]">
                <div className="flex items-center gap-1">
                  <Shield size={14} className="text-emerald-400" />
                  资金安全
                </div>
                <div className="flex items-center gap-1">
                  <Zap size={14} className="text-cyan-400" />
                  极速到账
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp size={14} className="text-purple-400" />
                  专业策略
                </div>
              </div>
            </div>
          </section>
        </main>
      </>
    );
  }

  // ========== 已登录：入金/出金/订单 ==========
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 px-4 pb-8">
        <div className="max-w-lg mx-auto">
          {/* User Card */}
          <Card className="p-5 mb-6 bg-gradient-to-br from-[hsl(var(--card))] to-cyan-950/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">我的资产</p>
                <p className="text-3xl font-bold text-white mt-1">
                  {parseFloat(user?.usdtBalance || '0').toFixed(2)}
                  <span className="text-lg text-[hsl(var(--muted-foreground))] ml-1">USDT</span>
                </p>
                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                  ≈ ¥{price ? (parseFloat(user?.usdtBalance || '0') * parseFloat(price.sellPrice)).toFixed(2) : '0.00'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-[hsl(var(--muted-foreground))]">{user?.email}</p>
                <button onClick={logout} className="text-xs text-red-400 hover:text-red-300 mt-1">退出登录</button>
              </div>
            </div>
            
            {/* Quick Actions */}
            <div className="flex gap-3 mt-4">
              <Link href="/strategies" className="flex-1">
                <Button variant="secondary" size="sm" className="w-full">
                  <TrendingUp size={16} />
                  跟单赚钱
                </Button>
              </Link>
              <Link href="/dashboard" className="flex-1">
                <Button variant="ghost" size="sm" className="w-full">
                  查看收益
                </Button>
              </Link>
            </div>
          </Card>

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            {[
              { key: 'deposit', label: '💰 入金', desc: '充值' },
              { key: 'withdraw', label: '💸 出金', desc: '提现' },
              { key: 'orders', label: '📋 记录', desc: '订单' },
            ].map(t => (
              <button
                key={t.key}
                onClick={() => { setTab(t.key as any); setDepositOrder(null); setError(''); }}
                className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                  tab === t.key
                    ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 border border-cyan-500/30'
                    : 'bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))] hover:text-white border border-transparent'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl mb-4 text-sm flex items-center gap-2">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {/* ===== DEPOSIT TAB ===== */}
          {tab === 'deposit' && !depositOrder && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold">充值 USDT</h2>
                {price && (
                  <span className="text-xs text-[hsl(var(--muted-foreground))]">
                    汇率 1 USDT ≈ ¥{parseFloat(price.buyPrice).toFixed(2)}
                  </span>
                )}
              </div>
              
              {/* Amount Input */}
              <div className="mb-4">
                <label className="text-sm text-[hsl(var(--muted-foreground))] mb-2 block">充值金额（人民币）</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-[hsl(var(--muted-foreground))]">¥</span>
                  <input
                    type="number"
                    placeholder="10"
                    value={depositAmount}
                    onChange={e => setDepositAmount(e.target.value)}
                    className="w-full bg-[hsl(var(--secondary))] border border-[hsl(var(--border))] rounded-xl p-4 pl-12 text-2xl focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>

              {/* Quick Amounts */}
              <div className="flex gap-2 mb-6">
                {[10, 50, 100, 500, 1000].map(v => (
                  <button
                    key={v}
                    onClick={() => setDepositAmount(v.toString())}
                    className={`flex-1 py-2 rounded-lg text-sm transition-all ${
                      depositAmount === v.toString()
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                        : 'bg-[hsl(var(--secondary))] border border-[hsl(var(--border))] hover:border-cyan-500/30'
                    }`}
                  >
                    {v < 1000 ? `¥${v}` : '¥1k'}
                  </button>
                ))}
              </div>

              {/* Preview */}
              {cnyAmount >= 10 && price && (
                <div className="bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 rounded-xl p-4 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-[hsl(var(--muted-foreground))]">预计到账</span>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-emerald-400">{usdtFromDeposit.toFixed(2)}</span>
                      <span className="text-emerald-400 ml-1">USDT</span>
                    </div>
                  </div>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mt-2">
                    包含 0.5% 手续费 · 5-30分钟到账
                  </p>
                </div>
              )}

              {/* Payment Method */}
              <div className="mb-6">
                <label className="text-sm text-[hsl(var(--muted-foreground))] mb-2 block">支付方式</label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setDepositMethod('WECHAT')}
                    className={`flex-1 p-4 rounded-xl border-2 transition-all flex items-center justify-center gap-2 ${
                      depositMethod === 'WECHAT'
                        ? 'border-green-500 bg-green-500/10'
                        : 'border-[hsl(var(--border))] hover:border-green-500/50'
                    }`}
                  >
                    <span className="text-2xl">💚</span>
                    <span>微信支付</span>
                  </button>
                  <button
                    onClick={() => setDepositMethod('ALIPAY')}
                    className={`flex-1 p-4 rounded-xl border-2 transition-all flex items-center justify-center gap-2 ${
                      depositMethod === 'ALIPAY'
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-[hsl(var(--border))] hover:border-blue-500/50'
                    }`}
                  >
                    <span className="text-2xl">💙</span>
                    <span>支付宝</span>
                  </button>
                </div>
              </div>

              <Button onClick={createDeposit} loading={loading} className="w-full" size="lg" disabled={cnyAmount < 10}>
                {cnyAmount < 10 ? '最低充值 10 元' : `确认充值 ¥${cnyAmount}`}
              </Button>
            </Card>
          )}

          {/* Deposit Order */}
          {tab === 'deposit' && depositOrder && (
            <Card className="p-6">
              <div className="text-center mb-6">
                {depositOrder.status === 'PAID' ? (
                  <>
                    <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Clock className="text-blue-400" size={32} />
                    </div>
                    <h2 className="text-xl font-bold">等待确认中</h2>
                    <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
                      工作人员正在核实您的付款，请稍候
                    </p>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <ArrowDownUp className="text-emerald-400" size={32} />
                    </div>
                    <h2 className="text-xl font-bold">请完成支付</h2>
                  </>
                )}
              </div>
              
              <div className="bg-[hsl(var(--secondary))] rounded-xl p-4 mb-4">
                <div className="flex justify-between mb-2">
                  <span className="text-[hsl(var(--muted-foreground))]">订单号</span>
                  <span className="font-mono">{depositOrder.orderNo}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-[hsl(var(--muted-foreground))]">支付金额</span>
                  <span className="text-xl font-bold">¥{parseFloat(depositOrder.cnyAmount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[hsl(var(--muted-foreground))]">预计到账</span>
                  <span className="text-emerald-400 font-bold">{parseFloat(depositOrder.usdtAmount).toFixed(2)} USDT</span>
                </div>
              </div>

              {depositOrder.status === 'PENDING' && (
                <>
                  <div className="text-center mb-6">
                    <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4">
                      使用{depositMethod === 'WECHAT' ? '微信' : '支付宝'}扫描下方二维码完成支付
                    </p>
                    <img
                      src={`${API_BASE.replace("/api", "/public/qrcodes/")}${depositMethod === 'WECHAT' ? 'wechat' : 'alipay'}.jpg`}
                      alt="收款码"
                      className="w-52 h-52 mx-auto rounded-xl border border-[hsl(var(--border))]"
                    />
                    <p className="text-xs text-yellow-400 mt-3 bg-yellow-400/10 p-2 rounded-lg">
                      ⚠️ 支付时请备注：{depositOrder.orderNo}
                    </p>
                  </div>
                  <Button onClick={markPaid} loading={loading} className="w-full" size="lg" variant="success">
                    <CheckCircle size={18} />
                    我已完成支付
                  </Button>
                </>
              )}

              {depositOrder.status === 'PAID' && (
                <div className="text-center py-4">
                  <div className="flex items-center justify-center gap-2 text-sm text-[hsl(var(--muted-foreground))]">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                    通常 5-30 分钟内完成
                  </div>
                </div>
              )}

              <button
                onClick={() => setDepositOrder(null)}
                className="w-full mt-4 text-[hsl(var(--muted-foreground))] text-sm hover:text-white"
              >
                ← 返回
              </button>
            </Card>
          )}

          {/* ===== WITHDRAW TAB ===== */}
          {tab === 'withdraw' && (
            <Card className="p-6">
              <h2 className="text-lg font-bold mb-4">提现到微信/支付宝</h2>
              
              <div className="bg-[hsl(var(--secondary))] rounded-xl p-4 mb-4">
                <p className="text-sm text-[hsl(var(--muted-foreground))]">可提现余额</p>
                <p className="text-2xl font-bold text-white">
                  {parseFloat(user?.usdtBalance || '0').toFixed(2)} USDT
                </p>
              </div>

              <div className="mb-4">
                <label className="text-sm text-[hsl(var(--muted-foreground))] mb-2 block">提现数量 (USDT)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="最低 10"
                    value={withdrawAmount}
                    onChange={e => setWithdrawAmount(e.target.value)}
                    className="flex-1 bg-[hsl(var(--secondary))] border border-[hsl(var(--border))] rounded-xl p-4 text-xl focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                  <button
                    onClick={() => setWithdrawAmount(user?.usdtBalance || '0')}
                    className="px-4 bg-[hsl(var(--secondary))] border border-[hsl(var(--border))] rounded-xl text-cyan-400 hover:bg-cyan-500/10"
                  >
                    全部
                  </button>
                </div>
              </div>

              {usdtToWithdraw >= 10 && price && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 mb-4">
                  <div className="flex justify-between">
                    <span className="text-[hsl(var(--muted-foreground))]">预计到账</span>
                    <span className="text-xl font-bold text-emerald-400">¥{cnyFromWithdraw.toFixed(2)}</span>
                  </div>
                </div>
              )}

              <div className="mb-4">
                <label className="text-sm text-[hsl(var(--muted-foreground))] mb-2 block">收款方式</label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setWithdrawMethod('ALIPAY')}
                    className={`flex-1 p-3 rounded-xl border-2 ${
                      withdrawMethod === 'ALIPAY' ? 'border-blue-500 bg-blue-500/10' : 'border-[hsl(var(--border))]'
                    }`}
                  >
                    💙 支付宝
                  </button>
                  <button
                    onClick={() => setWithdrawMethod('WECHAT')}
                    className={`flex-1 p-3 rounded-xl border-2 ${
                      withdrawMethod === 'WECHAT' ? 'border-green-500 bg-green-500/10' : 'border-[hsl(var(--border))]'
                    }`}
                  >
                    💚 微信
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <label className="text-sm text-[hsl(var(--muted-foreground))] mb-2 block">
                  {withdrawMethod === 'ALIPAY' ? '支付宝账号' : '微信号'}
                </label>
                <input
                  type="text"
                  placeholder="手机号或账号"
                  value={withdrawAccount}
                  onChange={e => setWithdrawAccount(e.target.value)}
                  className="w-full bg-[hsl(var(--secondary))] border border-[hsl(var(--border))] rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div className="mb-6">
                <label className="text-sm text-[hsl(var(--muted-foreground))] mb-2 block">真实姓名</label>
                <input
                  type="text"
                  placeholder="用于核对收款人"
                  value={withdrawName}
                  onChange={e => setWithdrawName(e.target.value)}
                  className="w-full bg-[hsl(var(--secondary))] border border-[hsl(var(--border))] rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <Button 
                onClick={createWithdraw} 
                loading={loading} 
                className="w-full" 
                size="lg"
                disabled={usdtToWithdraw < 10 || usdtToWithdraw > parseFloat(user?.usdtBalance || '0')}
              >
                确认提现
              </Button>
            </Card>
          )}

          {/* ===== ORDERS TAB ===== */}
          {tab === 'orders' && (
            <Card className="p-6">
              <h2 className="text-lg font-bold mb-4">交易记录</h2>
              
              {orders.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-[hsl(var(--secondary))] rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock className="text-[hsl(var(--muted-foreground))]" size={24} />
                  </div>
                  <p className="text-[hsl(var(--muted-foreground))]">暂无交易记录</p>
                  <Button variant="ghost" size="sm" className="mt-4" onClick={() => setTab('deposit')}>
                    去充值
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {orders.map(order => {
                    const status = statusMap[order.status] || { label: order.status, icon: null, color: '' };
                    return (
                      <div key={order.id} className="bg-[hsl(var(--secondary))] rounded-xl p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                              status.color
                            } ${status.color.replace('text-', 'bg-')}/10`}>
                              {status.icon}
                              {status.label}
                            </span>
                            <span className="text-xs text-[hsl(var(--muted-foreground))]">
                              {order.type === 'DEPOSIT' ? '充值' : '提现'}
                            </span>
                          </div>
                          <span className="text-xs text-[hsl(var(--muted-foreground))] font-mono">{order.orderNo}</span>
                        </div>
                        <div className="flex justify-between items-end">
                          <span className="text-lg font-bold">
                            {order.type === 'DEPOSIT' 
                              ? `¥${parseFloat(order.cnyAmount).toFixed(2)}`
                              : `${parseFloat(order.usdtAmount).toFixed(2)} USDT`
                            }
                          </span>
                          <span className="text-emerald-400">
                            → {order.type === 'DEPOSIT'
                              ? `${parseFloat(order.usdtAmount).toFixed(2)} USDT`
                              : `¥${parseFloat(order.cnyAmount).toFixed(2)}`
                            }
                          </span>
                        </div>
                        <p className="text-xs text-[hsl(var(--muted-foreground))] mt-2">
                          {new Date(order.createdAt).toLocaleString('zh-CN')}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          )}
        </div>
      </main>
    </>
  );
}
