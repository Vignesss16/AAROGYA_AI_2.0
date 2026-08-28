import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function test() {
  const customSymptoms = "हेलो डॉक्टर मुझे ना दो या तीन दिन से बुखार है और सर्दी खासी भी है मेरे मुझे और मुझे ऐसा नाक से पानी भी बह रहा है और थोड़ा सा सरदर्द भी है तो प्लीज मेरा इलाज कर दीजिये";
  
  const extPrompt = `Extract up to 5 main medical symptom keywords in English from this text. Return ONLY a comma-separated list of english keywords, nothing else.\nText: "${customSymptoms}"`;
  console.log("Prompt:", extPrompt);
  
  const apiKey = process.env.GROQ_API_KEY;
  console.log("Key exists?", !!apiKey);
  
  const resExt = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: "openai/gpt-oss-120b", messages: [{ role: "user", content: extPrompt }], temperature: 0.1 }),
  });
  
  if (!resExt.ok) {
    console.error("Failed:", await resExt.text());
    return;
  }
  
  const dataExt = await resExt.json();
  console.log("Extracted:", dataExt.choices[0].message.content);
}

test();
