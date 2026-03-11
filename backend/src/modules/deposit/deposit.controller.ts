import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { db } from '../../lib/db.js'
import Decimal from 'decimal.js'

const notifySchema = z.object({
  txHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/, '无效的交易哈希'),
  network: z.enum(['arbitrum', 'bsc']),
  amount: z.string().min(1),
  fromAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, '无效的地址'),
})

// 平台收款地址
const PLATFORM_WALLET = '0x12fb87606b61bbF1b886262f4215e0ba52ba2F5E'.toLowerCase()

export async function depositRoutes(app: FastifyInstance) {
  // 充值通知
  app.post('/notify', {
    preHandler: async (request, reply) => {
      try {
        await request.jwtVerify()
      } catch (err) {
        reply.status(401).send({ error: '请先登录' })
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = notifySchema.parse(request.body)
      const { userId } = request.user as { userId: string }
      
      // 检查是否已处理过此交易
      const existing = await db.depositRecord.findUnique({
        where: { txHash: body.txHash }
      })
      if (existing) {
        return reply.status(400).send({ error: '此交易已处理' })
      }

      const depositAmount = new Decimal(body.amount)
      if (depositAmount.lte(0)) {
        return reply.status(400).send({ error: '无效金额' })
      }

      // 记录充值 (状态: pending, 等待链上验证)
      const record = await db.depositRecord.create({
        data: {
          userId,
          txHash: body.txHash,
          network: body.network,
          amount: depositAmount,
          fromAddress: body.fromAddress.toLowerCase(),
          toAddress: PLATFORM_WALLET,
          status: 'PENDING',
        }
      })

      // TODO: 生产环境需要链上验证 (监听 event / 调 RPC 确认转账)
      // MVP 阶段: 先信任前端通知，直接入账
      await db.$transaction([
        db.user.update({
          where: { id: userId },
          data: {
            usdtBalance: { increment: depositAmount },
          },
        }),
        db.depositRecord.update({
          where: { id: record.id },
          data: { status: 'COMPLETED', confirmedAt: new Date() },
        }),
      ])

      console.log(`✅ Deposit: ${body.amount} USDT from ${body.fromAddress} via ${body.network} (tx: ${body.txHash})`)

      return {
        message: '充值成功',
        amount: body.amount,
        txHash: body.txHash,
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors[0].message })
      }
      throw error
    }
  })

  // 充值记录
  app.get('/history', {
    preHandler: async (request, reply) => {
      try {
        await request.jwtVerify()
      } catch (err) {
        reply.status(401).send({ error: '请先登录' })
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { userId } = request.user as { userId: string }
    
    const records = await db.depositRecord.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return records.map(r => ({
      id: r.id,
      txHash: r.txHash,
      network: r.network,
      amount: r.amount.toString(),
      status: r.status,
      createdAt: r.createdAt,
      confirmedAt: r.confirmedAt,
    }))
  })
}
