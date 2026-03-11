/**
 * 马丁/网格进化 AI — AI 动态调整网格密度和倍率
 * 传统网格的智能升级版，规避大趋势下的爆仓风险
 */

import { BaseBot, TradeSignal } from './base-bot.js'

interface GridParams {
  gridCount: number      // 网格数量 (默认 10)
  upperPrice: number     // 网格上限价
  lowerPrice: number     // 网格下限价
  sizePerGrid: number    // 每格投入 USDT (默认 50)
  dynamicAdjust: boolean // 动态调整 (默认 true)
  volatilityWindow: number // 波动率计算窗口 (默认 24h)
}

interface GridLevel {
  price: number
  filled: boolean
  side: 'buy' | 'sell'
  orderId?: string
}

export class GridBot extends BaseBot {
  private gridLevels: Map<string, GridLevel[]> = new Map()

  get name() { return '智能网格 AI' }
  get type() { return 'grid_martin' }
  get pollInterval() { return 60 * 1000 } // 1分钟

  private get params(): GridParams {
    return {
      gridCount: this.config.params.gridCount || 10,
      upperPrice: this.config.params.upperPrice || 0,
      lowerPrice: this.config.params.lowerPrice || 0,
      sizePerGrid: this.config.params.sizePerGrid || 50,
      dynamicAdjust: this.config.params.dynamicAdjust !== false,
      volatilityWindow: this.config.params.volatilityWindow || 24,
    }
  }

  async start(): Promise<void> {
    // 初始化网格
    for (const symbol of this.config.symbols) {
      await this.initGrid(symbol)
    }
    await super.start()
  }

  private async initGrid(symbol: string): Promise<void> {
    const prices = await this.sdk.info.getAllMids()
    const currentPrice = parseFloat(prices[symbol] || '0')
    if (currentPrice === 0) return

    let upper = this.params.upperPrice || currentPrice * 1.1
    let lower = this.params.lowerPrice || currentPrice * 0.9

    // 动态调整: 根据波动率设置网格范围
    if (this.params.dynamicAdjust) {
      const candles = await this.sdk.info.getCandles(symbol, '1h', Date.now() - this.params.volatilityWindow * 3600 * 1000, Date.now())
      if (candles && candles.length > 10) {
        const highs = candles.map((c: any) => parseFloat(c.h))
        const lows = candles.map((c: any) => parseFloat(c.l))
        const maxHigh = Math.max(...highs)
        const minLow = Math.min(...lows)
        const volatility = (maxHigh - minLow) / currentPrice
        
        // 网格范围 = 波动率 * 1.5
        upper = currentPrice * (1 + volatility * 0.75)
        lower = currentPrice * (1 - volatility * 0.75)
      }
    }

    // 生成网格级别
    const step = (upper - lower) / this.params.gridCount
    const levels: GridLevel[] = []
    for (let i = 0; i <= this.params.gridCount; i++) {
      const price = lower + step * i
      levels.push({
        price,
        filled: false,
        side: price < currentPrice ? 'buy' : 'sell',
      })
    }

    this.gridLevels.set(symbol, levels)
    console.log(`📊 [${this.config.botId}] Grid initialized for ${symbol}: ${lower.toFixed(2)} - ${upper.toFixed(2)}, ${this.params.gridCount} levels`)
  }

  async generateSignal(): Promise<TradeSignal | null> {
    for (const symbol of this.config.symbols) {
      const signal = await this.checkGrid(symbol)
      if (signal) return signal
    }
    return null
  }

  private async checkGrid(symbol: string): Promise<TradeSignal | null> {
    const levels = this.gridLevels.get(symbol)
    if (!levels) return null

    const prices = await this.sdk.info.getAllMids()
    const currentPrice = parseFloat(prices[symbol] || '0')
    if (currentPrice === 0) return null

    // 找到当前价格最近的未触发网格
    for (const level of levels) {
      if (level.filled) continue

      const distance = Math.abs(currentPrice - level.price) / level.price
      if (distance < 0.001) { // 价格触碰网格线 (0.1% 容差)
        level.filled = true

        // 反向设置新的网格
        const idx = levels.indexOf(level)
        if (level.side === 'buy' && idx < levels.length - 1) {
          levels[idx + 1].filled = false
          levels[idx + 1].side = 'sell'
        } else if (level.side === 'sell' && idx > 0) {
          levels[idx - 1].filled = false
          levels[idx - 1].side = 'buy'
        }

        return {
          symbol,
          side: level.side,
          size: this.params.sizePerGrid,
          price: level.price,
          confidence: 0.8,
          reason: `网格触发 @${level.price.toFixed(2)} (${level.side})`,
        }
      }
    }

    return null
  }
}
