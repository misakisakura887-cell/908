import { FastifyInstance } from 'fastify'
import {
  getMarketOverview,
  getCryptoPrices,
  getFearGreedIndex,
  getTrendingCoins,
  getGlobalMarketData,
  getStockPrices,
  detectSignals,
} from './market.service.js'

export async function marketRoutes(app: FastifyInstance) {
  // 获取市场总览（首页用）
  app.get('/overview', async () => {
    return getMarketOverview()
  })

  // 加密货币价格
  app.get('/crypto', async () => {
    return getCryptoPrices()
  })

  // 恐贪指数
  app.get('/fear-greed', async () => {
    return getFearGreedIndex()
  })

  // 热门币种
  app.get('/trending', async () => {
    return getTrendingCoins()
  })

  // 全球市场数据
  app.get('/global', async () => {
    return getGlobalMarketData()
  })

  // 美股数据
  app.get('/stocks', async () => {
    return getStockPrices()
  })

  // 交易信号
  app.get('/signals', async () => {
    return detectSignals()
  })
}
