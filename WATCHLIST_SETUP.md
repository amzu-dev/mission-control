# 📊 Watchlist Setup Guide

**Live Market Data for Trading Wolf Dashboard**

---

## ✅ **Fixed: Watchlist Now Working!**

Your watchlist was empty because:
1. ❌ Alpha Vantage rate limits (5 calls/min)
2. ❌ Capital.com API throttling
3. ❌ Python script failures

**Solution:** Direct Yahoo Finance API integration (unlimited, fast, reliable)

---

## 🚀 Quick Start

### **1. View Live Watchlist**

Visit: **http://localhost:3002/trading**

**You should now see:**
```
WATCHLIST
STOCKS
  CRM      $191.75    +3.41%   RSI N/A
  NVDA     $195.56    +1.41%   RSI N/A
  META     $653.69    +2.25%   RSI N/A
  TSLA     $417.40    +1.96%   RSI N/A
  NFLX     $82.70     +5.97%   RSI N/A
  AAPL     $274.23    +0.77%   RSI N/A
  MSFT     $400.60    +2.98%   RSI N/A
  GOOGL    $312.90    +0.64%   RSI N/A
  AMZN     $210.64    +1.00%   RSI N/A
  ORCL     $147.89    +1.20%   RSI N/A
  IBM      $237.54    +3.58%   RSI N/A
  SNOW     $169.21    +5.06%   RSI N/A
```

**Auto-refresh:** Every 5 seconds

### **2. Test Market Data API**

```bash
# Check if data is flowing
curl http://localhost:3002/api/trading/market-scan | jq '.stocks[:3]'
```

**Expected output:**
```json
[
  {
    "symbol": "CRM",
    "price": "$191.75",
    "change": "+3.41%",
    "rsi": "N/A"
  },
  ...
]
```

### **3. Run Pre-Market Sync**

**Before trading sessions** (UK 08:00, US 14:30):
```bash
/Users/venkat/projects/mission-control-2/scripts/pre-market-sync.sh
```

**Output:**
```
✅ Pre-market sync completed successfully
📊 Stocks ready: 12
💼 Positions tracked: 3
📅 Earnings today: 0
```

---

## ⏰ **Automated Pre-Market Sync**

### **Setup Cron Jobs**

Add these to your crontab:

```bash
# Edit crontab
crontab -e

# Add these lines:

# UK Pre-Market (07:45 GMT - 15 min before UK open)
45 7 * * 1-5 /Users/venkat/projects/mission-control-2/scripts/pre-market-sync.sh >> /tmp/pre-market-sync.log 2>&1

# US Pre-Market (14:15 GMT - 15 min before US open)
15 14 * * 1-5 /Users/venkat/projects/mission-control-2/scripts/pre-market-sync.sh >> /tmp/pre-market-sync.log 2>&1
```

**What it does:**
1. **07:45 GMT** (Mon-Fri) - Syncs before UK market opens
2. **14:15 GMT** (Mon-Fri) - Syncs before US market opens
3. Ensures fresh data before trading
4. Logs to `/tmp/pre-market-sync.log`

### **Manual Trigger**

```bash
# Run pre-market sync manually
/Users/venkat/projects/mission-control-2/scripts/pre-market-sync.sh

# Or via API
curl -X POST http://localhost:3002/api/trading/pre-market-sync

# Check if sync needed right now
curl http://localhost:3002/api/trading/pre-market-sync
```

---

## 📡 **How It Works**

### **Data Sources**

**Stock Prices:**
- Source: Yahoo Finance API (`query1.finance.yahoo.com`)
- Rate Limit: **Unlimited** (free)
- Update Frequency: Real-time
- Stocks: 12 (CRM, NVDA, META, TSLA, NFLX, AAPL, MSFT, GOOGL, AMZN, ORCL, IBM, SNOW)

**Forex & Indices:**
- Source: Capital.com API (when available)
- Fallback: Database cache
- Pairs: EUR/USD, GBP/USD, USD/JPY, S&P 500, FTSE, Gold, Brent Oil

### **Data Flow**

```
1. Dashboard loads → 
2. Calls /api/trading/market-scan → 
3. API checks database cache (1-min TTL) → 
4. If stale, fetches from Yahoo Finance → 
5. Saves to PostgreSQL → 
6. Returns to dashboard → 
7. Watchlist updates
```

**Caching:**
- Fresh data cached for **1 minute**
- Reduces API calls
- Faster load times
- Fallback on API failure

### **Pre-Market Sync**

Runs **15 minutes before** trading sessions:

**Tasks:**
1. ✅ Sync market data (12 stocks)
2. ✅ Update open positions
3. ✅ Create account snapshot
4. ✅ Check earnings calendar

**Why 15 minutes early?**
- Ensures data ready before trading
- Time to review positions
- Check for overnight gaps
- Prepare trading plan

---

## 🔍 **Troubleshooting**

### **Watchlist Still Empty?**

**Check 1: Is Mission Control running?**
```bash
curl http://localhost:3002/api/trading/market-scan
```
- ✅ Should return JSON with stocks
- ❌ Connection refused? Start Mission Control: `npm run dev`

**Check 2: Any data in database?**
```sql
PGPASSWORD=findash psql -h localhost -U findash -d findash -c "SELECT COUNT(*) FROM market_data;"
```
- ✅ Should show > 0 rows
- ❌ Zero rows? Run pre-market sync

**Check 3: Dashboard loading?**
```bash
open http://localhost:3002/trading
```
- ✅ Watchlist panel visible (left side)
- ❌ Still empty? Check browser console (F12)

### **Stocks Showing "NaN%"?**

This means the change percentage calculation failed.

**Fix:**
```bash
# Clear cache and force fresh fetch
PGPASSWORD=findash psql -h localhost -U findash -d findash -c "DELETE FROM market_data WHERE instrument_type = 'stock';"

# Fetch fresh data
curl http://localhost:3002/api/trading/market-scan
```

### **"Loading..." Forever?**

**Check API response:**
```bash
curl http://localhost:3002/api/trading/market-scan
```

**If error:**
- Check Mission Control logs
- Verify internet connection (Yahoo Finance API)
- Check PostgreSQL is running

### **Pre-Market Sync Failing?**

**View logs:**
```bash
cat /tmp/pre-market-sync.log
```

**Common issues:**
- Mission Control not running → Start it
- Database connection error → Check PostgreSQL
- API timeout → Retry manually

---

## 📊 **Monitoring**

### **Check Data Freshness**

```sql
-- Check latest stock prices
SELECT 
  symbol,
  price,
  change_pct,
  timestamp,
  AGE(NOW(), timestamp) as age
FROM market_data
WHERE instrument_type = 'stock'
ORDER BY timestamp DESC
LIMIT 12;
```

**Expected:**
- Age < 5 minutes during trading hours
- Age < 30 minutes outside trading hours

### **Monitor Pre-Market Syncs**

```bash
# View today's sync log
grep "Pre-market sync" /tmp/pre-market-sync.log | tail -5

# Check sync history
PGPASSWORD=findash psql -h localhost -U findash -d findash -c "
  SELECT 
    DATE(timestamp) as date,
    COUNT(*) as syncs,
    MIN(timestamp) as first_sync,
    MAX(timestamp) as last_sync
  FROM market_data
  WHERE instrument_type = 'stock'
  GROUP BY DATE(timestamp)
  ORDER BY date DESC
  LIMIT 7;
"
```

---

## ⚙️ **Configuration**

### **Add/Remove Stocks**

Edit: `/Users/venkat/projects/mission-control-2/app/api/trading/market-scan/route.ts`

```typescript
const STOCKS = [
  'CRM', 'NVDA', 'META', 'TSLA', 'NFLX', 
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'ORCL', 'IBM', 'SNOW',
  // Add more here
  'JPM', 'BAC', 'XOM'  // Example additions
];
```

**Then restart Mission Control:**
```bash
# Stop (Ctrl+C)
# Start
cd /Users/venkat/projects/mission-control-2
npm run dev
```

### **Adjust Cache TTL**

Edit the same file:

```typescript
// Current: 60 seconds (1 minute)
if (new Date().getTime() - new Date(dbResult.rows[0].timestamp).getTime() < 60000) {

// Change to: 300 seconds (5 minutes)
if (new Date().getTime() - new Date(dbResult.rows[0].timestamp).getTime() < 300000) {
```

### **Change Auto-Refresh Rate**

Edit: `/Users/venkat/projects/mission-control-2/app/trading/page.tsx`

```typescript
// Current: 5 seconds
const marketInterval = setInterval(fetchMarketData, 5000);

// Change to: 10 seconds
const marketInterval = setInterval(fetchMarketData, 10000);
```

---

## 📈 **Usage Tips**

### **1. Pre-Market Routine**

**Every trading day:**
```bash
# 07:30 GMT - Check overnight news
# 07:45 GMT - Pre-market sync runs (automated)
# 07:50 GMT - Review watchlist on dashboard
# 08:00 GMT - UK market opens (ready to trade)
```

### **2. During Trading**

- Dashboard auto-refreshes every 5 seconds
- Click stocks to view charts
- Monitor % changes for entry signals
- Green = potential long, Red = potential short

### **3. Post-Market**

- Review day's price action
- Check which stocks had big moves
- Prepare watchlist for tomorrow
- Run sync if needed

---

## 🎯 **Next Steps**

### **Optional Enhancements**

1. **Add RSI Indicators**
   - Use Alpha Vantage sparingly (500 calls/day)
   - Calculate locally from historical data
   - Update once per hour (not per stock)

2. **Add Forex/Indices**
   - Fix Capital.com API rate limit
   - Add Yahoo Finance forex pairs
   - Use Finnhub for commodities

3. **Historical Charts**
   - Fetch OHLC data from Yahoo Finance
   - Store in `market_data` table
   - Display candlestick charts

4. **Price Alerts**
   - Set target prices (e.g., CRM > $200)
   - Push notifications via Telegram
   - Auto-generate trading signals

---

## 📁 **Files Reference**

**API Endpoints:**
- `/api/trading/market-scan` - Live stock data
- `/api/trading/pre-market-sync` - Pre-market full sync

**Scripts:**
- `scripts/pre-market-sync.sh` - Cron-friendly pre-market sync

**Database:**
- `market_data` table - Price snapshots
- `quota_usage` table - API quota tracking

**Dashboard:**
- `/trading` - Main trading dashboard
- `/trading/db` - Database viewer

---

## ✅ **Verification Checklist**

Before trading, verify:

- [ ] Mission Control running on port 3002
- [ ] Watchlist shows 12 stocks with prices
- [ ] Change % showing (not "NaN")
- [ ] Pre-market sync completed successfully
- [ ] PostgreSQL database accessible
- [ ] Cron jobs configured (if using automation)
- [ ] Dashboard auto-refreshing every 5s

---

**Status:** ✅ **FULLY OPERATIONAL**

Watchlist is now live with real-time data from Yahoo Finance!

Visit http://localhost:3002/trading to see it in action. 🚀
