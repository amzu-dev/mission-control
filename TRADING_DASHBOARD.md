# 📊 Trading Wolf Dashboard

**Bloomberg Terminal-Style Trading Dashboard for Mission Control**

---

## 🚀 Quick Start

### Access the Dashboard

**URL:** http://localhost:3002/trading

**From Main Page:** Click the blue **📊 TRADING** button in the top-right header

---

## 🎨 Features

### Top Bar (Real-Time Metrics)
- **Live Clock** - Updates every second (GMT timezone)
- **Balance** - Current account balance (£906.13)
- **P&L** - Total profit/loss (color-coded)
- **Drawdown** - Current drawdown % vs 10% max
- **Positions** - Number of open positions

### Left Panel (Watchlist)

**Stocks (12):**
- Live prices + % change
- RSI indicator (color-coded)
- Click to view chart
- Auto-refresh every 5 seconds

**Forex & Indices (7):**
- EUR/USD, GBP/USD, USD/JPY
- S&P 500, FTSE 100
- Gold, Brent Oil

**Color Coding:**
- 🟢 **Green** - Positive change OR RSI <30 (oversold)
- 🔴 **Red** - Negative change OR RSI >70 (overbought)
- ⚪ **Gray** - Neutral (RSI 30-70)

### Center Panel (Charts)

**Price Chart:**
- Live price action for selected stock
- Click any stock in watchlist to switch
- Interactive tooltips on hover
- Time periods: 1D, 1W, 1M, 3M (buttons)

**Volume Chart:**
- Trading volume bars
- Synchronized with price chart

### Right Panel (Positions & Risk)

**Open Positions:**
- Symbol + direction (LONG/SHORT)
- Entry price vs current price
- Real-time P&L per position
- Color-coded gains/losses

**Risk Metrics:**
- Max drawdown limit (10%)
- Current drawdown
- Risk exposure (% of capital)
- Win rate tracking

**Earnings Calendar:**
- Upcoming earnings (next 7 days)
- Priority indicators:
  - 🔴 TODAY
  - 🟠 TOMORROW
  - 🟡 THIS WEEK

---

## 🔧 Technical Details

### API Routes

**Market Scan** - `/api/trading/market-scan`
```typescript
GET /api/trading/market-scan
Response: { stocks: [], forex: [], timestamp: "..." }
```

**Positions** - `/api/trading/positions`
```typescript
GET /api/trading/positions
Response: { account: {...}, positions: [], timestamp: "..." }
```

**Earnings** - `/api/trading/earnings`
```typescript
GET /api/trading/earnings
Response: { earnings: [], timestamp: "..." }
```

All routes call Python scripts via `child_process.spawn()`:
- `market_scan_v2.py`
- `check_status.py`
- `earnings_scanner_v2.py`

### Auto-Refresh Schedule
- **Market data**: Every 5 seconds
- **Positions**: Every 10 seconds
- **Clock**: Every 1 second

### Dependencies
- **Next.js 16.1.6** - Framework
- **React 19** - UI library
- **Recharts** - Charts
- **Tailwind CSS** - Styling
- **date-fns** - Date formatting

---

## 📱 Layout

```
┌─────────────────────────────────────────────────────────────┐
│  🐺 TRADING WOLF    |  Balance  P&L  Drawdown  Positions    │
├──────────┬────────────────────────────────┬─────────────────┤
│          │                                │                 │
│ WATCHLIST│         PRICE CHART            │  OPEN POSITIONS │
│          │                                │                 │
│  Stocks  │    [Interactive Line Chart]    │   GBPUSD LONG   │
│  ┌─────┐ │                                │   Entry: 1.351  │
│  │ CRM │ │                                │   P&L: +£1.12   │
│  │NVDA │ │                                │                 │
│  │META │ │                                │  RISK METRICS   │
│  └─────┘ │                                │   Drawdown: 9%  │
│          │         VOLUME CHART           │   Win Rate: 27% │
│  Forex   │                                │                 │
│  EUR/USD │    [Interactive Bar Chart]     │ EARNINGS CAL    │
│  GBP/USD │                                │   NVDA TODAY 🔴 │
│  Gold    │                                │                 │
└──────────┴────────────────────────────────┴─────────────────┘
```

---

## 🎯 Next Steps

### Immediate Use
1. Open http://localhost:3002
2. Click **📊 TRADING** button
3. Monitor live market data
4. Track positions and P&L
5. Check earnings calendar

### Future Enhancements (Optional)
- [ ] Add real historical data from yfinance
- [ ] WebSocket for instant updates
- [ ] Trade execution interface
- [ ] Alerts for RSI extremes
- [ ] News feed integration (Finnhub)
- [ ] Mobile-responsive layout
- [ ] Dark/light theme toggle
- [ ] Export trading reports

---

## 🐛 Troubleshooting

**Dashboard not loading?**
- Check Mission Control is running: `npm run dev` (port 3002)
- Verify Python scripts exist in trading workspace
- Check terminal for errors

**No market data?**
- Ensure Python scripts are executable
- Check API keys in `.env.market_data`
- Verify trading workspace path in API routes

**Charts not showing?**
- Check `recharts` installed: `npm install recharts`
- Verify data format in console

---

## 📊 Data Sources

- **Stock Quotes** - yfinance (unlimited, free)
- **RSI/Technical** - Alpha Vantage (500 calls/day)
- **News** - Finnhub (60 calls/min)
- **Forex/Indices** - Capital.com API (demo account)

---

**Status:** ✅ **LIVE AND OPERATIONAL**

Built: 2026-02-26 10:36 GMT  
Version: 1.0.0  
Developer: Trading Wolf 🐺
