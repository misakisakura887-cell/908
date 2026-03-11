/**
 * 交易机器人基类 - 所有策略引擎的核心
 * 
 * 每个机器人实例绑定一个用户的 HL 账户，
 * 通过 Hyperliquid SDK 执行真实交易
 */

import { Hyperliquid } from 'hyperliquid'
import { EventEmitter } from 'events'

export interface BotConfig {
  userId: string
  botId: string
  hlPrivateKey: string       // 解密后的用户 HL 私钥
  hlWalletAddress?: string
  params: Record<string, any> // 策略参数
  riskParams: {
    maxPositionSize: number   // 最大仓位 (USDT)
    maxDrawdown: number       // 最大回撤 %
    stopLoss: number          // 止损 %
    takeProfit: number        // 止盈 %
    maxLeverage: number       // 最大杠杆
  }
  symbols: string[]           // 交易标的 ['BTC', 'ETH', ...]
}

export interface TradeSignal {
  symbol: string
  side: 'buy' | 'sell'
  size: number       // USDT value
  price?: number     // limit price, undefined = market
  leverage?: number
  reason: string
  confidence: number // 0-1
}

export interface BotState {
  status: 'running' | 'paused' | 'stopped' | 'error'
  positions: any[]
  pnl: number
  trades: number
  startedAt: Date
  lastSignal?: TradeSignal
  error?: string
}

export abstract class BaseBot extends EventEmitter {
  protected sdk: Hyperliquid
  protected config: BotConfig
  protected state: BotState
  protected interval: NodeJS.Timeout | null = null

  constructor(config: BotConfig) {
    super()
    this.config = config
    this.sdk = new Hyperliquid({
      privateKey: config.hlPrivateKey,
      walletAddress: config.hlWalletAddress || undefined,
      enableWs: false,
    })
    this.state = {
      status: 'stopped',
      positions: [],
      pnl: 0,
      trades: 0,
      startedAt: new Date(),
    }
  }

  /** 策略名称 */
  abstract get name(): string
  /** 策略类型 */
  abstract get type(): string
  /** 生成交易信号 */
  abstract generateSignal(): Promise<TradeSignal | null>
  /** 策略轮询间隔 (毫秒) */
  abstract get pollInterval(): number

  async start(): Promise<void> {
    this.state.status = 'running'
    this.state.startedAt = new Date()
    console.log(`🤖 [${this.config.botId}] ${this.name} started`)

    // 立即执行一次
    await this.tick()

    // 定时轮询
    this.interval = setInterval(() => this.tick(), this.pollInterval)
  }

  async stop(): Promise<void> {
    if (this.interval) clearInterval(this.interval)
    this.interval = null
    this.state.status = 'stopped'
    console.log(`🛑 [${this.config.botId}] ${this.name} stopped`)
  }

  async pause(): Promise<void> {
    this.state.status = 'paused'
  }

  getState(): BotState {
    return { ...this.state }
  }

  protected async tick(): Promise<void> {
    if (this.state.status !== 'running') return

    try {
      // 更新持仓
      await this.updatePositions()

      // 检查风控
      if (this.checkRiskLimits()) {
        console.log(`⚠️ [${this.config.botId}] Risk limit hit, pausing`)
        this.state.status = 'paused'
        return
      }

      // 生成信号
      const signal = await this.generateSignal()
      if (signal && signal.confidence >= 0.6) {
        this.state.lastSignal = signal
        await this.executeSignal(signal)
      }
    } catch (error: any) {
      console.error(`❌ [${this.config.botId}] Tick error:`, error.message)
      this.state.error = error.message
    }
  }

  protected async updatePositions(): Promise<void> {
    try {
      const addr = this.config.hlWalletAddress || ''
      const state = await this.sdk.info.perpetuals.getClearinghouseState(addr)
      this.state.positions = (state.assetPositions || []).map((p: any) => ({
        coin: p.position.coin,
        size: parseFloat(p.position.szi || '0'),
        entryPrice: parseFloat(p.position.entryPx || '0'),
        unrealizedPnl: parseFloat(p.position.unrealizedPnl || '0'),
        leverage: parseFloat(p.position.leverage?.value || '1'),
      }))
      this.state.pnl = this.state.positions.reduce((s, p) => s + p.unrealizedPnl, 0)
    } catch (err) {
      // silently fail, will retry
    }
  }

  protected checkRiskLimits(): boolean {
    const { maxDrawdown } = this.config.riskParams
    // 简单的回撤检查
    if (this.state.pnl < 0 && Math.abs(this.state.pnl) > this.config.riskParams.maxPositionSize * (maxDrawdown / 100)) {
      return true
    }
    return false
  }

  protected async executeSignal(signal: TradeSignal): Promise<void> {
    try {
      const { maxLeverage, stopLoss, takeProfit } = this.config.riskParams

      // 设置杠杆
      const leverage = Math.min(signal.leverage || 3, maxLeverage)
      await this.sdk.exchange.updateLeverage(leverage, signal.symbol, false)

      // 计算数量
      const prices = await this.sdk.info.getAllMids()
      const currentPrice = parseFloat(prices[signal.symbol] || '0')
      if (currentPrice === 0) return

      const coinSize = signal.size / currentPrice
      const roundedSize = parseFloat(coinSize.toPrecision(5))

      // 下单
      const isBuy = signal.side === 'buy'
      const orderResult = await this.sdk.exchange.placeOrder({
        coin: signal.symbol,
        is_buy: isBuy,
        sz: roundedSize,
        limit_px: signal.price || currentPrice * (isBuy ? 1.002 : 0.998), // 小滑点市价
        order_type: { limit: { tif: 'Ioc' } }, // IOC 市价模拟
        reduce_only: false,
      })

      this.state.trades++
      console.log(`📈 [${this.config.botId}] ${signal.side.toUpperCase()} ${signal.symbol} $${signal.size} @ ${currentPrice} | ${signal.reason}`)

      // 设置止损止盈
      if (orderResult?.response?.data?.statuses?.[0]?.filled) {
        const slPrice = isBuy ? currentPrice * (1 - stopLoss / 100) : currentPrice * (1 + stopLoss / 100)
        const tpPrice = isBuy ? currentPrice * (1 + takeProfit / 100) : currentPrice * (1 - takeProfit / 100)

        // 止损单
        await this.sdk.exchange.placeOrder({
          coin: signal.symbol,
          is_buy: !isBuy,
          sz: roundedSize,
          limit_px: slPrice,
          order_type: { trigger: { triggerPx: String(slPrice), isMarket: true, tpsl: 'sl' } },
          reduce_only: true,
        }).catch(() => {})

        // 止盈单
        await this.sdk.exchange.placeOrder({
          coin: signal.symbol,
          is_buy: !isBuy,
          sz: roundedSize,
          limit_px: tpPrice,
          order_type: { trigger: { triggerPx: String(tpPrice), isMarket: true, tpsl: 'tp' } },
          reduce_only: true,
        }).catch(() => {})
      }

      this.emit('trade', { signal, result: orderResult })
    } catch (error: any) {
      console.error(`❌ [${this.config.botId}] Execute error:`, error.message)
      this.emit('error', error)
    }
  }

  /** 平掉指定币种所有仓位 */
  protected async closePosition(symbol: string): Promise<void> {
    const pos = this.state.positions.find(p => p.coin === symbol)
    if (!pos || pos.size === 0) return

    const isBuy = pos.size < 0 // 空头平仓要买入
    await this.sdk.exchange.placeOrder({
      coin: symbol,
      is_buy: isBuy,
      sz: Math.abs(pos.size),
      limit_px: 0,
      order_type: { limit: { tif: 'Ioc' } },
      reduce_only: true,
    })
    console.log(`🔄 [${this.config.botId}] Closed ${symbol} position`)
  }

  /** 平掉所有仓位 */
  protected async closeAllPositions(): Promise<void> {
    for (const pos of this.state.positions) {
      if (pos.size !== 0) {
        await this.closePosition(pos.coin)
      }
    }
  }
}
