import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { db } from '../../lib/db.js'

// Admin 认证：检查 admin cookie 或 header
const adminAuth = async (request: FastifyRequest, reply: FastifyReply) => {
  const authHeader = request.headers['x-admin-token'] || request.headers.authorization?.replace('Bearer ', '')
  if (authHeader !== 'admin-mirror-2026') {
    // 也检查 JWT 用户是否 isAdmin
    try {
      await request.jwtVerify()
      const { userId } = request.user as { userId: string }
      const user = await db.user.findUnique({ where: { id: userId } })
      if (!user?.isAdmin) throw new Error('not admin')
    } catch {
      return reply.status(403).send({ error: '管理员权限不足' })
    }
  }
}

export async function adminRoutes(app: FastifyInstance) {
  
  // ============ 管理员登录 ============
  app.post('/login', async (request: FastifyRequest, reply: FastifyReply) => {
    const { username, password } = request.body as { username: string; password: string }
    if (username === 'admin' && password === 'admin') {
      return { token: 'admin-mirror-2026', message: '登录成功' }
    }
    return reply.status(401).send({ error: '用户名或密码错误' })
  })

  // ============ 仪表盘 ============
  app.get('/dashboard', { preHandler: adminAuth }, async () => {
    const [
      totalUsers,
      hlBoundUsers,
      activeCopyTrades,
      totalTradeLogs,
      todayTradeLogs,
      recentErrors,
    ] = await Promise.all([
      db.user.count(),
      db.user.count({ where: { hlAddress: { not: null } } }),
      db.copyTrade.count({ where: { status: 'active' } }),
      db.tradeLog.count(),
      db.tradeLog.count({ where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } }),
      db.tradeLog.count({ where: { status: { in: ['error', 'rejected'] }, createdAt: { gte: new Date(Date.now() - 24 * 3600 * 1000) } } }),
    ])

    // 最近策略同步
    const lastSync = await db.strategySnapshot.findFirst({ where: { strategyId: 'longtou' }, orderBy: { createdAt: 'desc' } })
    
    return {
      users: { total: totalUsers, hlBound: hlBoundUsers },
      copyTrades: { active: activeCopyTrades },
      tradeLogs: { total: totalTradeLogs, today: todayTradeLogs, recentErrors },
      lastSync: lastSync ? { time: lastSync.createdAt, totalValue: lastSync.totalValue.toString() } : null,
    }
  })

  // ============ 用户管理 ============
  app.get('/users', { preHandler: adminAuth }, async (request: FastifyRequest) => {
    const { page = '1', limit = '20' } = request.query as Record<string, string>
    const skip = (parseInt(page) - 1) * parseInt(limit)
    
    const [users, total] = await Promise.all([
      db.user.findMany({
        skip, take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, walletAddress: true, hlAddress: true, email: true,
          usdtBalance: true, isAdmin: true, isBlocked: true, createdAt: true,
          _count: { select: { copyTrades: true, tradeLogs: true } },
        },
      }),
      db.user.count(),
    ])
    
    return { users, total, page: parseInt(page), limit: parseInt(limit) }
  })

  app.get('/users/:userId', { preHandler: adminAuth }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { userId } = request.params as { userId: string }
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true, walletAddress: true, hlAddress: true, email: true,
        usdtBalance: true, isAdmin: true, isBlocked: true, createdAt: true, updatedAt: true,
        copyTrades: { orderBy: { createdAt: 'desc' } },
        tradeLogs: { orderBy: { createdAt: 'desc' }, take: 50 },
        balanceSnapshots: { orderBy: { createdAt: 'desc' }, take: 30 },
      },
    })
    if (!user) return reply.status(404).send({ error: '用户不存在' })
    return user
  })

  // ============ 交易审计日志 ============
  app.get('/trade-logs', { preHandler: adminAuth }, async (request: FastifyRequest) => {
    const { page = '1', limit = '50', userId, status, coin } = request.query as Record<string, string>
    const skip = (parseInt(page) - 1) * parseInt(limit)
    
    const where: any = {}
    if (userId) where.userId = userId
    if (status) where.status = status
    if (coin) where.coin = { contains: coin, mode: 'insensitive' }
    
    const [logs, total] = await Promise.all([
      db.tradeLog.findMany({
        where, skip, take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { walletAddress: true, hlAddress: true } } },
      }),
      db.tradeLog.count({ where }),
    ])
    
    return { logs, total, page: parseInt(page), limit: parseInt(limit) }
  })

  // ============ 跟单管理 ============
  app.get('/copy-trades', { preHandler: adminAuth }, async (request: FastifyRequest) => {
    const { status } = request.query as Record<string, string>
    const where: any = {}
    if (status) where.status = status
    
    const trades = await db.copyTrade.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { walletAddress: true, hlAddress: true } } },
    })
    return trades
  })

  // ============ 策略快照 ============
  app.get('/snapshots', { preHandler: adminAuth }, async (request: FastifyRequest) => {
    const { limit = '20' } = request.query as Record<string, string>
    const snapshots = await db.strategySnapshot.findMany({
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
    })
    return snapshots
  })

  // ============ 导出 CSV ============
  app.get('/trade-logs/export', { preHandler: adminAuth }, async (request: FastifyRequest, reply: FastifyReply) => {
    const logs = await db.tradeLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10000,
      include: { user: { select: { walletAddress: true, hlAddress: true } } },
    })
    
    const header = 'time,userId,wallet,hlAddress,trigger,coin,market,side,requestedSz,requestedPx,filledSz,filledPx,hlOid,status,error\n'
    const rows = logs.map(l => 
      `${l.createdAt.toISOString()},${l.userId},${(l.user as any)?.walletAddress || ''},${(l.user as any)?.hlAddress || ''},${l.trigger},${l.coin},${l.market},${l.side},${l.requestedSz},${l.requestedPx},${l.filledSz || ''},${l.filledPx || ''},${l.hlOid || ''},${l.status},${l.errorMsg || ''}`
    ).join('\n')
    
    reply.header('Content-Type', 'text/csv')
    reply.header('Content-Disposition', 'attachment; filename=trade-logs.csv')
    return header + rows
  })
}
