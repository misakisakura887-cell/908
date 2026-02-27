# Mirror-AI 开发执行计划

> 创建日期：2026-02-14 23:15  
> 状态：准备就绪  
> 执行者：Mirror (Claude Sonnet 4.5) + Coding Agents

---

## 阶段 0：准备工作 ✅

- [x] PRD 文档完成（110KB，9 份文档）
- [x] 技术栈确定
- [x] 开发规范制定
- [x] Git 仓库就绪
- [x] Coding Agents 可用（`claude`, `pi`）

---

## 阶段 1：前端基础架构（预计 2-3 天）

### 1.1 项目初始化
- [ ] 检查 Next.js 14 项目结构
- [ ] 安装核心依赖（wagmi, recharts, shadcn/ui...）
- [ ] 配置 TypeScript + ESLint + Prettier
- [ ] 配置 Tailwind CSS（自定义主题）

### 1.2 基础组件库
- [ ] Button（primary/secondary/danger）
- [ ] Input（text/number/带图标）
- [ ] Card（策略卡片/数据卡片）
- [ ] Modal（钱包连接弹窗）
- [ ] Loading/Spinner
- [ ] Toast 通知

### 1.3 布局组件
- [ ] Navbar（Logo + 导航 + 连接钱包按钮）
- [ ] Footer
- [ ] Layout（App Router layout.tsx）

### 1.4 Web3 集成
- [ ] wagmi 配置（mainnet + arbitrum）
- [ ] 钱包连接逻辑
- [ ] useAccount / useConnect / useSignMessage hooks

**执行方式：**
使用 `claude` coding agent，在 `~/mirror-ai` 目录：

```bash
cd ~/mirror-ai
claude exec --full-auto "根据 docs/FULL-PRD.md 和 docs/UI-DESIGN-GUIDE.md，搭建 Next.js 14 项目的基础架构：
1. 安装所有必要依赖
2. 配置 Tailwind CSS 自定义主题（参考 UI-DESIGN-GUIDE.md 的色彩方案）
3. 创建基础 UI 组件（Button/Input/Card/Modal）
4. 配置 wagmi 进行 Web3 集成
5. 创建 Navbar 和 Layout 组件

完成后运行：clawdbot gateway wake --text '前端基础架构完成' --mode now"
```

---

## 阶段 2：核心页面开发（预计 3-4 天）

### 2.1 首页 (Landing Page)
- [ ] Hero Section（标题 + CTA）
- [ ] 核心数据展示（累计收益/用户数/策略数）
- [ ] 策略卡片横向滚动
- [ ] "如何运作"说明

### 2.2 策略广场 (Strategies Marketplace)
- [ ] 筛选栏（按资产类型/风险/排序）
- [ ] 策略列表网格布局
- [ ] 策略卡片（收益曲线 + 关键指标）
- [ ] 分页/加载更多

### 2.3 策略详情页 (Strategy Detail)
- [ ] 收益曲线图（Recharts）
- [ ] 关键指标卡片（夏普比率/最大回撤/胜率）
- [ ] 策略说明
- [ ] 交易记录表格
- [ ] 投资面板（输入金额 + 确认按钮）

### 2.4 用户个人中心 (Dashboard)
- [ ] 总览卡片（总资产/总投入/累计收益/今日收益）
- [ ] 资产分布饼图
- [ ] 累计收益曲线图
- [ ] 量化分析指标（8 个指标卡片）
- [ ] 策略列表表格
- [ ] 交易记录时间轴

**执行方式：**
分页面使用 coding agent，每个页面独立任务：

```bash
# 首页
claude exec --full-auto "创建 app/page.tsx 首页，参考 docs/FULL-PRD.md 第 2.2.2 节 A 的布局设计"

# 策略广场
claude exec --full-auto "创建 app/strategies/page.tsx，包含筛选栏和策略网格布局"

# 策略详情页
claude exec --full-auto "创建 app/strategies/[id]/page.tsx，包含收益曲线图和投资面板"

# 用户个人中心
claude exec --full-auto "创建 app/dashboard/page.tsx，按照 docs/USER-DASHBOARD-DESIGN.md 实现完整的用户面板"
```

---

## 阶段 3：后端 API 开发（预计 3-4 天）

### 3.1 项目初始化
- [ ] 创建 `backend/` 目录
- [ ] 初始化 Node.js + TypeScript
- [ ] 安装依赖（fastify, prisma, redis, bull...）
- [ ] 配置 Prisma（连接数据库）

### 3.2 数据库
- [ ] 执行 `docs/DATABASE-SCHEMA.sql`
- [ ] Prisma schema 生成
- [ ] 种子数据（3 个初始策略）

### 3.3 认证 API
- [ ] POST /api/auth/nonce
- [ ] POST /api/auth/verify（签名验证 + JWT 生成）
- [ ] JWT 中间件

### 3.4 策略 API
- [ ] GET /api/strategies（列表 + 筛选）
- [ ] GET /api/strategies/:id（详情 + 历史表现）

### 3.5 投资 API
- [ ] POST /api/invest（投资逻辑 + Hyperliquid 集成）
- [ ] POST /api/redeem（赎回逻辑）

### 3.6 用户 API
- [ ] GET /api/user/portfolio（投资组合）
- [ ] GET /api/user/trades（交易记录）

### 3.7 WebSocket
- [ ] Socket.io 服务器
- [ ] portfolio:update 事件
- [ ] strategy:update 事件
- [ ] trade:notification 事件

**执行方式：**
创建 backend 目录，使用 coding agent：

```bash
cd ~/mirror-ai
mkdir -p backend
cd backend

claude exec --full-auto "根据 ../docs/FULL-PRD.md 第 3 节技术架构，初始化后端项目：
1. 创建 package.json 并安装所有依赖
2. 配置 TypeScript
3. 初始化 Prisma，使用 ../docs/DATABASE-SCHEMA.sql 的 schema
4. 创建基础 Fastify 服务器
5. 实现认证 API（/api/auth/nonce 和 /api/auth/verify）
6. 实现策略 API（GET /api/strategies）

完成后运行：clawdbot gateway wake --text '后端基础 API 完成' --mode now"
```

---

## 阶段 4：量化策略开发（预计 2-3 天）

### 4.1 黄金量化策略
- [ ] Python 环境准备
- [ ] 黄金策略脚本（双均线）
- [ ] Hyperliquid API 集成
- [ ] 定时执行（每小时）

### 4.2 BTC 量化策略
- [ ] 复用黄金策略架构
- [ ] 参数调整（适应 BTC 波动）
- [ ] 测试运行

### 4.3 龙头跟单策略
- [ ] 监听见崎账户交易
- [ ] 同步到跟单用户
- [ ] 比例计算逻辑

**执行方式：**

```bash
cd ~/mirror-ai
mkdir -p strategies

# 黄金策略
pi "创建 strategies/gold_quant.py，实现黄金量化策略：
1. 使用双均线策略（MA10 和 MA30）
2. 从 Hyperliquid 获取 XAUUSD 价格数据
3. 生成买卖信号
4. 执行交易
参考 docs/FULL-PRD.md 第 4.2.1 节"

# BTC 策略
pi "创建 strategies/btc_quant.py，复用 gold_quant.py 的逻辑，改为 BTCUSD"
```

---

## 阶段 5：集成与测试（预计 2 天）

### 5.1 前后端集成
- [ ] API 客户端（`lib/api.ts`）
- [ ] React Query 配置
- [ ] WebSocket 连接
- [ ] 实时数据更新测试

### 5.2 完整流程测试
- [ ] 钱包连接流程
- [ ] 投资流程（端到端）
- [ ] 赎回流程
- [ ] 实时数据推送

### 5.3 单元测试
- [ ] 前端组件测试
- [ ] 后端 API 测试
- [ ] 工具函数测试

---

## 阶段 6：部署（预计 1 天）

### 6.1 数据库
- [ ] Supabase/Neon 创建 PostgreSQL
- [ ] 执行迁移脚本
- [ ] 插入种子数据

### 6.2 前端部署
- [ ] Vercel 部署
- [ ] 环境变量配置
- [ ] 自定义域名

### 6.3 后端部署
- [ ] Railway/Render 部署
- [ ] 环境变量配置
- [ ] 健康检查

### 6.4 量化策略部署
- [ ] VPS（DigitalOcean/AWS）
- [ ] Python 环境
- [ ] systemd/pm2 守护进程

---

## 执行策略

### 并行开发
- **前端** 和 **后端** 可以并行开发（先用 mock 数据）
- **量化策略** 可以独立开发和测试

### Coding Agent 使用
1. **claude**：适合复杂逻辑，交互式开发
2. **pi**：适合快速脚本，独立模块

### 每日站会
- 早上：回顾昨日进度
- 晚上：总结今日成果 + 明日计划

---

## 风险与应对

| 风险 | 应对 |
|------|------|
| Hyperliquid API 不稳定 | 提前测试 API，准备降级方案 |
| 钱包签名验证复杂 | 参考 wagmi 文档，使用现成库 |
| WebSocket 连接不稳定 | 实现重连机制 + 心跳检测 |
| 量化模型效果差 | 先用简单策略，后续优化 |

---

## 检查点

### Week 1 结束
- ✅ 前端基础架构完成
- ✅ 核心页面 UI 完成
- ✅ 后端 API 骨架完成

### Week 2 结束
- ✅ 前后端集成完成
- ✅ 投资/赎回流程可用
- ✅ 量化策略跑通

### Week 3 结束
- ✅ 测试完成
- ✅ 部署到生产环境
- ✅ MVP 可用

---

*文档版本：v1.0*  
*最后更新：2026-02-14 23:15*  
*准备开始执行！🚀*
