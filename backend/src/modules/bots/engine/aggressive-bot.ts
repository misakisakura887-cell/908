/**
 * 激进暴利型 — 年化 100%+，最大回撤 > 30%
 * 高杠杆 + 动量突破，适合小资金搏杀高倍收益
 */
import { BaseBot, TradeSignal } from './base-bot.js'

export class AggressiveBot extends BaseBot {
  get name() { return '激进暴利型' }
  get type() { return 'aggressive_yolo' }
  get pollInterval() { return 2 * 60 * 1000 } // 2分钟

  async generateSignal(): Promise<TradeSignal | null> {
    for (const symbol of this.config.symbols) {
      const signal = await this.checkBreakout(symbol)
      if (signal) return signal
    }
    return null
  }

  private async checkBreakout(symbol: string): Promise<TradeSignal | null> {
    try {
      const candles = await this.sdk.info.getCandles(symbol, '5m', Date.now() - 6 * 3600 * 1000, Date.now())
      if (!candles || candles.length < 30) return null

      const closes = candles.map((c: any) => parseFloat(c.c))
      const volumes = candles.map((c: any) => parseFloat(c.v || '0'))
      const highs = candles.map((c: any) => parseFloat(c.h))
      const lows = candles.map((c: any) => parseFloat(c.l))

      const current = closes[closes.length - 1]
      const high20 = Math.max(...highs.slice(-20))
      const low20 = Math.min(...lows.slice(-20))
      const avgVol = volumes.slice(-20).reduce((s, v) => s + v, 0) / 20
      const currentVol = volumes[volumes.length - 1]

      // 突破型做多: 突破20期高点 + 放量
      if (current > high20 * 0.998 && currentVol > avgVol * 1.5) {
        return {
          symbol, side: 'buy',
          size: this.config.riskParams.maxPositionSize * 0.6,
          leverage: this.config.riskParams.maxLeverage,
          confidence: 0.75,
          reason: `突破做多! 破${high20.toFixed(2)} 量比${(currentVol / avgVol).toFixed(1)}x`,
        }
      }

      // 突破型做空: 跌破20期低点 + 放量
      if (current < low20 * 1.002 && currentVol > avgVol * 1.5) {
        return {
          symbol, side: 'sell',
          size: this.config.riskParams.maxPositionSize * 0.6,
          leverage: this.config.riskParams.maxLeverage,
          confidence: 0.75,
          reason: `突破做空! 破${low20.toFixed(2)} 量比${(currentVol / avgVol).toFixed(1)}x`,
        }
      }
    } catch {}
    return null
  }
}
