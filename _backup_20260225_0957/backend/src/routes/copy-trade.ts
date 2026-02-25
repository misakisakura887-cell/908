/**
 * 跟单 API 路由
 */

import { FastifyInstance } from 'fastify';
import { copyTradeMonitor } from '../services/copy-trade-monitor';
import { hyperliquid } from '../services/hyperliquid';

// 金明老师的钱包地址
const LEADER_ADDRESS = '0x29c89eC30a43c8d12b6BD4E99d3D6E5CBf1AEb28';

// 存储跟单日志（后续改为数据库）
const tradeLogs: Array<{
  id: string;
  leaderTrade: any;
  timestamp: Date;
  status: string;
}> = [];

export async function copyTradeRoutes(fastify: FastifyInstance) {
  /**
   * 获取金明老师的账户状态
   */
  fastify.get('/api/copy-trade/leader', async (request, reply) => {
    try {
      const status = await copyTradeMonitor.getLeaderStatus();
      return {
        success: true,
        data: status,
      };
    } catch (error) {
      return reply.code(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * 获取金明老师的持仓
   */
  fastify.get('/api/copy-trade/leader/positions', async (request, reply) => {
    try {
      const positions = await hyperliquid.getPositions(LEADER_ADDRESS);
      return {
        success: true,
        data: positions.map((p) => ({
          coin: p.position.coin,
          size: parseFloat(p.position.szi),
          entryPrice: parseFloat(p.position.entryPx),
          positionValue: parseFloat(p.position.positionValue),
          unrealizedPnl: parseFloat(p.position.unrealizedPnl),
          leverage: p.position.leverage.value,
          liquidationPrice: p.position.liquidationPx,
        })),
      };
    } catch (error) {
      return reply.code(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * 获取金明老师的最近交易
   */
  fastify.get('/api/copy-trade/leader/trades', async (request, reply) => {
    try {
      const fills = await hyperliquid.getUserFills(LEADER_ADDRESS);
      return {
        success: true,
        data: fills.slice(0, 50).map((f) => ({
          id: f.tid,
          coin: f.coin,
          side: f.side === 'B' ? 'BUY' : 'SELL',
          direction: f.dir,
          size: parseFloat(f.sz),
          price: parseFloat(f.px),
          closedPnl: parseFloat(f.closedPnl),
          fee: parseFloat(f.fee),
          time: new Date(f.time).toISOString(),
          hash: f.hash,
        })),
      };
    } catch (error) {
      return reply.code(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * 启动跟单监控
   */
  fastify.post('/api/copy-trade/monitor/start', async (request, reply) => {
    try {
      // 设置新交易回调
      copyTradeMonitor.setOnNewTrade((trade) => {
        console.log(`[API] New leader trade detected:`, trade);
        
        // 记录日志
        tradeLogs.unshift({
          id: `log_${Date.now()}`,
          leaderTrade: {
            coin: trade.coin,
            side: trade.side === 'B' ? 'BUY' : 'SELL',
            size: parseFloat(trade.sz),
            price: parseFloat(trade.px),
          },
          timestamp: new Date(),
          status: 'detected',
        });
        
        // 保留最近 100 条日志
        if (tradeLogs.length > 100) {
          tradeLogs.pop();
        }
        
        // TODO: 触发跟单逻辑
      });

      await copyTradeMonitor.start();
      
      return {
        success: true,
        message: 'Copy trade monitor started',
      };
    } catch (error) {
      return reply.code(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * 停止跟单监控
   */
  fastify.post('/api/copy-trade/monitor/stop', async (request, reply) => {
    copyTradeMonitor.stop();
    return {
      success: true,
      message: 'Copy trade monitor stopped',
    };
  });

  /**
   * 获取跟单日志
   */
  fastify.get('/api/copy-trade/logs', async (request, reply) => {
    return {
      success: true,
      data: tradeLogs,
    };
  });

  /**
   * 获取所有交易对的当前价格
   */
  fastify.get('/api/copy-trade/prices', async (request, reply) => {
    try {
      const mids = await hyperliquid.getAllMids();
      return {
        success: true,
        data: mids,
      };
    } catch (error) {
      return reply.code(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
}
