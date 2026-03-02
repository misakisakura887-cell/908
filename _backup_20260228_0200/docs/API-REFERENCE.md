# Mirror-AI API 参考文档

> 版本：v1.0  
> Base URL: `https://api.mirror-ai.com`  
> 认证：JWT Bearer Token

---

## 认证 (Authentication)

### POST /api/auth/nonce
获取签名用的 nonce

**请求：**
```json
{
  "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f4a8f"
}
```

**响应：**
```json
{
  "nonce": "abc123def456"
}
```

---

### POST /api/auth/verify
验证签名并登录

**请求：**
```json
{
  "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f4a8f",
  "signature": "0x...",
  "message": "Sign in to Mirror-AI\nNonce: abc123def456\nTimestamp: 1707900000000"
}
```

**响应：**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-xxx",
    "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f4a8f"
  }
}
```

---

## 策略 (Strategies)

### GET /api/strategies
获取策略列表

**查询参数：**
- `type` (可选): `gold_quant` | `btc_quant` | `leader_subjective` | `leader_quant`
- `riskLevel` (可选): `1` | `2` | `3`
- `limit` (可选): 默认 10
- `offset` (可选): 默认 0

**响应：**
```json
{
  "strategies": [
    {
      "id": "uuid-xxx",
      "name": "黄金量化策略",
      "description": "基于微软开源模型...",
      "strategyType": "gold_quant",
      "assetClass": "commodity",
      "riskLevel": 1,
      "totalReturn": 34.12,
      "sharpeRatio": 1.82,
      "maxDrawdown": -5.2,
      "winRate": 68.3,
      "totalAum": 234567.89,
      "followerCount": 342,
      "isActive": true
    }
  ],
  "total": 3
}
```

---

### GET /api/strategies/:id
获取策略详情

**响应：**
```json
{
  "strategy": {
    "id": "uuid-xxx",
    "name": "黄金量化策略",
    "...": "..."
  },
  "performanceHistory": [
    {
      "date": "2026-02-14",
      "dailyReturn": 0.82,
      "cumulativeReturn": 34.12,
      "aum": 234567.89
    }
  ],
  "recentTrades": [
    {
      "id": "uuid-xxx",
      "symbol": "XAUUSD",
      "side": "BUY",
      "quantity": 10.5,
      "price": 2031.45,
      "executedAt": "2026-02-14T10:32:15Z"
    }
  ]
}
```

---

## 投资 (Investments)

### POST /api/invest
投资到策略

**Headers:**
```
Authorization: Bearer <token>
```

**请求：**
```json
{
  "strategyId": "uuid-xxx",
  "amount": 500
}
```

**响应：**
```json
{
  "success": true,
  "positionId": "uuid-yyy",
  "txHash": "0x..."
}
```

**错误码：**
- `400`: `INVALID_AMOUNT` - 金额必须 ≥ 1
- `404`: `STRATEGY_NOT_FOUND` - 策略不存在
- `401`: `UNAUTHORIZED` - 未登录

---

### POST /api/redeem
赎回

**Headers:**
```
Authorization: Bearer <token>
```

**请求：**
```json
{
  "positionId": "uuid-yyy",
  "amount": 100  // 可选，不传则全部赎回
}
```

**响应：**
```json
{
  "success": true,
  "redeemedAmount": 108.50,
  "txHash": "0x..."
}
```

---

## 用户 (User)

### GET /api/user/portfolio
获取投资组合

**Headers:**
```
Authorization: Bearer <token>
```

**响应：**
```json
{
  "totalValue": 5234.56,
  "totalInvested": 4500.00,
  "totalPnl": 734.56,
  "totalPnlPercent": 16.33,
  "positions": [
    {
      "id": "uuid-xxx",
      "strategyId": "uuid-yyy",
      "strategyName": "黄金量化策略",
      "investedAmount": 2000,
      "currentValue": 2246,
      "unrealizedPnl": 246,
      "unrealizedPnlPercent": 12.3,
      "entryTime": "2026-02-01T10:00:00Z",
      "lastUpdate": "2026-02-14T23:15:00Z"
    }
  ]
}
```

---

### GET /api/user/trades
获取交易记录

**Headers:**
```
Authorization: Bearer <token>
```

**查询参数：**
- `limit` (可选): 默认 50
- `offset` (可选): 默认 0
- `strategyId` (可选): 筛选特定策略

**响应：**
```json
{
  "trades": [
    {
      "id": "uuid-xxx",
      "strategyName": "黄金量化策略",
      "symbol": "XAUUSD",
      "side": "BUY",
      "quantity": 10.5,
      "price": 2031.45,
      "fee": 5.08,
      "executedAt": "2026-02-14T10:32:15Z"
    }
  ],
  "total": 47
}
```

---

## WebSocket 事件

### 连接
```javascript
const socket = io('wss://api.mirror-ai.com', {
  auth: { token: 'Bearer <token>' }
});
```

### 订阅事件

#### 订阅投资组合
```javascript
socket.emit('subscribe:portfolio');

socket.on('portfolio:update', (data) => {
  // data: { totalValue, totalPnl, positions: [...] }
});
```

#### 订阅策略
```javascript
socket.emit('subscribe:strategy', { strategyId: 'uuid-xxx' });

socket.on('strategy:update', (data) => {
  // data: { strategyId, totalReturn, aum, ... }
});
```

#### 交易通知
```javascript
socket.on('trade:notification', (data) => {
  // data: { 
  //   strategyName, 
  //   action: 'BUY'|'SELL', 
  //   symbol, 
  //   price, 
  //   quantity 
  // }
});
```

---

## 错误格式

所有错误响应统一格式：

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "人类可读的错误信息",
    "details": {}  // 可选，额外信息
  }
}
```

**常见错误码：**
- `UNAUTHORIZED` (401): 未登录或 token 过期
- `FORBIDDEN` (403): 无权限
- `NOT_FOUND` (404): 资源不存在
- `INVALID_INPUT` (400): 输入参数错误
- `INSUFFICIENT_BALANCE` (400): 余额不足
- `INTERNAL_ERROR` (500): 服务器错误

---

## 速率限制

| 端点类型 | 限制 | 窗口 |
|----------|------|------|
| 公开端点 | 100 req/min | 每 IP |
| 认证端点 | 300 req/min | 每用户 |
| 交易端点 | 10 req/min | 每用户 |

超限返回：
```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests",
    "retryAfter": 60
  }
}
```

---

*文档版本：v1.0*  
*最后更新：2026-02-14*
