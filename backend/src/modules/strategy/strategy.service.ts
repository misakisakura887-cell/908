/**
 * Strategy Owner 策略服务
 * 
 * 第二层：策略层 - AI 帮你把直觉变成规则
 * 第三层：执行层 - AI 帮你消灭情绪
 */

import { db } from '../../lib/db.js'
import { redis } from '../../lib/redis.js'
import Decimal from 'decimal.js'

interface CreateStrategyInput {
  name: string
  description?: string
  type?: string
  rules?: any
  riskParams?: any
  universe?: any
}

interface UpdateStrategyInput {
  name?: string
  description?: string
  status?: string
  rules?: any
  riskParams?: any
  universe?: any
}

// 安全: 限制 JSON 字段的大小和深度
const MAX_JSON_SIZE = 10000 // 10KB
const MAX_JSON_DEPTH = 5

function validateJsonField(value: any, fieldName: string): void {
  if (value === null || value === undefined) return
  
  const json = JSON.stringify(value)
  if (json.length > MAX_JSON_SIZE) {
    throw new Error(`${fieldName} 数据过大 (最大 ${MAX_JSON_SIZE} 字符)`)
  }
  
  // 检查深度
  function checkDepth(obj: any, depth: number): void {
    if (depth > MAX_JSON_DEPTH) {
      throw new Error(`${fieldName} 嵌套层级过深 (最大 ${MAX_JSON_DEPTH} 层)`)
    }
    if (typeof obj === 'object' && obj !== null) {
      for (const key in obj) {
        checkDepth(obj[key], depth + 1)
      }
    }
  }
  checkDepth(value, 0)
  
  // 检查是否包含危险字符串 (防注入)
  const dangerousPatterns = [
    /__proto__/i,
    /constructor/i,
    /prototype/i,
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
  ]
  
  for (const pattern of dangerousPatterns) {
    if (pattern.test(json)) {
      throw new Error(`${fieldName} 包含不允许的内容`)
    }
  }
}

// 安全: 验证 UUID 格式
function validateUUID(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id) ||
         /^[a-z0-9]{25}$/i.test(id) // cuid 格式
}

// ============ 策略管理 ============

export const strategyService = {
  // 获取用户的策略列表
  async getMyStrategies(userId: string) {
    if (!validateUUID(userId)) throw new Error('无效的用户 ID')
    
    return db.strategy.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: 'desc' },
      take: 100, // 限制返回数量
    })
  },

  // 获取单个策略详情
  async getStrategy(id: string, userId?: string) {
    if (!validateUUID(id)) return null
    
    const strategy = await db.strategy.findUnique({
      where: { id },
      include: {
        owner: {
          select: { id: true, email: true },
        },
      },
    })

    if (!strategy) return null

    // 非 owner 只能看到 active 策略
    if (userId !== strategy.ownerId && strategy.status !== 'active') {
      return null
    }

    return strategy
  },

  // 创建策略
  async createStrategy(userId: string, input: CreateStrategyInput) {
    if (!validateUUID(userId)) throw new Error('无效的用户 ID')
    
    // 验证输入
    if (!input.name || input.name.length > 100) {
      throw new Error('策略名称无效')
    }
    if (input.description && input.description.length > 1000) {
      throw new Error('策略描述过长')
    }
    
    // 验证 JSON 字段
    validateJsonField(input.rules, 'rules')
    validateJsonField(input.riskParams, 'riskParams')
    validateJsonField(input.universe, 'universe')
    
    // 检查用户是否是 Strategy Owner
    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) throw new Error('用户不存在')

    // 限制每个用户的策略数量
    const existingCount = await db.strategy.count({ where: { ownerId: userId } })
    if (existingCount >= 50) {
      throw new Error('策略数量已达上限')
    }

    // 自动升级为 Strategy Owner
    if (!user.isStrategyOwner) {
      await db.user.update({
        where: { id: userId },
        data: { isStrategyOwner: true },
      })
    }

    return db.strategy.create({
      data: {
        ownerId: userId,
        name: input.name.trim(),
        description: input.description?.trim(),
        type: ['custom', 'quant', 'manual'].includes(input.type || '') ? input.type : 'custom',
        rules: input.rules || null,
        riskParams: input.riskParams || null,
        universe: input.universe || null,
      },
    })
  },

  // 更新策略
  async updateStrategy(id: string, userId: string, input: UpdateStrategyInput) {
    if (!validateUUID(id) || !validateUUID(userId)) {
      throw new Error('无效的 ID')
    }
    
    const strategy = await db.strategy.findUnique({ where: { id } })
    if (!strategy) throw new Error('策略不存在')
    if (strategy.ownerId !== userId) throw new Error('无权修改此策略')
    
    // 验证输入
    if (input.name !== undefined) {
      if (!input.name || input.name.length > 100) {
        throw new Error('策略名称无效')
      }
    }
    if (input.description !== undefined && input.description.length > 1000) {
      throw new Error('策略描述过长')
    }
    
    // 验证 JSON 字段
    validateJsonField(input.rules, 'rules')
    validateJsonField(input.riskParams, 'riskParams')
    validateJsonField(input.universe, 'universe')

    return db.strategy.update({
      where: { id },
      data: {
        name: input.name?.trim(),
        description: input.description?.trim(),
        status: ['draft', 'active', 'paused', 'archived'].includes(input.status || '') 
          ? input.status 
          : undefined,
        rules: input.rules,
        riskParams: input.riskParams,
        universe: input.universe,
      },
    })
  },

  // 删除策略
  async deleteStrategy(id: string, userId: string) {
    if (!validateUUID(id) || !validateUUID(userId)) {
      throw new Error('无效的 ID')
    }
    
    const strategy = await db.strategy.findUnique({ where: { id } })
    if (!strategy) throw new Error('策略不存在')
    if (strategy.ownerId !== userId) throw new Error('无权删除此策略')

    // 软删除：改为归档
    return db.strategy.update({
      where: { id },
      data: { status: 'archived' },
    })
  },

  // 激活策略
  async activateStrategy(id: string, userId: string) {
    if (!validateUUID(id) || !validateUUID(userId)) {
      throw new Error('无效的 ID')
    }
    
    const strategy = await db.strategy.findUnique({ where: { id } })
    if (!strategy) throw new Error('策略不存在')
    if (strategy.ownerId !== userId) throw new Error('无权操作此策略')

    return db.strategy.update({
      where: { id },
      data: { status: 'active' },
    })
  },

  // 暂停策略
  async pauseStrategy(id: string, userId: string) {
    if (!validateUUID(id) || !validateUUID(userId)) {
      throw new Error('无效的 ID')
    }
    
    const strategy = await db.strategy.findUnique({ where: { id } })
    if (!strategy) throw new Error('策略不存在')
    if (strategy.ownerId !== userId) throw new Error('无权操作此策略')

    return db.strategy.update({
      where: { id },
      data: { status: 'paused' },
    })
  },

  // ============ 策略信号 ============

  // 创建信号
  async createSignal(strategyId: string, userId: string, signal: {
    type: string
    direction?: string
    symbol: string
    price?: number
    quantity?: number
    reason?: string
  }) {
    if (!validateUUID(strategyId) || !validateUUID(userId)) {
      throw new Error('无效的 ID')
    }
    
    // 验证输入
    if (!['entry', 'exit', 'alert'].includes(signal.type)) {
      throw new Error('无效的信号类型')
    }
    if (signal.direction && !['long', 'short'].includes(signal.direction)) {
      throw new Error('无效的方向')
    }
    if (!signal.symbol || signal.symbol.length > 20) {
      throw new Error('无效的交易标的')
    }
    if (signal.reason && signal.reason.length > 500) {
      throw new Error('信号原因过长')
    }
    
    const strategy = await db.strategy.findUnique({ where: { id: strategyId } })
    if (!strategy) throw new Error('策略不存在')
    if (strategy.ownerId !== userId) throw new Error('无权操作此策略')

    return db.strategySignal.create({
      data: {
        strategyId,
        type: signal.type,
        direction: signal.direction,
        symbol: signal.symbol.toUpperCase().trim(),
        price: signal.price ? new Decimal(signal.price) : null,
        quantity: signal.quantity ? new Decimal(signal.quantity) : null,
        reason: signal.reason?.trim(),
      },
    })
  },

  // 获取策略的信号历史
  async getSignals(strategyId: string, limit = 50) {
    if (!validateUUID(strategyId)) return []
    
    // 限制最大返回数量
    const safeLimit = Math.min(Math.max(1, limit), 100)
    
    return db.strategySignal.findMany({
      where: { strategyId },
      orderBy: { createdAt: 'desc' },
      take: safeLimit,
    })
  },

  // 执行信号
  async executeSignal(signalId: string, userId: string) {
    if (!validateUUID(signalId) || !validateUUID(userId)) {
      throw new Error('无效的 ID')
    }
    
    const signal = await db.strategySignal.findUnique({
      where: { id: signalId },
      include: { strategy: true } as any,
    }) as any

    if (!signal) throw new Error('信号不存在')
    if (signal.strategy.ownerId !== userId) throw new Error('无权操作')

    // TODO: 对接交易执行
    return db.strategySignal.update({
      where: { id: signalId },
      data: {
        status: 'executed',
        executedAt: new Date(),
      },
    })
  },

  // ============ 自然语言转规则 ============

  // 将自然语言描述转换为结构化规则
  async parseNaturalLanguageRule(description: string): Promise<any> {
    // 验证输入
    if (!description || description.length < 10) {
      throw new Error('描述过短')
    }
    if (description.length > 2000) {
      throw new Error('描述过长 (最大 2000 字符)')
    }
    
    // TODO: 接入 AI 模型进行解析
    // 暂时返回示例结构
    
    // 示例输入："当BTC日线RSI<30，同时交易所净流出>5000BTC，分批建仓"
    // 示例输出：
    return {
      conditions: [
        { indicator: 'RSI', symbol: 'BTC', timeframe: '1D', operator: '<', value: 30 },
        { indicator: 'exchange_netflow', symbol: 'BTC', timeframe: '24h', operator: '<', value: -5000 },
      ],
      action: {
        type: 'entry',
        direction: 'long',
        sizing: {
          method: 'batch',
          batches: 3,
          perBatch: 0.1, // 10% of position
        },
      },
      riskManagement: {
        stopLoss: -0.08, // -8%
        takeProfit: null,
      },
      raw: description,
      parsedAt: new Date().toISOString(),
    }
  },

  // ============ 获取公开策略列表 ============

  async getPublicStrategies(limit = 20) {
    // 限制最大返回数量
    const safeLimit = Math.min(Math.max(1, limit), 50)
    
    return db.strategy.findMany({
      where: { status: 'active' },
      orderBy: [
        { returnTotal: 'desc' },
        { followers: 'desc' },
      ],
      take: safeLimit,
      include: {
        owner: {
          select: { id: true, email: true },
        },
      },
    })
  },

  // 更新策略业绩（定时任务调用）
  async updateStrategyPerformance(id: string, performance: {
    return7d?: number
    return30d?: number
    returnTotal?: number
    sharpeRatio?: number
    maxDrawdown?: number
    winRate?: number
  }) {
    if (!validateUUID(id)) throw new Error('无效的策略 ID')
    
    return db.strategy.update({
      where: { id },
      data: {
        return7d: performance.return7d ? new Decimal(performance.return7d) : undefined,
        return30d: performance.return30d ? new Decimal(performance.return30d) : undefined,
        returnTotal: performance.returnTotal ? new Decimal(performance.returnTotal) : undefined,
        sharpeRatio: performance.sharpeRatio ? new Decimal(performance.sharpeRatio) : undefined,
        maxDrawdown: performance.maxDrawdown ? new Decimal(performance.maxDrawdown) : undefined,
        winRate: performance.winRate ? new Decimal(performance.winRate) : undefined,
      },
    })
  },

  // ============ 龙头多头策略 ============

  async getLongtouPositions() {
    // 复用 copyTradeService 的完整同步逻辑（Perps + Spot + Pre-launch）
    try {
      const { copyTradeService } = await import('../copytrade/copytrade.service.js')
      const result = await copyTradeService.syncLongtouPositions()
      
      return {
        positions: result.positions,
        orders: result.orders || [],
        totalValue: result.totalValue,
        accountValue: result.totalValue,
        marginUsed: 0,
        withdrawable: 0,
      }
    } catch (error) {
      console.error('Failed to fetch Longtou positions:', error)
      throw new Error('获取龙头多头仓位失败')
    }
  },
}
