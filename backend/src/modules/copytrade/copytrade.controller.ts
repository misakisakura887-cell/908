import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { copyTradeService } from './copytrade.service.js'

const followSchema = z.object({
  strategyId: z.string(),
  amount: z.number().positive('投入金额必须大于0'),
})

const authPreHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    await request.jwtVerify()
  } catch (err) {
    reply.status(401).send({ error: '请先登录' })
  }
}

export async function copyTradeRoutes(app: FastifyInstance) {
  // 跟单策略
  app.post('/follow', { preHandler: authPreHandler }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = followSchema.parse(request.body)
      const { userId } = request.user as { userId: string }
      
      const result = await copyTradeService.followStrategy(userId, body.strategyId, body.amount)
      return reply.status(201).send(result)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors[0].message })
      }
      if (error instanceof Error) {
        return reply.status(400).send({ error: error.message })
      }
      throw error
    }
  })

  // 获取我的跟单仓位
  app.get('/positions', { preHandler: authPreHandler }, async (request: FastifyRequest) => {
    const { userId } = request.user as { userId: string }
    return copyTradeService.getUserCopyTradePositions(userId)
  })

  // 暂停跟单
  app.post('/:id/pause', { preHandler: authPreHandler }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { userId } = request.user as { userId: string }
    const { id } = request.params as { id: string }
    
    try {
      const result = await copyTradeService.pauseCopyTrade(id, userId)
      return result
    } catch (error) {
      if (error instanceof Error) {
        return reply.status(400).send({ error: error.message })
      }
      throw error
    }
  })

  // 恢复跟单
  app.post('/:id/resume', { preHandler: authPreHandler }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { userId } = request.user as { userId: string }
    const { id } = request.params as { id: string }
    
    try {
      const result = await copyTradeService.resumeCopyTrade(id, userId)
      return result
    } catch (error) {
      if (error instanceof Error) {
        return reply.status(400).send({ error: error.message })
      }
      throw error
    }
  })

  // 停止跟单
  app.post('/:id/stop', { preHandler: authPreHandler }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { userId } = request.user as { userId: string }
    const { id } = request.params as { id: string }
    
    try {
      const result = await copyTradeService.stopCopyTrade(id, userId)
      return result
    } catch (error) {
      if (error instanceof Error) {
        return reply.status(400).send({ error: error.message })
      }
      throw error
    }
  })
}
