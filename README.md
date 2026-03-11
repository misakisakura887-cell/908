# Mirror AI — 人人可用的 AI 投资平台

基于 Hyperliquid DEX 的去中心化 AI 投资平台。

## 项目结构

```
908/
├── src/                  # 前端 (Next.js 14)
│   ├── app/              # 页面路由
│   │   ├── admin/        # 管理后台
│   │   ├── trade/        # 交易跟单
│   │   ├── portfolio/    # 资产管理
│   │   ├── strategies/   # 策略广场
│   │   ├── deposit/      # HL 充值指引
│   │   └── withdraw/     # 提现
│   ├── components/       # UI 组件
│   └── lib/              # 工具库
├── backend/              # 后端 (Fastify + Prisma)
│   ├── src/
│   │   ├── index.ts      # 入口
│   │   ├── modules/      # 业务模块
│   │   │   ├── admin/    # 管理后台 API
│   │   │   ├── auth/     # 认证 (钱包签名)
│   │   │   ├── copytrade/# 跟单系统
│   │   │   ├── strategy/ # 策略管理
│   │   │   ├── bots/     # 12种交易机器人
│   │   │   └── ...
│   │   └── lib/          # DB, Redis, Email
│   └── prisma/           # 数据库 Schema
├── docker-compose.yml    # PostgreSQL + Redis
└── package.json          # 前端依赖
```

## 快速启动

### 环境要求
- Node.js 18+
- PostgreSQL 16
- Redis 7

### 1. 前端
```bash
npm install
npm run dev -- -p 3000
```

### 2. 后端
```bash
cd backend
cp .env.example .env  # 编辑配置
npm install
npx prisma db push
PORT=3001 npx tsx src/index.ts
```

### 3. 环境变量
前端 `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

后端 `backend/.env`:
```
DATABASE_URL=postgresql://mirror:mirror@localhost:5432/mirror
REDIS_URL=redis://localhost:6379
JWT_SECRET=<至少32字符>
ENCRYPTION_KEY=<加密密钥>
```

## 核心功能

- **钱包登录**: MetaMask/WalletConnect 签名验证
- **一键跟单**: 跟随策略老师仓位，自动在用户 HL 账户下单
- **实时持仓**: 5秒刷新，显示真实 HL 仓位和盈亏
- **12种交易机器人**: 趋势、网格、套利、AI强化学习等
- **管理后台**: 用户管理、交易审计、策略监控 (`/admin`)

## 架构模式

**路径A (用户自持资金)**:
- 用户资金始终在自己的 Hyperliquid 钱包
- 平台通过用户授权的 API Key 代为执行交易
- 平台不托管任何资金

## 管理后台

访问 `/admin`，默认账号: admin / admin

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Next.js 14, Tailwind CSS, wagmi v2, Framer Motion |
| 后端 | Fastify, TypeScript, Prisma ORM |
| 数据库 | PostgreSQL 16, Redis 7 |
| 链上 | Hyperliquid DEX, Arbitrum, viem |

## License

Private - TAKI Organization
