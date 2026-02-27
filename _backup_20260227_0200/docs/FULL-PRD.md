# Mirror-AI 完整产品需求文档 (Full PRD)

> 版本：v1.0 - 完整开发版  
> 创建日期：2026-02-14  
> 目标读者：Claude Opus 4.6 / 开发团队  
> 文档用途：作为完整的产品开发蓝图

---

## 📋 目录

1. [产品概述](#1-产品概述)
2. [产品设计](#2-产品设计)
3. [技术架构](#3-技术架构)
4. [功能需求详解](#4-功能需求详解)
5. [数据模型](#5-数据模型)
6. [API 设计](#6-api-设计)
7. [测试计划](#7-测试计划)
8. [安全与性能](#8-安全与性能)
9. [开发路线图](#9-开发路线图)
10. [附录](#10-附录)

---

## 1. 产品概述

### 1.1 产品定位
**Mirror-AI** 是一个人人可用的 AI 量化投资平台，通过 Hyperliquid DEX 实现**免税交易**，让普通人以 **1 美金起投**的门槛参与专业级投资策略。

### 1.2 核心价值主张
1. **超低门槛**：1 美金起投，普惠金融
2. **免税优势**：通过 Hyperliquid 规避美股高额税费
3. **AI 驱动**：量化模型 24/7 自动交易
4. **实时透明**：资产自持，收益实时可见
5. **多资产支持**：美股、加密货币、黄金等

### 1.3 目标用户
- **主要用户**：持有 USDT 的加密投资者（不愿离场，寻求稳健收益）
- **次要用户**：
  - 想参与美股 AI 红利但不懂美股的小白
  - 寻求免税方案的高净值投资者
  - 量化交易爱好者

### 1.4 核心指标 (KPIs)
- 注册用户数
- 活跃策略数
- 总锁仓价值 (TVL)
- 日均交易量
- 用户平均收益率
- 用户留存率 (D1/D7/D30)

---

## 2. 产品设计

### 2.1 设计原则
1. **极简主义**：复杂的金融产品，简单的操作界面
2. **实时反馈**：所有关键数据实时更新（WebSocket）
3. **信任建立**：透明展示策略逻辑、历史表现、风险指标
4. **移动优先**：响应式设计，移动端体验优先
5. **暗色主题**：符合金融/交易应用习惯

### 2.2 UI/UX 设计方案

#### 2.2.1 整体风格
- **色彩方案**：
  - 主色：深蓝/紫色渐变 (#1a1b2e → #16213e)
  - 强调色：荧光绿 (#00ff88) 用于涨幅、正收益
  - 警告色：荧光红 (#ff4757) 用于跌幅、负收益
  - 中性色：灰白 (#e0e0e0) 用于文本
- **字体**：
  - 英文：Inter / SF Pro Display（现代感、易读性）
  - 中文：思源黑体 / 阿里巴巴普惠体
  - 数字：Roboto Mono（等宽，适合金融数据）
- **图标库**：Lucide Icons / Heroicons

#### 2.2.2 页面结构

##### A. 首页 (Landing Page)
**目标**：3 秒内让用户理解产品价值

**布局**：
```
+------------------------------------------+
|  Header: Logo | 策略广场 | 我的投资 | 连接钱包  |
+------------------------------------------+
|                                          |
|   [Hero Section]                         |
|   超大标题：人人可用的 AI 投资平台          |
|   副标题：1 美金起投 · 免税交易 · AI 驱动  |
|   CTA 按钮：[立即开始] [查看策略]          |
|                                          |
|   [核心数据展示]                          |
|   +-----------+-----------+-----------+  |
|   | 累计收益  | 活跃用户  | 策略数量  |  |
|   | $2.3M    | 12,458   | 8        |  |
|   +-----------+-----------+-----------+  |
|                                          |
|   [策略卡片 - 横向滚动]                    |
|   +----------------+  +----------------+ |
|   | 黄金量化策略    |  | BTC 量化策略   | |
|   | 7日收益 +12.3% |  | 7日收益 +8.7%  | |
|   | 夏普比率 1.82  |  | 夏普比率 1.34  | |
|   | [查看详情]     |  | [查看详情]     | |
|   +----------------+  +----------------+ |
|                                          |
|   [如何运作]                              |
|   Step 1: 连接钱包 → Step 2: 选择策略    |
|   → Step 3: 投入金额 → Step 4: 开始赚钱   |
|                                          |
|   [Footer]                               |
+------------------------------------------+
```

**关键元素**：
- 动态数字滚动效果（累计收益等）
- 策略卡片悬停时显示更多信息
- 响应式布局（移动端垂直堆叠）

---

##### B. 策略广场 (Strategy Marketplace)
**目标**：让用户快速找到适合自己的策略

**布局**：
```
+------------------------------------------+
|  [筛选栏]                                 |
|  按资产类型: [全部] [美股] [加密] [黄金]   |
|  按风险: [低] [中] [高]                   |
|  排序: [收益率↓] [夏普比率] [跟投人数]    |
+------------------------------------------+
|                                          |
|  [策略列表 - 网格布局]                     |
|                                          |
|  +----------------+  +----------------+  |
|  | 黄金量化策略    |  | BTC 量化策略   |  |
|  +----------------+  +----------------+  |
|  | [收益曲线图]    |  | [收益曲线图]   |  |
|  | 7日: +12.3%    |  | 7日: +8.7%     |  |
|  | 30日: +34.1%   |  | 30日: +22.5%   |  |
|  | 最大回撤: -5.2%|  | 最大回撤: -8.1%|  |
|  | 夏普比率: 1.82 |  | 夏普比率: 1.34 |  |
|  | 跟投人数: 342  |  | 跟投人数: 567  |  |
|  | [立即投资]     |  | [立即投资]     |  |
|  +----------------+  +----------------+  |
|                                          |
|  +----------------+  +----------------+  |
|  | 龙头主观策略    |  | 龙头量化策略   |  |
|  | (开发中)       |  | (开发中)       |  |
|  +----------------+  +----------------+  |
+------------------------------------------+
```

**交互设计**：
- 筛选/排序实时生效（无需刷新）
- 策略卡片点击 → 跳转策略详情页
- 收益曲线图支持缩放（7日/30日/全部）

---

##### C. 策略详情页 (Strategy Detail)
**目标**：提供全面信息，帮助用户决策

**布局**：
```
+------------------------------------------+
|  [返回] 黄金量化策略                       |
+------------------------------------------+
|                                          |
|  [左侧 - 核心信息 60%]                     |
|  +------------------------------------+  |
|  | [大号收益曲线图]                    |  |
|  | 时间范围: [7日] [30日] [90日] [全部] |  |
|  +------------------------------------+  |
|                                          |
|  [关键指标卡片]                            |
|  +--------+--------+--------+--------+   |
|  | 累计收益| 夏普比 | 最大回撤| 胜率   |   |
|  | +34.1% | 1.82  | -5.2%  | 68.3% |   |
|  +--------+--------+--------+--------+   |
|                                          |
|  [策略说明]                                |
|  - 基于微软开源量化模型                     |
|  - 黄金价格走势 + 宏观经济数据               |
|  - 自动化信号生成，24/7 交易                |
|                                          |
|  [交易记录表格]                            |
|  时间       | 操作 | 价格   | 收益率      |
|  ---------|------|--------|-----------|
|  02-14 10:32 | 买入 | $2,031 | -         |
|  02-13 15:47 | 卖出 | $2,048 | +0.84%    |
|                                          |
|  [右侧 - 投资面板 40%]                     |
|  +------------------------------------+  |
|  | 🎯 立即投资                         |  |
|  |                                    |  |
|  | 当前跟投人数: 342 人                 |  |
|  | 总锁仓金额: $234,567                |  |
|  |                                    |  |
|  | [连接钱包] (未连接)                  |  |
|  |                                    |  |
|  | 投资金额 (USDT)                     |  |
|  | [       500        ] [最大]        |  |
|  |                                    |  |
|  | 预估手续费: ~$10 (2%)               |  |
|  |                                    |  |
|  | [确认投资]                          |  |
|  +------------------------------------+  |
|                                          |
|  [风险提示]                                |
|  ⚠️ 投资有风险，请根据自身情况决策          |
+------------------------------------------+
```

**关键功能**：
- 收益曲线图支持多时间维度切换
- 交易记录实时更新（WebSocket）
- 投资金额输入验证（最低 1 美金）
- 钱包连接状态检测

---

##### D. 用户个人中心 (My Dashboard)
**目标**：用户管理投资、查看收益的主要界面

**布局**：
```
+------------------------------------------+
|  [头部]                                   |
|  我的投资  |  总资产: $5,234.56 (+12.3%) |
|  连接地址: 0x742d...4a8f  [断开连接]      |
+------------------------------------------+
|                                          |
|  [总览卡片]                                |
|  +-----------+-----------+-----------+   |
|  | 总投入    | 当前价值  | 累计收益  |    |
|  | $4,500   | $5,234   | +$734     |    |
|  +-----------+-----------+-----------+   |
|                                          |
|  [资产分布饼图]                            |
|  +------------------------------------+  |
|  |        [Pie Chart]                 |  |
|  | 黄金策略: 40%  BTC策略: 35%         |  |
|  | 龙头策略: 25%                       |  |
|  +------------------------------------+  |
|                                          |
|  [我的策略列表]                            |
|  +------------------------------------+  |
|  | 📊 黄金量化策略                     |  |
|  | 投入: $2,000 | 当前: $2,246 (+12.3%)|  |
|  | [查看] [追加] [赎回]                |  |
|  +------------------------------------+  |
|  +------------------------------------+  |
|  | 📈 BTC 量化策略                     |  |
|  | 投入: $1,500 | 当前: $1,628 (+8.5%) |  |
|  | [查看] [追加] [赎回]                |  |
|  +------------------------------------+  |
|                                          |
|  [收益历史曲线]                            |
|  +------------------------------------+  |
|  | [折线图: 总资产变化]                |  |
|  | 时间范围: [7日] [30日] [全部]       |  |
|  +------------------------------------+  |
|                                          |
|  [交易记录]                                |
|  时间       | 策略   | 操作 | 金额       |
|  ---------|--------|------|-----------|
|  02-14 10:32 | 黄金   | 买入 | +$500    |
|  02-13 15:47 | BTC    | 赎回 | -$300    |
+------------------------------------------+
```

**实时数据更新**：
- 资产价值每秒刷新（WebSocket）
- 收益率变化实时显示
- 策略交易信号实时推送（可选通知）

---

##### E. 钱包连接流程 (Wallet Connection)
**目标**：无缝集成 Web3 钱包

**流程图**：
```
用户点击 [连接钱包]
    ↓
弹出钱包选择模态框
    ├─ MetaMask
    ├─ WalletConnect (支持多钱包)
    ├─ Coinbase Wallet
    └─ Trust Wallet
    ↓
用户选择钱包类型
    ↓
唤起钱包插件 / 扫码
    ↓
用户授权签名 (EIP-191)
    ↓
后端验证签名
    ↓
生成 Session Token
    ↓
连接成功 → 跳转个人中心
```

**安全要点**：
- 签名消息包含 nonce + timestamp（防重放攻击）
- Session Token 有效期 24 小时
- 不存储用户私钥，只存储公钥地址

---

### 2.3 核心功能逻辑

#### 2.3.1 投资流程
```
1. 用户选择策略
   ↓
2. 点击 [立即投资]
   ↓
3. 输入投资金额（最低 $1）
   ↓
4. 系统计算手续费
   ↓
5. 用户确认交易
   ↓
6. 唤起钱包签名
   ↓
7. 后端调用 Hyperliquid API
   ↓
8. 资金转入策略托管地址
   ↓
9. 策略开始运行
   ↓
10. 实时更新用户仓位
```

#### 2.3.2 策略执行逻辑
```
[量化模型] → 生成交易信号
    ↓
[风控模块] → 验证信号合理性
    ↓
[订单模块] → 提交到 Hyperliquid
    ↓
[成交反馈] → 更新用户仓位
    ↓
[收益计算] → 实时更新 PnL
```

#### 2.3.3 赎回流程
```
用户点击 [赎回]
    ↓
系统计算当前价值
    ↓
用户确认赎回金额
    ↓
后端平仓策略仓位（按比例）
    ↓
资金返回用户钱包
    ↓
更新用户资产记录
```

---

## 3. 技术架构

### 3.1 整体架构图
```
                    [用户浏览器]
                         |
                    HTTPS/WSS
                         |
              +----------+----------+
              |                     |
        [Vercel CDN]          [WebSocket]
              |                     |
        [Next.js App]               |
              |                     |
              +----------+----------+
                         |
                    API Gateway
                         |
        +----------------+----------------+
        |                |                |
   [Auth Service]   [Trading Service]  [AI Service]
        |                |                |
        +-------+--------+--------+-------+
                |                 |
        [PostgreSQL]      [Hyperliquid API]
                |                 |
        [Redis Cache]     [Price Oracle]
```

### 3.2 技术栈选型

#### 3.2.1 前端
| 技术 | 用途 | 理由 |
|------|------|------|
| **Next.js 14** | 框架 | SSR + SSG，SEO 友好，Vercel 原生支持 |
| **React 18** | UI 库 | 主流，生态完善 |
| **TypeScript** | 类型安全 | 减少 bug，提升开发体验 |
| **TailwindCSS** | 样式 | 快速开发，易于定制 |
| **shadcn/ui** | 组件库 | 美观、无头组件、易扩展 |
| **Recharts** | 图表 | 响应式，易用 |
| **wagmi** | Web3 | 钱包连接、签名、合约交互 |
| **viem** | 以太坊客户端 | 轻量、类型安全 |
| **Zustand** | 状态管理 | 简单、性能好 |
| **React Query** | 数据获取 | 缓存、自动重试、乐观更新 |
| **Socket.io-client** | 实时通信 | 与后端 WebSocket 通信 |

#### 3.2.2 后端
| 技术 | 用途 | 理由 |
|------|------|------|
| **Node.js 20** | 运行时 | 异步 I/O，适合高并发 |
| **Fastify** | 框架 | 比 Express 快 2 倍，TypeScript 友好 |
| **TypeScript** | 类型安全 | 前后端统一语言 |
| **Prisma** | ORM | 类型安全，迁移管理好 |
| **PostgreSQL 16** | 主数据库 | ACID，支持 JSON，稳定 |
| **Redis 7** | 缓存/队列 | 实时数据缓存，订单队列 |
| **Bull** | 任务队列 | 处理量化信号、批量订单 |
| **Socket.io** | WebSocket | 实时推送行情、仓位变化 |
| **Hyperliquid SDK** | 交易接口 | 官方 SDK，稳定 |
| **Jose** | JWT | Web 标准，安全 |

#### 3.2.3 AI/量化
| 技术 | 用途 | 理由 |
|------|------|------|
| **Python 3.11** | 量化脚本 | 生态完善，库多 |
| **PyTorch** | 模型训练 | 灵活，研究友好 |
| **pandas** | 数据处理 | 金融数据分析标准 |
| **ccxt** | 行情数据 | 统一交易所接口 |
| **Backtesting.py** | 策略回测 | 简单易用 |

#### 3.2.4 部署
| 服务 | 平台 | 理由 |
|------|------|------|
| **前端** | Vercel | 免费 SSL，全球 CDN，自动部署 |
| **后端** | Railway / Render | 简单，自动扩容，免费额度 |
| **数据库** | Supabase / Neon | Serverless PostgreSQL，免费层大方 |
| **Redis** | Upstash | Serverless Redis，按需计费 |
| **量化服务** | AWS EC2 / DigitalOcean | 需要持续运行，VPS 合适 |

---

### 3.3 数据库设计

#### 3.3.1 表结构

##### A. users (用户表)
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address VARCHAR(42) UNIQUE NOT NULL, -- 以太坊地址
  nonce VARCHAR(64) NOT NULL,                 -- 用于签名验证
  created_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP,
  
  INDEX idx_wallet (wallet_address)
);
```

##### B. strategies (策略表)
```sql
CREATE TABLE strategies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  strategy_type VARCHAR(50),    -- 'gold_quant', 'btc_quant', 'leader_subjective', 'leader_quant'
  asset_class VARCHAR(50),       -- 'crypto', 'stock', 'commodity'
  risk_level INT,                -- 1=低, 2=中, 3=高
  
  -- 性能指标
  total_return DECIMAL(10, 4),   -- 累计收益率
  sharpe_ratio DECIMAL(10, 4),   -- 夏普比率
  max_drawdown DECIMAL(10, 4),   -- 最大回撤
  win_rate DECIMAL(5, 2),        -- 胜率
  
  total_aum DECIMAL(20, 2),      -- 总锁仓金额 (AUM)
  follower_count INT DEFAULT 0,  -- 跟投人数
  
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_type (strategy_type),
  INDEX idx_active (is_active)
);
```

##### C. user_positions (用户仓位表)
```sql
CREATE TABLE user_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  strategy_id UUID REFERENCES strategies(id) ON DELETE CASCADE,
  
  invested_amount DECIMAL(20, 2) NOT NULL,   -- 投入金额
  current_value DECIMAL(20, 2),              -- 当前价值
  realized_pnl DECIMAL(20, 2) DEFAULT 0,     -- 已实现盈亏
  unrealized_pnl DECIMAL(20, 2) DEFAULT 0,   -- 未实现盈亏
  
  entry_time TIMESTAMP DEFAULT NOW(),
  last_update TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_user (user_id),
  INDEX idx_strategy (strategy_id),
  UNIQUE (user_id, strategy_id)
);
```

##### D. trades (交易记录表)
```sql
CREATE TABLE trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_id UUID REFERENCES strategies(id),
  
  symbol VARCHAR(20),            -- 'BTC/USDT', 'XAUUSD', 'AAPL'
  side VARCHAR(4),               -- 'BUY', 'SELL'
  quantity DECIMAL(20, 8),
  price DECIMAL(20, 8),
  
  order_id VARCHAR(100),         -- Hyperliquid 订单 ID
  status VARCHAR(20),            -- 'pending', 'filled', 'cancelled'
  
  fee DECIMAL(20, 8),
  executed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_strategy (strategy_id),
  INDEX idx_symbol (symbol),
  INDEX idx_time (executed_at)
);
```

##### E. strategy_performance (策略表现历史)
```sql
CREATE TABLE strategy_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_id UUID REFERENCES strategies(id),
  
  date DATE NOT NULL,
  daily_return DECIMAL(10, 4),   -- 日收益率
  cumulative_return DECIMAL(10, 4),
  aum DECIMAL(20, 2),
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE (strategy_id, date),
  INDEX idx_strategy_date (strategy_id, date)
);
```

---

### 3.4 API 设计

#### 3.4.1 RESTful API

##### 认证相关
```http
POST /api/auth/nonce
# 获取签名用的 nonce
Request: { "walletAddress": "0x..." }
Response: { "nonce": "abc123..." }

POST /api/auth/verify
# 验证签名，登录
Request: { 
  "walletAddress": "0x...",
  "signature": "0x...",
  "message": "Sign this message..."
}
Response: { 
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { "id": "uuid", "walletAddress": "0x..." }
}
```

##### 策略相关
```http
GET /api/strategies
# 获取所有策略列表
Query: ?type=gold_quant&riskLevel=1
Response: {
  "strategies": [
    {
      "id": "uuid",
      "name": "黄金量化策略",
      "totalReturn": 34.12,
      "sharpeRatio": 1.82,
      ...
    }
  ]
}

GET /api/strategies/:id
# 获取策略详情
Response: {
  "strategy": { ... },
  "performanceHistory": [ ... ],
  "recentTrades": [ ... ]
}
```

##### 投资相关
```http
POST /api/invest
# 投资到策略
Headers: { "Authorization": "Bearer <token>" }
Request: {
  "strategyId": "uuid",
  "amount": 500
}
Response: {
  "success": true,
  "positionId": "uuid"
}

POST /api/redeem
# 赎回
Headers: { "Authorization": "Bearer <token>" }
Request: {
  "positionId": "uuid",
  "amount": 100  // 部分赎回，或不传则全部赎回
}
Response: {
  "success": true,
  "redeemedAmount": 108.5
}
```

##### 用户相关
```http
GET /api/user/portfolio
# 获取用户投资组合
Headers: { "Authorization": "Bearer <token>" }
Response: {
  "totalValue": 5234.56,
  "totalInvested": 4500,
  "totalPnl": 734.56,
  "positions": [
    {
      "strategyId": "uuid",
      "strategyName": "黄金量化策略",
      "investedAmount": 2000,
      "currentValue": 2246,
      "pnl": 246,
      "pnlPercent": 12.3
    }
  ]
}
```

#### 3.4.2 WebSocket 接口

##### 连接
```javascript
// 客户端连接
const socket = io('wss://api.mirror-ai.com', {
  auth: { token: 'Bearer <token>' }
});
```

##### 事件订阅
```javascript
// 订阅策略实时数据
socket.emit('subscribe:strategy', { strategyId: 'uuid' });

// 接收策略更新
socket.on('strategy:update', (data) => {
  // data: { strategyId, currentReturn, aum, ... }
});

// 订阅用户仓位更新
socket.emit('subscribe:portfolio');

// 接收仓位更新
socket.on('portfolio:update', (data) => {
  // data: { positions: [...], totalValue, totalPnl }
});

// 接收交易通知
socket.on('trade:notification', (data) => {
  // data: { strategyName, action: 'BUY', symbol: 'BTC', price, ... }
});
```

---

## 4. 功能需求详解

### 4.1 核心功能模块

#### 4.1.1 钱包连接模块
**需求**：支持主流 Web3 钱包，安全认证

**实现细节**：
1. 使用 `wagmi` 库集成钱包
2. 支持钱包类型：
   - MetaMask（浏览器插件）
   - WalletConnect（移动钱包扫码）
   - Coinbase Wallet
   - Trust Wallet
3. 认证流程：
   ```typescript
   // 前端
   const { signMessage } = useSignMessage();
   
   async function login() {
     // 1. 获取 nonce
     const { nonce } = await fetch('/api/auth/nonce', {
       method: 'POST',
       body: JSON.stringify({ walletAddress: address })
     }).then(r => r.json());
     
     // 2. 签名消息
     const message = `Sign in to Mirror-AI\nNonce: ${nonce}\nTimestamp: ${Date.now()}`;
     const signature = await signMessage({ message });
     
     // 3. 验证签名
     const { token } = await fetch('/api/auth/verify', {
       method: 'POST',
       body: JSON.stringify({ walletAddress: address, signature, message })
     }).then(r => r.json());
     
     // 4. 存储 token
     localStorage.setItem('authToken', token);
   }
   ```

**安全考虑**：
- Nonce 有效期 5 分钟
- 签名消息包含时间戳（防重放）
- JWT Token 有效期 24 小时，支持刷新

---

#### 4.1.2 策略展示模块
**需求**：清晰展示策略表现，帮助用户决策

**关键指标**：
| 指标 | 含义 | 计算方式 |
|------|------|----------|
| 累计收益率 | 策略总收益 | (当前净值 - 初始净值) / 初始净值 × 100% |
| 夏普比率 | 风险调整后收益 | (策略收益率 - 无风险收益率) / 收益率标准差 |
| 最大回撤 | 最大跌幅 | (峰值 - 谷底) / 峰值 × 100% |
| 胜率 | 盈利交易占比 | 盈利交易次数 / 总交易次数 × 100% |

**数据更新频率**：
- 实时数据（WebSocket）：当前净值、AUM、跟投人数
- 分钟级（API 轮询）：日收益率、持仓明细
- 日级（定时任务）：夏普比率、最大回撤

---

#### 4.1.3 投资/赎回模块
**需求**：简单、安全、快速的资金操作

**投资流程技术实现**：
```typescript
// 后端 API: POST /api/invest
async function handleInvest(req: FastifyRequest) {
  const { strategyId, amount } = req.body;
  const userId = req.user.id; // 从 JWT 解析
  
  // 1. 验证
  if (amount < 1) throw new Error('最低投资 1 美金');
  
  const strategy = await prisma.strategy.findUnique({ where: { id: strategyId } });
  if (!strategy || !strategy.isActive) throw new Error('策略不可用');
  
  // 2. 调用 Hyperliquid API 转账
  const txHash = await hyperliquidSDK.transfer({
    from: req.user.walletAddress,
    to: strategy.custodyAddress,
    amount: amount
  });
  
  // 3. 创建/更新用户仓位
  await prisma.userPosition.upsert({
    where: { userId_strategyId: { userId, strategyId } },
    create: {
      userId,
      strategyId,
      investedAmount: amount,
      currentValue: amount
    },
    update: {
      investedAmount: { increment: amount },
      currentValue: { increment: amount }
    }
  });
  
  // 4. 更新策略 AUM
  await prisma.strategy.update({
    where: { id: strategyId },
    data: {
      totalAum: { increment: amount },
      followerCount: { increment: 1 } // 如果是新用户
    }
  });
  
  // 5. WebSocket 推送更新
  io.to(userId).emit('portfolio:update', await getUserPortfolio(userId));
  
  return { success: true, txHash };
}
```

**赎回流程**：
- 用户发起赎回请求
- 后端计算当前价值（考虑浮动盈亏）
- 调用 Hyperliquid API 平仓对应份额
- 资金返回用户钱包
- 更新数据库记录

---

#### 4.1.4 实时数据推送模块
**需求**：用户看到的数据必须是实时的

**技术方案**：
```typescript
// 后端 WebSocket 服务
io.on('connection', (socket) => {
  // 用户订阅自己的投资组合
  socket.on('subscribe:portfolio', async () => {
    const userId = socket.data.userId; // 从 token 解析
    socket.join(`user:${userId}`);
    
    // 立即发送当前数据
    const portfolio = await getUserPortfolio(userId);
    socket.emit('portfolio:update', portfolio);
  });
  
  // 用户订阅策略详情
  socket.on('subscribe:strategy', ({ strategyId }) => {
    socket.join(`strategy:${strategyId}`);
    
    // 发送当前数据
    const strategy = await getStrategyDetail(strategyId);
    socket.emit('strategy:update', strategy);
  });
});

// 定时任务：每 5 秒更新所有活跃策略
setInterval(async () => {
  const strategies = await prisma.strategy.findMany({ where: { isActive: true } });
  
  for (const strategy of strategies) {
    // 从 Hyperliquid 获取最新净值
    const latestValue = await hyperliquidSDK.getStrategyValue(strategy.id);
    
    // 计算收益率
    const returnRate = (latestValue - strategy.totalAum) / strategy.totalAum;
    
    // 更新数据库
    await prisma.strategy.update({
      where: { id: strategy.id },
      data: { totalReturn: returnRate }
    });
    
    // 推送给订阅者
    io.to(`strategy:${strategy.id}`).emit('strategy:update', {
      strategyId: strategy.id,
      totalReturn: returnRate,
      currentValue: latestValue
    });
  }
}, 5000);
```

---

### 4.2 量化策略模块

#### 4.2.1 黄金量化策略
**技术实现**：
```python
# 策略脚本: strategies/gold_quant.py
import pandas as pd
import numpy as np
from hyperliquid import Client

class GoldQuantStrategy:
    def __init__(self, api_key, api_secret):
        self.client = Client(api_key, api_secret)
        self.symbol = 'XAUUSD'  # 黄金
        
    def fetch_data(self):
        # 获取黄金价格数据（最近 100 根 K 线）
        klines = self.client.get_klines(self.symbol, interval='1h', limit=100)
        df = pd.DataFrame(klines, columns=['timestamp', 'open', 'high', 'low', 'close', 'volume'])
        return df
    
    def generate_signal(self, df):
        # 简单策略：双均线
        df['ma_short'] = df['close'].rolling(window=10).mean()
        df['ma_long'] = df['close'].rolling(window=30).mean()
        
        # 金叉 -> 买入信号
        if df['ma_short'].iloc[-1] > df['ma_long'].iloc[-1] and \
           df['ma_short'].iloc[-2] <= df['ma_long'].iloc[-2]:
            return 'BUY'
        
        # 死叉 -> 卖出信号
        if df['ma_short'].iloc[-1] < df['ma_long'].iloc[-1] and \
           df['ma_short'].iloc[-2] >= df['ma_long'].iloc[-2]:
            return 'SELL'
        
        return 'HOLD'
    
    def execute_trade(self, signal):
        if signal == 'BUY':
            # 计算仓位（根据策略 AUM）
            quantity = self.calculate_position_size()
            order = self.client.create_order(
                symbol=self.symbol,
                side='BUY',
                quantity=quantity,
                order_type='MARKET'
            )
            return order
        
        elif signal == 'SELL':
            # 平掉所有仓位
            position = self.client.get_position(self.symbol)
            if position and position['quantity'] > 0:
                order = self.client.create_order(
                    symbol=self.symbol,
                    side='SELL',
                    quantity=position['quantity'],
                    order_type='MARKET'
                )
                return order
        
        return None
    
    def run(self):
        # 主循环（每小时运行一次）
        while True:
            try:
                df = self.fetch_data()
                signal = self.generate_signal(df)
                
                if signal in ['BUY', 'SELL']:
                    order = self.execute_trade(signal)
                    print(f"[{datetime.now()}] Signal: {signal}, Order: {order}")
                
                time.sleep(3600)  # 1 小时
            except Exception as e:
                print(f"Error: {e}")
                time.sleep(60)

if __name__ == '__main__':
    strategy = GoldQuantStrategy(api_key='xxx', api_secret='yyy')
    strategy.run()
```

**部署方式**：
- 部署在 VPS（如 DigitalOcean Droplet）
- 使用 `systemd` 或 `pm2` 守护进程
- 日志输出到文件，定期审查

---

#### 4.2.2 BTC 量化策略
**复用黄金策略架构**，主要区别：
- `symbol = 'BTCUSD'`
- 调整参数（如均线周期）以适应加密市场高波动性
- 增加风控：单笔交易最大亏损限制

---

#### 4.2.3 龙头主观策略
**初期实现**：
- 见崎手动下单（通过 Hyperliquid 交易所）
- 后端监听见崎账户的交易记录（通过 Hyperliquid API）
- 自动同步到跟单用户（按比例执行）

**技术方案**：
```typescript
// 定时任务：监听见崎账户交易
setInterval(async () => {
  const trades = await hyperliquidSDK.getRecentTrades(LEADER_WALLET_ADDRESS);
  
  for (const trade of trades) {
    // 检查是否已处理
    const existing = await prisma.trade.findUnique({ where: { orderId: trade.id } });
    if (existing) continue;
    
    // 记录交易
    await prisma.trade.create({
      data: {
        strategyId: LEADER_STRATEGY_ID,
        symbol: trade.symbol,
        side: trade.side,
        quantity: trade.quantity,
        price: trade.price,
        orderId: trade.id,
        executedAt: trade.timestamp
      }
    });
    
    // 同步到跟单用户
    await syncToFollowers(trade);
  }
}, 10000); // 每 10 秒检查

async function syncToFollowers(trade) {
  // 获取所有跟单该策略的用户
  const followers = await prisma.userPosition.findMany({
    where: { strategyId: LEADER_STRATEGY_ID }
  });
  
  for (const follower of followers) {
    // 计算跟单比例
    const ratio = follower.investedAmount / LEADER_AUM;
    const quantity = trade.quantity * ratio;
    
    // 为用户下单
    await hyperliquidSDK.createOrder({
      walletAddress: follower.user.walletAddress,
      symbol: trade.symbol,
      side: trade.side,
      quantity: quantity,
      orderType: 'MARKET'
    });
  }
}
```

---

## 5. 数据模型

### 5.1 关键实体关系图 (ERD)
```
users (用户)
  ├── 1:N → user_positions (用户仓位)
  │            └── N:1 → strategies (策略)
  │
  └── 1:N → transactions (交易记录)

strategies (策略)
  ├── 1:N → user_positions (跟投用户)
  ├── 1:N → trades (策略交易)
  └── 1:N → strategy_performance (历史表现)
```

### 5.2 数据流向
```
用户投资
  ↓
user_positions (创建仓位)
  ↓
strategies.totalAum (更新 AUM)
  ↓
量化策略执行交易
  ↓
trades (记录交易)
  ↓
计算收益
  ↓
user_positions.currentValue (更新当前价值)
  ↓
WebSocket 推送给用户
```

---

## 6. API 设计

### 6.1 API 规范
- **协议**：HTTPS
- **格式**：JSON
- **认证**：JWT Bearer Token
- **版本**：URL 前缀 `/api/v1`
- **错误处理**：统一格式
  ```json
  {
    "error": {
      "code": "INVALID_AMOUNT",
      "message": "投资金额必须大于 1 美金"
    }
  }
  ```

### 6.2 API 速率限制
| 端点类型 | 限制 | 窗口 |
|----------|------|------|
| 公开端点 | 100 req/min | 每 IP |
| 认证端点 | 300 req/min | 每用户 |
| 交易端点 | 10 req/min | 每用户 |

### 6.3 完整 API 列表
*（见 3.4 API 设计章节）*

---

## 7. 测试计划

### 7.1 测试策略
| 测试类型 | 覆盖范围 | 目标 |
|----------|----------|------|
| 单元测试 | 工具函数、业务逻辑 | 80% 覆盖率 |
| 集成测试 | API 端点、数据库交互 | 所有端点 |
| E2E 测试 | 完整用户流程 | 核心路径 |
| 性能测试 | 并发、响应时间 | 1000 并发 |
| 安全测试 | 认证、授权、注入 | OWASP Top 10 |

### 7.2 测试用例

#### 7.2.1 单元测试示例
```typescript
// tests/unit/auth.test.ts
import { verifySignature } from '@/lib/auth';

describe('verifySignature', () => {
  it('应该验证有效的签名', async () => {
    const message = 'Sign in to Mirror-AI\nNonce: abc123';
    const signature = '0x...'; // 预先生成的有效签名
    const walletAddress = '0x742d...4a8f';
    
    const result = await verifySignature(message, signature, walletAddress);
    expect(result).toBe(true);
  });
  
  it('应该拒绝无效的签名', async () => {
    const message = 'Sign in to Mirror-AI\nNonce: abc123';
    const signature = '0xinvalid';
    const walletAddress = '0x742d...4a8f';
    
    const result = await verifySignature(message, signature, walletAddress);
    expect(result).toBe(false);
  });
});
```

#### 7.2.2 集成测试示例
```typescript
// tests/integration/invest.test.ts
import { createTestServer } from '@/tests/utils';

describe('POST /api/invest', () => {
  let server;
  let authToken;
  
  beforeAll(async () => {
    server = await createTestServer();
    authToken = await getTestAuthToken(); // 测试用户登录
  });
  
  it('应该成功创建投资', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/api/invest',
      headers: { authorization: `Bearer ${authToken}` },
      payload: {
        strategyId: 'test-strategy-uuid',
        amount: 100
      }
    });
    
    expect(response.statusCode).toBe(200);
    expect(response.json().success).toBe(true);
  });
  
  it('应该拒绝小于 1 美金的投资', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/api/invest',
      headers: { authorization: `Bearer ${authToken}` },
      payload: {
        strategyId: 'test-strategy-uuid',
        amount: 0.5
      }
    });
    
    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toBe('INVALID_AMOUNT');
  });
});
```

#### 7.2.3 E2E 测试示例
```typescript
// tests/e2e/invest-flow.spec.ts
import { test, expect } from '@playwright/test';

test('完整投资流程', async ({ page }) => {
  // 1. 访问首页
  await page.goto('https://mirror-ai.com');
  
  // 2. 连接钱包（使用 MetaMask 测试网）
  await page.click('text=连接钱包');
  await page.click('text=MetaMask');
  // ... 钱包交互（需要 MetaMask Playwright 插件）
  
  // 3. 选择策略
  await page.click('text=策略广场');
  await page.click('text=黄金量化策略');
  
  // 4. 投资
  await page.fill('input[name="amount"]', '100');
  await page.click('text=确认投资');
  
  // 5. 确认签名
  // ... 钱包签名交互
  
  // 6. 验证成功
  await expect(page.locator('text=投资成功')).toBeVisible();
  
  // 7. 检查个人中心
  await page.click('text=我的投资');
  await expect(page.locator('text=黄金量化策略')).toBeVisible();
  await expect(page.locator('text=$100')).toBeVisible();
});
```

### 7.3 性能测试

#### 7.3.1 负载测试脚本
```javascript
// tests/load/invest.load.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '1m', target: 100 },   // 1 分钟内增加到 100 用户
    { duration: '3m', target: 100 },   // 维持 100 用户 3 分钟
    { duration: '1m', target: 500 },   // 增加到 500 用户
    { duration: '3m', target: 500 },   // 维持 500 用户 3 分钟
    { duration: '1m', target: 0 },     // 降到 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% 请求 < 500ms
    http_req_failed: ['rate<0.01'],   // 失败率 < 1%
  },
};

export default function () {
  const token = 'test-token-xxx'; // 使用测试 token
  
  const payload = JSON.stringify({
    strategyId: 'test-strategy-uuid',
    amount: 100
  });
  
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
  };
  
  let response = http.post('https://api.mirror-ai.com/api/invest', payload, params);
  
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
  
  sleep(1);
}
```

**运行**：
```bash
k6 run tests/load/invest.load.js
```

**预期结果**：
- 1000 并发时，P95 响应时间 < 500ms
- 错误率 < 1%

---

## 8. 安全与性能

### 8.1 安全设计

#### 8.1.1 认证与授权
| 层级 | 措施 | 目的 |
|------|------|------|
| **认证** | - 钱包签名验证（EIP-191）<br>- JWT Token（24h 过期）<br>- Refresh Token（7d 过期） | 确保用户身份 |
| **授权** | - RBAC（用户/管理员）<br>- 资源隔离（用户只能访问自己的数据） | 防止越权访问 |
| **传输** | - 强制 HTTPS<br>- TLS 1.3 | 防止中间人攻击 |

#### 8.1.2 防御措施
| 攻击类型 | 防御方案 |
|----------|----------|
| **SQL 注入** | - 使用 Prisma ORM（参数化查询）<br>- 输入验证（Zod） |
| **XSS** | - React 自动转义<br>- CSP Header<br>- DOMPurify 清洗用户输入 |
| **CSRF** | - SameSite Cookie<br>- 双重提交 Cookie |
| **DDoS** | - Cloudflare / AWS Shield<br>- 速率限制（Redis） |
| **重放攻击** | - Nonce + Timestamp<br>- 签名消息唯一性 |

#### 8.1.3 敏感数据保护
- **私钥**：永远不存储用户私钥
- **API 密钥**：环境变量 + Secrets Manager（AWS/Vercel）
- **数据库**：
  - 生产环境启用加密（AWS RDS Encryption）
  - 定期备份
  - 最小权限原则（数据库用户权限）

#### 8.1.4 审计日志
```typescript
// 记录所有敏感操作
await auditLog.create({
  userId: req.user.id,
  action: 'INVEST',
  resource: 'strategy',
  resourceId: strategyId,
  amount: amount,
  ipAddress: req.ip,
  userAgent: req.headers['user-agent'],
  timestamp: new Date()
});
```

---

### 8.2 性能优化

#### 8.2.1 前端优化
| 技术 | 措施 | 效果 |
|------|------|------|
| **代码分割** | Next.js 动态导入 | 首屏加载 < 2s |
| **图片优化** | next/image（WebP、懒加载） | 减少 50% 带宽 |
| **缓存** | React Query（SWR） | 减少 API 调用 |
| **CDN** | Vercel Edge Network | 全球 < 100ms 延迟 |

#### 8.2.2 后端优化
| 技术 | 措施 | 效果 |
|------|------|------|
| **数据库** | - 索引优化<br>- 连接池<br>- 只读副本（读写分离） | 查询 < 50ms |
| **缓存** | Redis（热数据、策略表现） | 减少 80% 数据库查询 |
| **API** | - 批量请求<br>- GraphQL（按需查询）<br>- 响应压缩 (gzip) | 减少网络传输 |
| **异步处理** | Bull 队列（交易执行、收益计算） | 非阻塞 API |

#### 8.2.3 数据库优化
```sql
-- 关键索引
CREATE INDEX idx_user_positions_user ON user_positions(user_id);
CREATE INDEX idx_trades_strategy_time ON trades(strategy_id, executed_at DESC);
CREATE INDEX idx_performance_strategy_date ON strategy_performance(strategy_id, date DESC);

-- 分区表（历史数据）
CREATE TABLE trades_2026 PARTITION OF trades
  FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');
```

#### 8.2.4 并发架构
```
                [Load Balancer]
                       |
         +-------------+-------------+
         |             |             |
    [API Server 1] [API Server 2] [API Server 3]
         |             |             |
         +-------------+-------------+
                       |
              [PostgreSQL Primary]
                   |       |
            [Read Replica 1] [Read Replica 2]
```

**目标**：
- 支持 **5000 并发用户**
- API 响应时间 P95 < 500ms
- 数据库查询 P99 < 100ms

---

## 9. 开发路线图

### 9.1 Phase 1 - MVP（4-6 周）
**目标**：核心功能可用，能够完成完整投资流程

| 周 | 任务 | 负责模块 |
|----|------|----------|
| **Week 1-2** | 前端基础架构 + UI 组件库 | 前端 |
|  | 后端 API 框架 + 数据库设计 | 后端 |
|  | Hyperliquid API 集成 | 后端 |
| **Week 3** | 钱包连接 + 认证系统 | 前端 + 后端 |
|  | 策略展示页 | 前端 |
|  | 投资/赎回 API | 后端 |
| **Week 4** | 用户个人中心 | 前端 |
|  | WebSocket 实时推送 | 后端 |
|  | 黄金量化策略开发 | 量化 |
| **Week 5** | BTC 量化策略开发 | 量化 |
|  | 龙头主观跟单系统 | 后端 |
| **Week 6** | 集成测试 + Bug 修复 | 全栈 |
|  | 部署到测试环境 | DevOps |

**交付物**：
- 功能完整的 Web 应用
- 3 个可用策略（黄金、BTC、龙头主观）
- 基础测试覆盖

---

### 9.2 Phase 2 - 优化迭代（2-4 周）
**目标**：提升用户体验，增加高级功能

| 任务 | 优先级 |
|------|--------|
| 策略回测展示 | 高 |
| 移动端适配优化 | 高 |
| 性能优化（CDN、缓存） | 高 |
| 策略详情页增强（更多图表） | 中 |
| 社交功能（评论、点赞） | 低 |
| 推荐系统（AI 推荐策略） | 低 |

---

### 9.3 Phase 3 - 扩展生态（4-8 周）
**目标**：开放策略市场，吸引创作者

| 任务 | 描述 |
|------|------|
| 策略创建工具 | 让第三方创建并发布策略 |
| 策略审核系统 | 人工 + AI 审核策略安全性 |
| 激励机制 | 策略师分成、排行榜 |
| 移动端 App | iOS + Android 原生 App |
| 多链支持 | 扩展到其他链（Arbitrum、Base） |

---

## 10. 附录

### 10.1 技术栈版本清单
```json
{
  "frontend": {
    "next": "14.2.0",
    "react": "18.3.0",
    "typescript": "5.4.0",
    "tailwindcss": "3.4.0",
    "wagmi": "2.5.0",
    "viem": "2.9.0"
  },
  "backend": {
    "node": "20.12.0",
    "fastify": "4.26.0",
    "prisma": "5.11.0",
    "typescript": "5.4.0",
    "bull": "4.12.0",
    "socket.io": "4.7.0"
  },
  "database": {
    "postgresql": "16.2",
    "redis": "7.2"
  },
  "ai": {
    "python": "3.11",
    "pytorch": "2.2.0",
    "pandas": "2.2.0"
  }
}
```

### 10.2 环境变量清单
```bash
# .env.example
# 数据库
DATABASE_URL="postgresql://user:password@localhost:5432/mirror_ai"
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="your-super-secret-key-change-this"
JWT_EXPIRES_IN="24h"

# Hyperliquid API
HYPERLIQUID_API_KEY="your-api-key"
HYPERLIQUID_API_SECRET="your-api-secret"
HYPERLIQUID_MAINNET="true"  # false for testnet

# 策略托管地址
STRATEGY_GOLD_ADDRESS="0x..."
STRATEGY_BTC_ADDRESS="0x..."
STRATEGY_LEADER_ADDRESS="0x..."

# 外部服务
BRAVE_API_KEY="your-brave-search-key"  # 可选

# 前端
NEXT_PUBLIC_API_URL="https://api.mirror-ai.com"
NEXT_PUBLIC_WS_URL="wss://api.mirror-ai.com"
```

### 10.3 部署检查清单
- [ ] 环境变量配置完整
- [ ] 数据库迁移执行
- [ ] SSL 证书配置
- [ ] CDN 配置
- [ ] 监控告警（Sentry / Datadog）
- [ ] 日志系统（ELK / Loki）
- [ ] 备份策略（每日自动备份）
- [ ] 负载测试通过
- [ ] 安全扫描通过（OWASP ZAP）

### 10.4 Hyperliquid API 参考
**官方文档**：https://hyperliquid.gitbook.io/hyperliquid-docs/

**关键端点**：
```typescript
// 获取账户余额
GET /info/user/state
Response: {
  balances: { USDC: "10000.00" },
  positions: [ ... ]
}

// 创建订单
POST /exchange/order
Request: {
  type: "market",
  symbol: "BTC",
  side: "buy",
  size: "0.1"
}

// 获取 K 线数据
GET /info/candles
Query: { symbol: "BTC", interval: "1h", limit: 100 }
```

---

## 总结

这份 PRD 涵盖了 **Mirror-AI** 从产品设计到技术实现的完整蓝图，包括：

✅ **产品设计**：详细的 UI/UX 方案、页面布局、交互流程  
✅ **技术架构**：前后端技术栈、数据库设计、API 规范  
✅ **功能需求**：核心模块实现细节、代码示例  
✅ **测试计划**：单元测试、集成测试、E2E 测试、性能测试  
✅ **安全与性能**：安全防御措施、性能优化策略、并发架构  
✅ **开发路线图**：分阶段开发计划、优先级排序

**下一步行动**：
1. 将此 PRD 喂给 **Claude Opus 4.6**
2. 让 Opus 开始实现 **Phase 1 - MVP**
3. 定期 Review 进度，调整计划

---

*文档版本：v1.0*  
*最后更新：2026-02-14*  
*维护者：TAKI 团队*
