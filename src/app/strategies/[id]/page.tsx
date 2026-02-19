"use client";

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Navbar } from '@/components/layout/navbar';
import { TrendingUp, Shield, Activity, Users } from 'lucide-react';

export default function StrategyDetailPage({ params }: { params: { id: string } }) {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#020617] text-slate-200 pt-24 pb-12 px-10">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h1 className="text-5xl font-black tracking-tighter mb-2">黄金量化策略</h1>
              <p className="text-slate-400">基于微软开源模型的黄金量化交易策略</p>
            </div>

            <Card className="h-64 flex items-center justify-center text-slate-500">
              收益曲线图（占位）
            </Card>

            <div className="grid md:grid-cols-4 gap-4">
              <Card>
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp size={20} className="text-green-400" />
                  <div className="text-slate-400 text-sm">累计收益</div>
                </div>
                <div className="text-2xl font-black text-green-400">+24.5%</div>
              </Card>
              <Card>
                <div className="flex items-center gap-2 mb-2">
                  <Shield size={20} className="text-cyan-400" />
                  <div className="text-slate-400 text-sm">夏普比率</div>
                </div>
                <div className="text-2xl font-black">2.1</div>
              </Card>
              <Card>
                <div className="flex items-center gap-2 mb-2">
                  <Activity size={20} className="text-red-400" />
                  <div className="text-slate-400 text-sm">最大回撤</div>
                </div>
                <div className="text-2xl font-black text-red-400">-5.2%</div>
              </Card>
              <Card>
                <div className="flex items-center gap-2 mb-2">
                  <Users size={20} className="text-blue-400" />
                  <div className="text-slate-400 text-sm">胜率</div>
                </div>
                <div className="text-2xl font-black">68%</div>
              </Card>
            </div>

            <Card>
              <h3 className="text-xl font-black mb-4">最近交易</h3>
              <div className="space-y-2">
                {[
                  { symbol: 'XAUUSD', time: '2024-02-15 14:23', pnl: 342, pct: 1.2 },
                  { symbol: 'XAUUSD', time: '2024-02-15 12:01', pnl: -125, pct: -0.4 },
                  { symbol: 'XAUUSD', time: '2024-02-15 09:45', pnl: 567, pct: 1.8 },
                ].map((trade, i) => (
                  <div key={i} className="flex justify-between items-center py-2 border-b border-slate-800">
                    <div>
                      <div className="font-bold">{trade.symbol}</div>
                      <div className="text-xs text-slate-400">{trade.time}</div>
                    </div>
                    <div className="text-right">
                      <div className={`font-bold ${trade.pnl > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {trade.pnl > 0 ? '+' : ''}${trade.pnl}
                      </div>
                      <div className={`text-xs ${trade.pnl > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {trade.pnl > 0 ? '+' : ''}{trade.pct}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <Activity size={20} className="text-cyan-400" />
                <h3 className="text-xl font-black">投资此策略</h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-slate-400 mb-1">跟投人数</div>
                  <div className="text-2xl font-black">342</div>
                </div>
                
                <div>
                  <div className="text-sm text-slate-400 mb-1">总锁仓</div>
                  <div className="text-2xl font-black">$234.5K</div>
                </div>

                <div className="pt-4 border-t border-slate-800">
                  <label className="text-sm text-slate-400 mb-2 block">投资金额（USDT）</label>
                  <Input type="number" placeholder="100" />
                </div>

                <div>
                  <div className="text-sm text-slate-400 mb-1">手续费（0.5%）</div>
                  <div className="font-mono text-cyan-400">≈ 0.5 USDT</div>
                </div>

                <Button className="w-full" disabled>
                  连接钱包后开始
                </Button>
              </div>
            </Card>

            <Card>
              <h3 className="text-lg font-black mb-3">策略说明</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                该策略基于微软开源的量化模型，结合黄金期货的历史数据和实时市场信号，
                通过机器学习算法识别套利机会。适合风险偏好较低的投资者。
              </p>
            </Card>
          </div>
        </div>
      </main>
    </>
  );
}
