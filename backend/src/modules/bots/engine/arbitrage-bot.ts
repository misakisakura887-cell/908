/**
 * 套利对冲型 AI — 期现套利 + 资金费率套利
 * 追求极低回撤，稳健型投资者首选
 */

import { BaseBot, TradeSignal } from './base-bot.js'

interface ArbitrageParams {
  minSpread: number        // 最小套利价差 % (默认 0.1)
  fundingRateThreshold: number // 资金费率阈值 % (默认 0.01)
  maxHoldHours: number     // 最长持仓小时 (默认 8)
}

export class ArbitrageBot extends BaseBot {
  get name() { return '套利对冲 AI' }
  get type() { return 'arbitrage_hedge' }
  get pollInterval() { return 30 * 1000 } // 30秒 (套利需要快速响应)

  private get params(): ArbitrageParams {
    return {
      minSpread: this.config.params.minSpread || 0.1,
      fundingRateThreshold: this.config.params.fundingRateThreshold || 0.01,
      maxHoldHours: this.config.params.maxHoldHours || 8,
    }
  }

  async generateSignal(): Promise<TradeSignal | null> {
    // 策略1: 资金费率套利
    const fundingSignal = await this.checkFundingRate()
    if (fundingSignal) return fundingSignal

    // 策略2: 跨品种价差套利 (BTC/ETH ratio)
    const spreadSignal = await this.checkCrossSpread()
    if (spreadSignal) return spreadSignal

    return null
  }

  /** 资金费率套利: 费率为正 → 做空收费率; 费率为负 → 做多收费率 */
  private async checkFundingRate(): Promise<TradeSignal | null> {
    try {
      const meta = await this.sdk.info.perpetuals.getMetaAndAssetCtxs()
      if (!meta || !Array.isArray(meta) || meta.length < 2) return null

      const assetCtxs = meta[1] as any[]
      const universe = (meta[0] as any).universe

      for (let i = 0; i < universe.length; i++) {
        const coin = universe[i].name
        if (!this.config.symbols.includes(coin)) continue

        const ctx = assetCtxs[i]
        const fundingRate = parseFloat(ctx?.funding || '0')

        // 正费率 > 阈值 → 做空赚资金费
        if (fundingRate > this.params.fundingRateThreshold / 100) {
          return {
            symbol: coin,
            side: 'sell',
            size: this.config.riskParams.maxPositionSize * 0.3,
            confidence: Math.min(Math.abs(fundingRate) * 1000, 1),
            reason: `资金费率套利: ${coin} 费率 ${(fundingRate * 100).toFixed(4)}% (做空收费率)`,
          }
        }

        // 负费率 → 做多赚资金费
        if (fundingRate < -this.params.fundingRateThreshold / 100) {
          return {
            symbol: coin,
            side: 'buy',
            size: this.config.riskParams.maxPositionSize * 0.3,
            confidence: Math.min(Math.abs(fundingRate) * 1000, 1),
            reason: `资金费率套利: ${coin} 费率 ${(fundingRate * 100).toFixed(4)}% (做多收费率)`,
          }
        }
      }
    } catch (err) {}

    return null
  }

  /** 跨品种价差套利: BTC/ETH 比率偏离均值时交易 */
  private async checkCrossSpread(): Promise<TradeSignal | null> {
    if (!this.config.symbols.includes('BTC') || !this.config.symbols.includes('ETH')) return null

    try {
      const prices = await this.sdk.info.getAllMids()
      const btcPrice = parseFloat(prices['BTC'] || '0')
      const ethPrice = parseFloat(prices['ETH'] || '0')
      if (!btcPrice || !ethPrice) return null

      const ratio = btcPrice / ethPrice

      // 历史 BTC/ETH 比率通常在 15-20 之间
      // 偏离过大时进行配对交易
      const normalRatio = 17.5 // 大致中值
      const deviation = (ratio - normalRatio) / normalRatio

      if (Math.abs(deviation) > this.params.minSpread / 100 * 10) {
        if (deviation > 0) {
          // BTC 相对 ETH 贵了 → 空 BTC，多 ETH
          return {
            symbol: 'ETH',
            side: 'buy',
            size: this.config.riskParams.maxPositionSize * 0.2,
            confidence: Math.min(Math.abs(deviation) * 5, 0.9),
            reason: `BTC/ETH比率偏离: ${ratio.toFixed(1)} (均值${normalRatio}), 做多ETH`,
          }
        } else {
          return {
            symbol: 'BTC',
            side: 'buy',
            size: this.config.riskParams.maxPositionSize * 0.2,
            confidence: Math.min(Math.abs(deviation) * 5, 0.9),
            reason: `BTC/ETH比率偏离: ${ratio.toFixed(1)} (均值${normalRatio}), 做多BTC`,
          }
        }
      }
    } catch (err) {}

    return null
  }
}
