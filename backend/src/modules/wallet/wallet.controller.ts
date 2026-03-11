import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { walletService } from './wallet.service.js'
import { db } from '../../lib/db.js'

export async function walletRoutes(app: FastifyInstance) {
  const adminGuard = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify()
      const { userId } = request.user as { userId: string }
      const user = await db.user.findUnique({ where: { id: userId } })
      if (!user?.isAdmin) {
        reply.status(403).send({ error: '需要管理员权限' })
      }
    } catch {
      reply.status(401).send({ error: '请先登录' })
    }
  }

  // 热钱包状态 (管理员)
  app.get('/status', { preHandler: adminGuard }, async () => {
    return walletService.getStatus()
  })

  // 手动触发提现处理 (管理员)
  app.post('/process-withdrawals', { preHandler: adminGuard }, async () => {
    await walletService.processWithdrawals()
    return { message: '提现处理已触发' }
  })

  // 待处理提现列表 (管理员)
  app.get('/pending-withdrawals', { preHandler: adminGuard }, async () => {
    const records = await db.withdrawRecord.findMany({
      where: { status: { in: ['PENDING', 'AWAITING_FUNDS'] } },
      orderBy: { createdAt: 'asc' },
      include: { user: { select: { walletAddress: true } } },
    })
    return records.map(r => ({
      id: r.id,
      walletAddress: r.user.walletAddress,
      network: r.network,
      amount: r.amount.toString(),
      fee: r.fee.toString(),
      receiveAmount: r.receiveAmount.toString(),
      toAddress: r.toAddress,
      status: r.status,
      createdAt: r.createdAt,
    }))
  })
}
