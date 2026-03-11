import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import rateLimit from '@fastify/rate-limit'
import fastifyStatic from '@fastify/static'
import fastifyHelmet from '@fastify/helmet'
import path from 'path'
import { fileURLToPath } from 'url'
import { authRoutes } from './modules/auth/auth.controller.js'
import { userRoutes } from './modules/auth/user.controller.js'
import { rampRoutes } from './modules/ramp/ramp.controller.js'
import { adminRoutes } from './modules/admin/admin.controller.js'
import { investRoutes } from './modules/invest/invest.controller.js'
import { marketRoutes } from './modules/market/market.controller.js'
import { strategyRoutes } from './modules/strategy/strategy.controller.js'
import { copyTradeRoutes } from './modules/copytrade/copytrade.controller.js'
import { depositRoutes } from './modules/deposit/deposit.controller.js'
import { withdrawRoutes } from './modules/withdraw/withdraw.controller.js'
import { walletRoutes } from './modules/wallet/wallet.controller.js'
import { walletService } from './modules/wallet/wallet.service.js'
import { botsRoutes } from './modules/bots/bots.controller.js'
import { botManager } from './modules/bots/bot-manager.js'
import { priceService } from './modules/ramp/price.service.js'
import { copyTradeService } from './modules/copytrade/copytrade.service.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const isProd = process.env.NODE_ENV === 'production'

// 允许的域名列表
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'http://192.168.2.108:3000',
  'http://192.168.2.108:3001',
  'http://192.168.2.108:5173',
  'http://192.168.2.156:3000',
  // 生产环境添加真实域名
  ...(process.env.ALLOWED_ORIGINS?.split(',') || []),
]

const app = Fastify({ 
  logger: {
    level: isProd ? 'warn' : 'info',
    // 生产环境脱敏
    redact: isProd ? ['req.headers.authorization', 'req.body.password'] : [],
  },
  // 请求 ID
  requestIdHeader: 'x-request-id',
  genReqId: () => `req-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
})

// 安全头 (Helmet)
await app.register(fastifyHelmet, {
  contentSecurityPolicy: isProd ? undefined : false, // 开发环境禁用 CSP
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // 允许跨域加载资源
})

// CORS - 限制允许的来源
await app.register(cors, { 
  origin: (origin, cb) => {
    // 允许无 origin (如 curl, 服务端请求)
    if (!origin) return cb(null, true)
    if (ALLOWED_ORIGINS.includes(origin)) {
      return cb(null, true)
    }
    // 开发环境允许所有 localhost
    if (!isProd && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
      return cb(null, true)
    }
    return cb(new Error('Not allowed by CORS'), false)
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
})

// JWT - 确保使用强密钥
const jwtSecret = process.env.JWT_SECRET
if (!jwtSecret || jwtSecret.length < 32) {
  console.error('❌ JWT_SECRET 未设置或过短 (需要至少32字符)')
  process.exit(1)
}
await app.register(jwt, { secret: jwtSecret })

// Rate Limiting - 分层限制
await app.register(rateLimit, { 
  global: true,
  max: 60,  // 默认每分钟 60 次
  timeWindow: '1 minute',
  // 自定义限制
  keyGenerator: (request) => {
    // 优先使用 X-Forwarded-For (反向代理场景)
    const forwarded = request.headers['x-forwarded-for']
    const ip = typeof forwarded === 'string' 
      ? forwarded.split(',')[0].trim() 
      : request.ip
    return ip
  },
  errorResponseBuilder: (request, context) => ({
    error: '请求过于频繁，请稍后再试',
    retryAfter: context.after,
  }),
})

// 静态文件
await app.register(fastifyStatic, {
  root: path.join(__dirname, '../public'),
  prefix: '/public/',
})

// 全局错误处理 - 避免信息泄露
app.setErrorHandler((error, request, reply) => {
  const statusCode = error.statusCode || 500
  
  // 记录完整错误
  app.log.error({
    err: error,
    reqId: request.id,
    url: request.url,
    method: request.method,
  })
  
  // 返回安全的错误信息
  if (isProd && statusCode === 500) {
    return reply.status(500).send({ error: '服务器内部错误' })
  }
  
  return reply.status(statusCode).send({
    error: error.message || '请求处理失败',
  })
})

// Routes
await app.register(authRoutes, { prefix: '/api/auth' })
await app.register(userRoutes, { prefix: '/api/user' })
await app.register(rampRoutes, { prefix: '/api/ramp' })
await app.register(adminRoutes, { prefix: '/api/admin' })
await app.register(investRoutes, { prefix: '/api/invest' })
await app.register(marketRoutes, { prefix: '/api/market' })
await app.register(strategyRoutes, { prefix: '/api/strategy' })
await app.register(copyTradeRoutes, { prefix: '/api/copytrade' })
await app.register(depositRoutes, { prefix: '/api/deposit' })
await app.register(withdrawRoutes, { prefix: '/api/withdraw' })
await app.register(walletRoutes, { prefix: '/api/wallet' })
await app.register(botsRoutes, { prefix: '/api/bots' })

// Health check
app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }))

// Initialize hot wallet
walletService.initialize()

// Start price fetcher
priceService.startPriceFetcher()

// Auto-process withdrawals every 5 minutes
setInterval(async () => {
  try {
    await walletService.processWithdrawals()
  } catch (error) {
    console.error('Failed to process withdrawals:', error)
  }
}, 5 * 60 * 1000)

// 增量同步定时任务（每 15 分钟）
// 架构：1 次 API 调用查策略变化 → 有变化时批量通知所有 follower
// 成本：固定 4 次 HL API call/15min（不随用户数增长）
const SYNC_INTERVAL = 15 * 60 * 1000 // 15 minutes
setInterval(async () => {
  try {
    await copyTradeService.incrementalSync()
  } catch (error) {
    console.error('Incremental sync failed:', error)
  }
}, SYNC_INTERVAL)

// Initial sync on startup
copyTradeService.syncLongtouPositions().catch(console.error)

// Start server
const port = parseInt(process.env.PORT || '3000')
const host = process.env.HOST || '0.0.0.0'

try {
  await app.listen({ port, host })
  console.log(`🚀 Server running at http://${host}:${port}`)
  console.log(`🔒 CORS allowed origins: ${ALLOWED_ORIGINS.join(', ')}`)
} catch (err) {
  app.log.error(err)
  process.exit(1)
}
