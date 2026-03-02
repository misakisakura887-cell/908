/**
 * 跟单监控服务
 * 监控领导者的交易并触发跟单
 */

import { hyperliquid, HyperliquidService } from './hyperliquid';
import type { UserFill, CopyTradeConfig, CopyTradeLog } from '../types/hyperliquid';

// 金明老师的钱包地址
const LEADER_ADDRESS = '0x29c89eC30a43c8d12b6BD4E99d3D6E5CBf1AEb28';

// 轮询间隔（毫秒）
const POLL_INTERVAL = 2000; // 2秒

export class CopyTradeMonitor {
  private hl: HyperliquidService;
  private leaderAddress: string;
  private lastProcessedTid: number = 0;
  private isRunning: boolean = false;
  private pollTimer: NodeJS.Timeout | null = null;
  
  // 事件回调
  private onNewTrade?: (trade: UserFill) => void;
  private onError?: (error: Error) => void;

  constructor(leaderAddress: string = LEADER_ADDRESS) {
    this.hl = hyperliquid;
    this.leaderAddress = leaderAddress;
  }

  /**
   * 设置新交易回调
   */
  setOnNewTrade(callback: (trade: UserFill) => void) {
    this.onNewTrade = callback;
  }

  /**
   * 设置错误回调
   */
  setOnError(callback: (error: Error) => void) {
    this.onError = callback;
  }

  /**
   * 启动监控
   */
  async start() {
    if (this.isRunning) {
      console.log('[CopyTradeMonitor] Already running');
      return;
    }

    console.log(`[CopyTradeMonitor] Starting monitor for ${this.leaderAddress}`);
    this.isRunning = true;

    // 获取初始交易记录，设置起始点
    try {
      const fills = await this.hl.getUserFills(this.leaderAddress);
      if (fills.length > 0) {
        this.lastProcessedTid = fills[0].tid;
        console.log(`[CopyTradeMonitor] Initial tid: ${this.lastProcessedTid}`);
      }
    } catch (error) {
      console.error('[CopyTradeMonitor] Failed to get initial fills:', error);
    }

    // 开始轮询
    this.poll();
  }

  /**
   * 停止监控
   */
  stop() {
    console.log('[CopyTradeMonitor] Stopping monitor');
    this.isRunning = false;
    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
      this.pollTimer = null;
    }
  }

  /**
   * 轮询检查新交易
   */
  private async poll() {
    if (!this.isRunning) return;

    try {
      const fills = await this.hl.getUserFills(this.leaderAddress);
      
      // 找出新交易（tid 大于上次处理的）
      const newFills = fills.filter((f) => f.tid > this.lastProcessedTid);
      
      if (newFills.length > 0) {
        console.log(`[CopyTradeMonitor] Found ${newFills.length} new trades`);
        
        // 按时间顺序处理（从旧到新）
        newFills.sort((a, b) => a.tid - b.tid);
        
        for (const fill of newFills) {
          console.log(`[CopyTradeMonitor] New trade: ${fill.coin} ${fill.side === 'B' ? 'BUY' : 'SELL'} ${fill.sz} @ ${fill.px}`);
          
          // 触发回调
          if (this.onNewTrade) {
            this.onNewTrade(fill);
          }
          
          // 更新最后处理的 tid
          this.lastProcessedTid = fill.tid;
        }
      }
    } catch (error) {
      console.error('[CopyTradeMonitor] Poll error:', error);
      if (this.onError && error instanceof Error) {
        this.onError(error);
      }
    }

    // 安排下次轮询
    this.pollTimer = setTimeout(() => this.poll(), POLL_INTERVAL);
  }

  /**
   * 获取领导者当前状态
   */
  async getLeaderStatus() {
    const [state, positions, fills] = await Promise.all([
      this.hl.getClearinghouseState(this.leaderAddress),
      this.hl.getPositions(this.leaderAddress),
      this.hl.getUserFills(this.leaderAddress),
    ]);

    return {
      address: this.leaderAddress,
      accountValue: parseFloat(state.marginSummary.accountValue),
      totalPositionValue: parseFloat(state.marginSummary.totalNtlPos),
      positions: positions.map((p) => ({
        coin: p.position.coin,
        size: parseFloat(p.position.szi),
        entryPrice: parseFloat(p.position.entryPx),
        unrealizedPnl: parseFloat(p.position.unrealizedPnl),
        leverage: p.position.leverage.value,
      })),
      recentTrades: fills.slice(0, 10).map((f) => ({
        coin: f.coin,
        side: f.side === 'B' ? 'BUY' : 'SELL',
        size: parseFloat(f.sz),
        price: parseFloat(f.px),
        pnl: parseFloat(f.closedPnl),
        time: new Date(f.time).toISOString(),
      })),
      isMonitoring: this.isRunning,
    };
  }
}

// 导出单例
export const copyTradeMonitor = new CopyTradeMonitor();
