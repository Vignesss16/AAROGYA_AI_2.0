"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";

const C = { primary: "#27AE60", primaryDark: "#1E8449", green: "#27AE60", red: "#C0392B", bg: "#F0F4F8", card: "#FFFFFF", text: "#1A2332", muted: "#6B7C93", border: "#DDE3EC", accent: "#E8F8EF" };

export default function ASHAVitalSignsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [lang, setLang] = useState("hi");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [voiceSuccessMsg, setVoiceSuccessMsg] = useState("");
  const [activeVoiceField, setActiveVoiceField] = useState<"all" | "name" | "phone" | "notes" | null>(null);

  const [form, setForm] = useState({
    patientPhone: "",
    patientName: "",
    bpSystolic: "",
    bpDiastolic: "",
    heartRate: "",
    temperature: "",
    spo2: "",
    weight: "",
    randomBloodSugar: "",
    respiratoryRate: "",
    notes: "",
  });

  const T = (hi: string, en: string) => lang === "hi" ? hi : en;
  const ashaPhone = session?.user?.phone || "";
  const ashaName = session?.user?.name || "";

  const speechLang = lang === "hi" ? "hi-IN" : "en-IN";
  const { isListening, transcript, isSupported, startListening, stopListening } = useSpeechRecognition({
    lang: speechLang,
    continuous: false,
    interimResults: true,
  });

  const speak = (msg: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(msg);
      u.lang = lang === "hi" ? "hi-IN" : "en-IN";
      u.rate = 1.0;
      window.speechSynthesis.speak(u);
    }
  };

  useEffect(() => {
    setLang(localStorage.getItem("lang") || "hi");
    if (status === "unauthenticated" || session?.user?.role !== "ashaworker") router.replace("/asha/login");
  }, [status]);

  // Voice transcript parser
  useEffect(() => {
    if (!transcript || !activeVoiceField) return;

    if (activeVoiceField === "name") {
      const cleaned = transcript.replace(/^(name is|naam hai|patient|mareez|mariz|naam|name)\s*/i, "").trim();
      setForm(prev => ({ ...prev, patientName: cleaned }));
    } else if (activeVoiceField === "phone") {
      const digits = transcript.replace(/\D/g, "").slice(0, 10);
      if (digits) setForm(prev => ({ ...prev, patientPhone: digits }));
    } else if (activeVoiceField === "notes") {
      setForm(prev => ({ ...prev, notes: prev.notes ? prev.notes + " " + transcript : transcript }));
    } else if (activeVoiceField === "all") {
      parseFullVitalsVoice(transcript);
    }
  }, [transcript]);

  const parseFullVitalsVoice = (text: string) => {
    const updates: Partial<typeof form> = {};

    // 1. Phone number (10 digits)
    const phoneMatch = text.match(/\b\d{10}\b/);
    if (phoneMatch) updates.patientPhone = phoneMatch[0];

    // 2. Patient Name
    const nameMatch = text.match(/(?:मरीज़(?: का)? नाम|नाम|patient name|name is|patient)\s+([a-zA-Z\u0900-\u097F\s]{2,25}?)(?=\s+(?:फ़ोन|phone|बीपी|bp|pulse|पल्स|ऑक्सीजन|oxygen|शुगर|sugar|$))/i);
    if (nameMatch && nameMatch[1]) {
      updates.patientName = nameMatch[1].trim();
    }

    // 3. Blood Pressure: e.g. "BP 120 80", "BP 120 by 80", "बीपी 120 80", "बीपी 120 और 80"
    const bpMatch = text.match(/(?:bp|बीपी|ब्लड प्रेशर|blood pressure)\s*(?:is|है)?\s*(\d{2,3})\s*(?:by|बाय|\/|और|and|\s)\s*(\d{2,3})/i);
    if (bpMatch) {
      updates.bpSystolic = bpMatch[1];
      updates.bpDiastolic = bpMatch[2];
    } else {
      const singleBp = text.match(/(?:bp|बीपी)\s*(\d{2,3})/i);
      if (singleBp) updates.bpSystolic = singleBp[1];
    }

    // 4. Heart Rate / Pulse: e.g. "पल्स 72", "heart rate 75", "धड़कन 80"
    const pulseMatch = text.match(/(?:heart rate|pulse|पल्स|हार्ट रेट|धड़कन)\s*(?:is|है)?\s*(\d{2,3})/i);
    if (pulseMatch) updates.heartRate = pulseMatch[1];

    // 5. SpO2 / Oxygen: e.g. "ऑक्सीजन 98", "spo2 97", "oxygen 99 percent"
    const spo2Match = text.match(/(?:oxygen|spo2|ऑक्सीजन|sp o2)\s*(?:is|है)?\s*(\d{2,3})/i);
    if (spo2Match) updates.spo2 = spo2Match[1];

    // 6. Temperature: e.g. "बुखार 99", "temperature 98.6", "तापमान 100"
    const tempMatch = text.match(/(?:temperature|temp|तापमान|बुखार|fevar|fever)\s*(?:is|है)?\s*(\d{2,3}(?:\.\d+)?)/i);
    if (tempMatch) updates.temperature = tempMatch[1];

    // 7. Weight: e.g. "वजन 60", "weight 65 kg"
    const weightMatch = text.match(/(?:weight|वजन|वेट|weight is)\s*(\d{2,3}(?:\.\d+)?)/i);
    if (weightMatch) updates.weight = weightMatch[1];

    // 8. Sugar: e.g. "शुगर 130", "sugar 140", "blood sugar 120"
    const sugarMatch = text.match(/(?:sugar|शुगर|blood sugar|ब्लड शुगर)\s*(?:is|है)?\s*(\d{2,3})/i);
    if (sugarMatch) updates.randomBloodSugar = sugarMatch[1];

    // 9. Respiratory Rate: e.g. "सांस 16", "respiratory 18"
    const respMatch = text.match(/(?:respiration|respiratory|सांस की गति|सांस)\s*(?:is|है)?\s*(\d{1,2})/i);
    if (respMatch) updates.respiratoryRate = respMatch[1];

    setForm(prev => ({ ...prev, ...updates }));
    setVoiceSuccessMsg(T("वाइटल्स वॉइस से भर दिए गए!", "Vitals auto-filled from voice!"));
    speak(T("वाइटल संकेत दर्ज कर लिए गए हैं", "Vital signs recorded"));
  };

  const toggleVoice = (field: "all" | "name" | "phone" | "notes") => {
    if (isListening && activeVoiceField === field) {
      stopListening();
      setActiveVoiceField(null);
    } else {
      setActiveVoiceField(field);
      setVoiceSuccessMsg("");
      startListening(speechLang);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/vital-signs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          bpSystolic: form.bpSystolic ? parseFloat(form.bpSystolic) : null,
          bpDiastolic: form.bpDiastolic ? parseFloat(form.bpDiastolic) : null,
          heartRate: form.heartRate ? parseFloat(form.heartRate) : null,
          temperature: form.temperature ? parseFloat(form.temperature) : null,
          spo2: form.spo2 ? parseFloat(form.spo2) : null,
          weight: form.weight ? parseFloat(form.weight) : null,
          randomBloodSugar: form.randomBloodSugar ? parseFloat(form.randomBloodSugar) : null,
          respiratoryRate: form.respiratoryRate ? parseFloat(form.respiratoryRate) : null,
          recordedBy: ashaPhone,
          recordedByName: ashaName,
          recordedAt: new Date(),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
        speak(T("वाइटल सफलतापूर्वक सुरक्षित हो गया", "Vital signs recorded successfully"));
        setTimeout(() => { setSuccess(false); router.push("/asha/dashboard"); }, 1800);
      } else {
        alert("Error: " + data.error);
      }
    } catch (err) {
      alert("Failed to record vital signs");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>⏳</div>;
  if (!session) return null;

  const vitalFields = [
    { label: "BP Systolic", key: "bpSystolic", unit: "mmHg", icon: "❤️", placeholder: "120" },
    { label: "BP Diastolic", key: "bpDiastolic", unit: "mmHg", icon: "❤️", placeholder: "80" },
    { label: "Heart Rate", key: "heartRate", unit: "bpm", icon: "💓", placeholder: "72" },
    { label: "Temperature", key: "temperature", unit: "°F", icon: "🌡️", placeholder: "98.6" },
    { label: "SpO2", key: "spo2", unit: "%", icon: "🫁", placeholder: "98" },
    { label: "Weight", key: "weight", unit: "kg", icon: "⚖️", placeholder: "65" },
    { label: "Random Blood Sugar", key: "randomBloodSugar", unit: "mg/dL", icon: "🩸", placeholder: "140" },
    { label: "Respiratory Rate", key: "respiratoryRate", unit: "breaths/min", icon: "💨", placeholder: "16" },
  ];

  return (
    <div style={{ background: "#0d1520", minHeight: "100vh", display: "flex", justifyContent: "center" }}>
      <div style={{ width: 390, background: C.bg, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", padding: "10px 14px", gap: 10, background: C.card, borderBottom: `1px solid ${C.border}` }}>
          <button onClick={() => router.push("/asha/dashboard")} style={{ width: 36, height: 36, borderRadius: 10, background: C.bg, border: "none", fontSize: 18, cursor: "pointer" }}>←</button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{T("वाइटल साइन रिकॉर्ड करें", "Record Vital Signs")}</div>
            <div style={{ fontSize: 11, color: C.muted }}>Vital Signs Entry</div>
          </div>
          <button
            onClick={() => setLang(l => l === "hi" ? "en" : "hi")}
            style={{ fontSize: 11, fontWeight: 700, padding: "5px 9px", borderRadius: 8, background: C.accent, color: C.primaryDark, border: `1px solid ${C.border}`, cursor: "pointer" }}
          >
            {lang === "hi" ? "🇮🇳 हिन्दी" : "🇬🇧 English"}
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ flex: 1, overflowY: "auto", padding: 16 }}>
          {success && (
            <div style={{ background: "#E8F8EF", border: "1px solid #27AE60", borderRadius: 12, padding: 16, marginBottom: 16, textAlign: "center" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.green }}>{T("वाइटल सफलतापूर्वक रिकॉर्ड हो गए!", "Vital signs recorded successfully!")}</div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{T("डैशबोर्ड पर वापस जा रहे हैं...", "Redirecting to dashboard...")}</div>
            </div>
          )}

          {/* Voice Auto-Fill Card */}
          {isSupported && (
            <div style={{
              background: isListening && activeVoiceField === "all" ? "#FFF8E7" : "linear-gradient(135deg, #27AE60 0%, #1E8449 100%)",
              color: isListening && activeVoiceField === "all" ? C.text : "white",
              borderRadius: 16,
              padding: "14px 16px",
              marginBottom: 16,
              boxShadow: "0 4px 14px rgba(39,174,96,0.2)",
              border: isListening && activeVoiceField === "all" ? "2px solid #F39C12" : "none",
              transition: "all 0.3s ease"
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                    <span>🎙️</span> {T("बोलकर वाइटल्स भरें", "Voice Fill Vitals")}
                  </div>
                  <div style={{ fontSize: 11, opacity: 0.9, marginTop: 2 }}>
                    {T('उदा: "बीपी 120 80, पल्स 72, ऑक्सीजन 98"', 'e.g., "BP 120 80, Pulse 72, Oxygen 98"')}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => toggleVoice("all")}
                  style={{
                    padding: "8px 14px",
                    borderRadius: 20,
                    background: isListening && activeVoiceField === "all" ? "#E74C3C" : "white",
                    color: isListening && activeVoiceField === "all" ? "white" : C.primaryDark,
                    border: "none",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.15)"
                  }}
                >
                  <span>{isListening && activeVoiceField === "all" ? "⏹️ रोकें" : "🎙️ बोलें"}</span>
                </button>
              </div>

              {isListening && activeVoiceField === "all" && (
                <div style={{ marginTop: 10, padding: "8px 10px", background: "rgba(255,255,255,0.85)", borderRadius: 8, color: "#333", fontSize: 12 }}>
                  <div style={{ fontWeight: 600, color: "#D35400", marginBottom: 2 }}>👂 सुन रहे हैं (Listening)...</div>
                  <div>{transcript || T("कृपया बोलें (उदा: बीपी 120 80 पल्स 72)...", "Speak vitals now...")}</div>
                </div>
              )}

              {voiceSuccessMsg && (
                <div style={{ marginTop: 8, fontSize: 12, color: "#27AE60", fontWeight: 600 }}>
                  ✅ {voiceSuccessMsg}
                </div>
              )}
            </div>
          )}

          {/* Patient Phone & Name */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{T("मरीज़ का मोबाइल नंबर *", "Patient Phone *")}</label>
              {isSupported && (
                <button
                  type="button"
                  onClick={() => toggleVoice("phone")}
                  style={{ background: isListening && activeVoiceField === "phone" ? "#E74C3C" : C.accent, color: isListening && activeVoiceField === "phone" ? "white" : C.primaryDark, border: "none", borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}
                >
                  🎙️ {isListening && activeVoiceField === "phone" ? "..." : T("बोलें", "Speak")}
                </button>
              )}
            </div>
            <input required type="tel" placeholder="9876501001" value={form.patientPhone}
              onChange={e => setForm(prev => ({ ...prev, patientPhone: e.target.value.replace(/\D/g, "").slice(0, 10) }))}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: `2px solid ${activeVoiceField === "phone" && isListening ? "#27AE60" : C.border}`, fontSize: 14, boxSizing: "border-box" }} />
          </div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{T("मरीज़ का नाम *", "Patient Name *")}</label>
              {isSupported && (
                <button
                  type="button"
                  onClick={() => toggleVoice("name")}
                  style={{ background: isListening && activeVoiceField === "name" ? "#E74C3C" : C.accent, color: isListening && activeVoiceField === "name" ? "white" : C.primaryDark, border: "none", borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}
                >
                  🎙️ {isListening && activeVoiceField === "name" ? "..." : T("बोलें", "Speak")}
                </button>
              )}
            </div>
            <input required type="text" placeholder={T("रामकली देवी", "Ramkali Devi")} value={form.patientName}
              onChange={e => setForm(prev => ({ ...prev, patientName: e.target.value }))}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: `2px solid ${activeVoiceField === "name" && isListening ? "#27AE60" : C.border}`, fontSize: 14, boxSizing: "border-box" }} />
          </div>

          <div style={{ background: "#E8F8EF", borderRadius: 12, padding: 12, marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.primaryDark, marginBottom: 8 }}>🫀 Vital Parameters</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {vitalFields.map(f => (
                <div key={f.key}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: C.text, display: "block", marginBottom: 2 }}>
                    {f.icon} {f.label} ({f.unit})
                  </label>
                  <input type="number" step="0.1" placeholder={f.placeholder} value={(form as any)[f.key]}
                    onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: `2px solid ${C.border}`, fontSize: 14, boxSizing: "border-box" }} />
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{T("टिप्पणी / Notes", "Notes")}</label>
              {isSupported && (
                <button
                  type="button"
                  onClick={() => toggleVoice("notes")}
                  style={{ background: isListening && activeVoiceField === "notes" ? "#E74C3C" : C.accent, color: isListening && activeVoiceField === "notes" ? "white" : C.primaryDark, border: "none", borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}
                >
                  🎙️ {isListening && activeVoiceField === "notes" ? "..." : T("बोलकर लिखें", "Dictate")}
                </button>
              )}
            </div>
            <textarea rows={3} placeholder={T("अतिरिक्त विवरण या लक्षण...", "Additional observations...")} value={form.notes}
              onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: `2px solid ${activeVoiceField === "notes" && isListening ? "#27AE60" : C.border}`, fontSize: 14, resize: "vertical", boxSizing: "border-box" }} />
          </div>

          <button type="submit" disabled={loading}
            style={{ width: "100%", padding: 14, borderRadius: 14, border: "none", cursor: loading ? "wait" : "pointer", fontWeight: 700, fontSize: 15, background: loading ? "#ccc" : `linear-gradient(135deg,${C.primary},${C.primaryDark})`, color: "white", marginTop: 8 }}>
            {loading ? "⏳ Recording..." : "✅ " + T("वाइटल रिकॉर्ड करें", "Record Vital Signs")}
          </button>
        </form>
      </div>
    </div>
  );
}
