import fs from 'node:fs';
import path from 'node:path';

async function runTest() {
  console.log('--- 🧪 Testing AI Chat Query Telemetry & Monitoring Pipeline ---');

  const testQuery = 'Hello, can I get Ertiga for Tirupati 1 day trip tomorrow morning?';
  const testSessionId = 'KT-TEST-' + Date.now().toString().slice(-4);
  const testSourcePage = '/services/tirupati-package/';

  console.log(`1. Posting test chat message to /api/ai-chat...`);
  const chatRes = await fetch('http://localhost:4321/api/ai-chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [
        { role: 'user', content: testQuery }
      ],
      sessionId: testSessionId,
      sourcePage: testSourcePage
    })
  });

  if (!chatRes.ok) {
    throw new Error(`POST /api/ai-chat failed with status ${chatRes.status}`);
  }

  const chatData = await chatRes.json();
  console.log('✅ Received AI Reply:', chatData.reply?.slice(0, 80) + '...');

  // 2. Verify CSV file
  console.log('2. Verifying Kalidass_Ai_Chat_Queries_2026.csv...');
  const csvPath = path.resolve(process.cwd(), 'Kalidass_Ai_Chat_Queries_2026.csv');
  if (!fs.existsSync(csvPath)) {
    throw new Error('CSV file Kalidass_Ai_Chat_Queries_2026.csv does not exist!');
  }

  const csvContent = fs.readFileSync(csvPath, 'utf8');
  if (!csvContent.includes(testSessionId)) {
    throw new Error(`CSV does not contain test sessionId: ${testSessionId}`);
  }
  if (!csvContent.includes('Tirupati Package')) {
    throw new Error('CSV does not contain detected intent "Tirupati Package"');
  }
  console.log('✅ Found logged query in CSV with detected intent "Tirupati Package"!');

  // 3. Verify GET /api/admin/chat-logs
  console.log('3. Fetching /api/admin/chat-logs...');
  const adminRes = await fetch('http://localhost:4321/api/admin/chat-logs');
  if (!adminRes.ok) {
    throw new Error(`GET /api/admin/chat-logs failed with status ${adminRes.status}`);
  }

  const adminData = await adminRes.json();
  if (!adminData.success || !Array.isArray(adminData.queries)) {
    throw new Error('Invalid response from /api/admin/chat-logs');
  }

  const foundQuery = adminData.queries.find(q => q.sessionId === testSessionId);
  if (!foundQuery) {
    throw new Error(`Query with sessionId ${testSessionId} not returned by /api/admin/chat-logs`);
  }

  console.log('✅ /api/admin/chat-logs successfully returned the query:', {
    queryId: foundQuery.queryId,
    timestamp: foundQuery.timestamp,
    intent: foundQuery.detectedIntent,
    userQuery: foundQuery.userQuery
  });

  console.log('\n🎉 ALL AI CHAT TELEMETRY TESTS PASSED SUCCESSFULLY! 🎉\n');
}

runTest().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
