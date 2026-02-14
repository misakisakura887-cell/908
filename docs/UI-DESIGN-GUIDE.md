# Mirror-AI UI 设计指南

> 版本：v1.0  
> 创建日期：2026-02-14  
> 目标：为开发团队提供详细的 UI 实现规范

---

## 1. 设计系统

### 1.1 色彩方案

#### 主色板
```css
/* 背景色 */
--bg-primary: #0a0e27;      /* 深蓝黑 */
--bg-secondary: #141b34;    /* 次深蓝 */
--bg-tertiary: #1e2746;     /* 卡片背景 */

/* 强调色 */
--accent-green: #00ff88;    /* 荧光绿（涨） */
--accent-red: #ff4757;      /* 荧光红（跌） */
--accent-blue: #5f72ff;     /* 品牌蓝 */
--accent-purple: #a855f7;   /* 紫色渐变 */

/* 文本色 */
--text-primary: #e0e0e0;    /* 主文本 */
--text-secondary: #9ca3af;  /* 次要文本 */
--text-muted: #6b7280;      /* 灰色提示 */

/* 边框色 */
--border-default: #2d3752;
--border-hover: #3f4968;
```

#### 渐变
```css
/* 主背景渐变 */
--gradient-bg: linear-gradient(135deg, #0a0e27 0%, #141b34 100%);

/* 卡片渐变 */
--gradient-card: linear-gradient(135deg, #1e2746 0%, #2a3558 100%);

/* 按钮渐变 */
--gradient-button: linear-gradient(90deg, #5f72ff 0%, #a855f7 100%);
```

---

### 1.2 字体规范

#### 字体家族
```css
--font-sans: 'Inter', 'Source Han Sans CN', system-ui, sans-serif;
--font-mono: 'Roboto Mono', 'Courier New', monospace;
--font-display: 'SF Pro Display', 'Inter', sans-serif;
```

#### 字号体系（Tailwind 标准）
```
text-xs:   12px / 1rem
text-sm:   14px / 1.17rem
text-base: 16px / 1.33rem
text-lg:   18px / 1.5rem
text-xl:   20px / 1.67rem
text-2xl:  24px / 2rem
text-3xl:  30px / 2.5rem
text-4xl:  36px / 3rem
text-5xl:  48px / 4rem
```

#### 字重
```
font-normal:   400
font-medium:   500
font-semibold: 600
font-bold:     700
```

---

### 1.3 间距体系

```
space-1:  4px
space-2:  8px
space-3:  12px
space-4:  16px
space-6:  24px
space-8:  32px
space-12: 48px
space-16: 64px
```

---

### 1.4 圆角规范

```
rounded-sm:   4px   // 小按钮、输入框
rounded:      8px   // 默认卡片
rounded-lg:   12px  // 大卡片
rounded-xl:   16px  // 模态框
rounded-2xl:  24px  // 大型容器
rounded-full: 9999px // 圆形头像、徽章
```

---

### 1.5 阴影

```css
/* 卡片阴影 */
--shadow-card: 0 4px 6px -1px rgba(0, 0, 0, 0.3), 
               0 2px 4px -1px rgba(0, 0, 0, 0.2);

/* 悬停阴影 */
--shadow-hover: 0 10px 15px -3px rgba(0, 0, 0, 0.5), 
                0 4px 6px -2px rgba(0, 0, 0, 0.3);

/* 模态框阴影 */
--shadow-modal: 0 25px 50px -12px rgba(0, 0, 0, 0.6);
```

---

## 2. 核心组件设计

### 2.1 按钮 (Button)

#### 主按钮（Primary）
```tsx
<button className="
  px-6 py-3 
  bg-gradient-to-r from-[#5f72ff] to-[#a855f7]
  text-white font-semibold 
  rounded-lg 
  hover:shadow-lg hover:scale-105 
  transition-all duration-200
  disabled:opacity-50 disabled:cursor-not-allowed
">
  立即投资
</button>
```

**视觉效果**：
- 渐变背景（蓝 → 紫）
- 悬停时轻微放大 + 阴影
- 禁用时半透明

---

#### 次按钮（Secondary）
```tsx
<button className="
  px-6 py-3 
  bg-transparent 
  border-2 border-[#5f72ff]
  text-[#5f72ff] font-semibold 
  rounded-lg 
  hover:bg-[#5f72ff]/10
  transition-colors duration-200
">
  查看详情
</button>
```

---

#### 危险按钮（Danger）
```tsx
<button className="
  px-6 py-3 
  bg-red-500 
  text-white font-semibold 
  rounded-lg 
  hover:bg-red-600
  transition-colors duration-200
">
  赎回
</button>
```

---

### 2.2 输入框 (Input)

#### 基础输入框
```tsx
<input 
  type="text"
  className="
    w-full px-4 py-3 
    bg-[#1e2746] 
    border border-[#2d3752] 
    rounded-lg 
    text-white 
    placeholder:text-gray-500
    focus:border-[#5f72ff] focus:ring-2 focus:ring-[#5f72ff]/20
    transition-all duration-200
  "
  placeholder="输入投资金额"
/>
```

---

#### 带图标的输入框
```tsx
<div className="relative">
  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
  <input 
    type="number"
    className="w-full pl-10 pr-4 py-3 ..."
    placeholder="1.00"
  />
</div>
```

---

### 2.3 卡片 (Card)

#### 策略卡片
```tsx
<div className="
  bg-gradient-to-br from-[#1e2746] to-[#2a3558]
  border border-[#2d3752]
  rounded-xl 
  p-6 
  hover:border-[#5f72ff]/50 hover:shadow-xl
  transition-all duration-300
  cursor-pointer
">
  {/* 卡片头部 */}
  <div className="flex items-center justify-between mb-4">
    <h3 className="text-xl font-bold text-white">黄金量化策略</h3>
    <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">
      活跃中
    </span>
  </div>
  
  {/* 收益曲线（简化） */}
  <div className="h-24 bg-black/20 rounded-lg mb-4">
    {/* Recharts LineChart 组件 */}
  </div>
  
  {/* 关键指标 */}
  <div className="grid grid-cols-2 gap-4 mb-4">
    <div>
      <p className="text-gray-400 text-sm mb-1">7日收益</p>
      <p className="text-2xl font-bold text-green-400">+12.3%</p>
    </div>
    <div>
      <p className="text-gray-400 text-sm mb-1">夏普比率</p>
      <p className="text-2xl font-bold text-white">1.82</p>
    </div>
  </div>
  
  {/* 底部信息 */}
  <div className="flex items-center justify-between pt-4 border-t border-gray-700">
    <div className="flex items-center gap-2">
      <Users size={16} className="text-gray-400" />
      <span className="text-gray-400 text-sm">342 人跟投</span>
    </div>
    <button className="text-[#5f72ff] hover:text-[#a855f7] transition-colors">
      查看详情 →
    </button>
  </div>
</div>
```

---

#### 数据卡片
```tsx
<div className="
  bg-[#1e2746] 
  border border-[#2d3752] 
  rounded-lg 
  p-6
">
  <div className="flex items-center gap-3 mb-2">
    <TrendingUp size={24} className="text-green-400" />
    <p className="text-gray-400">累计收益</p>
  </div>
  <p className="text-4xl font-bold text-white">$2.3M</p>
  <p className="text-green-400 text-sm mt-2">↑ 24.5% 本月</p>
</div>
```

---

### 2.4 导航栏 (Navbar)

```tsx
<nav className="
  fixed top-0 left-0 right-0 z-50
  bg-[#0a0e27]/80 backdrop-blur-lg
  border-b border-[#2d3752]
">
  <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
    {/* Logo */}
    <div className="flex items-center gap-2">
      <div className="w-10 h-10 bg-gradient-to-br from-[#5f72ff] to-[#a855f7] rounded-lg" />
      <span className="text-xl font-bold text-white">Mirror-AI</span>
    </div>
    
    {/* 导航链接 */}
    <div className="hidden md:flex items-center gap-8">
      <a href="/strategies" className="text-gray-300 hover:text-white transition-colors">
        策略广场
      </a>
      <a href="/dashboard" className="text-gray-300 hover:text-white transition-colors">
        我的投资
      </a>
      <a href="/docs" className="text-gray-300 hover:text-white transition-colors">
        文档
      </a>
    </div>
    
    {/* 钱包连接按钮 */}
    <button className="
      px-6 py-2 
      bg-gradient-to-r from-[#5f72ff] to-[#a855f7]
      text-white font-semibold 
      rounded-lg 
      hover:shadow-lg
      transition-all duration-200
    ">
      连接钱包
    </button>
  </div>
</nav>
```

---

### 2.5 模态框 (Modal)

```tsx
<div className="fixed inset-0 z-50 flex items-center justify-center">
  {/* 背景遮罩 */}
  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
  
  {/* 模态框内容 */}
  <div className="
    relative z-10
    w-full max-w-md
    bg-gradient-to-br from-[#1e2746] to-[#2a3558]
    border border-[#2d3752]
    rounded-2xl 
    p-6 
    shadow-2xl
  ">
    {/* 关闭按钮 */}
    <button className="absolute top-4 right-4 text-gray-400 hover:text-white">
      <X size={24} />
    </button>
    
    {/* 标题 */}
    <h2 className="text-2xl font-bold text-white mb-4">连接钱包</h2>
    
    {/* 钱包选项 */}
    <div className="space-y-3">
      <button className="
        w-full flex items-center gap-4 
        px-4 py-3 
        bg-white/5 
        hover:bg-white/10 
        border border-[#2d3752] 
        rounded-lg 
        transition-colors
      ">
        <img src="/metamask.svg" className="w-8 h-8" />
        <span className="text-white font-medium">MetaMask</span>
      </button>
      
      <button className="w-full flex items-center gap-4 ...">
        <img src="/walletconnect.svg" className="w-8 h-8" />
        <span className="text-white font-medium">WalletConnect</span>
      </button>
    </div>
  </div>
</div>
```

---

### 2.6 收益图表 (Chart)

```tsx
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

<div className="bg-[#1e2746] rounded-lg p-6">
  <h3 className="text-white text-lg font-semibold mb-4">累计收益曲线</h3>
  
  <ResponsiveContainer width="100%" height={300}>
    <LineChart data={data}>
      <XAxis 
        dataKey="date" 
        stroke="#6b7280" 
        style={{ fontSize: 12 }}
      />
      <YAxis 
        stroke="#6b7280" 
        style={{ fontSize: 12 }}
        tickFormatter={(value) => `${value}%`}
      />
      <Tooltip 
        contentStyle={{ 
          backgroundColor: '#1e2746', 
          border: '1px solid #2d3752',
          borderRadius: '8px'
        }}
        labelStyle={{ color: '#e0e0e0' }}
      />
      <Line 
        type="monotone" 
        dataKey="return" 
        stroke="#00ff88" 
        strokeWidth={2}
        dot={false}
      />
    </LineChart>
  </ResponsiveContainer>
</div>
```

---

## 3. 页面布局示例

### 3.1 个人中心布局

```tsx
<div className="min-h-screen bg-[#0a0e27] text-white">
  {/* 导航栏 */}
  <Navbar />
  
  {/* 主内容 */}
  <main className="max-w-7xl mx-auto px-6 py-8 mt-20">
    {/* 头部统计卡片 */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <StatCard title="总资产" value="$5,234.56" change="+12.3%" />
      <StatCard title="总投入" value="$4,500.00" />
      <StatCard title="累计收益" value="$734.56" change="+16.3%" />
    </div>
    
    {/* 主要内容区域 */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 左侧 - 仓位列表 */}
      <div className="lg:col-span-2 space-y-4">
        <h2 className="text-2xl font-bold mb-4">我的策略</h2>
        
        <PositionCard 
          strategyName="黄金量化策略"
          invested={2000}
          current={2246}
          pnl={246}
          pnlPercent={12.3}
        />
        
        <PositionCard 
          strategyName="BTC 量化策略"
          invested={1500}
          current={1628}
          pnl={128}
          pnlPercent={8.5}
        />
      </div>
      
      {/* 右侧 - 资产分布 */}
      <div>
        <h2 className="text-2xl font-bold mb-4">资产分布</h2>
        <AssetDistributionChart />
      </div>
    </div>
    
    {/* 收益历史曲线 */}
    <div className="mt-8">
      <ReturnsChart />
    </div>
  </main>
</div>
```

---

## 4. 交互动效

### 4.1 卡片悬停效果
```css
.strategy-card {
  transition: all 0.3s ease;
}

.strategy-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 20px rgba(95, 114, 255, 0.3);
  border-color: rgba(95, 114, 255, 0.5);
}
```

### 4.2 数字滚动动画
```tsx
import { useSpring, animated } from '@react-spring/web';

function AnimatedNumber({ value }: { value: number }) {
  const { number } = useSpring({
    from: { number: 0 },
    number: value,
    delay: 200,
    config: { mass: 1, tension: 20, friction: 10 }
  });
  
  return (
    <animated.span>
      {number.to(n => n.toFixed(2))}
    </animated.span>
  );
}
```

### 4.3 页面加载骨架屏
```tsx
<div className="animate-pulse space-y-4">
  <div className="h-8 bg-gray-700 rounded w-1/3" />
  <div className="h-64 bg-gray-700 rounded" />
  <div className="h-32 bg-gray-700 rounded" />
</div>
```

---

## 5. 响应式设计

### 5.1 断点体系
```
sm:  640px  // 手机横屏
md:  768px  // 平板
lg:  1024px // 笔记本
xl:  1280px // 桌面
2xl: 1536px // 大屏
```

### 5.2 移动端适配
```tsx
{/* 桌面端：横向布局 | 移动端：纵向堆叠 */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <Card />
  <Card />
  <Card />
</div>

{/* 移动端隐藏，桌面端显示 */}
<div className="hidden md:block">
  <DetailPanel />
</div>

{/* 移动端导航菜单 */}
<div className="md:hidden">
  <MobileMenu />
</div>
```

---

## 6. 可访问性 (A11y)

### 6.1 颜色对比度
- 文本/背景对比度 ≥ 4.5:1（WCAG AA）
- 大文本/背景对比度 ≥ 3:1

### 6.2 键盘导航
```tsx
<button 
  className="..."
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick();
    }
  }}
>
  确认
</button>
```

### 6.3 ARIA 标签
```tsx
<button aria-label="连接钱包">
  <Wallet size={20} />
</button>

<input 
  type="number" 
  aria-label="投资金额" 
  aria-describedby="amount-help"
/>
<p id="amount-help" className="text-sm text-gray-400">
  最低 1 美金
</p>
```

---

## 7. 实时数据更新 UI

### 7.1 WebSocket 连接状态指示
```tsx
<div className="flex items-center gap-2">
  {isConnected ? (
    <>
      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
      <span className="text-sm text-gray-400">实时</span>
    </>
  ) : (
    <>
      <div className="w-2 h-2 bg-red-400 rounded-full" />
      <span className="text-sm text-gray-400">断线</span>
    </>
  )}
</div>
```

### 7.2 数据变化闪烁效果
```tsx
const [flash, setFlash] = useState(false);

useEffect(() => {
  if (value !== prevValue) {
    setFlash(true);
    setTimeout(() => setFlash(false), 300);
  }
}, [value]);

<span className={cn(
  "transition-colors duration-300",
  flash && "text-green-400"
)}>
  ${value}
</span>
```

---

## 8. 图标库

推荐使用 **Lucide Icons**：
```tsx
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  BarChart, 
  Settings,
  Wallet,
  LogOut
} from 'lucide-react';
```

---

## 9. 设计资源

### 9.1 配色工具
- **Coolors**：https://coolors.co
- **Adobe Color**：https://color.adobe.com

### 9.2 图标资源
- **Lucide Icons**：https://lucide.dev
- **Heroicons**：https://heroicons.com

### 9.3 字体资源
- **Inter**：https://fonts.google.com/specimen/Inter
- **Roboto Mono**：https://fonts.google.com/specimen/Roboto+Mono

---

*文档版本：v1.0*  
*最后更新：2026-02-14*
