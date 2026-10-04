"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface LabOrder {
  _id: string;
  orderId: string;
  consultationId: string;
  patientPhone: string;
  patientName: string;
  doctorId?: string;
  doctorName?: string;
  labId: string;
  labName: string;
  tests: string[];
  priority: "NORMAL" | "URGENT";
  doctorInstructions?: string;
  status:
    | "SENT_TO_LAB"
    | "LAB_ACCEPTED"
    | "LAB_REJECTED"
    | "APPOINTMENT_CONFIRMED"
    | "SAMPLE_COLLECTED"
    | "PROCESSING"
    | "REPORT_UPLOADED"
    | "DOCTOR_REVIEWED"
    | "CANCELLED";
  rejectionReason?: string;
  appointmentSlot?: string;
  sampleCollectedAt?: string;
  reportUrl?: string;
  reportFileName?: string;
  reportData?: Record<string, any>;
  uploadedAt?: string;
  doctorReviewNotes?: string;
  reviewedAt?: string;
  createdAt: string;
}

const C = {
  primary: "#0E7490",
  primaryDark: "#155E75",
  accent: "#06B6D4",
  bg: "#0F172A",
  card: "#1E293B",
  cardLight: "#334155",
  text: "#F8FAFC",
  muted: "#94A3B8",
  border: "#334155",
  green: "#10B981",
  yellow: "#F59E0B",
  red: "#EF4444",
  purple: "#8B5CF6",
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  SENT_TO_LAB: { label: "New Request", color: "#38BDF8", bg: "rgba(56,189,248,0.15)" },
  LAB_ACCEPTED: { label: "Accepted", color: "#34D399", bg: "rgba(52,211,153,0.15)" },
  LAB_REJECTED: { label: "Rejected", color: "#F87171", bg: "rgba(248,113,113,0.15)" },
  APPOINTMENT_CONFIRMED: { label: "Slot Booked", color: "#A78BFA", bg: "rgba(167,139,250,0.15)" },
  SAMPLE_COLLECTED: { label: "Sample Collected", color: "#FBBF24", bg: "rgba(251,191,36,0.15)" },
  PROCESSING: { label: "Analyzing", color: "#F472B6", bg: "rgba(244,114,182,0.15)" },
  REPORT_UPLOADED: { label: "Report Uploaded", color: "#10B981", bg: "rgba(16,185,129,0.2)" },
  DOCTOR_REVIEWED: { label: "Doctor Reviewed", color: "#60A5FA", bg: "rgba(96,165,250,0.2)" },
  CANCELLED: { label: "Cancelled", color: "#94A3B8", bg: "rgba(148,163,184,0.15)" },
};

export default function LabDashboardPage() {
  const router = useRouter();
  const [labUser, setLabUser] = useState<any>(null);
  const [orders, setOrders] = useState<LabOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"requests" | "active" | "completed" | "services">("requests");

  // Action Modals & Forms
  const [rejectModalOrder, setRejectModalOrder] = useState<LabOrder | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [slotModalOrder, setSlotModalOrder] = useState<LabOrder | null>(null);
  const [slotTime, setSlotTime] = useState("");
  const [uploadModalOrder, setUploadModalOrder] = useState<LabOrder | null>(null);
  const [reportFileBase64, setReportFileBase64] = useState("");
  const [reportFileName, setReportFileName] = useState("");
  const [reportNotes, setReportNotes] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [viewReportOrder, setViewReportOrder] = useState<LabOrder | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("diagnostic_lab_user");
      if (!stored) {
        router.replace("/lab/login");
        return;
      }
      try {
        setLabUser(JSON.parse(stored));
      } catch {
        router.replace("/lab/login");
      }
    }
  }, [router]);

  const fetchOrders = useCallback(async () => {
    if (!labUser?.labId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/lab-orders?labId=${labUser.labId}`);
      const data = await res.json();
      setOrders(data.orders || []);
    } catch (err) {
      console.error("Failed to fetch lab orders:", err);
    } finally {
      setLoading(false);
    }
  }, [labUser?.labId]);

  useEffect(() => {
    if (labUser?.labId) {
      fetchOrders();
    }
  }, [labUser?.labId, fetchOrders]);

  const updateOrderStatus = async (orderId: string, updates: Record<string, any>) => {
    setUpdatingId(orderId);
    try {
      const res = await fetch("/api/lab-orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, ...updates }),
      });
      if (res.ok) {
        await fetchOrders();
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleAccept = async (order: LabOrder) => {
    await updateOrderStatus(order.orderId, { status: "LAB_ACCEPTED" });
  };

  const handleRejectSubmit = async () => {
    if (!rejectModalOrder) return;
    await updateOrderStatus(rejectModalOrder.orderId, {
      status: "LAB_REJECTED",
      rejectionReason: rejectReason || "Test not available at this time.",
    });
    setRejectModalOrder(null);
    setRejectReason("");
  };

  const handleSlotSubmit = async () => {
    if (!slotModalOrder) return;
    await updateOrderStatus(slotModalOrder.orderId, {
      status: "APPOINTMENT_CONFIRMED",
      appointmentSlot: slotTime || "10:30 AM Tomorrow",
    });
    setSlotModalOrder(null);
    setSlotTime("");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setReportFileName(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      setReportFileBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleReportSubmit = async () => {
    if (!uploadModalOrder) return;
    // If no file uploaded, generate standard structured report text URL
    const fileData =
      reportFileBase64 ||
      `data:text/plain;charset=utf-8,${encodeURIComponent(
        `AAROGYA.AI DIAGNOSTIC REPORT\n=========================\nPatient: ${uploadModalOrder.patientName}\nDoctor: ${uploadModalOrder.doctorName}\nLab: ${uploadModalOrder.labName}\nDate: ${new Date().toLocaleDateString()}\nTests: ${uploadModalOrder.tests.join(", ")}\nNotes: ${reportNotes || "All parameters evaluated within reference ranges."}\nStatus: Verified by Lab Pathologist`
      )}`;

    await updateOrderStatus(uploadModalOrder.orderId, {
      status: "REPORT_UPLOADED",
      reportUrl: fileData,
      reportFileName: reportFileName || `${uploadModalOrder.tests[0].replace(/\s+/g, "_")}_Report.pdf`,
      reportData: { notes: reportNotes },
    });

    setUploadModalOrder(null);
    setReportFileBase64("");
    setReportFileName("");
    setReportNotes("");
  };

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("diagnostic_lab_user");
    }
    router.push("/lab/login");
  };

  if (!labUser) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>
        Loading Lab Portal...
      </div>
    );
  }

  // Filter orders by tab
  const incomingRequests = orders.filter((o) => o.status === "SENT_TO_LAB");
  const activeOrders = orders.filter((o) =>
    ["LAB_ACCEPTED", "APPOINTMENT_CONFIRMED", "SAMPLE_COLLECTED", "PROCESSING"].includes(o.status)
  );
  const completedOrders = orders.filter((o) =>
    ["REPORT_UPLOADED", "DOCTOR_REVIEWED", "LAB_REJECTED", "CANCELLED"].includes(o.status)
  );

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, display: "flex", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 900, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        {/* Top Navbar */}
        <header style={{ background: C.card, padding: "16px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: "linear-gradient(135deg, #06B6D4, #0E7490)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, boxShadow: "0 4px 12px rgba(6,182,212,0.3)" }}>
              🧪
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: C.text, display: "flex", alignItems: "center", gap: 8 }}>
                <span>{labUser.name}</span>
                <span style={{ fontSize: 11, background: "rgba(16,185,129,0.2)", color: C.green, padding: "2px 8px", borderRadius: 10, fontWeight: 700 }}>
                  ✓ Verified Lab
                </span>
              </div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
                📍 {labUser.city}, {labUser.district} · ID: {labUser.labId} · 📞 {labUser.phone}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              onClick={fetchOrders}
              title="Refresh Orders"
              style={{ width: 38, height: 38, borderRadius: 10, background: C.cardLight, border: `1px solid ${C.border}`, color: C.text, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}
            >
              🔄
            </button>
            <button
              onClick={handleLogout}
              style={{ background: "rgba(239,68,68,0.15)", border: `1px solid rgba(239,68,68,0.3)`, color: "#FCA5A5", borderRadius: 10, padding: "8px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
            >
              Logout
            </button>
          </div>
        </header>

        {/* Analytics Highlights */}
        <div style={{ padding: "16px 20px 0" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            {[
              { label: "New Requests", value: incomingRequests.length, color: "#38BDF8", icon: "📥" },
              { label: "In-Progress", value: activeOrders.length, color: "#FBBF24", icon: "🔬" },
              { label: "Reports Uploaded", value: completedOrders.filter((o) => o.status === "REPORT_UPLOADED" || o.status === "DOCTOR_REVIEWED").length, color: C.green, icon: "📄" },
              { label: "Total Orders", value: orders.length, color: C.purple, icon: "📊" },
            ].map((stat, i) => (
              <div key={i} style={{ background: C.card, borderRadius: 16, padding: "14px 16px", border: `1px solid ${C.border}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>{stat.label}</span>
                  <span style={{ fontSize: 16 }}>{stat.icon}</span>
                </div>
                <div style={{ fontSize: 24, fontWeight: 800, color: stat.color, marginTop: 4 }}>{stat.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: "flex", padding: "16px 20px 0", gap: 10 }}>
          {[
            { id: "requests", label: `Incoming Requests (${incomingRequests.length})`, icon: "📥" },
            { id: "active", label: `Active Tests (${activeOrders.length})`, icon: "🔬" },
            { id: "completed", label: `Completed Reports (${completedOrders.length})`, icon: "✅" },
            { id: "services", label: "Lab Test Catalog", icon: "📋" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                flex: 1,
                padding: "12px 14px",
                borderRadius: 12,
                border: "none",
                background: activeTab === tab.id ? "linear-gradient(135deg, #06B6D4, #0E7490)" : C.card,
                color: activeTab === tab.id ? "white" : C.muted,
                fontWeight: 700,
                fontSize: 13,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                boxShadow: activeTab === tab.id ? "0 4px 14px rgba(6,182,212,0.3)" : "none",
                transition: "all 0.2s ease",
              }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Main Content Body */}
        <main style={{ flex: 1, padding: 20, overflowY: "auto" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: C.muted }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
              <div>Fetching diagnostic lab orders...</div>
            </div>
          ) : activeTab === "requests" ? (
            <div>
              {incomingRequests.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 20px", background: C.card, borderRadius: 20, border: `1px solid ${C.border}` }}>
                  <div style={{ fontSize: 44, marginBottom: 12 }}>🎉</div>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>No Pending Requests</div>
                  <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>
                    New diagnostic test requests from doctors will appear here automatically.
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {incomingRequests.map((order) => {
                    const isUrgent = order.priority === "URGENT";
                    return (
                      <div
                        key={order._id}
                        style={{
                          background: C.card,
                          borderRadius: 18,
                          padding: 18,
                          border: `1.5px solid ${isUrgent ? C.red : C.border}`,
                          boxShadow: isUrgent ? "0 4px 18px rgba(239,68,68,0.2)" : "none",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span style={{ fontSize: 16, fontWeight: 800, color: C.text }}>{order.patientName}</span>
                              <span style={{ fontSize: 12, color: C.muted }}>📞 {order.patientPhone}</span>
                              {isUrgent && (
                                <span style={{ background: "rgba(239,68,68,0.2)", color: C.red, padding: "2px 8px", borderRadius: 8, fontSize: 10, fontWeight: 800 }}>
                                  🚨 URGENT
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>
                              Prescribed by: <strong style={{ color: C.text }}>{order.doctorName || "Dr. Consulting Physician"}</strong> · Order ID: <code>{order.orderId}</code>
                            </div>
                          </div>
                          <span style={{ fontSize: 11, background: STATUS_CONFIG[order.status]?.bg, color: STATUS_CONFIG[order.status]?.color, padding: "4px 10px", borderRadius: 10, fontWeight: 700 }}>
                            {STATUS_CONFIG[order.status]?.label}
                          </span>
                        </div>

                        {/* Tests List */}
                        <div style={{ background: C.cardLight, borderRadius: 12, padding: "10px 14px", marginBottom: 12 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", marginBottom: 6 }}>
                            Requested Diagnostic Tests ({order.tests.length}):
                          </div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                            {order.tests.map((test, idx) => (
                              <span
                                key={idx}
                                style={{
                                  background: "rgba(6,182,212,0.15)",
                                  color: C.accent,
                                  padding: "4px 10px",
                                  borderRadius: 8,
                                  fontSize: 12,
                                  fontWeight: 600,
                                  border: "1px solid rgba(6,182,212,0.3)",
                                }}
                              >
                                🧪 {test}
                              </span>
                            ))}
                          </div>
                        </div>

                        {order.doctorInstructions && (
                          <div style={{ fontSize: 12, color: "#FDE68A", background: "rgba(245,158,11,0.1)", padding: "8px 12px", borderRadius: 8, marginBottom: 14 }}>
                            <strong>Doctor&apos;s Clinical Note:</strong> {order.doctorInstructions}
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                          <button
                            onClick={() => {
                              setRejectModalOrder(order);
                              setRejectReason("");
                            }}
                            style={{ background: "rgba(239,68,68,0.15)", color: "#FCA5A5", border: "1px solid rgba(239,68,68,0.3)", padding: "10px 16px", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer" }}
                          >
                            ✕ Reject
                          </button>
                          <button
                            onClick={() => handleAccept(order)}
                            disabled={updatingId === order.orderId}
                            style={{ background: "linear-gradient(135deg, #10B981, #059669)", color: "white", border: "none", padding: "10px 20px", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, boxShadow: "0 4px 12px rgba(16,185,129,0.3)" }}
                          >
                            ✓ Accept Lab Order
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : activeTab === "active" ? (
            <div>
              {activeOrders.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 20px", background: C.card, borderRadius: 20, border: `1px solid ${C.border}` }}>
                  <div style={{ fontSize: 44, marginBottom: 12 }}>🔬</div>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>No Active Test Orders</div>
                  <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>
                    Accept orders from the &ldquo;Incoming Requests&rdquo; tab to process samples and upload reports.
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {activeOrders.map((order) => (
                    <div key={order._id} style={{ background: C.card, borderRadius: 18, padding: 18, border: `1px solid ${C.border}` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                        <div>
                          <div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>{order.patientName}</div>
                          <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
                            📞 {order.patientPhone} · Dr. {order.doctorName} · <code>{order.orderId}</code>
                          </div>
                        </div>
                        <span style={{ fontSize: 11, background: STATUS_CONFIG[order.status]?.bg, color: STATUS_CONFIG[order.status]?.color, padding: "4px 10px", borderRadius: 10, fontWeight: 700 }}>
                          {STATUS_CONFIG[order.status]?.label}
                        </span>
                      </div>

                      {/* Tests */}
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
                        {order.tests.map((t, idx) => (
                          <span key={idx} style={{ background: C.cardLight, color: C.text, padding: "4px 10px", borderRadius: 8, fontSize: 12, fontWeight: 600 }}>
                            🧪 {t}
                          </span>
                        ))}
                      </div>

                      {/* Current Status Timeline & Action Bar */}
                      <div style={{ background: C.cardLight, borderRadius: 14, padding: "14px 16px", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                        <div>
                          <div style={{ fontSize: 11, color: C.muted, fontWeight: 700, textTransform: "uppercase" }}>Current Stage</div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: C.accent, marginTop: 2 }}>
                            {order.status === "LAB_ACCEPTED" && "⏳ Awaiting Slot / Patient Visit"}
                            {order.status === "APPOINTMENT_CONFIRMED" && `📅 Appointment Slot: ${order.appointmentSlot || "Scheduled"}`}
                            {order.status === "SAMPLE_COLLECTED" && "🩸 Sample Collected — Ready for Analyzer"}
                            {order.status === "PROCESSING" && "⚡ Analyzing in Laboratory — Ready to Upload Report"}
                          </div>
                        </div>

                        {/* Stage Progression Buttons */}
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          {order.status === "LAB_ACCEPTED" && (
                            <button
                              onClick={() => {
                                setSlotModalOrder(order);
                                setSlotTime("10:30 AM Tomorrow");
                              }}
                              style={{ background: C.purple, color: "white", border: "none", padding: "8px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                            >
                              📅 Assign Slot
                            </button>
                          )}

                          {["LAB_ACCEPTED", "APPOINTMENT_CONFIRMED"].includes(order.status) && (
                            <button
                              onClick={() => updateOrderStatus(order.orderId, { status: "SAMPLE_COLLECTED" })}
                              style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)", color: "white", border: "none", padding: "8px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                            >
                              🩸 Mark Sample Collected
                            </button>
                          )}

                          {order.status === "SAMPLE_COLLECTED" && (
                            <button
                              onClick={() => updateOrderStatus(order.orderId, { status: "PROCESSING" })}
                              style={{ background: "linear-gradient(135deg, #EC4899, #BE185D)", color: "white", border: "none", padding: "8px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                            >
                              ⚡ Mark Processing
                            </button>
                          )}

                          {["PROCESSING", "SAMPLE_COLLECTED", "APPOINTMENT_CONFIRMED", "LAB_ACCEPTED"].includes(order.status) && (
                            <button
                              onClick={() => {
                                setUploadModalOrder(order);
                                setReportFileName("");
                                setReportFileBase64("");
                                setReportNotes("");
                              }}
                              style={{ background: "linear-gradient(135deg, #10B981, #059669)", color: "white", border: "none", padding: "8px 16px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", boxShadow: "0 2px 8px rgba(16,185,129,0.3)" }}
                            >
                              📤 Upload Test Report
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : activeTab === "completed" ? (
            <div>
              {completedOrders.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 20px", background: C.card, borderRadius: 20, border: `1px solid ${C.border}` }}>
                  <div style={{ fontSize: 44, marginBottom: 12 }}>📄</div>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>No Completed Reports Yet</div>
                  <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>
                    Uploaded test reports and finalized diagnostic orders will appear here.
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {completedOrders.map((order) => (
                    <div key={order._id} style={{ background: C.card, borderRadius: 18, padding: 18, border: `1px solid ${C.border}` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                        <div>
                          <div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>{order.patientName}</div>
                          <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
                            📞 {order.patientPhone} · Dr. {order.doctorName} · Order ID: <code>{order.orderId}</code>
                          </div>
                        </div>
                        <span style={{ fontSize: 11, background: STATUS_CONFIG[order.status]?.bg, color: STATUS_CONFIG[order.status]?.color, padding: "4px 10px", borderRadius: 10, fontWeight: 700 }}>
                          {STATUS_CONFIG[order.status]?.label}
                        </span>
                      </div>

                      {/* Tests */}
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                        {order.tests.map((t, idx) => (
                          <span key={idx} style={{ background: C.cardLight, color: C.text, padding: "4px 10px", borderRadius: 8, fontSize: 12, fontWeight: 600 }}>
                            🧪 {t}
                          </span>
                        ))}
                      </div>

                      {/* Doctor review if present */}
                      {order.doctorReviewNotes && (
                        <div style={{ background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.3)", borderRadius: 10, padding: "10px 14px", marginBottom: 12, color: "#93C5FD", fontSize: 13 }}>
                          <strong>👨‍⚕️ Doctor&apos;s Clinical Assessment:</strong> {order.doctorReviewNotes}
                        </div>
                      )}

                      {order.status === "LAB_REJECTED" && order.rejectionReason && (
                        <div style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, padding: "10px 14px", marginBottom: 12, color: "#FCA5A5", fontSize: 13 }}>
                          <strong>Reason for Rejection:</strong> {order.rejectionReason}
                        </div>
                      )}

                      {/* View Report button */}
                      {order.reportUrl && (
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                          <button
                            onClick={() => setViewReportOrder(order)}
                            style={{ background: C.cardLight, border: `1px solid ${C.border}`, color: C.accent, padding: "8px 16px", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
                          >
                            👁️ View Uploaded Report
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Services Catalog Tab */
            <div style={{ background: C.card, borderRadius: 20, padding: 22, border: `1px solid ${C.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>Registered Diagnostic Services</h3>
                  <p style={{ fontSize: 12, color: C.muted, margin: "4px 0 0" }}>
                    These diagnostic test capabilities are broadcast to doctors on the Aarogya.AI network.
                  </p>
                </div>
                <span style={{ fontSize: 12, background: "rgba(6,182,212,0.15)", color: C.accent, padding: "4px 10px", borderRadius: 12, fontWeight: 700 }}>
                  {labUser.services?.length || 0} Services Active
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {(labUser.services || []).map((service: string, idx: number) => (
                  <div key={idx} style={{ background: C.cardLight, borderRadius: 12, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10, border: `1px solid ${C.border}` }}>
                    <span style={{ fontSize: 18 }}>🧪</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{service}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>

        {/* Modal 1: Reject Reason Modal */}
        {rejectModalOrder && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 99999, padding: 20 }}>
            <div style={{ width: "100%", maxWidth: 440, background: C.card, borderRadius: 20, padding: 24, border: `1px solid ${C.border}` }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, margin: "0 0 8px" }}>Reject Diagnostic Request</h3>
              <p style={{ fontSize: 13, color: C.muted, marginBottom: 16 }}>
                Please provide a reason why this test cannot be accepted for {rejectModalOrder.patientName}.
              </p>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Reagent currently out of stock, or specialist unavailable today..."
                style={{ width: "100%", padding: "12px 14px", borderRadius: 12, background: C.cardLight, border: `1px solid ${C.border}`, color: C.text, fontSize: 13, outline: "none", boxSizing: "border-box", marginBottom: 18 }}
              />
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button onClick={() => setRejectModalOrder(null)} style={{ background: C.cardLight, border: `1px solid ${C.border}`, color: C.muted, padding: "10px 16px", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                  Cancel
                </button>
                <button onClick={handleRejectSubmit} style={{ background: C.red, color: "white", border: "none", padding: "10px 18px", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal 2: Assign Slot Modal */}
        {slotModalOrder && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 99999, padding: 20 }}>
            <div style={{ width: "100%", maxWidth: 440, background: C.card, borderRadius: 20, padding: 24, border: `1px solid ${C.border}` }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, margin: "0 0 8px" }}>Assign Appointment Slot</h3>
              <p style={{ fontSize: 13, color: C.muted, marginBottom: 16 }}>
                Set the recommended sample collection time for {slotModalOrder.patientName}.
              </p>
              <input
                type="text"
                value={slotTime}
                onChange={(e) => setSlotTime(e.target.value)}
                placeholder="e.g. Tomorrow 10:30 AM or 18 Oct 09:00 AM"
                style={{ width: "100%", padding: "12px 14px", borderRadius: 12, background: C.cardLight, border: `1px solid ${C.border}`, color: C.text, fontSize: 13, outline: "none", boxSizing: "border-box", marginBottom: 18 }}
              />
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button onClick={() => setSlotModalOrder(null)} style={{ background: C.cardLight, border: `1px solid ${C.border}`, color: C.muted, padding: "10px 16px", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                  Cancel
                </button>
                <button onClick={handleSlotSubmit} style={{ background: C.purple, color: "white", border: "none", padding: "10px 18px", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                  Confirm Slot
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal 3: Upload Report Modal */}
        {uploadModalOrder && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 99999, padding: 20 }}>
            <div style={{ width: "100%", maxWidth: 480, background: C.card, borderRadius: 20, padding: 24, border: `1px solid ${C.border}`, maxHeight: "90vh", overflowY: "auto" }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, margin: "0 0 6px" }}>Upload Diagnostic Lab Report</h3>
              <div style={{ fontSize: 12, color: C.muted, marginBottom: 16 }}>
                Order ID: <code>{uploadModalOrder.orderId}</code> · Patient: <strong>{uploadModalOrder.patientName}</strong>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: C.muted, display: "block", marginBottom: 6 }}>
                  Select Report File (PDF / Image)
                </label>
                <input
                  type="file"
                  accept="image/*,application/pdf,.pdf,.doc,.docx"
                  onChange={handleFileUpload}
                  style={{ width: "100%", padding: 10, borderRadius: 10, background: C.cardLight, border: `1px solid ${C.border}`, color: C.text, fontSize: 12 }}
                />
                {reportFileName && (
                  <div style={{ fontSize: 12, color: C.green, marginTop: 6, fontWeight: 600 }}>
                    ✓ Selected: {reportFileName}
                  </div>
                )}
              </div>

              <div style={{ marginBottom: 18 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: C.muted, display: "block", marginBottom: 6 }}>
                  Lab Observations & Summary
                </label>
                <textarea
                  rows={3}
                  value={reportNotes}
                  onChange={(e) => setReportNotes(e.target.value)}
                  placeholder="e.g. Hb: 13.8 g/dL (Normal), Fasting Sugar: 98 mg/dL (Normal). No critical alerts."
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 12, background: C.cardLight, border: `1px solid ${C.border}`, color: C.text, fontSize: 13, outline: "none", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button onClick={() => setUploadModalOrder(null)} style={{ background: C.cardLight, border: `1px solid ${C.border}`, color: C.muted, padding: "10px 16px", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                  Cancel
                </button>
                <button onClick={handleReportSubmit} style={{ background: "linear-gradient(135deg, #10B981, #059669)", color: "white", border: "none", padding: "10px 20px", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 12px rgba(16,185,129,0.3)" }}>
                  ✓ Submit & Deliver to Doctor
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal 4: View Report Viewer Modal */}
        {viewReportOrder && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 99999, padding: 20 }}>
            <div style={{ width: "100%", maxWidth: 540, background: C.card, borderRadius: 20, padding: 24, border: `1px solid ${C.border}`, maxHeight: "90vh", overflowY: "auto" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>Diagnostic Report</h3>
                  <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
                    Patient: {viewReportOrder.patientName} · Order: {viewReportOrder.orderId}
                  </div>
                </div>
                <button onClick={() => setViewReportOrder(null)} style={{ background: C.cardLight, border: "none", color: C.muted, borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 14 }}>
                  ✕
                </button>
              </div>

              {viewReportOrder.reportUrl?.startsWith("data:image") ? (
                <div style={{ textAlign: "center", marginBottom: 16 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={viewReportOrder.reportUrl} alt="Report" style={{ maxWidth: "100%", borderRadius: 12, border: `1px solid ${C.border}` }} />
                </div>
              ) : (
                <div style={{ background: "#0b1329", borderRadius: 12, padding: 16, marginBottom: 16, fontFamily: "monospace", fontSize: 12, color: "#93c5fd", whiteSpace: "pre-wrap", lineHeight: 1.6, border: `1px solid ${C.border}` }}>
                  {decodeURIComponent(viewReportOrder.reportUrl?.replace("data:text/plain;charset=utf-8,", "") || "Report text not available.")}
                </div>
              )}

              {viewReportOrder.doctorReviewNotes && (
                <div style={{ background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 10, padding: 12, color: "#6EE7B7", fontSize: 13, marginBottom: 16 }}>
                  <strong>Doctor Review:</strong> {viewReportOrder.doctorReviewNotes}
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button onClick={() => setViewReportOrder(null)} style={{ background: C.primary, color: "white", border: "none", padding: "8px 18px", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
