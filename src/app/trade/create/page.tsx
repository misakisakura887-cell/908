"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/layout/navbar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Bot, Check } from 'lucide-react';
import { getToken } from '@/lib/auth';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

interface BotType {
  id: string; name: string; icon: string; description: string;
  riskLevel: string; category: string; defaultParams: Record<string, any>;
}

const SYMBOLS = ['BTC', 'ETH', 'SOL', 'DOGE', 'XRP', 'ARB', 'OP', 'AVAX', 'LINK', 'UNI'];

const riskPresets = {
  conservative: { maxPositionSize: 50, maxDrawdown: 2, stopLoss: 2, takeProfit: 5, maxLeverage: 2, label: '🛡️ 保守 (回撤<2%)' },
  balanced: { maxPositionSize: 200, maxDrawdown: 10, stopLoss: 5, takeProfit: 15, maxLeverage: 5, label: '⚖️ 稳健 (回撤<10%)' },
  aggressive: { maxPositionSize: 500, maxDrawdown: 30, stopLoss: 10, takeProfit: 50, maxLeverage: 10, label: '🔥 激进 (高杠杆高回报)' },
};

import { Suspense } from 'react';

function CreateBotInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [botTypes, setBotTypes] = useState<BotType[]>([]);
  const [selectedType, setSelectedType] = useState<string>(searchParams.get('type') || '');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedSymbols, setSelectedSymbols] = useState<string[]>(['BTC', 'ETH']);
  const [riskLevel, setRiskLevel] = useState<'conservative' | 'balanced' | 'aggressive'>('balanced');
  const [riskParams, setRiskParams] = useState(riskPresets.balanced);
  const [customParams, setCustomParams] = useState<Record<string, any>>({});
  const [isPublic, setIsPublic] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const token = getToken();

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/bots/types`).then(r => r.json()).then(setBotTypes).catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedType) {
      const bt = botTypes.find(b => b.id === selectedType);
      if (bt) {
        setCustomParams(bt.defaultParams);
        if (!name) setName(`我的${bt.name}`);
      }
    }
  }, [selectedType, botTypes]);

  useEffect(() => {
    setRiskParams({ ...riskPresets[riskLevel], label: riskPresets[riskLevel].label });
  }, [riskLevel]);

  const toggleSymbol = (s: string) => {
    setSelectedSymbols(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  const handleCreate = async () => {
    if (!token) { toast.error('请先登录'); return; }
    if (!selectedType || !name) { toast.error('请填写完整信息'); return; }
    if (selectedSymbols.length === 0) { toast.error('请至少选择一个交易标的'); return; }

    setSubmitting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/bots/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          name, type: selectedType, description,
          symbols: selectedSymbols,
          params: customParams,
          riskParams: { maxPositionSize: riskParams.maxPositionSize, maxDrawdown: riskParams.maxDrawdown, stopLoss: riskParams.stopLoss, takeProfit: riskParams.takeProfit, maxLeverage: riskParams.maxLeverage },
          riskLevel, isPublic,
        }),
      });
      if (res.ok) {
        toast.success('机器人创建成功！');
        router.push('/trade');
      } else {
        const err = await res.json();
        toast.error(err.error || '创建失败');
      }
    } catch { toast.error('创建失败'); }
    finally { setSubmitting(false); }
  };

  const selectedBotType = botTypes.find(b => b.id === selectedType);

  return (
    <div className="min-h-screen bg-[#040405]">
      <Navbar />
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto px-4 sm:px-6 pt-24 pb-12">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft size={16} className="mr-2" /> 返回
        </Button>

        <h1 className="text-2xl font-bold mb-2 flex items-center gap-2"><Bot size={24} className="text-cyan-400" /> 创建交易机器人</h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))] mb-6">选择策略类型，配置参数，一键启动自动交易</p>

        {/* Steps */}
        <div className="flex items-center gap-2 mb-8">
          {[{ n: 1, l: '选择策略' }, { n: 2, l: '配置参数' }, { n: 3, l: '风控设置' }].map((s, i) => (
            <div key={s.n} className="flex items-center gap-2 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= s.n ? 'bg-cyan-500 text-white' : 'bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))]'}`}>
                {step > s.n ? <Check size={14} /> : s.n}
              </div>
              <span className={`text-xs ${step >= s.n ? 'text-white' : 'text-[hsl(var(--muted-foreground))]'}`}>{s.l}</span>
              {i < 2 && <div className={`flex-1 h-px ${step > s.n ? 'bg-cyan-500' : 'bg-[hsl(var(--border))]'}`} />}
            </div>
          ))}
        </div>

        {/* Step 1: Select Type */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="font-bold mb-3">核心交易逻辑</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {botTypes.filter(b => b.category === 'core').map((bt) => (
                <Card key={bt.id}
                  onClick={() => setSelectedType(bt.id)}
                  className={`cursor-pointer transition-all ${selectedType === bt.id ? 'border-cyan-500 bg-cyan-500/5' : 'hover:border-cyan-500/30'}`}
                >
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">{bt.icon}</span>
                      <span className="font-medium">{bt.name}</span>
                    </div>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">{bt.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <h3 className="font-bold mt-6 mb-3">AI 技术底层</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {botTypes.filter(b => b.category === 'ai_tech').map((bt) => (
                <Card key={bt.id} onClick={() => setSelectedType(bt.id)}
                  className={`cursor-pointer transition-all ${selectedType === bt.id ? 'border-cyan-500 bg-cyan-500/5' : 'hover:border-cyan-500/30'}`}>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center gap-2 mb-2"><span className="text-xl">{bt.icon}</span><span className="font-medium">{bt.name}</span></div>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">{bt.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <h3 className="font-bold mt-6 mb-3">风险偏好模板</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {botTypes.filter(b => b.category === 'risk').map((bt) => (
                <Card key={bt.id} onClick={() => setSelectedType(bt.id)}
                  className={`cursor-pointer transition-all ${selectedType === bt.id ? 'border-cyan-500 bg-cyan-500/5' : 'hover:border-cyan-500/30'}`}>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center gap-2 mb-2"><span className="text-xl">{bt.icon}</span><span className="font-medium">{bt.name}</span></div>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">{bt.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex justify-end mt-6">
              <Button onClick={() => { if (!selectedType) { toast.error('请选择一个策略'); return; } setStep(2); }} size="lg">
                下一步 →
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Configure Params */}
        {step === 2 && (
          <div className="space-y-6">
            <Card className="bg-[hsl(var(--card))]/60">
              <CardHeader><CardTitle className="text-base">基本信息</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div><Label>机器人名称</Label>
                  <Input value={name} onChange={e => setName(e.target.value)} placeholder="我的趋势追踪机器人" className="mt-1" /></div>
                <div><Label>描述 (可选)</Label>
                  <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="简单描述你的策略逻辑" className="mt-1" /></div>
              </CardContent>
            </Card>

            <Card className="bg-[hsl(var(--card))]/60">
              <CardHeader><CardTitle className="text-base">交易标的</CardTitle><CardDescription>选择要交易的币种</CardDescription></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {SYMBOLS.map(s => (
                    <button key={s} onClick={() => toggleSymbol(s)}
                      className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${selectedSymbols.includes(s) ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400' : 'border-[hsl(var(--border))] hover:border-cyan-500/50'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {selectedBotType && Object.keys(selectedBotType.defaultParams).length > 0 && (
              <Card className="bg-[hsl(var(--card))]/60">
                <CardHeader><CardTitle className="text-base">策略参数</CardTitle><CardDescription>{selectedBotType.name} 专属参数</CardDescription></CardHeader>
                <CardContent className="space-y-3">
                  {Object.entries(selectedBotType.defaultParams).map(([key, defaultVal]) => (
                    <div key={key} className="flex items-center justify-between gap-4">
                      <Label className="text-sm whitespace-nowrap">{key}</Label>
                      <Input type="number" value={customParams[key] ?? defaultVal}
                        onChange={e => setCustomParams(prev => ({ ...prev, [key]: parseFloat(e.target.value) || 0 }))}
                        className="w-32 text-right" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep(1)}>← 上一步</Button>
              <Button onClick={() => setStep(3)} size="lg">下一步 →</Button>
            </div>
          </div>
        )}

        {/* Step 3: Risk + Confirm */}
        {step === 3 && (
          <div className="space-y-6">
            <Card className="bg-[hsl(var(--card))]/60">
              <CardHeader><CardTitle className="text-base">风险等级</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  {(Object.entries(riskPresets) as [string, any][]).map(([key, preset]) => (
                    <button key={key} onClick={() => setRiskLevel(key as any)}
                      className={`p-4 rounded-xl border text-left transition-all ${riskLevel === key ? 'border-cyan-500 bg-cyan-500/5' : 'border-[hsl(var(--border))]'}`}>
                      <p className="font-medium text-sm mb-1">{preset.label}</p>
                      <div className="text-xs text-[hsl(var(--muted-foreground))] space-y-0.5">
                        <p>仓位: ${preset.maxPositionSize}</p>
                        <p>杠杆: {preset.maxLeverage}x</p>
                        <p>止损: {preset.stopLoss}%</p>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[hsl(var(--card))]/60">
              <CardHeader><CardTitle className="text-base">风控参数微调</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {[
                  { key: 'maxPositionSize', label: '最大仓位 (USDT)', unit: '$' },
                  { key: 'maxDrawdown', label: '最大回撤 (%)', unit: '%' },
                  { key: 'stopLoss', label: '止损 (%)', unit: '%' },
                  { key: 'takeProfit', label: '止盈 (%)', unit: '%' },
                  { key: 'maxLeverage', label: '最大杠杆', unit: 'x' },
                ].map(({ key, label, unit }) => (
                  <div key={key} className="flex items-center justify-between gap-4">
                    <Label className="text-sm">{label}</Label>
                    <div className="flex items-center gap-1">
                      <Input type="number" value={(riskParams as any)[key]}
                        onChange={e => setRiskParams(prev => ({ ...prev, [key]: parseFloat(e.target.value) || 0 }))}
                        className="w-24 text-right" />
                      <span className="text-xs text-[hsl(var(--muted-foreground))] w-4">{unit}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-[hsl(var(--card))]/60">
              <CardContent className="pt-5 pb-5">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} className="w-4 h-4 rounded" />
                  <div>
                    <p className="text-sm font-medium">公开策略</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">其他用户可以在策略广场看到并跟单你的策略</p>
                  </div>
                </label>
              </CardContent>
            </Card>

            {/* Summary */}
            <Card className="bg-gradient-to-r from-cyan-500/10 to-blue-500/5 border-cyan-500/20">
              <CardContent className="pt-5 pb-5">
                <h4 className="font-bold mb-3">创建确认</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-[hsl(var(--muted-foreground))]">策略类型</span><span>{selectedBotType?.name}</span>
                  <span className="text-[hsl(var(--muted-foreground))]">名称</span><span>{name}</span>
                  <span className="text-[hsl(var(--muted-foreground))]">交易标的</span><span>{selectedSymbols.join(', ')}</span>
                  <span className="text-[hsl(var(--muted-foreground))]">风险等级</span><span>{riskPresets[riskLevel].label}</span>
                  <span className="text-[hsl(var(--muted-foreground))]">公开</span><span>{isPublic ? '是' : '否'}</span>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep(2)}>← 上一步</Button>
              <Button onClick={handleCreate} disabled={submitting} size="lg" className="bg-gradient-to-r from-cyan-500 to-blue-600">
                {submitting ? '创建中...' : '🤖 创建机器人'}
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default function CreateBotPage() {
  return <Suspense fallback={<div className="min-h-screen bg-[#040405]"><Navbar /></div>}><CreateBotInner /></Suspense>;
}
