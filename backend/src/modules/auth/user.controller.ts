import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { db } from '../../lib/db.js'
import crypto from 'crypto'

const bindHLSchema = z.object({
  hlAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, '无效的 HL 地址'),
  hlPrivateKey: z.string().min(1, '请输入私钥'),
})

// 加密函数 - AES-256-CBC，密钥通过 SHA-256 哈希确保正好 32 字节
function encrypt(text: string): string {
  const algorithm = 'aes-256-cbc'
  const rawKey = process.env.ENCRYPTION_KEY || 'default-key-for-dev'
  const key = crypto.createHash('sha256').update(rawKey).digest()
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(algorithm, key, iv)
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  return iv.toString('hex') + ':' + encrypted
}

export async function userRoutes(app: FastifyInstance) {
  // 获取用户 HL 余额（Perps + Spot）
  app.get('/hl-balance', {
    preHandler: async (request, reply) => {
      try {
        await request.jwtVerify()
      } catch (err) {
        reply.status(401).send({ error: '请先登录' })
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { userId } = request.user as { userId: string }
    const user = await db.user.findUnique({ where: { id: userId } })
    
    if (!user?.hlAddress) {
      return reply.status(400).send({ error: '请先绑定 HL 地址' })
    }
    
    try {
      const { copyTradeService } = await import('../copytrade/copytrade.service.js')
      const balance = await copyTradeService.getHLBalance(user.hlAddress)
      return balance
    } catch (err: any) {
      return reply.status(500).send({ error: 'HL 余额查询失败: ' + err.message })
    }
  })

  // 获取用户 HL 真实持仓（实时价格 + 实时 PnL）
  app.get('/hl-positions', {
    preHandler: async (request, reply) => {
      try { await request.jwtVerify() } catch { reply.status(401).send({ error: '请先登录' }) }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { userId } = request.user as { userId: string }
    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user?.hlAddress) return reply.status(400).send({ error: '请先绑定 HL 地址' })

    try {
      const { copyTradeService } = await import('../copytrade/copytrade.service.js')

      // 并行获取：perps清算状态 + spot清算状态 + 所有实时价格
      const [perpsState, spotState, allMids] = await Promise.all([
        copyTradeService.hlApiPost('clearinghouseState', { user: user.hlAddress }),
        copyTradeService.hlApiPost('spotClearinghouseState', { user: user.hlAddress }),
        copyTradeService.hlApiPost('allMids'),
      ])

      // Perps 持仓
      const perpsPositions = (perpsState.assetPositions || []).map((pos: any) => {
        const p = pos.position
        const coin = p.coin
        const size = parseFloat(p.szi || '0')
        const entryPx = parseFloat(p.entryPx || '0')
        const currentPx = parseFloat(allMids[coin] || '0')
        const unrealizedPnl = parseFloat(p.unrealizedPnl || '0')
        const leverage = parseFloat(p.leverage?.value || '1')
        const notional = Math.abs(size * currentPx)
        const pnlPct = notional > 0 ? (unrealizedPnl / (notional / leverage)) * 100 : 0
        return {
          coin, market: 'perps', direction: size > 0 ? 'LONG' : 'SHORT',
          size: Math.abs(size), entryPrice: entryPx, currentPrice: currentPx,
          pnl: unrealizedPnl, pnlPct: parseFloat(pnlPct.toFixed(2)),
          value: notional, leverage,
        }
      })

      // Spot 持仓 (非 USDC)
      // 需要 spotMeta 做 @index → coin name 映射
      let spotMeta: any = null
      try { spotMeta = await copyTradeService.hlApiPost('spotMeta') } catch {}
      const tokenMap = new Map<number, string>()
      const pairPriceMap: Record<string, number> = {}
      if (spotMeta?.tokens && spotMeta?.universe) {
        for (const t of spotMeta.tokens) tokenMap.set(t.index, t.name)
        for (const pair of spotMeta.universe) {
          if (pair.tokens?.length >= 2) {
            const baseName = tokenMap.get(pair.tokens[0])
            const mid = parseFloat(allMids[pair.name] || '0')
            if (baseName && mid > 0) pairPriceMap[baseName] = mid
          }
        }
      }

      const spotPositions = (spotState.balances || [])
        .filter((b: any) => {
          const coin = (b.coin || '').replace('-SPOT', '')
          return coin !== 'USDC' && parseFloat(b.total || '0') > 0.0001
        })
        .map((b: any) => {
          const coin = (b.coin || '').replace('-SPOT', '')
          const size = parseFloat(b.total || '0')
          const currentPx = pairPriceMap[coin] || parseFloat(allMids[coin] || '0')
          const entryNtl = parseFloat(b.entryNtl || '0')
          const value = size * currentPx
          const pnl = entryNtl > 0 ? value - entryNtl : 0
          const pnlPct = entryNtl > 0 ? (pnl / entryNtl) * 100 : 0
          return {
            coin, market: 'spot', direction: 'LONG' as const,
            size, entryPrice: entryNtl > 0 ? entryNtl / size : currentPx,
            currentPrice: currentPx, pnl, pnlPct: parseFloat(pnlPct.toFixed(2)),
            value,
          }
        })

      // 汇总
      const perpsAccountValue = parseFloat(perpsState.marginSummary?.accountValue || '0')
      const usdcSpot = spotState.balances?.find((b: any) => (b.coin || '') === 'USDC' || (b.coin || '') === 'USDC-SPOT')
      const spotUsdcTotal = usdcSpot ? parseFloat(usdcSpot.total || '0') : 0
      const spotPositionValue = spotPositions.reduce((s: number, p: any) => s + p.value, 0)
      const totalValue = perpsAccountValue + spotUsdcTotal + spotPositionValue
      const totalPnl = [...perpsPositions, ...spotPositions].reduce((s: number, p: any) => s + p.pnl, 0)

      return {
        positions: [...perpsPositions, ...spotPositions],
        perpsAccountValue,
        spotUsdcTotal,
        spotPositionValue,
        totalValue,
        totalPnl,
        totalPnlPct: totalValue > 0 ? parseFloat(((totalPnl / totalValue) * 100).toFixed(2)) : 0,
        updatedAt: new Date().toISOString(),
      }
    } catch (err: any) {
      return reply.status(500).send({ error: 'HL 持仓查询失败: ' + err.message })
    }
  })

  // 绑定 HL 地址
  app.post('/bindhl', {
    preHandler: async (request, reply) => {
      try {
        await request.jwtVerify()
      } catch (err) {
        reply.status(401).send({ error: '请先登录' })
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = bindHLSchema.parse(request.body)
      const { userId } = request.user as { userId: string }
      
      // 加密私钥
      const encryptedKey = encrypt(body.hlPrivateKey)
      
      // 更新用户信息
      const user = await db.user.update({
        where: { id: userId },
        data: {
          hlAddress: body.hlAddress.toLowerCase(),
          hlApiKey: encryptedKey,
        }
      })
      
      return {
        message: 'HL 地址绑定成功',
        hlAddress: user.hlAddress,
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors[0].message })
      }
      throw error
    }
  })
}
