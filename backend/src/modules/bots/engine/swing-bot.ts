/**
 * 波段震荡型 AI — 基于布林带 + RSI 均值回归
 * 适合横盘或宽幅震荡市场，高抛低吸
 */

import { BaseBot, BotConfig, TradeSignal } from './base-bot.js'

interface SwingParams {
  bbPeriod: number     // 布林带周期 (默认 20)
  bbStdDev: number     // 布林带标准差倍数 (默认 2)
  rsiPeriod: number    // RSI 周期 (默认 14)
  rsiOverbought: number // 超买 (默认 70)
  rsiOversold: number   // 超卖 (默认 30)
}

export class SwingBot extends BaseBot {
  get name() { return '波段震荡 AI' }
  get type() { return 'swing_trading' }
  get pollInterval() { return 3 * 60 * 1000 } // 3分钟

  private get params(): SwingParams {
    return {
      bbPeriod: this.config.params.bbPeriod || 20,
      bbStdDev: this.config.params.bbStdDev || 2,
      rsiPeriod: this.config.params.rsiPeriod || 14,
      rsiOverbought: this.config.params.rsiOverbought || 70,
      rsiOversold: this.config.params.rsiOversold || 30,
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
    const candles = await this.sdk.info.getCandles(symbol, '5m', Date.now() - 12 * 3600 * 1000, Date.now())
    if (!candles || candles.length < this.params.bbPeriod + 5) return null

    const closes = candles.map((c: any) => parseFloat(c.c))
    const currentPrice = closes[closes.length - 1]

    // 布林带
    const { upper, lower, middle } = this.calculateBB(closes)

    // RSI
    const rsi = this.calculateRSI(closes, this.params.rsiPeriod)
    const currentRSI = rsi[rsi.length - 1]

    const { maxPositionSize } = this.config.riskParams
    const existingPos = this.state.positions.find(p => p.coin === symbol)

    // 超卖 + 触碰下轨 → 做多
    if (currentPrice <= lower && currentRSI <= this.params.rsiOversold) {
      if (existingPos && existingPos.size < 0) await this.closePosition(symbol)
      return {
        symbol,
        side: 'buy',
        size: maxPositionSize * 0.3,
        confidence: Math.min((this.params.rsiOversold - currentRSI) / 30 + 0.5, 1),
        reason: `触碰布林下轨 $${lower.toFixed(2)} + RSI超卖 ${currentRSI.toFixed(1)}`,
      }
    }

    // 超买 + 触碰上轨 → 做空
    if (currentPrice >= upper && currentRSI >= this.params.rsiOverbought) {
      if (existingPos && existingPos.size > 0) await this.closePosition(symbol)
      return {
        symbol,
        side: 'sell',
        size: maxPositionSize * 0.3,
        confidence: Math.min((currentRSI - this.params.rsiOverbought) / 30 + 0.5, 1),
        reason: `触碰布林上轨 $${upper.toFixed(2)} + RSI超买 ${currentRSI.toFixed(1)}`,
      }
    }

    // 回归中轨时平仓
    if (existingPos && existingPos.size !== 0) {
      const distToMiddle = Math.abs(currentPrice - middle) / middle
      if (distToMiddle < 0.002) {
        await this.closePosition(symbol)
      }
    }

    return null
  }

  private calculateBB(data: number[]) {
    const period = this.params.bbPeriod
    const slice = data.slice(-period)
    const mean = slice.reduce((s, v) => s + v, 0) / period
    const stdDev = Math.sqrt(slice.reduce((s, v) => s + (v - mean) ** 2, 0) / period)
    return {
      upper: mean + this.params.bbStdDev * stdDev,
      middle: mean,
      lower: mean - this.params.bbStdDev * stdDev,
    }
  }

  private calculateRSI(data: number[], period: number): number[] {
    const rsi: number[] = []
    let avgGain = 0, avgLoss = 0
    for (let i = 1; i <= period; i++) {
      const diff = data[i] - data[i - 1]
      if (diff > 0) avgGain += diff; else avgLoss -= diff
    }
    avgGain /= period; avgLoss /= period
    rsi.push(100 - 100 / (1 + avgGain / (avgLoss || 0.001)))

    for (let i = period + 1; i < data.length; i++) {
      const diff = data[i] - data[i - 1]
      avgGain = (avgGain * (period - 1) + (diff > 0 ? diff : 0)) / period
      avgLoss = (avgLoss * (period - 1) + (diff < 0 ? -diff : 0)) / period
      rsi.push(100 - 100 / (1 + avgGain / (avgLoss || 0.001)))
    }
    return rsi
  }
}
