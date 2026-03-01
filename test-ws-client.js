// Quick test of the WebSocket client
const { getOpenClawClient } = require('./app/lib/openclaw-client.ts');

async function test() {
  try {
    console.log('🔌 Connecting to OpenClaw Gateway...');
    const client = await getOpenClawClient();
    console.log('✅ Connected!');
    
    console.log('\n📊 Fetching sessions...');
    const sessionsResponse = await client.request('sessions.list', {});
    console.log(`Found ${sessionsResponse.payload?.sessions?.length || 0} sessions`);
    
    console.log('\n🤖 Fetching agents...');
    const agentsResponse = await client.request('agents.list', {});
    console.log(`Found ${agentsResponse.payload?.length || 0} agents`);
    
    console.log('\n✅ All tests passed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

test();
