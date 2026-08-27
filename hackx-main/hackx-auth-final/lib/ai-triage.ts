import { TriageResult } from "./triage";

export async function runAITriage(symptomNames: string[], customSymptoms?: string, context?: any): Promise<TriageResult> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey.trim() === "" || apiKey === "gsk_your_api_key_here") {
    throw new Error("GROQ_API_KEY is not configured — using fallback triage.");
  }

  let patientReports = symptomNames.join(", ");
  if (customSymptoms && customSymptoms.trim()) {
    patientReports += `\nAdditional Custom Symptoms: ${customSymptoms}`;
  }

  const { retrieveRAGContext, verifyWithWebSearch } = await import("./rag");

  // === STEP 1: RAG (CSV Dataset) Comparison ===
  const ragContext = await retrieveRAGContext([...symptomNames, customSymptoms || ""]);
  let ragText = "No direct matching disease found in the local medical CSV dataset.";
  if (ragContext) {
    ragText = `LOCAL DATASET MATCH:\nDisease: ${ragContext.Name}\nTreatments: ${ragContext.Treatments}\nContagious: ${ragContext.Contagious}, Chronic: ${ragContext.Chronic}`;
  }

  // Base LLM Prompt
  const prompt1 = `You are an expert medical triage AI.
Patient reports: ${patientReports}.
Context: ${JSON.stringify(context || {})}
RAG Dataset Match: ${ragText}

Classify urgency strictly into RED, YELLOW, or GREEN.
Respond ONLY with raw JSON:
{
  "urgency": "RED" or "YELLOW" or "GREEN",
  "conditionHi": "Hindi condition name max 6 words",
  "conditionEn": "English condition name max 6 words",
  "doNow": [{"hi":"Hindi action","en":"English action"}],
  "doNot": [{"hi":"Hindi avoid","en":"English avoid"}],
  "warnings": [{"hi":"Hindi warning","en":"English warning"}],
  "docType": {"hi":"Hindi specialist","en":"English specialist"},
  "wait": {"hi":"Hindi time","en":"English time"},
  "contagious": {"hi":"yes/no","en":"yes/no"},
  "emergency": true or false,
  "summary": "one clinical sentence max 15 words"
}`;

  const res1 = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: "openai/gpt-oss-120b", messages: [{ role: "user", content: prompt1 }], temperature: 0.1 }),
  });
  
  if (!res1.ok) throw new Error("API error on Step 1");
  const data1 = await res1.json();
  const initialTriage = JSON.parse(data1.choices[0].message.content.replace(/```json|```/g, "").trim());

  // === STEP 2: Web Search Verification ===
  // Simplify search string so Wikipedia search actually returns results
  const searchStr = `${initialTriage.conditionEn}`;
  const webContext = await verifyWithWebSearch(searchStr);

  const prompt2 = `You are a Senior Medical Verifier. 
Review the Initial Triage Decision against the live Web Search Results.

Patient Symptoms: ${patientReports}
Initial AI Triage: ${JSON.stringify(initialTriage)}
Web Search Results: ${webContext}
Local RAG Match: ${ragText}

Task:
1. Verify if the 'urgency' level is correct based on the web/RAG evidence. Adjust if necessary.
2. Provide a concise 'ragReasoning' (max 2-3 sentences) for the doctor explaining WHY this urgency was chosen. You MUST explicitly mention BOTH the "Local Dataset Match" AND the "Web Search Results" in your reasoning to show a comprehensive comparison. DO NOT mention confidence scores. Just state the clinical reasoning derived from both sources.

Respond ONLY with raw JSON matching the TriageResult interface, adding 'ragReasoning':
{
  "urgency": "RED" or "YELLOW" or "GREEN",
  "conditionHi": "...", "conditionEn": "...",
  "doNow": [...], "doNot": [...], "warnings": [...],
  "docType": {...}, "wait": {...}, "contagious": {...}, "emergency": true/false, "summary": "...",
  "ragReasoning": "Comparing the local dataset (which suggests X) and web evidence (which confirms Y), the urgency is Z because..."
}`;

  const res2 = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: "openai/gpt-oss-120b", messages: [{ role: "user", content: prompt2 }], temperature: 0.2 }),
  });

  if (!res2.ok) throw new Error("API error on Step 2");
  const data2 = await res2.json();
  const finalTriage = JSON.parse(data2.choices[0].message.content.replace(/```json|```/g, "").trim());

  return finalTriage as TriageResult;
}
