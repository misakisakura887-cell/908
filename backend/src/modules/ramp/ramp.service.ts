import Decimal from 'decimal.js'
import { db } from '../../lib/db.js'
import { priceService } from './price.service.js'
import { RampStatus, RampType, PaymentMethod } from '@prisma/client'

const MIN_DEPOSIT_CNY = new Decimal(10)
const MAX_DEPOSIT_CNY = new Decimal(50000)
const MIN_WITHDRAW_USDT = new Decimal(10)
const MAX_WITHDRAW_USDT = new Decimal(7000)
const ORDER_TIMEOUT_MS = 15 * 60 * 1000 // 15 minutes

// 生成订单号: D20240224001
function generateOrderNo(type: RampType): string {
  const prefix = type === 'DEPOSIT' ? 'D' : 'W'
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return `${prefix}${date}${random}`
}

export const rampService = {
  // ============== 入金 ==============
  
  async createDepositOrder(
    userId: string,
    cnyAmount: Decimal,
    paymentMethod: PaymentMethod
  ): Promise<{ success: boolean; error?: string; order?: any }> {
    // 验证金额
    if (cnyAmount.lt(MIN_DEPOSIT_CNY)) {
      return { success: false, error: `最低入金 ${MIN_DEPOSIT_CNY} CNY` }
    }
    if (cnyAmount.gt(MAX_DEPOSIT_CNY)) {
      return { success: false, error: `单笔最高 ${MAX_DEPOSIT_CNY} CNY` }
    }
    
    // 检查用户日限额
    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) {
      return { success: false, error: '用户不存在' }
    }
    if (user.isBlocked) {
      return { success: false, error: '账户已被限制' }
    }
    
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    
    const todayTotal = await db.rampOrder.aggregate({
      where: {
        userId,
        type: 'DEPOSIT',
        status: { in: ['PENDING', 'PAID', 'PROCESSING', 'COMPLETED'] },
        createdAt: { gte: todayStart },
      },
      _sum: { cnyAmount: true }
    })
    
    const dailyUsed = new Decimal(todayTotal._sum.cnyAmount?.toString() || '0')
    if (dailyUsed.plus(cnyAmount).gt(user.dailyLimit)) {
      return { success: false, error: `已超出日限额 ${user.dailyLimit} CNY` }
    }
    
    // 获取当前价格
    const price = await priceService.getCurrentPrice()
    if (!price) {
      return { success: false, error: '价格服务暂不可用' }
    }
    
    // 计算 USDT 数量
    const grossUsdt = cnyAmount.div(price.buyPrice)
    const fee = grossUsdt.times(new Decimal('0.005'))
    const netUsdt = grossUsdt.minus(fee)
    
    // 检查资金池余额
    const poolBalance = await this.getPoolBalance()
    if (poolBalance.usdt.lt(netUsdt)) {
      return { success: false, error: '系统流动性不足，请稍后再试' }
    }
    
    // 创建订单
    const order = await db.rampOrder.create({
      data: {
        orderNo: generateOrderNo('DEPOSIT'),
        userId,
        type: 'DEPOSIT',
        status: 'PENDING',
        cnyAmount,
        usdtAmount: netUsdt,
        rate: price.buyPrice,
        fee,
        paymentMethod,
        expiresAt: new Date(Date.now() + ORDER_TIMEOUT_MS),
      }
    })
    
    // 创建审计日志
    await db.auditLog.create({
      data: {
        userId,
        action: 'deposit_create',
        targetType: 'order',
        targetId: order.id,
        details: { cnyAmount: cnyAmount.toString(), usdtAmount: netUsdt.toString() }
      }
    })
    
    return {
      success: true,
      order: {
        id: order.id,
        orderNo: order.orderNo,
        cnyAmount: order.cnyAmount.toString(),
        usdtAmount: order.usdtAmount.toString(),
        rate: order.rate.toString(),
        fee: order.fee.toString(),
        paymentMethod: order.paymentMethod,
        expiresAt: order.expiresAt,
        status: order.status,
      }
    }
  },

  async markDepositPaid(userId: string, orderId: string): Promise<{ success: boolean; error?: string }> {
    const order = await db.rampOrder.findFirst({
      where: { id: orderId, userId, type: 'DEPOSIT', status: 'PENDING' }
    })
    
    if (!order) {
      return { success: false, error: '订单不存在或状态不正确' }
    }
    
    if (order.expiresAt && order.expiresAt < new Date()) {
      await db.rampOrder.update({
        where: { id: orderId },
        data: { status: 'TIMEOUT' }
      })
      return { success: false, error: '订单已超时' }
    }
    
    await db.rampOrder.update({
      where: { id: orderId },
      data: { status: 'PAID', paidAt: new Date() }
    })
    
    await db.auditLog.create({
      data: {
        userId,
        action: 'deposit_paid',
        targetType: 'order',
        targetId: orderId,
      }
    })
    
    return { success: true }
  },

  // ============== 出金 ==============
  
  async createWithdrawOrder(
    userId: string,
    usdtAmount: Decimal,
    paymentMethod: PaymentMethod,
    paymentInfo: { account: string; name: string }
  ): Promise<{ success: boolean; error?: string; order?: any }> {
    // 验证金额
    if (usdtAmount.lt(MIN_WITHDRAW_USDT)) {
      return { success: false, error: `最低出金 ${MIN_WITHDRAW_USDT} USDT` }
    }
    if (usdtAmount.gt(MAX_WITHDRAW_USDT)) {
      return { success: false, error: `单笔最高 ${MAX_WITHDRAW_USDT} USDT` }
    }
    
    // 检查用户余额
    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) {
      return { success: false, error: '用户不存在' }
    }
    if (user.isBlocked) {
      return { success: false, error: '账户已被限制' }
    }
    
    const userBalance = new Decimal(user.usdtBalance.toString())
    if (userBalance.lt(usdtAmount)) {
      return { success: false, error: '余额不足' }
    }
    
    // 获取当前价格
    const price = await priceService.getCurrentPrice()
    if (!price) {
      return { success: false, error: '价格服务暂不可用' }
    }
    
    // 计算 CNY 数量
    const fee = usdtAmount.times(new Decimal('0.005'))
    const netUsdt = usdtAmount.minus(fee)
    const cnyAmount = netUsdt.times(price.sellPrice)
    
    // 检查资金池 CNY 余额
    const poolBalance = await this.getPoolBalance()
    if (poolBalance.cny.lt(cnyAmount)) {
      return { success: false, error: '系统流动性不足，请稍后再试' }
    }
    
    // 冻结用户余额，创建订单
    const [order] = await db.$transaction([
      db.rampOrder.create({
        data: {
          orderNo: generateOrderNo('WITHDRAW'),
          userId,
          type: 'WITHDRAW',
          status: 'PENDING',
          cnyAmount,
          usdtAmount,
          rate: price.sellPrice,
          fee,
          paymentMethod,
          paymentInfo: paymentInfo as any, // TODO: 加密
        }
      }),
      db.user.update({
        where: { id: userId },
        data: { usdtBalance: { decrement: usdtAmount } }
      })
    ])
    
    await db.auditLog.create({
      data: {
        userId,
        action: 'withdraw_create',
        targetType: 'order',
        targetId: order.id,
        details: { usdtAmount: usdtAmount.toString(), cnyAmount: cnyAmount.toString() }
      }
    })
    
    return {
      success: true,
      order: {
        id: order.id,
        orderNo: order.orderNo,
        usdtAmount: order.usdtAmount.toString(),
        cnyAmount: order.cnyAmount.toString(),
        rate: order.rate.toString(),
        fee: order.fee.toString(),
        status: order.status,
      }
    }
  },

  // ============== 查询 ==============
  
  async getUserOrders(userId: string, limit = 20, offset = 0) {
    const orders = await db.rampOrder.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    })
    
    return orders.map(o => ({
      id: o.id,
      orderNo: o.orderNo,
      type: o.type,
      status: o.status,
      cnyAmount: o.cnyAmount.toString(),
      usdtAmount: o.usdtAmount.toString(),
      rate: o.rate.toString(),
      createdAt: o.createdAt,
      completedAt: o.completedAt,
    }))
  },

  async getOrderById(userId: string, orderId: string) {
    return db.rampOrder.findFirst({
      where: { id: orderId, userId }
    })
  },

  // ============== 资金池 ==============
  
  async getPoolBalance(): Promise<{ usdt: Decimal; cny: Decimal }> {
    const latest = await db.poolLedger.findFirst({
      orderBy: { createdAt: 'desc' }
    })
    
    if (!latest) {
      // 初始化资金池
      return {
        usdt: new Decimal(3000), // 初始 3000 USDT
        cny: new Decimal(0),
      }
    }
    
    return {
      usdt: new Decimal(latest.usdtBalance.toString()),
      cny: new Decimal(latest.cnyBalance.toString()),
    }
  }
}
