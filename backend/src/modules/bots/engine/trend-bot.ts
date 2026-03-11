/**
 * 趋势追踪型 AI — 利用 EMA 交叉 + ADX 趋势强度识别大周期趋势
 * 适合单边行情，能"吃掉"整段涨幅
 */

import { BaseBot, BotConfig, TradeSignal } from './base-bot.js'

interface TrendParams {
  fastEma: number    // 快速 EMA 周期 (默认 12)
  slowEma: number    // 慢速 EMA 周期 (默认 26)
  signalEma: number  // 信号线周期 (默认 9)
  adxThreshold: number // ADX 趋势阈值 (默认 25)
  trailStop: number   // 移动止损 % (默认 3)
}

export class TrendBot extends BaseBot {
  private priceHistory: Map<string, number[]> = new Map()

  get name() { return '趋势追踪 AI' }
  get type() { return 'trend_following' }
  get pollInterval() { return 5 * 60 * 1000 } // 5分钟

  private get params(): TrendParams {
    return {
      fastEma: this.config.params.fastEma || 12,
      slowEma: this.config.params.slowEma || 26,
      signalEma: this.config.params.signalEma || 9,
      adxThreshold: this.config.params.adxThreshold || 25,
      trailStop: this.config.params.trailStop || 3,
    }
  }

  async generateSignal(): Promise<TradeSignal | null> {
    for (const symbol of this.config.symbols) {
      const signal = await this.analyzeSymbol(symbol)
      if (signal) return signal
    }
    return null
  }

  private async analyzeSymbol(symbol: string): Promise<TradeSignal | null> {
    // 获取K线数据
    const candles = await this.sdk.info.getCandles(symbol, '5m', Date.now() - 24 * 3600 * 1000, Date.now())
    if (!candles || candles.length < this.params.slowEma + 10) return null

    const closes = candles.map((c: any) => parseFloat(c.c))

    // 计算 EMA
    const fastEma = this.calculateEMA(closes, this.params.fastEma)
    const slowEma = this.calculateEMA(closes, this.params.slowEma)

    const currentFast = fastEma[fastEma.length - 1]
    const currentSlow = slowEma[slowEma.length - 1]
    const prevFast = fastEma[fastEma.length - 2]
    const prevSlow = slowEma[slowEma.length - 2]

    // 计算 ADX (简化版 — 用 EMA 差值的绝对变化率近似)
    const trendStrength = Math.abs(currentFast - currentSlow) / currentSlow * 100

    const currentPrice = closes[closes.length - 1]
    const { maxPositionSize } = this.config.riskParams

    // 检查是否已有仓位
    const existingPos = this.state.positions.find(p => p.coin === symbol)

    // 金叉: 快线上穿慢线 + 趋势强度够
    if (prevFast <= prevSlow && currentFast > currentSlow && trendStrength > this.params.adxThreshold / 10) {
      if (existingPos && existingPos.size < 0) {
        await this.closePosition(symbol) // 平空
      }
      return {
        symbol,
        side: 'buy',
        size: maxPositionSize * 0.5,
        confidence: Math.min(trendStrength / 5, 1),
        reason: `EMA金叉 (快${currentFast.toFixed(2)} > 慢${currentSlow.toFixed(2)}, 强度${trendStrength.toFixed(1)}%)`,
      }
    }

    // 死叉: 快线下穿慢线
    if (prevFast >= prevSlow && currentFast < currentSlow && trendStrength > this.params.adxThreshold / 10) {
      if (existingPos && existingPos.size > 0) {
        await this.closePosition(symbol) // 平多
      }
      return {
        symbol,
        side: 'sell',
        size: maxPositionSize * 0.5,
        confidence: Math.min(trendStrength / 5, 1),
        reason: `EMA死叉 (快${currentFast.toFixed(2)} < 慢${currentSlow.toFixed(2)}, 强度${trendStrength.toFixed(1)}%)`,
      }
    }

    return null
  }

  private calculateEMA(data: number[], period: number): number[] {
    const k = 2 / (period + 1)
    const ema: number[] = [data[0]]
    for (let i = 1; i < data.length; i++) {
      ema.push(data[i] * k + ema[i - 1] * (1 - k))
    }
    return ema
  }
}
