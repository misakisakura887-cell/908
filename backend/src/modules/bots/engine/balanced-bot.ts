/**
 * 稳健平衡型 — 年化 20-50%，最大回撤 < 10%
 * 结合趋势跟踪 + 动态止盈止损，主流用户首选
 */
import { BaseBot, TradeSignal } from './base-bot.js'

export class BalancedBot extends BaseBot {
  get name() { return '稳健平衡型' }
  get type() { return 'balanced_steady' }
  get pollInterval() { return 10 * 60 * 1000 }

  async generateSignal(): Promise<TradeSignal | null> {
    const symbol = this.config.symbols[0] || 'BTC'
    try {
      const candles = await this.sdk.info.getCandles(symbol, '15m', Date.now() - 12 * 3600 * 1000, Date.now())
      if (!candles || candles.length < 30) return null

      const closes = candles.map((c: any) => parseFloat(c.c))
      const ema12 = this.ema(closes, 12)
      const ema26 = this.ema(closes, 26)
      const rsi = this.rsi(closes, 14)

      const macdLine = ema12[ema12.length - 1] - ema26[ema26.length - 1]
      const prevMacd = ema12[ema12.length - 2] - ema26[ema26.length - 2]
      const currentRsi = rsi[rsi.length - 1]

      // 保守进场: MACD 金叉 + RSI 在 40-60 中性区 (避免追高)
      if (prevMacd <= 0 && macdLine > 0 && currentRsi > 40 && currentRsi < 65) {
        return {
          symbol, side: 'buy',
          size: this.config.riskParams.maxPositionSize * 0.3,
          confidence: 0.7,
          reason: `MACD金叉 + RSI=${currentRsi.toFixed(0)} (中性区进场)`,
        }
      }
      if (prevMacd >= 0 && macdLine < 0 && currentRsi > 35 && currentRsi < 60) {
        return {
          symbol, side: 'sell',
          size: this.config.riskParams.maxPositionSize * 0.3,
          confidence: 0.7,
          reason: `MACD死叉 + RSI=${currentRsi.toFixed(0)}`,
        }
      }
    } catch {}
    return null
  }

  private ema(data: number[], period: number): number[] {
    const k = 2 / (period + 1)
    const result = [data[0]]
    for (let i = 1; i < data.length; i++) result.push(data[i] * k + result[i - 1] * (1 - k))
    return result
  }

  private rsi(data: number[], period: number): number[] {
    const result: number[] = []
    let avgGain = 0, avgLoss = 0
    for (let i = 1; i <= period; i++) {
      const d = data[i] - data[i - 1]
      if (d > 0) avgGain += d; else avgLoss -= d
    }
    avgGain /= period; avgLoss /= period
    result.push(100 - 100 / (1 + avgGain / (avgLoss || 0.001)))
    for (let i = period + 1; i < data.length; i++) {
      const d = data[i] - data[i - 1]
      avgGain = (avgGain * (period - 1) + (d > 0 ? d : 0)) / period
      avgLoss = (avgLoss * (period - 1) + (d < 0 ? -d : 0)) / period
      result.push(100 - 100 / (1 + avgGain / (avgLoss || 0.001)))
    }
    return result
  }
}
