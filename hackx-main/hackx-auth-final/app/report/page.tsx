"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import type { TriageResult } from "@/lib/triage";
import { generatePDF, PatientInfo, Consultation } from '@/lib/pdf';

const C = { primary: "#1B6CA8", primaryDark: "#0F4C7A", green: "#1E8449", red: "#C0392B", yellow: "#F39C12", bg: "#F0F4F8", card: "#FFFFFF", text: "#1A2332", muted: "#6B7C93", border: "#DDE3EC" };

interface Patient { name: string; age: string; village: string; phone: string; gender?: string; conditions?: string; bloodGroup?: string; }
interface RxRow { medicine: string; dose: string; frequency: string; duration: string; instructions: string; }

const SYMPTOMS_MAP: Record<string, { emoji: string; hi: string; en: string }> = {
  fever: { emoji: "🌡️", hi: "बुखार", en: "Fever" },
  chest: { emoji: "💔", hi: "सीने में दर्द", en: "Chest Pain" },
  breath: { emoji: "😮‍💨", hi: "सांस में तकलीफ", en: "Breathless" },
  cough: { emoji: "😮", hi: "खांसी", en: "Cough" },
  cold: { emoji: "🤧", hi: "जुकाम", en: "Cold" },
  headache: { emoji: "🤕", hi: "सिरदर्द", en: "Headache" },
  vomit: { emoji: "🤢", hi: "उल्टी", en: "Vomiting" },
  diarrhea: { emoji: "💧", hi: "दस्त", en: "Diarrhea" },
  rash: { emoji: "🔴", hi: "दाने", en: "Skin Rash" },
  pain: { emoji: "🦴", hi: "जोड़ों में दर्द", en: "Joint Pain" },
  weakness: { emoji: "😴", hi: "कमज़ोरी", en: "Weakness" },
  stomach: { emoji: "😣", hi: "पेट में दर्द", en: "Stomach Pain" },
  eyes: { emoji: "👁️", hi: "आँखों में जलन", en: "Eye Pain" },
  back: { emoji: "🔙", hi: "कमर दर्द", en: "Back Pain" },
  dizzy: { emoji: "💫", hi: "चक्कर", en: "Dizziness" },
  swelling: { emoji: "🦵", hi: "सूजन", en: "Swelling" },
};

const URG_BG: Record<string, string> = {
  RED: "linear-gradient(135deg,#922B21,#C0392B)",
  YELLOW: "linear-gradient(135deg,#B7770D,#E67E22)",
  GREEN: "linear-gradient(135deg,#1A6B3A,#27AE60)",
};
const URG_COLOR: Record<string, string> = { RED: "#C0392B", YELLOW: "#F39C12", GREEN: "#1E8449" };

// ── PRESCRIPTION SLIP COMPONENT ─────────────────────────────────────────────
// Caduceus SVG — faithful recreation of the medical symbol used in the reference image
function CaduceusIcon({ size = 64, color = "#1B6CA8", opacity = 1 }: { size?: number; color?: string; opacity?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none" style={{ opacity }} xmlns="http://www.w3.org/2000/svg">
      {/* Staff */}
      <rect x="38" y="8" width="4" height="56" rx="2" fill={color} />
      {/* Top wings */}
      <path d="M40 14 C20 10 10 20 18 28 C26 36 40 32 40 32" stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M40 14 C60 10 70 20 62 28 C54 36 40 32 40 32" stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {/* Upper snake coil */}
      <path d="M40 22 C28 20 22 28 30 34 C38 40 52 36 52 44 C52 52 38 56 28 52" stroke={color} strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <path d="M40 22 C52 20 58 28 50 34 C42 40 28 36 28 44 C28 52 42 56 52 52" stroke={color} strokeWidth="2.2" fill="none" strokeLinecap="round" />
      {/* Bottom knot */}
      <circle cx="40" cy="55" r="4" fill="none" stroke={color} strokeWidth="2" />
      {/* Snake heads */}
      <ellipse cx="28" cy="50" rx="4" ry="3" fill={color} />
      <ellipse cx="52" cy="50" rx="4" ry="3" fill={color} />
      {/* Wing feathers top */}
      <path d="M18 20 C10 14 8 8 14 10 C18 12 20 18 20 18" fill={color} opacity="0.5" />
      <path d="M62 20 C70 14 72 8 66 10 C62 12 60 18 60 18" fill={color} opacity="0.5" />
    </svg>
  );
}

function PrescriptionSlip({ patient, rxRows, doctorName, doctorNotes, consultationDate }: {
  patient: Patient | null;
  rxRows: RxRow[];
  doctorName: string;
  doctorNotes: string;
  consultationDate: string;
}) {
  const hasRx = rxRows.some(r => r.medicine.trim());
  if (!hasRx) return null;

  const slipStyle: React.CSSProperties = {
    background: "#ffffff",
    width: "100%",
    maxWidth: 440,
    margin: "0 auto",
    fontFamily: "'Georgia', 'Times New Roman', serif",
    boxShadow: "0 4px 32px rgba(27,108,168,0.13), 0 1px 4px rgba(0,0,0,0.07)",
    border: "1px solid #D0DEF0",
    position: "relative",
    overflow: "hidden",
  };

  return (
    <div style={slipStyle} id="prescription-slip">

      {/* ── TOP HEADER SECTION ── */}
      <div style={{ position: "relative", padding: "22px 22px 16px 22px", borderBottom: "1px solid #E2EBF5", minHeight: 110 }}>

        {/* Blue decorative blob — top right, exactly like reference */}
        <div style={{
          position: "absolute", top: 0, right: 0,
          width: 130, height: 110,
          background: "radial-gradient(ellipse at top right, #A8C8E8 0%, #C5DCF0 50%, transparent 75%)",
          borderRadius: "0 0 0 100%",
          opacity: 0.55,
          pointerEvents: "none",
        }} />
        {/* Second softer blob layer */}
        <div style={{
          position: "absolute", top: 0, right: 0,
          width: 90, height: 80,
          background: "linear-gradient(225deg, #BDD8F0 0%, #D8ECF8 60%, transparent 80%)",
          borderRadius: "0 0 0 100%",
          opacity: 0.7,
          pointerEvents: "none",
        }} />

        {/* Caduceus icon — top right inside blob area */}
        <div style={{ position: "absolute", top: 12, right: 14, zIndex: 2 }}>
          <CaduceusIcon size={64} color="#1B6CA8" opacity={0.9} />
        </div>

        {/* Doctor info — top left */}
        <div style={{ position: "relative", zIndex: 3, maxWidth: "62%" }}>
          {/* AAROGYA AI branding above doctor name */}
          <div style={{ fontSize: 8.5, fontWeight: 700, color: "#1B6CA8", letterSpacing: 2.5, textTransform: "uppercase", fontFamily: "'Arial', sans-serif", marginBottom: 3 }}>
            AAROGYA AI · आरोग्य एआई
          </div>
          <div style={{ fontSize: 19, fontWeight: 800, color: "#1A2D4A", lineHeight: 1.15, fontFamily: "'Georgia', serif" }}>
            {doctorName}
          </div>
          <div style={{ fontSize: 9.5, fontWeight: 600, color: "#5A7A9A", letterSpacing: 1.2, textTransform: "uppercase", fontFamily: "'Arial', sans-serif", marginTop: 3 }}>
            MBBS · Consulting Physician
          </div>
          <div style={{ fontSize: 9, color: "#8A9BAC", marginTop: 6, fontFamily: "'Arial', sans-serif", fontStyle: "italic" }}>
            Certification: AAROGYA-{new Date().getFullYear()}-{String(Math.floor(Math.random() * 9000) + 1000)}
          </div>
        </div>
      </div>

      {/* ── PATIENT FIELDS SECTION ── */}
      <div style={{ padding: "14px 22px 10px 22px", borderBottom: "1px solid #E8F0F8" }}>
        {/* Patient Name */}
        <div style={{ display: "flex", alignItems: "flex-end", gap: 8, marginBottom: 10 }}>
          <span style={{ fontSize: 11, color: "#3A5A7A", fontWeight: 600, whiteSpace: "nowrap", minWidth: 88, fontFamily: "'Arial', sans-serif" }}>Patient Name:</span>
          <div style={{ flex: 1, borderBottom: "1px solid #B0C8E0", paddingBottom: 2, fontSize: 11.5, color: "#1A2D4A", fontWeight: 600, fontFamily: "'Arial', sans-serif", minHeight: 18 }}>
            {patient?.name || ""}
          </div>
        </div>
        {/* Address */}
        <div style={{ display: "flex", alignItems: "flex-end", gap: 8, marginBottom: 10 }}>
          <span style={{ fontSize: 11, color: "#3A5A7A", fontWeight: 600, whiteSpace: "nowrap", minWidth: 88, fontFamily: "'Arial', sans-serif" }}>Address:</span>
          <div style={{ flex: 1, borderBottom: "1px solid #B0C8E0", paddingBottom: 2, fontSize: 11.5, color: "#1A2D4A", fontFamily: "'Arial', sans-serif", minHeight: 18 }}>
            {patient?.village || ""}
          </div>
        </div>
        {/* Age + Date on same row */}
        <div style={{ display: "flex", gap: 0, marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8, flex: 1 }}>
            <span style={{ fontSize: 11, color: "#3A5A7A", fontWeight: 600, whiteSpace: "nowrap", fontFamily: "'Arial', sans-serif" }}>Age:</span>
            <div style={{ flex: 1, borderBottom: "1px solid #B0C8E0", paddingBottom: 2, fontSize: 11.5, color: "#1A2D4A", fontFamily: "'Arial', sans-serif", minHeight: 18, maxWidth: 100 }}>
              {patient?.age ? `${patient.age} yrs` : ""}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8, flex: 1.4, marginLeft: 18 }}>
            <span style={{ fontSize: 11, color: "#3A5A7A", fontWeight: 600, whiteSpace: "nowrap", fontFamily: "'Arial', sans-serif" }}>Date:</span>
            <div style={{ flex: 1, borderBottom: "1px solid #B0C8E0", paddingBottom: 2, fontSize: 11, color: "#1A2D4A", fontFamily: "'Arial', sans-serif", minHeight: 18 }}>
              {consultationDate}
            </div>
          </div>
        </div>
        {/* Diagnosis */}
        <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
          <span style={{ fontSize: 11, color: "#3A5A7A", fontWeight: 600, whiteSpace: "nowrap", minWidth: 88, fontFamily: "'Arial', sans-serif" }}>Diagnosis:</span>
          <div style={{ flex: 1, borderBottom: "1px solid #B0C8E0", paddingBottom: 2, fontSize: 11.5, color: "#1A2D4A", fontFamily: "'Arial', sans-serif", minHeight: 18 }}>
            {doctorNotes || ""}
          </div>
        </div>
      </div>

      {/* ── Rx BODY SECTION ── */}
      <div style={{ padding: "16px 22px 0 22px", position: "relative", minHeight: 240 }}>

        {/* Rx symbol — big, blue, exactly like reference */}
        <div style={{ display: "flex", alignItems: "flex-end", gap: 0, marginBottom: 18 }}>
          <span style={{
            fontSize: 42, fontWeight: 900, color: "#1B6CA8",
            lineHeight: 1, fontFamily: "'Georgia', 'Times New Roman', serif",
            letterSpacing: -2,
          }}>R</span>
          <span style={{
            fontSize: 26, fontWeight: 900, color: "#1B6CA8",
            lineHeight: 1, fontFamily: "'Georgia', 'Times New Roman', serif",
            marginBottom: 4, marginLeft: -3,
          }}>x</span>
        </div>

        {/* Watermark caduceus — large, centered, very faint, exactly like reference */}
        <div style={{
          position: "absolute",
          top: "50%", left: "50%",
          transform: "translate(-50%, -40%)",
          pointerEvents: "none",
          zIndex: 0,
          opacity: 0.055,
        }}>
          <CaduceusIcon size={220} color="#1B6CA8" opacity={1} />
        </div>

        {/* Medicine list — written in clean lines like a real prescription */}
        <div style={{ position: "relative", zIndex: 2, paddingBottom: 8 }}>
          {rxRows.filter(r => r.medicine.trim()).map((row, i) => (
            <div key={i} style={{
              marginBottom: 16,
              paddingBottom: 12,
              borderBottom: i < rxRows.filter(r => r.medicine.trim()).length - 1 ? "1px dashed #C8D8E8" : "none",
            }}>
              {/* Medicine name + dose — prominent line */}
              <div style={{ fontSize: 13, fontWeight: 700, color: "#1A2D4A", fontFamily: "'Georgia', serif", marginBottom: 3 }}>
                {i + 1}. {row.medicine}{row.dose ? ` — ${row.dose}` : ""}
              </div>
              {/* Sub-details in grey */}
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                {row.frequency && (
                  <span style={{ fontSize: 10.5, color: "#5A7A9A", fontFamily: "'Arial', sans-serif" }}>
                    🕐 {row.frequency}
                  </span>
                )}
                {row.duration && (
                  <span style={{ fontSize: 10.5, color: "#5A7A9A", fontFamily: "'Arial', sans-serif" }}>
                    📅 {row.duration}
                  </span>
                )}
                {row.instructions && (
                  <span style={{ fontSize: 10.5, color: "#7A8A9A", fontStyle: "italic", fontFamily: "'Arial', sans-serif" }}>
                    ⚠ {row.instructions}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Signature — bottom right, exactly like reference */}
        <div style={{ display: "flex", justifyContent: "flex-end", paddingBottom: 20, paddingTop: 16, position: "relative", zIndex: 2 }}>
          <div style={{ textAlign: "center", minWidth: 130 }}>
            <div style={{ borderBottom: "1px solid #8AAAC0", marginBottom: 5, width: "100%" }} />
            <div style={{ fontSize: 9, fontWeight: 700, color: "#5A7A9A", letterSpacing: 2, textTransform: "uppercase", fontFamily: "'Arial', sans-serif" }}>
              SIGNATURE
            </div>
          </div>
        </div>
      </div>

      {/* ── FOOTER BAR — exactly like reference ── */}
      <div style={{
        background: "linear-gradient(135deg, #C5DCF0 0%, #A8C8E8 40%, #8AB8E0 100%)",
        padding: "10px 22px",
        display: "flex",
        alignItems: "center",
        gap: 0,
      }}>
        {/* Left: Aarogya AI name + slogan */}
        <div style={{ minWidth: 90, paddingRight: 14, borderRight: "2px solid rgba(27,108,168,0.35)" }}>
          <div style={{ fontSize: 12, fontWeight: 900, color: "#1A3A5A", fontFamily: "'Arial', sans-serif", letterSpacing: 0.5, lineHeight: 1.2 }}>AAROGYA AI</div>
          <div style={{ fontSize: 8, color: "#2A5A7A", fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", fontFamily: "'Arial', sans-serif", marginTop: 1 }}>Rural Telemedicine</div>
        </div>
        {/* Right: contact details in two columns like reference */}
        <div style={{ flex: 1, paddingLeft: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3px 8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ fontSize: 9, color: "#1B6CA8" }}>📞</span>
            <span style={{ fontSize: 9, color: "#1A3A5A", fontFamily: "'Arial', sans-serif", fontWeight: 600 }}>108 — Emergency</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ fontSize: 9, color: "#1B6CA8" }}>✉</span>
            <span style={{ fontSize: 9, color: "#1A3A5A", fontFamily: "'Arial', sans-serif" }}>help@aarogya.ai</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ fontSize: 9, color: "#1B6CA8" }}>📍</span>
            <span style={{ fontSize: 9, color: "#1A3A5A", fontFamily: "'Arial', sans-serif" }}>Aarogya AI Health Network</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ fontSize: 9, color: "#1B6CA8" }}>🌐</span>
            <span style={{ fontSize: 9, color: "#1A3A5A", fontFamily: "'Arial', sans-serif" }}>www.aarogya.ai</span>
          </div>
        </div>
      </div>

    </div>
  );
}

export default function ReportPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [lang, setLang] = useState("hi");
  const [localPatient, setLocalPatient] = useState<Patient | null>(null);
  const [result, setResult] = useState<TriageResult | null>(null);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [customSymptoms, setCustomSymptoms] = useState<string>("");
  const [hydrated, setHydrated] = useState(false);
  const [rxRows, setRxRows] = useState<RxRow[]>([]);
  const [doctorName, setDoctorName] = useState("Dr. Aarogya");
  const [doctorNotes, setDoctorNotes] = useState("");
  const [reportDate] = useState(() => new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }));

  useEffect(() => {
    setLang(localStorage.getItem("lang") || "hi");
    try {
      const cached = localStorage.getItem("cachedPatientUser");
      if (cached) {
        const cp = JSON.parse(cached);
        setLocalPatient({
          name: cp.name || "",
          age: String(cp.age || ""),
          village: cp.village || "",
          phone: cp.phone || "",
          gender: cp.gender || "",
          conditions: (cp.conditions || []).join(", "),
          bloodGroup: cp.bloodGroup || "",
        });
      }
    } catch { }
    try { const p = localStorage.getItem("patient"); if (p) setLocalPatient(prev => ({ ...prev, ...JSON.parse(p) })); } catch { }
    try { const r = localStorage.getItem("triageResult"); if (r) setResult(JSON.parse(r)); } catch { }
    try { const s = localStorage.getItem("selectedSymptoms"); if (s) setSymptoms(JSON.parse(s)); } catch { }
    try { const cs = localStorage.getItem("customSymptoms"); if (cs) setCustomSymptoms(cs); } catch { }
    // Load prescription if doctor has completed consultation
    try {
      const rx = localStorage.getItem("doctorPrescription");
      if (rx) {
        const parsed = JSON.parse(rx);
        if (Array.isArray(parsed)) setRxRows(parsed);
      }
    } catch { }
    try { const dn = localStorage.getItem("doctorName"); if (dn) setDoctorName(dn); } catch { }
    try { const notes = localStorage.getItem("doctorNotes"); if (notes) setDoctorNotes(notes); } catch { }
    setHydrated(true);
  }, []);

  const t = (hi: string, en: string) => lang === "hi" ? hi : en;

  const handlePrintPrescription = () => {
    const printContent = document.getElementById("prescription-slip");
    if (!printContent) return;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html><head><title>Prescription — Aarogya AI</title>
      <style>
        body { margin: 0; padding: 20px; background: white; font-family: 'Segoe UI', Arial, sans-serif; }
        @media print { body { padding: 0; } }
      </style></head>
      <body>${printContent.outerHTML}</body></html>
    `);
    win.document.close();
    win.print();
  };

  const user = session?.user as any;

  // Combine session data with local data if available
  const patient = user ? {
    name: user.name || localPatient?.name || "Patient",
    age: user.age || localPatient?.age || "—",
    village: localPatient?.village || "—",
    phone: user.phone || localPatient?.phone || "—",
    gender: user.gender === "female" ? t("महिला", "Female") : user.gender === "male" ? t("पुरुष", "Male") : localPatient?.gender || "—",
    conditions: user.conditions || localPatient?.conditions || "—",
    bloodGroup: user.bloodGroup || localPatient?.bloodGroup || "—",
  } : localPatient;

  if (!hydrated) return null;

  if (!result) {
    return (
      <div style={{ background: "#0d1520", minHeight: "100vh", display: "flex", justifyContent: "center" }}>
        <div style={{ width: 390, background: C.bg, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.text }}>{t("कोई रिपोर्ट नहीं मिली", "No Report Found")}</div>
          <div style={{ fontSize: 13, color: C.muted, marginTop: 8 }}>{t("पहले लक्षण जाँच करें", "Please complete a symptom check first")}</div>
          <button onClick={() => router.push("/symptoms")} style={{ marginTop: 24, padding: "14px 28px", borderRadius: 14, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 15, background: `linear-gradient(135deg,${C.primary},${C.primaryDark})`, color: "white" }}>
            🩺 {t("लक्षण जाँचें", "Check Symptoms")}
          </button>
        </div>
      </div>
    );
  }

  const urgColor = URG_COLOR[result.urgency] || C.green;
  const hasPrescription = rxRows.some(r => r.medicine.trim());

  return (
    <div style={{ background: "#0d1520", minHeight: "100vh", display: "flex", justifyContent: "center" }}>
      <div style={{ width: 390, background: C.bg, minHeight: "100vh", display: "flex", flexDirection: "column" }}>

        {/* Header */}
        <div style={{ background: URG_BG[result.urgency] || URG_BG.GREEN, padding: "44px 16px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <button onClick={() => router.back()} style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,.2)", border: "none", fontSize: 18, cursor: "pointer", color: "white" }}>←</button>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: "white" }}>{t("स्वास्थ्य रिपोर्ट", "Health Report")}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,.7)" }}>{reportDate}</div>
            </div>
            <button onClick={() => {
              if (result) {
                const pInfo: PatientInfo = {
                  name: patient?.name || "Patient",
                  gender: patient?.gender || "Unknown",
                  age: patient?.age || "—",
                  phone: patient?.phone || "—",
                  bloodGroup: patient?.bloodGroup || "—",
                  condition: patient?.conditions || "—",
                };
                const hasDoctorInteraction = rxRows.length > 0 || !!doctorNotes;
                const cons: Consultation = {
                  _id: "report-" + Date.now(),
                  symptoms: [...symptoms.map(s => SYMPTOMS_MAP[s]?.en || s), customSymptoms].filter(Boolean),
                  urgency: result.urgency,
                  triageResult: result,
                  status: hasDoctorInteraction ? "completed" : "pending",
                  doctorName: hasDoctorInteraction ? doctorName.replace("Dr. ", "").replace("Dr ", "") : undefined,
                  doctorNotes: doctorNotes || undefined,
                  prescription: rxRows.length > 0 ? rxRows.map(r => `${r.medicine} ${r.dose} - ${r.frequency} - ${r.duration} (${r.instructions})`).join("\n") : undefined,
                  createdAt: new Date().toISOString(),
                };
                generatePDF(pInfo, [cons]);
              }
            }} style={{ padding: "8px 14px", borderRadius: 10, border: "none", background: "rgba(255,255,255,.2)", color: "white", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
              📄 {t("PDF डाउनलोड", "Download PDF")}
            </button>
          </div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 30, fontSize: 16, fontWeight: 800, color: "white", background: "rgba(255,255,255,.2)", border: "2px solid rgba(255,255,255,.4)" }}>
            {result.urgency === "RED" ? "🔴" : result.urgency === "YELLOW" ? "🟡" : "🟢"} {result.urgency} — {lang === "hi" ? result.conditionHi : result.conditionEn}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px 100px" }}>

          {/* ── HEALTH REPORT SECTION ── */}

          {/* Patient */}
          <div style={{ background: C.card, borderRadius: 16, padding: 14, marginBottom: 12, border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>👤 {t("मरीज़ की जानकारी", "Patient Details")}</div>
            {patient ? (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 12px" }}>
                {[
                  { l: t("नाम", "Name"), v: patient.name },
                  { l: t("उम्र", "Age"), v: `${patient.age} ${t("वर्ष", "yrs")}` },
                  { l: t("गाँव", "Village"), v: patient.village },
                  { l: t("फ़ोन", "Phone"), v: patient.phone },
                  ...(patient.gender ? [{ l: t("लिंग", "Gender"), v: patient.gender }] : []),
                  ...(patient.bloodGroup ? [{ l: t("ब्लड ग्रुप", "Blood Group"), v: patient.bloodGroup }] : []),
                  ...(patient.conditions ? [{ l: t("मौजूदा बीमारी", "Conditions"), v: patient.conditions }] : []),
                ].map((row, i) => (
                  <div key={i}>
                    <div style={{ fontSize: 10, color: C.muted, fontWeight: 600 }}>{row.l}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginTop: 2 }}>{row.v}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: 13, color: C.muted }}>{t("मरीज़ की जानकारी नहीं मिली", "Patient info not available")}</div>
            )}
          </div>

          {/* Symptoms */}
          <div style={{ background: C.card, borderRadius: 16, padding: 14, marginBottom: 12, border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>🩺 {t("लक्षण", "Symptoms Reported")}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {symptoms.map(id => {
                const s = SYMPTOMS_MAP[id];
                if (!s) return null;
                return <span key={id} style={{ background: "#EBF4FD", borderRadius: 20, padding: "5px 12px", fontSize: 12, fontWeight: 600, color: C.primary }}>{s.emoji} {lang === "hi" ? s.hi : s.en}</span>;
              })}
              {customSymptoms && (
                <div style={{ width: "100%", background: "#F5F8FA", border: `1px solid ${C.border}`, borderRadius: 10, padding: "8px 12px", fontSize: 13, color: C.text, fontStyle: "italic", marginTop: 4 }}>
                  &ldquo;{customSymptoms}&rdquo;
                </div>
              )}
              {symptoms.length === 0 && !customSymptoms && <span style={{ fontSize: 13, color: C.muted }}>{t("लक्षण नहीं मिले", "No symptoms recorded")}</span>}
            </div>
          </div>

          {/* AI Diagnosis */}
          <div style={{ background: C.card, borderRadius: 16, padding: 14, marginBottom: 12, border: `1px solid ${C.border}`, borderLeft: `4px solid ${urgColor}` }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>🤖 {t("AI निदान", "AI Diagnosis")}</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: urgColor }}>{lang === "hi" ? result.conditionHi : result.conditionEn}</div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{lang === "hi" ? result.conditionEn : result.conditionHi}</div>
            {result.summary && (
              <div style={{ marginTop: 10, background: C.bg, borderRadius: 10, padding: "10px 12px", fontSize: 13, color: C.text, lineHeight: 1.6, fontStyle: "italic" }}>{result.summary}</div>
            )}
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              {[
                { l: t("डॉक्टर", "Doctor"), v: lang === "hi" ? result.docType.hi : result.docType.en },
                { l: t("प्रतीक्षा", "Wait"), v: lang === "hi" ? result.wait.hi : result.wait.en, red: result.urgency === "RED" },
                { l: t("संक्रामक?", "Contagious?"), v: lang === "hi" ? result.contagious.hi : result.contagious.en },
              ].map((info, i) => (
                <div key={i} style={{ flex: 1, background: C.bg, borderRadius: 10, padding: 10, border: `1px solid ${C.border}` }}>
                  <div style={{ fontSize: 9, color: C.muted, fontWeight: 600, textTransform: "uppercase" }}>{info.l}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: info.red ? C.red : C.text, marginTop: 3 }}>{info.v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Do Now */}
          <div style={{ background: C.card, borderRadius: 16, padding: 14, marginBottom: 12, border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>✅ {t("अभी यह करें", "Do This Now")}</div>
            {result.doNow.map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 8, padding: "7px 0", borderBottom: i < result.doNow.length - 1 ? `1px solid ${C.border}` : "none" }}>
                <div style={{ width: 22, height: 22, borderRadius: "50%", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: C.primary, flexShrink: 0, marginTop: 1 }}>{i + 1}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{lang === "hi" ? item.hi : item.en}</div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>{lang === "hi" ? item.en : item.hi}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Doctor rec */}
          <div style={{ background: result.urgency === "RED" ? "#FDEDED" : "#E8F8EF", borderRadius: 16, padding: 14, border: `1px solid ${result.urgency === "RED" ? "#F1948A" : "#A9DFBF"}`, marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: result.urgency === "RED" ? C.red : C.green, marginBottom: 4 }}>
              {result.urgency === "RED" ? "🚨 " : "🏥 "}{lang === "hi" ? result.docType.hi : result.docType.en}
            </div>
            <div style={{ fontSize: 12, color: C.muted }}>{t("अनुशंसित प्रतीक्षा समय:", "Recommended wait time:")} <strong>{lang === "hi" ? result.wait.hi : result.wait.en}</strong></div>
            {result.emergency && (
              <a href="tel:108" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 10, background: "linear-gradient(135deg,#E74C3C,#922B21)", color: "white", padding: "12px", borderRadius: 12, textDecoration: "none", fontWeight: 800, fontSize: 14 }}>
                📞 {t("108 पर कॉल करें — आपातकाल", "Call 108 — Emergency")}
              </a>
            )}
          </div>

          <div style={{ background: "#FEF9E7", borderRadius: 12, padding: 12, border: "1px solid #F4D03F", marginBottom: 20 }}>
            <div style={{ fontSize: 11, color: "#7D6608", lineHeight: 1.5 }}>
              ⚠️ {t("यह रिपोर्ट AI द्वारा तैयार की गई है। यह डॉक्टर की सलाह का विकल्प नहीं है।", "This report is AI-generated and is not a substitute for professional medical advice.")}
            </div>
          </div>

          {/* ── PRESCRIPTION SECTION — attached below report ── */}
          {hasPrescription ? (
            <>
              {/* Section divider */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, transparent, #B0C8E0)` }} />
                <div style={{ fontSize: 11, fontWeight: 800, color: "#1B6CA8", letterSpacing: 1.5, textTransform: "uppercase", background: "#EBF4FD", padding: "5px 14px", borderRadius: 20, border: "1px solid #C0D8F0", whiteSpace: "nowrap" }}>
                  💊 Doctor&apos;s Prescription
                </div>
                <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, #B0C8E0, transparent)` }} />
              </div>

              {/* Print button */}
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
                <button onClick={handlePrintPrescription} style={{ padding: "9px 16px", borderRadius: 10, border: `1px solid ${C.primary}`, background: "white", color: C.primary, fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                  🖨️ Print Prescription
                </button>
              </div>

              {/* The prescription slip */}
              <PrescriptionSlip
                patient={patient}
                rxRows={rxRows}
                doctorName={doctorName}
                doctorNotes={doctorNotes}
                consultationDate={reportDate}
              />

              <div style={{ background: "#FEF9E7", borderRadius: 10, padding: 10, border: "1px solid #F4D03F", marginTop: 10 }}>
                <div style={{ fontSize: 10.5, color: "#7D6608", lineHeight: 1.5 }}>
                  ⚠️ This prescription was issued by a doctor via Aarogya AI telemedicine. Show this to a pharmacist. Do not self-medicate beyond what is prescribed.
                </div>
              </div>
            </>
          ) : null}

        </div>

        {/* Bottom actions */}
        <div style={{ position: "fixed", bottom: 0, width: 390, background: C.card, borderTop: `2px solid ${C.border}`, padding: "10px 16px", display: "flex", gap: 8, zIndex: 50 }}>
          <button onClick={() => router.push("/confirm")} style={{ flex: 1, padding: 12, borderRadius: 14, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 13, background: `linear-gradient(135deg,${C.primary},${C.primaryDark})`, color: "white" }}>
            📅 {t("डॉक्टर बुक करें", "Book Doctor")}
          </button>
          <button onClick={() => router.push("/medicine")} style={{ flex: 1, padding: 12, borderRadius: 14, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 13, background: "linear-gradient(135deg,#27AE60,#1E8449)", color: "white" }}>
            💊 {t("दवाई खोजें", "Find Medicine")}
          </button>
        </div>
      </div>
    </div>
  );
}
