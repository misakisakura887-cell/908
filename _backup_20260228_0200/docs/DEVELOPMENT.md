# Mirror-AI 开发规范

> 版本：v1.0  
> 创建日期：2026-02-14

---

## 1. 代码风格

### 1.1 TypeScript/JavaScript

使用 **ESLint + Prettier**：

```json
// .eslintrc.json
{
  "extends": [
    "next/core-web-vitals",
    "plugin:@typescript-eslint/recommended",
    "prettier"
  ],
  "rules": {
    "no-console": ["warn", { "allow": ["warn", "error"] }],
    "@typescript-eslint/no-unused-vars": "warn",
    "@typescript-eslint/no-explicit-any": "warn"
  }
}
```

```json
// .prettierrc
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

**命名规范：**
- **文件名**：`kebab-case` (如 `user-profile.tsx`)
- **组件**：`PascalCase` (如 `UserProfile`)
- **函数/变量**：`camelCase` (如 `getUserPortfolio`)
- **常量**：`UPPER_SNAKE_CASE` (如 `API_BASE_URL`)
- **私有变量**：下划线前缀 (如 `_internalState`)

---

### 1.2 React 组件规范

#### 函数组件优先
```tsx
// ✅ Good
export function Button({ children, onClick }: ButtonProps) {
  return <button onClick={onClick}>{children}</button>;
}

// ❌ Avoid
export const Button: React.FC<ButtonProps> = ({ children, onClick }) => {
  return <button onClick={onClick}>{children}</button>;
};
```

#### Props 类型定义
```tsx
interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}
```

#### Hooks 顺序
```tsx
function Component() {
  // 1. Context
  const { user } = useAuth();
  
  // 2. State
  const [count, setCount] = useState(0);
  
  // 3. Refs
  const inputRef = useRef<HTMLInputElement>(null);
  
  // 4. Effects
  useEffect(() => {
    // ...
  }, []);
  
  // 5. Handlers
  const handleClick = () => {
    setCount(c => c + 1);
  };
  
  // 6. Render
  return <button onClick={handleClick}>{count}</button>;
}
```

---

### 1.3 文件结构

```
src/
├── app/                    # Next.js 14 App Router
│   ├── (auth)/             # 路由组
│   │   └── login/
│   ├── dashboard/
│   ├── strategies/
│   └── layout.tsx
├── components/             # React 组件
│   ├── ui/                 # 基础 UI 组件
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   └── card.tsx
│   ├── features/           # 功能组件
│   │   ├── strategy-card.tsx
│   │   └── portfolio-chart.tsx
│   └── layout/             # 布局组件
│       ├── navbar.tsx
│       └── footer.tsx
├── lib/                    # 工具库
│   ├── api.ts              # API 客户端
│   ├── utils.ts            # 通用工具
│   ├── wagmi.ts            # Web3 配置
│   └── constants.ts        # 常量
├── hooks/                  # 自定义 Hooks
│   ├── use-auth.ts
│   ├── use-portfolio.ts
│   └── use-websocket.ts
├── types/                  # TypeScript 类型
│   ├── api.ts
│   ├── models.ts
│   └── index.ts
└── styles/                 # 全局样式
    └── globals.css
```

---

## 2. Git 工作流

### 2.1 分支规范

| 分支类型 | 命名 | 说明 |
|----------|------|------|
| 主分支 | `main` | 生产环境代码 |
| 开发分支 | `dev` | 开发环境代码 |
| 功能分支 | `feat/xxx` | 新功能 |
| 修复分支 | `fix/xxx` | Bug 修复 |
| 文档分支 | `docs/xxx` | 文档更新 |

---

### 2.2 Commit Message 规范

使用 **Conventional Commits**：

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Type 类型：**
- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档变更
- `style`: 代码格式（不影响功能）
- `refactor`: 重构
- `test`: 测试
- `chore`: 构建/工具变更

**示例：**
```bash
git commit -m "feat(auth): 添加钱包连接功能

- 支持 MetaMask 和 WalletConnect
- 实现签名验证
- 添加 JWT Token 管理

Closes #123"
```

---

### 2.3 PR (Pull Request) 规范

**标题：**
```
[类型] 简短描述
```

**描述模板：**
```markdown
## 变更内容
简要描述本次 PR 的主要变更。

## 变更类型
- [ ] 新功能
- [ ] Bug 修复
- [ ] 重构
- [ ] 文档更新

## 测试
- [ ] 单元测试通过
- [ ] 集成测试通过
- [ ] 本地手动测试

## 截图（如有 UI 变更）
![screenshot](url)

## 相关 Issue
Closes #123
```

---

## 3. 代码审查检查清单

### 3.1 功能
- [ ] 功能符合需求
- [ ] 边界情况处理完善
- [ ] 错误处理合理

### 3.2 代码质量
- [ ] 代码清晰易读
- [ ] 无重复代码
- [ ] 函数职责单一
- [ ] 变量命名清晰

### 3.3 性能
- [ ] 无不必要的重渲染
- [ ] 合理使用 memo/useMemo/useCallback
- [ ] 图片/资源优化

### 3.4 安全
- [ ] 输入验证
- [ ] XSS 防护
- [ ] 敏感信息不泄露

### 3.5 测试
- [ ] 单元测试覆盖核心逻辑
- [ ] 测试用例有意义

---

## 4. 环境变量管理

### 4.1 环境文件
```
.env.local          # 本地开发（不提交）
.env.development    # 开发环境
.env.production     # 生产环境
.env.example        # 示例文件（提交到 Git）
```

### 4.2 命名规范
- 前端变量：`NEXT_PUBLIC_` 前缀
- 后端变量：无前缀

### 4.3 敏感信息
- ❌ **永远不要** 提交 `.env.local` 到 Git
- ✅ 使用 Vercel/Railway 的环境变量管理
- ✅ 生产环境使用 Secrets Manager

---

## 5. 测试规范

### 5.1 测试文件命名
```
src/
├── components/
│   ├── button.tsx
│   └── button.test.tsx     # 组件测试
├── lib/
│   ├── utils.ts
│   └── utils.test.ts       # 单元测试
└── app/
    └── api/
        └── invest/
            └── route.test.ts   # API 测试
```

### 5.2 测试覆盖率目标
- **核心业务逻辑**：80%+
- **工具函数**：90%+
- **UI 组件**：50%+（关键交互）

---

## 6. 性能优化检查清单

### 6.1 前端
- [ ] 图片使用 `next/image`
- [ ] 组件懒加载（`React.lazy`）
- [ ] 路由预取（`<Link prefetch>`）
- [ ] 合理使用 `useMemo`/`useCallback`
- [ ] 避免内联函数/对象

### 6.2 后端
- [ ] 数据库查询优化（索引）
- [ ] API 响应缓存（Redis）
- [ ] 批量操作（避免 N+1）
- [ ] 连接池配置合理

---

## 7. 安全检查清单

### 7.1 前端
- [ ] 用户输入验证
- [ ] XSS 防护（使用 `dangerouslySetInnerHTML` 必须审查）
- [ ] CSRF Token（API 请求）
- [ ] 敏感数据不存储在 localStorage

### 7.2 后端
- [ ] SQL 注入防护（使用 ORM）
- [ ] 认证/授权检查
- [ ] 速率限制
- [ ] 输入验证/清洗
- [ ] CORS 配置正确

---

## 8. 部署检查清单

### 8.1 部署前
- [ ] 所有测试通过
- [ ] 代码审查完成
- [ ] 环境变量配置正确
- [ ] 数据库迁移脚本准备好

### 8.2 部署后
- [ ] 健康检查通过
- [ ] 监控告警配置
- [ ] 日志正常输出
- [ ] 性能指标正常

---

## 9. 文档规范

### 9.1 代码注释
```tsx
/**
 * 计算用户投资组合的总价值
 * 
 * @param positions - 用户持仓列表
 * @returns 总价值（USD）
 * 
 * @example
 * const total = calculateTotalValue(positions);
 * // => 5234.56
 */
export function calculateTotalValue(positions: Position[]): number {
  return positions.reduce((sum, pos) => sum + pos.currentValue, 0);
}
```

### 9.2 API 文档
- 所有 API 端点必须在 `API-REFERENCE.md` 中记录
- 包含请求/响应示例
- 包含错误码说明

### 9.3 README
每个模块/功能文件夹应有 `README.md`：
- 功能说明
- 使用方法
- 示例代码

---

## 10. 延展性设计原则

### 10.1 模块化
- 功能模块独立，低耦合
- 使用依赖注入
- 接口/抽象优于具体实现

### 10.2 可配置
- 硬编码值提取为配置
- 使用环境变量/配置文件
- 支持功能开关（Feature Flags）

### 10.3 可扩展
- 策略模式（添加新策略无需改动核心）
- 插件化架构
- 事件驱动（解耦模块）

**示例：策略接口**
```typescript
// ✅ Good - 可扩展
interface TradingStrategy {
  name: string;
  type: string;
  execute(data: MarketData): Signal;
}

class GoldQuantStrategy implements TradingStrategy {
  name = '黄金量化';
  type = 'gold_quant';
  execute(data: MarketData): Signal {
    // ...
  }
}

// 添加新策略时，只需实现接口
class NewStrategy implements TradingStrategy {
  // ...
}
```

---

*文档版本：v1.0*  
*最后更新：2026-02-14*
