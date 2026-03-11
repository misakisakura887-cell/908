/**
 * 神级预测模型 (NSP) — Next-State Prediction
 * 利用多时间框架价格模式预测下一阶段走势
 */
import { BaseBot, TradeSignal } from './base-bot.js'

export class NSPBot extends BaseBot {
  get name() { return '神级预测 NSP' }
  get type() { return 'nsp_prediction' }
  get pollInterval() { return 5 * 60 * 1000 }

  async generateSignal(): Promise<TradeSignal | null> {
    const symbol = this.config.symbols[0] || 'BTC'
    try {
      // 多时间框架分析
      const [m5, h1, h4] = await Promise.all([
        this.sdk.info.getCandles(symbol, '5m', Date.now() - 3600 * 1000, Date.now()),
        this.sdk.info.getCandles(symbol, '1h', Date.now() - 24 * 3600 * 1000, Date.now()),
        this.sdk.info.getCandles(symbol, '4h', Date.now() - 7 * 24 * 3600 * 1000, Date.now()),
      ])
      if (!m5?.length || !h1?.length || !h4?.length) return null

      const predict5m = this.predictDirection(m5.map((c: any) => parseFloat(c.c)))
      const predict1h = this.predictDirection(h1.map((c: any) => parseFloat(c.c)))
      const predict4h = this.predictDirection(h4.map((c: any) => parseFloat(c.c)))

      // 三个时间框架方向一致时信号最强
      const consensus = predict5m.dir + predict1h.dir + predict4h.dir
      const avgConf = (predict5m.conf + predict1h.conf + predict4h.conf) / 3

      if (Math.abs(consensus) >= 2 && avgConf > 0.5) {
        return {
          symbol,
          side: consensus > 0 ? 'buy' : 'sell',
          size: this.config.riskParams.maxPositionSize * 0.4,
          confidence: Math.min(avgConf, 0.95),
          reason: `NSP预测: 5m=${predict5m.dir > 0 ? '↑' : '↓'} 1h=${predict1h.dir > 0 ? '↑' : '↓'} 4h=${predict4h.dir > 0 ? '↑' : '↓'}`,
        }
      }
    } catch {}
    return null
  }

  private predictDirection(prices: number[]): { dir: number; conf: number } {
    if (prices.length < 10) return { dir: 0, conf: 0 }
    // 线性回归斜率预测
    const n = Math.min(prices.length, 20)
    const recent = prices.slice(-n)
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0
    for (let i = 0; i < n; i++) {
      sumX += i; sumY += recent[i]; sumXY += i * recent[i]; sumX2 += i * i
    }
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
    const normalized = slope / (recent[0] || 1) * 100
    const dir = normalized > 0.05 ? 1 : normalized < -0.05 ? -1 : 0
    const conf = Math.min(Math.abs(normalized) * 2, 1)
    return { dir, conf }
  }
}
