# 🔄 Trading Wolf - Intelligent Auto-Sync System

**Quota-Aware Automatic Data Synchronization**

---

## 🎯 Overview

The Auto-Sync system intelligently synchronizes market data, positions, and account snapshots throughout the trading day while respecting API rate limits and quotas.

### Key Features
- ✅ **Quota Management** - Never exceeds API limits
- ✅ **Smart Scheduling** - Syncs more during trading hours
- ✅ **Rate Limit Protection** - Respects 5 calls/min limits
- ✅ **Native Notifications** - Beautiful toast alerts (no popups!)
- ✅ **Real-Time Status** - Live quota tracking on dashboard

---

## 📊 API Quotas (Free Tiers)

### Alpha Vantage (Technical Indicators)
- **Daily Limit:** 500 calls
- **Rate Limit:** 5 calls per minute
- **Cost per Scan:** 12 calls (12 stocks with RSI)
- **Max Scans/Day:** 41 full scans

### Finnhub (News & Data)
- **Rate Limit:** 60 calls per minute
- **Daily Limit:** Unlimited
- **Cost:** 1 call per news fetch

### yfinance (Real-Time Quotes)
- **Limits:** Unlimited
- **Cost:** Free, no restrictions

---

## ⏰ Auto-Sync Schedule

### During Trading Hours (08:00-21:00 GMT)

**Market Data (via Alpha Vantage):**
- **Frequency:** Every 15 minutes
- **Calls:** 12 per sync
- **Daily Total:** ~52 syncs = 624 calls
- **Quota Protection:** Stops at 500/500

**Positions (via yfinance):**
- **Frequency:** Every 5 minutes
- **Calls:** Unlimited (yfinance is free)
- **Purpose:** Real-time P&L tracking

**Account Snapshot:**
- **Frequency:** Every hour
- **Calls:** 1 per sync
- **Purpose:** Balance history for charts

### Outside Trading Hours (21:00-08:00 GMT)

**Market Data:**
- **Frequency:** Every 30 minutes
- **Reason:** Lower activity, preserve quota

**Positions:**
- **Paused** - Markets closed

**Account Snapshot:**
- **Continues** - Every hour

---

## 🚀 Setup

### Option 1: System Cron (Recommended)

Add to your crontab:
```bash
# Edit crontab
crontab -e

# Add this line (runs every minute)
* * * * * /Users/venkat/projects/mission-control-2/scripts/setup-auto-sync.sh >> /tmp/trading-autosync.log 2>&1
```

**What it does:**
- Runs every minute
- Checks quota status
- Intelligently decides what to sync
- Logs all activity to `/tmp/trading-autosync.log`

### Option 2: Manual API Calls

**Trigger sync manually:**
```bash
# Single sync
curl -X POST http://localhost:3002/api/trading/auto-sync

# Check status
curl http://localhost:3002/api/trading/auto-sync
```

### Option 3: Dashboard Buttons

Visit http://localhost:3002/trading/db and click:
- 🔄 **Sync Market Data** - Manual market scan
- 🔄 **Sync Positions** - Manual position update
- 🔄 **Sync Account** - Manual account snapshot

---

## 📈 Quota Management

### How It Works

1. **Before Sync:**
   - Check quota usage in database
   - Calculate remaining calls (500 - used)
   - Check last sync time (3 min minimum)
   - Determine if sync is allowed

2. **During Sync:**
   - Execute market scan Python script
   - Parse results
   - Save to PostgreSQL

3. **After Sync:**
   - Record usage (+12 calls)
   - Update last sync timestamp
   - Calculate next sync time

### Quota Status Display

**Dashboard shows:**
- **Used:** 234/500 calls (47%)
- **Progress Bar:** Green (0-70%), Yellow (70-90%), Red (90-100%)
- **Sync Interval:** 15 minutes (recommended)
- **Status:** ✅ Ready to sync OR ⏳ Rate limited

### Protection Mechanisms

**Daily Limit (500 calls):**
```typescript
if (used >= 500) {
  return { allowed: false, reason: "Daily quota exhausted" };
}
```

**Rate Limit (5 calls/min):**
```typescript
if (timeSinceLastSync < 3 minutes) {
  return { 
    allowed: false, 
    reason: "Wait 47s before next sync",
    waitMs: 47000 
  };
}
```

---

## 🔔 Native Toast Notifications

### Instead of Alert Popups

**Before (JavaScript Alert):**
```javascript
alert("✅ Market data synced");  // Blocks UI, ugly
```

**After (Sonner Toast):**
```typescript
toast.success("Market data synced", {
  description: "Quota: 246/500 used",
  duration: 3000,
  closeButton: true
});
```

### Toast Types

**Loading:**
```typescript
const id = toast.loading("Syncing market-scan...");
```

**Success:**
```typescript
toast.success("Market data synced", { 
  id,
  description: "12 stocks updated",
  duration: 3000 
});
```

**Error:**
```typescript
toast.error("Sync failed", {
  id,
  description: "Rate limit: Wait 47s",
  duration: 5000
});
```

**Warning:**
```typescript
toast.warning("Quota at 90%", {
  description: "50 calls remaining today"
});
```

---

## 📅 Daily Quota Budget

### Typical Trading Day

**Start:** 08:00 GMT (UK open)  
**End:** 21:00 GMT (US close)  
**Duration:** 13 hours

**Sync Schedule:**
- Every 15 minutes = 52 syncs
- 52 syncs × 12 calls = 624 calls needed
- **Problem:** Only 500 calls available!

**Solution:**
- Auto-sync monitors quota
- Slows down when approaching limit
- Extends interval to 20-30 min at 80% usage
- Stops completely at 100%

**Optimized:**
- First 40 syncs: Every 15 min (480 calls)
- Last 1-2 syncs: Manual or skip
- Quota exhausted: Wait until tomorrow

---

## 🛠️ API Endpoints

### `/api/trading/quota`

**GET** - Check quota status
```bash
curl http://localhost:3002/api/trading/quota
```

**Response:**
```json
{
  "quota": {
    "alphaVantage": {
      "used": 234,
      "limit": 500,
      "remaining": 266,
      "percentUsed": 47
    },
    "finnhub": {
      "used": 12,
      "limit": "unlimited",
      "rateLimit": "60/min"
    }
  },
  "canSync": true,
  "recommendedIntervalMinutes": 15
}
```

**POST** - Record sync usage
```bash
curl -X POST http://localhost:3002/api/trading/quota \
  -H "Content-Type: application/json" \
  -d '{"type":"market-scan"}'
```

### `/api/trading/auto-sync`

**GET** - View schedule
```bash
curl http://localhost:3002/api/trading/auto-sync
```

**Response:**
```json
{
  "currentTime": "2026-02-26T11:00:00.000Z",
  "currentHourGMT": 11,
  "isTradingHours": true,
  "schedule": {
    "marketData": "Every 15 min",
    "positions": "Every 5 min",
    "account": "Every hour"
  }
}
```

**POST** - Execute auto-sync
```bash
curl -X POST http://localhost:3002/api/trading/auto-sync
```

**Response:**
```json
{
  "success": true,
  "timestamp": "2026-02-26T11:00:00.000Z",
  "tradingHours": true,
  "tasksExecuted": 2,
  "results": [
    { "task": "market-scan", "success": true, "message": "Market data synced" },
    { "task": "positions", "success": true, "message": "Positions synced" }
  ],
  "quota": {
    "used": 246,
    "remaining": 254,
    "percentUsed": 49
  }
}
```

---

## 🔍 Monitoring

### View Logs

**Auto-sync log (if using cron):**
```bash
tail -f /tmp/trading-autosync.log
```

**Database quota history:**
```sql
SELECT 
  date,
  alpha_vantage_calls as av_calls,
  last_sync_time
FROM quota_usage
ORDER BY date DESC
LIMIT 7;
```

### Check Current Status

**Dashboard:**
- Visit http://localhost:3002/trading/db
- View quota panel (top of page)
- Check sync button status (enabled/disabled)

**API:**
```bash
# Quick status check
curl -s http://localhost:3002/api/trading/quota | jq '.quota.alphaVantage'
```

---

## ⚙️ Configuration

### Adjust Sync Intervals

Edit `/app/api/trading/auto-sync/route.ts`:

```typescript
// Current: Every 15 minutes during trading
const marketDataInterval = isTradingHours ? 15 : 30;

// Change to: Every 20 minutes
const marketDataInterval = isTradingHours ? 20 : 30;
```

### Modify Quota Limits

Edit `/app/api/trading/quota/route.ts`:

```typescript
const QUOTAS = {
  alphaVantage: {
    dailyLimit: 500,      // Change if you upgrade plan
    perMinuteLimit: 5,
    costPerScan: 12,
  },
};
```

---

## 🎯 Best Practices

### 1. Monitor Quota Daily
- Check dashboard each morning
- Ensure enough quota for day's trading
- Adjust intervals if running low

### 2. Prioritize Trading Hours
- More frequent syncs during UK/US sessions
- Reduce outside hours to preserve quota
- Manual syncs for critical moments

### 3. Use Manual Syncs Wisely
- Before major trades
- After important news
- When quota allows

### 4. Review Logs Weekly
- Check for sync failures
- Identify quota usage patterns
- Optimize schedule if needed

---

## 🐛 Troubleshooting

### "Daily quota exhausted"

**Cause:** Used all 500 Alpha Vantage calls  
**Solution:**
- Wait until tomorrow (quota resets at midnight UTC)
- Use manual position syncs (yfinance unlimited)
- Reduce sync frequency temporarily

### "Rate limit: Wait Xs"

**Cause:** Less than 3 minutes since last sync  
**Solution:**
- Wait the specified time
- Auto-sync will handle automatically
- Check if cron running too frequently

### Sync button disabled

**Cause:** Rate limit or quota reached  
**Solution:**
- Check quota status panel
- Wait for recommended interval
- Use positions sync (no quota limit)

### No toast notifications

**Cause:** Sonner not initialized  
**Solution:**
- Check browser console for errors
- Verify `<Toaster />` component in page
- Refresh dashboard page

---

## 📊 Analytics Queries

### Daily Quota Usage
```sql
SELECT 
  date,
  alpha_vantage_calls as av_used,
  (500 - alpha_vantage_calls) as av_remaining,
  ROUND(100.0 * alpha_vantage_calls / 500, 1) as percent_used,
  last_sync_time
FROM quota_usage
WHERE date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY date DESC;
```

### Sync Frequency Analysis
```sql
SELECT 
  DATE(timestamp) as date,
  COUNT(*) as market_data_saves,
  MIN(timestamp) as first_sync,
  MAX(timestamp) as last_sync
FROM market_data
WHERE timestamp >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(timestamp)
ORDER BY date DESC;
```

---

## 📁 Files

**Core:**
- `app/api/trading/quota/route.ts` - Quota management
- `app/api/trading/auto-sync/route.ts` - Intelligent scheduler
- `app/api/trading/sync/route.ts` - Sync service (updated)
- `app/trading/db/page.tsx` - Dashboard with toasts

**Scripts:**
- `scripts/setup-auto-sync.sh` - Cron integration

**Database:**
- `quota_usage` table - Daily usage tracking

**Dependencies:**
- `sonner` - Toast notifications
- `pg` - PostgreSQL client

---

## 🎉 Summary

**What You Get:**
- ✅ Automatic syncing throughout trading day
- ✅ Never exceeds API quotas
- ✅ Beautiful native notifications
- ✅ Real-time quota monitoring
- ✅ Smart scheduling based on time
- ✅ Rate limit protection
- ✅ Complete audit trail

**No More:**
- ❌ Manual sync button clicking
- ❌ Ugly JavaScript alert popups
- ❌ API quota violations
- ❌ Rate limit errors
- ❌ Stale market data

**Set it and forget it!** 🚀

---

**Status:** ✅ **FULLY OPERATIONAL**

Last Updated: 2026-02-26 11:18 GMT  
Version: 1.0.0  
Developer: Trading Wolf 🐺
