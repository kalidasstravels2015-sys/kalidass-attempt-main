import fs from 'node:fs';

async function test() {
  const envText = fs.readFileSync('.env', 'utf8');
  const apiKey = envText.match(/GEMINI_API_KEY\s*=\s*(.+)/)?.[1]?.trim();

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: 'chennai to tirupati 5 day package' }] }]
    })
  });
  const data = await res.json();
  const candidate = data.candidates?.[0];
  console.log('finishReason:', candidate?.finishReason);
  console.log('parts length:', candidate?.content?.parts?.length);
  fs.writeFileSync('raw-gemini.json', JSON.stringify(data, null, 2));
}
test();
