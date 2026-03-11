/**
 * 多因子深度挖掘 AI — 同时分析成交量、波动率、链上数据等多维因子
 * 找出人类肉眼无法察觉的隐秘关联
 */
import { BaseBot, TradeSignal } from './base-bot.js'

export class MultifactorBot extends BaseBot {
  get name() { return '多因子挖掘 AI' }
  get type() { return 'multifactor_deep' }
  get pollInterval() { return 10 * 60 * 1000 } // 10分钟

  async generateSignal(): Promise<TradeSignal | null> {
    const symbol = this.config.symbols[0] || 'BTC'
    try {
      const candles = await this.sdk.info.getCandles(symbol, '15m', Date.now() - 24 * 3600 * 1000, Date.now())
      if (!candles || candles.length < 30) return null

      const closes = candles.map((c: any) => parseFloat(c.c))
      const volumes = candles.map((c: any) => parseFloat(c.v || '0'))
      const highs = candles.map((c: any) => parseFloat(c.h))
      const lows = candles.map((c: any) => parseFloat(c.l))

      // Factor 1: 价格动量 (10期 ROC)
      const roc = (closes[closes.length - 1] - closes[closes.length - 11]) / closes[closes.length - 11]

      // Factor 2: 成交量异常 (当前 vs 20期均量)
      const avgVol = volumes.slice(-20).reduce((s, v) => s + v, 0) / 20
      const volRatio = volumes[volumes.length - 1] / (avgVol || 1)

      // Factor 3: 波动率收缩/扩张 (ATR)
      const atrs = highs.slice(-14).map((h, i) => h - lows[lows.length - 14 + i])
      const atr = atrs.reduce((s, v) => s + v, 0) / 14
      const prevAtrs = highs.slice(-28, -14).map((h, i) => h - lows[lows.length - 28 + i])
      const prevAtr = prevAtrs.reduce((s, v) => s + v, 0) / 14
      const atrChange = (atr - prevAtr) / (prevAtr || 1)

      // Factor 4: 价格位置 (相对近期高低)
      const high20 = Math.max(...closes.slice(-20))
      const low20 = Math.min(...closes.slice(-20))
      const pricePosition = (closes[closes.length - 1] - low20) / ((high20 - low20) || 1)

      // Factor 5: 趋势一致性 (收盘价在均线上方的比例)
      const sma10 = closes.slice(-10).reduce((s, v) => s + v, 0) / 10
      const aboveSma = closes.slice(-10).filter(c => c > sma10).length / 10

      // 综合评分 (-1 到 1)
      const score = (
        roc * 2 +                          // 动量权重 2
        (volRatio > 1.5 ? 0.3 : -0.1) +   // 放量加分
        (atrChange > 0.2 ? -0.2 : 0.1) +  // 波动扩张减分
        (pricePosition - 0.5) * 0.5 +      // 位置权重
        (aboveSma - 0.5) * 0.8             // 趋势一致性
      )

      const { maxPositionSize } = this.config.riskParams

      if (score > 0.5) {
        return {
          symbol, side: 'buy',
          size: maxPositionSize * Math.min(score * 0.4, 0.5),
          confidence: Math.min(score, 0.95),
          reason: `多因子看多: 动量${(roc * 100).toFixed(2)}%, 量比${volRatio.toFixed(1)}, 综合${score.toFixed(2)}`,
        }
      }
      if (score < -0.5) {
        return {
          symbol, side: 'sell',
          size: maxPositionSize * Math.min(Math.abs(score) * 0.4, 0.5),
          confidence: Math.min(Math.abs(score), 0.95),
          reason: `多因子看空: 动量${(roc * 100).toFixed(2)}%, 量比${volRatio.toFixed(1)}, 综合${score.toFixed(2)}`,
        }
      }
    } catch {}
    return null
  }
}
