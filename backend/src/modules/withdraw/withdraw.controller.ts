import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { db } from '../../lib/db.js'

const requestSchema = z.object({
  network: z.enum(['arbitrum', 'bsc']),
  toAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, '无效的钱包地址'),
  amount: z.number().positive('金额必须大于 0'),
})

const FEES: Record<string, number> = { arbitrum: 1, bsc: 0.5 }

export async function withdrawRoutes(app: FastifyInstance) {
  const authGuard = async (request: FastifyRequest, reply: FastifyReply) => {
    try { await request.jwtVerify() } catch { reply.status(401).send({ error: '请先登录' }) }
  }

  // 提现申请
  app.post('/request', { preHandler: authGuard }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = requestSchema.parse(request.body)
      const { userId } = request.user as { userId: string }
      const fee = FEES[body.network] || 1
      
      if (body.amount <= fee) {
        return reply.status(400).send({ error: `提现金额需大于手续费 ${fee} USDT` })
      }

      // 检查余额
      const user = await db.user.findUnique({ where: { id: userId } })
      if (!user || parseFloat(String(user.usdtBalance)) < body.amount) {
        return reply.status(400).send({ error: '余额不足' })
      }

      // 扣余额 + 创建记录
      const [_, record] = await db.$transaction([
        db.user.update({
          where: { id: userId },
          data: { usdtBalance: { decrement: body.amount } },
        }),
        db.withdrawRecord.create({
          data: {
            userId,
            network: body.network,
            amount: body.amount,
            fee: fee,
            receiveAmount: body.amount - fee,
            toAddress: body.toAddress.toLowerCase(),
            status: 'PENDING',
          },
        }),
      ])

      console.log(`📤 Withdraw request: ${body.amount} USDT to ${body.toAddress} via ${body.network} (user: ${userId})`)

      // TODO: 生产环境需要:
      // 1. 管理员审核流程
      // 2. 热钱包自动转账 (使用 viem + 私钥签名)
      // 3. 链上确认后更新状态

      return {
        message: '提现申请已提交',
        id: record.id,
        amount: body.amount,
        fee,
        receiveAmount: body.amount - fee,
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors[0].message })
      }
      throw error
    }
  })

  // 提现记录
  app.get('/history', { preHandler: authGuard }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { userId } = request.user as { userId: string }
    const records = await db.withdrawRecord.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
    return records.map(r => ({
      id: r.id,
      network: r.network,
      amount: r.amount.toString(),
      fee: r.fee.toString(),
      receiveAmount: r.receiveAmount.toString(),
      toAddress: r.toAddress,
      status: r.status,
      txHash: r.txHash,
      createdAt: r.createdAt,
    }))
  })
}
