/**
 * 强化学习 Agent — 根据市场反馈实时调整交易动作
 * 像 AlphaGo 一样自我博弈进化，极强环境适应性
 */
import { BaseBot, TradeSignal } from './base-bot.js'

// 简化的 Q-table 强化学习
interface State { trend: number; volatility: number; momentum: number; }
type Action = 'buy' | 'sell' | 'hold'

export class RLAgentBot extends BaseBot {
  private qTable: Map<string, Record<Action, number>> = new Map()
  private lastState: string = ''
  private lastAction: Action = 'hold'
  private learningRate = 0.1
  private discountFactor = 0.95
  private epsilon = 0.15 // 探索率

  get name() { return '强化学习 Agent' }
  get type() { return 'rl_agent' }
  get pollInterval() { return 5 * 60 * 1000 }

  async generateSignal(): Promise<TradeSignal | null> {
    const symbol = this.config.symbols[0] || 'BTC'

    try {
      const candles = await this.sdk.info.getCandles(symbol, '5m', Date.now() - 6 * 3600 * 1000, Date.now())
      if (!candles || candles.length < 30) return null

      const closes = candles.map((c: any) => parseFloat(c.c))

      // 量化市场状态
      const state = this.quantizeState(closes)
      const stateKey = JSON.stringify(state)

      // 计算上次动作的奖励
      const reward = this.calculateReward()
      if (this.lastState) {
        this.updateQ(this.lastState, this.lastAction, reward, stateKey)
      }

      // 选择动作 (epsilon-greedy)
      const action = this.selectAction(stateKey)
      this.lastState = stateKey
      this.lastAction = action

      if (action === 'hold') return null

      return {
        symbol,
        side: action,
        size: this.config.riskParams.maxPositionSize * 0.3,
        confidence: this.getActionConfidence(stateKey, action),
        reason: `RL决策: ${action} (状态: trend=${state.trend}, vol=${state.volatility}, mom=${state.momentum})`,
      }
    } catch { return null }
  }

  private quantizeState(closes: number[]): State {
    const sma20 = closes.slice(-20).reduce((s, v) => s + v, 0) / 20
    const current = closes[closes.length - 1]

    // 趋势: -2 强跌, -1 跌, 0 平, 1 涨, 2 强涨
    const trendPct = (current - sma20) / sma20 * 100
    const trend = trendPct < -3 ? -2 : trendPct < -1 ? -1 : trendPct > 3 ? 2 : trendPct > 1 ? 1 : 0

    // 波动率
    const returns = closes.slice(-20).map((c, i, a) => i > 0 ? (c - a[i-1]) / a[i-1] : 0).slice(1)
    const vol = Math.sqrt(returns.reduce((s, r) => s + r * r, 0) / returns.length) * 100
    const volatility = vol < 0.5 ? 0 : vol < 1.5 ? 1 : 2

    // 动量
    const mom5 = (closes[closes.length - 1] - closes[closes.length - 6]) / closes[closes.length - 6] * 100
    const momentum = mom5 < -1 ? -1 : mom5 > 1 ? 1 : 0

    return { trend, volatility, momentum }
  }

  private calculateReward(): number {
    if (this.state.positions.length === 0) return 0
    return this.state.pnl > 0 ? 1 : this.state.pnl < 0 ? -1 : 0
  }

  private getQ(stateKey: string): Record<Action, number> {
    if (!this.qTable.has(stateKey)) {
      this.qTable.set(stateKey, { buy: 0, sell: 0, hold: 0 })
    }
    return this.qTable.get(stateKey)!
  }

  private updateQ(state: string, action: Action, reward: number, nextState: string) {
    const q = this.getQ(state)
    const nextQ = this.getQ(nextState)
    const maxNextQ = Math.max(nextQ.buy, nextQ.sell, nextQ.hold)
    q[action] += this.learningRate * (reward + this.discountFactor * maxNextQ - q[action])
  }

  private selectAction(stateKey: string): Action {
    if (Math.random() < this.epsilon) {
      const actions: Action[] = ['buy', 'sell', 'hold']
      return actions[Math.floor(Math.random() * 3)]
    }
    const q = this.getQ(stateKey)
    const entries = Object.entries(q) as [Action, number][]
    entries.sort((a, b) => b[1] - a[1])
    return entries[0][0]
  }

  private getActionConfidence(stateKey: string, action: Action): number {
    const q = this.getQ(stateKey)
    const total = Math.abs(q.buy) + Math.abs(q.sell) + Math.abs(q.hold) || 1
    return Math.min(0.6 + Math.abs(q[action]) / total * 0.4, 0.95)
  }
}
