"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Shield, AlertCircle, Link as LinkIcon } from 'lucide-react';
import { getToken } from '@/lib/auth';
import { toast } from 'sonner';

export default function BindHLPage() {
  const router = useRouter();
  const [hlAddress, setHlAddress] = useState('');
  const [hlPrivateKey, setHlPrivateKey] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleBind = async (e: React.FormEvent) => {
    e.preventDefault();

    const token = getToken();
    if (!token) {
      toast.error('请先连接钱包并登录');
      router.push('/');
      return;
    }

    if (!hlAddress || !hlAddress.startsWith('0x') || hlAddress.length !== 42) {
      toast.error('请输入有效的 Hyperliquid 钱包地址');
      return;
    }

    if (!hlPrivateKey || !hlPrivateKey.startsWith('0x')) {
      toast.error('请输入有效的私钥（以 0x 开头）');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/bindhl`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          hlAddress,
          hlPrivateKey,
        }),
      });

      if (response.ok) {
        toast.success('绑定 Hyperliquid 成功！');
        router.push('/dashboard');
      } else {
        const error = await response.json();
        toast.error(error.error || '绑定失败');
      }
    } catch (error) {
      console.error('Bind error:', error);
      toast.error('绑定失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#040405]">
      <Navbar />
      
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-24 pb-12">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft size={16} className="mr-2" />
          返回
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LinkIcon size={24} className="text-cyan-400" />
              绑定 Hyperliquid 钱包
            </CardTitle>
            <CardDescription>
              绑定您的 Hyperliquid 钱包以启用自动跟单功能
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleBind} className="space-y-6">
              {/* 安全提示 */}
              <div className="flex items-start gap-3 p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-xl">
                <Shield size={20} className="text-cyan-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="text-cyan-400 font-medium mb-1">安全保障</p>
                  <p className="text-[hsl(var(--muted-foreground))]">
                    您的私钥将使用 AES-256 加密存储，仅用于自动跟单交易。系统不会进行提币或其他未授权操作。
                  </p>
                </div>
              </div>

              {/* HL 钱包地址 */}
              <div>
                <Label htmlFor="hlAddress">Hyperliquid 钱包地址 *</Label>
                <Input
                  id="hlAddress"
                  type="text"
                  placeholder="0x..."
                  value={hlAddress}
                  onChange={(e) => setHlAddress(e.target.value)}
                  className="mt-2"
                  required
                />
                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-2">
                  输入您的 Hyperliquid 钱包地址（以 0x 开头）
                </p>
              </div>

              {/* HL Private Key */}
              <div>
                <Label htmlFor="hlPrivateKey">Hyperliquid 私钥 *</Label>
                <Input
                  id="hlPrivateKey"
                  type="password"
                  placeholder="0x..."
                  value={hlPrivateKey}
                  onChange={(e) => setHlPrivateKey(e.target.value)}
                  className="mt-2"
                  required
                />
                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-2">
                  输入您的 Hyperliquid 私钥（以 0x 开头），用于自动执行跟单交易
                </p>
              </div>

              {/* 警告提示 */}
              <div className="flex items-start gap-3 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                <AlertCircle size={20} className="text-yellow-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="text-yellow-400 font-medium mb-1">重要提示</p>
                  <ul className="text-[hsl(var(--muted-foreground))] space-y-1 list-disc list-inside">
                    <li>请确保输入正确的钱包地址和私钥</li>
                    <li>私钥仅用于自动跟单交易，不会用于其他用途</li>
                    <li>建议使用专用的跟单钱包，不要使用主钱包</li>
                    <li>您可以随时在设置中解绑或更换钱包</li>
                  </ul>
                </div>
              </div>

              {/* 提交按钮 */}
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => router.back()}
                  className="flex-1"
                  disabled={submitting}
                >
                  取消
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  loading={submitting}
                >
                  {submitting ? '绑定中...' : '确认绑定'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* 如何获取私钥说明 */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">如何获取 Hyperliquid 私钥？</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-[hsl(var(--muted-foreground))]">
            <div>
              <p className="font-medium text-white mb-1">1. MetaMask 钱包</p>
              <p>账户详情 → 显示私钥 → 输入密码 → 复制私钥</p>
            </div>
            <div>
              <p className="font-medium text-white mb-1">2. Hyperliquid 官方钱包</p>
              <p>设置 → 导出私钥 → 确认安全提示 → 复制私钥</p>
            </div>
            <div>
              <p className="font-medium text-white mb-1">3. 其他钱包</p>
              <p>查找钱包的"导出私钥"或"显示私钥"功能</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
