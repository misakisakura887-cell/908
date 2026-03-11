/**
 * 市场数据感知层服务
 * 
 * 数据源：
 * - 加密货币：CoinGecko API (免费)
 * - 美股：Yahoo Finance / Alpha Vantage
 * - 恐贪指数：Alternative.me
 * - 新闻：RSS feeds
 */

import { redis } from '../../lib/redis.js'

const CACHE_TTL = 60 // 1分钟缓存

// ============ 数据获取 ============

// 加密货币价格 (CoinGecko)
export async function getCryptoPrices(): Promise<any> {
  const cached = await redis.get('market:crypto')
  if (cached) return JSON.parse(cached)

  try {
    const res = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true'
    )
    const data = await res.json()
    
    const result = {
      btc: {
        price: data.bitcoin?.usd || 0,
        change24h: data.bitcoin?.usd_24h_change || 0,
        volume24h: data.bitcoin?.usd_24h_vol || 0,
        marketCap: data.bitcoin?.usd_market_cap || 0,
      },
      eth: {
        price: data.ethereum?.usd || 0,
        change24h: data.ethereum?.usd_24h_change || 0,
        volume24h: data.ethereum?.usd_24h_vol || 0,
        marketCap: data.ethereum?.usd_market_cap || 0,
      },
      sol: {
        price: data.solana?.usd || 0,
        change24h: data.solana?.usd_24h_change || 0,
        volume24h: data.solana?.usd_24h_vol || 0,
        marketCap: data.solana?.usd_market_cap || 0,
      },
      updatedAt: new Date().toISOString(),
    }

    await redis.setex('market:crypto', CACHE_TTL, JSON.stringify(result))
    return result
  } catch (error) {
    console.error('Failed to fetch crypto prices:', error)
    return null
  }
}

// 恐贪指数 (Alternative.me)
export async function getFearGreedIndex(): Promise<any> {
  const cached = await redis.get('market:feargreed')
  if (cached) return JSON.parse(cached)

  try {
    const res = await fetch('https://api.alternative.me/fng/?limit=7')
    const data = await res.json()
    
    const result = {
      current: {
        value: parseInt(data.data[0].value),
        classification: data.data[0].value_classification,
        timestamp: data.data[0].timestamp,
      },
      history: data.data.slice(1).map((d: any) => ({
        value: parseInt(d.value),
        classification: d.value_classification,
        timestamp: d.timestamp,
      })),
      updatedAt: new Date().toISOString(),
    }

    await redis.setex('market:feargreed', CACHE_TTL * 5, JSON.stringify(result))
    return result
  } catch (error) {
    console.error('Failed to fetch fear greed index:', error)
    return null
  }
}

// 热门加密货币趋势 (CoinGecko Trending)
export async function getTrendingCoins(): Promise<any> {
  const cached = await redis.get('market:trending')
  if (cached) return JSON.parse(cached)

  try {
    const res = await fetch('https://api.coingecko.com/api/v3/search/trending')
    const data = await res.json()
    
    const result = {
      coins: data.coins?.slice(0, 7).map((item: any) => ({
        id: item.item.id,
        name: item.item.name,
        symbol: item.item.symbol,
        thumb: item.item.thumb,
        marketCapRank: item.item.market_cap_rank,
        priceChange24h: item.item.data?.price_change_percentage_24h?.usd || 0,
      })) || [],
      updatedAt: new Date().toISOString(),
    }

    await redis.setex('market:trending', CACHE_TTL * 10, JSON.stringify(result))
    return result
  } catch (error) {
    console.error('Failed to fetch trending coins:', error)
    return null
  }
}

// 全球市场数据
export async function getGlobalMarketData(): Promise<any> {
  const cached = await redis.get('market:global')
  if (cached) return JSON.parse(cached)

  try {
    const res = await fetch('https://api.coingecko.com/api/v3/global')
    const data = await res.json()
    
    const result = {
      totalMarketCap: data.data?.total_market_cap?.usd || 0,
      totalVolume24h: data.data?.total_volume?.usd || 0,
      btcDominance: data.data?.market_cap_percentage?.btc || 0,
      ethDominance: data.data?.market_cap_percentage?.eth || 0,
      marketCapChange24h: data.data?.market_cap_change_percentage_24h_usd || 0,
      activeCryptos: data.data?.active_cryptocurrencies || 0,
      updatedAt: new Date().toISOString(),
    }

    await redis.setex('market:global', CACHE_TTL * 2, JSON.stringify(result))
    return result
  } catch (error) {
    console.error('Failed to fetch global market data:', error)
    return null
  }
}

// ============ 信号检测 ============

interface Signal {
  id: string
  type: 'bullish' | 'bearish' | 'neutral'
  title: string
  description: string
  importance: 'high' | 'medium' | 'low'
  timestamp: string
  source: string
}

export async function detectSignals(): Promise<Signal[]> {
  const signals: Signal[] = []
  
  try {
    const [crypto, fearGreed, global] = await Promise.all([
      getCryptoPrices(),
      getFearGreedIndex(),
      getGlobalMarketData(),
    ])

    // 恐贪指数信号
    if (fearGreed?.current) {
      const fg = fearGreed.current.value
      if (fg <= 20) {
        signals.push({
          id: `fg-extreme-fear-${Date.now()}`,
          type: 'bullish',
          title: '极度恐惧',
          description: `恐贪指数 ${fg}，市场极度恐惧，历史上往往是抄底机会`,
          importance: 'high',
          timestamp: new Date().toISOString(),
          source: 'Fear & Greed Index',
        })
      } else if (fg >= 80) {
        signals.push({
          id: `fg-extreme-greed-${Date.now()}`,
          type: 'bearish',
          title: '极度贪婪',
          description: `恐贪指数 ${fg}，市场极度贪婪，注意风险`,
          importance: 'high',
          timestamp: new Date().toISOString(),
          source: 'Fear & Greed Index',
        })
      }
    }

    // BTC 大幅波动信号
    if (crypto?.btc) {
      const change = crypto.btc.change24h
      if (change <= -8) {
        signals.push({
          id: `btc-crash-${Date.now()}`,
          type: 'bullish',
          title: 'BTC 急跌',
          description: `BTC 24h 下跌 ${change.toFixed(1)}%，关注抄底机会`,
          importance: 'high',
          timestamp: new Date().toISOString(),
          source: 'Price Monitor',
        })
      } else if (change >= 8) {
        signals.push({
          id: `btc-pump-${Date.now()}`,
          type: 'bearish',
          title: 'BTC 急涨',
          description: `BTC 24h 上涨 ${change.toFixed(1)}%，注意追高风险`,
          importance: 'medium',
          timestamp: new Date().toISOString(),
          source: 'Price Monitor',
        })
      }
    }

    // 市场整体信号
    if (global) {
      const marketChange = global.marketCapChange24h
      if (marketChange <= -5) {
        signals.push({
          id: `market-crash-${Date.now()}`,
          type: 'neutral',
          title: '市场回调',
          description: `全球加密市场 24h 下跌 ${marketChange.toFixed(1)}%`,
          importance: 'medium',
          timestamp: new Date().toISOString(),
          source: 'Market Overview',
        })
      }
    }

    // 缓存信号
    if (signals.length > 0) {
      await redis.setex('market:signals', CACHE_TTL * 5, JSON.stringify(signals))
    }

  } catch (error) {
    console.error('Failed to detect signals:', error)
  }

  return signals
}

// ============ 聚合数据 ============

export async function getMarketOverview() {
  const [crypto, fearGreed, trending, global, signals] = await Promise.all([
    getCryptoPrices(),
    getFearGreedIndex(),
    getTrendingCoins(),
    getGlobalMarketData(),
    detectSignals(),
  ])

  return {
    crypto,
    fearGreed,
    trending,
    global,
    signals,
    updatedAt: new Date().toISOString(),
  }
}

// ============ 模拟美股数据 (后续接入真实API) ============

export async function getStockPrices(): Promise<any> {
  // TODO: 接入 Yahoo Finance 或 Alpha Vantage
  // 暂时返回模拟数据
  return {
    mag7: [
      { symbol: 'NVDA', name: 'NVIDIA', price: 875.32, change24h: 2.15 },
      { symbol: 'AAPL', name: 'Apple', price: 182.45, change24h: -0.32 },
      { symbol: 'MSFT', name: 'Microsoft', price: 415.67, change24h: 0.78 },
      { symbol: 'GOOGL', name: 'Google', price: 175.23, change24h: 1.24 },
      { symbol: 'AMZN', name: 'Amazon', price: 178.89, change24h: -0.56 },
      { symbol: 'META', name: 'Meta', price: 502.34, change24h: 1.89 },
      { symbol: 'TSLA', name: 'Tesla', price: 245.67, change24h: -2.34 },
    ],
    indices: [
      { symbol: 'SPY', name: 'S&P 500', price: 512.45, change24h: 0.45 },
      { symbol: 'QQQ', name: 'Nasdaq 100', price: 445.32, change24h: 0.67 },
    ],
    commodities: [
      { symbol: 'XAUUSD', name: '黄金', price: 2945.50, change24h: 0.32 },
    ],
    updatedAt: new Date().toISOString(),
  }
}
