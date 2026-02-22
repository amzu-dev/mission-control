#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const WORKSPACE = '/Users/venkat/.openclaw/workspace';
const OUTPUT = path.join(__dirname, '../data/status.json');

console.log('Updating Mission Control dashboard...');

try {
  // Read workspace data
  const identity = fs.readFileSync(path.join(WORKSPACE, 'IDENTITY.md'), 'utf-8');
  const memoryDir = path.join(WORKSPACE, 'memory');
  const memoryFiles = fs.readdirSync(memoryDir)
    .filter(f => f.endsWith('.md'))
    .sort()
    .reverse()
    .slice(0, 10);

  const data = {
    updated: new Date().toISOString(),
    workspace: WORKSPACE,
    memoryCount: memoryFiles.length,
    lastUpdate: memoryFiles[0] || null
  };

  // Ensure data directory exists
  const dataDir = path.dirname(OUTPUT);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  fs.writeFileSync(OUTPUT, JSON.stringify(data, null, 2));
  console.log(`✅ Dashboard updated: ${data.lastUpdate}`);
} catch (error) {
  console.error('❌ Failed to update dashboard:', error.message);
  process.exit(1);
}
