import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function strategyRoutes(fastify: FastifyInstance) {
  // Get all strategies
  fastify.get('/', async (request, reply) => {
    const { type, riskLevel, limit = 10, offset = 0 } = request.query as {
      type?: string;
      riskLevel?: string;
      limit?: number;
      offset?: number;
    };

    const where: any = { isActive: true };

    if (type) {
      where.assetClass = type;
    }

    if (riskLevel) {
      where.riskLevel = parseInt(riskLevel);
    }

    const [strategies, total] = await Promise.all([
      prisma.strategy.findMany({
        where,
        take: Number(limit),
        skip: Number(offset),
        orderBy: { totalReturn: 'desc' },
      }),
      prisma.strategy.count({ where }),
    ]);

    return { strategies, total };
  });

  // Get strategy by ID
  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    const strategy = await prisma.strategy.findUnique({
      where: { id },
    });

    if (!strategy) {
      return reply.code(404).send({ error: 'Strategy not found' });
    }

    // Get performance history (last 30 days)
    const performanceHistory = await prisma.strategyPerformance.findMany({
      where: { strategyId: id },
      orderBy: { date: 'desc' },
      take: 30,
    });

    // Get recent trades
    const recentTrades = await prisma.trade.findMany({
      where: {
        strategyId: id,
        status: 'filled',
      },
      orderBy: { executedAt: 'desc' },
      take: 10,
    });

    return {
      strategy,
      performanceHistory,
      recentTrades,
    };
  });
}
