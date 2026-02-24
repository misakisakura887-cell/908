import { create } from 'zustand';

export interface StrategyFeature {
  title: string;
  items: string[];
}

export interface Strategy {
  id: string;
  name: string;
  description: string;
  detailedFeatures?: StrategyFeature[];
  managerName?: string;
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
    description: '基于 AI 驱动的黄金期货量化交易策略。通过机器学习模型分析黄金价格的周期性波动、宏观经济指标及避险情绪，精准捕捉短期套利机会。策略采用严格的风控体系，单笔最大亏损控制在 2% 以内，适合追求稳健收益的保守型投资者。',
    detailedFeatures: [
      {
        title: '交易标的',
        items: ['黄金现货（XAUUSD）', '黄金期货（GC）', '黄金 ETF（GLD）']
      },
      {
        title: '策略特点',
        items: ['AI 模型实时分析宏观经济数据', '捕捉黄金周期性波动机会', '严格止损机制，单笔亏损 ≤2%', '日均 2-5 次交易，持仓周期 4-48 小时']
      },
      {
        title: '风控措施',
        items: ['单笔仓位上限 20%', '每日最大亏损限额 5%', '波动率过高时自动减仓', '避险情绪指标实时监控']
      },
      {
        title: '适合人群',
        items: ['追求稳健收益的保守型投资者', '希望资产配置中增加避险品种', '对黄金市场感兴趣的新手投资者']
      }
    ],
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
    description: '专为加密货币高波动市场设计的智能量化策略。运用多因子模型结合链上数据分析，自动识别 BTC 的趋势突破与超卖反弹信号。策略内置动态止盈止损机制，在捕捉上涨行情的同时有效控制回撤，适合能承受一定波动、追求较高收益的成长型投资者。',
    detailedFeatures: [
      {
        title: '交易标的',
        items: ['比特币永续合约（BTCUSDT）', 'BTC 现货', '相关加密货币联动品种']
      },
      {
        title: '策略特点',
        items: ['多因子量化模型实时运算', '链上数据（大户持仓、资金流向）辅助判断', '趋势突破 + 超卖反弹双策略并行', '动态调整止盈止损点位']
      },
      {
        title: '风控措施',
        items: ['单笔杠杆上限 3 倍', '浮亏超 8% 强制减仓', '极端行情自动暂停交易', '分批建仓降低择时风险']
      },
      {
        title: '适合人群',
        items: ['能承受较高波动的成长型投资者', '看好加密货币长期发展', '希望通过量化方式参与 BTC 交易']
      }
    ],
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
    description: '跟单资深基金经理金明的核心主观策略。聚焦美股 Top 100 头部股票，核心持仓精选 Mag 7 科技巨头及 AI 存储主线标的；同时配置黄金、BTC 等负相关资产实现多元化风险对冲。策略灵活运用空仓、做空及 ETF 工具进行动态调仓，并通过主流汇率对（如 USD/CNY）操作增强收益敞口，追求绝对回报。',
    managerName: '金明',
    detailedFeatures: [
      {
        title: '核心持仓选择',
        items: ['主仓集中在 Mag 7（苹果、微软、谷歌、亚马逊、Meta、英伟达、特斯拉）', '重点关注 AI 存储相关主线标的', '覆盖美股前 100 只头部股票分析']
      },
      {
        title: '多资产配置',
        items: ['涵盖黄金、BTC 等主流资产', '配置负相关资产策略，降低组合整体风险', '追求资产间的风险对冲效应']
      },
      {
        title: '风险管理与调整',
        items: ['灵活运用空仓和做空工具对冲风险', '通过 ETF 实现投资组合的多元化风险调整', '根据市场情况进行实时动态调仓']
      },
      {
        title: '收益增强',
        items: ['通过主流汇率对（如 USD/CNY）操作增加收益敞口', '把握宏观经济趋势带来的汇率机会', '追求绝对回报而非相对收益']
      }
    ],
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
