/**
 * Hyperliquid API 服务
 * 封装所有与 Hyperliquid 交互的功能
 */

import type {
  ClearinghouseState,
  UserFill,
  OpenOrder,
  AssetPosition,
} from '../types/hyperliquid';

const API_URL = 'https://api.hyperliquid.xyz';

export class HyperliquidService {
  private apiUrl: string;

  constructor(isTestnet = false) {
    this.apiUrl = isTestnet
      ? 'https://api.hyperliquid-testnet.xyz'
      : API_URL;
  }

  /**
   * 发送 Info API 请求
   */
  private async infoRequest<T>(body: Record<string, unknown>): Promise<T> {
    const response = await fetch(`${this.apiUrl}/info`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Hyperliquid API error: ${response.status}`);
    }

    return response.json() as Promise<T>;
  }

  /**
   * 获取用户账户状态（持仓、保证金等）
   */
  async getClearinghouseState(address: string): Promise<ClearinghouseState> {
    return this.infoRequest<ClearinghouseState>({
      type: 'clearinghouseState',
      user: address,
    });
  }

  /**
   * 获取用户当前持仓
   */
  async getPositions(address: string): Promise<AssetPosition[]> {
    const state = await this.getClearinghouseState(address);
    return state.assetPositions;
  }

  /**
   * 获取用户成交记录
   */
  async getUserFills(address: string): Promise<UserFill[]> {
    return this.infoRequest<UserFill[]>({
      type: 'userFills',
      user: address,
    });
  }

  /**
   * 获取用户指定时间范围的成交记录
   */
  async getUserFillsByTime(
    address: string,
    startTime: number,
    endTime?: number
  ): Promise<UserFill[]> {
    return this.infoRequest<UserFill[]>({
      type: 'userFillsByTime',
      user: address,
      startTime,
      endTime: endTime || Date.now(),
    });
  }

  /**
   * 获取用户当前挂单
   */
  async getOpenOrders(address: string): Promise<OpenOrder[]> {
    return this.infoRequest<OpenOrder[]>({
      type: 'openOrders',
      user: address,
    });
  }

  /**
   * 获取所有交易对的中间价
   */
  async getAllMids(): Promise<Record<string, string>> {
    return this.infoRequest<Record<string, string>>({
      type: 'allMids',
    });
  }

  /**
   * 获取 L2 订单簿
   */
  async getL2Book(coin: string): Promise<{
    coin: string;
    time: number;
    levels: Array<Array<{ px: string; sz: string; n: number }>>;
  }> {
    return this.infoRequest({
      type: 'l2Book',
      coin,
    });
  }

  /**
   * 获取用户账户价值
   */
  async getAccountValue(address: string): Promise<number> {
    const state = await this.getClearinghouseState(address);
    return parseFloat(state.marginSummary.accountValue);
  }

  /**
   * 检查用户是否有某个币种的持仓
   */
  async hasPosition(address: string, coin: string): Promise<boolean> {
    const positions = await this.getPositions(address);
    return positions.some(
      (p) => p.position.coin === coin && parseFloat(p.position.szi) !== 0
    );
  }

  /**
   * 获取用户某个币种的持仓详情
   */
  async getPositionByCoin(
    address: string,
    coin: string
  ): Promise<AssetPosition | null> {
    const positions = await this.getPositions(address);
    return positions.find((p) => p.position.coin === coin) || null;
  }
}

// 导出单例
export const hyperliquid = new HyperliquidService();
