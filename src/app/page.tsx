"use client";

import { useState, useEffect, useRef } from 'react';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
import { 
  Brain, Shield, TrendingUp, Zap, BarChart3, Users, 
  ArrowRight, Sparkles, Lock, Eye, ChevronRight, 
  Activity, Wallet, LineChart, Target, Cpu, Globe
} from 'lucide-react';

// ============ Animation Variants ============
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 }
  }
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const }
  }
};

// ============ Components ============

// Animated Counter
function AnimatedNumber({ value, suffix = '', prefix = '' }: { value: number; suffix?: string; prefix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  
  useEffect(() => {
    if (isInView) {
      const duration = 2000;
      const steps = 60;
      const increment = value / steps;
      let current = 0;
      
      const timer = setInterval(() => {
        current += increment;
        if (current >= value) {
          setCount(value);
          clearInterval(timer);
        } else {
          setCount(Math.floor(current));
        }
      }, duration / steps);
      
      return () => clearInterval(timer);
    }
  }, [isInView, value]);
  
  return (
    <span ref={ref} className="font-mono-numbers">
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  );
}

// Spotlight Card
function SpotlightCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const cardRef = useRef<HTMLDivElement>(null);
  
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    cardRef.current.style.setProperty('--mouse-x', `${x}%`);
    cardRef.current.style.setProperty('--mouse-y', `${y}%`);
  };
  
  return (
    <div 
      ref={cardRef}
      onMouseMove={handleMouseMove}
      className={`spotlight-card glass-card glass-card-hover ${className}`}
    >
      <div className="relative z-10">{children}</div>
    </div>
  );
}

// Sparkline SVG
function Sparkline({ trend = 'up' }: { trend?: 'up' | 'down' }) {
  const path = trend === 'up' 
    ? 'M0 50 Q25 45 50 35 T100 20 T150 25 T200 15 T250 10 T300 5'
    : 'M0 20 Q25 25 50 35 T100 40 T150 35 T200 45 T250 40 T300 50';
  
  return (
    <svg className="sparkline-bg" viewBox="0 0 300 60" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`sparkline-${trend}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={trend === 'up' ? '#00ff87' : '#f87171'} stopOpacity="0.3" />
          <stop offset="100%" stopColor={trend === 'up' ? '#00ff87' : '#f87171'} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={path} fill="none" stroke={trend === 'up' ? '#00ff87' : '#f87171'} strokeWidth="2" opacity="0.5" />
      <path d={`${path} V60 H0 Z`} fill={`url(#sparkline-${trend})`} />
    </svg>
  );
}

// Navbar
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-[#040405]/80 backdrop-blur-xl border-b border-white/5' : ''
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center group-hover:shadow-lg group-hover:shadow-cyan-500/25 transition-all">
              <Brain className="text-white" size={22} />
            </div>
            <span className="text-xl font-bold tracking-tight">Mirror<span className="text-gradient">AI</span></span>
          </Link>
          
          <div className="hidden md:flex items-center gap-8">
            <Link href="/invest" className="text-gray-400 hover:text-white transition-colors text-sm">跟单投资</Link>
            <Link href="/strategies" className="text-gray-400 hover:text-white transition-colors text-sm">策略广场</Link>
            <Link href="/dashboard" className="text-gray-400 hover:text-white transition-colors text-sm">我的收益</Link>
            <Link href="#docs" className="text-gray-400 hover:text-white transition-colors text-sm">文档</Link>
          </div>
          
          <Link href="/ramp">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flow-button px-5 py-2.5 rounded-xl text-sm font-medium text-cyan-400 hover:text-white transition-colors"
            >
              <span className="relative z-10 flex items-center gap-2">
                <Wallet size={16} />
                开始投资
              </span>
            </motion.button>
          </Link>
        </div>
      </div>
    </motion.nav>
  );
}

// Hero Section
function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-20 pb-32 px-6 overflow-hidden">
      <div className="aurora-background" />
      <div className="grid-background" />
      
      <div className="relative z-10 max-w-5xl mx-auto text-center">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="space-y-8"
        >
          {/* Badge */}
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
            <Sparkles size={14} className="text-cyan-400" />
            <span className="text-sm text-gray-300">新一代智能投资平台</span>
            <ChevronRight size={14} className="text-gray-500" />
          </motion.div>
          
          {/* Main Title */}
          <motion.h1 
            variants={fadeUp}
            className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1]"
          >
            人人可用的
            <br />
            <span className="text-gradient shine-text">AI 智能投资</span>
            <span className="text-white">平台</span>
          </motion.h1>
          
          {/* Subtitle */}
          <motion.p 
            variants={fadeUp}
            className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed"
          >
            基于深度学习的量化策略，一键跟投专业交易员
            <span className="terminal-cursor" />
          </motion.p>
          
          {/* CTA Buttons */}
          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/invest">
              <motion.button
                whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(0, 242, 254, 0.4)' }}
                whileTap={{ scale: 0.98 }}
                className="group relative px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-lg overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-2">
                  立即开始
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.button>
            </Link>
            
            <Link href="/strategies">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-8 py-4 rounded-xl bg-white/5 border border-white/10 text-white font-medium text-lg hover:bg-white/10 hover:border-white/20 transition-all flex items-center gap-2"
              >
                <Eye size={20} />
                查看策略
              </motion.button>
            </Link>
          </motion.div>
        </motion.div>
        
        {/* Stats */}
        <motion.div 
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {[
            { label: '累计收益', value: 156.8, suffix: '%', icon: TrendingUp, color: 'text-green-400' },
            { label: '活跃用户', value: 12847, suffix: '+', icon: Users, color: 'text-cyan-400' },
            { label: '管理资产', value: 8.5, suffix: 'M', prefix: '$', icon: BarChart3, color: 'text-purple-400' },
            { label: '盈利用户', value: 94.2, suffix: '%', icon: Target, color: 'text-pink-400' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 + i * 0.1 }}
              className="glass-card p-6 text-center group hover:border-white/10 transition-all"
            >
              <stat.icon size={20} className={`mx-auto mb-3 ${stat.color} opacity-60 group-hover:opacity-100 transition-opacity`} />
              <div className={`text-3xl sm:text-4xl font-bold ${stat.color}`}>
                <AnimatedNumber value={stat.value} suffix={stat.suffix} prefix={stat.prefix || ''} />
              </div>
              <div className="text-sm text-gray-500 mt-2">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// Features Section (Bento Grid)
function Features() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  
  const features = [
    {
      icon: Brain,
      title: 'AI 智能决策',
      desc: '深度学习模型实时分析市场，自动识别最佳交易时机',
      size: 'large',
      gradient: 'from-cyan-500/20 to-blue-600/20',
    },
    {
      icon: Shield,
      title: '资金安全',
      desc: '多重加密保护，冷热钱包分离',
      size: 'small',
      gradient: 'from-emerald-500/20 to-teal-600/20',
    },
    {
      icon: Zap,
      title: '极速执行',
      desc: '毫秒级交易响应',
      size: 'small',
      gradient: 'from-yellow-500/20 to-orange-600/20',
    },
    {
      icon: Eye,
      title: '全透明可追溯',
      desc: '所有交易记录链上可查，策略逻辑公开透明，真实业绩经得起验证',
      size: 'medium',
      gradient: 'from-purple-500/20 to-pink-600/20',
    },
    {
      icon: Activity,
      title: '实时监控',
      desc: '24/7 全天候风控系统，异常波动自动预警',
      size: 'medium',
      gradient: 'from-red-500/20 to-rose-600/20',
    },
  ];
  
  return (
    <section ref={ref} className="relative py-32 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            为什么选择 <span className="text-gradient">Mirror AI</span>
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto">
            融合前沿 AI 技术与专业量化策略，为你打造安全、智能、透明的投资体验
          </p>
        </motion.div>
        
        {/* Bento Grid */}
        <div className="grid grid-cols-4 gap-4 auto-rows-[180px]">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className={`${
                f.size === 'large' ? 'col-span-2 row-span-2' : 
                f.size === 'medium' ? 'col-span-2' : 'col-span-1'
              }`}
            >
              <SpotlightCard className={`h-full p-6 bg-gradient-to-br ${f.gradient}`}>
                <div className={`h-full flex flex-col ${f.size === 'large' ? 'justify-between' : 'justify-center'}`}>
                  <div className={`w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-4 ${f.size === 'small' ? 'w-10 h-10' : ''}`}>
                    <f.icon size={f.size === 'small' ? 18 : 24} className="text-white/80" />
                  </div>
                  <div>
                    <h3 className={`font-bold mb-2 ${f.size === 'large' ? 'text-2xl' : f.size === 'medium' ? 'text-lg' : 'text-base'}`}>
                      {f.title}
                    </h3>
                    <p className={`text-gray-400 ${f.size === 'small' ? 'text-xs' : 'text-sm'} leading-relaxed`}>
                      {f.desc}
                    </p>
                  </div>
                </div>
              </SpotlightCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Strategies Section
function Strategies() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  
  const strategies = [
    {
      id: '1',
      name: '黄金量化策略',
      type: 'AI 量化',
      desc: 'AI 驱动的黄金期货量化交易',
      return7d: 12.3,
      return30d: 34.1,
      sharpe: 1.82,
      maxDrawdown: -5.2,
      followers: 342,
      status: 'active',
      riskLevel: 1,
    },
    {
      id: '2',
      name: 'BTC 量化策略',
      type: 'AI 量化',
      desc: '加密货币智能量化策略',
      return7d: 8.7,
      return30d: 22.5,
      sharpe: 1.34,
      maxDrawdown: -8.1,
      followers: 567,
      status: 'active',
      riskLevel: 2,
    },
    {
      id: '3',
      name: '龙头主观策略',
      type: '主观交易',
      desc: '基金经理金明主理，聚焦美股科技龙头',
      return7d: 15.2,
      return30d: 38.6,
      sharpe: 2.01,
      maxDrawdown: -6.8,
      followers: 189,
      status: 'active',
      riskLevel: 2,
    },
  ];
  
  const riskColors = ['', 'border-emerald-500/30', 'border-yellow-500/30', 'border-red-500/30'];
  const riskLabels = ['', '低风险', '中风险', '高风险'];
  
  return (
    <section ref={ref} className="relative py-32 px-6 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-950/5 to-transparent" />
      
      <div className="relative z-10 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            热门<span className="text-gradient">策略</span>
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto">
            精选专业量化策略，一键跟投开始赚钱
          </p>
        </motion.div>
        
        <div className="grid md:grid-cols-3 gap-6">
          {strategies.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.15, duration: 0.6 }}
            >
              <Link href={`/strategies/${s.id}`}>
                <div className={`group relative glass-card p-6 h-full border-l-2 ${riskColors[s.riskLevel]} hover:bg-white/[0.03] transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-cyan-500/10 cursor-pointer overflow-hidden`}>
                  <Sparkline trend="up" />
                  
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs px-2 py-0.5 rounded bg-white/5 text-gray-400">{s.type}</span>
                        <span className="text-xs text-gray-500">{riskLabels[s.riskLevel]}</span>
                      </div>
                      <h3 className="text-xl font-bold group-hover:text-cyan-400 transition-colors">{s.name}</h3>
                    </div>
                    {s.status === 'active' && (
                      <div className="flex items-center gap-1.5">
                        <div className="breathing-dot" />
                        <span className="text-xs text-green-400">活跃</span>
                      </div>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-500 mb-6 line-clamp-2">{s.desc}</p>
                  
                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">7日收益</div>
                      <div className="text-2xl font-bold text-gradient-green font-mono-numbers">
                        +{s.return7d}%
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">夏普比率</div>
                      <div className="text-2xl font-bold text-white font-mono-numbers">
                        {s.sharpe}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{s.followers} 人跟投</span>
                    <span>最大回撤 {s.maxDrawdown}%</span>
                  </div>
                  
                  {/* Hover Glow */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.6 }}
          className="text-center mt-12"
        >
          <Link href="/strategies">
            <button className="text-gray-400 hover:text-cyan-400 transition-colors flex items-center gap-2 mx-auto">
              查看全部策略
              <ArrowRight size={16} />
            </button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

// CTA Section
function CTA() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  
  return (
    <section ref={ref} className="relative py-32 px-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.6 }}
          className="relative glass-card p-12 sm:p-16 text-center overflow-hidden"
        >
          {/* Background Glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-purple-500/10" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-500/20 rounded-full blur-[120px] -translate-y-1/2" />
          
          <div className="relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.2 }}
            >
              <Cpu size={40} className="mx-auto mb-6 text-cyan-400" />
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                准备好开启智能投资了吗？
              </h2>
              <p className="text-gray-400 mb-8 max-w-lg mx-auto">
                10 元起投，AI 帮你打理资产，轻松坐享收益
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.4 }}
            >
              <Link href="/ramp">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="pulse-ring relative px-10 py-5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-lg"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    <Sparkles size={20} />
                    立即开始投资
                  </span>
                </motion.button>
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// Footer
function Footer() {
  return (
    <footer className="relative py-16 px-6 border-t border-white/5">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <Brain className="text-white" size={16} />
            </div>
            <span className="font-bold">Mirror AI</span>
          </div>
          
          <div className="flex items-center gap-8 text-sm text-gray-500">
            <Link href="#" className="hover:text-white transition-colors">关于我们</Link>
            <Link href="#" className="hover:text-white transition-colors">使用条款</Link>
            <Link href="#" className="hover:text-white transition-colors">隐私政策</Link>
            <Link href="#" className="hover:text-white transition-colors">联系我们</Link>
          </div>
          
          <div className="flex items-center gap-4">
            <a href="#" className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
              <Globe size={16} className="text-gray-400" />
            </a>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-white/5 text-center text-xs text-gray-600">
          © 2026 Mirror AI. All rights reserved. 投资有风险，入市需谨慎。
        </div>
      </div>
    </footer>
  );
}

// ============ Main Page ============
import { MarketOverview } from '@/components/market/market-overview';

export default function HomePage() {
  return (
    <main className="relative min-h-screen bg-[#040405]">
      <Navbar />
      <Hero />
      <MarketOverview />
      <Features />
      <Strategies />
      <CTA />
      <Footer />
    </main>
  );
}
