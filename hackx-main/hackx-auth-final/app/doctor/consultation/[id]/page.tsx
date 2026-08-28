"use client";
import { useRouter, useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
const VideoCallModal = dynamic(() => import("@/components/VideoCallModal"), { ssr: false });

const C = {
  primary: "#1B6CA8", primaryDark: "#0F4C7A", green: "#1E8449", greenLight: "#27AE60",
  red: "#C0392B", redLight: "#E74C3C", bg: "#F0F4F8", card: "#FFFFFF",
  text: "#1A2332", muted: "#6B7C93", border: "#DDE3EC",
};

const URGENCY_COLOR: Record<string, string> = { RED: C.red, YELLOW: "#B7770D", GREEN: C.green };
const URGENCY_BG: Record<string, string> = { RED: "#FDEDED", YELLOW: "#FEF9E7", GREEN: "#E8F8EF" };

interface RxRow { medicine: string; dose: string; frequency: string; duration: string; instructions: string; }

type Consultation = {
  _id: string;
  patientPhone: string;
  patientName: string;
  symptoms: string[];
  urgency: "RED" | "YELLOW" | "GREEN";
  triageResult: { summary?: string; aiSummary?: string; ragReasoning?: string };
  slot?: string;
  queueNo?: string;
  status: string;
  createdAt: string;
  doctorNotes?: string;
  prescription?: string;
  doctorName?: string;
  patientContext?: any;
  uploadedRecords?: any[];
  voiceNoteBase64?: string;
};

const emptyRow = (): RxRow => ({ medicine: "", dose: "", frequency: "", duration: "", instructions: "" });

export default function ConsultationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const { data: session } = useSession();
  const [doctorName, setDoctorName] = useState("");
  const [rxRows, setRxRows] = useState<RxRow[]>([emptyRow()]);
  const [diagnosis, setDiagnosis] = useState("");
  const [saving, setSaving] = useState(false);
  const [callOpen, setCallOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchConsultation = async () => {
      try {
        const res = await fetch(`/api/consultations?id=${id}`);
        const data = await res.json();
        const found: Consultation = data.consultation;
        if (found) {
          setConsultation(found);
          setNotes(found.doctorNotes || "");
          const defaultName = session?.user?.name ? `Dr. ${session.user.name.replace(/^(Dr\.?\s*)/i, "").trim()}` : "";
          setDoctorName(found.doctorName || defaultName);
          if (found.prescription) {
            try {
              const parsed = JSON.parse(found.prescription);
              if (Array.isArray(parsed) && parsed.length > 0) {
                setRxRows(parsed);
              }
            } catch {
              // legacy plain text — keep default
            }
          }
        }
      } catch { /* offline */ }
      setLoading(false);
    };
    fetchConsultation();
  }, [id, session]);

  const updateRow = (i: number, field: keyof RxRow, val: string) => {
    setRxRows(rows => rows.map((r, idx) => idx === i ? { ...r, [field]: val } : r));
  };

  const addRow = () => setRxRows(rows => [...rows, emptyRow()]);
  const removeRow = (i: number) => setRxRows(rows => rows.filter((_, idx) => idx !== i));

  const overrideUrgency = async (newUrgency: "RED" | "YELLOW" | "GREEN") => {
    if (!consultation || newUrgency === consultation.urgency) return;
    setConsultation(prev => prev ? { ...prev, urgency: newUrgency } : prev);
    try {
      await fetch("/api/consultations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, urgency: newUrgency }),
      });
    } catch { /* ignore */ }
  };

  const saveAndComplete = async () => {
    setSaving(true);
    const prescriptionJson = JSON.stringify(rxRows.filter(r => r.medicine.trim()));
    try {
      await fetch("/api/consultations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          status: "completed",
          doctorNotes: notes,
          prescription: prescriptionJson,
          doctorName,
          urgency: consultation?.urgency, // Save the overridden urgency just in case
        }),
      });
      router.push("/doctor/dashboard");
    } catch { /* offline */ }
    setSaving(false);
  };

  const saveNotes = async () => {
    setSaving(true);
    const prescriptionJson = JSON.stringify(rxRows.filter(r => r.medicine.trim()));
    try {
      await fetch("/api/consultations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, doctorNotes: notes, prescription: prescriptionJson, doctorName }),
      });
    } catch { /* offline */ }
    setSaving(false);
  };

  if (loading) {
    return (
      <div style={{ background: "#0d1520", minHeight: "100vh", display: "flex", justifyContent: "center" }}>
        <div style={{ width: 390, background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ textAlign: "center", color: C.muted }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
            <div style={{ fontSize: 14 }}>Loading consultation...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!consultation) {
    return (
      <div style={{ background: "#0d1520", minHeight: "100vh", display: "flex", justifyContent: "center" }}>
        <div style={{ width: 390, background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ textAlign: "center", color: C.muted, padding: 24 }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>❌</div>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>Consultation not found</div>
            <button onClick={() => router.push("/doctor/dashboard")} style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: C.primary, color: "white", fontWeight: 700, cursor: "pointer" }}>
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const urgencyColor = URGENCY_COLOR[consultation.urgency] || C.muted;
  const urgencyBg = URGENCY_BG[consultation.urgency] || C.bg;
  const initial = consultation.patientName?.[0]?.toUpperCase() || "?";
  const aiNote = consultation.triageResult?.summary || consultation.triageResult?.aiSummary || "";
  const urgencyEmoji = consultation.urgency === "RED" ? "🔴" : consultation.urgency === "YELLOW" ? "🟡" : "🟢";

  return (
    <div style={{ background: "#0d1520", minHeight: "100vh", display: "flex", justifyContent: "center" }}>
      <div style={{ width: 390, background: C.bg, minHeight: "100vh", display: "flex", flexDirection: "column" }}>

        <div style={{ background: "#E8F8EF", padding: "6px 16px", fontSize: 12, fontWeight: 700, color: C.green, display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.green }} />
          Online · Syncing in real-time
        </div>

        <div style={{ display: "flex", alignItems: "center", padding: "10px 14px", gap: 10, background: C.card, borderBottom: `1px solid ${C.border}` }}>
          <button onClick={() => router.push("/doctor/dashboard")} style={{ width: 36, height: 36, borderRadius: 10, background: C.bg, border: "none", fontSize: 18, cursor: "pointer" }}>←</button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>Consultation Detail</div>
            <div style={{ fontSize: 11, color: C.muted }}>{consultation.patientName} — {consultation.urgency} Urgency</div>
          </div>
          <span style={{ background: urgencyBg, color: urgencyColor, padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
            {urgencyEmoji} {consultation.urgency}
          </span>
        </div>

        <div style={{ background: urgencyBg, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, borderBottom: `1px solid ${C.border}` }}>
          <div style={{ width: 46, height: 46, borderRadius: "50%", background: urgencyColor, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 800, fontSize: 18 }}>
            {initial}
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800 }}>{consultation.patientName}</div>
            <div style={{ fontSize: 12, color: C.muted }}>📱 {consultation.patientPhone}</div>
            {consultation.slot && (
              <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                🕐 {consultation.slot}{consultation.queueNo ? ` · #${consultation.queueNo}` : ""}
              </div>
            )}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>

          {consultation.symptoms?.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>🩺 SYMPTOMS</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {consultation.symptoms.map((sym, i) => (
                  <span key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "4px 10px", fontSize: 12, fontWeight: 600 }}>{sym}</span>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>🤖 AI TRIAGE RESULT & REASONING</div>
            <div style={{ background: C.card, borderRadius: 16, padding: 14, border: `1px solid ${C.border}`, borderLeft: `4px solid ${urgencyColor}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: urgencyColor }}>
                  {urgencyEmoji} {consultation.urgency === "RED" ? "Needs Immediate Attention" : consultation.urgency === "YELLOW" ? "Needs Attention" : "Stable"}
                </div>
                
                {/* Triage Override Controls */}
                <div style={{ display: "flex", gap: 4, background: C.bg, padding: 4, borderRadius: 8 }}>
                  {["RED", "YELLOW", "GREEN"].map((u) => (
                    <button
                      key={u}
                      onClick={() => overrideUrgency(u as any)}
                      style={{
                        padding: "4px 8px",
                        fontSize: 10,
                        fontWeight: 800,
                        borderRadius: 6,
                        border: "none",
                        cursor: "pointer",
                        background: consultation.urgency === u ? URGENCY_COLOR[u] : "transparent",
                        color: consultation.urgency === u ? "white" : C.muted
                      }}
                    >
                      {u}
                    </button>
                  ))}
                </div>
              </div>

              {consultation.triageResult?.ragReasoning && (
                <>
                  <div style={{ height: 1, background: C.border, margin: "10px 0" }} />
                  <div style={{ fontSize: 13, color: C.text, lineHeight: 1.6, fontWeight: 500 }}>
                    <span style={{ fontWeight: 800 }}>Reasoning: </span> 
                    {consultation.triageResult.ragReasoning}
                  </div>
                </>
              )}
              
              {!consultation.triageResult?.ragReasoning && aiNote && (
                <>
                  <div style={{ height: 1, background: C.border, margin: "10px 0" }} />
                  <div style={{ fontSize: 13, color: C.text, lineHeight: 1.6 }}>{aiNote}</div>
                </>
              )}
            </div>
          </div>

          {consultation.patientContext && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>📝 PATIENT HISTORY</div>
              <div style={{ background: C.card, borderRadius: 16, padding: 14, border: `1px solid ${C.border}` }}>
                {consultation.patientContext.duration && (
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>Symptom Duration:</div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{consultation.patientContext.duration}</div>
                  </div>
                )}
                {consultation.patientContext.diseases?.length > 0 && (
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>Pre-existing Conditions:</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                      {consultation.patientContext.diseases.map((d: string, i: number) => (
                        <span key={i} style={{ background: "#F5EEF8", color: "#8E44AD", borderRadius: 8, padding: "2px 8px", fontSize: 12, fontWeight: 600 }}>{d}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Voice Note Player */}
          {consultation.voiceNoteBase64 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>🎤 PATIENT VOICE NOTE</div>
              <div style={{ background: C.card, borderRadius: 16, padding: 14, border: `1px solid ${C.border}` }}>
                <audio controls style={{ width: "100%" }} src={consultation.voiceNoteBase64} />
              </div>
            </div>
          )}

          {/* Doctor Name field */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>👨‍⚕️ DOCTOR NAME (for prescription)</div>
            <input
              style={{ width: "100%", padding: "12px 16px", border: `2px solid ${C.border}`, borderRadius: 12, fontSize: 14, fontFamily: "inherit", background: C.card, color: C.text, outline: "none", boxSizing: "border-box" }}
              placeholder="e.g. Dr. Priya Sharma"
              value={doctorName}
              onChange={(e) => setDoctorName(e.target.value)}
            />
          </div>

          {/* Doctor Notes */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>📋 CLINICAL NOTES / DIAGNOSIS</div>
            <textarea
              style={{ width: "100%", padding: "14px 16px", border: `2px solid ${C.border}`, borderRadius: 12, fontSize: 14, fontFamily: "inherit", background: C.card, color: C.text, outline: "none", lineHeight: 1.6, boxSizing: "border-box" }}
              rows={3}
              placeholder="e.g. Suspected viral fever. Monitor for 48 hrs..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Prescription Table */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span>💊 PRESCRIPTION (Rx)</span>
              <span style={{ fontSize: 10, color: C.primary, fontWeight: 700, background: "#EBF4FD", padding: "3px 8px", borderRadius: 6 }}>Will appear on prescription slip</span>
            </div>

            {rxRows.map((row, i) => (
              <div key={i} style={{ background: C.card, borderRadius: 14, padding: 14, marginBottom: 10, border: `1.5px solid ${C.border}`, position: "relative" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <div style={{ width: 26, height: 26, borderRadius: 8, background: "#EBF4FD", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: C.primary }}>
                    {i + 1}
                  </div>
                  {rxRows.length > 1 && (
                    <button onClick={() => removeRow(i)} style={{ background: "#FDEDED", border: "none", borderRadius: 8, padding: "4px 10px", fontSize: 12, color: C.red, fontWeight: 700, cursor: "pointer" }}>✕ Remove</button>
                  )}
                </div>
                <div style={{ display: "grid", gap: 8 }}>
                  <input
                    style={{ width: "100%", padding: "10px 12px", border: `1.5px solid ${C.border}`, borderRadius: 10, fontSize: 13, fontFamily: "inherit", background: C.bg, color: C.text, outline: "none", boxSizing: "border-box" }}
                    placeholder="Medicine name (e.g. Paracetamol 500mg)"
                    value={row.medicine}
                    onChange={(e) => updateRow(i, "medicine", e.target.value)}
                  />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <input
                      style={{ padding: "10px 12px", border: `1.5px solid ${C.border}`, borderRadius: 10, fontSize: 13, fontFamily: "inherit", background: C.bg, color: C.text, outline: "none" }}
                      placeholder="Dose (e.g. 1 tablet)"
                      value={row.dose}
                      onChange={(e) => updateRow(i, "dose", e.target.value)}
                    />
                    <input
                      style={{ padding: "10px 12px", border: `1.5px solid ${C.border}`, borderRadius: 10, fontSize: 13, fontFamily: "inherit", background: C.bg, color: C.text, outline: "none" }}
                      placeholder="Frequency (e.g. Twice daily)"
                      value={row.frequency}
                      onChange={(e) => updateRow(i, "frequency", e.target.value)}
                    />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <input
                      style={{ padding: "10px 12px", border: `1.5px solid ${C.border}`, borderRadius: 10, fontSize: 13, fontFamily: "inherit", background: C.bg, color: C.text, outline: "none" }}
                      placeholder="Duration (e.g. 5 days)"
                      value={row.duration}
                      onChange={(e) => updateRow(i, "duration", e.target.value)}
                    />
                    <input
                      style={{ padding: "10px 12px", border: `1.5px solid ${C.border}`, borderRadius: 10, fontSize: 13, fontFamily: "inherit", background: C.bg, color: C.text, outline: "none" }}
                      placeholder="Instructions (e.g. After food)"
                      value={row.instructions}
                      onChange={(e) => updateRow(i, "instructions", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}

            <button onClick={addRow} style={{ width: "100%", padding: "11px", borderRadius: 12, border: `2px dashed ${C.border}`, background: "transparent", color: C.primary, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
              + Add Another Medicine
            </button>
          </div>

          <button
            onClick={() => setCallOpen(true)}
            style={{ width: "100%", padding: 13, borderRadius: 14, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 14, background: `linear-gradient(135deg,${C.primary},${C.primaryDark})`, color: "white", marginBottom: 10 }}
          >
            📞 Call Patient
          </button>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={saveAndComplete}
              disabled={saving}
              style={{ flex: 1, padding: 13, borderRadius: 14, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 14, background: `linear-gradient(135deg,#27AE60,#1E8449)`, color: "white", opacity: saving ? 0.7 : 1 }}
            >
              {saving ? "Saving..." : "✓ Complete & Send Rx"}
            </button>
            <button
              onClick={saveNotes}
              disabled={saving}
              style={{ flex: 1, padding: 13, borderRadius: 14, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 14, background: `linear-gradient(135deg,${C.redLight},${C.red})`, color: "white", opacity: saving ? 0.7 : 1 }}
            >
              💾 Save Draft
            </button>
          </div>
        </div>
      </div>

      {callOpen && (
        <VideoCallModal
          isOpen={true}
          onClose={() => setCallOpen(false)}
          patientName={consultation.patientName}
          patientId={consultation.patientPhone}
          isDoctor={true}
        />
      )}
    </div>
  );
}
