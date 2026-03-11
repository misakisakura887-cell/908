/**
 * 极速高频型 AI — 毫秒级捕捉买卖盘价差
 * 依靠极高胜率和复利效应累积收益
 */
import { BaseBot, TradeSignal } from './base-bot.js'

export class HFTBot extends BaseBot {
  get name() { return '极速高频 AI' }
  get type() { return 'hft_scalping' }
  get pollInterval() { return 10 * 1000 } // 10秒

  async generateSignal(): Promise<TradeSignal | null> {
    for (const symbol of this.config.symbols) {
      const signal = await this.checkSpread(symbol)
      if (signal) return signal
    }
    return null
  }

  private async checkSpread(symbol: string): Promise<TradeSignal | null> {
    try {
      // 获取 L2 orderbook
      const book = await this.sdk.info.getL2Book(symbol)
      if (!book?.levels?.[0]?.length || !book?.levels?.[1]?.length) return null

      const bestBid = parseFloat(book.levels[0][0].px)
      const bestAsk = parseFloat(book.levels[1][0].px)
      const spread = (bestAsk - bestBid) / bestBid * 100

      // 价差 > 0.05% 时有套利空间
      if (spread > 0.05) {
        // 检查短期动量方向
        const candles = await this.sdk.info.getCandles(symbol, '1m', Date.now() - 5 * 60 * 1000, Date.now())
        if (!candles || candles.length < 3) return null

        const closes = candles.map((c: any) => parseFloat(c.c))
        const momentum = (closes[closes.length - 1] - closes[0]) / closes[0]

        if (Math.abs(momentum) > 0.001) { // 微小动量
          return {
            symbol,
            side: momentum > 0 ? 'buy' : 'sell',
            size: this.config.riskParams.maxPositionSize * 0.15,
            price: momentum > 0 ? bestBid : bestAsk,
            confidence: Math.min(spread * 10, 0.9),
            reason: `价差${spread.toFixed(3)}% 动量${(momentum * 100).toFixed(3)}%`,
          }
        }
      }

      // 快速平仓: 有持仓且利润 > 0.03%
      const pos = this.state.positions.find(p => p.coin === symbol)
      if (pos && pos.size !== 0 && pos.unrealizedPnl > 0) {
        const pnlPct = pos.unrealizedPnl / (Math.abs(pos.size) * pos.entryPrice) * 100
        if (pnlPct > 0.03) {
          await this.closePosition(symbol)
        }
      }
    } catch {}
    return null
  }
}
