#!/usr/bin/env node
const { OpenClawClient, loadOpenClawIdentity } = require('openclaw-ws-client');

async function test() {
  console.log('🔌 Testing OpenClaw WebSocket connection...\n');
  
  const identity = await loadOpenClawIdentity();
  const client = new OpenClawClient({
    gatewayUrl: 'ws://127.0.0.1:18789',
    ...identity
  });
  
  client.onError((err) => console.error('❌ Error:', err.message));
  
  await client.connect();
  console.log('✅ Connected to Gateway\n');
  
  // Test agents.list
  const agents = await client.listAgents();
  console.log(`✅ Found ${agents.length} agents`);
  agents.slice(0, 3).forEach(a => console.log(`   - ${a.id}`));
  
  // Test sessions.list
  const sessions = await client.listSessions();
  console.log(`\n✅ Found ${sessions.length} sessions`);
  
  // Test status
  const status = await client.request('status', {});
  console.log(`\n✅ Gateway status: ${status.ok ? 'OK' : 'ERROR'}`);
  
  client.disconnect();
  console.log('\n✅ All tests passed!\n');
  process.exit(0);
}

test().catch(err => {
  console.error('\n❌ Test failed:', err.message);
  process.exit(1);
});
