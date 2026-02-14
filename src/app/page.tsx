import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { TrendingUp, Shield, Zap } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-bg-primary/80 backdrop-blur-lg border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-accent-blue to-accent-purple rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">M</span>
            </div>
            <span className="text-xl font-bold text-white">Mirror-AI</span>
          </div>
          
          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#strategies" className="text-gray-300 hover:text-white transition-colors">
              策略广场
            </a>
            <a href="#dashboard" className="text-gray-300 hover:text-white transition-colors">
              我的投资
            </a>
            <a href="#docs" className="text-gray-300 hover:text-white transition-colors">
              文档
            </a>
          </div>
          
          {/* Connect Wallet Button */}
          <Button variant="primary">
            连接钱包
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 text-center">
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

      {/* Stats Section */}
      <section className="py-12 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="text-center">
            <div className="text-4xl font-bold text-accent-green mb-2">$2.3M</div>
            <div className="text-gray-400">累计收益</div>
          </Card>
          <Card className="text-center">
            <div className="text-4xl font-bold text-white mb-2">12,458</div>
            <div className="text-gray-400">活跃用户</div>
          </Card>
          <Card className="text-center">
            <div className="text-4xl font-bold text-accent-blue mb-2">8</div>
            <div className="text-gray-400">策略数量</div>
          </Card>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">为什么选择 Mirror-AI</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<TrendingUp size={32} />}
              title="AI 量化"
              description="专业级量化模型，24/7 自动交易，实时捕捉市场机会"
            />
            <FeatureCard
              icon={<Shield size={32} />}
              title="安全透明"
              description="去中心化托管，资产自持，所有交易记录可追溯"
            />
            <FeatureCard
              icon={<Zap size={32} />}
              title="超低门槛"
              description="1 美金起投，人人可参与，无需复杂的金融知识"
            />
          </div>
        </div>
      </section>

      {/* Strategy Cards Section */}
      <section className="py-20 px-6 bg-bg-secondary/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">热门策略</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StrategyCard
              name="黄金量化策略"
              return7d={12.3}
              sharpe={1.82}
              followers={342}
            />
            <StrategyCard
              name="BTC 量化策略"
              return7d={8.7}
              sharpe={1.34}
              followers={567}
            />
            <StrategyCard
              name="龙头主观策略"
              return7d={15.2}
              sharpe={2.01}
              followers={189}
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-gray-800">
        <div className="max-w-6xl mx-auto text-center text-gray-400">
          <p>&copy; 2026 Mirror-AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <Card className="text-center">
      <div className="text-accent-green mb-4 flex justify-center">{icon}</div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </Card>
  );
}

function StrategyCard({ name, return7d, sharpe, followers }: { name: string; return7d: number; sharpe: number; followers: number }) {
  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold">{name}</h3>
        <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">
          活跃中
        </span>
      </div>
      
      {/* Simplified chart placeholder */}
      <div className="h-24 bg-black/20 rounded-lg mb-4 flex items-center justify-center text-gray-500">
        收益曲线图
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-gray-400 text-sm mb-1">7日收益</p>
          <p className="text-2xl font-bold text-accent-green">+{return7d}%</p>
        </div>
        <div>
          <p className="text-gray-400 text-sm mb-1">夏普比率</p>
          <p className="text-2xl font-bold text-white">{sharpe}</p>
        </div>
      </div>
      
      <div className="flex items-center justify-between pt-4 border-t border-gray-700">
        <div className="text-gray-400 text-sm">{followers} 人跟投</div>
        <button className="text-accent-blue hover:text-accent-purple transition-colors">
          查看详情 →
        </button>
      </div>
    </Card>
  );
}
