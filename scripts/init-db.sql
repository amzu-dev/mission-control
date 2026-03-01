-- Trading Wolf Database Schema
-- Database: findash
-- Created: 2026-02-26

-- ============================================
-- ACCOUNTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS accounts (
    id SERIAL PRIMARY KEY,
    account_name VARCHAR(100) NOT NULL,
    account_id VARCHAR(100) UNIQUE NOT NULL,
    broker VARCHAR(50) DEFAULT 'Capital.com',
    account_type VARCHAR(20) DEFAULT 'demo',
    currency VARCHAR(3) DEFAULT 'GBP',
    initial_balance DECIMAL(12, 2) DEFAULT 1000.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- ACCOUNT SNAPSHOTS (Daily Balance History)
-- ============================================
CREATE TABLE IF NOT EXISTS account_snapshots (
    id SERIAL PRIMARY KEY,
    account_id VARCHAR(100) REFERENCES accounts(account_id),
    balance DECIMAL(12, 2) NOT NULL,
    equity DECIMAL(12, 2),
    margin_used DECIMAL(12, 2),
    margin_available DECIMAL(12, 2),
    total_pl DECIMAL(12, 2),
    daily_pl DECIMAL(12, 2),
    drawdown_pct DECIMAL(5, 2),
    open_positions INTEGER DEFAULT 0,
    snapshot_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(account_id, snapshot_time)
);

-- ============================================
-- TRADES TABLE (Complete Trade History)
-- ============================================
CREATE TABLE IF NOT EXISTS trades (
    id SERIAL PRIMARY KEY,
    account_id VARCHAR(100) REFERENCES accounts(account_id),
    trade_id VARCHAR(100) UNIQUE NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    direction VARCHAR(10) NOT NULL, -- LONG or SHORT
    entry_price DECIMAL(12, 5) NOT NULL,
    exit_price DECIMAL(12, 5),
    position_size DECIMAL(12, 4) NOT NULL,
    stop_loss DECIMAL(12, 5),
    take_profit DECIMAL(12, 5),
    entry_time TIMESTAMP NOT NULL,
    exit_time TIMESTAMP,
    duration_seconds INTEGER,
    pl_amount DECIMAL(12, 2),
    pl_pct DECIMAL(5, 2),
    fees DECIMAL(8, 2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'open', -- open, closed, stopped
    strategy VARCHAR(50), -- e.g., 'RSI Extreme', 'Earnings Gap'
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- OPEN POSITIONS (Real-Time)
-- ============================================
CREATE TABLE IF NOT EXISTS positions (
    id SERIAL PRIMARY KEY,
    account_id VARCHAR(100) REFERENCES accounts(account_id),
    position_id VARCHAR(100) UNIQUE NOT NULL,
    trade_id VARCHAR(100) REFERENCES trades(trade_id),
    symbol VARCHAR(20) NOT NULL,
    direction VARCHAR(10) NOT NULL,
    entry_price DECIMAL(12, 5) NOT NULL,
    current_price DECIMAL(12, 5) NOT NULL,
    position_size DECIMAL(12, 4) NOT NULL,
    stop_loss DECIMAL(12, 5),
    take_profit DECIMAL(12, 5),
    unrealized_pl DECIMAL(12, 2),
    unrealized_pl_pct DECIMAL(5, 2),
    entry_time TIMESTAMP NOT NULL,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(account_id, position_id)
);

-- ============================================
-- MARKET DATA (Price Snapshots)
-- ============================================
CREATE TABLE IF NOT EXISTS market_data (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(20) NOT NULL,
    instrument_type VARCHAR(20) DEFAULT 'stock', -- stock, forex, index, commodity
    price DECIMAL(12, 5) NOT NULL,
    bid DECIMAL(12, 5),
    ask DECIMAL(12, 5),
    volume BIGINT,
    change_pct DECIMAL(5, 2),
    rsi DECIMAL(5, 2),
    ema_9 DECIMAL(12, 5),
    ema_21 DECIMAL(12, 5),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- EARNINGS CALENDAR
-- ============================================
CREATE TABLE IF NOT EXISTS earnings_calendar (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(20) NOT NULL,
    earnings_date DATE NOT NULL,
    earnings_time VARCHAR(20), -- pre-market, after-hours, N/A
    estimated_eps DECIMAL(10, 4),
    actual_eps DECIMAL(10, 4),
    revenue_estimate DECIMAL(15, 2),
    actual_revenue DECIMAL(15, 2),
    beat_miss VARCHAR(10), -- beat, miss, inline
    gap_pct DECIMAL(5, 2), -- % gap day after earnings
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(symbol, earnings_date)
);

-- ============================================
-- NEWS & EVENTS
-- ============================================
CREATE TABLE IF NOT EXISTS news_events (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(20),
    headline TEXT NOT NULL,
    summary TEXT,
    source VARCHAR(100),
    url TEXT,
    sentiment VARCHAR(20), -- positive, negative, neutral
    published_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TRADING SIGNALS (From Scans)
-- ============================================
CREATE TABLE IF NOT EXISTS trading_signals (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(20) NOT NULL,
    signal_type VARCHAR(50) NOT NULL, -- RSI Oversold, RSI Overbought, Earnings Gap, etc.
    direction VARCHAR(10), -- LONG or SHORT
    price DECIMAL(12, 5) NOT NULL,
    rsi DECIMAL(5, 2),
    strength INTEGER, -- 1-10 signal strength
    notes TEXT,
    actioned BOOLEAN DEFAULT FALSE,
    trade_id VARCHAR(100), -- Link to trade if executed
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- PERFORMANCE METRICS (Aggregated Stats)
-- ============================================
CREATE TABLE IF NOT EXISTS performance_metrics (
    id SERIAL PRIMARY KEY,
    account_id VARCHAR(100) REFERENCES accounts(account_id),
    period VARCHAR(20) NOT NULL, -- daily, weekly, monthly
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    total_trades INTEGER DEFAULT 0,
    winning_trades INTEGER DEFAULT 0,
    losing_trades INTEGER DEFAULT 0,
    win_rate DECIMAL(5, 2),
    avg_win DECIMAL(12, 2),
    avg_loss DECIMAL(12, 2),
    total_pl DECIMAL(12, 2),
    max_drawdown DECIMAL(5, 2),
    sharpe_ratio DECIMAL(5, 2),
    profit_factor DECIMAL(5, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(account_id, period, period_start)
);

-- ============================================
-- STRATEGY RULES (From MEMORY.md)
-- ============================================
CREATE TABLE IF NOT EXISTS strategy_rules (
    id SERIAL PRIMARY KEY,
    rule_name VARCHAR(100) NOT NULL UNIQUE,
    rule_type VARCHAR(50), -- risk, entry, exit, position_sizing
    rule_value TEXT NOT NULL,
    enabled BOOLEAN DEFAULT TRUE,
    priority INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- LESSONS LEARNED (From Trading Mistakes)
-- ============================================
CREATE TABLE IF NOT EXISTS lessons_learned (
    id SERIAL PRIMARY KEY,
    lesson_date DATE NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    mistake_type VARCHAR(50), -- entry_timing, risk_management, news_trading, etc.
    trade_id VARCHAR(100), -- Link to specific trade
    action_taken TEXT, -- What rule changed
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_trades_symbol ON trades(symbol);
CREATE INDEX IF NOT EXISTS idx_trades_status ON trades(status);
CREATE INDEX IF NOT EXISTS idx_trades_entry_time ON trades(entry_time);
CREATE INDEX IF NOT EXISTS idx_positions_symbol ON positions(symbol);
CREATE INDEX IF NOT EXISTS idx_market_data_symbol ON market_data(symbol);
CREATE INDEX IF NOT EXISTS idx_market_data_time ON market_data(timestamp);
CREATE INDEX IF NOT EXISTS idx_signals_symbol ON trading_signals(symbol);

-- ============================================
-- INITIAL DATA
-- ============================================

-- Insert default account
INSERT INTO accounts (account_name, account_id, broker, account_type, initial_balance)
VALUES ('Trading Wolf Demo', '309389790235337758', 'Capital.com', 'demo', 1000.00)
ON CONFLICT (account_id) DO NOTHING;

-- Insert current hard rules from MEMORY.md
INSERT INTO strategy_rules (rule_name, rule_type, rule_value, enabled, priority) VALUES
    ('Min R:R 1:2', 'risk', '1:2', TRUE, 1),
    ('Max Position Risk', 'risk', '1.5%', TRUE, 2),
    ('Max Portfolio Exposure', 'risk', '5%', TRUE, 3),
    ('Daily Loss Limit', 'risk', '-2%', TRUE, 4),
    ('Max Drawdown', 'risk', '10%', TRUE, 5),
    ('FOMC Close Time', 'exit', '18:30 GMT', TRUE, 6),
    ('GBP/USD Min Stop', 'risk', '50 pips', TRUE, 7),
    ('No Oil During Tensions', 'entry', 'Skip oil trades during Iran/Russia/OPEC tensions', TRUE, 8),
    ('UK Session Window', 'entry', '08:00-08:30 GMT', TRUE, 9),
    ('US Session Window', 'entry', '14:30-15:00 GMT', TRUE, 10),
    ('Friday Max Trades', 'entry', '1 trade max', TRUE, 11),
    ('Stock Risk', 'risk', '1%', TRUE, 12)
ON CONFLICT (rule_name) DO NOTHING;

-- Insert recent lessons learned
INSERT INTO lessons_learned (lesson_date, title, description, mistake_type, action_taken) VALUES
    ('2026-02-24', 'Don''t Chase Momentum Spikes', 'Gold up +1.3% on geopolitical news → entered LONG → reversed -1.06% next day = -£3 loss', 'entry_timing', 'Wait for pullback OR use tighter stops. If market up 1%, wait for 0.3-0.5% retrace before entering.'),
    ('2026-02-24', 'Entry Timing on Strong Moves', 'USDJPY up +0.96% → entered LONG → faded to +0.80% = bought the local high', 'entry_timing', 'Don''t buy after big moves. Wait for consolidation or pullback.'),
    ('2026-02-17', 'Tier-1 News Beats RSI', 'GBP/USD RSI 12.21 (extreme oversold) but UK unemployment at 5yr high → went SHORT instead of LONG → +34 pips winner', 'news_trading', 'When major macro data drops, trade the fundamental direction. RSI is irrelevant during Tier-1 events.'),
    ('2026-02-17', 'FOMC Overnight Holds Deadly', 'US500 SHORT had +£15.24 floating at 16:00 → FOMC Minutes at 19:00 → market bounced → SL hit overnight', 'risk_management', 'Close ALL positions by 18:30 GMT on FOMC days.'),
    ('2026-02-19', 'Geopolitical Oil Fades Fail', 'Three Brent Oil SHORTS on Iran/Russia news = three consecutive losses (-£42 total)', 'strategy', 'NO OIL SHORTS during active geopolitical tensions.')
ON CONFLICT DO NOTHING;

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Auto-update timestamp on UPDATE
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_trades_updated_at BEFORE UPDATE ON trades FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_earnings_updated_at BEFORE UPDATE ON earnings_calendar FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_strategy_rules_updated_at BEFORE UPDATE ON strategy_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VIEWS FOR DASHBOARD
-- ============================================

-- Current account status
CREATE OR REPLACE VIEW v_account_status AS
SELECT 
    a.account_id,
    a.account_name,
    s.balance,
    s.total_pl,
    s.drawdown_pct,
    s.open_positions,
    s.snapshot_time as last_updated
FROM accounts a
LEFT JOIN LATERAL (
    SELECT * FROM account_snapshots 
    WHERE account_id = a.account_id 
    ORDER BY snapshot_time DESC 
    LIMIT 1
) s ON true;

-- Open positions summary
CREATE OR REPLACE VIEW v_open_positions AS
SELECT 
    p.*,
    t.strategy,
    t.notes
FROM positions p
LEFT JOIN trades t ON p.trade_id = t.trade_id
ORDER BY p.entry_time DESC;

-- Trading performance summary
CREATE OR REPLACE VIEW v_trading_performance AS
SELECT 
    account_id,
    COUNT(*) as total_trades,
    SUM(CASE WHEN pl_amount > 0 THEN 1 ELSE 0 END) as winning_trades,
    SUM(CASE WHEN pl_amount < 0 THEN 1 ELSE 0 END) as losing_trades,
    ROUND(100.0 * SUM(CASE WHEN pl_amount > 0 THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0), 2) as win_rate,
    AVG(CASE WHEN pl_amount > 0 THEN pl_amount END) as avg_win,
    AVG(CASE WHEN pl_amount < 0 THEN pl_amount END) as avg_loss,
    SUM(pl_amount) as total_pl,
    MAX(CASE WHEN status = 'closed' THEN exit_time END) as last_trade_time
FROM trades
WHERE status = 'closed'
GROUP BY account_id;

COMMENT ON TABLE accounts IS 'Trading accounts (demo and live)';
COMMENT ON TABLE trades IS 'Complete history of all trades (open and closed)';
COMMENT ON TABLE positions IS 'Currently open positions (real-time)';
COMMENT ON TABLE market_data IS 'Price snapshots for charting and analysis';
COMMENT ON TABLE earnings_calendar IS 'Upcoming earnings reports';
COMMENT ON TABLE trading_signals IS 'Automated scan signals (RSI, earnings, etc.)';
COMMENT ON TABLE performance_metrics IS 'Aggregated trading performance stats';
COMMENT ON TABLE strategy_rules IS 'Hard rules from MEMORY.md';
COMMENT ON TABLE lessons_learned IS 'Trading mistakes and lessons';
