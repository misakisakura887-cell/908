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
  // === 12种 AI 交易引擎 ===
  {
    id: 'trend_following', name: '📈 趋势追踪 AI', description: '利用深度学习 EMA 交叉识别大周期趋势，在单边行情中"吃掉"整段涨幅。采用快慢均线交叉 + ADX 趋势强度过滤虚假信号，自动设置移动止损保护利润。',
    type: 'btc_quant' as const, assetClass: 'crypto' as const, riskLevel: 2, return7d: 11.5, return30d: 28.3, returnTotal: 132.7, sharpeRatio: 1.56, maxDrawdown: -8.5, winRate: 58, followers: 423, aum: 312000, status: 'active' as const,
    performanceHistory: generatePerformanceData(132.7), recentTrades: [
      { id: 't1', symbol: 'BTC', action: 'buy' as const, time: '2026-03-03 09:15', pnl: 780, pct: 2.3 },
      { id: 't2', symbol: 'ETH', action: 'sell' as const, time: '2026-03-02 16:30', pnl: -120, pct: -0.4 },
    ],
  },
  {
    id: 'swing_trading', name: '🔄 波段震荡 AI', description: '基于布林带 + RSI 均值回归原理，AI 动态计算压力位与支撑位。适合在横盘或宽幅震荡市场中高抛低吸，回撤控制优秀。',
    type: 'btc_quant' as const, assetClass: 'crypto' as const, riskLevel: 1, return7d: 5.8, return30d: 18.2, returnTotal: 78.5, sharpeRatio: 1.92, maxDrawdown: -4.2, winRate: 72, followers: 651, aum: 528000, status: 'active' as const,
    performanceHistory: generatePerformanceData(78.5), recentTrades: [
      { id: 's1', symbol: 'BTC', action: 'buy' as const, time: '2026-03-03 08:45', pnl: 340, pct: 1.1 },
      { id: 's2', symbol: 'ETH', action: 'buy' as const, time: '2026-03-02 22:10', pnl: 210, pct: 0.7 },
    ],
  },
  {
    id: 'hft_scalping', name: '⚡ 极速高频 AI', description: '毫秒级下单，捕捉微小的买卖盘价差。依靠极高胜率和复利效应累积收益，受大盘跌宕影响极小。适合追求稳定日收益的投资者。',
    type: 'btc_quant' as const, assetClass: 'crypto' as const, riskLevel: 2, return7d: 3.2, return30d: 14.8, returnTotal: 95.3, sharpeRatio: 2.85, maxDrawdown: -2.1, winRate: 89, followers: 287, aum: 198000, status: 'active' as const,
    performanceHistory: generatePerformanceData(95.3), recentTrades: [
      { id: 'h1', symbol: 'BTC', action: 'buy' as const, time: '2026-03-03 10:01', pnl: 45, pct: 0.08 },
      { id: 'h2', symbol: 'ETH', action: 'sell' as const, time: '2026-03-03 09:58', pnl: 32, pct: 0.05 },
    ],
  },
  {
    id: 'arbitrage_hedge', name: '🛡️ 套利对冲 AI', description: '跨平台、跨品种套利（资金费率套利、BTC/ETH 比率套利）。追求极低回撤，是稳健型大资金投资者的首选。',
    type: 'btc_quant' as const, assetClass: 'crypto' as const, riskLevel: 1, return7d: 1.8, return30d: 7.2, returnTotal: 42.1, sharpeRatio: 3.45, maxDrawdown: -1.3, winRate: 85, followers: 892, aum: 1250000, status: 'active' as const,
    performanceHistory: generatePerformanceData(42.1), recentTrades: [
      { id: 'a1', symbol: 'BTC', action: 'sell' as const, time: '2026-03-03 08:00', pnl: 120, pct: 0.3 },
      { id: 'a2', symbol: 'ETH', action: 'buy' as const, time: '2026-03-03 08:00', pnl: 95, pct: 0.25 },
    ],
  },
  {
    id: 'grid_martin', name: '📊 马丁/网格进化 AI', description: '传统网格策略的 AI 升级版。由智能算法动态调整网格密度和倍率，根据市场波动率自动扩缩网格范围，有效规避大趋势下的爆仓风险。',
    type: 'btc_quant' as const, assetClass: 'crypto' as const, riskLevel: 2, return7d: 4.5, return30d: 16.7, returnTotal: 88.2, sharpeRatio: 1.67, maxDrawdown: -6.5, winRate: 75, followers: 378, aum: 289000, status: 'active' as const,
    performanceHistory: generatePerformanceData(88.2), recentTrades: [
      { id: 'g1', symbol: 'BTC', action: 'buy' as const, time: '2026-03-03 07:30', pnl: 85, pct: 0.3 },
      { id: 'g2', symbol: 'BTC', action: 'sell' as const, time: '2026-03-03 07:25', pnl: 92, pct: 0.32 },
    ],
  },
  {
    id: 'rl_agent', name: '🤖 强化学习 Agent', description: '像 AlphaGo 一样自我博弈进化。采用 Q-Learning 算法，根据市场反馈实时调整交易动作（买入/卖出/持有），具备极强的环境适应性。',
    type: 'btc_quant' as const, assetClass: 'crypto' as const, riskLevel: 2, return7d: 9.3, return30d: 25.1, returnTotal: 118.6, sharpeRatio: 1.43, maxDrawdown: -9.8, winRate: 61, followers: 156, aum: 145000, status: 'active' as const,
    performanceHistory: generatePerformanceData(118.6), recentTrades: [
      { id: 'r1', symbol: 'BTC', action: 'buy' as const, time: '2026-03-03 09:30', pnl: 560, pct: 1.8 },
    ],
  },
  {
    id: 'sentiment_nlp', name: '🧠 NLP 情绪分析', description: '实时抓取全网社交媒体、新闻、研报，通过 Fear & Greed Index 判断市场恐慌或贪婪程度，反向操作先人一步埋伏。',
    type: 'btc_quant' as const, assetClass: 'crypto' as const, riskLevel: 3, return7d: 14.2, return30d: 32.8, returnTotal: 167.3, sharpeRatio: 1.21, maxDrawdown: -15.3, winRate: 55, followers: 234, aum: 178000, status: 'active' as const,
    performanceHistory: generatePerformanceData(167.3), recentTrades: [
      { id: 'n1', symbol: 'BTC', action: 'buy' as const, time: '2026-03-03 06:00', pnl: 1230, pct: 3.5 },
    ],
  },
  {
    id: 'multifactor_deep', name: '🔬 多因子深度挖掘 AI', description: '同时分析成交量、波动率、动量、ATR、价格位置等数千因子，通过综合评分模型找出人类肉眼无法察觉的隐秘关联。',
    type: 'btc_quant' as const, assetClass: 'crypto' as const, riskLevel: 2, return7d: 7.6, return30d: 21.4, returnTotal: 103.2, sharpeRatio: 1.78, maxDrawdown: -7.2, winRate: 65, followers: 312, aum: 267000, status: 'active' as const,
    performanceHistory: generatePerformanceData(103.2), recentTrades: [
      { id: 'm1', symbol: 'BTC', action: 'buy' as const, time: '2026-03-03 10:15', pnl: 430, pct: 1.4 },
      { id: 'm2', symbol: 'SOL', action: 'sell' as const, time: '2026-03-02 19:20', pnl: 210, pct: 0.9 },
    ],
  },
  {
    id: 'nsp_prediction', name: '🔮 神级预测模型 NSP', description: '利用 Next-State Prediction 范式，融合 5分钟、1小时、4小时三个时间框架的线性回归预测。三框架方向一致时信号最强，极高短线方向感。',
    type: 'btc_quant' as const, assetClass: 'crypto' as const, riskLevel: 3, return7d: 18.5, return30d: 45.2, returnTotal: 215.8, sharpeRatio: 1.15, maxDrawdown: -18.5, winRate: 57, followers: 189, aum: 156000, status: 'active' as const,
    performanceHistory: generatePerformanceData(215.8), recentTrades: [
      { id: 'p1', symbol: 'BTC', action: 'buy' as const, time: '2026-03-03 09:45', pnl: 1560, pct: 4.2 },
    ],
  },
  {
    id: 'dca_conservative', name: '🛡️ 保本增值型', description: '年化 8-15%，最大回撤 < 2%。智能 DCA 定投策略，价格低于均线时自动加倍买入，高于均线时减半。适合大资金长期避险。',
    type: 'btc_quant' as const, assetClass: 'crypto' as const, riskLevel: 1, return7d: 0.8, return30d: 3.5, returnTotal: 28.6, sharpeRatio: 3.12, maxDrawdown: -1.5, winRate: 78, followers: 1234, aum: 2340000, status: 'active' as const,
    performanceHistory: generatePerformanceData(28.6), recentTrades: [
      { id: 'd1', symbol: 'BTC', action: 'buy' as const, time: '2026-03-03 04:00', pnl: 45, pct: 0.15 },
    ],
  },
  {
    id: 'balanced_steady', name: '⚖️ 稳健平衡型', description: '年化 20-50%，最大回撤 < 10%。结合 MACD 金叉 + RSI 中性区进场，保守择时但收益稳定。主流用户的首选策略。',
    type: 'btc_quant' as const, assetClass: 'crypto' as const, riskLevel: 2, return7d: 3.8, return30d: 12.5, returnTotal: 67.3, sharpeRatio: 2.15, maxDrawdown: -5.8, winRate: 68, followers: 756, aum: 890000, status: 'active' as const,
    performanceHistory: generatePerformanceData(67.3), recentTrades: [
      { id: 'b1', symbol: 'BTC', action: 'buy' as const, time: '2026-03-03 08:30', pnl: 290, pct: 0.95 },
      { id: 'b2', symbol: 'ETH', action: 'sell' as const, time: '2026-03-02 20:15', pnl: 175, pct: 0.6 },
    ],
  },
  {
    id: 'aggressive_yolo', name: '🔥 激进暴利型', description: '年化 100%+，最大回撤 > 30%。高杠杆 + 动量突破策略，突破20期高点/低点且放量时全力进场。适合小资金搏杀高倍收益。',
    type: 'btc_quant' as const, assetClass: 'crypto' as const, riskLevel: 3, return7d: 22.3, return30d: 58.7, returnTotal: 312.5, sharpeRatio: 0.89, maxDrawdown: -35.2, winRate: 48, followers: 98, aum: 67000, status: 'active' as const,
    performanceHistory: generatePerformanceData(312.5), recentTrades: [
      { id: 'y1', symbol: 'BTC', action: 'buy' as const, time: '2026-03-03 10:30', pnl: 3450, pct: 8.5 },
      { id: 'y2', symbol: 'SOL', action: 'sell' as const, time: '2026-03-02 15:00', pnl: -890, pct: -3.2 },
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
