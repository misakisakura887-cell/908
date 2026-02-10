"use client";

import { motion } from "framer-motion";
import { TrendingUp, Shield, Zap, Wallet, BarChart3, ChevronRight, Cpu, Globe, Activity } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#020617] text-slate-200 selection:bg-cyan-500/30">
      {/* Mesh Gradient Background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-cyan-500/10 blur-[120px]" />
        <div className="absolute top-[20%] -right-[5%] w-[30%] h-[30%] rounded-full bg-blue-600/10 blur-[100px]" />
        <div className="absolute -bottom-[10%] left-[20%] w-[50%] h-[50%] rounded-full bg-purple-600/10 blur-[120px]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150"></div>
      </div>

      <nav className="relative z-50 flex items-center justify-between px-10 py-6">
        <div className="flex items-center gap-3">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400 to-blue-600 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
            <div className="relative w-10 h-10 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-center font-black text-cyan-400">9</div>
          </div>
          <span className="text-2xl font-black tracking-tighter uppercase italic">908 <span className="text-cyan-400 not-italic">Quant</span></span>
        </div>
        
        <div className="hidden lg:flex items-center gap-1 bg-slate-900/50 border border-slate-800/50 p-1 rounded-full backdrop-blur-xl">
          <NavLink label="Strategies" active />
          <NavLink label="Terminal" />
          <NavLink label="Vaults" />
          <NavLink label="Docs" />
        </div>

        <button className="group relative px-6 py-2 rounded-full font-bold text-sm transition-all overflow-hidden bg-slate-50 text-slate-950 hover:text-white">
          <span className="relative z-10 flex items-center gap-2">
            <Wallet size={16} /> Connect Wallet
          </span>
          <div className="absolute inset-0 bg-cyan-600 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
        </button>
      </nav>

      <section className="relative z-10 px-10 pt-24 pb-20 max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md border border-slate-800 bg-slate-900/50 text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            System Status: Operational
          </div>
          <h1 className="text-7xl xl:text-8xl font-black tracking-tighter leading-[0.9] mb-8 uppercase italic">
            AI <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">Dominance</span> <br />
            On-Chain
          </h1>
          <p className="text-slate-400 text-lg max-w-md leading-relaxed mb-10 border-l-2 border-slate-800 pl-6">
            Execute institutional-grade strategies on Hyperliquid with zero friction. Built for the decentralized elite.
          </p>
          <div className="flex flex-wrap gap-4">
            <button className="px-8 py-4 bg-cyan-500 text-slate-950 font-black rounded-sm hover:scale-105 transition-all flex items-center gap-2">
              LAUNCH TERMINAL <ChevronRight size={20} />
            </button>
            <button className="px-8 py-4 bg-transparent border border-slate-800 text-slate-200 font-black rounded-sm hover:bg-slate-900 transition-all">
              STRATEGY DOCS
            </button>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1 }}
          className="relative"
        >
          <div className="relative z-10 p-1 bg-gradient-to-br from-slate-700 to-slate-900 rounded-3xl shadow-2xl">
            <div className="bg-[#050b1e] rounded-[22px] overflow-hidden border border-slate-800">
              <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/50">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/50"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/50"></div>
                </div>
                <div className="text-[10px] font-mono text-slate-500 tracking-widest uppercase">908_QUANT_ENGINE_V1</div>
                <div className="w-4 h-4"></div>
              </div>
              <div className="p-6 space-y-6">
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Portfolio Value</div>
                    <div className="text-3xl font-black tracking-tight text-white">$1,429,082.42</div>
                  </div>
                  <div className="text-cyan-400 text-sm font-mono">+12.4% (24h)</div>
                </div>
                <div className="h-32 flex items-end gap-1">
                  {[40, 60, 45, 90, 65, 80, 55, 70, 85, 100, 75, 95].map((h, i) => (
                    <div key={i} className="flex-1 bg-gradient-to-t from-cyan-600/20 to-cyan-500/80 rounded-t-sm" style={{ height: `${h}%` }}></div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800">
                    <div className="text-[9px] text-slate-500 uppercase font-bold mb-1">AI Conviction</div>
                    <div className="text-lg font-black text-cyan-400 italic">BULLISH</div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800">
                    <div className="text-[9px] text-slate-500 uppercase font-bold mb-1">Active Trades</div>
                    <div className="text-lg font-black text-white italic">14</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Decorative accents */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-cyan-500/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl"></div>
        </motion.div>
      </section>

      <section className="relative z-10 px-10 py-24 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-1">
          <ModuleCard icon={<Activity size={20}/>} title="Execution" detail="Sub-ms latency" color="text-cyan-400" />
          <ModuleCard icon={<Cpu size={20}/>} title="Neural Engine" detail="ML-driven signals" color="text-purple-400" />
          <ModuleCard icon={<Globe size={20}/>} title="L1 Liquidity" detail="Hyperliquid SDK" color="text-blue-400" />
          <ModuleCard icon={<Shield size={20}/>} title="Self-Custody" detail="No-KYC access" color="text-emerald-400" />
        </div>
      </section>
    </main>
  );
}

function NavLink({ label, active = false }: { label: string, active?: boolean }) {
  return (
    <a href="#" className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${active ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-200'}`}>
      {label}
    </a>
  );
}

function ModuleCard({ icon, title, detail, color }: { icon: any, title: string, detail: string, color: string }) {
  return (
    <div className="p-8 bg-slate-900/30 border border-slate-800/50 backdrop-blur-sm hover:bg-slate-900/50 transition-all group">
      <div className={`mb-4 ${color} group-hover:scale-110 transition-transform`}>{icon}</div>
      <div className="text-xs font-black uppercase tracking-widest text-slate-500 mb-1">{title}</div>
      <div className="text-sm font-bold text-slate-200 uppercase tracking-tighter italic">{detail}</div>
    </div>
  );
}
