# 🗄️ Trading Wolf Database

**PostgreSQL Integration for Trading Dashboard**

---

## 🎯 Overview

Complete database infrastructure for Trading Wolf, storing all trading data, market scans, signals, and performance metrics in PostgreSQL.

### Database Details
- **Host:** localhost
- **Port:** 5432
- **Database:** findash
- **Username:** findash
- **Password:** findash

---

## 📊 Schema Overview

### Core Tables (11)

1. **`accounts`** - Trading accounts
   - Account ID, name, broker, type (demo/live)
   - Initial balance, currency

2. **`account_snapshots`** - Balance history
   - Daily balance, equity, margin, P&L
   - Drawdown percentage, open positions
   - Timestamped snapshots

3. **`trades`** - Complete trade history
   - Symbol, direction (LONG/SHORT)
   - Entry/exit price, position size
   - Stop loss, take profit
   - P&L amount & percentage
   - Strategy, notes, fees
   - Status: open, closed, stopped

4. **`positions`** - Real-time open positions
   - Current price, unrealized P&L
   - Links to trades table
   - Auto-updated

5. **`market_data`** - Price snapshots
   - Symbol, price, bid, ask, volume
   - RSI, EMA_9, EMA_21
   - Timestamped for charting

6. **`earnings_calendar`** - Upcoming earnings
   - Symbol, earnings date/time
   - Estimated vs actual EPS/revenue
   - Beat/miss classification
   - Gap percentage

7. **`news_events`** - Company news
   - Headline, summary, source, URL
   - Sentiment (positive/negative/neutral)
   - Published timestamp

8. **`trading_signals`** - Automated signals
   - Signal type (RSI Oversold, Earnings Gap, etc.)
   - Direction (LONG/SHORT)
   - Price, RSI, strength (1-10)
   - Actioned flag, linked trade_id

9. **`performance_metrics`** - Aggregated stats
   - Period (daily/weekly/monthly)
   - Win rate, avg win/loss
   - Total P&L, max drawdown
   - Sharpe ratio, profit factor

10. **`strategy_rules`** - Hard rules
    - Rule name, type, value
    - Enabled flag, priority
    - From MEMORY.md

11. **`lessons_learned`** - Trading mistakes
    - Date, title, description
    - Mistake type, action taken
    - Linked to specific trades

### Views (3)

- **`v_account_status`** - Current account summary
- **`v_open_positions`** - Active positions with strategy
- **`v_trading_performance`** - Win rate, P&L stats

---

## 🚀 Quick Start

### 1. Initialize Database

```bash
cd /Users/venkat/projects/mission-control-2
PGPASSWORD=findash psql -h localhost -U findash -d findash -f scripts/init-db.sql
```

### 2. Access Database Dashboard

**URL:** http://localhost:3002/trading/db

**Features:**
- View all rules, lessons, signals
- Track trading performance
- See recent trades
- One-click data sync

### 3. Sync Data

**From Dashboard:**
- Click "🔄 Sync Market Data" - Runs market scan, saves to DB
- Click "🔄 Sync Positions" - Updates open positions
- Click "🔄 Sync Account" - Saves account snapshot

**From API:**
```bash
# Sync market data
curl -X POST http://localhost:3002/api/trading/sync \
  -H "Content-Type: application/json" \
  -d '{"type":"market-scan"}'

# Sync positions
curl -X POST http://localhost:3002/api/trading/sync \
  -d '{"type":"positions"}'

# Sync account snapshot
curl -X POST http://localhost:3002/api/trading/sync \
  -d '{"type":"account"}'
```

---

## 📡 API Routes

### Account Snapshots
```typescript
GET  /api/trading/db/account-snapshot  // Get balance history
POST /api/trading/db/account-snapshot  // Save snapshot
```

### Market Data
```typescript
GET  /api/trading/db/market-data?symbol=CRM&period=1d
POST /api/trading/db/market-data
```

### Trading Signals
```typescript
GET  /api/trading/db/signals?limit=20
POST /api/trading/db/signals
```

### Performance Stats
```typescript
GET  /api/trading/db/performance  // Account, trades, rules, lessons
```

### Data Sync
```typescript
POST /api/trading/sync
Body: { "type": "market-scan" | "positions" | "account" }
```

---

## 🔄 Auto-Sync Integration

### Automated Workflow

1. **Cron runs** `market_scan_v2.py` (every 5 min)
2. **Script outputs** market data
3. **Sync API called** automatically
4. **Data parsed** and saved to PostgreSQL
5. **Dashboard updates** in real-time

### Manual Trigger

```bash
cd /Users/venkat/.openclaw/workspace/Elite\ quantitative\ trader\ with\ cunning\ instincts\ and\ disciplined\ risk\ management

# Run scan
python3 market_scan_v2.py

# Sync to database (from Mission Control)
curl -X POST http://localhost:3002/api/trading/sync \
  -H "Content-Type: application/json" \
  -d '{"type":"market-scan"}'
```

---

## 📊 Pre-Loaded Data

### Account
- **ID:** 309389790235337758
- **Name:** Trading Wolf Demo
- **Broker:** Capital.com
- **Initial Balance:** £1,000

### Strategy Rules (12)
1. Min R:R 1:2
2. Max Position Risk 1.5%
3. Max Portfolio Exposure 5%
4. Daily Loss Limit -2%
5. Max Drawdown 10%
6. FOMC Close Time 18:30 GMT
7. GBP/USD Min Stop 50 pips
8. No Oil During Tensions
9. UK Session Window 08:00-08:30 GMT
10. US Session Window 14:30-15:00 GMT
11. Friday Max Trades 1
12. Stock Risk 1%

### Lessons Learned (5)
1. Don't Chase Momentum Spikes
2. Entry Timing on Strong Moves
3. Tier-1 News Beats RSI
4. FOMC Overnight Holds Deadly
5. Geopolitical Oil Fades Fail

---

## 📈 Use Cases

### 1. Track Win Rate Over Time
```sql
SELECT 
  DATE(entry_time) as date,
  COUNT(*) as trades,
  SUM(CASE WHEN pl_amount > 0 THEN 1 ELSE 0 END)::float / COUNT(*) * 100 as win_rate
FROM trades
WHERE status = 'closed'
GROUP BY DATE(entry_time)
ORDER BY date DESC;
```

### 2. Find Best Strategies
```sql
SELECT 
  strategy,
  COUNT(*) as trades,
  AVG(pl_amount) as avg_pl,
  SUM(pl_amount) as total_pl
FROM trades
WHERE status = 'closed'
GROUP BY strategy
ORDER BY total_pl DESC;
```

### 3. RSI Signal Performance
```sql
SELECT 
  s.signal_type,
  COUNT(*) as signals_generated,
  SUM(CASE WHEN s.actioned THEN 1 ELSE 0 END) as signals_traded,
  AVG(t.pl_amount) as avg_pl
FROM trading_signals s
LEFT JOIN trades t ON s.trade_id = t.trade_id
GROUP BY s.signal_type;
```

### 4. Drawdown History
```sql
SELECT 
  DATE(snapshot_time) as date,
  MIN(drawdown_pct) as max_drawdown,
  AVG(drawdown_pct) as avg_drawdown
FROM account_snapshots
GROUP BY DATE(snapshot_time)
ORDER BY date DESC
LIMIT 30;
```

---

## 🛠️ Maintenance

### Backup Database
```bash
PGPASSWORD=findash pg_dump -h localhost -U findash findash > backup_$(date +%Y%m%d).sql
```

### Restore Database
```bash
PGPASSWORD=findash psql -h localhost -U findash -d findash < backup_20260226.sql
```

### Check Database Size
```sql
SELECT 
  pg_database.datname,
  pg_size_pretty(pg_database_size(pg_database.datname)) AS size
FROM pg_database
WHERE datname = 'findash';
```

### Vacuum & Analyze
```sql
VACUUM ANALYZE;
```

---

## 🔍 Debugging

### Check Connection
```bash
PGPASSWORD=findash psql -h localhost -U findash -d findash -c "SELECT version();"
```

### View All Tables
```sql
\dt
```

### View Recent Market Data
```sql
SELECT * FROM market_data 
ORDER BY timestamp DESC 
LIMIT 10;
```

### Check Sync Status
```sql
SELECT 
  COUNT(*) as total_snapshots,
  MAX(timestamp) as last_market_data,
  (SELECT MAX(snapshot_time) FROM account_snapshots) as last_account_snapshot
FROM market_data;
```

---

## 🎯 Next Steps

1. **Run First Sync**
   - Visit http://localhost:3002/trading/db
   - Click "🔄 Sync Market Data"
   - Watch signals populate

2. **Set Up Auto-Sync**
   - Add sync calls to cron jobs
   - Market scan → auto-sync
   - Position check → auto-sync

3. **Build Historical Charts**
   - Use `market_data` table
   - Query by symbol + time range
   - Display in dashboard

4. **Track Performance**
   - Win rate over time
   - Best/worst strategies
   - Lesson impact analysis

---

## 📁 Files

**Schema:**
- `scripts/init-db.sql` - Complete database setup (13KB)

**Backend:**
- `app/lib/db.ts` - PostgreSQL connection pool
- `app/api/trading/db/*` - Database API routes
- `app/api/trading/sync/route.ts` - Sync service

**Frontend:**
- `app/trading/db/page.tsx` - Database dashboard (12KB)

**Docs:**
- `TRADING_DATABASE.md` - This file

---

**Status:** ✅ **FULLY OPERATIONAL**

All tables created, views configured, pre-loaded with rules and lessons. Ready for real trading data! 🐺
