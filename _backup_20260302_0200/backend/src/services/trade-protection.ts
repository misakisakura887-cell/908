/**
 * 交易保护服务
 * 防御：三明治攻击、滑点保护、延迟检测
 */

import { hyperliquid } from './hyperliquid';

// 配置
const CONFIG = {
  maxSlippagePercent: 1.0,        // 最大允许滑点 1%
  maxDelayMs: 5000,               // 最大允许延迟 5 秒
  minOrderSize: 1,                // 最小订单金额 $1
  maxOrderSizePercent: 10,        // 单笔最大占账户 10%
  cooldownMs: 1000,               // 订单间隔至少 1 秒
};

// 订单历史（用于检测异常）
const orderHistory: Array<{
  userId: string;
  coin: string;
  side: 'buy' | 'sell';
  size: number;
  price: number;
  timestamp: number;
}> = [];

/**
 * 检查滑点是否在可接受范围内
 */
export async function checkSlippage(
  coin: string,
  expectedPrice: number,
  side: 'buy' | 'sell'
): Promise<{ acceptable: boolean; currentPrice: number; slippagePercent: number }> {
  const mids = await hyperliquid.getAllMids();
  const currentPrice = parseFloat(mids[coin] || '0');
  
  if (currentPrice === 0) {
    return { acceptable: false, currentPrice: 0, slippagePercent: 100 };
  }
  
  const slippagePercent = Math.abs((currentPrice - expectedPrice) / expectedPrice) * 100;
  
  return {
    acceptable: slippagePercent <= CONFIG.maxSlippagePercent,
    currentPrice,
    slippagePercent,
  };
}

/**
 * 检查信号延迟
 */
export function checkSignalDelay(
  leaderTradeTime: number
): { acceptable: boolean; delayMs: number } {
  const now = Date.now();
  const delayMs = now - leaderTradeTime;
  
  return {
    acceptable: delayMs <= CONFIG.maxDelayMs,
    delayMs,
  };
}

/**
 * 验证订单参数
 */
export function validateOrder(params: {
  userId: string;
  coin: string;
  side: 'buy' | 'sell';
  size: number;
  accountValue: number;
}): { valid: boolean; error?: string } {
  const { size, accountValue } = params;
  
  // 检查最小订单金额
  if (size < CONFIG.minOrderSize) {
    return { valid: false, error: `Order size too small. Minimum: $${CONFIG.minOrderSize}` };
  }
  
  // 检查最大订单占比
  const maxSize = accountValue * (CONFIG.maxOrderSizePercent / 100);
  if (size > maxSize) {
    return { 
      valid: false, 
      error: `Order size exceeds ${CONFIG.maxOrderSizePercent}% of account. Max: $${maxSize.toFixed(2)}` 
    };
  }
  
  // 检查冷却时间
  const recentOrder = orderHistory.find(
    o => o.userId === params.userId && o.coin === params.coin
  );
  if (recentOrder && Date.now() - recentOrder.timestamp < CONFIG.cooldownMs) {
    return { valid: false, error: 'Please wait before placing another order on this pair' };
  }
  
  return { valid: true };
}

/**
 * 检测异常交易模式（可能的攻击）
 */
export function detectAnomalousPattern(
  userId: string,
  coin: string,
  size: number
): { suspicious: boolean; reason?: string } {
  const userOrders = orderHistory.filter(o => o.userId === userId);
  const last5Minutes = Date.now() - 5 * 60 * 1000;
  const recentOrders = userOrders.filter(o => o.timestamp > last5Minutes);
  
  // 检查 5 分钟内订单数量
  if (recentOrders.length > 20) {
    return { suspicious: true, reason: 'Too many orders in short period' };
  }
  
  // 检查突然的大额订单
  const avgSize = recentOrders.length > 0
    ? recentOrders.reduce((sum, o) => sum + o.size, 0) / recentOrders.length
    : 0;
  if (avgSize > 0 && size > avgSize * 5) {
    return { suspicious: true, reason: 'Order size significantly larger than average' };
  }
  
  return { suspicious: false };
}

/**
 * 记录订单（用于后续分析）
 */
export function recordOrder(order: {
  userId: string;
  coin: string;
  side: 'buy' | 'sell';
  size: number;
  price: number;
}) {
  orderHistory.unshift({
    ...order,
    timestamp: Date.now(),
  });
  
  // 只保留最近 1000 条记录
  if (orderHistory.length > 1000) {
    orderHistory.pop();
  }
}

/**
 * 计算安全的跟单数量（考虑滑点）
 */
export function calculateSafeCopySize(
  leaderSize: number,
  copyRatio: number,
  userAccountValue: number,
  currentPrice: number,
  expectedPrice: number
): number {
  // 基础跟单数量
  let copySize = leaderSize * copyRatio;
  
  // 限制最大仓位
  const maxSize = userAccountValue * (CONFIG.maxOrderSizePercent / 100);
  copySize = Math.min(copySize, maxSize);
  
  // 如果价格已经移动，减少仓位
  const priceMovement = Math.abs((currentPrice - expectedPrice) / expectedPrice);
  if (priceMovement > 0.001) { // 0.1% 以上的移动
    const reductionFactor = Math.max(0.5, 1 - priceMovement * 10);
    copySize *= reductionFactor;
  }
  
  return Math.max(CONFIG.minOrderSize, copySize);
}

/**
 * 获取保护配置
 */
export function getProtectionConfig() {
  return { ...CONFIG };
}

/**
 * 更新保护配置
 */
export function updateProtectionConfig(updates: Partial<typeof CONFIG>) {
  Object.assign(CONFIG, updates);
}
