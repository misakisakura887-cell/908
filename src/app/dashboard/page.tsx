"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getToken, getCurrentUser, getCopyPositions } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, Wallet, History, Link as LinkIcon, AlertCircle } from 'lucide-react';
import { Navbar } from '@/components/layout/navbar';
import { toast } from 'sonner';

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
  positions: Array<{
    coin: string;
    direction: string;
    size: number;
    entryPrice: number;
    currentPrice: number;
    pnl: number;
    pnlPct: number;
    value: number;
  }>;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [positions, setPositions] = useState<CopyTradePosition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push('/');
      return;
    }

    loadData();
  }, [router]);

  const loadData = async () => {
    try {
      // 获取当前用户信息
      const userData = await getCurrentUser();
      setUser(userData);

      // 加载跟单仓位
      const positionsData = await getCopyPositions();
      setPositions(positionsData);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('加载数据失败');
    } finally {
      setLoading(false);
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

  const totalInvested = positions.reduce((sum, p) => sum + parseFloat(p.invested), 0);
  const totalCurrent = positions.reduce((sum, p) => sum + parseFloat(p.current), 0);
  const totalPnl = totalCurrent - totalInvested;
  const totalPnlPct = totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0;

  return (
    <div className="min-h-screen bg-[#040405]">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">我的面板</h1>
          <p className="text-[hsl(var(--muted-foreground))]">
            欢迎回来，{user?.walletAddress?.slice(0, 6)}...{user?.walletAddress?.slice(-4)}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-[hsl(var(--muted-foreground))]">
                <Wallet className="inline mr-2" size={16} />
                账户余额
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${parseFloat(user?.usdtBalance || '0').toFixed(2)}</div>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">USDT</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-[hsl(var(--muted-foreground))]">
                <TrendingUp className="inline mr-2" size={16} />
                投资中
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalInvested.toFixed(2)}</div>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                {positions.length} 个策略
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-[hsl(var(--muted-foreground))]">
                <History className="inline mr-2" size={16} />
                总盈亏
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {totalPnl >= 0 ? '+' : ''}{totalPnl.toFixed(2)} USDT
              </div>
              <p className={`text-xs mt-1 ${totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {totalPnl >= 0 ? '+' : ''}{totalPnlPct.toFixed(2)}%
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 未绑定 HL 提示 */}
        {!user?.hlAddress && (
          <Card className="mb-8 border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-transparent">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-cyan-500/20 rounded-xl">
                  <LinkIcon size={24} className="text-cyan-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold mb-1">绑定 Hyperliquid 钱包</h3>
                  <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4">
                    绑定您的 Hyperliquid 钱包以启用自动跟单功能，实时复制专业交易员的仓位。
                  </p>
                  <div className="flex items-center gap-3">
                    <Button onClick={() => router.push('/dashboard/bind-hl')} size="sm">
                      立即绑定
                    </Button>
                    <span className="text-xs text-[hsl(var(--muted-foreground))]">
                      ✓ 安全加密存储 ✓ 仅用于跟单交易
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 已绑定 HL 提示 */}
        {user?.hlAddress && (
          <Card className="mb-8 border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-transparent">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <div>
                    <p className="text-sm font-medium">Hyperliquid 钱包已绑定</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                      {user.hlAddress.slice(0, 6)}...{user.hlAddress.slice(-4)}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/bind-hl')}>
                  更换钱包
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Positions */}
        <Card>
          <CardHeader>
            <CardTitle>跟单仓位</CardTitle>
            <CardDescription>
              您当前的跟单策略和仓位
            </CardDescription>
          </CardHeader>
          <CardContent>
            {positions.length === 0 ? (
              <div className="text-center py-12">
                <TrendingUp size={48} className="mx-auto mb-4 text-[hsl(var(--muted-foreground))]" />
                <p className="text-[hsl(var(--muted-foreground))] mb-4">暂无跟单仓位</p>
                <Button onClick={() => router.push('/invest')}>
                  开始投资
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {positions.map((position) => (
                  <Card key={position.id} className="bg-[hsl(var(--secondary))]">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">
                          {position.strategyId === 'longtou' ? '龙头多头策略' : position.strategyId}
                        </CardTitle>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          position.status === 'active' 
                            ? 'bg-emerald-500/20 text-emerald-400' 
                            : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {position.status === 'active' ? '活跃' : '暂停'}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-[hsl(var(--muted-foreground))] mb-1">投入</p>
                          <p className="font-medium">${parseFloat(position.invested).toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-[hsl(var(--muted-foreground))] mb-1">当前</p>
                          <p className="font-medium">${parseFloat(position.current).toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-[hsl(var(--muted-foreground))] mb-1">盈亏</p>
                          <p className={`font-medium ${parseFloat(position.pnl) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {parseFloat(position.pnl) >= 0 ? '+' : ''}{parseFloat(position.pnl).toFixed(2)} 
                            <span className="text-xs ml-1">
                              ({parseFloat(position.pnl) >= 0 ? '+' : ''}{position.pnlPct}%)
                            </span>
                          </p>
                        </div>
                      </div>

                      {position.positions.length > 0 && (
                        <div className="border-t border-[hsl(var(--border))] pt-4">
                          <p className="text-sm text-[hsl(var(--muted-foreground))] mb-2">持仓详情</p>
                          <div className="space-y-2">
                            {position.positions.map((pos, idx) => (
                              <div key={idx} className="flex items-center justify-between text-sm bg-[hsl(var(--card))] p-2 rounded">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{pos.coin}</span>
                                  <span className={`text-xs px-1.5 py-0.5 rounded ${
                                    pos.direction === 'LONG' 
                                      ? 'bg-emerald-500/20 text-emerald-400' 
                                      : 'bg-red-500/20 text-red-400'
                                  }`}>
                                    {pos.direction}
                                  </span>
                                </div>
                                <div className="text-right">
                                  <p className="font-medium">${pos.currentPrice.toFixed(2)}</p>
                                  <p className={`text-xs ${pos.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {pos.pnl >= 0 ? '+' : ''}{pos.pnlPct.toFixed(2)}%
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
