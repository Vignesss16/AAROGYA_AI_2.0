"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { getDB, seedOfflineData } from "@/lib/db-offline";
import { generatePDF, PatientInfo, Consultation, urgencyConfig, formatDate, getTitle } from '@/lib/pdf';
import { useAuth } from "@/lib/useAuth";
import {
  Building2,
  Calendar,
  Clock,
  Stethoscope,
  FileText,
  Pill,
  Download,
  Star,
  CheckCircle2,
  Activity,
  ChevronDown,
  ChevronUp,
  QrCode,
  Search,
  Shield,
  Filter,
  Eye,
  EyeOff,
  ClipboardList,
  AlertTriangle,
  FlaskConical
} from "lucide-react";

const C = {
  primary: "#1B6CA8", primaryDark: "#0F4C7A", green: "#1E8449",
  red: "#C0392B", yellow: "#D68910", bg: "#F0F4F8",
  card: "#FFFFFF", text: "#1A2332", muted: "#6B7C93", border: "#DDE3EC",
};

export default function RecordsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { data: session, status } = useSession();
  const { isOnline } = useOnlineStatus();
  const [lang, setLang] = useState("hi");
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [labOrders, setLabOrders] = useState<any[]>([]);
  const [selectedReportOrder, setSelectedReportOrder] = useState<any | null>(null);
  const [reviews, setReviews] = useState<Record<string, any>>({});
  const [rateModalConsultation, setRateModalConsultation] = useState<Consultation | null>(null);
  const [selectedRating, setSelectedRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState("");
  const [fetching, setFetching] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  // Professional Filter & Minimize Controls
  const [activeTab, setActiveTab] = useState<"ALL" | "CONSULTATIONS" | "LABS" | "HOSPITAL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "COMPLETED" | "PENDING" | "CRITICAL">("ALL");
  const [isLabsCollapsed, setIsLabsCollapsed] = useState(false);
  const [isConsultationsCollapsed, setIsConsultationsCollapsed] = useState(false);
  const [visibleCount, setVisibleCount] = useState(6);
  const [isCompactView, setIsCompactView] = useState(false);

  const t = (hi: string, en: string) => (lang === "hi" ? hi : en);

  // Universal Doctor Name Sanitizer (prevents Dr. Dr duplication and handles unassigned hospital bookings)
  const formatDoctorDisplay = (name?: string) => {
    if (!name || name.trim() === "") return t("रिसेप्शनिस्ट असाइनमेंट प्रतीक्षारत", "Awaiting Receptionist Assignment");
    if (name.toLowerCase().includes("pending") || name.toLowerCase().includes("awaiting") || name.toLowerCase().includes("receptionist")) {
      return name;
    }
    const stripped = name.replace(/^(Dr\.?\s*)+/i, "").trim();
    return stripped ? `Dr. ${stripped}` : t("डॉक्टर असाइनमेंट प्रतीक्षारत", "Awaiting Doctor Assignment");
  };

  useEffect(() => {
    setLang(localStorage.getItem("lang") || "hi");
  }, []);

  useEffect(() => {
    if (!authLoading && !user && status === "unauthenticated" && isOnline) {
      router.push("/login");
    }
  }, [authLoading, user, status, router, isOnline]);

  useEffect(() => {
    if (!user || fetched) return;
    const identifier = user.phone || user.name || (user as any)._id || "";
    if (!identifier) return;

    setFetched(true);
    setFetching(true);
    if (typeof window !== "undefined") {
      seedOfflineData().catch(console.error);
    }

    if (!isOnline) {
      setIsOfflineMode(true);
      setFetching(true);

      getDB()
        .consultations.toArray()
        .then((offlineRecords) => {
          const converted: Consultation[] = offlineRecords.map((rec) => ({
            _id: `offline-${rec.id}`,
            symptoms: rec.symptoms || [],
            urgency: rec.urgency,
            triageResult: typeof rec.triageResult === "string" ? JSON.parse(rec.triageResult) : rec.triageResult,
            status: "pending",
            createdAt: rec.createdAt instanceof Date ? rec.createdAt.toISOString() : String(rec.createdAt),
          }));

          setConsultations(converted);
          setFetching(false);
          setFetched(true);
        })
        .catch((err) => {
          console.error("Failed to load offline records:", err);
          setFetching(false);
        });
      return;
    }

    setIsOfflineMode(false);

    fetch(`/api/lab-orders?patientPhone=${encodeURIComponent(identifier)}`)
      .then((r) => r.json())
      .then((d) => setLabOrders(d.orders || []))
      .catch(() => {});

    fetch(`/api/reviews?patientPhone=${encodeURIComponent(identifier)}`)
      .then((r) => r.json())
      .then((d) => {
        const map: Record<string, any> = {};
        (d.reviews || []).forEach((rev: any) => {
          map[rev.consultationId] = rev;
        });
        setReviews(map);
      })
      .catch(() => {});

    fetch(`/api/consultations/my?identifier=${encodeURIComponent(identifier)}`)
      .then((res) => res.json())
      .then(async (data) => {
        const serverConsultations = data.consultations || [];
        setConsultations(serverConsultations);

        if (typeof window !== "undefined" && serverConsultations.length > 0) {
          try {
            const db = getDB();
            for (const c of serverConsultations) {
              const existing = await db.consultations
                .where("patientPhone")
                .equals(identifier)
                .first();

              if (!existing) {
                await db.consultations.add({
                  clientId: c._id,
                  patientPhone: identifier,
                  patientName: user.name || "",
                  symptoms: c.symptoms || [],
                  urgency: c.urgency || "GREEN",
                  triageResult: JSON.stringify(c.triageResult || {}),
                  createdAt: new Date(c.createdAt || Date.now()),
                  needsSync: false,
                });
              }
            }
          } catch (err) {
            console.error("Failed to cache records:", err);
          }
        }
      })
      .catch((err) => {
        console.warn("Online fetch failed, falling back to IndexedDB:", err);
        setIsOfflineMode(true);
        getDB()
          .consultations.toArray()
          .then((offlineRecords) => {
            const converted: Consultation[] = offlineRecords.map((rec) => ({
              _id: `offline-${rec.id}`,
              symptoms: rec.symptoms || [],
              urgency: rec.urgency,
              triageResult: typeof rec.triageResult === "string" ? JSON.parse(rec.triageResult) : rec.triageResult,
              status: "pending",
              createdAt: rec.createdAt instanceof Date ? rec.createdAt.toISOString() : String(rec.createdAt),
            }));
            setConsultations(converted);
          })
          .catch(console.error);
      })
      .finally(() => setFetching(false));
  }, [user, isOnline, fetched]);

  const handleSubmitReview = async () => {
    if (!rateModalConsultation) return;
    setSubmittingReview(true);
    try {
      const identifier = user?.phone || user?.name || (user as any)?._id || "";
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          consultationId: rateModalConsultation._id,
          patientPhone: identifier,
          patientName: user?.name || "Patient",
          doctorId: (rateModalConsultation as any).doctorId || "DOC-DEFAULT",
          doctorName: formatDoctorDisplay(rateModalConsultation.doctorName),
          hospital: rateModalConsultation.hospital || "",
          rating: selectedRating,
          comment: reviewComment,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setReviews((prev) => ({
          ...prev,
          [rateModalConsultation._id]: data.review,
        }));
        setReviewSuccessMsg(t("समीक्षा सफलतापूर्वक दर्ज की गई!", "Review submitted successfully!"));
        setTimeout(() => {
          setRateModalConsultation(null);
          setReviewSuccessMsg("");
          setReviewComment("");
          setSelectedRating(5);
        }, 1200);
      } else {
        alert(data.error || "Failed to submit review");
      }
    } catch {
      alert("Network error submitting review");
    } finally {
      setSubmittingReview(false);
    }
  };

  const patient: PatientInfo = {
    name: user?.name || "Patient",
    gender: user?.gender === "female" ? t("महिला", "Female") : t("पुरुष", "Male"),
    age: user?.age ? String(user.age) : "—",
    phone: user?.phone || "—",
    bloodGroup: user?.bloodGroup || "—",
    condition: Array.isArray(user?.conditions) ? (user.conditions[0] || "—") : (typeof (user as any)?.conditions === "string" ? (user as any).conditions.split(",")[0] : "—"),
  };

  const handleDownloadAll = () => {
    setDownloading(true);
    setTimeout(() => {
      generatePDF(patient, consultations);
      setDownloading(false);
    }, 300);
  };

  const statusLabel: Record<string, string> = {
    pending:    t("⏳ डॉक्टर से जवाब का इंतज़ार", "⏳ Awaiting doctor response"),
    "in-review": t("👨‍⚕️ समीक्षा हो रही है", "👨‍⚕️ Doctor is reviewing"),
    completed:  t("✅ पूर्ण", "✅ Completed"),
  };

  // Filtered Lists computation
  const filteredLabOrders = useMemo(() => {
    if (activeTab === "CONSULTATIONS") return [];
    return labOrders.filter((lo) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesName = (lo.labName || "").toLowerCase().includes(q);
        const matchesDoc = (lo.doctorName || "").toLowerCase().includes(q);
        const matchesTests = (lo.tests || []).some((test: string) => test.toLowerCase().includes(q));
        if (!matchesName && !matchesDoc && !matchesTests) return false;
      }
      return true;
    });
  }, [labOrders, activeTab, searchQuery]);

  const filteredConsultations = useMemo(() => {
    if (activeTab === "LABS") return [];
    return consultations.filter((c) => {
      if (activeTab === "HOSPITAL") {
        const isHospitalAssisted = (c as any).bookingType === "HOSPITAL_RECEPTIONIST_ASSISTED" || !!c.hospital;
        if (!isHospitalAssisted) return false;
      }

      if (statusFilter === "COMPLETED" && c.status !== "completed") return false;
      if (statusFilter === "PENDING" && c.status === "completed") return false;
      if (statusFilter === "CRITICAL" && c.urgency !== "RED") return false;

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesDoctor = (c.doctorName || "").toLowerCase().includes(q);
        const matchesHospital = (c.hospital || "").toLowerCase().includes(q);
        const matchesSymptoms = (c.symptoms || []).some((s: string) => s.toLowerCase().includes(q));
        const matchesDiagnosis = ((c as any).diagnosis || "").toLowerCase().includes(q);
        if (!matchesDoctor && !matchesHospital && !matchesSymptoms && !matchesDiagnosis) return false;
      }

      return true;
    });
  }, [consultations, activeTab, statusFilter, searchQuery]);

  const visibleConsultations = filteredConsultations.slice(0, visibleCount);

  if (authLoading && !user) {
    return (
      <div style={{ background: "#0d1520", minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <div style={{ fontSize: 20, color: "white" }}>⏳ Loading...</div>
      </div>
    );
  }

  if (!user && !isOfflineMode) return null;

  return (
    <div style={{ background: "#0d1520", minHeight: "100vh", display: "flex", justifyContent: "center" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; font-family: 'Outfit', 'Segoe UI', sans-serif; }
        .rec-card { transition: box-shadow 0.18s, transform 0.18s; }
        .rec-card:hover { transform: translateY(-1px); box-shadow: 0 6px 24px rgba(0,0,0,0.09) !important; }
        .rec-pill { display:inline-flex; align-items:center; padding:3px 10px; border-radius:20px; font-size:11px; font-weight:600; background:#EBF4FD; color:${C.primary}; margin-right:5px; margin-bottom:3px; }
        .rec-btn { display:inline-flex; align-items:center; gap:6px; padding:8px 16px; border-radius:10px; font-size:13px; font-weight:700; cursor:pointer; border:none; transition:opacity 0.15s, transform 0.1s; }
        .rec-btn:hover { opacity:0.85; transform:scale(0.98); }
        .rec-btn:active { transform:scale(0.96); }
        .rec-expand-row { cursor:pointer; }
        .rec-expand-row:hover .rec-chevron { color: ${C.primary}; }
      `}</style>

      <div style={{ width: 440, maxWidth: "100vw", background: C.bg, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        {/* Top App Header */}
        <div style={{ display: "flex", alignItems: "center", padding: "14px 16px", gap: 10, background: C.card, borderBottom: `1px solid ${C.border}`, position: "sticky", top: 0, zIndex: 20 }}>
          <button
            onClick={() => router.push("/home")}
            style={{ width: 36, height: 36, borderRadius: 10, background: C.bg, border: "none", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            ←
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>{t("मेरे स्वास्थ्य रिकॉर्ड", "My Health Records")}</div>
            <div style={{ fontSize: 11, color: C.muted }}>{isOfflineMode ? t("डिवाइस से सुरक्षित रिकॉर्ड", "Saved on device") : t("क्लाउड से सिंक", "Synced with cloud")}</div>
          </div>
          {consultations.length > 0 && (
            <button className="rec-btn" onClick={handleDownloadAll} disabled={downloading} style={{ background: C.primary, color: "#fff", fontSize: 11, padding: "6px 12px" }}>
              {downloading ? "⏳" : "📄"} {downloading ? t("...", "...") : t("PDF", "PDF")}
            </button>
          )}
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px" }}>

          {/* Patient Profile Card */}
          <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, overflow: "hidden", marginBottom: 14, boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
            <div style={{ background: "linear-gradient(135deg,#EBF4FD,#DDEEFF)", padding: "14px", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 48, height: 48, borderRadius: "50%", background: C.primary, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 800, color: "white", flexShrink: 0 }}>
                {patient.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: 17, fontWeight: 800, color: C.text }}>{patient.name}</div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
                  {patient.gender} · {patient.age} {t("वर्ष", "years")} {patient.phone !== "—" ? `· 📱 ${patient.phone}` : ""}
                </div>
              </div>
            </div>
            <div style={{ padding: "10px 12px", display: "flex", gap: 8 }}>
              {[
                { v: patient.bloodGroup, l: t("रक्त समूह", "Blood Group") },
                { v: patient.age,        l: t("उम्र", "Age") },
                { v: patient.condition,  l: t("स्थिति", "Condition") },
              ].map((d, i) => (
                <div key={i} style={{ flex: 1, textAlign: "center", padding: "8px 6px", background: C.bg, borderRadius: 10 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: C.text }}>{d.v}</div>
                  <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{d.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* ── PROFESSIONAL FILTER BAR & CATEGORY TABS ── */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <div style={{ background: C.card, borderRadius: 16, padding: "12px", border: `1px solid ${C.border}`, marginBottom: 14, boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
            {/* Search Input */}
            <div style={{ position: "relative", marginBottom: 10 }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("लक्षण, डॉक्टर या लैब खोजें...", "Search symptom, doctor, hospital...")}
                style={{
                  width: "100%", padding: "8px 12px 8px 32px", borderRadius: 10,
                  border: `1px solid ${C.border}`, background: C.bg, fontSize: 12, outline: "none"
                }}
              />
              <span style={{ position: "absolute", left: 10, top: 8, fontSize: 13, color: C.muted }}>🔍</span>
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} style={{ position: "absolute", right: 8, top: 6, background: "none", border: "none", cursor: "pointer", color: C.muted, fontSize: 12 }}>✕</button>
              )}
            </div>

            {/* Category Navigation Pills */}
            <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
              {[
                { id: "ALL", label: t("सभी", "All"), count: consultations.length + labOrders.length },
                { id: "CONSULTATIONS", label: t("परामर्श", "Consultations"), count: consultations.length },
                { id: "LABS", label: t("लैब टेस्ट", "Lab Tests"), count: labOrders.length },
                { id: "HOSPITAL", label: t("अस्पताल विज़िट", "Hospital Visits"), count: consultations.filter(c => (c as any).bookingType === "HOSPITAL_RECEPTIONIST_ASSISTED" || !!c.hospital).length },
              ].map((tab) => {
                const isSelected = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    style={{
                      padding: "5px 10px", borderRadius: 20, border: "none",
                      background: isSelected ? C.primary : C.bg,
                      color: isSelected ? "white" : C.text,
                      fontSize: 11, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap",
                      display: "flex", alignItems: "center", gap: 5,
                      boxShadow: isSelected ? "0 2px 6px rgba(27,108,168,0.3)" : "none"
                    }}>
                    <span>{tab.label}</span>
                    <span style={{
                      background: isSelected ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.06)",
                      color: isSelected ? "white" : C.muted, padding: "1px 6px", borderRadius: 10, fontSize: 10
                    }}>
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Status Quick Filter & View Mode Toggle */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8, paddingTop: 8, borderTop: `1px solid ${C.border}` }}>
              <div style={{ display: "flex", gap: 4 }}>
                {[
                  { id: "ALL", label: "All" },
                  { id: "COMPLETED", label: "✓ Done" },
                  { id: "PENDING", label: "⏳ Pending" },
                  { id: "CRITICAL", label: "🔴 Red" },
                ].map((sf) => (
                  <button
                    key={sf.id}
                    onClick={() => setStatusFilter(sf.id as any)}
                    style={{
                      padding: "3px 8px", borderRadius: 6, border: `1px solid ${statusFilter === sf.id ? C.primary : C.border}`,
                      background: statusFilter === sf.id ? "#EBF4FD" : "transparent",
                      color: statusFilter === sf.id ? C.primary : C.muted, fontSize: 10, fontWeight: 700, cursor: "pointer"
                    }}>
                    {sf.label}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setIsCompactView(!isCompactView)}
                style={{ background: "none", border: "none", color: C.primary, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                {isCompactView ? "📑 Detailed" : "☰ Compact"}
              </button>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* ── SECTION 1: DIAGNOSTIC LAB TESTS & REPORTS (MINIMIZABLE) ── */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          {filteredLabOrders.length > 0 && activeTab !== "CONSULTATIONS" && (
            <div style={{ marginBottom: 14 }}>
              <div
                onClick={() => setIsLabsCollapsed(!isLabsCollapsed)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  background: C.card, padding: "10px 14px", borderRadius: 12, border: `1px solid ${C.border}`,
                  cursor: "pointer", marginBottom: isLabsCollapsed ? 0 : 8
                }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 16 }}>🧪</span>
                  <span style={{ fontWeight: 800, fontSize: 13, color: C.text }}>
                    {t("डायग्नोस्टिक लैब टेस्ट और रिपोर्ट्स", "Prescribed Lab Tests & Reports")}
                  </span>
                  <span style={{ background: "#0891B2", color: "white", borderRadius: 20, padding: "1px 7px", fontSize: 10, fontWeight: 800 }}>
                    {filteredLabOrders.length}
                  </span>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: C.primary }}>
                  {isLabsCollapsed ? "▲ Expand" : "▼ Minimize"}
                </span>
              </div>

              {!isLabsCollapsed && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {filteredLabOrders.map((lo) => {
                    const statusMap: Record<string, { label: string; color: string; bg: string }> = {
                      SENT_TO_LAB: { label: t("लैब को भेजा गया", "Sent to Lab"), color: "#0284C7", bg: "#E0F2FE" },
                      LAB_ACCEPTED: { label: t("स्वीकृत", "Lab Accepted"), color: "#059669", bg: "#D1FAE5" },
                      LAB_REJECTED: { label: t("अस्वीकृत", "Rejected"), color: "#DC2626", bg: "#FEE2E2" },
                      APPOINTMENT_CONFIRMED: { label: t("स्लॉट बुक", "Slot Confirmed"), color: "#7C3AED", bg: "#EDE9FE" },
                      SAMPLE_COLLECTED: { label: t("सैंपल एकत्र", "Sample Collected"), color: "#D97706", bg: "#FEF3C7" },
                      PROCESSING: { label: t("जांच जारी", "Analyzing"), color: "#DB2777", bg: "#FCE7F3" },
                      REPORT_UPLOADED: { label: t("रिपोर्ट तैयार", "Report Uploaded"), color: "#16A34A", bg: "#DCFCE7" },
                      DOCTOR_REVIEWED: { label: t("डॉक्टर समीक्षित", "Doctor Reviewed"), color: "#2563EB", bg: "#DBEAFE" },
                    };
                    const s = statusMap[lo.status] || { label: lo.status, color: C.muted, bg: C.bg };

                    return (
                      <div key={lo._id} style={{ background: C.card, borderRadius: 14, padding: isCompactView ? "10px 12px" : "12px 14px", border: `1px solid ${C.border}`, boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 800, color: C.text }}>🏥 {lo.labName}</div>
                            <div style={{ fontSize: 11, color: C.muted }}>{formatDoctorDisplay(lo.doctorName)} · {lo.orderId}</div>
                          </div>
                          <span style={{ fontSize: 10, fontWeight: 700, color: s.color, background: s.bg, padding: "2px 8px", borderRadius: 8 }}>
                            {s.label}
                          </span>
                        </div>

                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, margin: "6px 0 6px" }}>
                          {(lo.tests || []).map((test: string, idx: number) => (
                            <span key={idx} style={{ background: "#F1F5F9", color: "#334155", padding: "2px 7px", borderRadius: 6, fontSize: 10, fontWeight: 600 }}>
                              🧪 {test}
                            </span>
                          ))}
                        </div>

                        {lo.appointmentSlot && (
                          <div style={{ fontSize: 10, color: "#7C3AED", fontWeight: 700, marginBottom: 4 }}>
                            📅 {t("अपॉइंटमेंट", "Slot")}: {lo.appointmentSlot}
                          </div>
                        )}

                        {!isCompactView && lo.doctorReviewNotes && (
                          <div style={{ background: "#EFF6FF", borderRadius: 8, padding: "6px 8px", fontSize: 11, color: "#1E40AF", marginBottom: 6 }}>
                            <strong>👨‍⚕️ {t("डॉक्टर रिव्यू", "Doctor Review")}:</strong> {lo.doctorReviewNotes}
                          </div>
                        )}

                        {lo.reportUrl && (
                          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 4 }}>
                            <button
                              onClick={() => setSelectedReportOrder(lo)}
                              style={{ background: "#0E7490", color: "white", border: "none", borderRadius: 8, padding: "5px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                              📄 {t("रिपोर्ट देखें", "View Diagnostic Report")}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* ── SECTION 2: PAST CONSULTATIONS (MINIMIZABLE & PAGINATED) ── */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          {activeTab !== "LABS" && (
            <div style={{ marginBottom: 14 }}>
              <div
                onClick={() => setIsConsultationsCollapsed(!isConsultationsCollapsed)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  background: C.card, padding: "10px 14px", borderRadius: 12, border: `1px solid ${C.border}`,
                  cursor: "pointer", marginBottom: isConsultationsCollapsed ? 0 : 8
                }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 16 }}>📋</span>
                  <span style={{ fontWeight: 800, fontSize: 13, color: C.text }}>
                    {t("पिछली विज़िट व परामर्श", "Past Consultations & Appointments")}
                  </span>
                  <span style={{ background: C.primary, color: "white", borderRadius: 20, padding: "1px 7px", fontSize: 10, fontWeight: 800 }}>
                    {filteredConsultations.length}
                  </span>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: C.primary }}>
                  {isConsultationsCollapsed ? "▲ Expand" : "▼ Minimize"}
                </span>
              </div>

              {!isConsultationsCollapsed && (
                fetching ? (
                  <div style={{ textAlign: "center", padding: 32, color: C.muted }}>
                    ⏳ {t("लोड हो रहा है...", "Loading records...")}
                  </div>
                ) : filteredConsultations.length === 0 ? (
                  <div style={{ background: C.card, borderRadius: 16, padding: 24, textAlign: "center", border: `1px solid ${C.border}` }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>🩺</div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{t("कोई रिकॉर्ड नहीं मिला", "No matching records found")}</div>
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>{t("लक्षण जाँचें और डॉक्टर बुक करें", "Check symptoms and book a doctor")}</div>
                  </div>
                ) : (
                  <>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {visibleConsultations.map((c, i) => {
                        const cfg = urgencyConfig[c.urgency] || urgencyConfig.GREEN;
                        const title = getTitle(c);
                        const isOpen = expanded === (c._id || String(i));
                        const cardId = c._id || String(i);

                        const tokenCode = (c as any).tokenNumber || (c.queueNo ? (c.queueNo.startsWith("OPD-") ? c.queueNo : `OPD-${c.queueNo.replace(/^Q-?/i, "")}`) : (c._id ? `OPD-${c._id.slice(-4).toUpperCase()}` : "OPD-101"));

                        return (
                          <div key={cardId} className="rec-card" style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, borderLeft: `4px solid ${cfg.color}`, boxShadow: "0 2px 8px rgba(0,0,0,0.03)", overflow: "hidden" }}>
                            <div className="rec-expand-row" onClick={() => setExpanded(isOpen ? null : cardId)} style={{ padding: isCompactView ? "10px 12px" : "12px 14px" }}>
                              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                                <div style={{ width: 10, height: 10, borderRadius: "50%", background: cfg.color, marginTop: 5, flexShrink: 0, boxShadow: `0 0 7px ${cfg.color}70` }} />
                                <div style={{ flex: 1 }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                    <span style={{ fontWeight: 800, fontSize: 13, color: C.text }}>{title}</span>
                                    <span style={{ background: cfg.bg, color: cfg.color, padding: "1px 8px", borderRadius: 20, fontSize: 10, fontWeight: 800 }}>
                                      {cfg.label}
                                    </span>
                                  </div>
                                  <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{formatDate(c.createdAt)}</div>
                                  
                                  {!isCompactView && (
                                    <div style={{ marginTop: 5 }}>
                                      {(c.symptoms || []).slice(0, 4).map((s) => (
                                        <span key={s} className="rec-pill">{s}</span>
                                      ))}
                                    </div>
                                  )}

                                  <div style={{ fontSize: 11, color: C.primary, marginTop: 4, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                                    <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                                      <Building2 size={12} /> {formatDoctorDisplay(c.doctorName)}
                                    </span>
                                    {c.slot && (
                                      <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                                        · <Clock size={12} /> {c.slot}
                                      </span>
                                    )}
                                    <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontWeight: 800, color: "#0369A1", background: "#E0F2FE", padding: "1px 6px", borderRadius: 4 }}>
                                      Token: #{tokenCode}
                                    </span>
                                  </div>

                                  <div style={{ display: "flex", alignItems: "center", marginTop: 6 }}>
                                    <span style={{ fontSize: 11, color: c.status === "completed" ? C.green : cfg.color, fontStyle: "italic", fontWeight: 600 }}>
                                      {statusLabel[c.status] || c.status}
                                    </span>
                                    <span className="rec-chevron" style={{ marginLeft: "auto", fontSize: 11, color: C.muted, fontWeight: 700, display: "flex", alignItems: "center", gap: 3 }}>
                                      {isOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                                      {isOpen ? t("छुपाएं", "Hide") : t("रिपोर्ट देखें", "View Report")}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Expanded Details */}
                            {isOpen && (
                              <div style={{ padding: "0 14px 14px", borderTop: `1px solid ${C.border}`, paddingTop: 12 }}>
                                {(c.doctorName || c.hospital || c.slot || c.queueNo) && (
                                  <div style={{ background: "linear-gradient(135deg, #EBF4FD, #DDEEFF)", borderRadius: 12, padding: "10px 12px", marginBottom: 10, border: `1px solid ${C.primary}30` }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                                      <Calendar size={13} color={C.primary} />
                                      <span style={{ fontWeight: 800, fontSize: 10, color: C.primary, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                        {t("अपॉइंटमेंट विवरण", "Appointment Details")}
                                      </span>
                                    </div>
                                    <div style={{ fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 3, display: "flex", alignItems: "center", gap: 5 }}>
                                      <Stethoscope size={13} color={C.primary} /> <strong>{t("डॉक्टर", "Doctor")}:</strong> {formatDoctorDisplay(c.doctorName)}
                                    </div>
                                    {c.hospital && (
                                      <div style={{ fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 3, display: "flex", alignItems: "center", gap: 5 }}>
                                        <Building2 size={13} color={C.primary} /> <strong>{t("अस्पताल", "Hospital")}:</strong> {c.hospital}
                                      </div>
                                    )}
                                    <div style={{ fontSize: 12, fontWeight: 600, color: C.text, display: "flex", alignItems: "center", gap: 5 }}>
                                      <Clock size={13} color={C.primary} /> <strong>{t("समय एवं टोकन", "Time & Token")}:</strong> {c.slot || "OPD Slot"} · Token: #{tokenCode}
                                    </div>
                                  </div>
                                )}

                                {/* Symptoms */}
                                <div style={{ background: "#FEF9E7", borderRadius: 12, padding: "10px 12px", marginBottom: 10, border: "1px solid #FAD7A0" }}>
                                  <div style={{ fontSize: 10, fontWeight: 800, color: "#7D6608", textTransform: "uppercase", marginBottom: 4, display: "flex", alignItems: "center", gap: 5 }}>
                                    <Activity size={12} color="#7D6608" /> {t("दर्ज लक्षण", "Symptoms Reported")}
                                  </div>
                                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                                    {(c.symptoms || []).map((s) => (
                                      <span key={s} style={{ background: "#fff", padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600, border: "1px solid #F5CBA7" }}>
                                        {s}
                                      </span>
                                    ))}
                                  </div>
                                </div>

                                {/* Clinical Notes */}
                                <div style={{ background: C.bg, borderRadius: 10, padding: 10, fontSize: 11, color: C.muted, marginBottom: 8 }}>
                                  {(c as any).notes ? (
                                    <div style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
                                      <Stethoscope size={13} color={C.primary} style={{ marginTop: 2, flexShrink: 0 }} />
                                      <div><strong>Doctor Notes:</strong> {(c as any).notes}</div>
                                    </div>
                                  ) : (
                                    <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                      <Stethoscope size={12} /> {t("डॉक्टर के नोट्स अभी उपलब्ध नहीं हैं", "Doctor notes not yet available")}
                                    </span>
                                  )}
                                </div>

                                {/* Prescriptions */}
                                <div style={{ background: C.bg, borderRadius: 10, padding: 10, fontSize: 11, color: C.muted, marginBottom: 10 }}>
                                  {(c as any).prescription ? (
                                    <div style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
                                      <Pill size={13} color={C.green} style={{ marginTop: 2, flexShrink: 0 }} />
                                      <div><strong>Prescription:</strong> {(c as any).prescription}</div>
                                    </div>
                                  ) : (
                                    <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                      <Pill size={12} /> {t("कोई प्रिस्क्रिप्शन अभी नहीं", "No prescription yet")}
                                    </span>
                                  )}
                                </div>

                                {/* Actions */}
                                <div style={{ display: "flex", gap: 8 }}>
                                  <button
                                    className="rec-btn"
                                    onClick={() => generatePDF(patient, [c])}
                                    style={{ flex: 1, background: "#E0F2FE", color: "#0369A1", fontSize: 11, justifyContent: "center", display: "flex", alignItems: "center", gap: 5 }}>
                                    <Download size={13} /> {t("PDF डाउनलोड", "Download PDF")}
                                  </button>

                                  {c.status === "completed" && (
                                    <button
                                      className="rec-btn"
                                      onClick={() => setRateModalConsultation(c)}
                                      style={{
                                        flex: 1,
                                        background: reviews[c._id] ? "#FEF3C7" : "linear-gradient(135deg, #0F766E, #14B8A6)",
                                        color: reviews[c._id] ? "#92400E" : "white",
                                        fontSize: 11,
                                        justifyContent: "center",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 5
                                      }}>
                                      <Star size={13} fill={reviews[c._id] ? "#F59E0B" : "none"} />
                                      {reviews[c._id] ? `Rated ${reviews[c._id].rating}★` : t("रेट करें", "Rate Doctor")}
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Pagination / Show More Button */}
                    {filteredConsultations.length > visibleCount && (
                      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                        <button
                          onClick={() => setVisibleCount((prev) => prev + 10)}
                          style={{
                            flex: 1, padding: "10px", borderRadius: 10, border: `1px solid ${C.border}`,
                            background: C.card, color: C.primary, fontSize: 12, fontWeight: 800, cursor: "pointer",
                            boxShadow: "0 2px 6px rgba(0,0,0,0.03)"
                          }}>
                          📄 {t("और लोड करें (+10)", "Load More (+10)")}
                        </button>
                        <button
                          onClick={() => setVisibleCount(filteredConsultations.length)}
                          style={{
                            padding: "10px 14px", borderRadius: 10, border: "none",
                            background: C.primary, color: "white", fontSize: 12, fontWeight: 800, cursor: "pointer"
                          }}>
                          {t("सभी देखें", "Show All")} ({filteredConsultations.length})
                        </button>
                      </div>
                    )}
                  </>
                )
              )}
            </div>
          )}

        </div>

        {/* Doctor Rating Modal */}
        {rateModalConsultation && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)", zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
            <div style={{ background: C.card, width: "100%", maxWidth: 360, borderRadius: 20, padding: 20, border: `1px solid ${C.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: C.text }}>
                    ★ {t("डॉक्टर को रेट करें", "Rate Your Doctor")}
                  </h3>
                  <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
                    {formatDoctorDisplay(rateModalConsultation.doctorName)}
                  </div>
                </div>
                <button onClick={() => setRateModalConsultation(null)} style={{ background: C.bg, border: "none", borderRadius: 8, width: 28, height: 28, cursor: "pointer", fontSize: 14 }}>✕</button>
              </div>

              {reviewSuccessMsg ? (
                <div style={{ background: "#ECFDF5", border: "1px solid #A7F3D0", borderRadius: 12, padding: "20px", textAlign: "center", color: "#065F46" }}>
                  <div style={{ fontSize: 24, marginBottom: 6 }}>✓</div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{reviewSuccessMsg}</div>
                </div>
              ) : (
                <>
                  <div style={{ textAlign: "center", margin: "14px 0 16px" }}>
                    <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 6 }}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setSelectedRating(star)}
                          style={{
                            background: "none", border: "none", fontSize: 30, cursor: "pointer",
                            color: star <= selectedRating ? "#F59E0B" : "#CBD5E1", padding: 0
                          }}>
                          ★
                        </button>
                      ))}
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: selectedRating >= 4 ? "#059669" : selectedRating === 3 ? "#D97706" : "#DC2626" }}>
                      {selectedRating === 5 && t("उत्कृष्ट (5/5) — बहुत मददगार!", "Excellent (5/5) — Extremely Helpful!")}
                      {selectedRating === 4 && t("अच्छा (4/5) — अच्छी सलाह मिली", "Good (4/5) — Helpful Consultation")}
                      {selectedRating === 3 && t("औसत (3/5) — ठीक ठाक", "Average (3/5) — Satisfactory")}
                      {selectedRating <= 2 && t("खराब — सुधार की आवश्यकता", "Poor — Needs Improvement")}
                    </div>
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 4, textTransform: "uppercase" }}>
                      {t("आपकी प्रतिक्रिया", "Your Feedback (Optional)")}
                    </label>
                    <textarea
                      rows={3}
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder={t("उदा. डॉक्टर ने मेरी समस्या ध्यान से समझी...", "e.g. Doctor explained the treatment clearly...")}
                      style={{ width: "100%", padding: "10px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.bg, fontSize: 12, outline: "none" }}
                    />
                  </div>

                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => setRateModalConsultation(null)}
                      style={{ flex: 1, padding: 10, borderRadius: 10, border: `1px solid ${C.border}`, background: C.bg, color: C.muted, fontWeight: 700, cursor: "pointer", fontSize: 12 }}>
                      {t("रद्द करें", "Cancel")}
                    </button>
                    <button
                      type="button"
                      onClick={handleSubmitReview}
                      disabled={submittingReview}
                      style={{
                        flex: 1.5, padding: 10, borderRadius: 10, border: "none",
                        background: "linear-gradient(135deg, #0F766E, #14B8A6)", color: "white",
                        fontWeight: 700, cursor: submittingReview ? "not-allowed" : "pointer", fontSize: 12
                      }}>
                      {submittingReview ? "..." : t("सबमिट करें →", "Submit Review →")}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Diagnostic Report Viewer Modal */}
        {selectedReportOrder && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)", zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
            <div style={{ background: C.card, width: "100%", maxWidth: 360, borderRadius: 20, padding: 20, border: `1px solid ${C.border}`, maxHeight: "85vh", overflowY: "auto" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>📄 {t("डायग्नोस्टिक लैब रिपोर्ट", "Diagnostic Lab Report")}</h3>
                  <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
                    {selectedReportOrder.labName} · {selectedReportOrder.orderId}
                  </div>
                </div>
                <button onClick={() => setSelectedReportOrder(null)} style={{ background: C.bg, border: "none", borderRadius: 8, width: 28, height: 28, cursor: "pointer", fontSize: 14 }}>✕</button>
              </div>

              {selectedReportOrder.reportUrl?.startsWith("data:image") ? (
                <div style={{ textAlign: "center", marginBottom: 14 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={selectedReportOrder.reportUrl} alt="Diagnostic Report" style={{ width: "100%", borderRadius: 10, border: `1px solid ${C.border}` }} />
                </div>
              ) : (
                <div style={{ background: "#0b1329", borderRadius: 10, padding: 14, marginBottom: 14, fontFamily: "monospace", fontSize: 11, color: "#93c5fd", whiteSpace: "pre-wrap", lineHeight: 1.6, border: `1px solid ${C.border}` }}>
                  {decodeURIComponent(selectedReportOrder.reportUrl?.replace("data:text/plain;charset=utf-8,", "") || "Report text attached.")}
                </div>
              )}

              {selectedReportOrder.doctorReviewNotes && (
                <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 10, padding: 12, color: "#1E40AF", fontSize: 12, marginBottom: 14 }}>
                  <strong>👨‍⚕️ {t("डॉक्टर का मूल्यांकन", "Doctor's Assessment")}:</strong> {selectedReportOrder.doctorReviewNotes}
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button onClick={() => setSelectedReportOrder(null)} style={{ background: C.primary, color: "white", border: "none", padding: "8px 18px", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                  {t("बंद करें", "Close")}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}