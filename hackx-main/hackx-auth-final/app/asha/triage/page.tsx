"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const SYMPTOMS = [
  { id: "fever",      icon: "/icons/fever.png", hi: "बुखार",              en: "Fever" },
  { id: "chest",      icon: "/icons/chest_pain.png",  hi: "सीने में दर्द",      en: "Chest Pain" },
  { id: "breath",     icon: "/icons/breathlessness.png", hi: "सांस में तकलीफ",    en: "Breathlessness" },
  { id: "cough",      icon: "/icons/cough.png",  hi: "खांसी",              en: "Cough" },
  { id: "cold",       icon: "/icons/cold.png",  hi: "जुकाम",              en: "Cold / Runny Nose" },
  { id: "headache",   icon: "/icons/headache.png",  hi: "सिरदर्द",            en: "Headache" },
  { id: "vomit",      icon: "/icons/vomiting.png",  hi: "उल्टी",              en: "Vomiting" },
  { id: "diarrhea",   icon: "/icons/stomach_pain.png",  hi: "दस्त",               en: "Diarrhea" },
  { id: "rash",       icon: "/icons/skin_rash.png",  hi: "दाने / चकत्ते",     en: "Skin Rash" },
  { id: "pain",       icon: "/icons/joint_pain.png",  hi: "जोड़ों में दर्द",    en: "Joint Pain" },
  { id: "weakness",   icon: "/icons/weakness.png",  hi: "कमज़ोरी",            en: "Weakness" },
  { id: "stomach",    icon: "/icons/stomach_pain.png",  hi: "पेट में दर्द",       en: "Stomach Pain" },
  { id: "eyes",       icon: "/icons/eye_problem.png", hi: "आँखों में जलन",      en: "Eye Problem" },
  { id: "back",       icon: "/icons/back_pain.png",  hi: "कमर दर्द",           en: "Back Pain" },
  { id: "dizzy",      icon: "/icons/dizziness.png",  hi: "चक्कर",              en: "Dizziness" },
  { id: "swelling",   icon: "/icons/joint_pain.png",  hi: "सूजन",               en: "Swelling" },
  { id: "chills",     icon: "/icons/chills.png",  hi: "ठंड लगना / कंपकंपी", en: "Chills / Shivering" },
  { id: "body_ache",  icon: "/icons/body_ache.png",  hi: "पूरे शरीर में दर्द", en: "Body Ache" },
  { id: "sweat",      icon: "/icons/sweating.png",  hi: "अत्यधिक पसीना",      en: "Excessive Sweating" },
  { id: "urine_burn", icon: "/icons/burning_urination.png",  hi: "पेशाब में जलन",      en: "Burning Urination" },
  { id: "nausea",     icon: "/icons/nausea.png",  hi: "जी मिचलाना",         en: "Nausea" },
  { id: "unconscious",icon: "/icons/unconsciousness.png",  hi: "बेहोशी",             en: "Unconsciousness" },
  { id: "seizure",    icon: "/icons/seizures.png",  hi: "दौरे पड़ना",          en: "Seizures" },
  { id: "bleed",      icon: "/icons/unusual_bleeding.png",  hi: "असामान्य रक्तस्राव", en: "Unusual Bleeding" },
];

const C = { primary: "#1B6CA8", green: "#1E8449", red: "#C0392B", yellow: "#F39C12", purple: "#7D3C98", bg: "#F0F4F8", card: "#FFFFFF", text: "#1A2332", muted: "#6B7C93", border: "#DDE3EC" };

export default function ASHATriagePage() {
  const router = useRouter();
  const [symptoms, setSymptoms] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  
  const lang = typeof window !== "undefined" ? localStorage.getItem("lang") || "hi" : "hi";
  const T = (hi: string, en: string) => lang === "hi" ? hi : en;

  const toggle = (id: string) => setSelected(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);

  const handleTriage = async () => {
    if (!symptoms.trim() && selected.length === 0) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symptoms: selected, customSymptoms: symptoms, duration: "", diseases: [] }),
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const isBtnDisabled = loading || (!symptoms.trim() && selected.length === 0);

  return (
    <div style={{ background: "#0d1520", minHeight: "100vh", display: "flex", justifyContent: "center" }}>
      <div style={{ width: 390, background: C.bg, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", padding: "44px 14px 10px", gap: 10, background: C.card, borderBottom: `1px solid ${C.border}` }}>
          <button onClick={() => router.push("/asha/dashboard")} style={{ width: 36, height: 36, borderRadius: 10, background: C.bg, border: "none", fontSize: 18, cursor: "pointer" }}>←</button>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{T("AI Triage", "AI Triage Assistant")}</div>
            <div style={{ fontSize: 11, color: C.muted }}>{T("लक्षण दर्ज करें", "Enter patient symptoms")}</div>
          </div>
        </div>

        <div style={{ flex: 1, padding: 16, overflowY: "auto" }}>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 16 }}>
            {SYMPTOMS.map(sym => {
              const sel = selected.includes(sym.id);
              return (
                <div key={sym.id} onClick={() => toggle(sym.id)}
                  style={{ background: sel ? "#EBF4FD" : C.card, borderRadius: 14, border: `2px solid ${sel ? C.primary : C.border}`, padding: "10px 4px", display: "flex", flexDirection: "column", alignItems: "center", gap: 5, cursor: "pointer", transition: "all .18s", minHeight: 80, justifyContent: "center", position: "relative" }}>
                  {sel && <div style={{ position: "absolute", top: 4, right: 4, width: 16, height: 16, background: C.primary, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "white", fontWeight: 800 }}>✓</div>}
                  <img src={sym.icon} alt={sym.en} style={{ width: 32, height: 32, marginBottom: 4, objectFit: "contain" }} />
                  <div style={{ fontFamily: "var(--font-hi)", fontSize: 10, fontWeight: 600, textAlign: "center", color: sel ? C.primary : C.text, lineHeight: 1.3 }}>{lang === "hi" ? sym.hi : sym.en}</div>
                </div>
              );
            })}
          </div>

          <div style={{ background: C.card, borderRadius: 16, padding: 16, border: `1px solid ${C.border}` }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: C.text, display: "block", marginBottom: 8 }}>
              {T("अन्य लक्षण (विस्तार से)", "Other Symptoms (Detailed)")}
            </label>
            <textarea
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder={T("मरीज़ को क्या परेशानी है?", "What else is bothering the patient?")}
              style={{ width: "100%", height: 80, borderRadius: 12, border: `1px solid ${C.border}`, padding: 12, fontSize: 14, outline: "none", resize: "none", fontFamily: "inherit" }}
            />
            
            <button 
              onClick={handleTriage}
              disabled={isBtnDisabled}
              style={{ width: "100%", padding: 14, borderRadius: 12, border: "none", background: isBtnDisabled ? C.muted : `linear-gradient(135deg,${C.purple},#5B2C6F)`, color: "white", fontWeight: 700, fontSize: 14, marginTop: 16, cursor: isBtnDisabled ? "not-allowed" : "pointer", transition: "all 0.2s" }}
            >
              {loading ? T("विश्लेषण कर रहा है...", "Analyzing...") : T("AI से जांच करें", "Analyze with AI")}
            </button>
          </div>

          {result && (
            <div style={{ marginTop: 20, background: C.card, borderRadius: 16, padding: 16, border: `1px solid ${C.border}`, animation: "slideUp 0.3s ease-out" }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, margin: "0 0 12px 0", borderBottom: `1px solid ${C.border}`, paddingBottom: 8 }}>
                {T("AI विश्लेषण परिणाम", "AI Analysis Result")}
              </h3>
              
              <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                <div style={{ flex: 1, background: result.urgency === "RED" ? "#F9EBEA" : result.urgency === "YELLOW" ? "#FEF5E7" : "#EAFAF1", padding: 10, borderRadius: 8, border: `1px solid ${result.urgency === "RED" ? "#F1948A" : result.urgency === "YELLOW" ? "#F8C471" : "#82E0AA"}` }}>
                  <div style={{ fontSize: 10, color: C.muted, fontWeight: 700, marginBottom: 4 }}>{T("प्राथमिकता", "Priority")}</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: result.urgency === "RED" ? C.red : result.urgency === "YELLOW" ? C.yellow : C.green }}>
                    {result.urgency}
                  </div>
                </div>
              </div>

              {result.diagnosis_hi && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, marginBottom: 4 }}>{T("संभावित बीमारी", "Possible Condition")}</div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{lang === "hi" ? result.diagnosis_hi : result.diagnosis_en}</div>
                </div>
              )}

              {result.explanation_hi && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, marginBottom: 4 }}>{T("विवरण", "Explanation")}</div>
                  <div style={{ fontSize: 13, lineHeight: 1.5 }}>{lang === "hi" ? result.explanation_hi : result.explanation_en}</div>
                </div>
              )}

              {result.next_steps_hi && result.next_steps_hi.length > 0 && (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, marginBottom: 4 }}>{T("सुझाव / कदम", "Next Steps")}</div>
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.5 }}>
                    {(lang === "hi" ? result.next_steps_hi : result.next_steps_en).map((step: string, i: number) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
