/**
 * 机器人管理器 - 管理所有运行中的交易机器人实例
 */

import { BaseBot, BotConfig, TrendBot, SwingBot, GridBot, ArbitrageBot, SentimentBot, DCABot, HFTBot, RLAgentBot, MultifactorBot, NSPBot, BalancedBot, AggressiveBot } from './engine/index.js'
import { db } from '../../lib/db.js'
import crypto from 'crypto'

const BOT_TYPES: Record<string, typeof BaseBot> = {
  trend_following: TrendBot as any,
  swing_trading: SwingBot as any,
  hft_scalping: HFTBot as any,
  grid_martin: GridBot as any,
  arbitrage_hedge: ArbitrageBot as any,
  rl_agent: RLAgentBot as any,
  sentiment_nlp: SentimentBot as any,
  multifactor_deep: MultifactorBot as any,
  nsp_prediction: NSPBot as any,
  dca_conservative: DCABot as any,
  balanced_steady: BalancedBot as any,
  aggressive_yolo: AggressiveBot as any,
}

class BotManager {
  private runningBots: Map<string, BaseBot> = new Map()

  /** 解密用户的 HL 私钥 */
  private decrypt(encrypted: string): string {
    const algorithm = 'aes-256-cbc'
    const rawKey = process.env.ENCRYPTION_KEY || 'default-key-for-dev'
    const key = crypto.createHash('sha256').update(rawKey).digest()
    const [ivHex, encHex] = encrypted.split(':')
    const iv = Buffer.from(ivHex, 'hex')
    const decipher = crypto.createDecipheriv(algorithm, key, iv)
    let decrypted = decipher.update(encHex, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  }

  /** 创建并启动机器人 */
  async startBot(botRecord: any): Promise<void> {
    if (this.runningBots.has(botRecord.id)) {
      console.log(`🤖 Bot ${botRecord.id} already running`)
      return
    }

    const BotClass = BOT_TYPES[botRecord.type]
    if (!BotClass) {
      console.error(`❌ Unknown bot type: ${botRecord.type}`)
      return
    }

    // 获取用户 HL 信息
    const user = await db.user.findUnique({ where: { id: botRecord.userId } })
    if (!user?.hlApiKey) {
      console.error(`❌ User ${botRecord.userId} has no HL key bound`)
      return
    }

    const hlPrivateKey = this.decrypt(user.hlApiKey)

    const config: BotConfig = {
      userId: botRecord.userId,
      botId: botRecord.id,
      hlPrivateKey,
      hlWalletAddress: user.hlAddress || undefined,
      params: botRecord.params || {},
      riskParams: botRecord.riskParams || {
        maxPositionSize: 100,
        maxDrawdown: 10,
        stopLoss: 5,
        takeProfit: 10,
        maxLeverage: 3,
      },
      symbols: botRecord.symbols || ['BTC', 'ETH'],
    }

    const bot = new (BotClass as any)(config)

    bot.on('trade', async (data: any) => {
      // 记录交易
      await db.botTrade.create({
        data: {
          botId: botRecord.id,
          userId: botRecord.userId,
          symbol: data.signal.symbol,
          side: data.signal.side,
          size: data.signal.size,
          price: 0, // TODO: 从 result 获取成交价
          reason: data.signal.reason,
          confidence: data.signal.confidence,
        }
      }).catch(console.error)
    })

    bot.on('error', (err: Error) => {
      console.error(`❌ Bot ${botRecord.id} error:`, err.message)
    })

    try {
      await bot.start()
      this.runningBots.set(botRecord.id, bot)
      await db.tradingBot.update({
        where: { id: botRecord.id },
        data: { status: 'RUNNING' },
      })
    } catch (err: any) {
      console.error(`❌ Failed to start bot ${botRecord.id}:`, err.message)
      await db.tradingBot.update({
        where: { id: botRecord.id },
        data: { status: 'ERROR', error: err.message },
      })
    }
  }

  /** 停止机器人 */
  async stopBot(botId: string): Promise<void> {
    const bot = this.runningBots.get(botId)
    if (bot) {
      await bot.stop()
      this.runningBots.delete(botId)
    }
    await db.tradingBot.update({
      where: { id: botId },
      data: { status: 'STOPPED' },
    }).catch(() => {})
  }

  /** 获取机器人状态 */
  getBotState(botId: string) {
    const bot = this.runningBots.get(botId)
    return bot ? bot.getState() : null
  }

  /** 恢复所有应运行的机器人 */
  async restoreAll(): Promise<void> {
    const bots = await db.tradingBot.findMany({
      where: { status: 'RUNNING' },
    })
    console.log(`🔄 Restoring ${bots.length} bots...`)
    for (const bot of bots) {
      await this.startBot(bot).catch(console.error)
    }
  }

  /** 获取所有运行中机器人的 ID */
  getRunningBotIds(): string[] {
    return Array.from(this.runningBots.keys())
  }

  /** 获取可用的机器人类型列表 */
  static getBotTypes() {
    return [
      { id: 'trend_following', name: '趋势追踪 AI', category: 'core', icon: '📈',
        description: '利用 EMA 交叉识别大周期趋势，在单边行情中表现卓越',
        riskLevel: 'balanced', defaultParams: { fastEma: 12, slowEma: 26, signalEma: 9, adxThreshold: 25 } },
      { id: 'swing_trading', name: '波段震荡 AI', category: 'core', icon: '🔄',
        description: '基于布林带 + RSI 均值回归，适合横盘市场高抛低吸',
        riskLevel: 'balanced', defaultParams: { bbPeriod: 20, bbStdDev: 2, rsiPeriod: 14, rsiOverbought: 70, rsiOversold: 30 } },
      { id: 'grid_martin', name: '智能网格 AI', category: 'core', icon: '📊',
        description: 'AI 动态调整网格密度和倍率，规避大趋势下的爆仓风险',
        riskLevel: 'balanced', defaultParams: { gridCount: 10, sizePerGrid: 50, dynamicAdjust: true } },
      { id: 'arbitrage_hedge', name: '套利对冲 AI', category: 'core', icon: '🛡️',
        description: '资金费率套利 + 跨品种价差套利，追求极低回撤',
        riskLevel: 'conservative', defaultParams: { minSpread: 0.1, fundingRateThreshold: 0.01, maxHoldHours: 8 } },
      { id: 'sentiment_nlp', name: 'NLP 情绪分析 AI', category: 'ai_tech', icon: '🧠',
        description: '通过 Fear & Greed Index + 价格动量判断市场情绪',
        riskLevel: 'aggressive', defaultParams: {} },
      { id: 'dca_conservative', name: '保本增值 DCA', category: 'risk', icon: '🛡️',
        description: '智能定投，价格低于均线时加倍买入，年化 8-15%',
        riskLevel: 'conservative', defaultParams: { intervalHours: 4, baseSize: 20 } },
    ]
  }
}

export const botManager = new BotManager()
