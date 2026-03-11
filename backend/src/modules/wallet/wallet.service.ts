/**
 * 热钱包服务 - 管理平台资金流转
 * 
 * 资金流程:
 * 1. 用户充值 USDT → 平台冷钱包 (Arbitrum/BSC)
 * 2. 跟单时: 平台 → Hyperliquid (通过 bridge deposit)
 * 3. 提现时: Hyperliquid → 用户钱包 (通过 HL withdrawal → bridge → transfer)
 * 
 * 钱包角色:
 * - 冷钱包 (PLATFORM_WALLET): 接收用户充值
 * - 热钱包 (HOT_WALLET): 执行转账操作
 * - HL 钱包: 在 Hyperliquid 上的交易钱包 (与热钱包同地址)
 */

import { createWalletClient, createPublicClient, http, parseUnits, formatUnits, encodeFunctionData, erc20Abi } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { arbitrum, bsc } from 'viem/chains'
import { db } from '../../lib/db.js'

// 网络配置
const CHAINS = {
  arbitrum: {
    chain: arbitrum,
    rpc: 'https://arb1.arbitrum.io/rpc',
    usdt: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9' as `0x${string}`,
    decimals: 6,
    explorer: 'https://arbiscan.io/tx/',
  },
  bsc: {
    chain: bsc,
    rpc: 'https://bsc-dataseed1.binance.org',
    usdt: '0x55d398326f99059fF775485246999027B3197955' as `0x${string}`,
    decimals: 18,
    explorer: 'https://bscscan.com/tx/',
  },
}

// HL Bridge 合约 (Arbitrum)
const HL_BRIDGE_ADDRESS = '0x2Df1c51E09aECF9cacB7bc98cB1742757f163dF7' as `0x${string}`

class WalletService {
  private hotWalletKey: string | null = null

  get isConfigured(): boolean {
    return !!this.hotWalletKey
  }

  initialize() {
    this.hotWalletKey = process.env.HOT_WALLET_PRIVATE_KEY || null
    if (this.hotWalletKey) {
      const account = privateKeyToAccount(this.hotWalletKey as `0x${string}`)
      console.log(`🔑 Hot wallet initialized: ${account.address}`)
    } else {
      console.log('⚠️ HOT_WALLET_PRIVATE_KEY not set - auto transfers disabled')
    }
  }

  private getAccount() {
    if (!this.hotWalletKey) throw new Error('Hot wallet not configured')
    return privateKeyToAccount(this.hotWalletKey as `0x${string}`)
  }

  private getClients(network: 'arbitrum' | 'bsc') {
    const config = CHAINS[network]
    const account = this.getAccount()
    
    const publicClient = createPublicClient({
      chain: config.chain,
      transport: http(config.rpc),
    })
    
    const walletClient = createWalletClient({
      account,
      chain: config.chain,
      transport: http(config.rpc),
    })
    
    return { publicClient, walletClient, config }
  }

  /**
   * 查询热钱包 USDT 余额
   */
  async getHotWalletBalance(network: 'arbitrum' | 'bsc'): Promise<string> {
    const { publicClient, config } = this.getClients(network)
    const account = this.getAccount()
    
    const balance = await publicClient.readContract({
      address: config.usdt,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [account.address],
    })
    
    return formatUnits(balance, config.decimals)
  }

  /**
   * 转账 USDT 给用户 (提现)
   */
  async transferUSDT(
    network: 'arbitrum' | 'bsc',
    toAddress: string,
    amount: string
  ): Promise<string> {
    const { publicClient, walletClient, config } = this.getClients(network)
    
    const amountWei = parseUnits(amount, config.decimals)
    
    // 发送 ERC20 transfer
    const hash = await walletClient.writeContract({
      address: config.usdt,
      abi: erc20Abi,
      functionName: 'transfer',
      args: [toAddress as `0x${string}`, amountWei],
    })
    
    console.log(`📤 Transfer ${amount} USDT to ${toAddress} on ${network}: ${hash}`)
    
    // 等待确认
    const receipt = await publicClient.waitForTransactionReceipt({ hash })
    
    if (receipt.status !== 'success') {
      throw new Error(`Transaction failed: ${hash}`)
    }
    
    return hash
  }

  /**
   * 从 Hyperliquid 提现 USDT 到 Arbitrum
   */
  async withdrawFromHL(amount: string): Promise<void> {
    if (!this.hotWalletKey) throw new Error('Hot wallet not configured')
    
    const { Hyperliquid } = await import('hyperliquid')
    const sdk = new Hyperliquid({
      privateKey: this.hotWalletKey,
      enableWs: false,
    })
    
    await sdk.exchange.initiateWithdrawal(withdrawal.toAddress, amount)
    console.log(`📤 HL withdrawal initiated: ${amount} USDT`)
  }

  /**
   * 处理待审核的提现请求
   * 流程: 检查余额 → 从 HL 提现(如需) → 转账给用户
   */
  async processWithdrawals(): Promise<void> {
    if (!this.isConfigured) {
      console.log('⚠️ Hot wallet not configured, skipping withdrawal processing')
      return
    }

    const pendingWithdrawals = await db.withdrawRecord.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'asc' },
      take: 10,
    })

    if (pendingWithdrawals.length === 0) return

    console.log(`📋 Processing ${pendingWithdrawals.length} pending withdrawals`)

    for (const withdrawal of pendingWithdrawals) {
      try {
        const network = withdrawal.network as 'arbitrum' | 'bsc'
        const receiveAmount = String(withdrawal.receiveAmount)
        
        // 检查热钱包余额
        const balance = await this.getHotWalletBalance(network)
        
        if (parseFloat(balance) < parseFloat(receiveAmount)) {
          console.log(`⚠️ Insufficient hot wallet balance on ${network}: ${balance} < ${receiveAmount}`)
          
          // 尝试从 HL 提现到 Arbitrum
          if (network === 'arbitrum') {
            try {
              await this.withdrawFromHL(receiveAmount)
              console.log(`📤 Initiated HL withdrawal for ${receiveAmount} USDT, will retry later`)
            } catch (err) {
              console.error('HL withdrawal failed:', err)
            }
          }
          
          // 标记为等待资金
          await db.withdrawRecord.update({
            where: { id: withdrawal.id },
            data: { status: 'AWAITING_FUNDS' },
          })
          continue
        }

        // 执行转账
        const txHash = await this.transferUSDT(network, withdrawal.toAddress, receiveAmount)
        
        // 更新记录
        await db.withdrawRecord.update({
          where: { id: withdrawal.id },
          data: {
            status: 'COMPLETED',
            txHash,
            completedAt: new Date(),
          },
        })
        
        console.log(`✅ Withdrawal completed: ${receiveAmount} USDT to ${withdrawal.toAddress} (${txHash})`)
      } catch (error) {
        console.error(`❌ Withdrawal ${withdrawal.id} failed:`, error)
        await db.withdrawRecord.update({
          where: { id: withdrawal.id },
          data: { status: 'FAILED' },
        })
      }
    }
  }

  /**
   * 获取热钱包状态概览
   */
  async getStatus() {
    if (!this.isConfigured) {
      return { configured: false, address: null, balances: {} }
    }

    const account = this.getAccount()
    const balances: Record<string, string> = {}

    for (const [network, _] of Object.entries(CHAINS)) {
      try {
        balances[network] = await this.getHotWalletBalance(network as 'arbitrum' | 'bsc')
      } catch {
        balances[network] = 'error'
      }
    }

    // HL 余额
    try {
      const { Hyperliquid } = await import('hyperliquid')
      const sdk = new Hyperliquid({ enableWs: false })
      const state = await sdk.info.perpetuals.getClearinghouseState(account.address)
      balances['hyperliquid'] = state.withdrawable || '0'
    } catch {
      balances['hyperliquid'] = 'error'
    }

    return {
      configured: true,
      address: account.address,
      balances,
    }
  }
}

export const walletService = new WalletService()
