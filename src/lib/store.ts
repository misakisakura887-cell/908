import { create } from 'zustand';

export interface Strategy {
  id: string;
  name: string;
  description: string;
  type: 'gold_quant' | 'btc_quant' | 'leader_subjective';
  assetClass: 'commodity' | 'crypto' | 'mixed';
  riskLevel: 1 | 2 | 3;
  return7d: number;
  return30d: number;
  returnTotal: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  followers: number;
  aum: number;
  status: 'active' | 'paused';
  performanceHistory: { date: string; value: number }[];
  recentTrades: Trade[];
}

export interface Trade {
  id: string;
  symbol: string;
  action: 'buy' | 'sell';
  time: string;
  pnl: number;
  pct: number;
}

export interface Position {
  strategyId: string;
  strategyName: string;
  invested: number;
  current: number;
  pnl: number;
  pnlPct: number;
}

export interface UserState {
  isConnected: boolean;
  address: string | null;
  totalAssets: number;
  totalInvested: number;
  totalPnl: number;
  todayPnl: number;
  positions: Position[];
  trades: Trade[];
}

// Mock data
const mockStrategies: Strategy[] = [
  {
    id: '1',
    name: '黄金量化策略',
    description: '基于微软开源模型的黄金量化交易策略，结合历史数据和实时市场信号',
    type: 'gold_quant',
    assetClass: 'commodity',
    riskLevel: 1,
    return7d: 12.3,
    return30d: 34.1,
    returnTotal: 156.8,
    sharpeRatio: 1.82,
    maxDrawdown: -5.2,
    winRate: 68,
    followers: 342,
    aum: 234567.89,
    status: 'active',
    performanceHistory: generatePerformanceData(156.8),
    recentTrades: [
      { id: '1', symbol: 'XAUUSD', action: 'buy', time: '2026-02-24 14:23', pnl: 342, pct: 1.2 },
      { id: '2', symbol: 'XAUUSD', action: 'sell', time: '2026-02-24 12:01', pnl: -125, pct: -0.4 },
      { id: '3', symbol: 'XAUUSD', action: 'buy', time: '2026-02-24 09:45', pnl: 567, pct: 1.8 },
    ],
  },
  {
    id: '2',
    name: 'BTC 量化策略',
    description: '针对 BTC 高波动性优化的量化策略，自动捕捉趋势和反转信号',
    type: 'btc_quant',
    assetClass: 'crypto',
    riskLevel: 2,
    return7d: 8.7,
    return30d: 22.5,
    returnTotal: 89.3,
    sharpeRatio: 1.34,
    maxDrawdown: -8.1,
    winRate: 62,
    followers: 567,
    aum: 456789.12,
    status: 'active',
    performanceHistory: generatePerformanceData(89.3),
    recentTrades: [
      { id: '4', symbol: 'BTCUSDT', action: 'sell', time: '2026-02-24 13:15', pnl: 892, pct: 2.1 },
      { id: '5', symbol: 'BTCUSDT', action: 'buy', time: '2026-02-24 10:30', pnl: -234, pct: -0.6 },
      { id: '6', symbol: 'BTCUSDT', action: 'sell', time: '2026-02-23 16:45', pnl: 456, pct: 1.1 },
    ],
  },
  {
    id: '3',
    name: '龙头主观策略',
    description: '跟单见崎的主观策略，涵盖美股 AI/存储龙头、BTC、黄金',
    type: 'leader_subjective',
    assetClass: 'mixed',
    riskLevel: 2,
    return7d: 15.2,
    return30d: 38.6,
    returnTotal: 201.5,
    sharpeRatio: 2.01,
    maxDrawdown: -6.8,
    winRate: 71,
    followers: 189,
    aum: 189234.56,
    status: 'active',
    performanceHistory: generatePerformanceData(201.5),
    recentTrades: [
      { id: '7', symbol: 'NVDA', action: 'buy', time: '2026-02-24 15:30', pnl: 1234, pct: 3.2 },
      { id: '8', symbol: 'XAUUSD', action: 'sell', time: '2026-02-24 11:20', pnl: 567, pct: 1.5 },
      { id: '9', symbol: 'BTCUSDT', action: 'buy', time: '2026-02-23 14:00', pnl: -189, pct: -0.5 },
    ],
  },
];

function generatePerformanceData(totalReturn: number): { date: string; value: number }[] {
  const data = [];
  const days = 90;
  let value = 100;
  const dailyReturn = Math.pow(1 + totalReturn / 100, 1 / days) - 1;
  
  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const volatility = (Math.random() - 0.5) * 4;
    value = value * (1 + dailyReturn + volatility / 100);
    data.push({
      date: date.toISOString().split('T')[0],
      value: Math.round(value * 100) / 100,
    });
  }
  return data;
}

interface AppStore {
  // Strategies
  strategies: Strategy[];
  selectedStrategy: Strategy | null;
  setSelectedStrategy: (strategy: Strategy | null) => void;
  getStrategyById: (id: string) => Strategy | undefined;
  
  // User
  user: UserState;
  setUserConnected: (connected: boolean, address?: string) => void;
  
  // Investment
  investAmount: number;
  setInvestAmount: (amount: number) => void;
  invest: (strategyId: string, amount: number) => Promise<boolean>;
  withdraw: (strategyId: string, amount: number) => Promise<boolean>;
  
  // UI
  isInvesting: boolean;
  isWithdrawing: boolean;
}

export const useStore = create<AppStore>((set, get) => ({
  // Strategies
  strategies: mockStrategies,
  selectedStrategy: null,
  setSelectedStrategy: (strategy) => set({ selectedStrategy: strategy }),
  getStrategyById: (id) => get().strategies.find((s) => s.id === id),
  
  // User
  user: {
    isConnected: false,
    address: null,
    totalAssets: 24582,
    totalInvested: 20000,
    totalPnl: 4582,
    todayPnl: 124,
    positions: [
      { strategyId: '1', strategyName: '黄金量化策略', invested: 5000, current: 6100, pnl: 1100, pnlPct: 22.0 },
      { strategyId: '2', strategyName: 'BTC 量化策略', invested: 8000, current: 9800, pnl: 1800, pnlPct: 22.5 },
      { strategyId: '3', strategyName: '龙头主观策略', invested: 7000, current: 8682, pnl: 1682, pnlPct: 24.0 },
    ],
    trades: [
      { id: 't1', symbol: '黄金量化策略', action: 'buy', time: '2026-02-24 14:23', pnl: 342, pct: 1.2 },
      { id: 't2', symbol: 'BTC 量化策略', action: 'sell', time: '2026-02-24 12:01', pnl: -125, pct: -0.4 },
      { id: 't3', symbol: '龙头主观策略', action: 'buy', time: '2026-02-24 09:45', pnl: 567, pct: 1.8 },
      { id: 't4', symbol: '黄金量化策略', action: 'sell', time: '2026-02-23 16:30', pnl: 234, pct: 0.9 },
      { id: 't5', symbol: 'BTC 量化策略', action: 'buy', time: '2026-02-23 10:15', pnl: -89, pct: -0.3 },
    ],
  },
  setUserConnected: (connected, address) => 
    set((state) => ({
      user: { ...state.user, isConnected: connected, address: address || null }
    })),
  
  // Investment
  investAmount: 100,
  setInvestAmount: (amount) => set({ investAmount: amount }),
  invest: async (strategyId, amount) => {
    set({ isInvesting: true });
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    set((state) => {
      const existingPosition = state.user.positions.find((p) => p.strategyId === strategyId);
      const strategy = state.strategies.find((s) => s.id === strategyId);
      
      if (existingPosition) {
        return {
          isInvesting: false,
          user: {
            ...state.user,
            totalInvested: state.user.totalInvested + amount,
            totalAssets: state.user.totalAssets + amount,
            positions: state.user.positions.map((p) =>
              p.strategyId === strategyId
                ? { ...p, invested: p.invested + amount, current: p.current + amount }
                : p
            ),
          },
        };
      } else {
        return {
          isInvesting: false,
          user: {
            ...state.user,
            totalInvested: state.user.totalInvested + amount,
            totalAssets: state.user.totalAssets + amount,
            positions: [
              ...state.user.positions,
              {
                strategyId,
                strategyName: strategy?.name || '',
                invested: amount,
                current: amount,
                pnl: 0,
                pnlPct: 0,
              },
            ],
          },
        };
      }
    });
    return true;
  },
  withdraw: async (strategyId, amount) => {
    set({ isWithdrawing: true });
    await new Promise((resolve) => setTimeout(resolve, 1500));
    set((state) => ({
      isWithdrawing: false,
      user: {
        ...state.user,
        positions: state.user.positions.map((p) =>
          p.strategyId === strategyId
            ? { ...p, invested: p.invested - amount, current: p.current - amount }
            : p
        ).filter((p) => p.current > 0),
      },
    }));
    return true;
  },
  
  // UI
  isInvesting: false,
  isWithdrawing: false,
}));
