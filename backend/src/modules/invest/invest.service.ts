import Decimal from 'decimal.js'
import { db } from '../../lib/db.js'

// 模拟策略数据
const STRATEGIES = [
  { id: '1', name: '黄金量化策略', return7d: 12.3, riskLevel: 1 },
  { id: '2', name: 'BTC 量化策略', return7d: 8.7, riskLevel: 2 },
  { id: '3', name: '龙头主观策略', return7d: 15.2, riskLevel: 2 },
]

export const investService = {
  // 获取用户持仓
  async getPositions(userId: string) {
    const positions = await db.$queryRaw<any[]>`
      SELECT * FROM "InvestPosition" WHERE "userId" = ${userId}
    `.catch(() => [])
    
    return positions.map(p => ({
      ...p,
      strategy: STRATEGIES.find(s => s.id === p.strategyId),
    }))
  },

  // 跟投策略
  async invest(
    userId: string,
    strategyId: string,
    amount: Decimal
  ): Promise<{ success: boolean; error?: string; position?: any }> {
    // 检查用户余额
    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) return { success: false, error: '用户不存在' }
    
    const balance = new Decimal(user.usdtBalance.toString())
    if (balance.lt(amount)) {
      return { success: false, error: '余额不足，请先入金' }
    }
    
    if (amount.lt(1)) {
      return { success: false, error: '最低投资 1 USDT' }
    }

    const strategy = STRATEGIES.find(s => s.id === strategyId)
    if (!strategy) return { success: false, error: '策略不存在' }

    // 扣除余额，创建/更新持仓
    const result = await db.$transaction(async (tx) => {
      // 扣除余额
      await tx.user.update({
        where: { id: userId },
        data: { usdtBalance: { decrement: amount } }
      })

      // 查找现有持仓
      const existing = await tx.$queryRaw<any[]>`
        SELECT * FROM "InvestPosition" 
        WHERE "userId" = ${userId} AND "strategyId" = ${strategyId}
      `.catch(() => [])

      if (existing.length > 0) {
        // 更新持仓
        await tx.$executeRaw`
          UPDATE "InvestPosition" 
          SET "invested" = "invested" + ${amount.toString()}::decimal,
              "current" = "current" + ${amount.toString()}::decimal,
              "updatedAt" = NOW()
          WHERE "userId" = ${userId} AND "strategyId" = ${strategyId}
        `
      } else {
        // 创建持仓
        await tx.$executeRaw`
          INSERT INTO "InvestPosition" ("id", "userId", "strategyId", "strategyName", "invested", "current", "pnl", "pnlPct", "createdAt", "updatedAt")
          VALUES (gen_random_uuid(), ${userId}, ${strategyId}, ${strategy.name}, ${amount.toString()}::decimal, ${amount.toString()}::decimal, 0, 0, NOW(), NOW())
        `
      }

      // 记录交易
      await tx.auditLog.create({
        data: {
          userId,
          action: 'invest',
          targetType: 'strategy',
          targetId: strategyId,
          details: { amount: amount.toString(), strategyName: strategy.name }
        }
      })

      return { success: true }
    })

    return result
  },

  // 赎回
  async withdraw(
    userId: string,
    strategyId: string,
    amount: Decimal
  ): Promise<{ success: boolean; error?: string }> {
    // 查找持仓
    const positions = await db.$queryRaw<any[]>`
      SELECT * FROM "InvestPosition" 
      WHERE "userId" = ${userId} AND "strategyId" = ${strategyId}
    `.catch(() => [])

    if (positions.length === 0) {
      return { success: false, error: '没有该策略的持仓' }
    }

    const position = positions[0]
    const current = new Decimal(position.current.toString())
    
    if (amount.gt(current)) {
      return { success: false, error: '赎回金额超过持仓' }
    }

    await db.$transaction(async (tx) => {
      // 增加余额
      await tx.user.update({
        where: { id: userId },
        data: { usdtBalance: { increment: amount } }
      })

      if (amount.eq(current)) {
        // 全部赎回，删除持仓
        await tx.$executeRaw`
          DELETE FROM "InvestPosition" 
          WHERE "userId" = ${userId} AND "strategyId" = ${strategyId}
        `
      } else {
        // 部分赎回
        const ratio = amount.div(current)
        const investedReduce = new Decimal(position.invested.toString()).times(ratio)
        
        await tx.$executeRaw`
          UPDATE "InvestPosition" 
          SET "invested" = "invested" - ${investedReduce.toString()}::decimal,
              "current" = "current" - ${amount.toString()}::decimal,
              "updatedAt" = NOW()
          WHERE "userId" = ${userId} AND "strategyId" = ${strategyId}
        `
      }

      await tx.auditLog.create({
        data: {
          userId,
          action: 'withdraw_invest',
          targetType: 'strategy',
          targetId: strategyId,
          details: { amount: amount.toString() }
        }
      })
    })

    return { success: true }
  },

  // 获取用户投资概览
  async getSummary(userId: string) {
    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) return null

    const positions = await db.$queryRaw<any[]>`
      SELECT * FROM "InvestPosition" WHERE "userId" = ${userId}
    `.catch(() => [])

    const totalInvested = positions.reduce((sum, p) => sum + parseFloat(p.invested), 0)
    const totalCurrent = positions.reduce((sum, p) => sum + parseFloat(p.current), 0)
    const totalPnl = totalCurrent - totalInvested
    const pnlPct = totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0

    return {
      balance: user.usdtBalance.toString(),
      totalInvested: totalInvested.toFixed(2),
      totalCurrent: totalCurrent.toFixed(2),
      totalPnl: totalPnl.toFixed(2),
      pnlPct: pnlPct.toFixed(2),
      positionCount: positions.length,
    }
  }
}
