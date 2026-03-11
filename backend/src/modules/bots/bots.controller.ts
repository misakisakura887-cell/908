import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { db } from '../../lib/db.js'
import { botManager } from './bot-manager.js'

const createBotSchema = z.object({
  name: z.string().min(1).max(50),
  type: z.string(),
  description: z.string().optional(),
  symbols: z.array(z.string()).default(['BTC', 'ETH']),
  params: z.record(z.any()).default({}),
  riskParams: z.object({
    maxPositionSize: z.number().positive().default(100),
    maxDrawdown: z.number().positive().default(10),
    stopLoss: z.number().positive().default(5),
    takeProfit: z.number().positive().default(10),
    maxLeverage: z.number().positive().default(3),
  }).default({}),
  riskLevel: z.enum(['conservative', 'balanced', 'aggressive']).default('balanced'),
  isPublic: z.boolean().default(false),
})

export async function botsRoutes(app: FastifyInstance) {
  const authGuard = async (request: FastifyRequest, reply: FastifyReply) => {
    try { await request.jwtVerify() } catch { reply.status(401).send({ error: '请先登录' }) }
  }

  // 获取可用的机器人类型
  app.get('/types', async () => {
    const { BotManager } = await import('./bot-manager.js') as any
    // 直接返回静态列表
    return [
      // 核心交易逻辑类
      { id: 'trend_following', name: '趋势追踪 AI', category: 'core', icon: '📈', description: '利用深度学习 EMA 交叉识别大周期趋势，在单边行情中"吃掉"整段涨幅', riskLevel: 'balanced', defaultParams: { fastEma: 12, slowEma: 26, signalEma: 9, adxThreshold: 25 } },
      { id: 'swing_trading', name: '波段震荡 AI', category: 'core', icon: '🔄', description: '基于布林带 + RSI 均值回归，动态计算压力位与支撑位，适合横盘高抛低吸', riskLevel: 'balanced', defaultParams: { bbPeriod: 20, bbStdDev: 2, rsiPeriod: 14, rsiOverbought: 70, rsiOversold: 30 } },
      { id: 'hft_scalping', name: '极速高频 AI', category: 'core', icon: '⚡', description: '毫秒级下单，捕捉买卖盘价差。极高胜率 + 复利效应，受大盘影响极小', riskLevel: 'aggressive', defaultParams: {} },
      { id: 'arbitrage_hedge', name: '套利对冲 AI', category: 'core', icon: '🛡️', description: '资金费率套利 + 跨品种价差套利，追求极低回撤，稳健型投资者首选', riskLevel: 'conservative', defaultParams: { minSpread: 0.1, fundingRateThreshold: 0.01, maxHoldHours: 8 } },
      { id: 'grid_martin', name: '马丁/网格进化 AI', category: 'core', icon: '📊', description: '传统网格的 AI 升级版，智能动态调整网格密度和倍率，规避大趋势下爆仓风险', riskLevel: 'balanced', defaultParams: { gridCount: 10, sizePerGrid: 50, dynamicAdjust: true } },
      // AI 技术底层类
      { id: 'rl_agent', name: '强化学习 Agent', category: 'ai_tech', icon: '🤖', description: '像 AlphaGo 一样自我博弈进化，根据市场反馈实时调整交易动作，极强环境适应性', riskLevel: 'balanced', defaultParams: {} },
      { id: 'sentiment_nlp', name: 'NLP 情绪分析', category: 'ai_tech', icon: '🧠', description: '实时抓取全网情绪指标，通过 Fear & Greed Index 判断市场恐慌或贪婪，先人一步', riskLevel: 'aggressive', defaultParams: {} },
      { id: 'multifactor_deep', name: '多因子深度挖掘 AI', category: 'ai_tech', icon: '🔬', description: '同时分析成交量、波动率、动量等数千因子，找出人类肉眼无法察觉的隐秘关联', riskLevel: 'balanced', defaultParams: {} },
      { id: 'nsp_prediction', name: '神级预测模型 NSP', category: 'ai_tech', icon: '🔮', description: '利用 Next-State Prediction 范式，多时间框架预测下一阶段走势，极高短线方向感', riskLevel: 'aggressive', defaultParams: {} },
      // 风险偏好分类
      { id: 'dca_conservative', name: '🛡️ 保本增值型', category: 'risk', icon: '🛡️', description: '年化 8-15%，最大回撤 < 2%。智能 DCA 定投，低位自动加倍，大资金避险首选', riskLevel: 'conservative', defaultParams: { intervalHours: 4, baseSize: 20 } },
      { id: 'balanced_steady', name: '⚖️ 稳健平衡型', category: 'risk', icon: '⚖️', description: '年化 20-50%，最大回撤 < 10%。MACD + RSI 保守进场，主流用户首选', riskLevel: 'balanced', defaultParams: {} },
      { id: 'aggressive_yolo', name: '🔥 激进暴利型', category: 'risk', icon: '🔥', description: '年化 100%+，最大回撤 > 30%。高杠杆动量突破，适合小资金搏杀高倍收益', riskLevel: 'aggressive', defaultParams: {} },
    ]
  })

  // 获取所有公开策略 (策略广场)
  app.get('/marketplace', async (request: FastifyRequest) => {
    const { type, riskLevel } = request.query as any
    const where: any = { isPublic: true }
    if (type) where.type = type
    if (riskLevel) where.riskLevel = riskLevel

    const bots = await db.tradingBot.findMany({
      where,
      orderBy: { followers: 'desc' },
      take: 50,
      include: { user: { select: { walletAddress: true } }, _count: { select: { trades: true } } },
    })

    return bots.map(b => ({
      id: b.id,
      name: b.name,
      type: b.type,
      category: b.category,
      description: b.description,
      symbols: b.symbols,
      riskLevel: b.riskLevel,
      status: b.status,
      followers: b.followers,
      totalPnl: b.totalPnl.toString(),
      totalTrades: b._count.trades,
      creator: b.user.walletAddress ? `${b.user.walletAddress.slice(0, 6)}...${b.user.walletAddress.slice(-4)}` : 'Anonymous',
      createdAt: b.createdAt,
    }))
  })

  // 用户的机器人列表
  app.get('/my', { preHandler: authGuard }, async (request: FastifyRequest) => {
    const { userId } = request.user as any
    const bots = await db.tradingBot.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { trades: true } } },
    })
    return bots.map(b => ({
      ...b,
      totalPnl: b.totalPnl.toString(),
      totalTrades: b._count.trades,
      liveState: botManager.getBotState(b.id),
    }))
  })

  // 创建机器人
  app.post('/create', { preHandler: authGuard }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = createBotSchema.parse(request.body)
      const { userId } = request.user as any

      // 验证用户已绑定 HL
      const user = await db.user.findUnique({ where: { id: userId } })
      if (!user?.hlApiKey) {
        return reply.status(400).send({ error: '请先绑定 Hyperliquid 钱包' })
      }

      const bot = await db.tradingBot.create({
        data: {
          userId,
          name: body.name,
          type: body.type,
          description: body.description,
          symbols: body.symbols,
          params: body.params,
          riskParams: body.riskParams,
          riskLevel: body.riskLevel,
          isPublic: body.isPublic,
        },
      })

      return { message: '机器人创建成功', bot: { id: bot.id, name: bot.name, type: bot.type, status: bot.status } }
    } catch (error) {
      if (error instanceof z.ZodError) return reply.status(400).send({ error: error.errors[0].message })
      throw error
    }
  })

  // 启动机器人
  app.post('/:botId/start', { preHandler: authGuard }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { botId } = request.params as any
    const { userId } = request.user as any
    const bot = await db.tradingBot.findFirst({ where: { id: botId, userId } })
    if (!bot) return reply.status(404).send({ error: '机器人不存在' })
    await botManager.startBot(bot)
    return { message: '机器人已启动' }
  })

  // 停止机器人
  app.post('/:botId/stop', { preHandler: authGuard }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { botId } = request.params as any
    const { userId } = request.user as any
    const bot = await db.tradingBot.findFirst({ where: { id: botId, userId } })
    if (!bot) return reply.status(404).send({ error: '机器人不存在' })
    await botManager.stopBot(botId)
    return { message: '机器人已停止' }
  })

  // 机器人详情 + 实时状态
  app.get('/:botId', async (request: FastifyRequest, reply: FastifyReply) => {
    const { botId } = request.params as any
    const bot = await db.tradingBot.findUnique({
      where: { id: botId },
      include: {
        user: { select: { walletAddress: true } },
        trades: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    })
    if (!bot) return reply.status(404).send({ error: '不存在' })
    return {
      ...bot,
      totalPnl: bot.totalPnl.toString(),
      liveState: botManager.getBotState(botId),
    }
  })

  // 删除机器人
  app.delete('/:botId', { preHandler: authGuard }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { botId } = request.params as any
    const { userId } = request.user as any
    const bot = await db.tradingBot.findFirst({ where: { id: botId, userId } })
    if (!bot) return reply.status(404).send({ error: '不存在' })
    await botManager.stopBot(botId)
    await db.botTrade.deleteMany({ where: { botId } })
    await db.tradingBot.delete({ where: { id: botId } })
    return { message: '已删除' }
  })

  // 修改机器人配置
  app.put('/:botId', { preHandler: authGuard }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { botId } = request.params as any
    const { userId } = request.user as any
    const bot = await db.tradingBot.findFirst({ where: { id: botId, userId } })
    if (!bot) return reply.status(404).send({ error: '不存在' })

    const body = request.body as any
    await db.tradingBot.update({
      where: { id: botId },
      data: {
        name: body.name || bot.name,
        params: body.params || bot.params,
        riskParams: body.riskParams || bot.riskParams,
        symbols: body.symbols || bot.symbols,
        isPublic: body.isPublic ?? bot.isPublic,
      },
    })
    return { message: '已更新' }
  })
}
