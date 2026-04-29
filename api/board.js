// AI董事會後端代理
// API Keys存在Vercel環境變數，前端不接觸任何Key

export default async function handler(req, res) {
// CORS headers
res.setHeader(‘Access-Control-Allow-Origin’, ‘*’);
res.setHeader(‘Access-Control-Allow-Methods’, ‘POST, OPTIONS’);
res.setHeader(‘Access-Control-Allow-Headers’, ‘Content-Type’);

if (req.method === ‘OPTIONS’) {
return res.status(200).end();
}

if (req.method !== ‘POST’) {
return res.status(405).json({ error: ‘Method not allowed’ });
}

const { provider, payload } = req.body;

if (!provider || !payload) {
return res.status(400).json({ error: ‘Missing provider or payload’ });
}

try {
let result;

```
switch (provider) {
  case 'claude':
    result = await callClaude(payload);
    break;
  case 'gemini':
    result = await callGemini(payload);
    break;
  case 'gpt':
    result = await callGPT(payload);
    break;
  default:
    return res.status(400).json({ error: `Unknown provider: ${provider}` });
}

return res.status(200).json({ result });
```

} catch (err) {
console.error(`[${provider}] Error:`, err.message);
return res.status(500).json({ error: err.message });
}
}

// ── Claude ──────────────────────────────────────────
async function callClaude(payload) {
const key = process.env.ANTHROPIC_API_KEY;
if (!key) throw new Error(‘ANTHROPIC_API_KEY 未設定’);

const response = await fetch(‘https://api.anthropic.com/v1/messages’, {
method: ‘POST’,
headers: {
‘Content-Type’: ‘application/json’,
‘x-api-key’: key,
‘anthropic-version’: ‘2023-06-01’,
},
body: JSON.stringify(payload),
});

const data = await response.json();
if (data.error) throw new Error(`Claude: ${data.error.message}`);
if (!data.content?.[0]?.text) throw new Error(‘Claude 回應為空’);
return data.content[0].text;
}

// ── Gemini ──────────────────────────────────────────
async function callGemini(payload) {
const key = process.env.GEMINI_API_KEY;
if (!key) throw new Error(‘GEMINI_API_KEY 未設定’);

const { systemPrompt, userMessage } = payload;

const response = await fetch(
`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
{
method: ‘POST’,
headers: { ‘Content-Type’: ‘application/json’ },
body: JSON.stringify({
system_instruction: { parts: [{ text: systemPrompt }] },
contents: [{ role: ‘user’, parts: [{ text: userMessage }] }],
generationConfig: { temperature: 0.3, maxOutputTokens: 2500 },
}),
}
);

const data = await response.json();
if (data.error) throw new Error(`Gemini: ${data.error.message}`);
if (!data.candidates?.[0]) throw new Error(‘Gemini 回應為空或被封鎖’);
return data.candidates[0].content.parts[0].text;
}

// ── GPT ─────────────────────────────────────────────
async function callGPT(payload) {
const key = process.env.OPENAI_API_KEY;
if (!key) throw new Error(‘OPENAI_API_KEY 未設定’);

const response = await fetch(‘https://api.openai.com/v1/chat/completions’, {
method: ‘POST’,
headers: {
‘Content-Type’: ‘application/json’,
Authorization: `Bearer ${key}`,
},
body: JSON.stringify(payload),
});

const data = await response.json();
if (data.error) throw new Error(`GPT: ${data.error.message}`);
if (!data.choices?.[0]) throw new Error(‘GPT 回應為空’);
return data.choices[0].message.content;
}
