"use client";
import { useRouter, useParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
const VideoCallModal = dynamic(() => import("@/components/VideoCallModal"), { ssr: false });

const C = {
  primary: "#1B6CA8",
  primaryDark: "#0F4C7A",
  green: "#1E8449",
  greenLight: "#27AE60",
  red: "#C0392B",
  redLight: "#E74C3C",
  bg: "#F0F4F8",
  card: "#FFFFFF",
  cardLight: "#F8FAFC",
  text: "#1A2332",
  muted: "#6B7C93",
  border: "#DDE3EC",
  purple: "#7D3C98",
  cyan: "#0891B2",
};

const URGENCY_COLOR: Record<string, string> = { RED: C.red, YELLOW: "#B7770D", GREEN: C.green };
const URGENCY_BG: Record<string, string> = { RED: "#FDEDED", YELLOW: "#FEF9E7", GREEN: "#E8F8EF" };

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  SENT_TO_LAB: { label: "Sent to Lab", color: "#0284C7", bg: "#E0F2FE" },
  LAB_ACCEPTED: { label: "Accepted by Lab", color: "#059669", bg: "#D1FAE5" },
  LAB_REJECTED: { label: "Rejected by Lab", color: "#DC2626", bg: "#FEE2E2" },
  APPOINTMENT_CONFIRMED: { label: "Slot Booked", color: "#7C3AED", bg: "#EDE9FE" },
  SAMPLE_COLLECTED: { label: "Sample Collected", color: "#D97706", bg: "#FEF3C7" },
  PROCESSING: { label: "In Analyzer", color: "#DB2777", bg: "#FCE7F3" },
  REPORT_UPLOADED: { label: "Report Ready (Review)", color: "#16A34A", bg: "#DCFCE7" },
  DOCTOR_REVIEWED: { label: "✓ Reviewed by Doctor", color: "#2563EB", bg: "#DBEAFE" },
  CANCELLED: { label: "Cancelled", color: "#64748B", bg: "#F1F5F9" },
};

const STANDARD_TESTS = [
  "Complete Blood Count (CBC)",
  "Blood Sugar (Fasting)",
  "Blood Sugar (Random)",
  "HbA1c (Glycated Hemoglobin)",
  "Lipid Profile",
  "Liver Function Test (LFT)",
  "Kidney Function Test (KFT)",
  "Thyroid Profile (T3, T4, TSH)",
  "Urine Routine & Microscopic",
  "Malaria Rapid Test",
  "Dengue NS1 Antigen",
  "Typhoid (Widal Test)",
  "Serum Creatinine",
  "Serum Electrolytes",
];

interface RxRow {
  medicine: string;
  dose: string;
  frequency: string;
  duration: string;
  instructions: string;
}

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
  const [saving, setSaving] = useState(false);
  const [callOpen, setCallOpen] = useState(false);
  const [referModalOpen, setReferModalOpen] = useState(false);
  const [referralTarget, setReferralTarget] = useState("District Hospital, Nabha");
  const [referralReason, setReferralReason] = useState("");
  const [exporting, setExporting] = useState(false);

  // Diagnostic Lab Order State
  const [labOrders, setLabOrders] = useState<any[]>([]);
  const [availableLabs, setAvailableLabs] = useState<any[]>([]);
  const [labModalOpen, setLabModalOpen] = useState(false);
  const [selectedLabId, setSelectedLabId] = useState("");
  const [selectedTests, setSelectedTests] = useState<string[]>(["Complete Blood Count (CBC)"]);
  const [labPriority, setLabPriority] = useState<"NORMAL" | "URGENT">("NORMAL");
  const [labInstructions, setLabInstructions] = useState("");
  const [submittingLab, setSubmittingLab] = useState(false);

  // Doctor Review Report State
  const [reviewModalOrder, setReviewModalOrder] = useState<any | null>(null);
  const [doctorReviewText, setDoctorReviewText] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const fetchLabOrders = useCallback(async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/lab-orders?consultationId=${id}`);
      const data = await res.json();
      setLabOrders(data.orders || []);
    } catch {
      // offline
    }
  }, [id]);

  const fetchLabs = useCallback(async () => {
    try {
      const res = await fetch("/api/labs");
      const data = await res.json();
      const labs = data.labs || [];
      setAvailableLabs(labs);
      if (labs.length > 0 && !selectedLabId) {
        setSelectedLabId(labs[0].labId);
      }
    } catch {
      // offline
    }
  }, [selectedLabId]);

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
              // legacy plain text
            }
          }
        }
      } catch {
        /* offline */
      }
      setLoading(false);
    };

    fetchConsultation();
    fetchLabOrders();
    fetchLabs();
  }, [id, session, fetchLabOrders, fetchLabs]);

  const updateRow = (i: number, field: keyof RxRow, val: string) => {
    setRxRows((rows) => rows.map((r, idx) => (idx === i ? { ...r, [field]: val } : r)));
  };

  const addRow = () => setRxRows((rows) => [...rows, emptyRow()]);
  const removeRow = (i: number) => setRxRows((rows) => rows.filter((_, idx) => idx !== i));

  const overrideUrgency = async (newUrgency: "RED" | "YELLOW" | "GREEN") => {
    if (!consultation || newUrgency === consultation.urgency) return;
    setConsultation((prev) => (prev ? { ...prev, urgency: newUrgency } : prev));
    try {
      await fetch("/api/consultations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, urgency: newUrgency }),
      });
    } catch {
      /* ignore */
    }
  };

  const handleCreateLabOrder = async () => {
    if (!selectedLabId || selectedTests.length === 0) {
      alert("Please select at least 1 diagnostic test and 1 registered laboratory.");
      return;
    }
    setSubmittingLab(true);

    const chosenLab = availableLabs.find((l) => l.labId === selectedLabId);

    try {
      const res = await fetch("/api/lab-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          consultationId: id,
          patientPhone: consultation?.patientPhone,
          patientName: consultation?.patientName,
          doctorId: session?.user?.email || "doctor",
          doctorName: doctorName || "Consulting Physician",
          labId: selectedLabId,
          labName: chosenLab?.name || "Diagnostic Laboratory",
          tests: selectedTests,
          priority: labPriority,
          doctorInstructions: labInstructions,
        }),
      });

      if (res.ok) {
        setLabModalOpen(false);
        setLabInstructions("");
        await fetchLabOrders();
      } else {
        const err = await res.json();
        alert("Error creating lab order: " + err.error);
      }
    } catch {
      alert("Failed to create lab order. Please check network connection.");
    } finally {
      setSubmittingLab(false);
    }
  };

  const handleSubmitDoctorReview = async () => {
    if (!reviewModalOrder) return;
    setSubmittingReview(true);
    try {
      const res = await fetch("/api/lab-orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: reviewModalOrder.orderId,
          doctorReviewNotes: doctorReviewText || "Reviewed report. Findings noted in clinical chart.",
        }),
      });
      if (res.ok) {
        setReviewModalOrder(null);
        setDoctorReviewText("");
        await fetchLabOrders();
      }
    } catch (err) {
      console.error("Failed to submit doctor review:", err);
    } finally {
      setSubmittingReview(false);
    }
  };

  const toggleTestSelection = (test: string) => {
    setSelectedTests((prev) =>
      prev.includes(test) ? prev.filter((t) => t !== test) : [...prev, test]
    );
  };

  const saveAndComplete = async () => {
    setSaving(true);
    const prescriptionJson = JSON.stringify(rxRows.filter((r) => r.medicine.trim()));
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
          urgency: consultation?.urgency,
        }),
      });
      router.push("/doctor/dashboard");
    } catch {
      /* offline */
    }
    setSaving(false);
  };

  const saveNotes = async () => {
    setSaving(true);
    const prescriptionJson = JSON.stringify(rxRows.filter((r) => r.medicine.trim()));
    try {
      await fetch("/api/consultations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, doctorNotes: notes, prescription: prescriptionJson, doctorName }),
      });
    } catch {
      /* offline */
    }
    setSaving(false);
  };

  const handleReferPatient = async () => {
    setSaving(true);
    const prescriptionJson = JSON.stringify(rxRows.filter((r) => r.medicine.trim()));
    try {
      await fetch("/api/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientPhone: consultation?.patientPhone,
          patientName: consultation?.patientName,
          consultationId: id,
          referredByDoctorId: session?.user?.email || "doctor",
          referredByDoctorName: doctorName,
          sourceFacility: "Telemedicine Platform",
          targetFacility: referralTarget,
          reasonForReferral: referralReason || notes || "Requires advanced care",
          urgency: consultation?.urgency,
        }),
      });

      await fetch("/api/consultations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          status: "completed",
          doctorNotes: notes + `\n\n[REFERRED TO ${referralTarget}]: ${referralReason}`,
          prescription: prescriptionJson,
          doctorName,
          urgency: consultation?.urgency,
        }),
      });
      router.push("/doctor/dashboard");
    } catch {
      /* offline */
    }
    setSaving(false);
    setReferModalOpen(false);
  };

  const handleExportABDM = async () => {
    setExporting(true);
    try {
      const res = await fetch("/api/abdm/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consultationId: id }),
      });
      const data = await res.json();
      if (res.ok) {
        alert("✅ Success: " + data.message + "\n\nFHIR Bundle generated for patient.");
      } else {
        alert("❌ Error: " + data.error);
      }
    } catch {
      alert("Network error while exporting to ABDM");
    }
    setExporting(false);
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

        {/* Top Header */}
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

        {/* Patient Identity */}
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
          {/* Symptoms */}
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

          {/* AI Triage Reasoning */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>🤖 AI TRIAGE RESULT & REASONING</div>
            <div style={{ background: C.card, borderRadius: 16, padding: 14, border: `1px solid ${C.border}`, borderLeft: `4px solid ${urgencyColor}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: urgencyColor }}>
                  {urgencyEmoji} {consultation.urgency === "RED" ? "Needs Immediate Attention" : consultation.urgency === "YELLOW" ? "Needs Attention" : "Stable"}
                </div>
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
                        color: consultation.urgency === u ? "white" : C.muted,
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

          {/* Patient Voice Note */}
          {consultation.voiceNoteBase64 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>🎤 PATIENT VOICE NOTE</div>
              <div style={{ background: C.card, borderRadius: 16, padding: 14, border: `1px solid ${C.border}` }}>
                <audio controls style={{ width: "100%" }} src={consultation.voiceNoteBase64} />
              </div>
            </div>
          )}

          {/* Doctor Name */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>👨‍⚕️ DOCTOR NAME</div>
            <input
              style={{ width: "100%", padding: "12px 16px", border: `2px solid ${C.border}`, borderRadius: 12, fontSize: 14, fontFamily: "inherit", background: C.card, color: C.text, outline: "none", boxSizing: "border-box" }}
              placeholder="e.g. Dr. Priya Sharma"
              value={doctorName}
              onChange={(e) => setDoctorName(e.target.value)}
            />
          </div>

          {/* Clinical Notes */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>📋 CLINICAL NOTES / DIAGNOSIS</div>
            <textarea
              style={{ width: "100%", padding: "14px 16px", border: `2px solid ${C.border}`, borderRadius: 12, fontSize: 14, fontFamily: "inherit", background: C.card, color: C.text, outline: "none", lineHeight: 1.6, boxSizing: "border-box" }}
              rows={3}
              placeholder="e.g. Suspected viral fever. Advised diagnostic tests..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* FEATURE 1: DIAGNOSTIC LAB ORDERS */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span>🧪 DIAGNOSTIC LAB ORDERS ({labOrders.length})</span>
              <button
                type="button"
                onClick={() => setLabModalOpen(true)}
                style={{ background: "linear-gradient(135deg, #06B6D4, #0E7490)", color: "white", border: "none", borderRadius: 8, padding: "5px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
              >
                + Prescribe Lab Test
              </button>
            </div>

            {labOrders.length === 0 ? (
              <div style={{ background: C.card, borderRadius: 14, padding: "14px 16px", border: `1px dashed ${C.border}`, textAlign: "center" }}>
                <div style={{ fontSize: 13, color: C.muted }}>No diagnostic tests prescribed yet for this consultation.</div>
                <button
                  type="button"
                  onClick={() => setLabModalOpen(true)}
                  style={{ marginTop: 8, background: "none", border: "none", color: C.cyan, fontSize: 12, fontWeight: 700, cursor: "pointer", textDecoration: "underline" }}
                >
                  Select Test & Registered Lab →
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {labOrders.map((order) => {
                  const cfg = STATUS_LABELS[order.status] || { label: order.status, color: C.muted, bg: C.bg };
                  return (
                    <div key={order._id} style={{ background: C.card, borderRadius: 14, padding: 14, border: `1px solid ${C.border}` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 800, color: C.text }}>
                            🏥 {order.labName}
                          </div>
                          <div style={{ fontSize: 11, color: C.muted }}>
                            Order: <code>{order.orderId}</code> · Priority: <strong style={{ color: order.priority === "URGENT" ? C.red : C.primary }}>{order.priority}</strong>
                          </div>
                        </div>
                        <span style={{ fontSize: 10, fontWeight: 700, color: cfg.color, background: cfg.bg, padding: "3px 8px", borderRadius: 8 }}>
                          {cfg.label}
                        </span>
                      </div>

                      {/* Tests in order */}
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, margin: "6px 0 10px" }}>
                        {order.tests.map((t: string, idx: number) => (
                          <span key={idx} style={{ background: "#F1F5F9", color: C.text, padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600 }}>
                            {t}
                          </span>
                        ))}
                      </div>

                      {order.appointmentSlot && (
                        <div style={{ fontSize: 11, color: C.purple, marginBottom: 6, fontWeight: 600 }}>
                          📅 Appointment Slot: {order.appointmentSlot}
                        </div>
                      )}

                      {order.doctorReviewNotes && (
                        <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 8, padding: "8px 10px", fontSize: 12, color: "#1D4ED8", marginBottom: 8 }}>
                          <strong>Doctor Review:</strong> {order.doctorReviewNotes}
                        </div>
                      )}

                      {/* Action to view / review report */}
                      {order.reportUrl && (
                        <div style={{ display: "flex", justifyContent: "flex-end" }}>
                          <button
                            onClick={() => {
                              setReviewModalOrder(order);
                              setDoctorReviewText(order.doctorReviewNotes || "");
                            }}
                            style={{
                              background: order.status === "REPORT_UPLOADED" ? "linear-gradient(135deg, #10B981, #059669)" : C.bg,
                              color: order.status === "REPORT_UPLOADED" ? "white" : C.primary,
                              border: `1px solid ${order.status === "REPORT_UPLOADED" ? "transparent" : C.border}`,
                              borderRadius: 8,
                              padding: "6px 12px",
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: "pointer",
                            }}
                          >
                            {order.status === "REPORT_UPLOADED" ? "📄 Review Uploaded Report" : "👁️ View Final Report"}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Prescription Table */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span>💊 PRESCRIPTION (Rx)</span>
              <span style={{ fontSize: 10, color: C.primary, fontWeight: 700, background: "#EBF4FD", padding: "3px 8px", borderRadius: 6 }}>Will appear on prescription slip</span>
            </div>

            {rxRows.map((row, i) => (
              <div key={i} style={{ background: C.card, borderRadius: 14, padding: 14, marginBottom: 10, border: `1.5px solid ${C.border}` }}>
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

          {/* Action Row 1 */}
          <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
            <button
              onClick={() => setCallOpen(true)}
              style={{ flex: 1, padding: 13, borderRadius: 14, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 14, background: `linear-gradient(135deg,${C.primary},${C.primaryDark})`, color: "white" }}
            >
              📞 Call Patient
            </button>
            <button
              onClick={() => setReferModalOpen(true)}
              style={{ flex: 1, padding: 13, borderRadius: 14, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 14, background: `linear-gradient(135deg,#D35400,#E67E22)`, color: "white" }}
            >
              🏥 Refer Patient
            </button>
            <button
              onClick={handleExportABDM}
              disabled={exporting}
              style={{ flex: 1, padding: 13, borderRadius: 14, border: "none", cursor: exporting ? "wait" : "pointer", fontWeight: 700, fontSize: 14, background: `linear-gradient(135deg,#27AE60,#1E8449)`, color: "white", opacity: exporting ? 0.7 : 1 }}
            >
              {exporting ? "⏳ Syncing..." : "🌐 Sync ABDM"}
            </button>
          </div>

          {/* Action Row 2 */}
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={saveAndComplete}
              disabled={saving}
              style={{ flex: 1, padding: 13, borderRadius: 14, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 14, background: `linear-gradient(135deg,#27AE60,#1E8449)`, color: "white", opacity: saving ? 0.7 : 1 }}
            >
              {saving ? "Saving..." : "✓ Complete Consultation"}
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

      {/* Video Call Modal */}
      {callOpen && (
        <VideoCallModal
          isOpen={true}
          onClose={() => setCallOpen(false)}
          patientName={consultation.patientName}
          patientId={consultation.patientPhone}
          isDoctor={true}
        />
      )}

      {/* Modal 1: Prescribe Diagnostic Lab Test */}
      {labModalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: C.card, width: "100%", maxWidth: 440, borderRadius: 24, padding: 22, boxShadow: "0 20px 40px rgba(0,0,0,0.3)", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>🧪 Prescribe Diagnostic Lab Test</h3>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>Patient: {consultation.patientName}</div>
              </div>
              <button onClick={() => setLabModalOpen(false)} style={{ background: C.bg, border: "none", borderRadius: 8, width: 30, height: 30, cursor: "pointer", fontSize: 14 }}>✕</button>
            </div>

            {/* Step 1: Select Tests */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: C.muted, display: "block", marginBottom: 6 }}>
                1. Select Required Diagnostic Tests ({selectedTests.length} chosen)
              </label>
              <div style={{ maxHeight: 150, overflowY: "auto", border: `1px solid ${C.border}`, borderRadius: 12, padding: 8, background: C.bg }}>
                {STANDARD_TESTS.map((test, idx) => {
                  const isChecked = selectedTests.includes(test);
                  return (
                    <div
                      key={idx}
                      onClick={() => toggleTestSelection(test)}
                      style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 8, cursor: "pointer", background: isChecked ? "rgba(6,182,212,0.12)" : "transparent" }}
                    >
                      <input type="checkbox" checked={isChecked} onChange={() => {}} style={{ accentColor: C.primary, cursor: "pointer" }} />
                      <span style={{ fontSize: 12, fontWeight: isChecked ? 700 : 500, color: isChecked ? C.cyan : C.text }}>{test}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Select Registered Lab */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: C.muted, display: "block", marginBottom: 6 }}>
                2. Select Diagnostic Laboratory (Doctor Choice)
              </label>
              <select
                value={selectedLabId}
                onChange={(e) => setSelectedLabId(e.target.value)}
                style={{ width: "100%", padding: 12, borderRadius: 12, border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: 13, outline: "none" }}
              >
                {availableLabs.map((lab) => (
                  <option key={lab.labId} value={lab.labId}>
                    {lab.name} ({lab.city} · {lab.district})
                  </option>
                ))}
              </select>
            </div>

            {/* Step 3: Priority */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: C.muted, display: "block", marginBottom: 6 }}>
                3. Clinical Priority
              </label>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setLabPriority("NORMAL")}
                  style={{ flex: 1, padding: "10px", borderRadius: 10, border: `1.5px solid ${labPriority === "NORMAL" ? C.primary : C.border}`, background: labPriority === "NORMAL" ? "#EBF4FD" : C.bg, color: labPriority === "NORMAL" ? C.primary : C.text, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                >
                  🟢 Normal Priority
                </button>
                <button
                  type="button"
                  onClick={() => setLabPriority("URGENT")}
                  style={{ flex: 1, padding: "10px", borderRadius: 10, border: `1.5px solid ${labPriority === "URGENT" ? C.red : C.border}`, background: labPriority === "URGENT" ? "#FDEDED" : C.bg, color: labPriority === "URGENT" ? C.red : C.text, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                >
                  🔴 Urgent Priority
                </button>
              </div>
            </div>

            {/* Step 4: Clinical Instructions */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: C.muted, display: "block", marginBottom: 6 }}>
                4. Instructions for Lab Staff / Patient
              </label>
              <textarea
                rows={2}
                value={labInstructions}
                onChange={(e) => setLabInstructions(e.target.value)}
                placeholder="e.g. 10 hrs overnight fasting required before sample collection..."
                style={{ width: "100%", padding: "10px 12px", borderRadius: 12, border: `1px solid ${C.border}`, background: C.bg, fontSize: 12, outline: "none", boxSizing: "border-box" }}
              />
            </div>

            {/* Modal Actions */}
            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="button"
                onClick={() => setLabModalOpen(false)}
                style={{ flex: 1, padding: 12, borderRadius: 12, border: `1px solid ${C.border}`, background: C.bg, color: C.muted, fontWeight: 700, cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateLabOrder}
                disabled={submittingLab}
                style={{ flex: 1.5, padding: 12, borderRadius: 12, border: "none", background: "linear-gradient(135deg, #06B6D4, #0E7490)", color: "white", fontWeight: 700, cursor: submittingLab ? "not-allowed" : "pointer", opacity: submittingLab ? 0.7 : 1 }}
              >
                {submittingLab ? "Dispatching..." : "Send Lab Request →"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Doctor Review Report Modal */}
      {reviewModalOrder && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: C.card, width: "100%", maxWidth: 460, borderRadius: 24, padding: 22, boxShadow: "0 20px 40px rgba(0,0,0,0.3)", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>👨‍⚕️ Review Diagnostic Report</h3>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
                  Lab: {reviewModalOrder.labName} · Order ID: <code>{reviewModalOrder.orderId}</code>
                </div>
              </div>
              <button onClick={() => setReviewModalOrder(null)} style={{ background: C.bg, border: "none", borderRadius: 8, width: 30, height: 30, cursor: "pointer", fontSize: 14 }}>✕</button>
            </div>

            {/* Report Content */}
            <div style={{ background: "#0b1329", borderRadius: 14, padding: 14, marginBottom: 14, color: "#93c5fd", fontFamily: "monospace", fontSize: 12, whiteSpace: "pre-wrap", lineHeight: 1.6, maxHeight: 180, overflowY: "auto" }}>
              {decodeURIComponent(reviewModalOrder.reportUrl?.replace("data:text/plain;charset=utf-8,", "") || "Report data attached.")}
            </div>

            {/* Doctor Clinical Assessment */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: C.muted, display: "block", marginBottom: 6 }}>
                Doctor&apos;s Clinical Assessment & Next Steps
              </label>
              <textarea
                rows={3}
                value={doctorReviewText}
                onChange={(e) => setDoctorReviewText(e.target.value)}
                placeholder="e.g. Findings evaluated: Hb normal, Fasting sugar normal. Continue prescribed treatment."
                style={{ width: "100%", padding: "10px 12px", borderRadius: 12, border: `1px solid ${C.border}`, background: C.bg, fontSize: 13, outline: "none", boxSizing: "border-box" }}
              />
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="button"
                onClick={() => setReviewModalOrder(null)}
                style={{ flex: 1, padding: 12, borderRadius: 12, border: `1px solid ${C.border}`, background: C.bg, color: C.muted, fontWeight: 700, cursor: "pointer" }}
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleSubmitDoctorReview}
                disabled={submittingReview}
                style={{ flex: 1.5, padding: 12, borderRadius: 12, border: "none", background: "linear-gradient(135deg, #10B981, #059669)", color: "white", fontWeight: 700, cursor: submittingReview ? "not-allowed" : "pointer" }}
              >
                {submittingReview ? "Submitting..." : "✓ Confirm Review & Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Refer Modal */}
      {referModalOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: C.card, width: 340, borderRadius: 20, padding: 24, boxShadow: "0 20px 25px -5px rgba(0,0,0,0.2)" }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 18, fontWeight: 800 }}>Refer Patient</h3>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: C.muted, display: "block", marginBottom: 6 }}>Target Facility</label>
              <select
                value={referralTarget}
                onChange={(e) => setReferralTarget(e.target.value)}
                style={{ width: "100%", padding: 12, borderRadius: 10, border: `1px solid ${C.border}`, outline: "none", fontSize: 14 }}
              >
                <option value="District Hospital, Nabha">District Hospital, Nabha</option>
                <option value="Tertiary Care Center, Patiala">Tertiary Care Center, Patiala</option>
                <option value="Govt Medical College, Chandigarh">Govt Medical College, Chandigarh</option>
              </select>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: C.muted, display: "block", marginBottom: 6 }}>Reason for Referral</label>
              <textarea
                value={referralReason}
                onChange={(e) => setReferralReason(e.target.value)}
                placeholder="e.g. Needs immediate surgery"
                rows={3}
                style={{ width: "100%", padding: 12, borderRadius: 10, border: `1px solid ${C.border}`, outline: "none", fontSize: 14, fontFamily: "inherit" }}
              />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setReferModalOpen(false)} style={{ flex: 1, padding: 12, background: C.bg, border: "none", borderRadius: 10, fontWeight: 700, cursor: "pointer" }}>Cancel</button>
              <button onClick={handleReferPatient} disabled={saving} style={{ flex: 1, padding: 12, background: "#D35400", color: "white", border: "none", borderRadius: 10, fontWeight: 700, cursor: "pointer", opacity: saving ? 0.7 : 1 }}>{saving ? "..." : "Confirm"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
