"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Navbar } from '@/components/layout/navbar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Plus, Settings, Play, Pause, Trash2, Eye, TrendingUp, 
  Users, BarChart3, Brain, Zap, ArrowRight, AlertCircle,
  CheckCircle, Code, MessageSquare, Target, Activity
} from 'lucide-react';
import Link from 'next/link';

import { API_BASE } from '@/lib/config';

interface Strategy {
  id: string;
  name: string;
  description: string;
  type: string;
  status: string;
  return7d: string;
  return30d: string;
  returnTotal: string;
  sharpeRatio: string;
  maxDrawdown: string;
  winRate: string;
  followers: number;
  aum: string;
  rules: any;
  createdAt: string;
}

const statusMap: Record<string, { label: string; color: string }> = {
  draft: { label: '草稿', color: 'text-gray-400 bg-gray-400/10' },
  active: { label: '运行中', color: 'text-emerald-400 bg-emerald-400/10' },
  paused: { label: '已暂停', color: 'text-yellow-400 bg-yellow-400/10' },
  archived: { label: '已归档', color: 'text-gray-500 bg-gray-500/10' },
};

export default function CreatorPage() {
  const [token, setToken] = useState<string | null>(null);
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newStrategy, setNewStrategy] = useState({ name: '', description: '', type: 'custom' });
  const [parseInput, setParseInput] = useState('');
  const [parsedRule, setParsedRule] = useState<any>(null);

  useEffect(() => {
    const saved = localStorage.getItem('mirror-ramp-auth');
    if (saved) {
      try {
        const { token } = JSON.parse(saved);
        setToken(token);
      } catch {}
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (token) {
      loadStrategies();
    }
  }, [token]);

  const loadStrategies = async () => {
    try {
      const res = await fetch(`${API_BASE}/strategy/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setStrategies(data);
    } catch {}
  };

  const createStrategy = async () => {
    if (!newStrategy.name) return;
    try {
      const res = await fetch(`${API_BASE}/strategy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(newStrategy),
      });
      if (res.ok) {
        setShowCreate(false);
        setNewStrategy({ name: '', description: '', type: 'custom' });
        loadStrategies();
      }
    } catch {}
  };

  const toggleStrategy = async (id: string, action: 'activate' | 'pause') => {
    try {
      await fetch(`${API_BASE}/strategy/${id}/${action}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      loadStrategies();
    } catch {}
  };

  const deleteStrategy = async (id: string) => {
    if (!confirm('确定要删除这个策略吗？')) return;
    try {
      await fetch(`${API_BASE}/strategy/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      loadStrategies();
    } catch {}
  };

  const parseRule = async () => {
    if (!parseInput) return;
    try {
      const res = await fetch(`${API_BASE}/strategy/parse-rule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ description: parseInput }),
      });
      const data = await res.json();
      setParsedRule(data);
    } catch {}
  };

  // 未登录
  if (!token && !loading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen pt-24 px-4 pb-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Brain className="text-white" size={40} />
            </div>
            <h1 className="text-3xl font-bold mb-4">Strategy Owner</h1>
            <p className="text-gray-400 mb-8 max-w-xl mx-auto">
              创建你自己的交易策略，让 AI 帮你把直觉变成规则，消灭情绪，自动执行
            </p>
            
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <Card className="p-6 text-left">
                <div className="w-12 h-12 bg-cyan-500/10 rounded-xl flex items-center justify-center mb-4">
                  <MessageSquare className="text-cyan-400" size={24} />
                </div>
                <h3 className="font-bold mb-2">自然语言输入</h3>
                <p className="text-sm text-gray-400">用你的话描述交易逻辑，AI 帮你转成代码</p>
              </Card>
              <Card className="p-6 text-left">
                <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mb-4">
                  <BarChart3 className="text-purple-400" size={24} />
                </div>
                <h3 className="font-bold mb-2">历史回测</h3>
                <p className="text-sm text-gray-400">验证你的策略在过去的表现如何</p>
              </Card>
              <Card className="p-6 text-left">
                <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-4">
                  <Zap className="text-emerald-400" size={24} />
                </div>
                <h3 className="font-bold mb-2">自动执行</h3>
                <p className="text-sm text-gray-400">7×24 无情绪执行，该止损就止损</p>
              </Card>
            </div>
            
            <Link href="/ramp">
              <Button size="lg">
                登录成为 Strategy Owner
                <ArrowRight size={18} />
              </Button>
            </Link>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 px-4 pb-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-3">
                <Brain className="text-purple-400" size={28} />
                Strategy Owner
              </h1>
              <p className="text-gray-400 mt-1">创建和管理你的交易策略</p>
            </div>
            <Button onClick={() => setShowCreate(true)}>
              <Plus size={18} />
              创建策略
            </Button>
          </div>

          {/* AI 规则解析器 */}
          <Card className="p-6 mb-8 bg-gradient-to-br from-purple-500/5 to-pink-500/5 border-purple-500/20">
            <h2 className="font-bold mb-4 flex items-center gap-2">
              <Brain className="text-purple-400" size={20} />
              AI 规则解析器 — 把你的直觉变成规则
            </h2>
            <div className="flex gap-4">
              <textarea
                placeholder='用自然语言描述你的交易逻辑，例如：&#10;"当BTC日线RSI<30，同时交易所净流出>5000BTC，分3批建仓，每批10%仓位，止损8%"'
                value={parseInput}
                onChange={e => setParseInput(e.target.value)}
                className="flex-1 bg-black/20 border border-white/10 rounded-xl p-4 min-h-[100px] focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              />
              <Button onClick={parseRule} variant="secondary" className="self-end">
                <Code size={16} />
                解析
              </Button>
            </div>
            
            {parsedRule && (
              <div className="mt-4 p-4 bg-black/20 rounded-xl border border-white/10">
                <div className="text-sm text-gray-400 mb-2">解析结果：</div>
                <pre className="text-xs text-cyan-400 overflow-x-auto">
                  {JSON.stringify(parsedRule, null, 2)}
                </pre>
              </div>
            )}
          </Card>

          {/* 策略列表 */}
          <div className="grid gap-4">
            {strategies.length === 0 ? (
              <Card className="p-12 text-center">
                <Target size={48} className="mx-auto mb-4 text-gray-500" />
                <h3 className="text-lg font-bold mb-2">还没有策略</h3>
                <p className="text-gray-400 mb-4">创建你的第一个交易策略，开始自动化交易</p>
                <Button onClick={() => setShowCreate(true)}>
                  <Plus size={18} />
                  创建策略
                </Button>
              </Card>
            ) : (
              strategies.map(strategy => {
                const status = statusMap[strategy.status] || statusMap.draft;
                return (
                  <motion.div
                    key={strategy.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-bold">{strategy.name}</h3>
                            <span className={`text-xs px-2 py-1 rounded-full ${status.color}`}>
                              {strategy.status === 'active' && (
                                <span className="inline-block w-1.5 h-1.5 bg-emerald-400 rounded-full mr-1.5 animate-pulse" />
                              )}
                              {status.label}
                            </span>
                            <span className="text-xs text-gray-500 px-2 py-1 bg-white/5 rounded">
                              {strategy.type}
                            </span>
                          </div>
                          <p className="text-sm text-gray-400 mb-4">{strategy.description || '暂无描述'}</p>
                          
                          <div className="grid grid-cols-4 gap-4">
                            <div>
                              <div className="text-xs text-gray-500">7日收益</div>
                              <div className={`font-bold ${parseFloat(strategy.return7d) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {parseFloat(strategy.return7d) >= 0 ? '+' : ''}{parseFloat(strategy.return7d).toFixed(2)}%
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-500">夏普比率</div>
                              <div className="font-bold">{parseFloat(strategy.sharpeRatio).toFixed(2)}</div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-500">跟投人数</div>
                              <div className="font-bold">{strategy.followers}</div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-500">管理资产</div>
                              <div className="font-bold">${parseFloat(strategy.aum).toLocaleString()}</div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 ml-4">
                          <Link href={`/creator/${strategy.id}`}>
                            <Button variant="ghost" size="sm">
                              <Settings size={16} />
                            </Button>
                          </Link>
                          {strategy.status === 'active' ? (
                            <Button variant="ghost" size="sm" onClick={() => toggleStrategy(strategy.id, 'pause')}>
                              <Pause size={16} />
                            </Button>
                          ) : (
                            <Button variant="ghost" size="sm" onClick={() => toggleStrategy(strategy.id, 'activate')}>
                              <Play size={16} />
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => deleteStrategy(strategy.id)} className="text-red-400 hover:text-red-300">
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })
            )}
          </div>

          {/* 创建策略弹窗 */}
          {showCreate && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <Card className="w-full max-w-lg p-6">
                <h2 className="text-xl font-bold mb-6">创建新策略</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">策略名称</label>
                    <input
                      type="text"
                      placeholder="例如：BTC 抄底策略"
                      value={newStrategy.name}
                      onChange={e => setNewStrategy({ ...newStrategy, name: e.target.value })}
                      className="w-full bg-black/20 border border-white/10 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">策略描述</label>
                    <textarea
                      placeholder="描述你的策略逻辑..."
                      value={newStrategy.description}
                      onChange={e => setNewStrategy({ ...newStrategy, description: e.target.value })}
                      className="w-full bg-black/20 border border-white/10 rounded-xl p-4 min-h-[100px] focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">策略类型</label>
                    <div className="flex gap-3">
                      {['custom', 'quant', 'manual'].map(type => (
                        <button
                          key={type}
                          onClick={() => setNewStrategy({ ...newStrategy, type })}
                          className={`flex-1 p-3 rounded-xl border transition-all ${
                            newStrategy.type === type
                              ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400'
                              : 'border-white/10 hover:border-white/20'
                          }`}
                        >
                          {type === 'custom' && '自定义'}
                          {type === 'quant' && '量化'}
                          {type === 'manual' && '主观'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-3 mt-6">
                  <Button variant="ghost" onClick={() => setShowCreate(false)} className="flex-1">
                    取消
                  </Button>
                  <Button onClick={createStrategy} className="flex-1" disabled={!newStrategy.name}>
                    创建
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
