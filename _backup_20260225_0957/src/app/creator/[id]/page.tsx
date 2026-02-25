"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/navbar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, Save, Play, Pause, Trash2, TrendingUp, 
  AlertCircle, CheckCircle, Loader2, Brain, Settings
} from 'lucide-react';
import Link from 'next/link';
import { API_BASE } from '@/lib/config';

interface Strategy {
  id: string;
  name: string;
  description: string | null;
  type: string;
  status: string;
  rules: any;
  riskParams: any;
  universe: any;
  return7d: string;
  return30d: string;
  returnTotal: string;
  sharpeRatio: string;
  maxDrawdown: string;
  winRate: string;
  followers: number;
  aum: string;
  createdAt: string;
  updatedAt: string;
}

export default function StrategyEditPage() {
  const params = useParams();
  const router = useRouter();
  const strategyId = params.id as string;

  const [strategy, setStrategy] = useState<Strategy | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // 表单状态
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('custom');
  const [rulesText, setRulesText] = useState('');
  const [riskParamsText, setRiskParamsText] = useState('');

  // 获取 token
  const getToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  };

  // 加载策略数据
  useEffect(() => {
    const fetchStrategy = async () => {
      const token = getToken();
      if (!token) {
        router.push('/ramp');
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/strategy/${strategyId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) {
          if (res.status === 404) {
            setError('策略不存在');
          } else {
            throw new Error('加载失败');
          }
          return;
        }

        const data = await res.json();
        setStrategy(data);
        setName(data.name);
        setDescription(data.description || '');
        setType(data.type);
        setRulesText(data.rules ? JSON.stringify(data.rules, null, 2) : '');
        setRiskParamsText(data.riskParams ? JSON.stringify(data.riskParams, null, 2) : '');
      } catch (err) {
        setError('加载策略失败');
      } finally {
        setLoading(false);
      }
    };

    fetchStrategy();
  }, [strategyId, router]);

  // 保存策略
  const handleSave = async () => {
    const token = getToken();
    if (!token) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // 解析 JSON
      let rules = null;
      let riskParams = null;

      if (rulesText.trim()) {
        try {
          rules = JSON.parse(rulesText);
        } catch {
          setError('规则 JSON 格式错误');
          setSaving(false);
          return;
        }
      }

      if (riskParamsText.trim()) {
        try {
          riskParams = JSON.parse(riskParamsText);
        } catch {
          setError('风控参数 JSON 格式错误');
          setSaving(false);
          return;
        }
      }

      const res = await fetch(`${API_BASE}/strategy/${strategyId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          description,
          type,
          rules,
          riskParams,
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '保存失败');
      }

      const updated = await res.json();
      setStrategy(updated);
      setSuccess('保存成功');
    } catch (err: any) {
      setError(err.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  // 激活/暂停策略
  const handleToggleStatus = async () => {
    const token = getToken();
    if (!token || !strategy) return;

    const action = strategy.status === 'active' ? 'pause' : 'activate';
    
    try {
      const res = await fetch(`${API_BASE}/strategy/${strategyId}/${action}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) throw new Error('操作失败');

      const updated = await res.json();
      setStrategy(updated);
      setSuccess(action === 'activate' ? '策略已激活' : '策略已暂停');
    } catch (err) {
      setError('操作失败');
    }
  };

  // 删除策略
  const handleDelete = async () => {
    if (!confirm('确定要删除此策略吗？此操作不可恢复。')) return;

    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE}/strategy/${strategyId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) throw new Error('删除失败');

      router.push('/creator');
    } catch (err) {
      setError('删除失败');
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#040405]">
        <Navbar />
        <div className="pt-24 pb-16 px-6">
          <div className="max-w-4xl mx-auto flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-cyan-400" size={32} />
          </div>
        </div>
      </main>
    );
  }

  if (error && !strategy) {
    return (
      <main className="min-h-screen bg-[#040405]">
        <Navbar />
        <div className="pt-24 pb-16 px-6">
          <div className="max-w-4xl mx-auto text-center py-20">
            <AlertCircle className="mx-auto mb-4 text-red-400" size={48} />
            <h1 className="text-2xl font-bold mb-4">{error}</h1>
            <Link href="/creator">
              <Button variant="outline">返回策略列表</Button>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#040405]">
      <Navbar />
      
      <div className="pt-24 pb-16 px-6">
        <div className="max-w-4xl mx-auto">
          {/* 顶部导航 */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Link href="/creator">
                <Button variant="ghost" size="sm">
                  <ArrowLeft size={16} className="mr-2" />
                  返回
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <Settings size={24} className="text-cyan-400" />
                  编辑策略
                </h1>
                <p className="text-gray-500 text-sm">修改策略配置和参数</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleStatus}
                className={strategy?.status === 'active' ? 'text-yellow-400' : 'text-green-400'}
              >
                {strategy?.status === 'active' ? (
                  <>
                    <Pause size={16} className="mr-1" />
                    暂停
                  </>
                ) : (
                  <>
                    <Play size={16} className="mr-1" />
                    激活
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDelete}
                className="text-red-400 hover:text-red-300"
              >
                <Trash2 size={16} className="mr-1" />
                删除
              </Button>
            </div>
          </div>

          {/* 提示消息 */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-2 text-red-400">
              <AlertCircle size={18} />
              {error}
            </div>
          )}
          {success && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl flex items-center gap-2 text-green-400">
              <CheckCircle size={18} />
              {success}
            </div>
          )}

          {/* 策略业绩概览 */}
          {strategy && (
            <Card className="mb-6 p-4 bg-white/[0.02] border-white/5">
              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-xs text-gray-500 mb-1">7日收益</div>
                  <div className={`text-lg font-bold ${parseFloat(strategy.return7d) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {parseFloat(strategy.return7d) >= 0 ? '+' : ''}{(parseFloat(strategy.return7d) * 100).toFixed(2)}%
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">夏普比率</div>
                  <div className="text-lg font-bold">{parseFloat(strategy.sharpeRatio).toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">跟投人数</div>
                  <div className="text-lg font-bold">{strategy.followers}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">管理资产</div>
                  <div className="text-lg font-bold">${parseFloat(strategy.aum).toLocaleString()}</div>
                </div>
              </div>
            </Card>
          )}

          {/* 编辑表单 */}
          <Card className="p-6 bg-white/[0.02] border-white/5">
            <div className="space-y-6">
              {/* 基本信息 */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">策略名称</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500/50"
                  placeholder="输入策略名称"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">策略描述</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500/50 resize-none"
                  placeholder="描述你的策略逻辑"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">策略类型</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500/50"
                >
                  <option value="custom">自定义</option>
                  <option value="quant">量化</option>
                  <option value="manual">主观交易</option>
                </select>
              </div>

              {/* 策略规则 */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  策略规则 (JSON)
                  <span className="text-gray-600 ml-2">可选</span>
                </label>
                <textarea
                  value={rulesText}
                  onChange={(e) => setRulesText(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-cyan-500/50 resize-none"
                  placeholder='{"conditions": [...], "action": {...}}'
                />
              </div>

              {/* 风控参数 */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  风控参数 (JSON)
                  <span className="text-gray-600 ml-2">可选</span>
                </label>
                <textarea
                  value={riskParamsText}
                  onChange={(e) => setRiskParamsText(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-cyan-500/50 resize-none"
                  placeholder='{"stopLoss": -0.08, "takeProfit": 0.15}'
                />
              </div>

              {/* 保存按钮 */}
              <div className="pt-4">
                <Button
                  onClick={handleSave}
                  disabled={saving || !name.trim()}
                  className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600"
                >
                  {saving ? (
                    <>
                      <Loader2 size={18} className="mr-2 animate-spin" />
                      保存中...
                    </>
                  ) : (
                    <>
                      <Save size={18} className="mr-2" />
                      保存更改
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}
