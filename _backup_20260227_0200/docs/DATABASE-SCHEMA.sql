-- Mirror-AI 数据库 Schema
-- PostgreSQL 16+
-- 创建日期：2026-02-14

-- ========================================
-- 1. 用户表
-- ========================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address VARCHAR(42) UNIQUE NOT NULL,
  nonce VARCHAR(64) NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  created_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP,
  
  CONSTRAINT chk_wallet_format CHECK (wallet_address ~ '^0x[a-fA-F0-9]{40}$')
);

CREATE INDEX idx_users_wallet ON users(wallet_address);
CREATE INDEX idx_users_created ON users(created_at DESC);

COMMENT ON TABLE users IS '用户表：存储钱包地址和认证信息';
COMMENT ON COLUMN users.nonce IS '用于签名验证的随机数，每次登录刷新';

-- ========================================
-- 2. 策略表
-- ========================================
CREATE TABLE strategies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  strategy_type VARCHAR(50) NOT NULL,
  asset_class VARCHAR(50) NOT NULL,
  risk_level INT NOT NULL CHECK (risk_level BETWEEN 1 AND 3),
  
  -- 托管地址
  custody_address VARCHAR(42),
  
  -- 性能指标
  total_return DECIMAL(10, 4) DEFAULT 0,
  sharpe_ratio DECIMAL(10, 4),
  max_drawdown DECIMAL(10, 4),
  win_rate DECIMAL(5, 2),
  
  -- 资金信息
  total_aum DECIMAL(20, 2) DEFAULT 0,
  follower_count INT DEFAULT 0,
  
  -- 状态
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT chk_strategy_type CHECK (strategy_type IN (
    'gold_quant', 'btc_quant', 'leader_subjective', 'leader_quant'
  )),
  CONSTRAINT chk_asset_class CHECK (asset_class IN (
    'crypto', 'stock', 'commodity', 'mixed'
  ))
);

CREATE INDEX idx_strategies_type ON strategies(strategy_type);
CREATE INDEX idx_strategies_active ON strategies(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_strategies_aum ON strategies(total_aum DESC);

COMMENT ON TABLE strategies IS '策略表：存储所有量化策略信息';
COMMENT ON COLUMN strategies.risk_level IS '风险等级：1=低, 2=中, 3=高';
COMMENT ON COLUMN strategies.total_aum IS '总锁仓金额（Assets Under Management）';

-- ========================================
-- 3. 用户仓位表
-- ========================================
CREATE TABLE user_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  strategy_id UUID NOT NULL REFERENCES strategies(id) ON DELETE CASCADE,
  
  -- 资金信息
  invested_amount DECIMAL(20, 2) NOT NULL CHECK (invested_amount >= 1),
  current_value DECIMAL(20, 2) NOT NULL,
  
  -- 盈亏
  realized_pnl DECIMAL(20, 2) DEFAULT 0,
  unrealized_pnl DECIMAL(20, 2) DEFAULT 0,
  
  -- 时间
  entry_time TIMESTAMP DEFAULT NOW(),
  last_update TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT uq_user_strategy UNIQUE (user_id, strategy_id)
);

CREATE INDEX idx_positions_user ON user_positions(user_id);
CREATE INDEX idx_positions_strategy ON user_positions(strategy_id);
CREATE INDEX idx_positions_update ON user_positions(last_update DESC);

COMMENT ON TABLE user_positions IS '用户仓位表：记录用户在各策略的投资情况';
COMMENT ON COLUMN user_positions.invested_amount IS '用户投入金额（累计）';
COMMENT ON COLUMN user_positions.current_value IS '当前市值';

-- ========================================
-- 4. 交易记录表
-- ========================================
CREATE TABLE trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_id UUID NOT NULL REFERENCES strategies(id) ON DELETE CASCADE,
  
  -- 交易信息
  symbol VARCHAR(20) NOT NULL,
  side VARCHAR(4) NOT NULL CHECK (side IN ('BUY', 'SELL')),
  quantity DECIMAL(20, 8) NOT NULL CHECK (quantity > 0),
  price DECIMAL(20, 8) NOT NULL CHECK (price > 0),
  
  -- 订单信息
  order_id VARCHAR(100),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'filled', 'cancelled', 'failed')),
  
  -- 费用
  fee DECIMAL(20, 8) DEFAULT 0,
  
  -- 时间
  executed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT chk_executed_status CHECK (
    (status = 'filled' AND executed_at IS NOT NULL) OR
    (status != 'filled')
  )
);

CREATE INDEX idx_trades_strategy ON trades(strategy_id);
CREATE INDEX idx_trades_symbol ON trades(symbol);
CREATE INDEX idx_trades_time ON trades(executed_at DESC) WHERE executed_at IS NOT NULL;
CREATE INDEX idx_trades_status ON trades(status) WHERE status = 'pending';

COMMENT ON TABLE trades IS '交易记录表：记录所有策略的交易行为';
COMMENT ON COLUMN trades.order_id IS 'Hyperliquid 订单 ID';

-- ========================================
-- 5. 策略表现历史
-- ========================================
CREATE TABLE strategy_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_id UUID NOT NULL REFERENCES strategies(id) ON DELETE CASCADE,
  
  -- 日期和收益
  date DATE NOT NULL,
  daily_return DECIMAL(10, 4),
  cumulative_return DECIMAL(10, 4),
  
  -- 资金快照
  aum DECIMAL(20, 2),
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT uq_strategy_date UNIQUE (strategy_id, date)
);

CREATE INDEX idx_performance_strategy ON strategy_performance(strategy_id, date DESC);

COMMENT ON TABLE strategy_performance IS '策略历史表现：每日快照';
COMMENT ON COLUMN strategy_performance.daily_return IS '日收益率（百分比）';
COMMENT ON COLUMN strategy_performance.cumulative_return IS '累计收益率（百分比）';

-- ========================================
-- 6. 交易通知表（用户订阅）
-- ========================================
CREATE TABLE user_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- 通知内容
  type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  
  -- 关联
  related_strategy_id UUID REFERENCES strategies(id) ON DELETE SET NULL,
  related_trade_id UUID REFERENCES trades(id) ON DELETE SET NULL,
  
  -- 状态
  is_read BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT chk_notification_type CHECK (type IN (
    'trade_executed', 'profit_alert', 'loss_alert', 'system'
  ))
);

CREATE INDEX idx_notifications_user ON user_notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON user_notifications(user_id, is_read) WHERE is_read = FALSE;

COMMENT ON TABLE user_notifications IS '用户通知表：交易通知、收益提醒等';

-- ========================================
-- 7. 审计日志表
-- ========================================
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- 操作信息
  action VARCHAR(50) NOT NULL,
  resource VARCHAR(50) NOT NULL,
  resource_id UUID,
  
  -- 详情
  details JSONB,
  
  -- 请求信息
  ip_address INET,
  user_agent TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT chk_audit_action CHECK (action IN (
    'LOGIN', 'INVEST', 'REDEEM', 'STRATEGY_CREATE', 'STRATEGY_UPDATE'
  ))
);

CREATE INDEX idx_audit_user ON audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_action ON audit_logs(action, created_at DESC);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);

COMMENT ON TABLE audit_logs IS '审计日志：记录所有敏感操作';

-- ========================================
-- 8. 会话表（JWT 黑名单）
-- ========================================
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(64) NOT NULL,
  
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  revoked_at TIMESTAMP,
  
  CONSTRAINT chk_session_expired CHECK (
    revoked_at IS NULL OR revoked_at <= expires_at
  )
);

CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_hash ON sessions(token_hash) WHERE revoked_at IS NULL;
CREATE INDEX idx_sessions_expiry ON sessions(expires_at) WHERE revoked_at IS NULL;

COMMENT ON TABLE sessions IS '会话表：用于 JWT 管理和撤销';

-- ========================================
-- 9. 视图：用户投资组合
-- ========================================
CREATE OR REPLACE VIEW v_user_portfolio AS
SELECT 
  u.id AS user_id,
  u.wallet_address,
  COALESCE(SUM(up.invested_amount), 0) AS total_invested,
  COALESCE(SUM(up.current_value), 0) AS total_value,
  COALESCE(SUM(up.unrealized_pnl), 0) AS total_pnl,
  CASE 
    WHEN SUM(up.invested_amount) > 0 
    THEN (SUM(up.unrealized_pnl) / SUM(up.invested_amount)) * 100
    ELSE 0
  END AS total_pnl_percent
FROM users u
LEFT JOIN user_positions up ON u.id = up.user_id
GROUP BY u.id, u.wallet_address;

COMMENT ON VIEW v_user_portfolio IS '用户投资组合视图：汇总统计';

-- ========================================
-- 10. 触发器：自动更新 updated_at
-- ========================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_strategies_updated
  BEFORE UPDATE ON strategies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ========================================
-- 11. 触发器：自动计算未实现盈亏
-- ========================================
CREATE OR REPLACE FUNCTION calculate_unrealized_pnl()
RETURNS TRIGGER AS $$
BEGIN
  NEW.unrealized_pnl = NEW.current_value - NEW.invested_amount;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_positions_pnl
  BEFORE INSERT OR UPDATE ON user_positions
  FOR EACH ROW
  EXECUTE FUNCTION calculate_unrealized_pnl();

-- ========================================
-- 12. 初始数据：创建默认策略
-- ========================================
INSERT INTO strategies (
  name, 
  description, 
  strategy_type, 
  asset_class, 
  risk_level,
  custody_address
) VALUES
  (
    '黄金量化策略',
    '基于微软开源模型的黄金量化交易策略，使用双均线系统自动捕捉趋势。适合稳健型投资者。',
    'gold_quant',
    'commodity',
    1,
    '0x0000000000000000000000000000000000000001'
  ),
  (
    'BTC 量化策略',
    '复用黄金策略逻辑，针对 BTC 高波动性优化。适合加密货币玩家。',
    'btc_quant',
    'crypto',
    2,
    '0x0000000000000000000000000000000000000002'
  ),
  (
    '龙头主观策略',
    '跟单见崎的主观策略，涵盖美股 AI 板块、BTC、黄金等多种资产。',
    'leader_subjective',
    'mixed',
    2,
    '0x0000000000000000000000000000000000000003'
  );

-- ========================================
-- 13. 性能优化：分区表（历史数据）
-- ========================================
-- 为 trades 表创建按年分区（PostgreSQL 10+）
ALTER TABLE trades
  PARTITION BY RANGE (created_at);

-- 创建 2026 年分区
CREATE TABLE trades_2026 PARTITION OF trades
  FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');

-- 创建 2027 年分区
CREATE TABLE trades_2027 PARTITION OF trades
  FOR VALUES FROM ('2027-01-01') TO ('2028-01-01');

-- ========================================
-- 14. 数据库权限设置
-- ========================================
-- 创建只读用户（用于数据分析）
CREATE USER mirror_readonly WITH PASSWORD 'change_this_password';
GRANT CONNECT ON DATABASE mirror_ai TO mirror_readonly;
GRANT USAGE ON SCHEMA public TO mirror_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO mirror_readonly;

-- 创建应用用户（读写权限）
CREATE USER mirror_app WITH PASSWORD 'change_this_password';
GRANT CONNECT ON DATABASE mirror_ai TO mirror_app;
GRANT USAGE ON SCHEMA public TO mirror_app;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO mirror_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO mirror_app;

-- ========================================
-- 15. 数据清理：删除过期会话
-- ========================================
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM sessions WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- 定时任务（需要 pg_cron 扩展）
-- SELECT cron.schedule('cleanup-sessions', '0 * * * *', 'SELECT cleanup_expired_sessions()');

-- ========================================
-- 16. 备份策略（注释）
-- ========================================
-- 生产环境建议：
-- 1. 全量备份：每日 1 次（凌晨 2 点）
--    pg_dump -h localhost -U postgres -d mirror_ai > backup_$(date +%Y%m%d).sql
--
-- 2. 增量备份：每小时 1 次（使用 WAL 归档）
--    archive_mode = on
--    archive_command = 'cp %p /backup/wal/%f'
--
-- 3. 保留策略：
--    - 全量备份保留 30 天
--    - WAL 归档保留 7 天

-- ========================================
-- 完成
-- ========================================
-- 数据库初始化完成
-- 建议执行：ANALYZE; 更新统计信息
