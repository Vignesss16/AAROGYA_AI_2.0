"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { useLang } from "@/lib/useLang";
import { useSession, signOut } from "next-auth/react";
import dynamic from "next/dynamic";
const VideoCallModal = dynamic(() => import("@/components/VideoCallModal"), { ssr: false });

const C = {
  primary: "#1B6CA8",
  primaryDark: "#0F4C7A",
  green: "#1E8449",
  greenLight: "#27AE60",
  red: "#C0392B",
  redLight: "#E74C3C",
  yellow: "#F39C12",
  bg: "#F0F4F8",
  card: "#FFFFFF",
  text: "#1A2332",
  muted: "#6B7C93",
  border: "#DDE3EC",
};

type Consultation = {
  _id: string;
  patientPhone: string;
  patientName: string;
  symptoms: string[];
  urgency: "RED" | "YELLOW" | "GREEN";
  triageResult: { summary?: string; aiSummary?: string };
  slot?: string;
  queueNo?: string;
  status: string;
  createdAt: string;
  uploadedRecords?: any[];
};

const BADGE: Record<string, object> = {
  RED: { background: "#FDEDED", color: C.red },
  YELLOW: { background: "#FEF9E7", color: "#B7770D" },
  GREEN: { background: "#E8F8EF", color: C.green },
};

const URGENCY_INITIAL: Record<string, string> = { RED: "R", YELLOW: "Y", GREEN: "G" };
const URGENCY_COLOR: Record<string, string> = { RED: C.red, YELLOW: "#B7770D", GREEN: C.green };
const URGENCY_BG: Record<string, string> = { RED: "#FDEDED", YELLOW: "#FEF9E7", GREEN: "#E8F8EF" };

type SOSAlert = { _id: string; village: string; description: string; affectedCount: number; ashaWorkerName: string; ashaWorkerPhone: string; createdAt: string; doctorNotes?: string; };

export default function DoctorDashboardPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { lang, setLang, mounted } = useLang();
  const [tick, setTick] = useState(30);
  const [activeTab, setActiveTab] = useState<"queue" | "lab-reports" | "referrals" | "reviews">("queue");
  const [queue, setQueue] = useState<Consultation[]>([]);
  const [loadingQueue, setLoadingQueue] = useState(true);
  const [markingDone, setMarkingDone] = useState<string | null>(null);
  const [callPatient, setCallPatient] = useState<{ id: string; name: string; details?: any } | null>(null);
  const [sosAlerts, setSosAlerts] = useState<SOSAlert[]>([]);
  const [selectedSOS, setSelectedSOS] = useState<SOSAlert | null>(null);
  const [sosNote, setSosNote] = useState("");
  const [savingSOS, setSavingSOS] = useState(false);

  // Blood test state
  const [bloodTests, setBloodTests] = useState<any[]>([]);
  const [loadingLabs, setLoadingLabs] = useState(true);
  const [selectedTest, setSelectedTest] = useState<any>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [savingReview, setSavingReview] = useState(false);

  // Referrals & Physical In-Person Follow-up State
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loadingReferrals, setLoadingReferrals] = useState(true);
  const [referralFilter, setReferralFilter] = useState<"ALL" | "IN_PERSON_FOLLOWUP" | "SPECIALIST_FACILITY_TRANSFER">("ALL");

  // Doctor Reviews & Rating State
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewMetrics, setReviewMetrics] = useState<any>({
    totalReviews: 0,
    averageRating: 5.0,
    breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    percentageBreakdown: { 5: 100, 4: 0, 3: 0, 2: 0, 1: 0 },
  });
  const [loadingReviews, setLoadingReviews] = useState(true);

  const fetchQueue = useCallback(async () => {
    if (!session?.user?.id) return; // Wait for session to load
    try {
      // Append doctorId to query
      const doctorIdQuery = `&doctorId=${session.user.id}`;
      const res = await fetch(`/api/consultations?status=pending${doctorIdQuery}`);
      const data = await res.json();
      setQueue(data.consultations || []);
    } catch {
      /* offline */
    }
    setLoadingQueue(false);
  }, [session]);

  const fetchSOS = useCallback(async () => {
    try {
      const res = await fetch("/api/sos");
      const data = await res.json();
      setSosAlerts(data.alerts || []);
    } catch { }
  }, []);

  const fetchReferrals = useCallback(async () => {
    try {
      const docEmail = session?.user?.email || "";
      const docName = session?.user?.name || "";
      const docQuery = docEmail ? `doctorId=${encodeURIComponent(docEmail)}` : `doctorName=${encodeURIComponent(docName)}`;
      const res = await fetch(`/api/referrals?${docQuery}`);
      const data = await res.json();
      setReferrals(data.referrals || []);
    } catch {
      /* offline */
    } finally {
      setLoadingReferrals(false);
    }
  }, [session]);

  const fetchReviews = useCallback(async () => {
    if (!session?.user?.id && !session?.user?.name) return;
    try {
      const docQuery = session.user.id
        ? `doctorId=${session.user.id}`
        : `doctorName=${encodeURIComponent(session.user.name || "")}`;
      const res = await fetch(`/api/reviews?${docQuery}`);
      const data = await res.json();
      setReviews(data.reviews || []);
      if (data.metrics) {
        setReviewMetrics(data.metrics);
      }
    } catch {
      /* offline */
    } finally {
      setLoadingReviews(false);
    }
  }, [session]);

  const fetchBloodTests = useCallback(async () => {
    if (!session?.user?.id) return; // Wait for session to load
    try {
      const doctorIdQuery = `&doctorId=${session.user.id}`;
      // Fetch critical tests first, then all tests
      const [criticalRes, allRes] = await Promise.all([
        fetch(`/api/blood-tests?isCritical=true${doctorIdQuery}`),
        fetch(`/api/blood-tests?${doctorIdQuery.slice(1)}`),
      ]);
      const criticalData = await criticalRes.json();
      const allData = await allRes.json();
      
      // Merge: critical first, then rest
      const criticalIds = new Set((criticalData.tests || []).map((t: any) => t._id));
      const allTests = allData.tests || [];
      const criticalTests = (criticalData.tests || []).filter((t: any) => !criticalIds.has(t._id));
      
      setBloodTests([...criticalTests, ...allTests]);
    } catch {
      setBloodTests([]);
    }
    setLoadingLabs(false);
  }, [session]);

  const handleUpdateReferralStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch("/api/referrals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (res.ok) {
        setReferrals((prev) =>
          prev.map((r) => (r._id === id ? { ...r, status: newStatus } : r))
        );
      }
    } catch {
      /* offline */
    }
  };

  // Auto-refresh lab reports, referrals and reviews every 30 seconds
  useEffect(() => {
    fetchReviews();
    fetchReferrals();
    const interval = setInterval(() => {
      fetchBloodTests();
      fetchReviews();
      fetchReferrals();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchBloodTests, fetchReviews, fetchReferrals]);

  const handleReviewTest = async (testId: string) => {
    if (!reviewNote.trim()) return;
    setSavingReview(true);
    try {
      const res = await fetch("/api/blood-tests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testId,
          reviewedNotes: reviewNote,
          status: "reviewed",
        }),
      });
      if (res.ok) {
        setReviewNote("");
        setSelectedTest(null);
        fetchBloodTests();
      }
    } catch (err) {
      alert("Failed to save review");
    } finally {
      setSavingReview(false);
    }
  };

  useEffect(() => {
    fetchQueue();
    fetchSOS();
    fetchBloodTests();
  }, [fetchQueue, fetchSOS, fetchBloodTests]);

  useEffect(() => {
    const iv = setInterval(() => {
      setTick((t) => {
        if (t <= 1) {
          fetchQueue();
          fetchSOS();
          return 30;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [fetchQueue]);

  const markDone = async (id: string) => {
    setMarkingDone(id);
    try {
      await fetch("/api/consultations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "completed" }),
      });
      setQueue((q) => q.filter((c) => c._id !== id));
    } catch {
      /* offline */
    }
    setMarkingDone(null);
  };

  const openSOSModal = (alert: SOSAlert) => {
    setSelectedSOS(alert);
    setSosNote(alert.doctorNotes || "");
  };

  const saveSOSNote = async () => {
    if (!selectedSOS) return;
    setSavingSOS(true);
    try {
      await fetch("/api/sos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedSOS._id, doctorNotes: sosNote }),
      });
      setSosAlerts((prev) => prev.map((a) => a._id === selectedSOS._id ? { ...a, doctorNotes: sosNote } : a));
      setSelectedSOS((prev) => prev ? { ...prev, doctorNotes: sosNote } : null);
    } catch { /* offline */ }
    setSavingSOS(false);
  };

  const resolveSOSAlert = async () => {
    if (!selectedSOS) return;
    setSavingSOS(true);
    try {
      await fetch("/api/sos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedSOS._id, status: "resolved", doctorNotes: sosNote }),
      });
      setSosAlerts((prev) => prev.filter((a) => a._id !== selectedSOS._id));
      setSelectedSOS(null);
    } catch { /* offline */ }
    setSavingSOS(false);
  };

  const acknowledgeSOSAlert = async () => {
    if (!selectedSOS) return;
    setSavingSOS(true);
    try {
      await fetch("/api/sos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedSOS._id, status: "acknowledged", doctorNotes: sosNote }),
      });
      setSosAlerts((prev) => prev.map((a) => a._id === selectedSOS._id ? { ...a, doctorNotes: sosNote } : a));
      setSelectedSOS(null);
    } catch { /* offline */ }
    setSavingSOS(false);
  };

  const redCount = queue.filter((p) => p.urgency === "RED").length;
  const yellowCount = queue.filter((p) => p.urgency === "YELLOW").length;
  const greenCount = queue.filter((p) => p.urgency === "GREEN").length;

  const T = (hi: string, en: string) => lang === "hi" ? hi : en;

  if (!mounted) return null;

  return (
    <>
      <div
        style={{
          background: "#0d1520",
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 390,
            background: C.bg,
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Status bar */}
          <div
            style={{
              background: "#E8F8EF",
              padding: "6px 16px",
              fontSize: 12,
              fontWeight: 700,
              color: C.green,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: C.green,
                  animation: "pulse 2s infinite",
                }}
              />
              {T("ऑनलाइन · स्वतः रीफ्रेश हो रहा है ", "Online · Auto-refreshing in ")}{tick}s
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button onClick={() => { const newLang = lang === "hi" ? "en" : "hi"; setLang(newLang); }} style={{ background: C.primary, border: "none", borderRadius: 12, padding: "4px 12px", fontSize: 11, fontWeight: 800, color: "white", cursor: "pointer" }}>
                {lang === "hi" ? "EN" : "हिं"}
              </button>
              <button
                onClick={() => signOut({ callbackUrl: "/doctor/login" })}
                style={{
                  background: "rgba(0,0,0,0.05)",
                  border: "none",
                  borderRadius: 12,
                  padding: "4px 10px",
                  fontSize: 11,
                  fontWeight: 700,
                  color: C.muted,
                  cursor: "pointer",
                }}
              >
                {T("लॉग आउट", "Logout")}
              </button>
            </div>
          </div>

          {/* Header */}
          <div style={{ background: "#1A2332", padding: "14px 16px" }}>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: "white", margin: 0 }}>
              {session?.user?.name ? `Dr. ${session.user.name.replace(/^(Dr\.?\s*)/i, "").trim()}` : "Loading..."}
            </h2>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,.45)", marginTop: 2 }}>
              {T("सामान्य चिकित्सक", (session?.user as any)?.specialization || "General Physician")} · {(session?.user as any)?.hospital || "Hospital"}
            </p>
          </div>

          {/* SOS banner — live from DB */}
          {sosAlerts.length > 0 && sosAlerts.map(alert => (
            <div key={alert._id}
              onClick={() => openSOSModal(alert)}
              style={{ background: `linear-gradient(135deg,${C.redLight},${C.red})`, padding: "10px 16px", display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}
            >
              <span style={{ fontSize: 18, animation: "shake .6s infinite", display: "inline-block" }}>🚨</span>
              <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: 12, fontWeight: 800, color: "white", margin: 0 }}>
                  SOS: {alert.village} — {T("ASHA अलर्ट", "ASHA Alert")}
                </h4>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,.75)", margin: 0, marginTop: 1 }}>
                  {alert.ashaWorkerName} reports {alert.affectedCount} affected — {alert.description || "Emergency"}
                </p>
              </div>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.8)", fontWeight: 700, background: "rgba(255,255,255,0.2)", padding: "4px 8px", borderRadius: 6 }}>
                Tap →
              </span>
            </div>
          ))}

          {/* Stats */}
          <div style={{ display: "flex" }}>
            {[
              { n: redCount, l: "🔴 RED", bg: "#FDEDED", c: C.red },
              { n: yellowCount, l: "🟡 YELLOW", bg: "#FEF9E7", c: "#B7770D" },
              { n: greenCount, l: "🟢 GREEN", bg: "#E8F8EF", c: C.green },
              { n: queue.length, l: `📋 ${T("कुल", "Total")}`, bg: C.bg, c: C.muted },
            ].map((s, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  padding: "8px 4px",
                  textAlign: "center",
                  background: s.bg,
                  borderBottom: `2px solid ${C.border}`,
                }}
              >
                <div style={{ fontSize: 18, fontWeight: 800, color: s.c }}>{s.n}</div>
                <div style={{ fontSize: 10, color: s.c, fontWeight: 700 }}>{s.l}</div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div
            style={{
              display: "flex",
              background: C.card,
              borderBottom: `1px solid ${C.border}`,
            }}
          >
            {[
              { id: "queue", l: T("कतार", "Queue") },
              { id: "referrals", l: T(`रेफरल/OPD (${referrals.length})`, `Referrals (${referrals.length})`) },
              { id: "lab-reports", l: T("लैब रिपोर्ट", "Lab Reports") },
              { id: "reviews", l: T(`रेटिंग (${reviewMetrics.totalReviews})`, `Reviews (${reviewMetrics.totalReviews})`) },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                style={{
                  flex: 1,
                  padding: "11px 6px",
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 700,
                  color: activeTab === tab.id ? C.primary : C.muted,
                  borderBottom:
                    activeTab === tab.id ? `3px solid ${C.primary}` : "3px solid transparent",
                }}
              >
                {tab.l}
              </button>
            ))}
          </div>

          {/* Queue Tab */}
          {activeTab === "queue" && (
            <div style={{ flex: 1, overflowY: "auto", padding: "10px 16px 16px" }}>
              {loadingQueue && (
                <div
                  style={{ textAlign: "center", padding: "30px 20px", color: C.muted }}
                >
                  <div style={{ fontSize: 24, marginBottom: 8 }}>⏳</div>
                  <div style={{ fontSize: 13 }}>{T("कतार लोड हो रही है...", "Loading queue...")}</div>
                </div>
              )}
              {!loadingQueue && queue.length === 0 && (
                <div
                  style={{ textAlign: "center", padding: "40px 20px", color: C.muted }}
                >
                  <div style={{ fontSize: 40 }}>✅</div>
                  <div style={{ fontSize: 15, fontWeight: 700, marginTop: 12 }}>
                    {T("कतार खाली है!", "Queue is clear!")}
                  </div>
                  <div style={{ fontSize: 12, marginTop: 6 }}>{T("कोई लंबित मरीज़ नहीं", "No pending patients")}</div>
                </div>
              )}
              {queue.map((p) => {
                const initial =
                  URGENCY_INITIAL[p.urgency] || p.patientName[0]?.toUpperCase() || "?";
                const avC = URGENCY_COLOR[p.urgency] || C.muted;
                const avBg = URGENCY_BG[p.urgency] || C.bg;
                const timeAgo = (() => {
                  const diff = Date.now() - new Date(p.createdAt).getTime();
                  const mins = Math.floor(diff / 60000);
                  if (mins < 60) return `${mins} min ago`;
                  return `${Math.floor(mins / 60)} hr ago`;
                })();
                const aiNote =
                  p.triageResult?.summary || p.triageResult?.aiSummary || "";
                return (
                  <div
                    key={p._id}
                    style={{
                      background: C.card,
                      borderRadius: 16,
                      padding: 14,
                      marginBottom: 10,
                      border: `1px solid ${C.border}`,
                      borderLeft: `4px solid ${avC}`,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 12,
                          background: avBg,
                          border: `2px solid ${avC}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 16,
                          fontWeight: 800,
                          color: avC,
                          flexShrink: 0,
                        }}
                      >
                        {initial}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 800 }}>
                          {p.patientName}{" "}
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              padding: "3px 8px",
                              borderRadius: 20,
                              fontSize: 11,
                              fontWeight: 700,
                              ...BADGE[p.urgency],
                            }}
                          >
                            {p.urgency === "RED"
                              ? "🔴 RED"
                              : p.urgency === "YELLOW"
                                ? "🟡 YELLOW"
                                : "🟢 GREEN"}
                          </span>
                        </div>
                        <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                          📱 {p.patientPhone}
                          {p.slot ? ` · 🕐 ${p.slot}` : ""}
                          {p.queueNo ? ` · #${p.queueNo}` : ""}
                        </div>
                      </div>
                    </div>

                    {p.symptoms.length > 0 && (
                      <div
                        style={{ display: "flex", flexWrap: "wrap", gap: 5, margin: "8px 0" }}
                      >
                        {p.symptoms.slice(0, 4).map((sym, j) => (
                          <span
                            key={j}
                            style={{
                              background: C.bg,
                              borderRadius: 6,
                              padding: "3px 8px",
                              fontSize: 11,
                              fontWeight: 600,
                            }}
                          >
                            {sym}
                          </span>
                        ))}
                        {p.symptoms.length > 4 && (
                          <span
                            style={{
                              background: C.bg,
                              borderRadius: 6,
                              padding: "3px 8px",
                              fontSize: 11,
                              color: C.muted,
                            }}
                          >
                            +{p.symptoms.length - 4} more
                          </span>
                        )}
                      </div>
                    )}

                    {aiNote ? (
                      <div
                        style={{
                          fontSize: 12,
                          color: C.muted,
                          fontStyle: "italic",
                          marginBottom: 8,
                        }}
                      >
                        🤖 {aiNote}
                      </div>
                    ) : null}

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <span style={{ fontSize: 11, color: C.muted }}>⏱️ {timeAgo} {p.uploadedRecords && p.uploadedRecords.length > 0 && "📎"}</span>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          onClick={() => markDone(p._id)}
                          disabled={markingDone === p._id}
                          style={{
                            padding: "7px 12px",
                            borderRadius: 8,
                            border: "none",
                            background: "#E8F8EF",
                            color: C.green,
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: "pointer",
                            opacity: markingDone === p._id ? 0.6 : 1,
                          }}
                        >
                          {markingDone === p._id ? "..." : `✓ ${T("पूर्ण", "Done")}`}
                        </button>
                        <button
                          onClick={() => setCallPatient({
                            id: p.patientPhone,
                            name: p.patientName,
                            details: {
                              department: (p as any).department || "General OPD",
                              urgency: p.urgency === "RED" ? "RED CRITICAL" : p.urgency === "YELLOW" ? "YELLOW URGENT" : "GREEN STABLE",
                              symptoms: Array.isArray(p.symptoms) ? p.symptoms.join(", ") : (p.symptoms || ""),
                              doctorName: session?.user?.name || "Dr. Consultation",
                            }
                          })}
                          style={{
                            padding: "7px 10px",
                            borderRadius: 8,
                            border: "none",
                            background: "#EBF4FD",
                            color: C.primary,
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          💻 {T("ऐप कॉल", "App Call")}
                        </button>
                        <a
                          href={`tel:${p.patientPhone}`}
                          style={{
                            padding: "7px 10px",
                            borderRadius: 8,
                            border: "none",
                            background: "#FDEDED",
                            color: C.red,
                            fontSize: 12,
                            fontWeight: 700,
                            textDecoration: "none",
                            cursor: "pointer",
                            display: "inline-block",
                          }}
                        >
                          📱 {T("फ़ोन", "Phone")}
                        </a>
                        <button
                          onClick={() => router.push(`/doctor/consultation/${p._id}`)}
                          style={{
                            padding: "7px 12px",
                            borderRadius: 8,
                            border: "none",
                            background: C.primaryDark,
                            color: "white",
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          {T("खोलें", "Open")} →
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Lab Reports Tab */}
          {activeTab === "lab-reports" && (
            <div style={{ flex: 1, overflowY: "auto", padding: "10px 16px 16px" }}>
              {/* Refresh Button */}
              <button onClick={fetchBloodTests} style={{ width: "100%", padding: 10, borderRadius: 10, border: `1px solid ${C.border}`, background: C.card, fontSize: 12, fontWeight: 700, cursor: "pointer", color: C.primary, marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                🔄 Refresh Lab Reports (Auto-updates every 30s)
              </button>

              {selectedTest ? (
                // Review Modal
                <div>
                  <button onClick={() => { setSelectedTest(null); setReviewNote(""); }}
                    style={{ marginBottom: 16, padding: "8px 16px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.bg, fontSize: 13, fontWeight: 700, cursor: "pointer", color: C.text }}>
                    ← Back to all tests
                  </button>
                  <div style={{ background: selectedTest.isCritical ? "#FDEDED" : "#EBF4FD", borderRadius: 16, padding: 16, marginBottom: 16, border: `2px solid ${selectedTest.isCritical ? C.red : C.primary}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ fontSize: 12, color: C.muted, marginBottom: 4 }}>🩸 {selectedTest.testType}</div>
                        <div style={{ fontSize: 28, fontWeight: 800, color: selectedTest.isCritical ? C.red : C.green }}>{selectedTest.result}</div>
                      </div>
                      {selectedTest.isCritical && (
                        <span style={{ background: C.red, color: "white", padding: "4px 10px", borderRadius: 12, fontSize: 11, fontWeight: 700 }}>⚠️ CRITICAL</span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: C.muted, marginTop: 12 }}>
                      👤 Patient: <b>{selectedTest.patientName}</b> ({selectedTest.patientPhone})<br/>
                      📅 Test Date: {new Date(selectedTest.testDate).toLocaleDateString()}<br/>
                      👨‍⚕️ Submitted by: {selectedTest.submittedByName}<br/>
                      {selectedTest.labName && `🏥 Lab: ${selectedTest.labName}`}
                    </div>
                    {selectedTest.referenceRange && (
                      <div style={{ fontSize: 11, color: C.muted, marginTop: 8 }}>
                        📊 Normal Range: {selectedTest.referenceRange}
                      </div>
                    )}
                    {selectedTest.notes && (
                      <div style={{ fontSize: 12, color: C.text, marginTop: 8, background: "white", padding: 10, borderRadius: 8 }}>
                        📝 Notes: {selectedTest.notes}
                      </div>
                    )}
                  </div>

                  <div style={{ background: C.card, borderRadius: 12, padding: 16, border: `1px solid ${C.border}` }}>
                    <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>👨‍⚕️ Add Doctor&apos;s Review</div>
                    <textarea
                      rows={4}
                      placeholder="Add your clinical observations, recommendations..."
                      value={reviewNote}
                      onChange={(e) => setReviewNote(e.target.value)}
                      style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: `2px solid ${C.border}`, fontSize: 14, resize: "vertical", marginBottom: 12 }}
                    />
                    <button
                      onClick={() => handleReviewTest(selectedTest._id)}
                      disabled={savingReview || !reviewNote.trim()}
                      style={{ width: "100%", padding: 12, borderRadius: 12, border: "none", cursor: savingReview ? "wait" : "pointer", fontWeight: 700, fontSize: 14, background: savingReview || !reviewNote.trim() ? "#ccc" : C.primary, color: "white" }}>
                      {savingReview ? "⏳ Saving..." : "✅ Save Review"}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Critical Alerts Banner */}
                  {bloodTests.filter((t) => t.isCritical).length > 0 && (
                    <div style={{ background: "linear-gradient(135deg,#E74C3C,#C0392B)", borderRadius: 16, padding: 16, marginBottom: 16, color: "white" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, opacity: 0.9, marginBottom: 4 }}>🚨 CRITICAL LAB RESULTS</div>
                      <div style={{ fontSize: 24, fontWeight: 800 }}>
                        {bloodTests.filter((t) => t.isCritical).length} Test(s) Need Attention
                      </div>
                      <div style={{ fontSize: 11, opacity: 0.8, marginTop: 4 }}>Patients with dangerously abnormal results</div>
                    </div>
                  )}

                  {/* Summary Stats */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
                    <div style={{ background: "#FDEDED", borderRadius: 12, padding: 12, textAlign: "center" }}>
                      <div style={{ fontSize: 22, fontWeight: 800, color: C.red }}>{bloodTests.filter((t) => t.isCritical).length}</div>
                      <div style={{ fontSize: 10, color: C.red, fontWeight: 700 }}>🔴 Critical</div>
                    </div>
                    <div style={{ background: "#FEF9E7", borderRadius: 12, padding: 12, textAlign: "center" }}>
                      <div style={{ fontSize: 22, fontWeight: 800, color: "#B7770D" }}>{bloodTests.filter((t) => t.status === "completed").length}</div>
                      <div style={{ fontSize: 10, color: "#B7770D", fontWeight: 700 }}>🟡 Pending Review</div>
                    </div>
                    <div style={{ background: "#E8F8EF", borderRadius: 12, padding: 12, textAlign: "center" }}>
                      <div style={{ fontSize: 22, fontWeight: 800, color: C.green }}>{bloodTests.filter((t) => t.status === "reviewed").length}</div>
                      <div style={{ fontSize: 10, color: C.green, fontWeight: 700 }}>✅ Reviewed</div>
                    </div>
                  </div>

                  {/* Lab Tests List */}
                  {loadingLabs ? (
                    <div style={{ textAlign: "center", padding: "30px 20px", color: C.muted }}>
                      <div style={{ fontSize: 24, marginBottom: 8 }}>⏳</div>
                      <div>Loading lab reports...</div>
                    </div>
                  ) : bloodTests.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "40px 20px", color: C.muted }}>
                      <div style={{ fontSize: 40 }}>🩸</div>
                      <div style={{ fontSize: 14, fontWeight: 700, marginTop: 8 }}>No blood tests submitted yet</div>
                    </div>
                  ) : (
                    bloodTests.map((test, i) => (
                      <div
                        key={test._id}
                        onClick={() => setSelectedTest(test)}
                        style={{
                          background: test.isCritical ? "#FDF2F2" : test.status === "reviewed" ? "#E8F8EF" : C.card,
                          borderRadius: 12,
                          padding: 14,
                          marginBottom: 10,
                          border: `2px solid ${test.isCritical ? C.red : C.border}`,
                          cursor: "pointer",
                          transition: "transform 0.15s, box-shadow 0.15s",
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                          (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.transform = "";
                          (e.currentTarget as HTMLElement).style.boxShadow = "";
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                              <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>🩸 {test.testType}</span>
                              {test.isCritical && (
                                <span style={{ background: C.red, color: "white", padding: "2px 8px", borderRadius: 8, fontSize: 10, fontWeight: 700 }}>CRITICAL</span>
                              )}
                              {test.status === "reviewed" && (
                                <span style={{ background: C.green, color: "white", padding: "2px 8px", borderRadius: 8, fontSize: 10, fontWeight: 700 }}>REVIEWED</span>
                              )}
                            </div>
                            <div style={{ fontSize: 20, fontWeight: 800, color: test.isCritical ? C.red : C.green }}>
                              {test.result}
                            </div>
                            <div style={{ fontSize: 11, color: C.muted, marginTop: 6 }}>
                              👤 {test.patientName} · 📞 {test.patientPhone}
                            </div>
                            <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                              📅 {new Date(test.testDate).toLocaleDateString()} · 👨‍⚕️ {test.submittedByName}
                              {test.labName && ` · 🏥 ${test.labName}`}
                            </div>
                          </div>
                          <div style={{ fontSize: 18, color: C.muted }}>→</div>
                        </div>
                        {test.reviewedNotes && (
                          <div style={{ fontSize: 11, color: C.primary, marginTop: 8, background: "#EBF4FD", padding: "6px 10px", borderRadius: 8 }}>
                            👨‍⚕️ Your review: {test.reviewedNotes}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </>
              )}
            </div>
          )}

          {/* Referrals & In-Person Physical OPD Tab */}
          {activeTab === "referrals" && (
            <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px 20px" }}>
              {/* Filter Pills */}
              <div style={{ display: "flex", gap: 6, marginBottom: 12, overflowX: "auto", paddingBottom: 4 }}>
                {[
                  { id: "ALL", label: T("सभी", "All") },
                  { id: "IN_PERSON_FOLLOWUP", label: T("📅 शारीरिक OPD", "📅 In-Person OPD") },
                  { id: "SPECIALIST_FACILITY_TRANSFER", label: T("🏥 उच्च रेफरल", "🏥 Referrals") },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setReferralFilter(f.id as any)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: 20,
                      border: "none",
                      fontSize: 11,
                      fontWeight: 700,
                      background: referralFilter === f.id ? C.primary : "#E2E8F0",
                      color: referralFilter === f.id ? "white" : C.text,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {loadingReferrals ? (
                <div style={{ textAlign: "center", padding: "30px 20px", color: C.muted }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>⏳</div>
                  <div style={{ fontSize: 13 }}>{T("रेफरल लोड हो रहे हैं...", "Loading referrals...")}</div>
                </div>
              ) : (
                <>
                  {(() => {
                    const filtered = referrals.filter((r) => {
                      if (referralFilter === "ALL") return true;
                      return r.referralType === referralFilter;
                    });

                    if (filtered.length === 0) {
                      return (
                        <div style={{ background: C.card, borderRadius: 16, padding: "36px 20px", textAlign: "center", border: `1px dashed ${C.border}` }}>
                          <div style={{ fontSize: 36, marginBottom: 10 }}>📋</div>
                          <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>
                            {T("कोई रेफरल या शारीरिक OPD नहीं", "No Active Referrals or OPD Visits")}
                          </div>
                          <div style={{ fontSize: 12, color: C.muted, marginTop: 6, lineHeight: 1.4 }}>
                            {T("ऑनलाइन परामर्श के दौरान शारीरिक अस्पताल विज़िट या उच्च केंद्र रेफरल बुक करने पर यहाँ दिखाई देगा।", "Referrals or in-person visits booked during consultations will appear here.")}
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {filtered.map((ref) => {
                          const isInPerson = ref.referralType === "IN_PERSON_FOLLOWUP";
                          const isPending = ref.status === "pending";
                          const isArrived = ref.status === "arrived";
                          const isCompleted = ref.status === "completed";

                          return (
                            <div
                              key={ref._id}
                              style={{
                                background: C.card,
                                borderRadius: 16,
                                padding: 14,
                                border: `1.5px solid ${isInPerson ? "#A7F3D0" : "#FED7AA"}`,
                                borderLeft: `5px solid ${isInPerson ? "#10B981" : "#D97706"}`,
                                boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                              }}
                            >
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                                <div>
                                  <span
                                    style={{
                                      background: isInPerson ? "#ECFDF5" : "#FFF7ED",
                                      color: isInPerson ? "#059669" : "#C2410C",
                                      padding: "3px 8px",
                                      borderRadius: 6,
                                      fontSize: 10,
                                      fontWeight: 800,
                                      textTransform: "uppercase",
                                    }}
                                  >
                                    {isInPerson ? "📅 Physical Hospital Follow-Up" : "🏥 Specialist Referral"}
                                  </span>
                                  <div style={{ fontWeight: 800, fontSize: 15, color: C.text, marginTop: 4 }}>
                                    {ref.patientName}
                                  </div>
                                </div>

                                <div style={{ textAlign: "right" }}>
                                  {ref.opdToken && (
                                    <div style={{ fontSize: 11, fontWeight: 800, color: C.primary, background: "#E0F2FE", padding: "2px 6px", borderRadius: 6 }}>
                                      Token: {ref.opdToken}
                                    </div>
                                  )}
                                  <span
                                    style={{
                                      display: "inline-block",
                                      marginTop: 4,
                                      fontSize: 10,
                                      fontWeight: 800,
                                      padding: "2px 8px",
                                      borderRadius: 12,
                                      background: isCompleted ? "#D1FAE5" : isArrived ? "#E0F2FE" : "#FEF3C7",
                                      color: isCompleted ? "#065F46" : isArrived ? "#0369A1" : "#92400E",
                                    }}
                                  >
                                    {isCompleted ? "✓ Completed" : isArrived ? "🏥 Arrived at Hospital" : "⏳ Pending"}
                                  </span>
                                </div>
                              </div>

                              <div style={{ background: "#F8FAFC", borderRadius: 10, padding: "8px 10px", fontSize: 12, marginBottom: 8, display: "flex", flexDirection: "column", gap: 3 }}>
                                <div>
                                  📍 <strong>{ref.targetFacility}</strong> {ref.targetDepartment ? `· ${ref.targetDepartment}` : ""}
                                </div>
                                {ref.scheduledDate && (
                                  <div style={{ color: C.muted }}>
                                    🗓️ Date: <strong>{ref.scheduledDate}</strong> ({ref.scheduledSlot || "OPD Slot"})
                                  </div>
                                )}
                                <div style={{ color: "#475569", marginTop: 2 }}>
                                  💬 <em>{ref.reasonForReferral}</em>
                                </div>
                              </div>

                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6, flexWrap: "wrap", borderTop: `1px solid ${C.border}`, paddingTop: 8 }}>
                                <div style={{ display: "flex", gap: 6 }}>
                                  <button
                                    onClick={() => window.open(`tel:${ref.patientPhone}`)}
                                    style={{
                                      background: "#F1F5F9",
                                      border: "none",
                                      borderRadius: 8,
                                      padding: "5px 9px",
                                      fontSize: 11,
                                      fontWeight: 700,
                                      color: C.text,
                                      cursor: "pointer",
                                    }}
                                  >
                                    📞 {ref.patientPhone}
                                  </button>
                                  <button
                                    onClick={() => setCallPatient({
                                      id: ref.patientPhone,
                                      name: ref.patientName,
                                      details: {
                                        department: ref.targetDepartment || "Specialist OPD",
                                        urgency: ref.priority,
                                        symptoms: ref.clinicalSummary || ref.reason,
                                        doctorName: ref.referringDoctorName,
                                      }
                                    })}
                                    style={{
                                      background: "#E0F2FE",
                                      border: "none",
                                      borderRadius: 8,
                                      padding: "5px 9px",
                                      fontSize: 11,
                                      fontWeight: 700,
                                      color: "#0369A1",
                                      cursor: "pointer",
                                    }}
                                  >
                                    💻 App Call
                                  </button>
                                </div>

                                <div style={{ display: "flex", gap: 4 }}>
                                  {!isArrived && !isCompleted && (
                                    <button
                                      onClick={() => handleUpdateReferralStatus(ref._id, "arrived")}
                                      style={{
                                        background: "#E0F2FE",
                                        color: "#0284C7",
                                        border: "none",
                                        borderRadius: 8,
                                        padding: "5px 9px",
                                        fontSize: 11,
                                        fontWeight: 800,
                                        cursor: "pointer",
                                      }}
                                    >
                                      Mark Arrived
                                    </button>
                                  )}
                                  {!isCompleted && (
                                    <button
                                      onClick={() => handleUpdateReferralStatus(ref._id, "completed")}
                                      style={{
                                        background: "#10B981",
                                        color: "white",
                                        border: "none",
                                        borderRadius: 8,
                                        padding: "5px 9px",
                                        fontSize: 11,
                                        fontWeight: 800,
                                        cursor: "pointer",
                                      }}
                                    >
                                      ✓ Complete
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </>
              )}
            </div>
          )}

          {/* Reviews & Ratings Tab */}
          {activeTab === "reviews" && (
            <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px 20px" }}>
              {loadingReviews ? (
                <div style={{ textAlign: "center", padding: "30px 20px", color: C.muted }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>⏳</div>
                  <div style={{ fontSize: 13 }}>{T("समीक्षाएं लोड हो रही हैं...", "Loading patient reviews...")}</div>
                </div>
              ) : (
                <>
                  {/* Rating Summary Card */}
                  <div
                    style={{
                      background: C.card,
                      borderRadius: 16,
                      padding: "18px 16px",
                      marginBottom: 16,
                      border: `1.5px solid ${C.border}`,
                      boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 16, borderBottom: `1px solid ${C.border}`, paddingBottom: 14, marginBottom: 14 }}>
                      <div style={{ textAlign: "center", minWidth: 90 }}>
                        <div style={{ fontSize: 36, fontWeight: 900, color: "#1A2332", lineHeight: 1 }}>
                          {reviewMetrics.averageRating}
                        </div>
                        <div style={{ color: "#F59E0B", fontSize: 14, marginTop: 4 }}>
                          {"★".repeat(Math.round(reviewMetrics.averageRating))}
                        </div>
                        <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                          {reviewMetrics.totalReviews} {T("समीक्षाएं", "reviews")}
                        </div>
                      </div>

                      {/* Breakdown Bars */}
                      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                        {[5, 4, 3, 2, 1].map((star) => {
                          const pct = reviewMetrics.percentageBreakdown?.[star] || 0;
                          return (
                            <div key={star} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11 }}>
                              <span style={{ width: 18, color: C.muted, fontWeight: 700 }}>{star}★</span>
                              <div style={{ flex: 1, height: 6, background: "#E2E8F0", borderRadius: 4, overflow: "hidden" }}>
                                <div style={{ width: `${pct}%`, height: "100%", background: star >= 4 ? "#10B981" : star === 3 ? "#F59E0B" : "#EF4444", borderRadius: 4 }} />
                              </div>
                              <span style={{ width: 26, textAlign: "right", color: C.muted, fontSize: 10 }}>{pct}%</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div style={{ fontSize: 12, color: C.primary, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                      </svg>
                      {T("100% सत्यापित मरीज़ परामर्श प्रतिक्रिया", "100% Verified Patient Consultation Feedback")}
                    </div>
                  </div>

                  {/* Reviews List */}
                  <div style={{ fontSize: 12, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 10 }}>
                    {T("हाल की मरीज़ समीक्षाएं", "Recent Patient Reviews")} ({reviews.length})
                  </div>

                  {reviews.length === 0 ? (
                    <div style={{ background: C.card, borderRadius: 14, padding: "32px 20px", textAlign: "center", border: `1px dashed ${C.border}` }}>
                      <div style={{ fontSize: 32, marginBottom: 8 }}>★</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>
                        {T("अभी तक कोई समीक्षा नहीं", "No Reviews Submitted Yet")}
                      </div>
                      <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>
                        {T("परामर्श पूरा होने के बाद मरीज़ की रेटिंग यहाँ दिखाई देगी।", "Patient ratings will appear here once consultations are completed.")}
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {reviews.map((rev) => (
                        <div
                          key={rev._id || rev.reviewId}
                          style={{
                            background: C.card,
                            borderRadius: 14,
                            padding: "14px 16px",
                            border: `1px solid ${C.border}`,
                            boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                            <div>
                              <div style={{ fontWeight: 800, fontSize: 13, color: C.text }}>
                                {rev.patientName}
                              </div>
                              <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>
                                Consultation: <span style={{ fontFamily: "monospace" }}>{rev.consultationId?.slice(-6) || "ID"}</span> · {new Date(rev.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                            <div style={{ background: "#FEF3C7", color: "#D97706", padding: "2px 8px", borderRadius: 8, fontSize: 11, fontWeight: 800 }}>
                              {"★".repeat(rev.rating)} {rev.rating}/5
                            </div>
                          </div>

                          {rev.comment ? (
                            <div style={{ fontSize: 13, color: "#334155", lineHeight: 1.5, background: "#F8FAFC", padding: "8px 12px", borderRadius: 8, marginTop: 6, fontStyle: "italic" }}>
                              &ldquo;{rev.comment}&rdquo;
                            </div>
                          ) : (
                            <div style={{ fontSize: 11, color: C.muted, fontStyle: "italic", marginTop: 4 }}>
                              No written text provided (Star rating only)
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}@keyframes shake{0%,100%{transform:rotate(0)}25%{transform:rotate(-10deg)}75%{transform:rotate(10deg)}}`}</style>
        </div>
      </div>

      {callPatient && (
        <VideoCallModal
          isOpen={true}
          onClose={() => setCallPatient(null)}
          patientName={callPatient.name}
          patientId={callPatient.id}
          isDoctor={true}
          callerRole="doctor"
          callerTitle={`Dr. ${session?.user?.name || "Doctor"}`}
          department={(session?.user as any)?.specialty || "Specialist OPD"}
          facilityName="AarogyaAI Medical Command Center"
          patientDetails={callPatient.details}
        />
      )}

      {selectedSOS && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
            display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 1000,
          }}
          onClick={() => setSelectedSOS(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "white", borderRadius: "20px 20px 0 0",
              padding: 20, width: "100%", maxWidth: 390,
              maxHeight: "80vh", overflowY: "auto",
            }}
          >
            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: C.red }}>
                🚨 SOS: {selectedSOS.village}
              </h3>
              <button
                onClick={() => setSelectedSOS(null)}
                style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: C.muted, lineHeight: 1 }}
              >
                ✕
              </button>
            </div>

            {/* ASHA Worker Info */}
            <div style={{ background: "#FDEDED", borderRadius: 12, padding: 12, marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: C.red }}>{selectedSOS.ashaWorkerName}</div>
                  <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>📱 {selectedSOS.ashaWorkerPhone}</div>
                </div>
                <span style={{
                  background: C.red, color: "white", borderRadius: 20,
                  padding: "4px 10px", fontSize: 12, fontWeight: 700,
                }}>
                  {selectedSOS.affectedCount} affected
                </span>
              </div>
              <div style={{
                fontSize: 13, color: C.text, marginTop: 10,
                background: "rgba(255,255,255,0.6)", borderRadius: 8, padding: "8px 10px",
              }}>
                {selectedSOS.description}
              </div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 8 }}>
                {(() => {
                  const diff = Date.now() - new Date(selectedSOS.createdAt).getTime();
                  const mins = Math.floor(diff / 60000);
                  return "🕐 " + (mins < 60 ? mins + " min ago" : Math.floor(mins / 60) + " hr ago");
                })()}
              </div>
            </div>

            {/* Existing note preview if any */}
            {selectedSOS.doctorNotes && (
              <div style={{
                background: "#EBF4FD", borderRadius: 10, padding: "8px 12px",
                marginBottom: 12, fontSize: 12, color: C.primary,
                borderLeft: "3px solid " + C.primary,
              }}>
                <span style={{ fontWeight: 700 }}>Previous note: </span>{selectedSOS.doctorNotes}
              </div>
            )}

            {/* Doctor Notes Input */}
            <label style={{ fontSize: 13, fontWeight: 700, color: C.text, display: "block", marginBottom: 6 }}>
              📝 Doctor Notes
            </label>
            <textarea
              value={sosNote}
              onChange={(e) => setSosNote(e.target.value)}
              placeholder="Write your assessment, action plan, or instructions for the ASHA worker..."
              rows={4}
              style={{
                width: "100%", borderRadius: 10, border: "1.5px solid " + C.border,
                padding: "10px 12px", fontSize: 13, fontFamily: "inherit",
                resize: "none", outline: "none", boxSizing: "border-box",
                color: C.text, background: "#F8FAFC", lineHeight: 1.5,
              }}
            />

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              <button
                onClick={saveSOSNote}
                disabled={savingSOS}
                style={{
                  flex: 1, padding: "11px 0", borderRadius: 10, border: "none",
                  background: "#EBF4FD", color: C.primary, fontWeight: 700,
                  fontSize: 13, cursor: savingSOS ? "not-allowed" : "pointer",
                  opacity: savingSOS ? 0.6 : 1,
                }}
              >
                {savingSOS ? "Saving..." : "💾 Save Note"}
              </button>
              <button
                onClick={resolveSOSAlert}
                disabled={savingSOS}
                style={{
                  flex: 1, padding: "11px 0", borderRadius: 10, border: "none",
                  background: C.green, color: "white", fontWeight: 700,
                  fontSize: 13, cursor: savingSOS ? "not-allowed" : "pointer",
                  opacity: savingSOS ? 0.6 : 1,
                }}
              >
                {savingSOS ? "..." : "✓ Mark Done"}
              </button>
            </div>

            {/* Acknowledge button */}
            <button
              onClick={acknowledgeSOSAlert}
              disabled={savingSOS}
              style={{
                width: "100%", marginTop: 8, padding: "11px 0", borderRadius: 10,
                border: "1.5px solid #F39C12", background: "#FEF9E7",
                color: "#B7770D", fontWeight: 700, fontSize: 13,
                cursor: savingSOS ? "not-allowed" : "pointer",
                opacity: savingSOS ? 0.6 : 1,
              }}
            >
              👁 Acknowledge (Keep Active)
            </button>
          </div>
        </div>
      )}
    </>
  );
}
