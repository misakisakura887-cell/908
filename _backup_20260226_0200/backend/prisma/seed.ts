import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create strategies
  const goldStrategy = await prisma.strategy.upsert({
    where: { id: '1' },
    update: {},
    create: {
      id: '1',
      name: '黄金量化策略',
      description:
        '基于微软开源模型的黄金量化交易策略，使用双均线系统自动捕捉趋势。适合稳健型投资者。',
      strategyType: 'gold_quant',
      assetClass: 'commodity',
      riskLevel: 1,
      totalReturn: 34.12,
      sharpeRatio: 1.82,
      maxDrawdown: -5.2,
      winRate: 68.3,
      totalAum: 234567.89,
      followerCount: 342,
      custodyAddress: '0x0000000000000000000000000000000000000001',
    },
  });

  const btcStrategy = await prisma.strategy.upsert({
    where: { id: '2' },
    update: {},
    create: {
      id: '2',
      name: 'BTC 量化策略',
      description: '复用黄金策略逻辑，针对 BTC 高波动性优化。适合加密货币玩家。',
      strategyType: 'btc_quant',
      assetClass: 'crypto',
      riskLevel: 2,
      totalReturn: 22.5,
      sharpeRatio: 1.34,
      maxDrawdown: -8.1,
      winRate: 65.2,
      totalAum: 456789.12,
      followerCount: 567,
      custodyAddress: '0x0000000000000000000000000000000000000002',
    },
  });

  const leaderStrategy = await prisma.strategy.upsert({
    where: { id: '3' },
    update: {},
    create: {
      id: '3',
      name: '龙头主观策略',
      description: '跟单见崎的主观策略，涵盖美股 AI 板块、BTC、黄金等多种资产。',
      strategyType: 'leader_subjective',
      assetClass: 'mixed',
      riskLevel: 2,
      totalReturn: 38.6,
      sharpeRatio: 2.01,
      maxDrawdown: -6.8,
      winRate: 72.1,
      totalAum: 189234.56,
      followerCount: 189,
      custodyAddress: '0x0000000000000000000000000000000000000003',
    },
  });

  console.log('✅ Strategies created:', {
    goldStrategy,
    btcStrategy,
    leaderStrategy,
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
