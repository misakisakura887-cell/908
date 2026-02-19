import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function positionRoutes(fastify: FastifyInstance) {
  // 获取用户仓位
  fastify.get('/api/positions', {
    onRequest: [fastify.authenticate],
  }, async (request, reply) => {
    const userId = (request.user as any).userId;

    const positions = await prisma.userPosition.findMany({
      where: { userId },
      include: {
        strategy: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return { positions };
  });

  // 投资策略
  fastify.post('/api/positions', {
    onRequest: [fastify.authenticate],
  }, async (request, reply) => {
    const userId = (request.user as any).userId;
    const { strategyId, amount } = request.body as {
      strategyId: string;
      amount: number;
    };

    if (!strategyId || !amount || amount <= 0) {
      return reply.code(400).send({ error: 'Invalid parameters' });
    }

    // 检查策略是否存在
    const strategy = await prisma.strategy.findUnique({
      where: { id: strategyId },
    });

    if (!strategy) {
      return reply.code(404).send({ error: 'Strategy not found' });
    }

    // 创建仓位
    const position = await prisma.userPosition.create({
      data: {
        userId,
        strategyId,
        investedAmount: amount,
        currentValue: amount, // 初始值等于投资金额
        returns: 0,
      },
      include: {
        strategy: true,
      },
    });

    // 更新策略统计
    await prisma.strategy.update({
      where: { id: strategyId },
      data: {
        followers: { increment: 1 },
        totalLocked: { increment: amount },
      },
    });

    return { position };
  });

  // 提现
  fastify.post('/api/positions/:id/withdraw', {
    onRequest: [fastify.authenticate],
  }, async (request, reply) => {
    const userId = (request.user as any).userId;
    const { id } = request.params as { id: string };
    const { amount } = request.body as { amount?: number };

    const position = await prisma.userPosition.findFirst({
      where: { id, userId },
    });

    if (!position) {
      return reply.code(404).send({ error: 'Position not found' });
    }

    const withdrawAmount = amount || position.currentValue;

    if (withdrawAmount > position.currentValue) {
      return reply.code(400).send({ error: 'Insufficient balance' });
    }

    if (withdrawAmount === position.currentValue) {
      // 全部提现，删除仓位
      await prisma.userPosition.delete({ where: { id } });

      // 更新策略统计
      await prisma.strategy.update({
        where: { id: position.strategyId },
        data: {
          followers: { decrement: 1 },
          totalLocked: { decrement: position.currentValue },
        },
      });

      return { message: 'Position closed', withdrawnAmount: withdrawAmount };
    } else {
      // 部分提现，更新仓位
      const newCurrentValue = position.currentValue - withdrawAmount;
      const newInvestedAmount = position.investedAmount * (newCurrentValue / position.currentValue);

      const updatedPosition = await prisma.userPosition.update({
        where: { id },
        data: {
          investedAmount: newInvestedAmount,
          currentValue: newCurrentValue,
          returns: ((newCurrentValue - newInvestedAmount) / newInvestedAmount) * 100,
        },
      });

      // 更新策略统计
      await prisma.strategy.update({
        where: { id: position.strategyId },
        data: {
          totalLocked: { decrement: withdrawAmount },
        },
      });

      return { position: updatedPosition, withdrawnAmount: withdrawAmount };
    }
  });
}
