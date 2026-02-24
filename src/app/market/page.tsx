"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Navbar } from '@/components/layout/navbar';
import { Card } from '@/components/ui/card';
import { 
  TrendingUp, TrendingDown, Activity, RefreshCw, 
  BarChart3, DollarSign, Bitcoin, Zap, Globe,
  AlertTriangle, CheckCircle, Clock, ArrowUpRight
} from 'lucide-react';

const API_BASE = 'http://192.168.2.108:3000/api';

interface CryptoData {
  btc: { price: number; change24h: number; volume24h: number; marketCap: number };
  eth: { price: number; change24h: number; volume24h: number; marketCap: number };
  sol: { price: number; change24h: number; volume24h: number; marketCap: number };
}

interface GlobalData {
  totalMarketCap: number;
  totalVolume24h: number;
  btcDominance: number;
  ethDominance: number;
  marketCapChange24h: number;
  activeCryptos: number;
}

interface Signal {
  id: string;
  type: 'bullish' | 'bearish' | 'neutral';
  title: string;
  description: string;
  importance: 'high' | 'medium' | 'low';
  timestamp: string;
  source: string;
}

interface StockData {
  mag7: Array<{ symbol: string; name: string; price: number; change24h: number }>;
  indices: Array<{ symbol: string; name: string; price: number; change24h: number }>;
  commodities: Array<{ symbol: string; name: string; price: number; change24h: number }>;
}

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

const getFearGreedColor = (value: number) => {
  if (value <= 25) return { text: 'text-red-500', bg: 'from-red-500/20 to-red-600/10', label: '极度恐惧' };
  if (value <= 45) return { text: 'text-orange-500', bg: 'from-orange-500/20 to-orange-600/10', label: '恐惧' };
  if (value <= 55) return { text: 'text-yellow-500', bg: 'from-yellow-500/20 to-yellow-600/10', label: '中性' };
  if (value <= 75) return { text: 'text-lime-500', bg: 'from-lime-500/20 to-lime-600/10', label: '贪婪' };
  return { text: 'text-green-500', bg: 'from-green-500/20 to-green-600/10', label: '极度贪婪' };
};

export default function MarketPage() {
  const [crypto, setCrypto] = useState<CryptoData | null>(null);
  const [global, setGlobal] = useState<GlobalData | null>(null);
  const [fearGreed, setFearGreed] = useState<any>(null);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [stocks, setStocks] = useState<StockData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [cryptoRes, globalRes, fgRes, signalsRes, stocksRes] = await Promise.all([
        fetch(`${API_BASE}/market/crypto`).then(r => r.json()),
        fetch(`${API_BASE}/market/global`).then(r => r.json()),
        fetch(`${API_BASE}/market/fear-greed`).then(r => r.json()),
        fetch(`${API_BASE}/market/signals`).then(r => r.json()),
        fetch(`${API_BASE}/market/stocks`).then(r => r.json()),
      ]);
      setCrypto(cryptoRes);
      setGlobal(globalRes);
      setFearGreed(fgRes);
      setSignals(signalsRes || []);
      setStocks(stocksRes);
    } catch (e) {
      console.error('Failed to fetch market data:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const fg = fearGreed?.current;
  const fgStyle = fg ? getFearGreedColor(fg.value) : null;

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 px-4 pb-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-3">
                <Activity className="text-cyan-400" size={28} />
                市场数据中心
              </h1>
              <p className="text-gray-400 mt-1">AI 感知层 — 7×24 实时监控</p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
              刷新
            </button>
          </div>

          {loading ? (
            <div className="grid gap-6 animate-pulse">
              <div className="h-32 bg-white/5 rounded-2xl" />
              <div className="grid md:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => <div key={i} className="h-40 bg-white/5 rounded-2xl" />)}
              </div>
            </div>
          ) : (
            <>
              {/* Global Overview */}
              <Card className="p-6 mb-6 bg-gradient-to-br from-cyan-500/5 to-blue-500/5">
                <div className="grid grid-cols-2 md:grid-cols-6 gap-6">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">总市值</div>
                    <div className="text-xl font-bold">{global ? formatNumber(global.totalMarketCap) : '-'}</div>
                    <div className={`text-xs ${global && global.marketCapChange24h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {global ? `${global.marketCapChange24h >= 0 ? '+' : ''}${global.marketCapChange24h.toFixed(2)}%` : '-'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">24h 交易量</div>
                    <div className="text-xl font-bold">{global ? formatNumber(global.totalVolume24h) : '-'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">BTC 主导</div>
                    <div className="text-xl font-bold">{global ? `${global.btcDominance.toFixed(1)}%` : '-'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">ETH 主导</div>
                    <div className="text-xl font-bold">{global ? `${global.ethDominance.toFixed(1)}%` : '-'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">活跃币种</div>
                    <div className="text-xl font-bold">{global ? global.activeCryptos.toLocaleString() : '-'}</div>
                  </div>
                  {fg && fgStyle && (
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${fgStyle.bg}`}>
                      <div className="text-xs text-gray-400 mb-1">恐贪指数</div>
                      <div className={`text-3xl font-bold ${fgStyle.text}`}>{fg.value}</div>
                      <div className="text-xs text-gray-400">{fgStyle.label}</div>
                    </div>
                  )}
                </div>
              </Card>

              {/* Crypto Prices */}
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Bitcoin size={20} className="text-orange-400" />
                加密货币
              </h2>
              <div className="grid md:grid-cols-3 gap-4 mb-8">
                {crypto && Object.entries({
                  btc: { name: 'Bitcoin', icon: Bitcoin, color: 'orange' },
                  eth: { name: 'Ethereum', icon: DollarSign, color: 'blue' },
                  sol: { name: 'Solana', icon: Zap, color: 'purple' },
                }).map(([key, info]) => {
                  const data = (crypto as any)[key];
                  if (!data) return null;
                  return (
                    <Card key={key} className="p-5">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 bg-${info.color}-500/10 rounded-xl flex items-center justify-center`}>
                            <info.icon size={20} className={`text-${info.color}-400`} />
                          </div>
                          <div>
                            <div className="font-bold">{info.name}</div>
                            <div className="text-xs text-gray-500">{key.toUpperCase()}</div>
                          </div>
                        </div>
                        <div className={`flex items-center gap-1 text-sm ${data.change24h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {data.change24h >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                          {data.change24h >= 0 ? '+' : ''}{data.change24h.toFixed(2)}%
                        </div>
                      </div>
                      <div className="text-3xl font-bold mb-2">{formatPrice(data.price)}</div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-xs text-gray-500">24h 交易量</div>
                          <div className="font-medium">{formatNumber(data.volume24h, 1)}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">市值</div>
                          <div className="font-medium">{formatNumber(data.marketCap, 1)}</div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>

              {/* Stocks */}
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <BarChart3 size={20} className="text-blue-400" />
                美股 · Mag 7
              </h2>
              <div className="grid md:grid-cols-4 gap-4 mb-8">
                {stocks?.mag7.map(stock => (
                  <Card key={stock.symbol} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="font-bold">{stock.symbol}</div>
                        <div className="text-xs text-gray-500">{stock.name}</div>
                      </div>
                      <div className={`text-sm ${stock.change24h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {stock.change24h >= 0 ? '+' : ''}{stock.change24h.toFixed(2)}%
                      </div>
                    </div>
                    <div className="text-xl font-bold">{formatPrice(stock.price)}</div>
                  </Card>
                ))}
              </div>

              {/* Signals */}
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <AlertTriangle size={20} className="text-yellow-400" />
                AI 交易信号
              </h2>
              <Card className="p-6">
                {signals.length > 0 ? (
                  <div className="space-y-4">
                    {signals.map(signal => (
                      <div
                        key={signal.id}
                        className={`p-4 rounded-xl border ${
                          signal.type === 'bullish'
                            ? 'bg-emerald-500/5 border-emerald-500/20'
                            : signal.type === 'bearish'
                            ? 'bg-red-500/5 border-red-500/20'
                            : 'bg-yellow-500/5 border-yellow-500/20'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            {signal.type === 'bullish' ? (
                              <CheckCircle className="text-emerald-400 mt-0.5" size={20} />
                            ) : signal.type === 'bearish' ? (
                              <AlertTriangle className="text-red-400 mt-0.5" size={20} />
                            ) : (
                              <Clock className="text-yellow-400 mt-0.5" size={20} />
                            )}
                            <div>
                              <div className="font-bold mb-1">{signal.title}</div>
                              <div className="text-sm text-gray-400">{signal.description}</div>
                              <div className="text-xs text-gray-500 mt-2">{signal.source}</div>
                            </div>
                          </div>
                          <span className={`text-xs px-3 py-1 rounded-full ${
                            signal.importance === 'high' ? 'bg-red-500/20 text-red-400' : 'bg-gray-500/20 text-gray-400'
                          }`}>
                            {signal.importance === 'high' ? '重要' : '一般'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <CheckCircle size={48} className="mx-auto mb-4 text-emerald-400/50" />
                    <h3 className="text-lg font-bold mb-2">市场平稳</h3>
                    <p className="text-gray-400">暂无重要交易信号，AI 正在持续监控中...</p>
                  </div>
                )}
              </Card>
            </>
          )}
        </div>
      </main>
    </>
  );
}
