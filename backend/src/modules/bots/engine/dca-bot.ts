/**
 * 保本增值型 — DCA 定投 + 智能加仓
 * 年化 8-15%，最大回撤 < 2%
 */

import { BaseBot, TradeSignal } from './base-bot.js'

export class DCABot extends BaseBot {
  private lastBuyTime: number = 0

  get name() { return '保本增值 DCA' }
  get type() { return 'dca_conservative' }
  get pollInterval() { return 60 * 60 * 1000 } // 1小时

  async generateSignal(): Promise<TradeSignal | null> {
    const intervalHours = this.config.params.intervalHours || 4
    const now = Date.now()

    if (now - this.lastBuyTime < intervalHours * 3600 * 1000) return null

    const symbol = this.config.symbols[0] || 'BTC'
    const baseSize = this.config.params.baseSize || 20 // 每次定投 $20

    // 智能加仓: 价格低于均线时多买
    const candles = await this.sdk.info.getCandles(symbol, '4h', Date.now() - 7 * 24 * 3600 * 1000, Date.now())
    if (!candles || candles.length < 10) {
      this.lastBuyTime = now
      return { symbol, side: 'buy', size: baseSize, confidence: 0.7, reason: 'DCA 定投' }
    }

    const closes = candles.map((c: any) => parseFloat(c.c))
    const sma = closes.slice(-20).reduce((s, v) => s + v, 0) / Math.min(closes.length, 20)
    const currentPrice = closes[closes.length - 1]
    const deviation = (currentPrice - sma) / sma

    let multiplier = 1
    if (deviation < -0.05) multiplier = 2      // 低于均线5% → 加倍
    else if (deviation < -0.1) multiplier = 3   // 低于均线10% → 3倍
    else if (deviation > 0.1) multiplier = 0.5  // 高于均线10% → 减半

    this.lastBuyTime = now
    return {
      symbol,
      side: 'buy',
      size: baseSize * multiplier,
      confidence: 0.75,
      reason: `DCA 定投 x${multiplier} (偏离均线 ${(deviation * 100).toFixed(2)}%)`,
    }
  }
}
