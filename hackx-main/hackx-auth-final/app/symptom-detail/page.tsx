"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

const SYMPTOMS_LIST = [
  { id: "fever",      emoji: "🌡️", hi: "बुखार",              en: "Fever" },
  { id: "chest",      emoji: "💔",  hi: "सीने में दर्द",      en: "Chest Pain" },
  { id: "breath",     emoji: "😮‍💨", hi: "सांस में तकलीफ",    en: "Breathlessness" },
  { id: "cough",      emoji: "😮",  hi: "खांसी",              en: "Cough" },
  { id: "cold",       emoji: "🤧",  hi: "जुकाम",              en: "Cold / Runny Nose" },
  { id: "headache",   emoji: "🤕",  hi: "सिरदर्द",            en: "Headache" },
  { id: "vomit",      emoji: "🤢",  hi: "उल्टी",              en: "Vomiting" },
  { id: "diarrhea",   emoji: "💧",  hi: "दस्त",               en: "Diarrhea" },
  { id: "rash",       emoji: "🔴",  hi: "दाने / चकत्ते",     en: "Skin Rash" },
  { id: "pain",       emoji: "🦴",  hi: "जोड़ों में दर्द",    en: "Joint Pain" },
  { id: "weakness",   emoji: "😴",  hi: "कमज़ोरी",            en: "Weakness" },
  { id: "stomach",    emoji: "😣",  hi: "पेट में दर्द",       en: "Stomach Pain" },
  { id: "eyes",       emoji: "👁️", hi: "आँखों में जलन",      en: "Eye Problem" },
  { id: "back",       emoji: "🔙",  hi: "कमर दर्द",           en: "Back Pain" },
  { id: "dizzy",      emoji: "💫",  hi: "चक्कर",              en: "Dizziness" },
  { id: "swelling",   emoji: "🦵",  hi: "सूजन",               en: "Swelling" },
  { id: "chills",     emoji: "🥶",  hi: "ठंड लगना / कंपकंपी", en: "Chills / Shivering" },
  { id: "body_ache",  emoji: "🤸",  hi: "पूरे शरीर में दर्द", en: "Body Ache" },
  { id: "sweat",      emoji: "💦",  hi: "अत्यधिक पसीना",      en: "Excessive Sweating" },
  { id: "urine_burn", emoji: "🔥",  hi: "पेशाब में जलन",      en: "Burning Urination" },
  { id: "nausea",     emoji: "😰",  hi: "जी मिचलाना",         en: "Nausea" },
  { id: "unconscious",emoji: "😵",  hi: "बेहोशी",             en: "Unconsciousness" },
  { id: "seizure",    emoji: "⚡",  hi: "दौरे पड़ना",          en: "Seizures" },
  { id: "bleed",      emoji: "🩸",  hi: "असामान्य रक्तस्राव", en: "Unusual Bleeding" },
];

const DISEASES = [
  { id: "diabetes",       emoji: "🩺", hi: "मधुमेह (Diabetes)",            en: "Diabetes" },
  { id: "hypertension",   emoji: "❤️‍🔥", hi: "उच्च रक्तचाप (BP)",          en: "Hypertension / High BP" },
  { id: "asthma",         emoji: "🫁", hi: "अस्थमा",                        en: "Asthma" },
  { id: "heart_disease",  emoji: "💓", hi: "हृदय रोग",                      en: "Heart Disease" },
  { id: "kidney_disease", emoji: "🫘", hi: "किडनी रोग",                     en: "Kidney Disease" },
  { id: "thyroid",        emoji: "🦋", hi: "थायरॉइड",                       en: "Thyroid" },
  { id: "arthritis",      emoji: "🦴", hi: "गठिया (Arthritis)",             en: "Arthritis" },
  { id: "cancer",         emoji: "🎗️", hi: "कैंसर",                         en: "Cancer" },
  { id: "liver_disease",  emoji: "🫀", hi: "लीवर रोग",                     en: "Liver Disease" },
  { id: "none",           emoji: "✅", hi: "कोई नहीं",                       en: "None" },
];

const DURATION_OPTIONS = [
  { id: "1day",    hi: "1 दिन",      en: "1 Day" },
  { id: "2-3days", hi: "2–3 दिन",   en: "2–3 Days" },
  { id: "4-7days", hi: "4–7 दिन",   en: "4–7 Days" },
  { id: "1-2weeks",hi: "1–2 हफ्ते", en: "1–2 Weeks" },
  { id: "2weeks+", hi: "2+ हफ्ते",  en: "2+ Weeks" },
];

const C = {
  primary: "#1B6CA8", primaryDark: "#0F4C7A",
  bg: "#F0F4F8", card: "#FFFFFF", text: "#1A2332",
  muted: "#6B7C93", border: "#DDE3EC",
  green: "#1E8449", accent: "#8E44AD",
};

interface UploadedFile {
  name: string;
  type: string;
  size: number;
  dataUrl: string;
}

export default function SymptomDetailPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [lang, setLang] = useState("hi");
  const [primarySymptoms, setPrimarySymptoms] = useState<string[]>([]);
  const [duration, setDuration] = useState<string>("");
  const [additionalSymptoms, setAdditionalSymptoms] = useState<string[]>([]);
  const [selectedDiseases, setSelectedDiseases] = useState<string[]>([]);
  const [otherDisease, setOtherDisease] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [fileError, setFileError] = useState("");
  const [customSymptoms, setCustomSymptoms] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setLang(localStorage.getItem("lang") || "hi");
      const saved = localStorage.getItem("selectedSymptoms");
      if (saved) setPrimarySymptoms(JSON.parse(saved));
      setCustomSymptoms(localStorage.getItem("customSymptoms") || "");
    }
  }, []);

  const t = (hi: string, en: string) => lang === "hi" ? hi : en;

  const toggleAdditional = (id: string) =>
    setAdditionalSymptoms(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);

  const toggleDisease = (id: string) => {
    if (id === "none") {
      setSelectedDiseases(["none"]);
      return;
    }
    setSelectedDiseases(prev => {
      const without = prev.filter(d => d !== "none");
      return without.includes(id) ? without.filter(d => d !== id) : [...without, id];
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setFileError("");
    const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    const maxSize = 5 * 1024 * 1024; // 5MB

    for (const file of files) {
      if (!allowed.includes(file.type)) {
        setFileError(t("केवल PDF, JPG, PNG, WEBP फ़ाइलें मान्य हैं", "Only PDF, JPG, PNG, WEBP files are allowed"));
        return;
      }
      if (file.size > maxSize) {
        setFileError(t("फ़ाइल का आकार 5MB से कम होना चाहिए", "File size must be under 5MB"));
        return;
      }
    }

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        setUploadedFiles(prev => [
          ...prev,
          { name: file.name, type: file.type, size: file.size, dataUrl: reader.result as string },
        ]);
      };
      reader.readAsDataURL(file);
    });

    // reset input so same file can be re-added
    if (e.target) e.target.value = "";
  };

  const removeFile = (idx: number) =>
    setUploadedFiles(prev => prev.filter((_, i) => i !== idx));

  const runTriage = async () => {
    setLoading(true);
    localStorage.removeItem("triageResult");

    const allSelected = [...primarySymptoms, ...additionalSymptoms];
    const allSymptomNames = allSelected.map(id => {
      const s = SYMPTOMS_LIST.find(x => x.id === id)!;
      return `${s.en} (${s.hi})`;
    });

    const detailData = {
      duration,
      additionalSymptoms,
      diseases: selectedDiseases,
      otherDisease,
      fileNames: uploadedFiles.map(f => f.name),
    };
    localStorage.setItem("selectedSymptoms", JSON.stringify(allSelected));
    localStorage.setItem("selectedSymptomNames", JSON.stringify(allSymptomNames));
    localStorage.setItem("symptomDetailData", JSON.stringify(detailData));
    localStorage.setItem("customSymptoms", customSymptoms); // Ensure it's passed along
    // Store files (base64) separately
    localStorage.setItem("uploadedRecords", JSON.stringify(
      uploadedFiles.map(f => ({ name: f.name, type: f.type, dataUrl: f.dataUrl }))
    ));

    try {
      // Try online AI triage first
      const res = await fetch("/api/triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symptoms: allSymptomNames,
          customSymptoms,
          duration,
          diseases: selectedDiseases.map(id => DISEASES.find(d => d.id === id)?.en || id),
          otherDisease,
        }),
      });

      if (!res.ok) {
        throw new Error("API request failed");
      }

      const result = await res.json();
      localStorage.setItem("triageResult", JSON.stringify(result));
      
      if (result.extractedKeywords && result.extractedKeywords.length > 0) {
        const currentNamesStr = localStorage.getItem("selectedSymptomNames");
        let currentNames = [];
        try { currentNames = JSON.parse(currentNamesStr || "[]"); } catch (e) {}
        
        const formattedExtracts = result.extractedKeywords.map((k: string) => `🎙️ ${k.charAt(0).toUpperCase() + k.slice(1)}`);
        const merged = Array.from(new Set([...currentNames, ...formattedExtracts]));
        localStorage.setItem("selectedSymptomNames", JSON.stringify(merged));
      }
    } catch (error) {
      // OFFLINE FALLBACK: Use rule-based triage
      console.log("🔄 AI triage failed or offline — using rule-based fallback");

      // Import the fallbackTriage function
      const { fallbackTriage } = await import("@/lib/triage");

      // Map symptom IDs from the UI to the rule-based system
      const symptomIds = allSelected; // These already match the rule-based IDs
      const result = fallbackTriage(symptomIds);

      // Store the fallback result
      localStorage.setItem("triageResult", JSON.stringify(result));

      // Show offline indicator
      localStorage.setItem("triageMode", "offline");
    }

    setLoading(false);
    router.push("/triage");
  };

  // Available additional symptoms = all - already selected
  const availableExtra = SYMPTOMS_LIST.filter(s => !primarySymptoms.includes(s.id));

  if (loading) {
    return (
      <div style={{ background: "linear-gradient(160deg,#0F4C7A,#1B6CA8)", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 20 }}>
        <div style={{ fontSize: 60 }}>🤖</div>
        <div style={{ width: 48, height: 48, border: "4px solid rgba(255,255,255,.3)", borderTop: "4px solid white", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
        <div style={{ color: "white", fontSize: 18, fontWeight: 800 }}>{t("AI जाँच रहा है...", "AI is analyzing...")}</div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <div style={{ background: "#0d1520", minHeight: "100vh", display: "flex", justifyContent: "center" }}>
      <div style={{ width: 390, background: C.bg, minHeight: "100vh", display: "flex", flexDirection: "column" }}>

        {/* Header */}
        <div style={{ background: `linear-gradient(135deg, ${C.primary}, ${C.primaryDark})`, padding: "44px 16px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
            <button
              onClick={() => router.push("/symptoms")}
              style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,.2)", border: "none", fontSize: 18, cursor: "pointer", color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
              ←
            </button>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "white" }}>{t("थोड़ी और जानकारी", "A Few More Details")}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,.7)" }}>{t("बेहतर जाँच के लिए", "For a more accurate diagnosis")}</div>
            </div>
          </div>
          {/* Step indicator */}
          <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
            {["⏱️", "➕", "🏥", "📎"].map((icon, i) => (
              <div key={i} style={{ flex: 1, background: "rgba(255,255,255,.25)", borderRadius: 6, padding: "4px 0", fontSize: 14, textAlign: "center" }}>{icon}</div>
            ))}
          </div>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px 140px" }}>

          {/* ── SECTION 1: Duration ─────────────────────────────── */}
          <SectionCard icon="⏱️" title={t("लक्षण कब से हैं?", "How long have you had these symptoms?")} subtitle={t("एक विकल्प चुनें", "Select one option")}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
              {DURATION_OPTIONS.map(opt => {
                const sel = duration === opt.id;
                return (
                  <button key={opt.id} id={`duration-${opt.id}`} onClick={() => setDuration(opt.id)}
                    style={{
                      padding: "9px 16px", borderRadius: 24, fontSize: 13, fontWeight: 700,
                      border: `2px solid ${sel ? C.primary : C.border}`,
                      background: sel ? C.primary : C.card, color: sel ? "white" : C.text,
                      cursor: "pointer", transition: "all .18s",
                      boxShadow: sel ? `0 4px 12px rgba(27,108,168,.35)` : "none",
                    }}>
                    {lang === "hi" ? opt.hi : opt.en}
                  </button>
                );
              })}
            </div>
          </SectionCard>

          {/* ── SECTION 2: Additional Symptoms ─────────────────── */}
          <SectionCard icon="➕" title={t("और कोई लक्षण?", "Any additional symptoms?")} subtitle={t("जो आपने पहले नहीं चुने", "Not selected on previous screen")}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginTop: 8 }}>
              {availableExtra.map(sym => {
                const sel = additionalSymptoms.includes(sym.id);
                return (
                  <div key={sym.id} id={`extra-${sym.id}`} onClick={() => toggleAdditional(sym.id)}
                    style={{
                      background: sel ? "#EBF4FD" : C.card, borderRadius: 12,
                      border: `2px solid ${sel ? C.primary : C.border}`,
                      padding: "10px 6px", display: "flex", flexDirection: "column",
                      alignItems: "center", gap: 4, cursor: "pointer", transition: "all .18s",
                      position: "relative",
                    }}>
                    {sel && (
                      <div style={{ position: "absolute", top: 4, right: 4, width: 14, height: 14, background: C.primary, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, color: "white", fontWeight: 800 }}>✓</div>
                    )}
                    <div style={{ fontSize: 22 }}>{sym.emoji}</div>
                    <div style={{ fontSize: 10, fontWeight: 600, textAlign: "center", color: sel ? C.primary : C.text, lineHeight: 1.3 }}>
                      {lang === "hi" ? sym.hi : sym.en}
                    </div>
                  </div>
                );
              })}
            </div>
            {additionalSymptoms.length > 0 && (
              <div style={{ marginTop: 8, padding: "6px 12px", background: "#EBF4FD", borderRadius: 8, fontSize: 12, color: C.primary, fontWeight: 600 }}>
                ✓ {additionalSymptoms.length} {t("अतिरिक्त लक्षण चुने", "additional symptoms selected")}
              </div>
            )}
          </SectionCard>

          {/* ── SECTION 3: Known Diseases ───────────────────────── */}
          <SectionCard icon="🏥" title={t("कोई पुरानी बीमारी?", "Any existing medical conditions?")} subtitle={t("सभी लागू विकल्प चुनें", "Select all that apply")}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 8, marginTop: 8 }}>
              {DISEASES.map(d => {
                const sel = selectedDiseases.includes(d.id);
                return (
                  <div key={d.id} id={`disease-${d.id}`} onClick={() => toggleDisease(d.id)}
                    style={{
                      background: sel ? "#EBF4FD" : C.card, borderRadius: 12,
                      border: `2px solid ${sel ? C.primary : C.border}`,
                      padding: "10px 12px", display: "flex", alignItems: "center",
                      gap: 10, cursor: "pointer", transition: "all .18s",
                    }}>
                    <div style={{ fontSize: 20, flexShrink: 0 }}>{d.emoji}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: sel ? C.primary : C.text, lineHeight: 1.3 }}>
                      {lang === "hi" ? d.hi : d.en}
                    </div>
                    {sel && (
                      <div style={{ marginLeft: "auto", width: 18, height: 18, background: C.primary, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "white", fontWeight: 800, flexShrink: 0 }}>✓</div>
                    )}
                  </div>
                );
              })}
            </div>
            {/* Other condition free text */}
            <input
              id="other-disease-input"
              type="text"
              placeholder={t("अन्य बीमारी लिखें (वैकल्पिक)…", "Other condition (optional)…")}
              value={otherDisease}
              onChange={e => setOtherDisease(e.target.value)}
              style={{
                marginTop: 10, width: "100%", padding: "10px 14px", borderRadius: 10,
                border: `1.5px solid ${otherDisease ? C.primary : C.border}`,
                fontSize: 13, color: C.text, background: C.card, outline: "none",
                boxSizing: "border-box", fontFamily: "inherit",
              }}
            />
          </SectionCard>

          {/* ── SECTION 4: Past Records Upload ─────────────────── */}
          <SectionCard icon="📎" title={t("पुराने रिकॉर्ड अपलोड करें", "Upload Past Medical Records")} subtitle={t("PDF या फोटो — वैकल्पिक", "PDF or photos — optional")}>
            <div
              id="upload-drop-zone"
              onClick={() => fileInputRef.current?.click()}
              style={{
                marginTop: 10, border: `2px dashed ${C.border}`, borderRadius: 14,
                padding: "24px 16px", textAlign: "center", cursor: "pointer",
                background: C.bg, transition: "all .2s",
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = C.primary)}
              onMouseLeave={e => (e.currentTarget.style.borderColor = C.border)}
            >
              <div style={{ fontSize: 32 }}>📂</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginTop: 6 }}>
                {t("यहाँ टैप करें", "Tap to Choose Files")}
              </div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>
                PDF, JPG, PNG, WEBP · {t("अधिकतम 5MB", "Max 5MB each")}
              </div>
            </div>
            <input
              ref={fileInputRef}
              id="file-upload-input"
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp,application/pdf"
              style={{ display: "none" }}
              onChange={handleFileUpload}
            />
            {fileError && (
              <div style={{ marginTop: 8, padding: "8px 12px", background: "#FDEDED", borderRadius: 8, fontSize: 12, color: "#C0392B" }}>
                ⚠️ {fileError}
              </div>
            )}
            {/* Uploaded file list */}
            {uploadedFiles.length > 0 && (
              <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
                {uploadedFiles.map((file, idx) => (
                  <div key={idx} style={{ background: C.card, borderRadius: 10, border: `1.5px solid ${C.border}`, padding: "8px 12px", display: "flex", alignItems: "center", gap: 10 }}>
                    {/* Thumbnail or PDF icon */}
                    {file.type.startsWith("image/") ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={file.dataUrl} alt={file.name} style={{ width: 42, height: 42, borderRadius: 7, objectFit: "cover", flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: 42, height: 42, borderRadius: 7, background: "#FDEDED", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>📄</div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.name}</div>
                      <div style={{ fontSize: 11, color: C.muted }}>{(file.size / 1024).toFixed(1)} KB</div>
                    </div>
                    <button
                      id={`remove-file-${idx}`}
                      onClick={() => removeFile(idx)}
                      style={{ width: 28, height: 28, borderRadius: 8, background: "#FDEDED", border: "none", fontSize: 14, cursor: "pointer", color: "#C0392B", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

        </div>

        {/* ── Bottom CTA ───────────────────────────────────────── */}
        <div style={{ position: "fixed", bottom: 0, width: 390, background: C.card, borderTop: `2px solid ${C.border}`, padding: "12px 16px", zIndex: 50 }}>
          {/* Summary chips */}
          {(duration || additionalSymptoms.length > 0 || selectedDiseases.length > 0 || uploadedFiles.length > 0) && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
              {duration && <Chip emoji="⏱️" label={DURATION_OPTIONS.find(d => d.id === duration)?.[lang === "hi" ? "hi" : "en"] || duration} />}
              {additionalSymptoms.length > 0 && <Chip emoji="➕" label={`${additionalSymptoms.length} ${lang === "hi" ? "अतिरिक्त" : "extra"}`} />}
              {selectedDiseases.filter(d => d !== "none").length > 0 && <Chip emoji="🏥" label={`${selectedDiseases.filter(d => d !== "none").length} ${lang === "hi" ? "बीमारी" : "conditions"}`} />}
              {uploadedFiles.length > 0 && <Chip emoji="📎" label={`${uploadedFiles.length} ${lang === "hi" ? "फ़ाइल" : "files"}`} />}
            </div>
          )}
          <button
            id="analyse-btn"
            onClick={runTriage}
            style={{
              width: "100%", padding: "14px", borderRadius: 14, border: "none", cursor: "pointer",
              fontWeight: 800, fontSize: 16,
              background: `linear-gradient(135deg, ${C.primary}, ${C.primaryDark})`,
              color: "white", boxShadow: "0 4px 20px rgba(27,108,168,.5)",
              transition: "opacity .2s",
            }}>
            🤖 {t("AI से जाँच शुरू करें", "Analyse with AI")} →
          </button>
        </div>

      </div>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        input::placeholder { color: #6B7C93; }
      `}</style>
    </div>
  );
}

/* ── Small helpers ─────────────────────────────────────────────────────────── */

function SectionCard({ icon, title, subtitle, children }: { icon: string; title: string; subtitle: string; children: React.ReactNode }) {
  const C2 = { card: "#FFFFFF", text: "#1A2332", muted: "#6B7C93", border: "#DDE3EC", primary: "#1B6CA8" };
  return (
    <div style={{ background: C2.card, borderRadius: 16, padding: "14px 14px 16px", marginTop: 12, border: `1px solid ${C2.border}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: "#EBF4FD", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17 }}>{icon}</div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: C2.text }}>{title}</div>
          <div style={{ fontSize: 11, color: C2.muted }}>{subtitle}</div>
        </div>
      </div>
      {children}
    </div>
  );
}

function Chip({ emoji, label }: { emoji: string; label: string }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 20, background: "#EBF4FD", fontSize: 12, fontWeight: 600, color: "#1B6CA8" }}>
      {emoji} {label}
    </div>
  );
}
