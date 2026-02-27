// Hyperliquid API 类型定义

export interface ClearinghouseState {
  marginSummary: {
    accountValue: string;
    totalNtlPos: string;
    totalRawUsd: string;
    totalMarginUsed: string;
  };
  crossMarginSummary: {
    accountValue: string;
    totalNtlPos: string;
    totalRawUsd: string;
    totalMarginUsed: string;
  };
  crossMaintenanceMarginUsed: string;
  withdrawable: string;
  assetPositions: AssetPosition[];
  time: number;
}

export interface AssetPosition {
  position: {
    coin: string;
    szi: string;           // 仓位大小（带符号，正=多，负=空）
    leverage: {
      type: string;
      value: number;
    };
    entryPx: string;       // 入场价格
    positionValue: string; // 仓位价值
    unrealizedPnl: string; // 未实现盈亏
    returnOnEquity: string;
    liquidationPx: string | null;
    marginUsed: string;
  };
  type: string;
}

export interface UserFill {
  coin: string;
  px: string;              // 成交价格
  sz: string;              // 成交数量
  side: 'B' | 'A';         // B=买入, A=卖出
  time: number;            // 时间戳
  startPosition: string;   // 交易前仓位
  dir: string;             // 方向描述
  closedPnl: string;       // 已平仓盈亏
  hash: string;            // 交易哈希
  oid: number;             // 订单ID
  crossed: boolean;        // 是否是吃单
  fee: string;             // 手续费
  tid: number;             // 交易ID
  feeToken: string;
}

export interface OpenOrder {
  coin: string;
  limitPx: string;
  oid: number;
  side: 'B' | 'A';
  sz: string;
  timestamp: number;
}

export interface OrderRequest {
  coin: string;
  is_buy: boolean;
  sz: number;
  limit_px: number;
  order_type: {
    limit: {
      tif: 'Gtc' | 'Ioc' | 'Alo';
    };
  } | {
    trigger: {
      isMarket: boolean;
      triggerPx: number;
      tpsl: 'tp' | 'sl';
    };
  };
  reduce_only: boolean;
}

export interface CopyTradeConfig {
  userId: string;              // 跟单用户ID
  userAddress: string;         // 用户钱包地址
  apiKey: string;              // 用户API密钥（加密存储）
  apiSecret: string;           // 用户API私钥（加密存储）
  leaderAddress: string;       // 被跟单者地址
  copyRatio: number;           // 跟单比例 (0-1)
  maxPositionSize: number;     // 最大仓位（USDC）
  stopLossPercent?: number;    // 止损百分比
  isActive: boolean;           // 是否启用
  createdAt: Date;
  updatedAt: Date;
}

export interface CopyTradeLog {
  id: string;
  userId: string;
  leaderTrade: UserFill;       // 原始交易
  copyTrade?: UserFill;        // 跟单交易
  status: 'pending' | 'success' | 'failed' | 'skipped';
  error?: string;
  copySize: number;            // 跟单数量
  copyPrice: number;           // 跟单价格
  timestamp: Date;
}
