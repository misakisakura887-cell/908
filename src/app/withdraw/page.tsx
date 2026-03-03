"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { getToken, getCurrentUser, setUser as saveUser } from '@/lib/auth';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const NETWORKS = [
  { id: 'arbitrum', name: 'Arbitrum One', icon: '🔵', fee: '1 USDT', time: '~5分钟' },
  { id: 'bsc', name: 'BNB Chain', icon: '🟡', fee: '0.5 USDT', time: '~3分钟' },
];

interface WithdrawRecord {
  id: string;
  network: string;
  amount: string;
  toAddress: string;
  status: string;
  createdAt: string;
  txHash?: string;
}

export default function WithdrawPage() {
  const router = useRouter();
  const [balance, setBalance] = useState(0);
  const [network, setNetwork] = useState(NETWORKS[0]);
  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [records, setRecords] = useState<WithdrawRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const token = getToken();

  useEffect(() => {
    if (!token) { router.push('/'); return; }
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = await getCurrentUser();
      saveUser(user);
      setBalance(parseFloat(user.usdtBalance));
      // 加载提现记录
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/withdraw/history`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) setRecords(await res.json());
    } catch (err) {
      console.error(err);
    } finally { setLoading(false); }
  };

  const fee = network.id === 'arbitrum' ? 1 : 0.5;
  const receiveAmount = Math.max(0, parseFloat(amount || '0') - fee);

  const handleWithdraw = async () => {
    if (!toAddress || !toAddress.startsWith('0x') || toAddress.length !== 42) {
      toast.error('请输入有效的钱包地址'); return;
    }
    const amt = parseFloat(amount);
    if (!amt || amt <= fee) {
      toast.error(`提现金额需大于手续费 ${fee} USDT`); return;
    }
    if (amt > balance) {
      toast.error('余额不足'); return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/withdraw/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ network: network.id, toAddress, amount: amt }),
      });
      if (res.ok) {
        toast.success('提现申请已提交');
        setAmount('');
        setToAddress('');
        loadData();
      } else {
        const err = await res.json();
        toast.error(err.error || '提现失败');
      }
    } catch { toast.error('提现失败'); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="min-h-screen bg-[#040405]">
      <Navbar />
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto px-4 sm:px-6 pt-24 pb-12"
      >
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft size={16} className="mr-2" /> 返回
        </Button>

        <h1 className="text-2xl font-bold mb-6">提现</h1>

        {/* Balance */}
        <Card className="mb-6 bg-gradient-to-r from-cyan-500/10 to-transparent border-cyan-500/20">
          <CardContent className="pt-4 pb-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">可用余额</p>
              <p className="text-2xl font-bold">${balance.toFixed(2)} <span className="text-sm text-[hsl(var(--muted-foreground))]">USDT</span></p>
            </div>
          </CardContent>
        </Card>

        {/* Network */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">选择网络</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {NETWORKS.map((net) => (
                <button
                  key={net.id}
                  onClick={() => setNetwork(net)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    network.id === net.id ? 'border-cyan-500 bg-cyan-500/10' : 'border-[hsl(var(--border))] hover:border-cyan-500/50'
                  }`}
                >
                  <span className="text-lg mr-2">{net.icon}</span>
                  <span className="font-medium text-sm">{net.name}</span>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">手续费: {net.fee} · {net.time}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Form */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">提现信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs">收款地址</Label>
              <Input
                placeholder="0x..."
                value={toAddress}
                onChange={(e) => setToAddress(e.target.value)}
                className="mt-1 font-mono"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label className="text-xs">提现金额 (USDT)</Label>
                <button onClick={() => setAmount(String(balance))} className="text-xs text-cyan-400 hover:underline">全部提现</button>
              </div>
              <Input
                type="number"
                placeholder="100"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-1"
              />
            </div>

            {amount && parseFloat(amount) > 0 && (
              <div className="p-3 bg-[hsl(var(--secondary))]/50 rounded-lg text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-[hsl(var(--muted-foreground))]">提现金额</span>
                  <span>{amount} USDT</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[hsl(var(--muted-foreground))]">手续费</span>
                  <span className="text-yellow-400">-{fee} USDT</span>
                </div>
                <div className="flex justify-between border-t border-[hsl(var(--border))]/30 pt-1.5">
                  <span className="text-[hsl(var(--muted-foreground))]">实际到账</span>
                  <span className="font-medium text-emerald-400">{receiveAmount.toFixed(2)} USDT</span>
                </div>
              </div>
            )}

            <div className="flex items-start gap-2 p-2.5 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <AlertCircle size={14} className="text-yellow-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-yellow-400/80">提现将在审核后自动转账到您的钱包地址，通常 5-30 分钟到账</p>
            </div>

            <Button
              onClick={handleWithdraw}
              disabled={submitting || !amount || parseFloat(amount) <= fee || parseFloat(amount) > balance || !toAddress}
              className="w-full"
              size="lg"
            >
              {submitting ? '提交中...' : '确认提现'}
            </Button>
          </CardContent>
        </Card>

        {/* Records */}
        {records.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">提现记录</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {records.map((r) => (
                  <div key={r.id} className="flex items-center justify-between p-3 bg-[hsl(var(--secondary))]/30 rounded-lg text-sm">
                    <div>
                      <p className="font-medium">{r.amount} USDT</p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))] font-mono">{r.toAddress.slice(0, 8)}...{r.toAddress.slice(-6)}</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        r.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-400' :
                        r.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {r.status === 'COMPLETED' ? '已完成' : r.status === 'PENDING' ? '审核中' : '失败'}
                      </span>
                      <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                        {new Date(r.createdAt).toLocaleDateString('zh-CN')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </div>
  );
}
