import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import Decimal from 'decimal.js'
import { investService } from './invest.service.js'

const investSchema = z.object({
  strategyId: z.string(),
  amount: z.number().positive(),
})

const withdrawSchema = z.object({
  strategyId: z.string(),
  amount: z.number().positive(),
})

const authPreHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    await request.jwtVerify()
  } catch (err) {
    reply.status(401).send({ error: '请先登录' })
  }
}

export async function investRoutes(app: FastifyInstance) {
  // 获取持仓
  app.get('/positions', { preHandler: authPreHandler }, async (request: FastifyRequest) => {
    const { userId } = request.user as { userId: string }
    return investService.getPositions(userId)
  })

  // 获取投资概览
  app.get('/summary', { preHandler: authPreHandler }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { userId } = request.user as { userId: string }
    const summary = await investService.getSummary(userId)
    if (!summary) {
      return reply.status(404).send({ error: '用户不存在' })
    }
    return summary
  })

  // 跟投
  app.post('/invest', { preHandler: authPreHandler }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { userId } = request.user as { userId: string }
    const body = investSchema.parse(request.body)
    
    const result = await investService.invest(
      userId,
      body.strategyId,
      new Decimal(body.amount)
    )
    
    if (!result.success) {
      return reply.status(400).send({ error: result.error })
    }
    
    return { message: '投资成功' }
  })

  // 赎回
  app.post('/withdraw', { preHandler: authPreHandler }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { userId } = request.user as { userId: string }
    const body = withdrawSchema.parse(request.body)
    
    const result = await investService.withdraw(
      userId,
      body.strategyId,
      new Decimal(body.amount)
    )
    
    if (!result.success) {
      return reply.status(400).send({ error: result.error })
    }
    
    return { message: '赎回成功' }
  })

  // 获取策略列表
  app.get('/strategies', async () => {
    return [
      {
        id: '1',
        name: '黄金量化策略',
        description: 'AI 驱动的黄金期货量化交易，适合稳健型投资者',
        return7d: 12.3,
        return30d: 34.1,
        riskLevel: 1,
        followers: 342,
        minInvest: 1,
      },
      {
        id: '2',
        name: 'BTC 量化策略',
        description: '加密货币智能量化策略，捕捉 BTC 趋势机会',
        return7d: 8.7,
        return30d: 22.5,
        riskLevel: 2,
        followers: 567,
        minInvest: 1,
      },
      {
        id: 'longtou',
        name: '龙头多头策略',
        description: '基金经理金明主理，实时跟单 Hyperliquid 仓位',
        return7d: 15.2,
        return30d: 38.6,
        riskLevel: 2,
        followers: 189,
        minInvest: 1,
      },
    ]
  })
}
