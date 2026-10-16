import fs from 'node:fs';

async function test() {
  const res = await fetch('http://localhost:4321/api/ai-chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [{ role: 'user', content: 'chennai to tirupati 5 day package' }]
    })
  });
  const data = await res.json();
  fs.writeFileSync('test-reply.txt', data.reply || JSON.stringify(data));
  console.log('Saved to test-reply.txt. Length:', (data.reply || '').length);
}
test();
