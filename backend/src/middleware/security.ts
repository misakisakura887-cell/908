/**
 * 安全中间件
 * 防御：认证、速率限制、输入验证
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import crypto from 'crypto';

// 速率限制存储
const rateLimitStore: Map<string, { count: number; resetTime: number }> = new Map();

// 速率限制配置
const RATE_LIMIT = {
  windowMs: 60 * 1000,  // 1 分钟窗口
  maxRequests: 60,       // 每分钟最多 60 次请求
};

// API 密钥存储（生产环境应使用数据库）
const API_KEYS = new Map<string, { userId: string; permissions: string[] }>();

/**
 * 速率限制中间件
 */
export function rateLimiter(
  request: FastifyRequest,
  reply: FastifyReply,
  done: () => void
) {
  const clientIp = request.ip || 'unknown';
  const now = Date.now();
  
  let clientData = rateLimitStore.get(clientIp);
  
  if (!clientData || now > clientData.resetTime) {
    clientData = { count: 1, resetTime: now + RATE_LIMIT.windowMs };
    rateLimitStore.set(clientIp, clientData);
  } else {
    clientData.count++;
  }
  
  // 设置速率限制响应头
  reply.header('X-RateLimit-Limit', RATE_LIMIT.maxRequests);
  reply.header('X-RateLimit-Remaining', Math.max(0, RATE_LIMIT.maxRequests - clientData.count));
  reply.header('X-RateLimit-Reset', clientData.resetTime);
  
  if (clientData.count > RATE_LIMIT.maxRequests) {
    reply.code(429).send({
      success: false,
      error: 'Too many requests. Please slow down.',
      retryAfter: Math.ceil((clientData.resetTime - now) / 1000),
    });
    return;
  }
  
  done();
}

/**
 * API 密钥验证中间件
 */
export function apiKeyAuth(
  request: FastifyRequest,
  reply: FastifyReply,
  done: () => void
) {
  const apiKey = request.headers['x-api-key'] as string;
  
  if (!apiKey) {
    reply.code(401).send({
      success: false,
      error: 'Missing API key. Include X-API-Key header.',
    });
    return;
  }
  
  const keyData = API_KEYS.get(apiKey);
  if (!keyData) {
    reply.code(401).send({
      success: false,
      error: 'Invalid API key.',
    });
    return;
  }
  
  // 将用户信息附加到请求
  (request as any).apiUser = keyData;
  done();
}

/**
 * 生成 API 密钥
 */
export function generateApiKey(userId: string, permissions: string[] = ['read']): string {
  const apiKey = `sk_${crypto.randomBytes(32).toString('hex')}`;
  API_KEYS.set(apiKey, { userId, permissions });
  return apiKey;
}

/**
 * 撤销 API 密钥
 */
export function revokeApiKey(apiKey: string): boolean {
  return API_KEYS.delete(apiKey);
}

/**
 * 输入验证 - 钱包地址
 */
export function validateAddress(address: string): boolean {
  // 检查是否是有效的以太坊地址格式
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * 输入验证 - 金额
 */
export function validateAmount(amount: number): boolean {
  return typeof amount === 'number' && amount > 0 && amount < 1e15 && isFinite(amount);
}

/**
 * 清理敏感日志
 */
export function sanitizeLog(obj: any): any {
  const sensitiveKeys = ['apiKey', 'apiSecret', 'secret_key', 'private_key', 'password'];
  const sanitized = { ...obj };
  
  for (const key of Object.keys(sanitized)) {
    if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
      sanitized[key] = '[REDACTED]';
    }
  }
  
  return sanitized;
}

/**
 * 注册安全中间件
 */
export function registerSecurityMiddleware(fastify: FastifyInstance) {
  // 全局速率限制
  fastify.addHook('onRequest', rateLimiter);
  
  // 安全响应头
  fastify.addHook('onSend', (request, reply, payload, done) => {
    reply.header('X-Content-Type-Options', 'nosniff');
    reply.header('X-Frame-Options', 'DENY');
    reply.header('X-XSS-Protection', '1; mode=block');
    reply.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    done();
  });
}
