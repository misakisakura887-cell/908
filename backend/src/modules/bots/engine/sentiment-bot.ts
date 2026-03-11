/**
 * NLP 情绪分析机器人 — 抓取 CoinGecko/CryptoCompare 情绪指标
 * + Fear & Greed Index 判断市场恐慌或贪婪程度
 */

import { BaseBot, TradeSignal } from './base-bot.js'

export class SentimentBot extends BaseBot {
  get name() { return 'NLP 情绪分析 AI' }
  get type() { return 'sentiment_nlp' }
  get pollInterval() { return 15 * 60 * 1000 } // 15分钟

  async generateSignal(): Promise<TradeSignal | null> {
    try {
      // 获取 Fear & Greed Index
      const fgi = await this.getFearGreedIndex()
      if (fgi === null) return null

      const symbol = this.config.symbols[0] || 'BTC'

      // 极度恐慌 (< 20) → 买入机会
      if (fgi < 20) {
        return {
          symbol,
          side: 'buy',
          size: this.config.riskParams.maxPositionSize * 0.4,
          confidence: Math.min((25 - fgi) / 25, 0.95),
          reason: `极度恐慌 FGI=${fgi}, 反向做多`,
        }
      }

      // 极度贪婪 (> 80) → 卖出/做空
      if (fgi > 80) {
        return {
          symbol,
          side: 'sell',
          size: this.config.riskParams.maxPositionSize * 0.3,
          confidence: Math.min((fgi - 75) / 25, 0.9),
          reason: `极度贪婪 FGI=${fgi}, 反向做空`,
        }
      }

      // 中性区间 → 配合价格动量
      if (fgi >= 40 && fgi <= 60) {
        const prices = await this.sdk.info.getAllMids()
        const currentPrice = parseFloat(prices[symbol] || '0')
        const candles = await this.sdk.info.getCandles(symbol, '1h', Date.now() - 6 * 3600 * 1000, Date.now())
        if (candles && candles.length > 3) {
          const firstClose = parseFloat(candles[0].c)
          const momentum = (currentPrice - firstClose) / firstClose

          if (momentum > 0.02) { // 6小时涨幅 > 2%
            return {
              symbol,
              side: 'buy',
              size: this.config.riskParams.maxPositionSize * 0.2,
              confidence: 0.65,
              reason: `中性情绪 FGI=${fgi} + 正动量 ${(momentum * 100).toFixed(2)}%`,
            }
          }
        }
      }

      return null
    } catch (err) {
      return null
    }
  }

  private async getFearGreedIndex(): Promise<number | null> {
    try {
      const res = await fetch('https://api.alternative.me/fng/?limit=1')
      const data = await res.json()
      return parseInt(data?.data?.[0]?.value || '50')
    } catch {
      return null
    }
  }
}
