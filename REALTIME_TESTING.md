# Real-Time Updates Testing Guide

## Quick Test

1. **Start dev server:**
   ```bash
   npm run dev
   ```

2. **Open browser:**
   ```
   http://localhost:3002
   ```

3. **Verify "LIVE" indicator:**
   - Look for green pulsing dot next to "MISSION CONTROL" in top bar
   - Should say "LIVE" next to the dot when connected
   - System Info panel should show "● LIVE" under REALTIME

4. **Trigger an event:**
   ```bash
   # In a separate terminal
   openclaw chat -a main "hello world"
   ```

5. **Watch for auto-refresh:**
   - Dashboard should update automatically
   - No page reload needed
   - Check browser console for `[Dashboard] Received event` logs

## What to Look For

### ✅ Success Indicators
- Green pulsing dot in top bar
- "LIVE" label appears
- System Info shows "● LIVE" (green)
- Console logs: `[Realtime] Connected to event stream`
- Dashboard updates when you trigger agent actions

### ❌ Failure Indicators
- Gray dot in top bar
- "Connecting..." or "○ OFFLINE" status
- Console errors: `[Realtime] Connection lost`
- Dashboard doesn't update on agent actions

## Event Types to Test

### 1. Agent Status
```bash
# Create a new agent
openclaw agents create test-realtime
```
**Expected:** Dashboard refreshes, new agent appears

### 2. Session Update
```bash
# Start a chat
openclaw chat -a main "test message"
```
**Expected:** Agent hierarchy updates, tokens increment

### 3. Presence
```bash
# Stop/start gateway
openclaw gateway restart
```
**Expected:** Connection drops, then reconnects

## Browser Console Logs

### Normal Operation
```
[Realtime] Connected to event stream
[Dashboard] Received event: connected
[Dashboard] Received event: agent.status
[Dashboard] Refreshing data due to event
```

### Connection Issues
```
[Realtime] Connection lost, reconnecting...
[Realtime] Connected to event stream  (after 3s)
```

## Server Logs (Terminal)

### Expected Output
```
[SSE] Event stream started, subscribed to events
: ping
: ping
: ping
```

### On Event
```
data: {"type":"agent.status","payload":{...}}
data: {"type":"session.updated","payload":{...}}
```

## Advanced Testing

### 1. Long-running Connection
- Leave dashboard open for 5+ minutes
- Verify keep-alive pings (every 30s)
- Check in Network tab → `/api/events` → should stay open

### 2. Network Interruption
- Open browser DevTools → Network tab
- Right-click → Throttle to "Offline"
- Wait 5 seconds
- Set back to "No throttling"
- Should reconnect automatically within 3s

### 3. Multiple Events
```bash
# Rapid-fire events
for i in {1..5}; do
  openclaw chat -a main "test $i"
  sleep 2
done
```
**Expected:** Dashboard updates after each event

## Debugging

### Check Gateway Connection
```bash
# Verify gateway is running
openclaw gateway status

# Check WebSocket endpoint
curl http://127.0.0.1:18789
```

### Check SSE Endpoint
```bash
# In browser, navigate to:
http://localhost:3002/api/events

# Should see:
data: {"type":"connected"}
: ping
: ping
```

### Browser Network Tab
1. Open DevTools (F12)
2. Go to Network tab
3. Filter: "events"
4. Click on `/api/events`
5. Go to EventStream tab
6. Should see live events

## Known Issues

### "Connecting..." stays gray
- **Cause:** Gateway not running or not accessible
- **Fix:** `openclaw gateway start`

### No events appearing
- **Cause:** Event listeners not registered
- **Fix:** Check console for errors, restart dev server

### Connection drops repeatedly
- **Cause:** Network instability or port conflicts
- **Fix:** Check other services on port 3002, restart dev server

## Success Criteria

✅ Green "LIVE" indicator appears within 2 seconds of page load  
✅ Dashboard auto-refreshes when agent actions occur  
✅ Connection survives 5+ minutes without dropping  
✅ Auto-reconnects within 3 seconds after network interruption  
✅ No console errors in browser or terminal  
✅ Events appear in browser Network tab → EventStream  

---

**If all criteria pass, real-time updates are working perfectly! 🎉**
