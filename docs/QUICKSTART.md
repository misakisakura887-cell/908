# Mirror-AI 快速开始指南

> 版本：v1.0  
> 创建日期：2026-02-14  
> 目标：帮助 Claude Opus 4.6 快速启动开发

---

## 📋 开发前准备

### 1. 确认环境
```bash
# Node.js 版本
node -v  # 应该是 v20.x+

# npm 版本
npm -v   # 应该是 v10.x+

# Git 版本
git --version
```

如果缺少工具：
```bash
# macOS
brew install node@20 git

# Linux (Ubuntu/Debian)
sudo apt update && sudo apt install -y nodejs npm git
```

---

### 2. 创建项目目录结构

```bash
cd ~/mirror-ai

# 检查当前文件
ls -la
# 应该看到 Next.js 项目文件（package.json, src/, public/ 等）
```

如果是空项目，初始化 Next.js：
```bash
npx create-next-app@latest . \
  --typescript \
  --tailwind \
  --app \
  --no-src-dir \
  --import-alias "@/*"
```

---

## 🚀 前端开发

### 1. 安装依赖

```bash
cd ~/mirror-ai

# 安装核心依赖
npm install \
  wagmi viem @tanstack/react-query \
  zustand \
  recharts \
  lucide-react \
  socket.io-client \
  @radix-ui/react-dialog \
  @radix-ui/react-dropdown-menu \
  class-variance-authority clsx tailwind-merge

# 安装开发依赖
npm install -D \
  @types/node \
  @types/react \
  @types/react-dom \
  eslint \
  prettier
```

---

### 2. 配置 Tailwind CSS

编辑 `tailwind.config.ts`：

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: "#0a0e27",
          secondary: "#141b34",
          tertiary: "#1e2746",
        },
        accent: {
          green: "#00ff88",
          red: "#ff4757",
          blue: "#5f72ff",
          purple: "#a855f7",
        },
      },
      fontFamily: {
        sans: ["Inter", "Source Han Sans CN", "system-ui", "sans-serif"],
        mono: ["Roboto Mono", "Courier New", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
```

---

### 3. 创建基础组件

#### Button 组件
创建 `components/ui/button.tsx`：

```typescript
import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        primary: "bg-gradient-to-r from-accent-blue to-accent-purple text-white hover:shadow-lg hover:scale-105",
        secondary: "bg-transparent border-2 border-accent-blue text-accent-blue hover:bg-accent-blue/10",
        danger: "bg-red-500 text-white hover:bg-red-600",
      },
      size: {
        sm: "px-4 py-2 text-sm",
        md: "px-6 py-3 text-base",
        lg: "px-8 py-4 text-lg",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
```

#### 工具函数
创建 `lib/utils.ts`：

```typescript
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

---

### 4. 配置 Web3

创建 `lib/wagmi.ts`：

```typescript
import { createConfig, http } from 'wagmi';
import { mainnet, arbitrum } from 'wagmi/chains';
import { injected, walletConnect } from 'wagmi/connectors';

export const config = createConfig({
  chains: [mainnet, arbitrum],
  connectors: [
    injected(),
    walletConnect({
      projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
    }),
  ],
  transports: {
    [mainnet.id]: http(),
    [arbitrum.id]: http(),
  },
});
```

在 `app/providers.tsx` 中包裹：

```typescript
'use client';

import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config } from '@/lib/wagmi';

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
```

在 `app/layout.tsx` 中使用：

```typescript
import { Providers } from './providers';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" className="dark">
      <body className="bg-bg-primary text-white">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

---

### 5. 创建首页

编辑 `app/page.tsx`：

```typescript
import { Button } from '@/components/ui/button';
import { TrendingUp, Shield, Zap } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-20 px-6 text-center">
        <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-accent-blue to-accent-purple bg-clip-text text-transparent">
          人人可用的 AI 投资平台
        </h1>
        <p className="text-xl text-gray-400 mb-8">
          1 美金起投 · 免税交易 · AI 驱动
        </p>
        <div className="flex gap-4 justify-center">
          <Button variant="primary" size="lg">
            立即开始
          </Button>
          <Button variant="secondary" size="lg">
            查看策略
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard
            icon={<TrendingUp size={32} />}
            title="AI 量化"
            description="专业级量化模型，24/7 自动交易"
          />
          <FeatureCard
            icon={<Shield size={32} />}
            title="安全透明"
            description="去中心化托管，资产自持"
          />
          <FeatureCard
            icon={<Zap size={32} />}
            title="超低门槛"
            description="1 美金起投，人人可参与"
          />
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, description }: any) {
  return (
    <div className="bg-bg-tertiary border border-gray-700 rounded-xl p-6 hover:border-accent-blue/50 transition-all">
      <div className="text-accent-green mb-4">{icon}</div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </div>
  );
}
```

---

### 6. 启动开发服务器

```bash
npm run dev
```

访问：http://localhost:3000

---

## 🔧 后端开发

### 1. 创建后端项目

```bash
cd ~/mirror-ai
mkdir backend && cd backend

# 初始化 Node.js 项目
npm init -y

# 安装依赖
npm install \
  fastify \
  @fastify/cors \
  @fastify/jwt \
  @prisma/client \
  prisma \
  ioredis \
  bull \
  socket.io \
  dotenv

# 安装开发依赖
npm install -D \
  typescript \
  @types/node \
  tsx \
  prisma
```

---

### 2. 配置 TypeScript

创建 `tsconfig.json`：

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

---

### 3. 初始化 Prisma

```bash
npx prisma init

# 复制数据库 schema
# 将 ~/mirror-ai-docs/DATABASE-SCHEMA.sql 的内容转为 Prisma schema
```

创建 `prisma/schema.prisma`：

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String   @id @default(uuid())
  walletAddress String   @unique @map("wallet_address")
  nonce         String
  createdAt     DateTime @default(now()) @map("created_at")
  lastLogin     DateTime? @map("last_login")

  positions UserPosition[]
  sessions  Session[]

  @@index([walletAddress])
  @@map("users")
}

model Strategy {
  id          String   @id @default(uuid())
  name        String
  description String?
  strategyType String  @map("strategy_type")
  assetClass  String   @map("asset_class")
  riskLevel   Int      @map("risk_level")
  
  totalReturn  Decimal? @map("total_return")
  sharpeRatio  Decimal? @map("sharpe_ratio")
  maxDrawdown  Decimal? @map("max_drawdown")
  winRate      Decimal? @map("win_rate")
  
  totalAum     Decimal  @default(0) @map("total_aum")
  followerCount Int     @default(0) @map("follower_count")
  
  isActive    Boolean  @default(true) @map("is_active")
  
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  positions UserPosition[]
  trades    Trade[]

  @@index([strategyType])
  @@index([isActive])
  @@map("strategies")
}

// 其他模型...
```

生成 Prisma Client：

```bash
npx prisma generate
```

---

### 4. 创建基础服务器

创建 `src/index.ts`：

```typescript
import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import { PrismaClient } from '@prisma/client';

const fastify = Fastify({ logger: true });
const prisma = new PrismaClient();

// 插件
fastify.register(cors, { origin: 'http://localhost:3000' });
fastify.register(jwt, { secret: process.env.JWT_SECRET || 'supersecret' });

// 健康检查
fastify.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// 启动服务器
const start = async () => {
  try {
    await fastify.listen({ port: 3001, host: '0.0.0.0' });
    console.log('🚀 Server running on http://localhost:3001');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
```

---

### 5. 添加路由

创建 `src/routes/auth.ts`：

```typescript
import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function authRoutes(fastify: FastifyInstance) {
  // 获取 nonce
  fastify.post('/auth/nonce', async (request, reply) => {
    const { walletAddress } = request.body as { walletAddress: string };
    
    // 查找或创建用户
    const user = await prisma.user.upsert({
      where: { walletAddress },
      update: { nonce: generateNonce() },
      create: { walletAddress, nonce: generateNonce() },
    });
    
    return { nonce: user.nonce };
  });

  // 验证签名
  fastify.post('/auth/verify', async (request, reply) => {
    const { walletAddress, signature, message } = request.body as any;
    
    // 验证签名逻辑（需要 ethers.js）
    const isValid = verifySignature(message, signature, walletAddress);
    
    if (!isValid) {
      return reply.code(401).send({ error: 'Invalid signature' });
    }
    
    // 生成 JWT
    const token = fastify.jwt.sign({ walletAddress });
    
    return { token };
  });
}

function generateNonce() {
  return Math.random().toString(36).substring(2, 15);
}

function verifySignature(message: string, signature: string, address: string) {
  // TODO: 实现签名验证（使用 ethers.js）
  return true;
}
```

在 `src/index.ts` 中注册：

```typescript
import { authRoutes } from './routes/auth';

fastify.register(authRoutes);
```

---

### 6. 启动后端

添加到 `package.json`：

```json
{
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  }
}
```

运行：

```bash
npm run dev
```

---

## 🗄️ 数据库设置

### 1. 本地 PostgreSQL

```bash
# macOS
brew install postgresql@16
brew services start postgresql@16

# 创建数据库
createdb mirror_ai

# 或使用 Docker
docker run --name mirror-postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=mirror_ai \
  -p 5432:5432 \
  -d postgres:16
```

---

### 2. 配置环境变量

创建 `backend/.env`：

```bash
DATABASE_URL="postgresql://user:password@localhost:5432/mirror_ai"
JWT_SECRET="your-super-secret-key-change-this"
REDIS_URL="redis://localhost:6379"

HYPERLIQUID_API_KEY="your-api-key"
HYPERLIQUID_API_SECRET="your-api-secret"
```

---

### 3. 执行迁移

```bash
cd backend

# 应用 schema
npx prisma db push

# 或使用 SQL 文件
psql mirror_ai < ../mirror-ai-docs/DATABASE-SCHEMA.sql
```

---

## 📊 量化策略开发

### 1. 安装 Python 依赖

```bash
cd ~/mirror-ai
mkdir strategies && cd strategies

# 创建虚拟环境
python3 -m venv venv
source venv/bin/activate

# 安装依赖
pip install \
  pandas \
  numpy \
  ccxt \
  hyperliquid-python-sdk \
  schedule
```

---

### 2. 创建黄金策略

创建 `strategies/gold_quant.py`：

```python
import pandas as pd
import time
from datetime import datetime

class GoldQuantStrategy:
    def __init__(self):
        self.symbol = 'XAUUSD'
    
    def fetch_data(self):
        # TODO: 从 Hyperliquid 获取数据
        pass
    
    def generate_signal(self, df):
        # 双均线策略
        df['ma_short'] = df['close'].rolling(window=10).mean()
        df['ma_long'] = df['close'].rolling(window=30).mean()
        
        if df['ma_short'].iloc[-1] > df['ma_long'].iloc[-1]:
            return 'BUY'
        elif df['ma_short'].iloc[-1] < df['ma_long'].iloc[-1]:
            return 'SELL'
        return 'HOLD'
    
    def run(self):
        while True:
            try:
                df = self.fetch_data()
                signal = self.generate_signal(df)
                print(f"[{datetime.now()}] Signal: {signal}")
                
                time.sleep(3600)  # 1 小时
            except Exception as e:
                print(f"Error: {e}")
                time.sleep(60)

if __name__ == '__main__':
    strategy = GoldQuantStrategy()
    strategy.run()
```

---

## 🚢 部署

### 1. 前端（Vercel）

```bash
cd ~/mirror-ai

# 推送到 GitHub
git add .
git commit -m "Initial commit"
git push origin main

# Vercel 会自动部署
```

---

### 2. 后端（Railway）

创建 `backend/Dockerfile`：

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

RUN npx prisma generate
RUN npm run build

EXPOSE 3001

CMD ["npm", "start"]
```

部署到 Railway：

```bash
# 安装 Railway CLI
npm i -g @railway/cli

# 登录
railway login

# 初始化项目
cd backend
railway init

# 部署
railway up
```

---

## ✅ 开发检查清单

### Phase 1 - MVP（Week 1-6）

**Week 1-2: 基础架构**
- [ ] 前端项目初始化
- [ ] 后端 API 框架搭建
- [ ] 数据库 schema 创建
- [ ] 基础 UI 组件库

**Week 3: 认证系统**
- [ ] 钱包连接功能
- [ ] 签名验证
- [ ] JWT Token 管理

**Week 4: 核心功能**
- [ ] 策略展示页
- [ ] 投资/赎回 API
- [ ] 用户个人中心
- [ ] WebSocket 实时推送

**Week 5: 量化策略**
- [ ] 黄金量化策略
- [ ] BTC 量化策略
- [ ] 龙头跟单系统

**Week 6: 测试与部署**
- [ ] 单元测试
- [ ] 集成测试
- [ ] 部署到测试环境
- [ ] Bug 修复

---

## 🔗 相关文档

- **完整 PRD**：`~/mirror-ai-docs/FULL-PRD.md`
- **UI 设计指南**：`~/mirror-ai-docs/UI-DESIGN-GUIDE.md`
- **数据库 Schema**：`~/mirror-ai-docs/DATABASE-SCHEMA.sql`
- **用户流程图**：`~/mirror-ai-docs/USER-FLOWS.md`

---

## 💡 开发建议

1. **先做 MVP**：不要一开始就追求完美，先把核心流程跑通
2. **增量开发**：每完成一个模块就测试一次
3. **频繁提交**：小步快跑，方便回滚
4. **写注释**：复杂逻辑一定要写清楚
5. **安全第一**：涉及资金的操作多重验证

---

*文档版本：v1.0*  
*最后更新：2026-02-14*  
*祝开发顺利！🚀*
