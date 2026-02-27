"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TrendingUp, ArrowLeft, Wallet, AlertCircle } from 'lucide-react';
import { getToken } from '@/lib/auth';
import { toast } from 'sonner';

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

export default function StrategyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const strategyId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [longtouData, setLongtouData] = useState<LongtouData | null>(null);
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (strategyId === 'longtou') {
      loadLongtouPositions();
    } else {
      setLoading(false);
    }
  }, [strategyId]);

  const loadLongtouPositions = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/strategy/longtou/positions`);
      if (response.ok) {
        const data = await response.json();
        setLongtouData(data);
      }
    } catch (error) {
      console.error('Failed to load positions:', error);
      toast.error('加载仓位失败');
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    const token = getToken();
    if (!token) {
      toast.error('请先连接钱包并登录');
      return;
    }

    const investAmount = parseFloat(amount);
    if (!investAmount || investAmount <= 0) {
      toast.error('请输入有效的投资金额');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/copytrade/follow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          strategyId: 'longtou',
          amount: investAmount,
        }),
      });

      if (response.ok) {
        toast.success('跟单成功！');
        router.push('/dashboard');
      } else {
        const error = await response.json();
        toast.error(error.error || '跟单失败');
      }
    } catch (error) {
      console.error('Follow error:', error);
      toast.error('跟单失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#040405]">
        <Navbar />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-[hsl(var(--muted-foreground))]">加载中...</p>
          </div>
        </div>
      </div>
    );
  }

  if (strategyId !== 'longtou') {
    return (
      <div className="min-h-screen bg-[#040405]">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-12">
          <Button variant="ghost" onClick={() => router.back()} className="mb-4">
            <ArrowLeft size={16} className="mr-2" />
            返回
          </Button>
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-[hsl(var(--muted-foreground))]">策略详情页开发中...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const totalPnl = longtouData?.positions.reduce((sum, p) => sum + p.pnl, 0) || 0;
  const totalPnlPct = longtouData && longtouData.totalValue > 0 
    ? (totalPnl / longtouData.totalValue) * 100 
    : 0;

  return (
    <div className="min-h-screen bg-[#040405]">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-12">
        {/* Header */}
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft size={16} className="mr-2" />
          返回
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">龙头多头策略</h1>
          <p className="text-[hsl(var(--muted-foreground))]">
            基金经理金明主理，实时跟单 Hyperliquid 仓位
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Positions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-[hsl(var(--muted-foreground))]">
                    账户权益
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xl font-bold">${longtouData?.accountValue.toFixed(2)}</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-[hsl(var(--muted-foreground))]">
                    持仓价值
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xl font-bold">${longtouData?.totalValue.toFixed(2)}</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-[hsl(var(--muted-foreground))]">
                    已用保证金
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xl font-bold">${longtouData?.marginUsed.toFixed(2)}</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-[hsl(var(--muted-foreground))]">
                    总盈亏
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className={`text-xl font-bold ${totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(2)}
                  </p>
                  <p className={`text-xs ${totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {totalPnl >= 0 ? '+' : ''}{totalPnlPct.toFixed(2)}%
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Positions */}
            <Card>
              <CardHeader>
                <CardTitle>当前仓位</CardTitle>
                <CardDescription>
                  金明老师的 Hyperliquid 实时仓位
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!longtouData || longtouData.positions.length === 0 ? (
                  <div className="text-center py-12">
                    <Wallet size={48} className="mx-auto mb-4 text-[hsl(var(--muted-foreground))]" />
                    <p className="text-[hsl(var(--muted-foreground))]">暂无持仓</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {longtouData.positions.map((pos, idx) => (
                      <Card key={idx} className="bg-[hsl(var(--secondary))]">
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <h3 className="text-lg font-bold">{pos.coin}</h3>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                pos.direction === 'LONG' 
                                  ? 'bg-emerald-500/20 text-emerald-400' 
                                  : 'bg-red-500/20 text-red-400'
                              }`}>
                                {pos.direction}
                              </span>
                            </div>
                            <div className="text-right">
                              <p className={`text-lg font-bold ${pos.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {pos.pnl >= 0 ? '+' : ''}${pos.pnl.toFixed(2)}
                              </p>
                              <p className={`text-sm ${pos.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {pos.pnl >= 0 ? '+' : ''}{pos.pnlPct.toFixed(2)}%
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-[hsl(var(--muted-foreground))] mb-1">持仓量</p>
                              <p className="font-medium">{pos.size.toFixed(4)}</p>
                            </div>
                            <div>
                              <p className="text-[hsl(var(--muted-foreground))] mb-1">开仓价</p>
                              <p className="font-medium">${pos.entryPrice.toFixed(2)}</p>
                            </div>
                            <div>
                              <p className="text-[hsl(var(--muted-foreground))] mb-1">当前价</p>
                              <p className="font-medium">${pos.currentPrice.toFixed(2)}</p>
                            </div>
                            <div>
                              <p className="text-[hsl(var(--muted-foreground))] mb-1">持仓价值</p>
                              <p className="font-medium">${pos.value.toFixed(2)}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Follow Form */}
          <div>
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>跟单设置</CardTitle>
                <CardDescription>
                  按比例跟单金明老师的仓位
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="amount">投入金额 (USDT)</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="100"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="mt-2"
                  />
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mt-2">
                    最低投资 1 USDT
                  </p>
                </div>

                <div className="p-3 bg-[hsl(var(--secondary))] rounded-lg space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[hsl(var(--muted-foreground))]">策略总仓位</span>
                    <span className="font-medium">${longtouData?.totalValue.toFixed(2)}</span>
                  </div>
                  {amount && parseFloat(amount) > 0 && longtouData && longtouData.totalValue > 0 && (
                    <div className="flex justify-between">
                      <span className="text-[hsl(var(--muted-foreground))]">跟单比例</span>
                      <span className="font-medium">
                        {((parseFloat(amount) / longtouData.totalValue) * 100).toFixed(4)}%
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <AlertCircle size={16} className="text-yellow-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-yellow-400">
                    跟单将按比例复制策略仓位，盈亏与策略保持一致
                  </p>
                </div>

                <Button 
                  onClick={handleFollow} 
                  loading={submitting}
                  className="w-full"
                  size="lg"
                >
                  <TrendingUp size={16} className="mr-2" />
                  确认跟单
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
