// Adegram AI Backend - Render
// GROQ_API_KEY must be set in Render > Environment Variables
// Never put real key inside this file
const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(__dirname));
app.use(require('cors')());

const OWNER = {
  name: "Abdulrazaq Adebisi",
  email: "abdulrazaqadebisi2@gmail.com",
  phone: "08072868277",
  whatsapp: "https://wa.me/2348072868277",
  kofi: "https://ko-fi.com/adegramstudio",
  fiverr: "https://www.fiverr.com/pe/50baey1",
  studio: "Adegram Studio",
  location: "Lagos, Nigeria"
};

const PROMPTS = {
  advertise: `You are Adegram AI, official assistant for Adegram Studio. Owner is Abdulrazaq Adebisi from Lagos, Nigeria. Email: abdulrazaqadebisi2@gmail.com, Phone/WhatsApp: 08072868277 / https://wa.me/2348072868277, Ko-fi: https://ko-fi.com/adegramstudio, Fiverr: https://www.fiverr.com/pe/50baey1. Services: AI Characters $150, Adeola Game Model Pack $110, Websites, Graphics, Game Models, All Tech Services. Characters: Adeola Lagos 2099, Oba Lion Knight, Aisha, Zainab, Ada, Full Bundle $299, Knight Pack $199. Always be friendly, short, use Nigerian Pidgin lightly. ALWAYS end every answer with price + WhatsApp + Fiverr link if buyer asks about product/service. Never claim to be human. Delivery in 3 days via Email/Drive.`,
  free: `You are Adegram AI, a smart helpful assistant created by Abdulrazaq Adebisi, owner of Adegram Studio in Lagos, Nigeria. You can answer ANY question - general knowledge, school, coding, business, writing, translation, ideas, anything. Be friendly, short, and clear. You also know Adegram Studio: Owner Abdulrazaq Adebisi, Email abdulrazaqadebisi2@gmail.com, Phone 08072868277, WhatsApp https://wa.me/2348072868277, Ko-fi https://ko-fi.com/adegramstudio, Fiverr https://www.fiverr.com/pe/50baey1. Services: AI Characters $150, Adeola Pack $110, Websites, Graphics, Game Models, Full Bundle $299. Rule: Answer the user's question first, fully. THEN, only if it makes sense, add ONE short line about Adegram Studio. Do not force selling on every reply.`
};

app.get('/health', (req, res) => res.json({ ok: true, studio: 'Adegram Studio', owner: OWNER.name }));

app.post('/api/chat', async (req, res) => {
  try {
    const { message, mode } = req.body;
    if (!message) return res.status(400).json({ error: 'No message' });

    const GROQ_KEY = process.env.GROQ_API_KEY;
    console.log('GROQ KEY EXISTS?', !!GROQ_KEY);

    if (!GROQ_KEY) {
      return res.json({ reply: `Offline mode (No GROQ_API_KEY for Render yet). I am Adegram AI for ${OWNER.studio}, owner ${OWNER.name}. AI Characters $150, Adeola $110, Websites, Graphics. WhatsApp ${OWNER.phone} - ${OWNER.whatsapp} | Fiverr ${OWNER.fiverr}`, mode: 'offline' });
    }

    const system = PROMPTS[mode === 'free' ? 'free' : 'advertise'];

    // NEW MODELS FOR 2026 - tries one by one if one fails
    const MODELS = ['openai/gpt-oss-120b', 'llama-3.1-8b-instant', 'openai/gpt-oss-20b'];
    let groqData = null;
    let lastError = '';

    for (const model of MODELS) {
      try {
        console.log('Trying model:', model);
        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: model,
            messages: [
              { role: 'system', content: system },
              { role: 'user', content: message }
            ],
            temperature: 0.7,
            max_tokens: 600
          })
        });
        const data = await groqRes.json();
        if (!data.error) { groqData = data; break; }
        lastError = data.error.message;
        console.log('Model failed:', model, lastError);
      } catch (e) {
        lastError = e.message;
        console.log('Fetch failed:', model, lastError);
      }
    }

    if (!groqData) {
      return res.status(500).json({ error: 'Groq failed: ' + lastError });
    }

    res.json({ reply: groqData.choices[0].message.content, mode: mode || 'advertise' });
  } catch (e) {
    console.log('Server error:', e.message);
    res.status(500).json({ error: 'Server error: ' + e.message });
  }
});

app.listen(PORT, () => console.log(`Adegram AI running on port ${PORT}`));
