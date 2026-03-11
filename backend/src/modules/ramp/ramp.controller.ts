import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import Decimal from 'decimal.js'
import { rampService } from './ramp.service.js'
import { priceService } from './price.service.js'

const depositSchema = z.object({
  cnyAmount: z.number().positive(),
  paymentMethod: z.enum(['WECHAT', 'ALIPAY']),
})

const withdrawSchema = z.object({
  usdtAmount: z.number().positive(),
  paymentMethod: z.enum(['WECHAT', 'ALIPAY']),
  paymentInfo: z.object({
    account: z.string().min(1),
    name: z.string().min(1),
  }),
})

// Auth middleware
const authPreHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    await request.jwtVerify()
  } catch (err) {
    reply.status(401).send({ error: '请先登录' })
  }
}

export async function rampRoutes(app: FastifyInstance) {
  // 获取当前价格
  app.get('/price', async () => {
    const price = await priceService.getCurrentPrice()
    
    if (!price) {
      return { error: '价格服务暂不可用' }
    }
    
    return {
      buyPrice: price.buyPrice.toFixed(4),   // 用户入金用
      sellPrice: price.sellPrice.toFixed(4), // 用户出金用
      updatedAt: price.updatedAt,
    }
  })

  // 创建入金订单
  app.post('/deposit', { preHandler: authPreHandler }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { userId } = request.user as { userId: string }
    const body = depositSchema.parse(request.body)
    
    const result = await rampService.createDepositOrder(
      userId,
      new Decimal(body.cnyAmount),
      body.paymentMethod
    )
    
    if (!result.success) {
      return reply.status(400).send({ error: result.error })
    }
    
    return result.order
  })

  // 标记入金已付款
  app.post('/deposit/:id/paid', { preHandler: authPreHandler }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { userId } = request.user as { userId: string }
    const { id } = request.params as { id: string }
    
    const result = await rampService.markDepositPaid(userId, id)
    
    if (!result.success) {
      return reply.status(400).send({ error: result.error })
    }
    
    return { message: '已标记付款，等待确认' }
  })

  // 创建出金订单
  app.post('/withdraw', { preHandler: authPreHandler }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { userId } = request.user as { userId: string }
    const body = withdrawSchema.parse(request.body)
    
    const result = await rampService.createWithdrawOrder(
      userId,
      new Decimal(body.usdtAmount),
      body.paymentMethod,
      body.paymentInfo
    )
    
    if (!result.success) {
      return reply.status(400).send({ error: result.error })
    }
    
    return result.order
  })

  // 查询订单列表
  app.get('/orders', { preHandler: authPreHandler }, async (request: FastifyRequest) => {
    const { userId } = request.user as { userId: string }
    const { limit = '20', offset = '0' } = request.query as { limit?: string; offset?: string }
    
    return rampService.getUserOrders(userId, parseInt(limit), parseInt(offset))
  })

  // 查询订单详情
  app.get('/orders/:id', { preHandler: authPreHandler }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { userId } = request.user as { userId: string }
    const { id } = request.params as { id: string }
    
    const order = await rampService.getOrderById(userId, id)
    
    if (!order) {
      return reply.status(404).send({ error: '订单不存在' })
    }
    
    return {
      id: order.id,
      orderNo: order.orderNo,
      type: order.type,
      status: order.status,
      cnyAmount: order.cnyAmount.toString(),
      usdtAmount: order.usdtAmount.toString(),
      rate: order.rate.toString(),
      fee: order.fee.toString(),
      paymentMethod: order.paymentMethod,
      expiresAt: order.expiresAt,
      createdAt: order.createdAt,
      paidAt: order.paidAt,
      completedAt: order.completedAt,
    }
  })
}
