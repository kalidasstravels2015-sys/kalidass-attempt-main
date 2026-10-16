import fs from 'node:fs';

async function test() {
  const envText = fs.readFileSync('.env', 'utf8');
  const apiKey = envText.match(/GEMINI_API_KEY\s*=\s*(.+)/)?.[1]?.trim();

  for (const model of ['gemini-3.8-flash', 'gemini-3.5-flash', 'gemini-3-flash', 'gemini-flash-latest']) {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: 'chennai to tirupati 5 day package' }] }]
      })
    });
    console.log(model, 'Status:', res.status);
    if (res.ok) {
      const data = await res.json();
      console.log(model, 'Length:', data.candidates?.[0]?.content?.parts?.[0]?.text?.length);
      break;
    }
  }
}
test();
