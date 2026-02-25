"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, TrendingDown, Activity, Zap, 
  AlertTriangle, CheckCircle, Clock, ArrowRight,
  Bitcoin, DollarSign, BarChart3, Flame
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://192.168.2.108:3001/api';

interface CryptoData {
  btc: { price: number; change24h: number; volume24h: number; marketCap: number };
  eth: { price: number; change24h: number; volume24h: number; marketCap: number };
  sol: { price: number; change24h: number; volume24h: number; marketCap: number };
}

interface FearGreedData {
  current: { value: number; classification: string };
}

interface Signal {
  id: string;
  type: 'bullish' | 'bearish' | 'neutral';
  title: string;
  description: string;
  importance: 'high' | 'medium' | 'low';
  timestamp: string;
}

interface TrendingCoin {
  id: string;
  name: string;
  symbol: string;
  thumb: string;
  marketCapRank: number;
  priceChange24h: number;
}

// 格式化数字
const formatNumber = (num: number, decimals = 2) => {
  if (num >= 1e12) return `$${(num / 1e12).toFixed(decimals)}T`;
  if (num >= 1e9) return `$${(num / 1e9).toFixed(decimals)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(decimals)}M`;
  return `$${num.toLocaleString()}`;
};

const formatPrice = (num: number) => {
  if (num >= 1000) return `$${num.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  return `$${num.toFixed(2)}`;
};

// 恐贪指数颜色
const getFearGreedColor = (value: number) => {
  if (value <= 25) return 'text-red-500';
  if (value <= 45) return 'text-orange-500';
  if (value <= 55) return 'text-yellow-500';
  if (value <= 75) return 'text-lime-500';
  return 'text-green-500';
};

const getFearGreedBg = (value: number) => {
  if (value <= 25) return 'from-red-500/20 to-red-600/10';
  if (value <= 45) return 'from-orange-500/20 to-orange-600/10';
  if (value <= 55) return 'from-yellow-500/20 to-yellow-600/10';
  if (value <= 75) return 'from-lime-500/20 to-lime-600/10';
  return 'from-green-500/20 to-green-600/10';
};

// ============ 市场概览 Section ============
export function MarketOverview() {
  const [crypto, setCrypto] = useState<CryptoData | null>(null);
  const [fearGreed, setFearGreed] = useState<FearGreedData | null>(null);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [trending, setTrending] = useState<TrendingCoin[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cryptoRes, fgRes, signalsRes, trendingRes] = await Promise.all([
          fetch(`${API_BASE}/market/crypto`).then(r => r.json()),
          fetch(`${API_BASE}/market/fear-greed`).then(r => r.json()),
          fetch(`${API_BASE}/market/signals`).then(r => r.json()),
          fetch(`${API_BASE}/market/trending`).then(r => r.json()),
        ]);
        setCrypto(cryptoRes);
        setFearGreed(fgRes);
        setSignals(signalsRes || []);
        setTrending(trendingRes?.coins || []);
      } catch (e) {
        console.error('Failed to fetch market data:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 60000); // 每分钟刷新
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-white/5 rounded w-1/4 mx-auto" />
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-32 bg-white/5 rounded-2xl" />
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative py-20 px-6 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-950/5 to-transparent" />
      
      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-4 bg-cyan-500/10 border border-cyan-500/20 rounded-full">
            <Activity size={14} className="text-cyan-400" />
            <span className="text-sm text-cyan-400">实时市场数据</span>
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            AI <span className="text-gradient">感知层</span> — 7×24 看世界
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto">
            实时监控市场动态，智能检测交易信号，让你不错过任何机会
          </p>
        </motion.div>

        {/* Main Prices + Fear & Greed */}
        <div className="grid lg:grid-cols-4 gap-4 mb-6">
          {/* BTC */}
          {crypto?.btc && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="glass-card p-5 group hover:border-orange-500/30 transition-all"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-orange-500/10 rounded-lg flex items-center justify-center">
                  <Bitcoin size={18} className="text-orange-400" />
                </div>
                <span className="font-medium">Bitcoin</span>
                <span className="text-xs text-gray-500 ml-auto">BTC</span>
              </div>
              <div className="text-2xl font-bold font-mono-numbers mb-1">
                {formatPrice(crypto.btc.price)}
              </div>
              <div className={`flex items-center gap-1 text-sm ${
                crypto.btc.change24h >= 0 ? 'text-emerald-400' : 'text-red-400'
              }`}>
                {crypto.btc.change24h >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                <span>{crypto.btc.change24h >= 0 ? '+' : ''}{crypto.btc.change24h.toFixed(2)}%</span>
                <span className="text-gray-500 text-xs ml-auto">24h</span>
              </div>
            </motion.div>
          )}

          {/* ETH */}
          {crypto?.eth && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="glass-card p-5 group hover:border-blue-500/30 transition-all"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
                  <DollarSign size={18} className="text-blue-400" />
                </div>
                <span className="font-medium">Ethereum</span>
                <span className="text-xs text-gray-500 ml-auto">ETH</span>
              </div>
              <div className="text-2xl font-bold font-mono-numbers mb-1">
                {formatPrice(crypto.eth.price)}
              </div>
              <div className={`flex items-center gap-1 text-sm ${
                crypto.eth.change24h >= 0 ? 'text-emerald-400' : 'text-red-400'
              }`}>
                {crypto.eth.change24h >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                <span>{crypto.eth.change24h >= 0 ? '+' : ''}{crypto.eth.change24h.toFixed(2)}%</span>
                <span className="text-gray-500 text-xs ml-auto">24h</span>
              </div>
            </motion.div>
          )}

          {/* SOL */}
          {crypto?.sol && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="glass-card p-5 group hover:border-purple-500/30 transition-all"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center">
                  <Zap size={18} className="text-purple-400" />
                </div>
                <span className="font-medium">Solana</span>
                <span className="text-xs text-gray-500 ml-auto">SOL</span>
              </div>
              <div className="text-2xl font-bold font-mono-numbers mb-1">
                {formatPrice(crypto.sol.price)}
              </div>
              <div className={`flex items-center gap-1 text-sm ${
                crypto.sol.change24h >= 0 ? 'text-emerald-400' : 'text-red-400'
              }`}>
                {crypto.sol.change24h >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                <span>{crypto.sol.change24h >= 0 ? '+' : ''}{crypto.sol.change24h.toFixed(2)}%</span>
                <span className="text-gray-500 text-xs ml-auto">24h</span>
              </div>
            </motion.div>
          )}

          {/* Fear & Greed */}
          {fearGreed?.current && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className={`glass-card p-5 bg-gradient-to-br ${getFearGreedBg(fearGreed.current.value)}`}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center">
                  <Activity size={18} className="text-white/60" />
                </div>
                <span className="font-medium">恐贪指数</span>
              </div>
              <div className={`text-4xl font-bold font-mono-numbers mb-1 ${getFearGreedColor(fearGreed.current.value)}`}>
                {fearGreed.current.value}
              </div>
              <div className="text-sm text-gray-400">
                {fearGreed.current.classification}
              </div>
            </motion.div>
          )}
        </div>

        {/* Signals + Trending */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* AI 信号 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            className="glass-card p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold flex items-center gap-2">
                <AlertTriangle size={18} className="text-yellow-400" />
                AI 交易信号
              </h3>
              <span className="text-xs text-gray-500">实时监测</span>
            </div>
            
            {signals.length > 0 ? (
              <div className="space-y-3">
                {signals.slice(0, 3).map(signal => (
                  <div 
                    key={signal.id}
                    className={`p-3 rounded-xl border ${
                      signal.type === 'bullish' 
                        ? 'bg-emerald-500/5 border-emerald-500/20' 
                        : signal.type === 'bearish'
                        ? 'bg-red-500/5 border-red-500/20'
                        : 'bg-yellow-500/5 border-yellow-500/20'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {signal.type === 'bullish' ? (
                        <CheckCircle size={16} className="text-emerald-400 mt-0.5" />
                      ) : signal.type === 'bearish' ? (
                        <AlertTriangle size={16} className="text-red-400 mt-0.5" />
                      ) : (
                        <Clock size={16} className="text-yellow-400 mt-0.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{signal.title}</div>
                        <div className="text-xs text-gray-400 truncate">{signal.description}</div>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        signal.importance === 'high' ? 'bg-red-500/20 text-red-400' : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {signal.importance === 'high' ? '重要' : '一般'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle size={32} className="mx-auto mb-2 text-emerald-400/50" />
                <p className="text-sm">市场平稳，暂无重要信号</p>
              </div>
            )}
          </motion.div>

          {/* 热门币种 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.6 }}
            className="glass-card p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold flex items-center gap-2">
                <Flame size={18} className="text-orange-400" />
                热门趋势
              </h3>
              <span className="text-xs text-gray-500">CoinGecko</span>
            </div>
            
            <div className="space-y-2">
              {trending.slice(0, 5).map((coin, i) => (
                <div 
                  key={coin.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <span className="text-xs text-gray-500 w-4">{i + 1}</span>
                  <img src={coin.thumb} alt={coin.name} className="w-6 h-6 rounded-full" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{coin.name}</div>
                    <div className="text-xs text-gray-500">{coin.symbol.toUpperCase()}</div>
                  </div>
                  {coin.marketCapRank && (
                    <span className="text-xs text-gray-500">#{coin.marketCapRank}</span>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.7 }}
          className="text-center mt-8"
        >
          <a 
            href="/market" 
            className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            查看更多市场数据
            <ArrowRight size={16} />
          </a>
        </motion.div>
      </div>
    </section>
  );
}
