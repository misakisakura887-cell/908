import Decimal from 'decimal.js'
import { db } from '../../lib/db.js'
import { redis, PRICE_CACHE_KEY, PRICE_CACHE_TTL } from '../../lib/redis.js'

export interface PriceData {
  buyPrice: Decimal    // 用户买入 USDT 的价格 (CNY)
  sellPrice: Decimal   // 用户卖出 USDT 的价格 (CNY)
  midPrice: Decimal    // 中间价
  updatedAt: Date
}

const FEE_RATE = new Decimal('0.005') // 0.5%
const FETCH_INTERVAL = 5 * 60 * 1000   // 5 minutes

// Binance P2P API
async function fetchBinancePrice(): Promise<{ buy: Decimal; sell: Decimal } | null> {
  try {
    const fetchSide = async (tradeType: 'BUY' | 'SELL') => {
      const response = await fetch('https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          asset: 'USDT',
          fiat: 'CNY',
          tradeType,
          page: 1,
          rows: 10,
          payTypes: ['WECHAT', 'ALIPAY'],
        }),
      })
      
      const data = await response.json() as any
      
      if (data.data?.length > 0) {
        // Get median price from top 10
        const prices = data.data.map((item: any) => new Decimal(item.adv.price))
        prices.sort((a: Decimal, b: Decimal) => a.minus(b).toNumber())
        return prices[Math.floor(prices.length / 2)]
      }
      return null
    }
    
    const [buy, sell] = await Promise.all([
      fetchSide('BUY'),   // 用户买入 USDT，商家卖出
      fetchSide('SELL'),  // 用户卖出 USDT，商家买入
    ])
    
    if (buy && sell) {
      return { buy, sell }
    }
  } catch (error) {
    console.error('Failed to fetch Binance price:', error)
  }
  return null
}

// OKX P2P API
async function fetchOkxPrice(): Promise<{ buy: Decimal; sell: Decimal } | null> {
  try {
    const fetchSide = async (side: 'buy' | 'sell') => {
      const url = `https://www.okx.com/v3/c2c/tradingOrders/getMarketplaceAdsPrelogin?` +
        `cryptoCurrency=USDT&fiatCurrency=CNY&side=${side}&paymentMethod=all&userType=all&` +
        `hideOverseasVerificationAds=false&sortType=price_asc&currentPage=1&numberPerPage=10`
      
      const response = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      })
      
      const data = await response.json() as any
      
      if (data.data?.[side]?.length > 0) {
        const prices = data.data[side].map((item: any) => new Decimal(item.price))
        prices.sort((a: Decimal, b: Decimal) => a.minus(b).toNumber())
        return prices[Math.floor(prices.length / 2)]
      }
      return null
    }
    
    const [buy, sell] = await Promise.all([
      fetchSide('buy'),
      fetchSide('sell'),
    ])
    
    if (buy && sell) {
      return { buy, sell }
    }
  } catch (error) {
    console.error('Failed to fetch OKX price:', error)
  }
  return null
}

export const priceService = {
  async fetchAndCachePrices(): Promise<PriceData | null> {
    // Fetch from multiple sources
    const [binance, okx] = await Promise.all([
      fetchBinancePrice(),
      fetchOkxPrice(),
    ])
    
    // Calculate weighted average
    const sources: { buy: Decimal; sell: Decimal }[] = []
    if (binance) sources.push(binance)
    if (okx) sources.push(okx)
    
    if (sources.length === 0) {
      console.error('No price source available')
      return null
    }
    
    // Simple average
    const avgBuy = sources.reduce((sum, s) => sum.plus(s.buy), new Decimal(0)).div(sources.length)
    const avgSell = sources.reduce((sum, s) => sum.plus(s.sell), new Decimal(0)).div(sources.length)
    const midPrice = avgBuy.plus(avgSell).div(2)
    
    // Apply fee: platform buy price is higher, sell price is lower
    const platformBuyPrice = midPrice.times(new Decimal(1).plus(FEE_RATE))
    const platformSellPrice = midPrice.times(new Decimal(1).minus(FEE_RATE))
    
    const priceData: PriceData = {
      buyPrice: platformBuyPrice,
      sellPrice: platformSellPrice,
      midPrice,
      updatedAt: new Date(),
    }
    
    // Cache in Redis
    await redis.setex(PRICE_CACHE_KEY, PRICE_CACHE_TTL, JSON.stringify({
      buyPrice: priceData.buyPrice.toString(),
      sellPrice: priceData.sellPrice.toString(),
      midPrice: priceData.midPrice.toString(),
      updatedAt: priceData.updatedAt.toISOString(),
    }))
    
    // Store in DB for audit
    await db.priceHistory.createMany({
      data: [
        { source: 'binance', buyPrice: binance?.buy || avgBuy, sellPrice: binance?.sell || avgSell },
        { source: 'okx', buyPrice: okx?.buy || avgBuy, sellPrice: okx?.sell || avgSell },
        { source: 'platform', buyPrice: platformBuyPrice, sellPrice: platformSellPrice },
      ].filter(p => p.buyPrice && p.sellPrice)
    })
    
    console.log(`💰 Price updated: Buy ${platformBuyPrice.toFixed(2)} / Sell ${platformSellPrice.toFixed(2)}`)
    
    return priceData
  },

  async getCurrentPrice(): Promise<PriceData | null> {
    // Try cache first
    const cached = await redis.get(PRICE_CACHE_KEY)
    
    if (cached) {
      const data = JSON.parse(cached)
      return {
        buyPrice: new Decimal(data.buyPrice),
        sellPrice: new Decimal(data.sellPrice),
        midPrice: new Decimal(data.midPrice),
        updatedAt: new Date(data.updatedAt),
      }
    }
    
    // Fetch fresh
    return this.fetchAndCachePrices()
  },

  startPriceFetcher() {
    // Initial fetch
    this.fetchAndCachePrices()
    
    // Schedule periodic fetch
    setInterval(() => {
      this.fetchAndCachePrices()
    }, FETCH_INTERVAL)
    
    console.log('💰 Price fetcher started (5 min interval)')
  }
}
