#!/bin/bash
# Auto-sync scheduler for Trading Wolf
# Runs every minute and intelligently decides what to sync based on time and quotas

# Add this to your system crontab:
# * * * * * /Users/venkat/projects/mission-control-2/scripts/auto-sync.sh >> /tmp/trading-autosync.log 2>&1

echo "=== Trading Wolf Auto-Sync ==="
echo "Time: $(date)"

# Call the auto-sync API
curl -s -X POST http://localhost:3002/api/trading/auto-sync \
  -H "Content-Type: application/json" | jq .

echo ""
