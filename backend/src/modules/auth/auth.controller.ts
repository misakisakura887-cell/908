import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { authService } from './auth.service.js'

const sendCodeSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址').max(255),
})

const verifyCodeSchema = z.object({
  email: z.string().email().max(255),
  code: z.string().length(6, '验证码为6位数字').regex(/^\d{6}$/, '验证码必须是6位数字'),
})

const nonceSchema = z.object({
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, '无效的钱包地址'),
})

const walletLoginSchema = z.object({
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, '无效的钱包地址'),
  signature: z.string(),
  message: z.string(),
})

// 认证端点的更严格 rate limiting 配置
const authRateLimitConfig = {
  max: 5,  // 每分钟最多 5 次
  timeWindow: '1 minute',
  errorResponseBuilder: () => ({
    error: '请求过于频繁，请稍后再试',
  }),
}

// 验证码发送的更严格限制
const sendCodeRateLimitConfig = {
  max: 3,  // 每分钟最多 3 次发送验证码
  timeWindow: '1 minute',
  errorResponseBuilder: () => ({
    error: '验证码发送过于频繁，请稍后再试',
  }),
}

export async function authRoutes(app: FastifyInstance) {
  // 发送验证码 - 严格限流
  app.post('/send-code', {
    config: { rateLimit: sendCodeRateLimitConfig }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = sendCodeSchema.parse(request.body)
      
      const result = await authService.sendVerificationCode(body.email)
      
      if (!result.success) {
        return reply.status(429).send({ error: result.error })
      }
      
      return { message: '验证码已发送' }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors[0].message })
      }
      throw error
    }
  })

  // 验证码登录 - 防暴力破解
  app.post('/verify', {
    config: { rateLimit: authRateLimitConfig }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = verifyCodeSchema.parse(request.body)
      
      const result = await authService.verifyCode(body.email, body.code)
      
      if (!result.success) {
        // 延迟响应，防止时序攻击
        await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500))
        return reply.status(401).send({ error: '验证码错误或已过期' })
      }
      
      // 生成 JWT
      const token = app.jwt.sign(
        { userId: result.user!.id, email: result.user!.email },
        { expiresIn: '7d' }
      )
      
      return {
        token,
        user: {
          id: result.user!.id,
          email: result.user!.email,
          usdtBalance: result.user!.usdtBalance.toString(),
        }
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors[0].message })
      }
      throw error
    }
  })

  // 获取当前用户
  app.get('/me', {
    preHandler: async (request, reply) => {
      try {
        await request.jwtVerify()
      } catch (err) {
        reply.status(401).send({ error: '请先登录' })
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { userId } = request.user as { userId: string }
    const user = await authService.getUserById(userId)
    
    if (!user) {
      return reply.status(404).send({ error: '用户不存在' })
    }
    
    // 如果已绑定 HL，查询 HL 账户余额
    let hlBalance = null
    let hlPositions: any[] = []
    if (user.hlAddress && user.hlApiKey) {
      try {
        const { Hyperliquid } = await import('hyperliquid')
        const sdk = new Hyperliquid({ enableWs: false })
        const state = await sdk.info.perpetuals.getClearinghouseState(user.hlAddress)
        hlBalance = {
          accountValue: state.marginSummary?.accountValue || '0',
          withdrawable: state.withdrawable || '0',
          marginUsed: state.marginSummary?.totalMarginUsed || '0',
        }
        hlPositions = (state.assetPositions || []).map((p: any) => ({
          coin: p.position.coin,
          size: parseFloat(p.position.szi || '0'),
          entryPrice: parseFloat(p.position.entryPx || '0'),
          unrealizedPnl: parseFloat(p.position.unrealizedPnl || '0'),
          leverage: p.position.leverage?.value || '1',
        })).filter((p: any) => p.size !== 0)
      } catch (err) {
        console.error('Failed to fetch HL balance:', err)
      }
    }
    
    return {
      id: user.id,
      email: user.email,
      walletAddress: user.walletAddress,
      hlAddress: user.hlAddress,
      usdtBalance: user.usdtBalance.toString(),
      hlBalance,
      hlPositions,
      createdAt: user.createdAt,
    }
  })

  // 获取钱包登录的 nonce
  app.post('/nonce', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = nonceSchema.parse(request.body)
      const nonce = await authService.generateNonce(body.walletAddress)
      return { message: nonce }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors[0].message })
      }
      throw error
    }
  })

  // 钱包登录
  app.post('/wallet-login', {
    config: { rateLimit: authRateLimitConfig }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = walletLoginSchema.parse(request.body)
      
      const result = await authService.verifyWalletSignature(
        body.walletAddress,
        body.message,
        body.signature
      )
      
      if (!result.success) {
        await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500))
        return reply.status(401).send({ error: '签名验证失败' })
      }
      
      // 生成 JWT
      const token = app.jwt.sign(
        { userId: result.user!.id, walletAddress: result.user!.walletAddress },
        { expiresIn: '7d' }
      )
      
      return {
        token,
        user: {
          id: result.user!.id,
          walletAddress: result.user!.walletAddress,
          email: result.user!.email,
          hlAddress: result.user!.hlAddress,
          usdtBalance: result.user!.usdtBalance.toString(),
        }
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors[0].message })
      }
      throw error
    }
  })
}
