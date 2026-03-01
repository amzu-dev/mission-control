#!/bin/bash
# Pre-Market Sync for Trading Wolf
# Ensures fresh data before UK and US trading sessions

echo "========================================="
echo "Trading Wolf - Pre-Market Sync"
echo "Time: $(date)"
echo "========================================="

# Trigger pre-market sync
response=$(curl -s -X POST http://localhost:3002/api/trading/pre-market-sync)

# Pretty print response
echo "$response" | jq '.'

# Check if successful
success=$(echo "$response" | jq -r '.success')

if [ "$success" = "true" ]; then
    echo "✅ Pre-market sync completed successfully"
    
    # Get summary
    stocks=$(echo "$response" | jq -r '.summary.stocksReady')
    positions=$(echo "$response" | jq -r '.summary.positionsReady')
    earnings=$(echo "$response" | jq -r '.summary.earningsToday')
    
    echo "📊 Stocks ready: $stocks"
    echo "💼 Positions tracked: $positions"
    echo "📅 Earnings today: $earnings"
else
    echo "❌ Pre-market sync failed"
    echo "$response" | jq -r '.error'
    exit 1
fi

echo "========================================="
