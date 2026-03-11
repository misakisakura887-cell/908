import { db } from '../../lib/db.js'
import Decimal from 'decimal.js'

export const copyTradeService = {
  // 跟单策略 — 路径A：用户自己的 HL 钱包下单
  // 资金始终在用户自己的 HL 账户，平台只负责信号和代操作
  async followStrategy(userId: string, strategyId: string, amount: number) {
    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) throw new Error('用户不存在')
    
    // === 必须绑定 HL 才能跟单 ===
    if (!user.hlApiKey || !user.hlAddress) {
      throw new Error('NEED_HL_BINDING')
    }
    
    // 解密 HL 私钥
    let hlPrivateKey: string
    try {
      const crypto = await import('crypto')
      const rawKey = process.env.ENCRYPTION_KEY || 'default-key-for-dev'
      const key = crypto.createHash('sha256').update(rawKey).digest()
      const [ivHex, encHex] = user.hlApiKey.split(':')
      const iv = Buffer.from(ivHex, 'hex')
      const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv)
      hlPrivateKey = decipher.update(encHex, 'hex', 'utf8')
      hlPrivateKey += decipher.final('utf8')
    } catch (err: any) {
      throw new Error('HL_VERIFY_FAILED: 私钥解密失败，请重新绑定')
    }
    
    // 检查 HL 余额
    const hlBalance = await this.getHLBalance(user.hlAddress)
    const hlAvailable = hlBalance.totalAvailable
    console.log(`✅ HL balance for ${userId}: $${hlAvailable.toFixed(2)}`)
    
    if (hlAvailable < amount) {
      throw new Error(`HL 余额不足 (可用: $${hlAvailable.toFixed(2)}, 需要: $${amount})。请先在 Hyperliquid 充值 USDC`)
    }
    
    // 获取策略的总仓位值（龙头多头策略）
    let totalValue = new Decimal(100000) // 默认值
    
    if (strategyId === 'longtou') {
      // 获取最新快照（排除 totalValue 为 0 的旧数据）
      const latestSnapshot = await db.strategySnapshot.findFirst({
        where: { 
          strategyId,
          totalValue: { gt: 0 },
        },
        orderBy: { createdAt: 'desc' },
      })
      
      if (latestSnapshot && latestSnapshot.totalValue.gt(0)) {
        totalValue = latestSnapshot.totalValue
      }
    }
    
    // 计算跟单比例（防止除零）
    if (totalValue.isZero() || !totalValue.isFinite()) {
      throw new Error('策略暂无持仓数据，请稍后再试')
    }
    const ratio = new Decimal(amount).div(totalValue)
    
    // 检查是否已存在跟单
    const existingCopyTrade = await db.copyTrade.findFirst({
      where: {
        userId,
        strategyId,
        status: { in: ['active', 'paused'] },
      },
    })
    
    if (existingCopyTrade) {
      throw new Error('您已经跟单了此策略')
    }
    
    // 创建跟单记录
    const copyTrade = await db.copyTrade.create({
      data: {
        userId,
        strategyId,
        amount: new Decimal(amount),
        ratio,
        status: 'active',
      },
    })
    
    // 立即在用户 HL 上下单
    let syncStatus = 'pending'
    try {
      await this.executeInitialSync(hlPrivateKey, user.hlAddress, strategyId, amount, ratio)
      syncStatus = 'synced'
    } catch (syncErr: any) {
      console.error(`⚠️ Initial sync failed for copytrade ${copyTrade.id}:`, syncErr.message)
      syncStatus = 'sync_failed'
    }
    
    return {
      id: copyTrade.id,
      strategyId: copyTrade.strategyId,
      amount: copyTrade.amount.toString(),
      ratio: copyTrade.ratio.toString(),
      status: copyTrade.status,
      syncStatus,
      message: syncStatus === 'synced'
        ? '跟单成功！仓位已同步到您的 HL 账户，请在 Hyperliquid 查看'
        : '跟单已记录，但部分仓位下单失败，系统将在下次同步时重试',
    }
  },

  // 首次仓位同步 — 按策略持仓比例在用户 HL 账户下单
  // 支持: perps (标准永续), pre-launch (xyz: 预发行), spot (现货)
  async executeInitialSync(hlPrivateKey: string, hlAddress: string, strategyId: string, amount: number, ratio: Decimal) {
    const { Hyperliquid } = await import('hyperliquid')
    
    // 获取策略当前持仓
    const latestSnapshot = await db.strategySnapshot.findFirst({
      where: { strategyId, totalValue: { gt: 0 } },
      orderBy: { createdAt: 'desc' },
    })
    
    if (!latestSnapshot || !(latestSnapshot.positions as any[])?.length) {
      console.log(`📋 Strategy ${strategyId} has no positions, skip initial sync`)
      return
    }
    
    const positions = latestSnapshot.positions as any[]
    const orders = (latestSnapshot.orders as any[]) || []
    const sdk = new Hyperliquid({ privateKey: hlPrivateKey, walletAddress: hlAddress, enableWs: false })
    
    // === 防重复：获取用户当前 HL 持仓，跳过已持有的币种 ===
    const existingCoins = new Set<string>()
    try {
      // 获取 perps 持仓
      const perpsState = await fetch('https://api.hyperliquid.xyz/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'clearinghouseState', user: hlAddress }),
      }).then(r => r.json())
      for (const p of perpsState?.assetPositions || []) {
        const szi = parseFloat(p?.position?.szi || '0')
        if (szi !== 0) existingCoins.add(p.position.coin)
      }
      // 获取 spot 持仓
      const spotState = await fetch('https://api.hyperliquid.xyz/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'spotClearinghouseState', user: hlAddress }),
      }).then(r => r.json())
      for (const b of spotState?.balances || []) {
        const hold = parseFloat(b?.hold || '0')
        const total = parseFloat(b?.total || '0')
        if (total > 0 || hold > 0) {
          // spot token name (e.g., "GOOGL") — need to map from @index
          existingCoins.add(b.coin) // will be @266 etc
        }
      }
      console.log(`📦 User ${hlAddress.slice(0,8)} existing positions: [${[...existingCoins].join(', ')}]`)
    } catch (e: any) {
      console.log(`⚠️ Failed to get user positions, proceeding without dedup: ${e.message}`)
    }
    
    // 查找 userId 用于审计日志
    const logUser = await db.user.findFirst({ where: { hlAddress: hlAddress.toLowerCase() } })
    const logUserId = logUser?.id || 'unknown'
    
    // 获取所有市场价格（标准 perps + spot）
    let prices: Record<string, string> = {}
    try { prices = await sdk.info.getAllMids() } catch (e) { console.log('⚠️ Failed to get mids, using entry prices') }
    
    // 构建 coin → SDK coin name 映射
    // SDK 的 getAllMids 会把 @266 翻译成 GOOGL-SPOT 等
    const coinMap: Record<string, string> = {}
    for (const key of Object.keys(prices)) {
      if (key.endsWith('-SPOT')) {
        coinMap[key.replace('-SPOT', '')] = key // GOOGL -> GOOGL-SPOT
      } else {
        coinMap[key] = key // BTC -> BTC
      }
    }
    // 对于快照中标记了 sdkCoin 的持仓，也映射 SDK coin name
    // （来自 syncLongtouPositions 中 spotMeta 解析的 @266 等）
    
    console.log(`🔄 Syncing ${positions.length} positions + ${orders.length} orders for user ${hlAddress} (ratio: ${ratio.toString()}, amount: $${amount})`)
    
    // === 1. 复制持仓（实际下单）===
    for (const pos of positions) {
      try {
        const coin = pos.coin
        const market = pos.market || 'perps'
        
        // 解析 SDK 可用的 coin name
        const sdkCoin = coinMap[coin] || coin
        const hasMid = !!prices[sdkCoin]
        
        // 防重复：如果用户已持有这个币，跳过
        if (existingCoins.has(coin) || existingCoins.has(sdkCoin)) {
          console.log(`  ⏭️ Skip ${coin}: user already holds this position`)
          continue
        }
        
        // 获取价格: 先查实时价格，没有则用 entryPrice
        let currentPrice = parseFloat(prices[sdkCoin] || '0')
        if (currentPrice === 0) currentPrice = pos.entryPrice || pos.currentPrice || 0
        if (currentPrice === 0) {
          console.log(`  ⏭️ Skip ${coin}: no price available`)
          continue
        }
        
        // 按比例计算用户应持有的数量
        const strategySize = Math.abs(pos.size)
        let userSize = strategySize * ratio.toNumber()
        let userValue = userSize * currentPrice
        
        const isBuy = pos.direction === 'LONG'
        
        if (!hasMid) {
          console.log(`  ⚠️ Skip ${coin}: no active market (pre-launch may have ended)`)
          continue
        }
        
        // HL 最低下单金额: perps ~$10, spot ~$10
        const HL_MIN_NOTIONAL = 10
        if (userValue < HL_MIN_NOTIONAL) {
          // 自动提升到最低下单额（如果用户余额允许）
          if (amount >= HL_MIN_NOTIONAL) {
            const minSize = HL_MIN_NOTIONAL / currentPrice
            console.log(`  📏 ${coin}: $${userValue.toFixed(2)} < min $${HL_MIN_NOTIONAL}, bumping to ${minSize.toFixed(4)} ($${HL_MIN_NOTIONAL})`)
            userSize = minSize
            userValue = HL_MIN_NOTIONAL
          } else {
            console.log(`  ⏭️ Skip ${coin}: $${userValue.toFixed(2)} < min $${HL_MIN_NOTIONAL} and investment too small`)
            continue
          }
        }
        
        // 获取 szDecimals 并按精度四舍五入（向上取整确保过最低限额）
        const szDecimals = sdkCoin.endsWith('-SPOT') ? 2 : 5
        let roundedSize = parseFloat(userSize.toFixed(szDecimals))
        // 如果向下取整后不够最低限额，向上取整
        if (roundedSize * currentPrice < HL_MIN_NOTIONAL && userValue >= HL_MIN_NOTIONAL) {
          const step = Math.pow(10, -szDecimals)
          roundedSize = parseFloat((roundedSize + step).toFixed(szDecimals))
        }
        if (roundedSize === 0) {
          console.log(`  ⏭️ Skip ${coin}: rounded size is 0`)
          continue
        }
        
        // 下单 + 记录审计日志
        const limitPrice = market === 'perps'
          ? parseFloat((isBuy ? currentPrice * 1.005 : currentPrice * 0.995).toPrecision(6))
          : parseFloat((Math.ceil(currentPrice) + 1).toString()) // spot: 整数价 +1 确保成交
        
        if (market === 'perps') {
          await sdk.exchange.updateLeverage(3, sdkCoin, false).catch(() => {})
        }
        
        const orderResult = await sdk.exchange.placeOrder({
          coin: sdkCoin,
          is_buy: isBuy,
          sz: roundedSize,
          limit_px: limitPrice,
          order_type: { limit: { tif: market === 'perps' ? 'Ioc' : 'Gtc' } },
          reduce_only: false,
        })
        
        // 解析结果
        const status0 = (orderResult as any)?.response?.data?.statuses?.[0]
        const filled = status0?.filled
        const rejected = status0?.error
        
        // 写入 TradeLog
        await db.tradeLog.create({
          data: {
            userId: logUserId, // 用 HL 地址作为关联（后续可改为 userId）
            trigger: 'initial_sync',
            coin: sdkCoin,
            market,
            side: isBuy ? 'BUY' : 'SELL',
            requestedSz: roundedSize,
            requestedPx: limitPrice,
            filledSz: filled ? parseFloat(filled.totalSz) : null,
            filledPx: filled ? parseFloat(filled.avgPx) : null,
            hlOid: filled?.oid?.toString() || null,
            status: filled ? 'filled' : rejected ? 'rejected' : 'error',
            errorMsg: rejected || null,
            hlResponse: orderResult as any,
            ratioUsed: ratio.toNumber(),
          }
        }).catch(e => console.error('TradeLog write failed:', e.message))
        
        if (filled) {
          console.log(`  ✅ [${market}] ${isBuy ? 'BUY' : 'SELL'} ${sdkCoin} x${filled.totalSz} @ $${filled.avgPx} (oid: ${filled.oid})`)
        } else if (rejected) {
          console.log(`  ⚠️ [${market}] ${sdkCoin} rejected: ${rejected}`)
        }
      } catch (err: any) {
        console.error(`  ❌ Failed to place order for ${pos.coin}:`, err.message)
        // 记录失败日志
        await db.tradeLog.create({
          data: {
            userId: logUserId,
            trigger: 'initial_sync',
            coin: pos.coin,
            market: pos.market || 'unknown',
            side: pos.direction === 'LONG' ? 'BUY' : 'SELL',
            requestedSz: roundedSize || 0,
            requestedPx: currentPrice || 0,
            status: 'error',
            errorMsg: err.message,
            ratioUsed: ratio.toNumber(),
          }
        }).catch(() => {})
      }
    }
    
    // === 2. 复制挂单（策略的未成交挂单）===
    const positionCoins = new Set(positions.map((p: any) => p.coin))
    for (const order of orders) {
      try {
        if (positionCoins.has(order.coin)) continue
        
        const coin = order.coin
        const sdkCoin = coinMap[coin] || coin
        if (!prices[sdkCoin]) {
          console.log(`  ⚠️ Skip pending ${coin}: no active market`)
          continue
        }
        
        const isBuy = order.side === 'BUY'
        const strategySize = Math.abs(order.size)
        const userSize = strategySize * ratio.toNumber()
        const userValue = userSize * order.price
        
        if (userValue < 0.10) continue
        
        const szDecimals = sdkCoin.endsWith('-SPOT') ? 2 : 5
        const roundedSize = parseFloat(userSize.toFixed(szDecimals))
        if (roundedSize === 0) continue
        
        await sdk.exchange.placeOrder({
          coin: sdkCoin,
          is_buy: isBuy,
          sz: roundedSize,
          limit_px: parseFloat(order.price.toPrecision(6)),
          order_type: { limit: { tif: 'Gtc' } },
          reduce_only: false,
        })
        console.log(`  ✅ [pending] ${isBuy ? 'BUY' : 'SELL'} ${sdkCoin} x${roundedSize} @ $${order.price.toFixed(2)} (GTC)`)
      } catch (err: any) {
        console.error(`  ❌ Failed to place pending order for ${order.coin}:`, err.message)
      }
    }
    
    console.log(`✅ Initial sync completed for strategy ${strategyId}`)
  },

  // 获取用户的跟单仓位
  async getUserCopyTradePositions(userId: string) {
    const copyTrades = await db.copyTrade.findMany({
      where: {
        userId,
        status: { in: ['active', 'paused'] },
      },
    })
    
    const positions = await Promise.all(
      copyTrades.map(async (ct) => {
        // 获取最新快照
        const latestSnapshot = await db.strategySnapshot.findFirst({
          where: { strategyId: ct.strategyId },
          orderBy: { createdAt: 'desc' },
        })
        
        if (!latestSnapshot) {
          return {
            id: ct.id,
            strategyId: ct.strategyId,
            invested: ct.amount.toString(),
            current: ct.amount.toString(),
            pnl: '0',
            pnlPct: '0',
            status: ct.status,
            positions: [],
          }
        }
        
        // 根据比例计算用户的仓位
        const ratio = ct.ratio
        const snapshotTotalValue = latestSnapshot.totalValue.toNumber()
        const positions = (latestSnapshot.positions as any[]).map((pos: any) => ({
          ...pos,
          size: new Decimal(pos.size).mul(ratio).toNumber(),
          value: new Decimal(pos.value).mul(ratio).toNumber(),
          pnl: new Decimal(pos.pnl || 0).mul(ratio).toNumber(),
        }))
        
        // currentValue = 用户按比例的策略总价值（包含 USDC 现金部分）
        const currentValue = new Decimal(snapshotTotalValue).mul(ratio).toNumber()
        const invested = ct.amount.toNumber()
        // PnL = 当前价值 - 投入金额
        const totalPnl = currentValue - invested
        const pnlPct = invested !== 0 ? (totalPnl / invested) * 100 : 0
        
        return {
          id: ct.id,
          strategyId: ct.strategyId,
          invested: ct.amount.toString(),
          current: currentValue.toFixed(2),
          pnl: totalPnl.toFixed(2),
          pnlPct: pnlPct.toFixed(2),
          status: ct.status,
          positions,
        }
      })
    )
    
    return positions
  },

  // 暂停跟单
  async pauseCopyTrade(id: string, userId: string) {
    const copyTrade = await db.copyTrade.findFirst({
      where: { id, userId },
    })
    
    if (!copyTrade) throw new Error('跟单记录不存在')
    if (copyTrade.status !== 'active') throw new Error('只能暂停活跃的跟单')
    
    return db.copyTrade.update({
      where: { id },
      data: { status: 'paused' },
    })
  },

  // 恢复跟单
  async resumeCopyTrade(id: string, userId: string) {
    const copyTrade = await db.copyTrade.findFirst({
      where: { id, userId },
    })
    
    if (!copyTrade) throw new Error('跟单记录不存在')
    if (copyTrade.status !== 'paused') throw new Error('只能恢复暂停的跟单')
    
    return db.copyTrade.update({
      where: { id },
      data: { status: 'active' },
    })
  },

  // 停止跟单
  async stopCopyTrade(id: string, userId: string) {
    const copyTrade = await db.copyTrade.findFirst({
      where: { id, userId },
    })
    
    if (!copyTrade) throw new Error('跟单记录不存在')
    if (copyTrade.status === 'stopped') throw new Error('跟单已停止')
    
    // 路径A: 资金在用户自己 HL 上，停止跟单只需要标记状态
    // TODO: 可选 — 自动平掉用户 HL 上的跟单仓位
    console.log(`🛑 Stopping copytrade ${id} for user ${userId}. User's HL positions remain open — user can manually close on HL.`)
    
    return db.copyTrade.update({
      where: { id },
      data: { status: 'stopped' },
    })
  },

  // 查询用户 HL 完整余额（Perps + Spot）
  async getHLBalance(hlAddress: string) {
    const { Hyperliquid } = await import('hyperliquid')
    const sdk = new Hyperliquid({ enableWs: false })
    
    const [perpsState, spotState] = await Promise.all([
      sdk.info.perpetuals.getClearinghouseState(hlAddress),
      sdk.info.spot.getSpotClearinghouseState(hlAddress),
    ])
    
    const perpsValue = parseFloat(perpsState.marginSummary?.accountValue || '0')
    const perpsWithdrawable = parseFloat(perpsState.withdrawable || '0')
    
    // Spot USDC 余额
    const usdcSpot = spotState.balances?.find((b: any) => b.coin === 'USDC-SPOT')
    const spotUsdcTotal = usdcSpot ? parseFloat(usdcSpot.total || '0') : 0
    const spotUsdcAvailable = usdcSpot ? parseFloat(usdcSpot.total || '0') - parseFloat(usdcSpot.hold || '0') : 0
    
    // Spot 其他代币持仓
    const spotPositions = (spotState.balances || [])
      .filter((b: any) => b.coin !== 'USDC-SPOT' && parseFloat(b.total || '0') > 0)
      .map((b: any) => ({
        coin: b.coin.replace('-SPOT', ''),
        total: parseFloat(b.total || '0'),
        hold: parseFloat(b.hold || '0'),
      }))
    
    return {
      perps: {
        accountValue: perpsValue,
        withdrawable: perpsWithdrawable,
        positions: perpsState.assetPositions || [],
      },
      spot: {
        usdcTotal: spotUsdcTotal,
        usdcAvailable: spotUsdcAvailable,
        positions: spotPositions,
      },
      totalValue: perpsValue + spotUsdcTotal,
      totalAvailable: perpsWithdrawable + spotUsdcAvailable,
    }
  },

  // 通过 HL REST API 直接查询（避免 SDK rate limit 问题）
  async hlApiPost(type: string, params: Record<string, any> = {}) {
    const https = await import('https')
    return new Promise<any>((resolve, reject) => {
      const body = JSON.stringify({ type, ...params })
      const req = https.request({
        hostname: 'api.hyperliquid.xyz',
        path: '/info',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, res => {
        let data = ''
        res.on('data', (c: string) => data += c)
        res.on('end', () => {
          try { resolve(JSON.parse(data)) } catch { resolve(data) }
        })
      })
      req.on('error', reject)
      req.write(body)
      req.end()
    })
  },

  // 同步龙头多头策略的仓位（定时任务）— Perps + Spot + Pre-launch (xyz:)
  async syncLongtouPositions() {
    const JINMING_ADDRESS = '0x29c89eC30a43c8d12b6BD4E99d3D6E5CBf1AEb28'
    
    try {
      const [perpsState, spotState, historicalOrders, prices] = await Promise.all([
        this.hlApiPost('clearinghouseState', { user: JINMING_ADDRESS }),
        this.hlApiPost('spotClearinghouseState', { user: JINMING_ADDRESS }),
        this.hlApiPost('historicalOrders', { user: JINMING_ADDRESS }),
        this.hlApiPost('allMids'),
      ])
      
      // === 1. Perps 持仓 ===
      const perpsPositions = (perpsState.assetPositions || []).map((pos: any) => {
        const p = pos.position
        const coin = p.coin
        const currentPrice = parseFloat(prices[coin] || 0)
        const entryPrice = parseFloat(p.entryPx || 0)
        const size = parseFloat(p.szi || 0)
        const pnl = parseFloat(p.unrealizedPnl || 0)
        const value = Math.abs(size * currentPrice)
        
        return {
          coin,
          market: 'perps',
          direction: size > 0 ? 'LONG' : 'SHORT',
          size: Math.abs(size),
          entryPrice,
          currentPrice,
          pnl,
          pnlPct: entryPrice !== 0 ? (pnl / Math.abs(size * entryPrice)) * 100 : 0,
          value,
        }
      })
      
      // === 2. Pre-launch (xyz:) 持仓 — 通过 historicalOrders 中 status=open 的 filled 订单 ===
      const xyzPositions: any[] = []
      const xyzOrders: any[] = []
      
      if (Array.isArray(historicalOrders)) {
        // 收集所有 xyz: 开头的订单
        for (const item of historicalOrders) {
          const order = item.order || item
          const coin = order.coin || ''
          
          if (!coin.startsWith('xyz:')) continue
          
          const displayCoin = coin.replace('xyz:', '')
          const sz = parseFloat(order.sz || '0')
          const limitPx = parseFloat(order.limitPx || '0')
          const side = order.side // 'B' = buy, 'A' = sell
          
          if (item.status === 'open' && sz > 0) {
            // 有持仓的 open 订单 = 活跃持仓
            const isBuy = side === 'B'
            const value = sz * limitPx
            
            xyzPositions.push({
              coin: displayCoin,
              market: 'pre-launch',
              direction: isBuy ? 'LONG' : 'SHORT',
              size: sz,
              entryPrice: limitPx,
              currentPrice: limitPx, // pre-launch 用限价作为当前参考价
              pnl: 0, // pre-launch 无实时价格，暂时 0
              pnlPct: 0,
              value,
            })
          }
          
          // 未成交的挂单（sz > 0 且 status === open 且有 limitPx）
          if (item.status === 'open' && sz > 0) {
            xyzOrders.push({
              coin: displayCoin,
              side: side === 'B' ? 'BUY' : 'SELL',
              size: sz,
              price: limitPx,
              status: 'open',
            })
          }
        }
      }
      
      // 去重：同一个 coin 可能有多条记录，合并
      const xyzByCoins = new Map<string, any>()
      for (const pos of xyzPositions) {
        const existing = xyzByCoins.get(pos.coin)
        if (existing) {
          existing.size += pos.size
          existing.value += pos.value
        } else {
          xyzByCoins.set(pos.coin, { ...pos })
        }
      }
      const mergedXyzPositions = Array.from(xyzByCoins.values())
      
      // === 3. Spot 持仓（非 USDC 代币）===
      const spotPositions = (spotState.balances || [])
        .filter((b: any) => !b.coin?.includes('USD') && parseFloat(b.total || '0') > 0)
        .map((b: any) => {
          const coin = b.coin?.replace('-SPOT', '') || b.coin
          const size = parseFloat(b.total || '0')
          const currentPrice = parseFloat(prices[coin] || 0)
          const value = size * currentPrice
          const entryNtl = parseFloat(b.entryNtl || '0')
          const pnl = entryNtl > 0 ? value - entryNtl : 0
          
          return {
            coin,
            market: 'spot',
            direction: 'LONG' as const,
            size,
            entryPrice: entryNtl > 0 ? entryNtl / size : currentPrice,
            currentPrice,
            pnl,
            pnlPct: entryNtl > 0 ? (pnl / entryNtl) * 100 : 0,
            value,
          }
        })
      
      // === 构建 coin → 实时价格映射（含 spot @index 映射）===
      // allMids 用 @index 格式返回 spot 价格，需要查 spotMeta 映射回 coin name
      let spotMeta: any = null
      try { spotMeta = await this.hlApiPost('spotMeta') } catch {}
      
      const coinToPairPrice: Record<string, { mid: number; pairName: string }> = {}
      if (spotMeta?.tokens && spotMeta?.universe) {
        const tokenMap = new Map<number, string>()
        for (const t of spotMeta.tokens) tokenMap.set(t.index, t.name)
        for (const pair of spotMeta.universe) {
          if (pair.tokens?.length >= 2) {
            const baseToken = tokenMap.get(pair.tokens[0])
            const pairName = pair.name // e.g. "@266"
            const mid = parseFloat(prices[pairName] || '0')
            if (baseToken && mid > 0) {
              coinToPairPrice[baseToken] = { mid, pairName }
            }
          }
        }
      }
      
      // 标记每个持仓是否可交易
      const markTradeable = (pos: any) => {
        const coin = pos.coin
        const hasMid = !!(prices[coin] || coinToPairPrice[coin])
        // 如果有 spot 价格，更新 currentPrice
        if (coinToPairPrice[coin] && !prices[coin]) {
          pos.currentPrice = coinToPairPrice[coin].mid
          pos.value = pos.size * coinToPairPrice[coin].mid
        }
        return { ...pos, tradeable: hasMid, sdkCoin: coinToPairPrice[coin]?.pairName }
      }
      
      const allPositions = [
        ...perpsPositions.map(markTradeable),
        ...mergedXyzPositions.map(markTradeable),
        ...spotPositions.map(markTradeable),
      ]
      
      const totalValue = allPositions.reduce((sum: number, p: any) => sum + p.value, 0)
      const tradeableValue = allPositions.filter((p: any) => p.tradeable).reduce((sum: number, p: any) => sum + p.value, 0)
      
      // Spot USDC 余额
      const usdcBalance = spotState.balances?.find((b: any) => b.coin === 'USDC')
      const spotUsdc = usdcBalance ? parseFloat(usdcBalance.total || '0') : 0
      
      // 存储快照 — totalValue 只计算可交易部分 + USDC
      await db.strategySnapshot.create({
        data: {
          strategyId: 'longtou',
          positions: allPositions,
          orders: xyzOrders,
          totalValue: new Decimal(tradeableValue + spotUsdc),
        }
      })
      
      const tradeableCount = allPositions.filter((p: any) => p.tradeable).length
      const inactiveCount = allPositions.length - tradeableCount
      console.log(`✅ Synced Longtou: ${allPositions.length} positions (${tradeableCount} tradeable, ${inactiveCount} inactive) | ${xyzOrders.length} orders | tradeable value: $${(tradeableValue + spotUsdc).toFixed(2)}`)
      allPositions.forEach(p => console.log(`  ${p.tradeable ? '📈' : '💤'} ${p.coin}: ${p.size} @ $${p.entryPrice} (${p.direction}) ${!p.tradeable ? '[inactive]' : ''}`))
      
      return { positions: allPositions, orders: xyzOrders, totalValue: tradeableValue + spotUsdc }
    } catch (error) {
      console.error('Failed to sync Longtou positions:', error)
      throw error
    }
  },

  // ============================================================
  // 增量同步系统：一次 API 查策略，发现变化后批量通知所有跟随者
  // ============================================================
  
  _lastSyncHash: '' as string, // 上次同步的持仓 hash（内存中）
  
  // 计算持仓指纹（用于检测变化）
  _positionHash(positions: any[], orders: any[]): string {
    const key = positions.map(p => `${p.coin}:${p.size}:${p.direction}`).sort().join('|')
      + '||' + orders.map(o => `${o.coin}:${o.size}:${o.price}`).sort().join('|')
    return key
  },

  // 增量同步定时任务（建议每 10-30 分钟调用一次）
  // 架构：1次 API 调用查策略 → 比对变化 → 有变化时批量通知 N 个 follower
  // 成本：O(1) API 调用 + O(N) DB 查询（仅在有变化时）
  async incrementalSync() {
    try {
      // Step 1: 同步策略持仓（1次 API 批量调用）
      const result = await this.syncLongtouPositions()
      
      // Step 2: 检测变化
      const currentHash = this._positionHash(result.positions, result.orders || [])
      if (currentHash === this._lastSyncHash) {
        console.log('📊 No position changes detected, skip follower sync')
        return { changed: false }
      }
      this._lastSyncHash = currentHash
      console.log('🔔 Position change detected! Syncing all followers...')
      
      // Step 3: 找到所有活跃跟单用户
      const activeCopyTrades = await db.copyTrade.findMany({
        where: { strategyId: 'longtou', status: 'active' },
        include: { user: true },
      })
      
      if (activeCopyTrades.length === 0) {
        console.log('📊 No active followers, skip')
        return { changed: true, followers: 0 }
      }
      
      console.log(`🔄 Syncing ${activeCopyTrades.length} followers...`)
      
      // Step 4: 对每个跟随者执行增量下单
      const results = await Promise.allSettled(
        activeCopyTrades.map(async (ct) => {
          const user = (ct as any).user
          if (!user?.hlApiKey || !user?.hlAddress) return { userId: ct.userId, status: 'no_hl' }
          
          try {
            // 解密私钥
            const crypto = await import('crypto')
            const rawKey = process.env.ENCRYPTION_KEY || 'default-key-for-dev'
            const key = crypto.createHash('sha256').update(rawKey).digest()
            const [ivHex, encHex] = user.hlApiKey.split(':')
            const iv = Buffer.from(ivHex, 'hex')
            const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv)
            let hlPrivateKey = decipher.update(encHex, 'hex', 'utf8')
            hlPrivateKey += decipher.final('utf8')
            
            await this.executeInitialSync(hlPrivateKey, user.hlAddress, ct.strategyId, ct.amount.toNumber(), ct.ratio)
            return { userId: ct.userId, status: 'synced' }
          } catch (err: any) {
            return { userId: ct.userId, status: 'error', error: err.message }
          }
        })
      )
      
      const synced = results.filter(r => r.status === 'fulfilled' && (r.value as any).status === 'synced').length
      const errors = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && (r.value as any).status === 'error')).length
      console.log(`✅ Follower sync complete: ${synced} synced, ${errors} errors, ${activeCopyTrades.length} total`)
      
      return { changed: true, followers: activeCopyTrades.length, synced, errors }
    } catch (error) {
      console.error('Incremental sync failed:', error)
      throw error
    }
  },
}
