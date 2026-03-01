#!/bin/bash
# Daily Watchlist Update for Trading Wolf
# Analyzes market and updates Core + Volatile watchlists
# Run at 06:00 GMT daily (before markets open)

echo "========================================="
echo "Trading Wolf - Daily Watchlist Update"
echo "Time: $(date)"
echo "========================================="

# Trigger watchlist analysis
response=$(curl -s -X POST http://localhost:3002/api/trading/watchlist-manager)

# Pretty print response
echo "$response" | jq '.'

# Check if successful
success=$(echo "$response" | jq -r '.success')

if [ "$success" = "true" ]; then
    echo ""
    echo "✅ Watchlist update completed successfully"
    echo ""
    
    # Show Core (Trading Wolf 10)
    echo "🏆 TRADING WOLF 10 (CORE):"
    echo "$response" | jq -r '.results.core.top10[] | "  \(.symbol) - Score: \(.score) - \(.reason)"'
    
    echo ""
    
    # Show Volatile (Hot List)
    echo "🔥 HOT LIST (VOLATILE):"
    echo "$response" | jq -r '.results.volatile.top10[] | "  \(.symbol) - Score: \(.score) - \(.reason)"'
    
else
    echo "❌ Watchlist update failed"
    echo "$response" | jq -r '.error'
    exit 1
fi

echo "========================================="
