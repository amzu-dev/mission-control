# 📅 Earnings Calendar - Update Guide

**How to keep the earnings calendar current**

---

## 🎯 Why Manual?

Free earnings APIs are no longer available:
- ❌ Financial Modeling Prep - Deprecated endpoint (requires paid)
- ❌ Yahoo Finance - Rate limited
- ❌ Polygon.io - Earnings require paid tier

**Solution:** Manually curated calendar (5 min/week to update)

---

## 📊 Current Status

**Check current earnings:**
```bash
curl http://localhost:3002/api/trading/earnings?range=week | jq
```

**View on dashboard:**
http://localhost:3002/trading (right panel)

---

## 🔄 How to Update

### **Step 1: Get Latest Dates**

Visit: https://finance.yahoo.com/calendar/earnings

**Filter by:**
- Date range: Next 30 days
- Look for watchlist stocks: AAPL, MSFT, GOOGL, NVDA, TSLA, META, AMZN, etc.

### **Step 2: Edit the File**

Open:
```
/Users/venkat/projects/mission-control-2/app/api/trading/earnings/route.ts
```

Find the `KNOWN_EARNINGS` object (around line 6):

```typescript
const KNOWN_EARNINGS: { [key: string]: string } = {
  // Week 1
  'TGT': '2026-03-03',
  'COST': '2026-03-05',
  
  // Week 2
  'ADBE': '2026-03-12',
  'ORCL': '2026-03-11',
  
  // Add new ones here
  'AAPL': '2026-04-30',
  'MSFT': '2026-04-23',
};
```

### **Step 3: Add/Update Dates**

**Format:** `'SYMBOL': 'YYYY-MM-DD'`

**Example:**
```typescript
'NVDA': '2026-05-28',  // NVDA Q1 2027 earnings
'TSLA': '2026-04-21',  // TSLA Q1 2026 earnings
```

### **Step 4: Test**

```bash
# Restart Mission Control (if running)
# Then check:
curl http://localhost:3002/api/trading/earnings?range=month | jq '.earnings[:5]'
```

---

## 📋 Quick Reference

### **Watchlist Stocks (40+)**

**Mega-Cap Tech:**
AAPL, MSFT, GOOGL, AMZN, META, NVDA, TSLA

**SaaS/Cloud:**
CRM, SNOW, ORCL, ADBE, NOW

**Finance:**
JPM, BAC, GS, MS, V, MA

**Healthcare:**
UNH, JNJ, PFE, ABBV, LLY

**Consumer:**
WMT, TGT, COST, HD, NKE

**Energy:**
XOM, CVX

**Entertainment:**
NFLX, DIS

**Semiconductors:**
AMD, INTC, QCOM, AVGO

**Other:**
IBM, PYPL, SQ, UBER, SHOP

---

## 🗓️ Update Schedule

**Weekly (Recommended):**
- Check Yahoo Finance calendar every Monday
- Add any new earnings announcements
- Remove past dates

**Monthly:**
- Full review of next 30 days
- Add entire month's earnings
- Clean up old entries

---

## 📝 Example Update

**Before (Feb 26):**
```typescript
const KNOWN_EARNINGS = {
  'NVDA': '2026-02-26',  // Already reported
  'TGT': '2026-03-03',
  'COST': '2026-03-05',
};
```

**After (Mar 1 update):**
```typescript
const KNOWN_EARNINGS = {
  // Remove NVDA (already reported)
  
  // This week
  'TGT': '2026-03-03',
  'COST': '2026-03-05',
  'SNOW': '2026-03-05',
  
  // Next week - NEW ADDITIONS
  'ADBE': '2026-03-12',
  'ORCL': '2026-03-11',
  'SQ': '2026-03-10',
  
  // Rest of month
  'NKE': '2026-03-20',
  'PYPL': '2026-03-18',
};
```

---

## 🎯 Priority Display

Dashboard automatically assigns priority:

| Days Until | Priority | Emoji |
|------------|----------|-------|
| 0 | TODAY | 🔴 |
| 1 | TOMORROW | 🟠 |
| 2-3 | THIS WEEK | 🟡 |
| 4-7 | NEXT WEEK | 🟢 |
| 8+ | LATER | ⚪ |

---

## 🔍 Where to Find Earnings Dates

### **Best Sources:**

1. **Yahoo Finance Calendar** (Free, most reliable)
   - https://finance.yahoo.com/calendar/earnings
   - Filter by date
   - Shows confirmed dates only

2. **Earnings Whispers** (Free)
   - https://www.earningswhispers.com/calendar
   - Good for tech stocks

3. **Company Investor Relations**
   - Google: "[Company] investor relations"
   - Check earnings release schedule

4. **Seeking Alpha** (Free)
   - https://seekingalpha.com/earnings/earnings-calendar
   - Detailed earnings info

---

## ✅ Verification

**After updating, verify:**

```bash
# Check week view
curl http://localhost:3002/api/trading/earnings?range=week | jq '.count'

# Check month view
curl http://localhost:3002/api/trading/earnings?range=month | jq '.count'

# View on dashboard
open http://localhost:3002/trading
# (Check right panel "EARNINGS CALENDAR")
```

**Expected:**
- Week view: 2-5 earnings
- Month view: 10-20 earnings
- Sorted by date (soonest first)

---

## 🤖 Future: Automated Updates

**If you want to automate later:**

1. **Paid API:**
   - Financial Modeling Prep Pro ($14/month)
   - Alpha Vantage Premium ($50/month)
   - Polygon.io Stocks ($29/month)

2. **Web Scraping:**
   - Scrape Yahoo Finance calendar
   - Run weekly cron job
   - Parse and update automatically

3. **Manual + Alerts:**
   - Keep manual updates
   - Add Telegram alert when earnings announced
   - Update on-demand

---

## 📚 Files

**Earnings API:**
`/Users/venkat/projects/mission-control-2/app/api/trading/earnings/route.ts`

**Dashboard Display:**
`/Users/venkat/projects/mission-control-2/app/trading/page.tsx` (right panel)

**Database:**
`earnings_calendar` table (optional caching)

---

**Status:** ✅ **Manual updates (5 min/week)**

Last updated: 2026-02-26  
Next update due: 2026-03-05 (weekly schedule)
