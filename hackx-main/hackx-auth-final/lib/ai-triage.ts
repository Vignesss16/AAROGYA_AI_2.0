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

  // === STEP 0: Extract Keywords from Voice Input for RAG ===
  let extractedKeywords: string[] = [];
  if (customSymptoms && customSymptoms.trim()) {
    try {
      const extPrompt = `Extract up to 5 main medical symptom keywords in English from this text. Return ONLY a comma-separated list of english keywords, nothing else.\nText: "${customSymptoms}"`;
      const resExt = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ model: "openai/gpt-oss-120b", messages: [{ role: "user", content: extPrompt }], temperature: 0.1 }),
      });
      if (resExt.ok) {
        const dataExt = await resExt.json();
        const keys = dataExt.choices[0].message.content.split(",");
        extractedKeywords = keys.map((k: string) => k.trim());
      }
    } catch (e) {
      console.error("Keyword extraction failed", e);
    }
  }

  // === STEP 1: RAG (CSV Dataset) Comparison ===
  const ragContext = await retrieveRAGContext([...symptomNames, ...extractedKeywords]);
  let ragText = "No direct matching disease found in the local medical CSV dataset.";
  if (ragContext && ragContext.length > 0) {
    ragText = "LOCAL DATASET TOP MATCHES:\n" + ragContext.map((r, i) => 
      `${i + 1}. Disease: ${r.Name}\n   Treatments: ${r.Treatments}\n   Contagious: ${r.Contagious}, Chronic: ${r.Chronic}`
    ).join("\n\n");
  }

  // Base LLM Prompt
  const prompt1 = `You are an expert medical triage AI.
Patient reports: ${patientReports}.
Context: ${JSON.stringify(context || {})}
RAG Dataset Match: ${ragText}

Classify urgency strictly into RED, YELLOW, or GREEN based on these rules:
- RED (Emergency): Life-threatening, severe pain, breathing difficulty, or critical condition.
- YELLOW (Needs Attention): Moderate symptoms requiring a doctor's visit within 24-48 hours, OR mild symptoms that have persisted for 3 or more days.
- GREEN (Routine/Self-care): Mild, common, self-limiting symptoms (e.g., isolated mild fever and cough) lasting less than 3 days.
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
1. Evaluate the 'Local RAG Match' first. These are just keyword matches. If the symptoms are mild (e.g., just fever and cough), DO NOT automatically select a severe disease like Pneumonia or Lung Abscess just because it is listed.
2. If one of the RAG matches is a highly accurate clinical fit, use it. However, if the matches are too severe, unlikely, or overkill for the basic symptoms provided, REJECT them entirely. Instead, diagnose a more common, realistic condition (like Viral Fever or Common Cold) using your own medical knowledge.
3. Next, cross-reference this baseline against the 'Web Search Results' to confirm the urgency level (RED/YELLOW/GREEN). Adjust the urgency if necessary, strictly using these rules:
   - RED: Life-threatening or critical.
   - YELLOW: Moderate, requires doctor in 24-48 hrs, OR mild symptoms lasting >= 3 days.
   - GREEN: Mild, common, self-limiting (e.g., isolated fever/cough) lasting < 3 days.
4. Finally, synthesize this combined data into your triage result.
5. Provide a simple, easy-to-understand 'ragReasoning' for the doctor. Keep it extremely brief and direct so a busy doctor can read it in 3 seconds. Write pure CLINICAL reasoning. DO NOT mention "Local Dataset", "Web Search", "RAG", or AI mechanics. Just explain the clinical logic (e.g., "Mild fever and cough without dyspnea suggests a common viral infection, requiring standard monitoring.").

Respond ONLY with raw JSON matching the TriageResult interface, adding 'ragReasoning':
{
  "urgency": "RED" or "YELLOW" or "GREEN",
  "conditionHi": "...", "conditionEn": "...",
  "doNow": [...], "doNot": [...], "warnings": [...],
  "docType": {...}, "wait": {...}, "contagious": {...}, "emergency": true/false, "summary": "...",
  "ragReasoning": "Clinical reasoning here..."
}`;

  const res2 = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: "openai/gpt-oss-120b", messages: [{ role: "user", content: prompt2 }], temperature: 0.2 }),
  });

  if (!res2.ok) throw new Error("API error on Step 2");
  const data2 = await res2.json();
  const finalTriage = JSON.parse(data2.choices[0].message.content.replace(/```json|```/g, "").trim());
  finalTriage.extractedKeywords = extractedKeywords;

  return finalTriage as TriageResult;
}
