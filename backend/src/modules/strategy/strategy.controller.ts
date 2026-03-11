import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { strategyService } from './strategy.service.js'

const createStrategySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  type: z.enum(['custom', 'quant', 'manual']).optional(),
  rules: z.any().optional(),
  riskParams: z.any().optional(),
  universe: z.any().optional(),
})

const updateStrategySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  status: z.enum(['draft', 'active', 'paused', 'archived']).optional(),
  rules: z.any().optional(),
  riskParams: z.any().optional(),
  universe: z.any().optional(),
})

const createSignalSchema = z.object({
  type: z.enum(['entry', 'exit', 'alert']),
  direction: z.enum(['long', 'short']).optional(),
  symbol: z.string(),
  price: z.number().optional(),
  quantity: z.number().optional(),
  reason: z.string().optional(),
})

const parseRuleSchema = z.object({
  description: z.string().min(10),
})

const authPreHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    await request.jwtVerify()
  } catch (err) {
    reply.status(401).send({ error: '请先登录' })
  }
}

export async function strategyRoutes(app: FastifyInstance) {
  // ============ 公开接口 ============

  // 获取公开策略列表
  app.get('/public', async (request: FastifyRequest) => {
    const { limit } = request.query as { limit?: number }
    return strategyService.getPublicStrategies(limit || 20)
  })

  // 获取策略详情（公开）
  app.get('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string }
    let userId: string | undefined

    try {
      await request.jwtVerify()
      userId = (request.user as any).userId
    } catch {}

    const strategy = await strategyService.getStrategy(id, userId)
    if (!strategy) {
      return reply.status(404).send({ error: '策略不存在' })
    }
    return strategy
  })

  // ============ Strategy Owner 接口 ============

  // 获取我的策略
  app.get('/my', { preHandler: authPreHandler }, async (request: FastifyRequest) => {
    const { userId } = request.user as { userId: string }
    return strategyService.getMyStrategies(userId)
  })

  // 创建策略
  app.post('/', { preHandler: authPreHandler }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { userId } = request.user as { userId: string }
    const body = createStrategySchema.parse(request.body)

    try {
      const strategy = await strategyService.createStrategy(userId, body)
      return reply.status(201).send(strategy)
    } catch (e: any) {
      return reply.status(400).send({ error: e.message })
    }
  })

  // 更新策略
  app.patch('/:id', { preHandler: authPreHandler }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { userId } = request.user as { userId: string }
    const { id } = request.params as { id: string }
    const body = updateStrategySchema.parse(request.body)

    try {
      const strategy = await strategyService.updateStrategy(id, userId, body)
      return strategy
    } catch (e: any) {
      return reply.status(400).send({ error: e.message })
    }
  })

  // 删除策略
  app.delete('/:id', { preHandler: authPreHandler }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { userId } = request.user as { userId: string }
    const { id } = request.params as { id: string }

    try {
      await strategyService.deleteStrategy(id, userId)
      return { message: '删除成功' }
    } catch (e: any) {
      return reply.status(400).send({ error: e.message })
    }
  })

  // 激活策略
  app.post('/:id/activate', { preHandler: authPreHandler }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { userId } = request.user as { userId: string }
    const { id } = request.params as { id: string }

    try {
      const strategy = await strategyService.activateStrategy(id, userId)
      return strategy
    } catch (e: any) {
      return reply.status(400).send({ error: e.message })
    }
  })

  // 暂停策略
  app.post('/:id/pause', { preHandler: authPreHandler }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { userId } = request.user as { userId: string }
    const { id } = request.params as { id: string }

    try {
      const strategy = await strategyService.pauseStrategy(id, userId)
      return strategy
    } catch (e: any) {
      return reply.status(400).send({ error: e.message })
    }
  })

  // ============ 信号管理 ============

  // 获取策略信号
  app.get('/:id/signals', async (request: FastifyRequest) => {
    const { id } = request.params as { id: string }
    const { limit } = request.query as { limit?: number }
    return strategyService.getSignals(id, limit)
  })

  // 创建信号
  app.post('/:id/signals', { preHandler: authPreHandler }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { userId } = request.user as { userId: string }
    const { id } = request.params as { id: string }
    const body = createSignalSchema.parse(request.body)

    try {
      const signal = await strategyService.createSignal(id, userId, body)
      return reply.status(201).send(signal)
    } catch (e: any) {
      return reply.status(400).send({ error: e.message })
    }
  })

  // 执行信号
  app.post('/signals/:signalId/execute', { preHandler: authPreHandler }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { userId } = request.user as { userId: string }
    const { signalId } = request.params as { signalId: string }

    try {
      const signal = await strategyService.executeSignal(signalId, userId)
      return signal
    } catch (e: any) {
      return reply.status(400).send({ error: e.message })
    }
  })

  // ============ AI 功能 ============

  // 解析自然语言规则
  app.post('/parse-rule', { preHandler: authPreHandler }, async (request: FastifyRequest) => {
    const body = parseRuleSchema.parse(request.body)
    return strategyService.parseNaturalLanguageRule(body.description)
  })

  // ============ 龙头多头策略 ============

  // 获取龙头多头策略的仓位
  app.get('/longtou/positions', async (request: FastifyRequest) => {
    return strategyService.getLongtouPositions()
  })
}
