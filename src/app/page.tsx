"use client";

import { motion } from "framer-motion";
import { TrendingUp, Shield, Zap, Wallet, BarChart3, ChevronRight } from "lucide-react";

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute top-0 -right-4 w-72 h-72 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>

      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-6 border-b border-slate-800/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-lg flex items-center justify-center font-bold text-slate-900">9</div>
          <span className="text-xl font-bold tracking-tight">908 <span className="text-cyan-400">AI</span></span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
          <a href="#" className="hover:text-cyan-400 transition-colors">Strategies</a>
          <a href="#" className="hover:text-cyan-400 transition-colors">Marketplace</a>
          <a href="#" className="hover:text-cyan-400 transition-colors">Dashboard</a>
        </div>
        <button className="flex items-center gap-2 bg-slate-100 text-slate-950 px-4 py-2 rounded-full text-sm font-bold hover:bg-cyan-400 transition-all">
          <Wallet size={16} />
          Connect Wallet
        </button>
      </nav>

      {/* Hero */}
      <section className="px-8 pt-20 pb-32 max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-500/5 text-cyan-400 text-xs font-bold mb-6">
            <Zap size={14} />
            POWERED BY HYPERLIQUID & AI
          </div>
          <h1 className="text-6xl md:text-8xl font-extrabold tracking-tighter mb-6 bg-gradient-to-b from-white to-slate-500 bg-clip-text text-transparent">
            Invest Smarter <br /> with Autonomous AI
          </h1>
          <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 text-balance">
            The decentralized AI investment platform for everyone. Professional quantitative strategies, no KYC required, powered by the fastest DEX on-chain.
          </p>
          <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            <button className="w-full md:w-auto px-8 py-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl transition-all flex items-center justify-center gap-2 group">
              Explore Strategies
              <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="w-full md:w-auto px-8 py-4 bg-slate-900 border border-slate-800 hover:border-slate-700 font-bold rounded-xl transition-all">
              View ROI Leaderboard
            </button>
          </div>
        </motion.div>
      </section>

      {/* Stats/Features Grid */}
      <section className="px-8 py-20 bg-slate-900/50 border-y border-slate-800/50">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard 
            icon={<TrendingUp className="text-cyan-400" />}
            title="High Performance"
            description="Institutional-grade quant strategies accessible to every retail investor with 7D ROI tracking."
          />
          <FeatureCard 
            icon={<Shield className="text-blue-400" />}
            title="Non-KYC"
            description="Retain your privacy. Trade directly via Hyperliquid API without complex verification processes."
          />
          <FeatureCard 
            icon={<BarChart3 className="text-purple-400" />}
            title="Real-time Analytics"
            description="Deep insights into every AI agent's performance, drawdown, and transaction history."
          />
        </div>
      </section>

      {/* Footer-ish Preview */}
      <footer className="px-8 py-12 text-center text-slate-500 text-sm">
        <p>© 2026 TAKI Organization. 908 AI Investment Platform.</p>
      </footer>
    </main>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-8 rounded-2xl border border-slate-800 bg-slate-950/50 backdrop-blur-sm hover:border-slate-700 transition-colors">
      <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center mb-6">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-slate-400 leading-relaxed">{description}</p>
    </div>
  );
}
