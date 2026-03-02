/**
 * 安全版跟单 API 路由
 * 包含：认证、速率限制、输入验证、交易保护
 */

import { FastifyInstance } from 'fastify';
import { copyTradeMonitor } from '../services/copy-trade-monitor';
import { hyperliquid } from '../services/hyperliquid';
import { apiKeyAuth, validateAddress, generateApiKey } from '../middleware/security';
import { encrypt, decrypt } from '../services/crypto';
import {
  checkSlippage,
  checkSignalDelay,
  validateOrder,
  detectAnomalousPattern,
  recordOrder,
  calculateSafeCopySize,
  getProtectionConfig,
} from '../services/trade-protection';

// 金明老师的钱包地址
const LEADER_ADDRESS = '0x29c89eC30a43c8d12b6BD4E99d3D6E5CBf1AEb28';

// 跟单配置存储（生产环境应使用数据库）
const copyConfigs: Map<string, {
  userId: string;
  userAddress: string;
  encryptedApiKey: string;
  encryptedApiSecret: string;
  copyRatio: number;
  maxPositionSize: number;
  isActive: boolean;
}> = new Map();

// 审计日志
const auditLogs: Array<{
  timestamp: Date;
  action: string;
  userId?: string;
  ip: string;
  details: any;
  success: boolean;
}> = [];

function logAudit(
  action: string,
  request: any,
  details: any,
  success: boolean,
  userId?: string
) {
  auditLogs.unshift({
    timestamp: new Date(),
    action,
    userId,
    ip: request.ip || 'unknown',
    details,
    success,
  });
  
  // 保留最近 1000 条审计日志
  if (auditLogs.length > 1000) {
    auditLogs.pop();
  }
}

export async function copyTradeSecureRoutes(fastify: FastifyInstance) {
  /**
   * 获取金明老师状态（需要 API 密钥）
   */
  fastify.get('/api/v2/copy-trade/leader', {
    preHandler: apiKeyAuth,
  }, async (request, reply) => {
    try {
      const status = await copyTradeMonitor.getLeaderStatus();
      logAudit('GET_LEADER_STATUS', request, {}, true, (request as any).apiUser?.userId);
      
      return {
        success: true,
        data: status,
      };
    } catch (error) {
      logAudit('GET_LEADER_STATUS', request, { error: (error as Error).message }, false);
      return reply.code(500).send({
        success: false,
        error: 'Failed to fetch leader status',
      });
    }
  });

  /**
   * 注册跟单配置（需要 API 密钥）
   */
  fastify.post('/api/v2/copy-trade/register', {
    preHandler: apiKeyAuth,
  }, async (request, reply) => {
    const { userAddress, hyperliquidApiKey, hyperliquidApiSecret, copyRatio, maxPositionSize } =
      request.body as {
        userAddress: string;
        hyperliquidApiKey: string;
        hyperliquidApiSecret: string;
        copyRatio: number;
        maxPositionSize: number;
      };

    // 输入验证
    if (!validateAddress(userAddress)) {
      logAudit('REGISTER_COPY', request, { error: 'Invalid address' }, false);
      return reply.code(400).send({
        success: false,
        error: 'Invalid wallet address format',
      });
    }

    if (copyRatio <= 0 || copyRatio > 1) {
      return reply.code(400).send({
        success: false,
        error: 'Copy ratio must be between 0 and 1',
      });
    }

    if (maxPositionSize <= 0 || maxPositionSize > 1000000) {
      return reply.code(400).send({
        success: false,
        error: 'Invalid max position size',
      });
    }

    try {
      // 加密存储 API 密钥
      const userId = (request as any).apiUser.userId;
      copyConfigs.set(userId, {
        userId,
        userAddress,
        encryptedApiKey: encrypt(hyperliquidApiKey),
        encryptedApiSecret: encrypt(hyperliquidApiSecret),
        copyRatio,
        maxPositionSize,
        isActive: false,
      });

      logAudit('REGISTER_COPY', request, { userAddress, copyRatio, maxPositionSize }, true, userId);

      return {
        success: true,
        message: 'Copy trading configuration registered',
        data: {
          userAddress,
          copyRatio,
          maxPositionSize,
          isActive: false,
        },
      };
    } catch (error) {
      logAudit('REGISTER_COPY', request, { error: (error as Error).message }, false);
      return reply.code(500).send({
        success: false,
        error: 'Failed to register copy trading',
      });
    }
  });

  /**
   * 启用/禁用跟单
   */
  fastify.post('/api/v2/copy-trade/toggle', {
    preHandler: apiKeyAuth,
  }, async (request, reply) => {
    const userId = (request as any).apiUser.userId;
    const { active } = request.body as { active: boolean };

    const config = copyConfigs.get(userId);
    if (!config) {
      return reply.code(404).send({
        success: false,
        error: 'Copy trading not configured',
      });
    }

    config.isActive = active;
    logAudit('TOGGLE_COPY', request, { active }, true, userId);

    return {
      success: true,
      message: active ? 'Copy trading enabled' : 'Copy trading disabled',
    };
  });

  /**
   * 执行跟单（内部使用，带完整保护）
   */
  fastify.post('/api/v2/copy-trade/execute', {
    preHandler: apiKeyAuth,
  }, async (request, reply) => {
    const userId = (request as any).apiUser.userId;
    const { coin, side, leaderSize, leaderPrice, leaderTradeTime } = request.body as {
      coin: string;
      side: 'buy' | 'sell';
      leaderSize: number;
      leaderPrice: number;
      leaderTradeTime: number;
    };

    const config = copyConfigs.get(userId);
    if (!config || !config.isActive) {
      return reply.code(400).send({
        success: false,
        error: 'Copy trading not active',
      });
    }

    // 1. 检查信号延迟
    const delayCheck = checkSignalDelay(leaderTradeTime);
    if (!delayCheck.acceptable) {
      logAudit('EXECUTE_COPY', request, { 
        error: 'Signal too delayed', 
        delayMs: delayCheck.delayMs 
      }, false, userId);
      
      return reply.code(400).send({
        success: false,
        error: `Signal too delayed (${delayCheck.delayMs}ms). Skipping for safety.`,
      });
    }

    // 2. 检查滑点
    const slippageCheck = await checkSlippage(coin, leaderPrice, side);
    if (!slippageCheck.acceptable) {
      logAudit('EXECUTE_COPY', request, {
        error: 'Slippage too high',
        slippage: slippageCheck.slippagePercent,
      }, false, userId);
      
      return reply.code(400).send({
        success: false,
        error: `Slippage too high (${slippageCheck.slippagePercent.toFixed(2)}%). Skipping for safety.`,
      });
    }

    // 3. 计算安全的跟单数量
    const userAccountValue = await hyperliquid.getAccountValue(config.userAddress);
    const copySize = calculateSafeCopySize(
      leaderSize,
      config.copyRatio,
      userAccountValue,
      slippageCheck.currentPrice,
      leaderPrice
    );

    // 4. 验证订单参数
    const orderValidation = validateOrder({
      userId,
      coin,
      side,
      size: copySize,
      accountValue: userAccountValue,
    });
    
    if (!orderValidation.valid) {
      logAudit('EXECUTE_COPY', request, { error: orderValidation.error }, false, userId);
      return reply.code(400).send({
        success: false,
        error: orderValidation.error,
      });
    }

    // 5. 检测异常模式
    const anomalyCheck = detectAnomalousPattern(userId, coin, copySize);
    if (anomalyCheck.suspicious) {
      logAudit('EXECUTE_COPY', request, {
        error: 'Anomalous pattern detected',
        reason: anomalyCheck.reason,
      }, false, userId);
      
      return reply.code(400).send({
        success: false,
        error: `Suspicious activity detected: ${anomalyCheck.reason}`,
      });
    }

    // 6. 记录订单（实际下单逻辑在这里）
    recordOrder({
      userId,
      coin,
      side,
      size: copySize,
      price: slippageCheck.currentPrice,
    });

    logAudit('EXECUTE_COPY', request, {
      coin,
      side,
      copySize,
      price: slippageCheck.currentPrice,
      leaderSize,
      leaderPrice,
    }, true, userId);

    // TODO: 实际调用 Hyperliquid Exchange API 下单
    // const apiKey = decrypt(config.encryptedApiKey);
    // const apiSecret = decrypt(config.encryptedApiSecret);
    // await hyperliquid.placeOrder(...)

    return {
      success: true,
      data: {
        coin,
        side,
        size: copySize,
        price: slippageCheck.currentPrice,
        slippage: slippageCheck.slippagePercent,
        delay: delayCheck.delayMs,
      },
    };
  });

  /**
   * 获取审计日志（管理员）
   */
  fastify.get('/api/v2/copy-trade/audit-logs', {
    preHandler: apiKeyAuth,
  }, async (request, reply) => {
    const userId = (request as any).apiUser.userId;
    
    // 只返回该用户的日志（管理员可以看所有）
    const userLogs = auditLogs.filter(log => 
      log.userId === userId || (request as any).apiUser.permissions.includes('admin')
    );

    return {
      success: true,
      data: userLogs.slice(0, 100),
    };
  });

  /**
   * 获取保护配置
   */
  fastify.get('/api/v2/copy-trade/protection-config', {
    preHandler: apiKeyAuth,
  }, async (request, reply) => {
    return {
      success: true,
      data: getProtectionConfig(),
    };
  });

  /**
   * 生成 API 密钥（演示用）
   */
  fastify.post('/api/v2/copy-trade/generate-key', async (request, reply) => {
    const { userId } = request.body as { userId: string };
    
    if (!userId || userId.length < 3) {
      return reply.code(400).send({
        success: false,
        error: 'Invalid userId',
      });
    }

    const apiKey = generateApiKey(userId, ['read', 'trade']);
    
    return {
      success: true,
      data: {
        apiKey,
        permissions: ['read', 'trade'],
        warning: 'Store this key securely. It will not be shown again.',
      },
    };
  });
}
