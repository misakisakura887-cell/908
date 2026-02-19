"use client";

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/layout/navbar';
import { TrendingUp, Activity, DollarSign, Wallet, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function DashboardPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#020617] text-slate-200 pt-24 pb-12 px-10">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <h1 className="text-5xl font-black tracking-tighter">个人中心</h1>
            <Button variant="secondary">刷新数据</Button>
          </div>

          {/* Core Metrics */}
          <div className="grid md:grid-cols-4 gap-6">
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl"></div>
              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <Wallet size={20} className="text-cyan-400" />
                  <div className="text-sm text-slate-400">总资产</div>
                </div>
                <div className="text-3xl font-black">$24,582</div>
                <div className="flex items-center gap-1 text-sm text-cyan-400 mt-1">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></div>
                  实时
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center gap-2 mb-2">
                <DollarSign size={20} className="text-slate-400" />
                <div className="text-sm text-slate-400">总投入</div>
              </div>
              <div className="text-3xl font-black">$20,000</div>
            </Card>

            <Card>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={20} className="text-green-400" />
                <div className="text-sm text-slate-400">累计收益</div>
              </div>
              <div className="text-3xl font-black text-green-400">+$4,582</div>
              <div className="text-sm text-green-400 mt-1">+22.9%</div>
            </Card>

            <Card>
              <div className="flex items-center gap-2 mb-2">
                <Activity size={20} className="text-blue-400" />
                <div className="text-sm text-slate-400">今日收益</div>
              </div>
              <div className="text-3xl font-black text-blue-400">+$124</div>
              <div className="text-sm text-blue-400 mt-1">+0.5%</div>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid lg:grid-cols-2 gap-8">
            <Card className="h-64 flex flex-col">
              <h3 className="text-lg font-black mb-4">资产分布</h3>
              <div className="flex-1 flex items-center justify-center text-slate-500">
                饼图占位
              </div>
            </Card>
            <Card className="h-64 flex flex-col">
              <h3 className="text-lg font-black mb-4">累计收益曲线</h3>
              <div className="flex-1 flex items-center justify-center text-slate-500">
                折线图占位
              </div>
            </Card>
          </div>

          {/* Performance Metrics */}
          <Card>
            <h2 className="text-2xl font-black mb-6">量化分析</h2>
            <div className="grid md:grid-cols-4 gap-6">
              {[
                { label: '交易次数', value: '127', unit: '笔' },
                { label: '交易额', value: '$845K', unit: '' },
                { label: '平均持仓', value: '4.2', unit: '天' },
                { label: '胜率', value: '68', unit: '%' },
                { label: '最大单笔收益', value: '+$1,234', unit: '', color: 'text-green-400' },
                { label: '最大单笔亏损', value: '-$456', unit: '', color: 'text-red-400' },
                { label: '夏普比率', value: '1.89', unit: '' },
                { label: '最大回撤', value: '-8.2', unit: '%', color: 'text-red-400' },
              ].map((metric, i) => (
                <div key={i} className="p-4 bg-slate-900/50 rounded-lg border border-slate-800">
                  <div className="text-sm text-slate-400 mb-1">{metric.label}</div>
                  <div className={`text-xl font-black ${metric.color || ''}`}>
                    {metric.value}{metric.unit}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* My Strategies */}
          <Card>
            <h2 className="text-2xl font-black mb-6">我的策略</h2>
            <div className="space-y-4">
              {[
                { name: '黄金对冲策略', invested: 5000, current: 6100, returns: 22.0, isPositive: true },
                { name: 'BTC 动量追踪', invested: 8000, current: 9800, returns: 22.5, isPositive: true },
                { name: '龙头股轮动', invested: 7000, current: 8682, returns: 24.0, isPositive: true },
              ].map((s, i) => (
                <div key={i} className="flex items-center justify-between py-4 border-b border-slate-800 last:border-0">
                  <div className="flex-1">
                    <div className="font-black text-lg">{s.name}</div>
                    <div className="text-sm text-slate-400">投入: ${s.invested}</div>
                  </div>
                  <div className="text-right mr-8">
                    <div className="font-black text-lg">${s.current}</div>
                    <div className={`text-sm flex items-center justify-end gap-1 ${s.isPositive ? 'text-green-400' : 'text-red-400'}`}>
                      {s.isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                      {s.isPositive ? '+' : ''}{s.returns}%
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary">详情</Button>
                    <Button size="sm">追加</Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Trade History */}
          <Card>
            <h2 className="text-2xl font-black mb-6">交易记录</h2>
            <div className="space-y-3">
              {[
                { strategy: '黄金对冲策略', action: '买入', time: '2024-02-15 14:23', pnl: 342, pct: 1.2, isPositive: true },
                { strategy: 'BTC 动量追踪', action: '卖出', time: '2024-02-15 12:01', pnl: -125, pct: -0.4, isPositive: false },
                { strategy: '龙头股轮动', action: '买入', time: '2024-02-15 09:45', pnl: 567, pct: 1.8, isPositive: true },
                { strategy: '黄金对冲策略', action: '卖出', time: '2024-02-14 16:30', pnl: 234, pct: 0.9, isPositive: true },
                { strategy: 'BTC 动量追踪', action: '买入', time: '2024-02-14 10:15', pnl: -89, pct: -0.3, isPositive: false },
              ].map((trade, i) => (
                <div key={i} className="flex items-center gap-4 py-3 border-b border-slate-800 last:border-0">
                  <div className={`w-2 h-2 rounded-full ${trade.isPositive ? 'bg-green-400' : 'bg-red-400'}`}></div>
                  <div className="flex-1">
                    <div className="font-bold">{trade.strategy}</div>
                    <div className="text-xs text-slate-400">{trade.time}</div>
                  </div>
                  <div className="px-3 py-1 bg-slate-800 rounded text-xs font-mono">
                    {trade.action}
                  </div>
                  <div className="text-right">
                    <div className={`font-bold ${trade.isPositive ? 'text-green-400' : 'text-red-400'}`}>
                      {trade.isPositive ? '+' : ''}${Math.abs(trade.pnl)}
                    </div>
                    <div className={`text-xs ${trade.isPositive ? 'text-green-400' : 'text-red-400'}`}>
                      {trade.isPositive ? '+' : ''}{trade.pct}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </main>
    </>
  );
}
