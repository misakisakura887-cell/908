"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Copy, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { getToken, getUser, getCurrentUser, setUser as saveUser } from '@/lib/auth';
import { toast } from 'sonner';
import { useAccount, useSendTransaction, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, encodeFunctionData } from 'viem';

// 平台收款地址 (冷钱包)
const PLATFORM_WALLET = '0x12fb87606b61bbF1b886262f4215e0ba52ba2F5E';

// 支持的网络和 USDT 合约地址
const NETWORKS = [
  {
    id: 'arbitrum',
    name: 'Arbitrum One',
    chainId: 42161,
    usdt: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
    decimals: 6,
    icon: '🔵',
    explorer: 'https://arbiscan.io/tx/',
    fee: '~$0.10',
    time: '~1分钟',
  },
  {
    id: 'bsc',
    name: 'BNB Chain',
    chainId: 56,
    usdt: '0x55d398326f99059fF775485246999027B3197955',
    decimals: 18,
    icon: '🟡',
    explorer: 'https://bscscan.com/tx/',
    fee: '~$0.05',
    time: '~15秒',
  },
];

// ERC20 transfer ABI
const ERC20_ABI = [
  {
    name: 'transfer',
    type: 'function',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const;

export default function DepositPage() {
  const router = useRouter();
  const { address, isConnected, chain } = useAccount();
  const [selectedNetwork, setSelectedNetwork] = useState(NETWORKS[0]);
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState<'input' | 'confirm' | 'pending' | 'done'>('input');
  const [copied, setCopied] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const token = getToken();

  const { sendTransaction, isPending: isSending, data: sendData } = useSendTransaction();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: sendData,
  });

  // 交易确认后通知后端
  useEffect(() => {
    if (isSuccess && sendData) {
      setTxHash(sendData);
      setStep('done');
      notifyDeposit(sendData);
    }
  }, [isSuccess, sendData]);

  const notifyDeposit = async (hash: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/deposit/notify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          txHash: hash,
          network: selectedNetwork.id,
          amount: amount,
          fromAddress: address,
        }),
      });
      if (response.ok) {
        toast.success('充值已提交，正在确认中...');
        // 刷新余额
        const userData = await getCurrentUser();
        saveUser(userData);
      }
    } catch (err) {
      console.error('Notify deposit failed:', err);
    }
  };

  const handleDeposit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('请输入有效金额');
      return;
    }
    if (!isConnected) {
      toast.error('请先连接钱包');
      return;
    }
    if (chain?.id !== selectedNetwork.chainId) {
      toast.error(`请在钱包中切换到 ${selectedNetwork.name} 网络`);
      return;
    }

    try {
      const amountInWei = parseUnits(amount, selectedNetwork.decimals);
      const data = encodeFunctionData({
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [PLATFORM_WALLET as `0x${string}`, amountInWei],
      });

      sendTransaction({
        to: selectedNetwork.usdt as `0x${string}`,
        data,
      });
      
      setStep('pending');
    } catch (err: any) {
      console.error('Deposit error:', err);
      toast.error('交易失败: ' + (err?.message || '未知错误'));
    }
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(PLATFORM_WALLET);
    setCopied(true);
    toast.success('地址已复制');
    setTimeout(() => setCopied(false), 2000);
  };

  const quickAmounts = [10, 50, 100, 500, 1000];

  if (!token) {
    return (
      <div className="min-h-screen bg-[#040405]">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 pt-24 text-center">
          <p className="text-[hsl(var(--muted-foreground))]">请先连接钱包并登录</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#040405]">
      <Navbar />
      
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-24 pb-12">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft size={16} className="mr-2" />
          返回
        </Button>

        <h1 className="text-2xl font-bold mb-6">Crypto 充值</h1>

        {/* 网络选择 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">选择网络</CardTitle>
            <CardDescription>选择 USDT 所在的区块链网络</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {NETWORKS.map((net) => (
                <button
                  key={net.id}
                  onClick={() => setSelectedNetwork(net)}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    selectedNetwork.id === net.id
                      ? 'border-cyan-500 bg-cyan-500/10'
                      : 'border-[hsl(var(--border))] hover:border-cyan-500/50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{net.icon}</span>
                    <span className="font-medium">{net.name}</span>
                  </div>
                  <div className="text-xs text-[hsl(var(--muted-foreground))] space-y-1">
                    <p>Gas 费: {net.fee}</p>
                    <p>到账: {net.time}</p>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {step === 'input' && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-base">充值金额</CardTitle>
              <CardDescription>输入 USDT 充值金额（{selectedNetwork.name}）</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="amount">金额 (USDT)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="100"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="mt-2 text-lg"
                />
              </div>

              {/* 快捷金额 */}
              <div className="flex flex-wrap gap-2">
                {quickAmounts.map((q) => (
                  <button
                    key={q}
                    onClick={() => setAmount(String(q))}
                    className={`px-4 py-2 rounded-lg text-sm border transition-all ${
                      amount === String(q)
                        ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400'
                        : 'border-[hsl(var(--border))] hover:border-cyan-500/50'
                    }`}
                  >
                    ${q}
                  </button>
                ))}
              </div>

              {/* 收款地址 */}
              <div className="p-4 bg-[hsl(var(--secondary))] rounded-xl">
                <p className="text-xs text-[hsl(var(--muted-foreground))] mb-2">平台收款地址</p>
                <div className="flex items-center gap-2">
                  <code className="text-sm font-mono text-cyan-400 break-all flex-1">{PLATFORM_WALLET}</code>
                  <button onClick={copyAddress} className="p-2 hover:bg-[hsl(var(--border))] rounded-lg transition-colors">
                    {copied ? <CheckCircle size={16} className="text-emerald-400" /> : <Copy size={16} />}
                  </button>
                </div>
              </div>

              <div className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <AlertCircle size={16} className="text-yellow-400 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-yellow-400">
                  <p className="font-medium mb-1">请确认</p>
                  <ul className="space-y-0.5 list-disc list-inside">
                    <li>仅支持 USDT（{selectedNetwork.name} 网络）</li>
                    <li>请勿发送其他代币，否则将无法找回</li>
                    <li>最低充值 1 USDT</li>
                  </ul>
                </div>
              </div>

              <Button
                onClick={handleDeposit}
                disabled={!amount || parseFloat(amount) <= 0 || isSending}
                className="w-full"
                size="lg"
              >
                {isSending ? '请在钱包中确认...' : `充值 ${amount || '0'} USDT`}
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 'pending' && (
          <Card className="mb-6">
            <CardContent className="pt-6 text-center">
              <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <h3 className="text-lg font-bold mb-2">交易确认中</h3>
              <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4">
                请在钱包中确认交易，区块链确认后将自动到账
              </p>
              {isConfirming && (
                <p className="text-xs text-cyan-400">区块链确认中...</p>
              )}
            </CardContent>
          </Card>
        )}

        {step === 'done' && txHash && (
          <Card className="mb-6 border-emerald-500/20">
            <CardContent className="pt-6 text-center">
              <CheckCircle size={48} className="mx-auto mb-4 text-emerald-400" />
              <h3 className="text-lg font-bold mb-2 text-emerald-400">充值成功！</h3>
              <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4">
                {amount} USDT 已充值到您的账户
              </p>
              <a
                href={`${selectedNetwork.explorer}${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-cyan-400 hover:underline mb-4"
              >
                查看交易 <ExternalLink size={14} />
              </a>
              <div className="flex gap-3 mt-4">
                <Button variant="secondary" onClick={() => { setStep('input'); setAmount(''); }} className="flex-1">
                  继续充值
                </Button>
                <Button onClick={() => router.push('/invest/strategies/longtou')} className="flex-1">
                  开始跟单
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 手动转账说明 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">手动转账</CardTitle>
            <CardDescription>也可以从任意钱包直接转账 USDT 到平台地址</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-[hsl(var(--muted-foreground))]">
            <p>1. 复制上方平台收款地址</p>
            <p>2. 在您的钱包中选择 USDT 转账</p>
            <p>3. 选择 Arbitrum 或 BNB Chain 网络</p>
            <p>4. 输入金额并确认转账</p>
            <p>5. 转账后请联系客服确认入账（自动入账功能开发中）</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
