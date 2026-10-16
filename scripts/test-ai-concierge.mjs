// scripts/test-ai-concierge.mjs
// Comprehensive automated test suite for Kalidass Travels AI Concierge

import assert from 'node:assert';
import { processAiConciergeQuery } from '../src/lib/aiConciergeEngine.ts';

console.log('🚀 Starting AI Concierge Automated Tests...\n');

let passedTests = 0;
let totalTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`✅ [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`❌ [FAIL] ${name}`);
    console.error(`   Error: ${err.message}`);
  }
}

// ─── TEST 1: Multi-Turn Tirupati Flow (User's Exact Screenshot Case) ─────────
runTest('Multi-Turn: Tirupati 1-day -> "for 2 days ?" -> "what about Innova Crysta?"', () => {
  // Turn 1
  const t1 = processAiConciergeQuery([
    { role: 'user', content: 'How much for Chennai to Tirupati 1-day package in Sedan and Ertiga?' }
  ]);
  assert.ok(t1.reply.includes('6,000'), 'Turn 1 must quote Sedan ₹6,000');
  assert.ok(t1.reply.includes('7,500'), 'Turn 1 must quote Ertiga ₹7,500');
  assert.ok(t1.reply.includes('TIRUPATI 1-Day Package'), 'Turn 1 must identify Tirupati 1-day');

  // Turn 2
  const t2 = processAiConciergeQuery([
    { role: 'user', content: 'How much for Chennai to Tirupati 1-day package in Sedan and Ertiga?' },
    { role: 'assistant', content: t1.reply },
    { role: 'user', content: 'for 2 days ?' }
  ]);
  assert.ok(t2.reply.includes('TIRUPATI 2-Day Package'), 'Turn 2 must maintain Tirupati and switch to 2-day');
  assert.ok(t2.reply.includes('9,500'), 'Turn 2 must quote Sedan ₹9,500');
  assert.ok(t2.reply.includes('11,500'), 'Turn 2 must quote Ertiga ₹11,500');
  assert.ok(!t2.reply.includes('I can instantly quote fares for you:'), 'Turn 2 must NOT fall back to greeting');

  // Turn 3
  const t3 = processAiConciergeQuery([
    { role: 'user', content: 'How much for Chennai to Tirupati 1-day package in Sedan and Ertiga?' },
    { role: 'assistant', content: t1.reply },
    { role: 'user', content: 'for 2 days ?' },
    { role: 'assistant', content: t2.reply },
    { role: 'user', content: 'what about Innova Crysta?' }
  ]);
  assert.ok(t3.reply.includes('16,000'), 'Turn 3 must quote Crysta 2-day ₹16,000');
  assert.ok(t3.reply.includes('Crysta'), 'Turn 3 must specify Crysta');
});

// ─── TEST 2: Policy & Advance Questions ──────────────────────────────────────
runTest('Multi-Turn: Inquiring about ₹500 advance deposit and cancellation', () => {
  const t = processAiConciergeQuery([
    { role: 'user', content: 'Chennai to Tirupati 1 day' },
    { role: 'assistant', content: 'Tirupati 1-day rates...' },
    { role: 'user', content: 'how much is advance?' }
  ]);
  assert.ok(t.reply.includes('₹500 advance'), 'Must mention nominal ₹500 advance');
  assert.ok(t.reply.includes('lock cab') || t.reply.includes('lock your cab'), 'Must explain locking cab');
  assert.ok(t.reply.includes('Post-Trip') || t.reply.includes('post-trip'), 'Must explain balance post-trip');
  assert.ok(t.reply.includes('TIRUPATI'), 'Must remember Tirupati context');

  const cancel = processAiConciergeQuery([
    { role: 'user', content: 'what is your cancellation policy?' }
  ]);
  assert.ok(cancel.reply.includes('6 hours'), 'Must cite 6 hours cancellation window');
  assert.ok(cancel.reply.includes('100% full refund'), 'Must cite 100% full refund');
});

// ─── TEST 3: Outstation Dynamic Route Calculation ────────────────────────────
runTest('Outstation: Bangalore round trip calculation', () => {
  const t = processAiConciergeQuery([
    { role: 'user', content: 'What is the rate for Chennai to Bangalore 2 days round trip?' }
  ]);
  assert.ok(t.reply.includes('BANGALORE'), 'Must detect Bangalore');
  assert.ok(t.reply.includes('692 km'), 'Must calculate ~692 km round trip');
  assert.ok(t.reply.includes('10,488'), 'Must calculate Sedan ~₹10,488');
  assert.ok(t.reply.includes('12,764'), 'Must calculate Ertiga ~₹12,764');
});

// ─── TEST 4: Chennai Local Rental ────────────────────────────────────────────
runTest('Local: Chennai 8-hour city rental package', () => {
  const t = processAiConciergeQuery([
    { role: 'user', content: 'What are Chennai local 8 hour packages?' }
  ]);
  assert.ok(t.reply.includes('2,200'), 'Sedan 8hr must be ₹2,200');
  assert.ok(t.reply.includes('2,800'), 'Ertiga 8hr must be ₹2,800');
  assert.ok(t.reply.includes('₹0 advance'), 'Local rental must feature ₹0 advance');
});

// ─── TEST 5: Chennai Airport Taxi Transfers ──────────────────────────────────
runTest('Airport: Velachery to Chennai Airport transfer', () => {
  const t = processAiConciergeQuery([
    { role: 'user', content: 'Need cab from Velachery to Chennai Airport tomorrow' }
  ]);
  assert.ok(t.reply.includes('Velachery'), 'Must identify Velachery');
  assert.ok(t.reply.includes('650'), 'Must quote Sedan ₹650');
  assert.ok(t.reply.includes('850'), 'Must quote Ertiga ₹850');
  assert.ok(t.reply.includes('Flight Tracking') || t.reply.includes('flight tracking'), 'Must highlight flight tracking');
});

// ─── TEST 6: Acting Driver Service ───────────────────────────────────────────
runTest('Acting Driver: 8 hours in Chennai for personal car', () => {
  const t = processAiConciergeQuery([
    { role: 'user', content: 'Need acting driver for my car in Chennai for 8 hours' }
  ]);
  assert.ok(t.reply.includes('800'), '8hr acting driver must be ₹800');
  assert.ok(t.reply.includes('PVC') || t.reply.includes('Police Background'), 'Must highlight PVC police verification');
});

// ─── TEST 7: Tamil Language Queries ──────────────────────────────────────────
runTest('Tamil: திருப்பதி 1 நாள் மற்றும் 2 நாள் கட்டணம்', () => {
  const t1 = processAiConciergeQuery([
    { role: 'user', content: 'திருப்பதி 1 நாள் கட்டணம் எவ்வளவு?' }
  ]);
  assert.ok(t1.reply.includes('6,000'), 'Tamil 1-day must include 6,000');
  assert.ok(t1.reply.includes('திருப்பதி'), 'Must reply in Tamil');

  const t2 = processAiConciergeQuery([
    { role: 'user', content: 'திருப்பதி 1 நாள் கட்டணம் எவ்வளவு?' },
    { role: 'assistant', content: t1.reply },
    { role: 'user', content: '2 நாட்களுக்கு எவ்வளவு?' }
  ]);
  assert.ok(t2.reply.includes('9,500'), 'Tamil 2-day must include 9,500');
  assert.ok(t2.reply.includes('11,500'), 'Tamil 2-day must include 11,500');
});

// ─── TEST 8: HTTP Endpoint Verification ──────────────────────────────────────
async function testHttpEndpoint() {
  totalTests++;
  try {
    const res = await fetch('http://localhost:4321/api/ai-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { role: 'user', content: 'How much for Chennai to Tirupati 1-day package in Sedan and Ertiga?' },
          { role: 'assistant', content: 'Sedan Rs 6,000, Ertiga Rs 7,500' },
          { role: 'user', content: 'for 2 days ?' }
        ]
      })
    });
    assert.strictEqual(res.status, 200, 'HTTP status must be 200');
    const data = await res.json();
    assert.ok(data.success, 'Response must be success: true');
    assert.ok(data.reply.includes('9,500'), 'Response must quote Tirupati 2-day Sedan ₹9,500');
    assert.ok(data.reply.includes('11,500'), 'Response must quote Tirupati 2-day Ertiga ₹11,500');
    console.log(`✅ [PASS] HTTP Endpoint /api/ai-chat multi-turn 2-day Tirupati response`);
    passedTests++;
  } catch (err) {
    console.error(`❌ [FAIL] HTTP Endpoint /api/ai-chat: ${err.message}`);
  }

  console.log(`\n========================================`);
  console.log(`🏁 Test Results: ${passedTests}/${totalTests} Tests Passed`);
  console.log(`========================================\n`);

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

testHttpEndpoint();
