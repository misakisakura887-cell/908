"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Copy, CheckCircle, AlertCircle, ExternalLink, Loader2 } from 'lucide-react';
import { getToken, getCurrentUser, setUser as saveUser } from '@/lib/auth';
import { toast } from 'sonner';
import { useAccount, useSendTransaction, useWaitForTransactionReceipt, useSwitchChain, useReadContract } from 'wagmi';
import { parseUnits, formatUnits, encodeFunctionData, erc20Abi } from 'viem';

// 平台收款地址 (冷钱包)
const PLATFORM_WALLET = '0x12fb87606b61bbF1b886262f4215e0ba52ba2F5E';

// 支持的网络和 USDT 合约地址
const NETWORKS = [
  {
    id: 'arbitrum',
    name: 'Arbitrum One',
    chainId: 42161,
    usdt: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9' as `0x${string}`,
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
    usdt: '0x55d398326f99059fF775485246999027B3197955' as `0x${string}`,
    decimals: 18,
    icon: '🟡',
    explorer: 'https://bscscan.com/tx/',
    fee: '~$0.05',
    time: '~15秒',
  },
];

export default function DepositPage() {
  const router = useRouter();
  const { address, isConnected, chain } = useAccount();
  const [selectedNetwork, setSelectedNetwork] = useState(NETWORKS[0]);
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState<'input' | 'confirm' | 'pending' | 'done'>('input');
  const [copied, setCopied] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [isSwitching, setIsSwitching] = useState(false);
  const token = getToken();

  const { switchChain } = useSwitchChain();
  const { sendTransaction, isPending: isSending, data: sendData } = useSendTransaction();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: sendData,
  });

  // 读取用户在选定网络上的 USDT 余额
  const { data: usdtBalance, refetch: refetchBalance } = useReadContract({
    address: selectedNetwork.usdt as `0x${string}`,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [address!],
    chainId: selectedNetwork.chainId,
    query: { enabled: !!address },
  });

  const formattedBalance = usdtBalance ? formatUnits(usdtBalance as bigint, selectedNetwork.decimals) : '0';
  const walletBalance = usdtBalance !== undefined ? parseFloat(formattedBalance) : null;
  const isInsufficientBalance = walletBalance !== null && !!amount && parseFloat(amount) > parseFloat(formattedBalance);
  const isWrongChain = isConnected && chain?.id !== selectedNetwork.chainId;

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
        const userData = await getCurrentUser();
        saveUser(userData);
      }
    } catch (err) {
      console.error('Notify deposit failed:', err);
    }
  };

  const handleNetworkSelect = async (net: typeof NETWORKS[0]) => {
    setSelectedNetwork(net);
    if (isConnected && chain?.id !== net.chainId) {
      setIsSwitching(true);
      try {
        await switchChain({ chainId: net.chainId });
        toast.success(`已切换到 ${net.name}`);
      } catch (err: any) {
        if (!err?.message?.includes('rejected')) {
          toast.error(`切换网络失败: ${err?.message || '请手动切换'}`);
        }
      } finally {
        setIsSwitching(false);
      }
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
    if (isInsufficientBalance) {
      toast.error('USDT 余额不足');
      return;
    }

    try {
      const amountInWei = parseUnits(amount, selectedNetwork.decimals);
      const data = encodeFunctionData({
        abi: erc20Abi,
        functionName: 'transfer',
        args: [PLATFORM_WALLET as `0x${string}`, amountInWei],
      });

      sendTransaction({
        to: selectedNetwork.usdt,
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
            <CardDescription>选择 USDT 所在的区块链网络，将自动切换钱包网络</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {NETWORKS.map((net) => (
                <button
                  key={net.id}
                  onClick={() => handleNetworkSelect(net)}
                  disabled={isSwitching}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    selectedNetwork.id === net.id
                      ? 'border-cyan-500 bg-cyan-500/10'
                      : 'border-[hsl(var(--border))] hover:border-cyan-500/50'
                  } ${isSwitching ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{net.icon}</span>
                    <span className="font-medium text-sm">{net.name}</span>
                    {isSwitching && selectedNetwork.id === net.id && (
                      <Loader2 size={12} className="animate-spin text-cyan-400" />
                    )}
                  </div>
                  <div className="text-xs text-[hsl(var(--muted-foreground))] space-y-1">
                    <p>Gas 费: {net.fee}</p>
                    <p>到账: {net.time}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* 链不匹配提示 */}
            {isWrongChain && !isSwitching && (
              <div className="mt-3 flex items-center gap-2 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                <AlertCircle size={14} className="text-orange-400 flex-shrink-0" />
                <p className="text-xs text-orange-400 flex-1">
                  当前网络不匹配，点击网络卡片自动切换
                </p>
                <button
                  onClick={() => handleNetworkSelect(selectedNetwork)}
                  className="text-xs text-orange-400 underline"
                >
                  立即切换
                </button>
              </div>
            )}
          </CardContent>
        </Card>

        {step === 'input' && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-base">充值金额</CardTitle>
              <CardDescription>输入 USDT 充值金额（{selectedNetwork.name}）</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 钱包余额显示 */}
              <div className="flex items-center justify-between p-3 bg-[hsl(var(--secondary))] rounded-lg">
                <span className="text-sm text-[hsl(var(--muted-foreground))]">钱包 USDT 余额</span>
                <span className="text-sm font-medium">
                  {usdtBalance !== undefined ? (
                    <span className={isInsufficientBalance ? 'text-red-400' : 'text-cyan-400'}>
                      {formattedBalance} USDT
                    </span>
                  ) : address ? (
                    <Loader2 size={14} className="animate-spin inline" />
                  ) : (
                    <span className="text-[hsl(var(--muted-foreground))]">-- USDT</span>
                  )}
                </span>
              </div>

              <div>
                <Label htmlFor="amount">金额 (USDT)</Label>
                <div className="relative mt-2">
                  <Input
                    id="amount"
                    type="number"
                    placeholder="100"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className={`text-lg pr-16 ${isInsufficientBalance ? 'border-red-500/50' : ''}`}
                  />
                  {walletBalance !== null && (
                    <button
                      onClick={() => setAmount(walletBalance.toFixed(selectedNetwork.decimals === 6 ? 2 : 4))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-cyan-400 hover:text-cyan-300"
                    >
                      MAX
                    </button>
                  )}
                </div>
                {isInsufficientBalance && (
                  <p className="text-xs text-red-400 mt-1">余额不足，当前余额 {walletBalance?.toFixed(2)} USDT</p>
                )}
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
                  <button onClick={copyAddress} className="p-2 hover:bg-[hsl(var(--border))] rounded-lg transition-colors flex-shrink-0">
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
                disabled={!amount || parseFloat(amount) <= 0 || isSending || isInsufficientBalance || isSwitching}
                className="w-full"
                size="lg"
              >
                {isSwitching ? (
                  <><Loader2 size={16} className="mr-2 animate-spin" />切换网络中...</>
                ) : isSending ? (
                  '请在钱包中确认...'
                ) : isInsufficientBalance ? (
                  '余额不足'
                ) : (
                  `充值 ${amount || '0'} USDT`
                )}
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
                <Button onClick={() => router.push('/trade')} className="flex-1">
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
