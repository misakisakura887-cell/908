"use client";

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Navbar } from '@/components/layout/navbar';
import { MiniChart } from '@/components/charts/performance-chart';
import { useStore, type Strategy } from '@/lib/store';
import { TrendingUp, Shield, Zap, ArrowRight, Users, DollarSign, BarChart3 } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  const { strategies } = useStore();

  return (
    <>
      <Navbar />
      <main className="min-h-screen">
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 px-4 sm:px-6 overflow-hidden">
          {/* Background effects */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px]" />
          </div>

          <div className="max-w-5xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-cyan-400 text-sm">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              基于 Hyperliquid 构建
            </div>
            
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              <span className="text-white">人人可用的</span>
              <br />
              <span className="gradient-text">AI 投资平台</span>
            </h1>
            
            <p className="text-lg sm:text-xl text-[hsl(var(--muted-foreground))] mb-8 max-w-2xl mx-auto">
              1 美金起投 · 免税交易 · AI 驱动量化策略
              <br className="hidden sm:block" />
              让专业级投资策略触手可及
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/strategies">
                <Button size="xl" className="w-full sm:w-auto">
                  开始投资
                  <ArrowRight size={20} />
                </Button>
              </Link>
              <Link href="/strategies">
                <Button variant="outline" size="xl" className="w-full sm:w-auto">
                  浏览策略
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-12 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              <StatCard
                icon={<DollarSign className="text-emerald-400" size={24} />}
                value="$2.3M"
                label="累计收益"
                trend="+12.5%"
              />
              <StatCard
                icon={<Users className="text-cyan-400" size={24} />}
                value="12,458"
                label="活跃用户"
                trend="+8.2%"
              />
              <StatCard
                icon={<BarChart3 className="text-blue-400" size={24} />}
                value="$8.9M"
                label="管理资产"
                trend="+15.3%"
              />
              <StatCard
                icon={<TrendingUp className="text-purple-400" size={24} />}
                value="89.2%"
                label="盈利用户"
              />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">为什么选择 Mirror-AI</h2>
              <p className="text-[hsl(var(--muted-foreground))]">专业级投资工具，普惠化投资体验</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              <FeatureCard
                icon={<TrendingUp size={28} />}
                title="AI 量化策略"
                description="专业级量化模型，24/7 自动交易，实时捕捉市场机会，无需盯盘"
                gradient="from-emerald-500 to-cyan-500"
              />
              <FeatureCard
                icon={<Shield size={28} />}
                title="安全透明"
                description="去中心化托管，资产自持，所有交易记录链上可查，透明可追溯"
                gradient="from-cyan-500 to-blue-500"
              />
              <FeatureCard
                icon={<Zap size={28} />}
                title="超低门槛"
                description="1 美金起投，免税交易，人人可参与，无需复杂的金融知识"
                gradient="from-blue-500 to-purple-500"
              />
            </div>
          </div>
        </section>

        {/* Strategy Cards Section */}
        <section className="py-20 px-4 sm:px-6 bg-[hsl(var(--secondary))]/30">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl sm:text-4xl font-bold mb-2">热门策略</h2>
                <p className="text-[hsl(var(--muted-foreground))]">精选高性能量化策略</p>
              </div>
              <Link href="/strategies">
                <Button variant="ghost">
                  查看全部
                  <ArrowRight size={16} />
                </Button>
              </Link>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              {strategies.map((strategy) => (
                <StrategyCard key={strategy.id} strategy={strategy} />
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto">
            <Card variant="gradient" className="relative overflow-hidden p-8 sm:p-12 text-center">
              <div className="absolute inset-0 -z-10">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-500/20 rounded-full blur-[100px]" />
              </div>
              
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">准备好开始了吗？</h2>
              <p className="text-[hsl(var(--muted-foreground))] mb-8 max-w-lg mx-auto">
                连接钱包，选择策略，一键投资。让 AI 为你的财富保驾护航。
              </p>
              <Link href="/strategies">
                <Button size="xl">
                  立即开始
                  <ArrowRight size={20} />
                </Button>
              </Link>
            </Card>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 px-4 sm:px-6 border-t border-[hsl(var(--border))]">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">M</span>
                </div>
                <span className="font-semibold">Mirror-AI</span>
              </div>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                © 2026 Mirror-AI. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}

function StatCard({ icon, value, label, trend }: { 
  icon: React.ReactNode; 
  value: string; 
  label: string;
  trend?: string;
}) {
  return (
    <Card hover={false} className="p-4 sm:p-6">
      <div className="flex items-center gap-3 mb-3">
        {icon}
        {trend && (
          <span className="text-xs text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">
            {trend}
          </span>
        )}
      </div>
      <div className="text-2xl sm:text-3xl font-bold mb-1">{value}</div>
      <div className="text-sm text-[hsl(var(--muted-foreground))]">{label}</div>
    </Card>
  );
}

function FeatureCard({ icon, title, description, gradient }: {
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient: string;
}) {
  return (
    <Card glow className="group">
      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} p-0.5 mb-4`}>
        <div className="w-full h-full bg-[hsl(var(--card))] rounded-2xl flex items-center justify-center text-white">
          {icon}
        </div>
      </div>
      <h3 className="text-xl font-bold mb-2 group-hover:text-cyan-400 transition-colors">{title}</h3>
      <p className="text-[hsl(var(--muted-foreground))] leading-relaxed">{description}</p>
    </Card>
  );
}

function StrategyCard({ strategy }: { strategy: Strategy }) {
  const riskLabels = { 1: '低风险', 2: '中风险', 3: '高风险' };
  const riskColors = { 
    1: 'bg-emerald-400/10 text-emerald-400', 
    2: 'bg-yellow-400/10 text-yellow-400', 
    3: 'bg-red-400/10 text-red-400' 
  };

  return (
    <Card glow className="flex flex-col">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-lg font-bold mb-1">{strategy.name}</h3>
          <span className={`text-xs px-2 py-0.5 rounded-full ${riskColors[strategy.riskLevel]}`}>
            {riskLabels[strategy.riskLevel]}
          </span>
        </div>
        <span className="text-xs px-2 py-1 bg-emerald-400/10 text-emerald-400 rounded-full">
          活跃中
        </span>
      </div>

      <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4 line-clamp-2">
        {strategy.description}
      </p>

      <div className="h-16 mb-4 -mx-2">
        <MiniChart data={strategy.performanceHistory.slice(-30)} height={64} />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mb-0.5">7日收益</p>
          <p className="text-xl font-bold text-emerald-400">+{strategy.return7d}%</p>
        </div>
        <div>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mb-0.5">夏普比率</p>
          <p className="text-xl font-bold">{strategy.sharpeRatio}</p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 mt-auto border-t border-[hsl(var(--border))]">
        <div className="text-sm text-[hsl(var(--muted-foreground))]">
          <span className="font-semibold text-white">{strategy.followers}</span> 人跟投
        </div>
        <Link href={`/strategies/${strategy.id}`}>
          <Button variant="ghost" size="sm">
            查看详情
            <ArrowRight size={14} />
          </Button>
        </Link>
      </div>
    </Card>
  );
}
