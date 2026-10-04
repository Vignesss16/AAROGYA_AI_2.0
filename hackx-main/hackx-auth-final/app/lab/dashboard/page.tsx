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
  primary: "#0F766E", // Deep Teal
  primaryLight: "#14B8A6", // Bright Teal
  accent: "#0284C7", // Ocean Blue
  bg: "#F4F7F6", // Clean Medical Surface
  card: "#FFFFFF",
  cardSubtle: "#F8FAFC",
  text: "#1E293B",
  muted: "#64748B",
  border: "#E2E8F0",
  green: "#10B981",
  greenBg: "#ECFDF5",
  yellow: "#F59E0B",
  yellowBg: "#FFFBEB",
  red: "#EF4444",
  redBg: "#FEF2F2",
  blue: "#3B82F6",
  blueBg: "#EFF6FF",
  purple: "#8B5CF6",
  purpleBg: "#F5F3FF",
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  SENT_TO_LAB: { label: "New Request", color: "#0284C7", bg: "#E0F2FE" },
  LAB_ACCEPTED: { label: "Accepted", color: "#0D9488", bg: "#CCFBF1" },
  LAB_REJECTED: { label: "Rejected", color: "#EF4444", bg: "#FEE2E2" },
  APPOINTMENT_CONFIRMED: { label: "Slot Scheduled", color: "#7C3AED", bg: "#EDE9FE" },
  SAMPLE_COLLECTED: { label: "Sample Collected", color: "#D97706", bg: "#FEF3C7" },
  PROCESSING: { label: "Analyzer In-Progress", color: "#DB2777", bg: "#FCE7F3" },
  REPORT_UPLOADED: { label: "Report Uploaded", color: "#059669", bg: "#D1FAE5" },
  DOCTOR_REVIEWED: { label: "Clinically Reviewed", color: "#2563EB", bg: "#DBEAFE" },
  CANCELLED: { label: "Cancelled", color: "#64748B", bg: "#F1F5F9" },
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
    if (!slotModalOrder || !slotTime) return;
    await updateOrderStatus(slotModalOrder.orderId, {
      status: "APPOINTMENT_CONFIRMED",
      appointmentSlot: slotTime,
    });
    setSlotModalOrder(null);
    setSlotTime("");
  };

  const handleSampleCollected = async (order: LabOrder) => {
    await updateOrderStatus(order.orderId, {
      status: "SAMPLE_COLLECTED",
      sampleCollectedAt: new Date().toISOString(),
    });
  };

  const handleStartProcessing = async (order: LabOrder) => {
    await updateOrderStatus(order.orderId, { status: "PROCESSING" });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setReportFileName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      setReportFileBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadSubmit = async () => {
    if (!uploadModalOrder) return;
    const finalReportUrl =
      reportFileBase64 ||
      `data:text/plain;charset=utf-8,${encodeURIComponent(
        `DIAGNOSTIC TEST REPORT - AAROGYA.AI\n====================================\nLab: ${uploadModalOrder.labName}\nOrder: ${uploadModalOrder.orderId}\nPatient: ${uploadModalOrder.patientName}\nTests: ${uploadModalOrder.tests.join(", ")}\nResult Notes: ${reportNotes || "All requested parameters evaluated and verified."}\nDate: ${new Date().toLocaleString()}`
      )}`;

    await updateOrderStatus(uploadModalOrder.orderId, {
      status: "REPORT_UPLOADED",
      reportUrl: finalReportUrl,
      reportFileName: reportFileName || `${uploadModalOrder.orderId}_report.pdf`,
      doctorReviewNotes: reportNotes,
    });

    setUploadModalOrder(null);
    setReportFileBase64("");
    setReportFileName("");
    setReportNotes("");
  };

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("diagnostic_lab_user");
      router.push("/lab/login");
    }
  };

  const newRequests = orders.filter((o) => o.status === "SENT_TO_LAB");
  const activeOrders = orders.filter((o) =>
    ["LAB_ACCEPTED", "APPOINTMENT_CONFIRMED", "SAMPLE_COLLECTED", "PROCESSING"].includes(o.status)
  );
  const completedOrders = orders.filter((o) =>
    ["REPORT_UPLOADED", "DOCTOR_REVIEWED"].includes(o.status)
  );

  if (!labUser) return null;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: C.bg,
        color: C.text,
        fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* Top Professional Navigation Bar */}
      <header
        style={{
          background: C.card,
          borderBottom: `1px solid ${C.border}`,
          padding: "16px 24px",
          position: "sticky",
          top: 0,
          zIndex: 40,
          boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
        }}
      >
        <div
          style={{
            maxWidth: 1400,
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: "linear-gradient(135deg, #0F766E, #0284C7)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                boxShadow: "0 4px 12px rgba(15,118,110,0.25)",
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 18h8" />
                <path d="M3 22h18" />
                <path d="M14 22a7 7 0 1 0-4 0" />
                <path d="M9 14h2" />
                <path d="M9 12a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2Z" />
                <path d="M12 6V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3" />
              </svg>
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <h1 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: C.text }}>
                  {labUser.name}
                </h1>
                <span
                  style={{
                    background: C.greenBg,
                    color: C.green,
                    border: `1px solid ${C.green}40`,
                    padding: "2px 8px",
                    borderRadius: 20,
                    fontSize: 11,
                    fontWeight: 700,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Verified Facility
                </span>
              </div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 2, display: "flex", gap: 12, alignItems: "center" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  {labUser.city || "Thane"}, {labUser.district || "Maharashtra"}
                </span>
                <span>•</span>
                <span style={{ fontFamily: "monospace", fontWeight: 600 }}>ID: {labUser.labId}</span>
                <span>•</span>
                <span>📞 {labUser.phone}</span>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              onClick={fetchOrders}
              style={{
                background: C.cardSubtle,
                border: `1px solid ${C.border}`,
                borderRadius: 10,
                padding: "8px 14px",
                color: C.text,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                transition: "all 0.15s",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
                <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                <path d="M16 21h5v-5" />
              </svg>
              Refresh
            </button>
            <button
              onClick={handleLogout}
              style={{
                background: "#FEF2F2",
                border: `1px solid #FECACA`,
                borderRadius: 10,
                padding: "8px 16px",
                color: "#DC2626",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                transition: "all 0.15s",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: 1400, margin: "0 auto", padding: "28px 24px" }}>
        {/* Metric Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 16,
            marginBottom: 28,
          }}
        >
          {/* Card 1: New Requests */}
          <div
            onClick={() => setActiveTab("requests")}
            style={{
              background: C.card,
              border: `1px solid ${activeTab === "requests" ? C.primary : C.border}`,
              borderRadius: 16,
              padding: "20px",
              cursor: "pointer",
              boxShadow: "0 4px 16px -2px rgba(0,0,0,0.04)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  New Requests
                </div>
                <div style={{ fontSize: 32, fontWeight: 800, color: C.primary, marginTop: 4 }}>
                  {newRequests.length}
                </div>
              </div>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: "#E0F2FE",
                  color: "#0284C7",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="12" y1="18" x2="12" y2="12" />
                  <line x1="9" y1="15" x2="15" y2="15" />
                </svg>
              </div>
            </div>
            {newRequests.length > 0 && (
              <div style={{ marginTop: 12, fontSize: 12, fontWeight: 600, color: "#0284C7", display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#0284C7", display: "inline-block" }} />
                Pending Doctor Requests Waiting Acceptance
              </div>
            )}
          </div>

          {/* Card 2: In-Progress */}
          <div
            onClick={() => setActiveTab("active")}
            style={{
              background: C.card,
              border: `1px solid ${activeTab === "active" ? C.primary : C.border}`,
              borderRadius: 16,
              padding: "20px",
              cursor: "pointer",
              boxShadow: "0 4px 16px -2px rgba(0,0,0,0.04)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Active Testing Queue
                </div>
                <div style={{ fontSize: 32, fontWeight: 800, color: "#D97706", marginTop: 4 }}>
                  {activeOrders.length}
                </div>
              </div>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: "#FEF3C7",
                  color: "#D97706",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
            </div>
            <div style={{ marginTop: 12, fontSize: 12, color: C.muted }}>
              Samples & Analyzer Batches In Processing
            </div>
          </div>

          {/* Card 3: Completed Reports */}
          <div
            onClick={() => setActiveTab("completed")}
            style={{
              background: C.card,
              border: `1px solid ${activeTab === "completed" ? C.primary : C.border}`,
              borderRadius: 16,
              padding: "20px",
              cursor: "pointer",
              boxShadow: "0 4px 16px -2px rgba(0,0,0,0.04)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Reports Uploaded
                </div>
                <div style={{ fontSize: 32, fontWeight: 800, color: C.green, marginTop: 4 }}>
                  {completedOrders.length}
                </div>
              </div>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: "#D1FAE5",
                  color: "#059669",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
            </div>
            <div style={{ marginTop: 12, fontSize: 12, color: C.muted }}>
              Ready For Review / Clinically Completed
            </div>
          </div>

          {/* Card 4: Total Orders */}
          <div
            style={{
              background: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: 16,
              padding: "20px",
              boxShadow: "0 4px 16px -2px rgba(0,0,0,0.04)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Total Orders
                </div>
                <div style={{ fontSize: 32, fontWeight: 800, color: C.text, marginTop: 4 }}>
                  {orders.length}
                </div>
              </div>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: "#F1F5F9",
                  color: "#475569",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="20" x2="18" y2="10" />
                  <line x1="12" y1="20" x2="12" y2="4" />
                  <line x1="6" y1="20" x2="6" y2="14" />
                </svg>
              </div>
            </div>
            <div style={{ marginTop: 12, fontSize: 12, color: C.muted }}>
              Cumulative Lifetime Consultations
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div
          style={{
            display: "flex",
            gap: 10,
            borderBottom: `1px solid ${C.border}`,
            paddingBottom: 16,
            marginBottom: 24,
            overflowX: "auto",
          }}
        >
          <button
            onClick={() => setActiveTab("requests")}
            style={{
              background: activeTab === "requests" ? C.primary : C.card,
              color: activeTab === "requests" ? "white" : C.text,
              border: `1px solid ${activeTab === "requests" ? C.primary : C.border}`,
              padding: "10px 20px",
              borderRadius: 12,
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
              boxShadow: activeTab === "requests" ? "0 4px 12px rgba(15,118,110,0.2)" : "none",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            Incoming Requests ({newRequests.length})
          </button>

          <button
            onClick={() => setActiveTab("active")}
            style={{
              background: activeTab === "active" ? C.primary : C.card,
              color: activeTab === "active" ? "white" : C.text,
              border: `1px solid ${activeTab === "active" ? C.primary : C.border}`,
              padding: "10px 20px",
              borderRadius: 12,
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
              boxShadow: activeTab === "active" ? "0 4px 12px rgba(15,118,110,0.2)" : "none",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            Active Tests ({activeOrders.length})
          </button>

          <button
            onClick={() => setActiveTab("completed")}
            style={{
              background: activeTab === "completed" ? C.primary : C.card,
              color: activeTab === "completed" ? "white" : C.text,
              border: `1px solid ${activeTab === "completed" ? C.primary : C.border}`,
              padding: "10px 20px",
              borderRadius: 12,
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
              boxShadow: activeTab === "completed" ? "0 4px 12px rgba(15,118,110,0.2)" : "none",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            Completed Reports ({completedOrders.length})
          </button>

          <button
            onClick={() => setActiveTab("services")}
            style={{
              background: activeTab === "services" ? C.primary : C.card,
              color: activeTab === "services" ? "white" : C.text,
              border: `1px solid ${activeTab === "services" ? C.primary : C.border}`,
              padding: "10px 20px",
              borderRadius: 12,
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
              boxShadow: activeTab === "services" ? "0 4px 12px rgba(15,118,110,0.2)" : "none",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
              <path d="M6 6h10" />
              <path d="M6 10h10" />
            </svg>
            Lab Test Catalog
          </button>
        </div>

        {/* Tab 1: Incoming Requests */}
        {activeTab === "requests" && (
          <div>
            {newRequests.length === 0 ? (
              <div
                style={{
                  background: C.card,
                  borderRadius: 16,
                  padding: "48px 24px",
                  textAlign: "center",
                  border: `1px solid ${C.border}`,
                  boxShadow: "0 4px 20px -2px rgba(0,0,0,0.03)",
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 16,
                    background: "#F1F5F9",
                    color: "#94A3B8",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 16px",
                  }}
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: C.text }}>
                  No Incoming Test Requests
                </h3>
                <p style={{ fontSize: 13, color: C.muted, marginTop: 6, maxWidth: 400, margin: "6px auto 0" }}>
                  All doctor prescription requests have been reviewed and accepted. New incoming test orders will appear here in real time.
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {newRequests.map((order) => (
                  <div
                    key={order._id}
                    style={{
                      background: C.card,
                      borderRadius: 16,
                      border: `1px solid ${C.border}`,
                      borderLeft: `4px solid ${order.priority === "URGENT" ? C.red : C.accent}`,
                      padding: "20px",
                      boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ fontWeight: 800, fontSize: 16, color: C.text }}>
                            {order.patientName}
                          </span>
                          <span
                            style={{
                              background: order.priority === "URGENT" ? C.redBg : "#EFF6FF",
                              color: order.priority === "URGENT" ? C.red : "#2563EB",
                              padding: "3px 10px",
                              borderRadius: 20,
                              fontSize: 11,
                              fontWeight: 800,
                              textTransform: "uppercase",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            {order.priority === "URGENT" && (
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                              </svg>
                            )}
                            {order.priority} Priority
                          </span>
                        </div>
                        <div style={{ fontSize: 12, color: C.muted, marginTop: 4, display: "flex", gap: 12, flexWrap: "wrap" }}>
                          <span>📞 {order.patientPhone}</span>
                          <span>•</span>
                          <span>Prescribed By: <strong>{order.doctorName || "Dr. Medical Officer"}</strong></span>
                          <span>•</span>
                          <span style={{ fontFamily: "monospace" }}>Order ID: {order.orderId}</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div style={{ display: "flex", gap: 10 }}>
                        <button
                          onClick={() => setRejectModalOrder(order)}
                          disabled={updatingId === order.orderId}
                          style={{
                            background: "#FEF2F2",
                            color: "#DC2626",
                            border: "1px solid #FECACA",
                            borderRadius: 10,
                            padding: "9px 16px",
                            fontSize: 13,
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          Reject Request
                        </button>
                        <button
                          onClick={() => setSlotModalOrder(order)}
                          disabled={updatingId === order.orderId}
                          style={{
                            background: "linear-gradient(135deg, #0F766E, #14B8A6)",
                            color: "white",
                            border: "none",
                            borderRadius: 10,
                            padding: "9px 20px",
                            fontSize: 13,
                            fontWeight: 700,
                            cursor: "pointer",
                            boxShadow: "0 3px 10px rgba(15,118,110,0.2)",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          Accept & Schedule Slot
                        </button>
                      </div>
                    </div>

                    {/* Prescribed Tests Pill List */}
                    <div style={{ marginTop: 14, display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {order.tests.map((test, i) => (
                        <span
                          key={i}
                          style={{
                            background: "#F8FAFC",
                            border: `1px solid ${C.border}`,
                            color: C.text,
                            padding: "6px 12px",
                            borderRadius: 8,
                            fontSize: 12,
                            fontWeight: 600,
                          }}
                        >
                          {test}
                        </span>
                      ))}
                    </div>

                    {order.doctorInstructions && (
                      <div
                        style={{
                          marginTop: 12,
                          background: "#FFFBEB",
                          border: "1px solid #FDE68A",
                          borderRadius: 8,
                          padding: "10px 12px",
                          fontSize: 12,
                          color: "#92400E",
                        }}
                      >
                        <strong>Doctor Clinical Instructions:</strong> {order.doctorInstructions}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Active Testing Queue */}
        {activeTab === "active" && (
          <div>
            {activeOrders.length === 0 ? (
              <div
                style={{
                  background: C.card,
                  borderRadius: 16,
                  padding: "48px 24px",
                  textAlign: "center",
                  border: `1px solid ${C.border}`,
                }}
              >
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: C.text }}>
                  No Active Tests In Progress
                </h3>
                <p style={{ fontSize: 13, color: C.muted, marginTop: 6 }}>
                  Accepted patient tests awaiting sample collection and analyzer runs will show here.
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {activeOrders.map((order) => {
                  const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.LAB_ACCEPTED;
                  return (
                    <div
                      key={order._id}
                      style={{
                        background: C.card,
                        borderRadius: 16,
                        border: `1px solid ${C.border}`,
                        padding: "20px",
                        boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <span style={{ fontWeight: 800, fontSize: 16, color: C.text }}>
                              {order.patientName}
                            </span>
                            <span
                              style={{
                                background: cfg.bg,
                                color: cfg.color,
                                padding: "3px 10px",
                                borderRadius: 20,
                                fontSize: 11,
                                fontWeight: 800,
                              }}
                            >
                              {cfg.label}
                            </span>
                          </div>
                          <div style={{ fontSize: 12, color: C.muted, marginTop: 4, display: "flex", gap: 12, flexWrap: "wrap" }}>
                            <span>📞 {order.patientPhone}</span>
                            <span>•</span>
                            <span>Doctor: {order.doctorName || "Dr. Medical Officer"}</span>
                            <span>•</span>
                            <span>Scheduled Slot: <strong>{order.appointmentSlot || "Walk-in Slot"}</strong></span>
                          </div>
                        </div>

                        {/* Lifecycle Action Buttons */}
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          {["LAB_ACCEPTED", "APPOINTMENT_CONFIRMED"].includes(order.status) && (
                            <button
                              onClick={() => handleSampleCollected(order)}
                              disabled={updatingId === order.orderId}
                              style={{
                                background: "#FFFBEB",
                                color: "#D97706",
                                border: "1px solid #FCD34D",
                                borderRadius: 10,
                                padding: "8px 14px",
                                fontSize: 12,
                                fontWeight: 700,
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                              }}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                              Mark Sample Collected
                            </button>
                          )}

                          {order.status === "SAMPLE_COLLECTED" && (
                            <button
                              onClick={() => handleStartProcessing(order)}
                              disabled={updatingId === order.orderId}
                              style={{
                                background: "#FCE7F3",
                                color: "#BE185D",
                                border: "1px solid #FBCFE8",
                                borderRadius: 10,
                                padding: "8px 14px",
                                fontSize: 12,
                                fontWeight: 700,
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                              }}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                              </svg>
                              Start Analyzer Processing
                            </button>
                          )}

                          {["SAMPLE_COLLECTED", "PROCESSING"].includes(order.status) && (
                            <button
                              onClick={() => setUploadModalOrder(order)}
                              style={{
                                background: "linear-gradient(135deg, #0F766E, #14B8A6)",
                                color: "white",
                                border: "none",
                                borderRadius: 10,
                                padding: "8px 18px",
                                fontSize: 12,
                                fontWeight: 700,
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                                boxShadow: "0 3px 10px rgba(15,118,110,0.2)",
                              }}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="17 8 12 3 7 8" />
                                <line x1="12" y1="3" x2="12" y2="15" />
                              </svg>
                              Upload Lab Report (PDF / Image)
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Tests badges */}
                      <div style={{ marginTop: 14, display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {order.tests.map((test, i) => (
                          <span
                            key={i}
                            style={{
                              background: "#F8FAFC",
                              border: `1px solid ${C.border}`,
                              color: C.text,
                              padding: "5px 12px",
                              borderRadius: 8,
                              fontSize: 12,
                              fontWeight: 600,
                            }}
                          >
                            {test}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Completed Reports */}
        {activeTab === "completed" && (
          <div>
            {completedOrders.length === 0 ? (
              <div
                style={{
                  background: C.card,
                  borderRadius: 16,
                  padding: "48px 24px",
                  textAlign: "center",
                  border: `1px solid ${C.border}`,
                }}
              >
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: C.text }}>
                  No Reports Uploaded Yet
                </h3>
                <p style={{ fontSize: 13, color: C.muted, marginTop: 6 }}>
                  Once tests are completed and reports uploaded, their clinical record trail will appear here.
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {completedOrders.map((order) => {
                  const isReviewed = order.status === "DOCTOR_REVIEWED";
                  return (
                    <div
                      key={order._id}
                      style={{
                        background: C.card,
                        borderRadius: 16,
                        border: `1px solid ${C.border}`,
                        borderLeft: `4px solid ${isReviewed ? "#2563EB" : C.green}`,
                        padding: "20px",
                        boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <span style={{ fontWeight: 800, fontSize: 16, color: C.text }}>
                              {order.patientName}
                            </span>
                            <span
                              style={{
                                background: isReviewed ? "#DBEAFE" : "#D1FAE5",
                                color: isReviewed ? "#1E40AF" : "#065F46",
                                padding: "3px 10px",
                                borderRadius: 20,
                                fontSize: 11,
                                fontWeight: 800,
                              }}
                            >
                              {isReviewed ? "Doctor Reviewed" : "Report Uploaded"}
                            </span>
                          </div>
                          <div style={{ fontSize: 12, color: C.muted, marginTop: 4, display: "flex", gap: 12, flexWrap: "wrap" }}>
                            <span>📞 {order.patientPhone}</span>
                            <span>•</span>
                            <span>Doctor: {order.doctorName || "Dr. Medical Officer"}</span>
                            <span>•</span>
                            <span style={{ fontFamily: "monospace" }}>Order ID: {order.orderId}</span>
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            onClick={() => setViewReportOrder(order)}
                            style={{
                              background: "#EFF6FF",
                              color: "#2563EB",
                              border: "1px solid #BFDBFE",
                              borderRadius: 10,
                              padding: "8px 16px",
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                            }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                            View Uploaded Report
                          </button>
                        </div>
                      </div>

                      <div style={{ marginTop: 14, display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {order.tests.map((test, i) => (
                          <span
                            key={i}
                            style={{
                              background: "#F8FAFC",
                              border: `1px solid ${C.border}`,
                              color: C.text,
                              padding: "5px 12px",
                              borderRadius: 8,
                              fontSize: 12,
                              fontWeight: 600,
                            }}
                          >
                            {test}
                          </span>
                        ))}
                      </div>

                      {order.doctorReviewNotes && (
                        <div
                          style={{
                            marginTop: 12,
                            background: "#EFF6FF",
                            border: "1px solid #BFDBFE",
                            borderRadius: 10,
                            padding: "10px 14px",
                            fontSize: 12,
                            color: "#1E40AF",
                          }}
                        >
                          <strong>Doctor Clinical Assessment:</strong> {order.doctorReviewNotes}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Lab Test Catalog */}
        {activeTab === "services" && (
          <div
            style={{
              background: C.card,
              borderRadius: 16,
              border: `1px solid ${C.border}`,
              padding: "24px",
              boxShadow: "0 4px 20px -2px rgba(0,0,0,0.03)",
            }}
          >
            <h3 style={{ fontSize: 16, fontWeight: 800, margin: "0 0 8px", color: C.text }}>
              Laboratory Test & Diagnostics Catalog
            </h3>
            <p style={{ fontSize: 13, color: C.muted, margin: "0 0 20px" }}>
              Active pathology investigations configured for <strong>{labUser.name}</strong>. Doctors on Aarogya.AI can prescribe these tests directly.
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                gap: 12,
              }}
            >
              {(labUser.services || [
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
              ]).map((s: string, idx: number) => (
                <div
                  key={idx}
                  style={{
                    background: "#F8FAFC",
                    border: `1px solid ${C.border}`,
                    borderRadius: 12,
                    padding: "14px 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: "#E0F2FE",
                      color: "#0284C7",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: C.text }}>{s}</div>
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>Status: Active & Available</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Modal 1: Reject Request */}
      {rejectModalOrder && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(4px)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            style={{
              background: C.card,
              width: "100%",
              maxWidth: 420,
              borderRadius: 20,
              padding: 24,
              boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
              border: `1px solid ${C.border}`,
            }}
          >
            <h3 style={{ margin: "0 0 12px", fontSize: 17, fontWeight: 800, color: C.text }}>
              Reject Diagnostic Test Request
            </h3>
            <p style={{ fontSize: 13, color: C.muted, marginBottom: 16 }}>
              Specify the reason why your laboratory cannot fulfill this order for <strong>{rejectModalOrder.patientName}</strong>:
            </p>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Reagent out of stock / Machine maintenance in progress..."
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: 12,
                border: `1px solid ${C.border}`,
                background: "#F8FAFC",
                fontSize: 13,
                outline: "none",
                boxSizing: "border-box",
                marginBottom: 20,
              }}
            />
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setRejectModalOrder(null)}
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 10,
                  border: `1px solid ${C.border}`,
                  background: "#F8FAFC",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleRejectSubmit}
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 10,
                  border: "none",
                  background: "#EF4444",
                  color: "white",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Schedule Slot */}
      {slotModalOrder && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(4px)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            style={{
              background: C.card,
              width: "100%",
              maxWidth: 420,
              borderRadius: 20,
              padding: 24,
              boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
              border: `1px solid ${C.border}`,
            }}
          >
            <h3 style={{ margin: "0 0 12px", fontSize: 17, fontWeight: 800, color: C.text }}>
              Schedule Appointment / Sample Slot
            </h3>
            <p style={{ fontSize: 13, color: C.muted, marginBottom: 16 }}>
              Assign an appointment slot for <strong>{slotModalOrder.patientName}</strong>:
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
              {["08:30 AM - 09:30 AM (Fasting)", "10:30 AM - 11:30 AM", "02:00 PM - 03:00 PM", "04:30 PM - 05:30 PM"].map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setSlotTime(slot)}
                  style={{
                    padding: "12px 14px",
                    borderRadius: 10,
                    border: `1.5px solid ${slotTime === slot ? C.primary : C.border}`,
                    background: slotTime === slot ? "#EFF6FF" : "#F8FAFC",
                    color: slotTime === slot ? C.primary : C.text,
                    fontWeight: 700,
                    fontSize: 13,
                    textAlign: "left",
                    cursor: "pointer",
                  }}
                >
                  {slot}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setSlotModalOrder(null)}
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 10,
                  border: `1px solid ${C.border}`,
                  background: "#F8FAFC",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSlotSubmit}
                disabled={!slotTime}
                style={{
                  flex: 1.5,
                  padding: 12,
                  borderRadius: 10,
                  border: "none",
                  background: "linear-gradient(135deg, #0F766E, #14B8A6)",
                  color: "white",
                  fontWeight: 700,
                  cursor: slotTime ? "pointer" : "not-allowed",
                  opacity: slotTime ? 1 : 0.6,
                }}
              >
                Confirm & Accept
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Upload Lab Report */}
      {uploadModalOrder && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(4px)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            style={{
              background: C.card,
              width: "100%",
              maxWidth: 480,
              borderRadius: 20,
              padding: 24,
              boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
              border: `1px solid ${C.border}`,
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: C.text }}>
                  Upload Diagnostic Test Report
                </h3>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
                  Patient: {uploadModalOrder.patientName} · Order: {uploadModalOrder.orderId}
                </div>
              </div>
              <button
                onClick={() => setUploadModalOrder(null)}
                style={{ background: "#F1F5F9", border: "none", borderRadius: 8, width: 30, height: 30, cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            {/* Drag & Drop File Upload Box */}
            <div
              style={{
                border: "2px dashed #CBD5E1",
                borderRadius: 14,
                padding: "24px 16px",
                textAlign: "center",
                background: "#F8FAFC",
                marginBottom: 16,
                cursor: "pointer",
              }}
              onClick={() => document.getElementById("report-file-input")?.click()}
            >
              <input
                id="report-file-input"
                type="file"
                accept="application/pdf,image/*"
                onChange={handleFileUpload}
                style={{ display: "none" }}
              />
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: "#E0F2FE",
                  color: "#0284C7",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 10px",
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>
                {reportFileName ? reportFileName : "Click to select or drop report file"}
              </div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>
                Supports PDF, JPG, PNG scanned reports (Up to 10MB)
              </div>
            </div>

            {/* Optional Technician Review Notes */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: C.muted, marginBottom: 6 }}>
                Technician Observations & Key Parameter Values
              </label>
              <textarea
                rows={3}
                value={reportNotes}
                onChange={(e) => setReportNotes(e.target.value)}
                placeholder="e.g. Hb: 13.5 g/dL, WBC: 7,200 /mcL, Fasting Blood Glucose: 98 mg/dL (Within Normal Limits)"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: `1px solid ${C.border}`,
                  background: "#F8FAFC",
                  fontSize: 13,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setUploadModalOrder(null)}
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 10,
                  border: `1px solid ${C.border}`,
                  background: "#F8FAFC",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleUploadSubmit}
                style={{
                  flex: 1.5,
                  padding: 12,
                  borderRadius: 10,
                  border: "none",
                  background: "linear-gradient(135deg, #0F766E, #14B8A6)",
                  color: "white",
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 3px 10px rgba(15,118,110,0.2)",
                }}
              >
                Submit Report & Notify Doctor →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 4: View Uploaded Report */}
      {viewReportOrder && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(6px)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            style={{
              background: C.card,
              width: "100%",
              maxWidth: 480,
              borderRadius: 20,
              padding: 24,
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
              border: `1px solid ${C.border}`,
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: C.text }}>
                  Diagnostic Report
                </h3>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
                  {viewReportOrder.patientName} · {viewReportOrder.orderId}
                </div>
              </div>
              <button
                onClick={() => setViewReportOrder(null)}
                style={{ background: "#F1F5F9", border: "none", borderRadius: 8, width: 28, height: 28, cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            {viewReportOrder.reportUrl?.startsWith("data:image") ? (
              <div style={{ textAlign: "center", marginBottom: 16 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={viewReportOrder.reportUrl}
                  alt="Diagnostic Report"
                  style={{ width: "100%", maxHeight: 350, objectFit: "contain", borderRadius: 12, border: `1px solid ${C.border}` }}
                />
              </div>
            ) : (
              <div
                style={{
                  background: "#F8FAFC",
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 16,
                  fontFamily: "monospace",
                  fontSize: 12,
                  color: "#334155",
                  whiteSpace: "pre-wrap",
                  lineHeight: 1.6,
                  border: `1px solid ${C.border}`,
                }}
              >
                {decodeURIComponent(viewReportOrder.reportUrl?.replace("data:text/plain;charset=utf-8,", "") || "Report text data")}
              </div>
            )}

            {viewReportOrder.doctorReviewNotes && (
              <div
                style={{
                  background: "#EFF6FF",
                  border: "1px solid #BFDBFE",
                  borderRadius: 10,
                  padding: 12,
                  color: "#1E40AF",
                  fontSize: 12,
                  marginBottom: 16,
                }}
              >
                <strong>Doctor Clinical Assessment:</strong> {viewReportOrder.doctorReviewNotes}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={() => setViewReportOrder(null)}
                style={{
                  background: C.primary,
                  color: "white",
                  border: "none",
                  padding: "10px 20px",
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
