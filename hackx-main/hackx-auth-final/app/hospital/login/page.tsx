"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const DEMO_HOSPITALS = [
  {
    id: "HOSP-SION-001",
    name: "Lokmanya Tilak Municipal General Hospital (SION)",
    type: "Tertiary Care & Trauma Center",
    location: "Sion West, Mumbai, Maharashtra 400022",
    contact: "+91 22 2407 6381",
    role: "OPD Reception & Command Center",
    badge: "Level 1 Trauma & Cardiac",
    beds: "1,400 Beds",
  },
  {
    id: "HOSP-KLY-002",
    name: "Kalyan Sub-District Civil Hospital",
    type: "Sub-District Hospital (SDH)",
    location: "Kalyan West, Thane Rural, Maharashtra 421301",
    contact: "+91 251 220 5411",
    role: "Central OPD Desk",
    badge: "24/7 Emergency Active",
    beds: "300 Beds",
  },
  {
    id: "HOSP-PLG-003",
    name: "Palghar Rural Civil Hospital",
    type: "Community Health Center (CHC)",
    location: "Manor Road, Palghar Tribal Belt, Maharashtra 401404",
    contact: "+91 2525 252033",
    role: "Tribal & Rural Desk",
    badge: "Tribal Health Hub",
    beds: "150 Beds",
  },
  {
    id: "HOSP-KLW-004",
    name: "Chhatrapati Shivaji Maharaj Hospital (CSMH)",
    type: "Municipal General Hospital",
    location: "Kalwa, Thane, Maharashtra 400605",
    contact: "+91 22 2537 2001",
    role: "Casualty & OPD Desk",
    badge: "Govt Multi-Specialty",
    beds: "500 Beds",
  },
  {
    id: "HOSP-MRB-005",
    name: "Murbad Rural Primary Health Complex",
    type: "Rural Health Center",
    location: "Murbad Tehsil, Thane Rural, Maharashtra 421401",
    contact: "+91 2524 222120",
    role: "Rural OPD & ASHA Hub",
    badge: "ASHA Primary Network",
    beds: "60 Beds",
  },
  {
    id: "HOSP-NBH-006",
    name: "Civil Hospital, Nabha",
    type: "Civil District Hospital",
    location: "Circular Road, Nabha, Punjab 147201",
    contact: "+91 1765 220102",
    role: "OPD & Triage Desk",
    badge: "Punjab Health System",
    beds: "120 Beds",
  },
];

export default function HospitalLoginPage() {
  const router = useRouter();
  const [selectedHospital, setSelectedHospital] = useState(DEMO_HOSPITALS[0]);
  const [staffRole, setStaffRole] = useState<"receptionist" | "director" | "casualty">("receptionist");
  const [passcode, setPasscode] = useState("aarogya123");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("hospital_command_user");
      if (stored) {
        router.replace("/hospital");
      }
    }
  }, [router]);

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (passcode.trim() !== "aarogya123" && passcode.trim() !== "admin123" && passcode.trim() !== "sion123") {
      setError("Invalid Hospital Authorization Key. Try master passcode: aarogya123");
      return;
    }

    setLoading(true);
    setError("");

    const hospitalSession = {
      facilityId: selectedHospital.id,
      facilityName: selectedHospital.name,
      facilityType: selectedHospital.type,
      location: selectedHospital.location,
      contact: selectedHospital.contact,
      staffRole,
      loginTime: new Date().toISOString(),
      authenticated: true,
    };

    if (typeof window !== "undefined") {
      localStorage.setItem("hospital_command_user", JSON.stringify(hospitalSession));
      localStorage.setItem("hospital_authorized", "true");
      localStorage.setItem("hospital_authorized_facility", selectedHospital.id);
      localStorage.setItem("last_logged_role", "hospital");
    }

    setTimeout(() => {
      router.push("/hospital");
    }, 400);
  };

  return (
    <div
      style={{
        background: "radial-gradient(circle at 15% 15%, #064E3B 0%, #0F172A 70%, #022C22 100%)",
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "24px 16px",
        fontFamily: "'Inter', -apple-system, sans-serif",
        color: "#F8FAFC",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Glow shapes */}
      <div
        style={{
          position: "absolute",
          width: 550,
          height: 550,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%)",
          top: -120,
          right: -80,
          filter: "blur(60px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 480,
          height: 480,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(14, 165, 233, 0.15) 0%, transparent 70%)",
          bottom: -100,
          left: -80,
          filter: "blur(60px)",
        }}
      />

      <div
        style={{
          width: "100%",
          maxWidth: 960,
          background: "rgba(15, 23, 42, 0.8)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: 28,
          padding: "36px 32px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.6)",
          zIndex: 10,
          display: "grid",
          gridTemplateColumns: "1.1fr 1fr",
          gap: 32,
        }}
      >
        {/* Left Side: Hospital Network Selector */}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <div
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 14,
                  background: "linear-gradient(135deg, #10B981, #059669)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 22,
                  boxShadow: "0 4px 14px rgba(16, 185, 129, 0.4)",
                }}
              >
                🏥
              </div>
              <div>
                <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, letterSpacing: "-0.5px" }}>AarogyaAI Facility Portal</h1>
                <p style={{ margin: 0, fontSize: 13, color: "#94A3B8" }}>Maharashtra Rural & Urban Healthcare Command Grid</p>
              </div>
            </div>

            <p style={{ fontSize: 13, color: "#CBD5E1", lineHeight: 1.5, marginBottom: 20 }}>
              Select your hospital or health center to access the localized **Receptionist Slot Desk, Doctor Rosters, In-Person Physical Follow-ups, and Referral Command Center**.
            </p>

            <div style={{ fontSize: 12, fontWeight: 700, color: "#10B981", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 10 }}>
              Select Active Health Facility ({DEMO_HOSPITALS.length})
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 320, overflowY: "auto", paddingRight: 4 }}>
              {DEMO_HOSPITALS.map((h) => {
                const isSelected = selectedHospital.id === h.id;
                return (
                  <div
                    key={h.id}
                    onClick={() => {
                      setSelectedHospital(h);
                      setError("");
                    }}
                    style={{
                      padding: "12px 14px",
                      borderRadius: 14,
                      background: isSelected ? "rgba(16, 185, 129, 0.15)" : "rgba(30, 41, 59, 0.5)",
                      border: isSelected ? "1.5px solid #10B981" : "1px solid rgba(255, 255, 255, 0.08)",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: isSelected ? "#34D399" : "#F8FAFC" }}>{h.name}</div>
                      <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>{h.location}</div>
                      <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                        <span style={{ fontSize: 10, background: "rgba(255,255,255,0.08)", padding: "2px 6px", borderRadius: 4, color: "#CBD5E1" }}>
                          {h.type}
                        </span>
                        <span style={{ fontSize: 10, background: "rgba(16, 185, 129, 0.2)", padding: "2px 6px", borderRadius: 4, color: "#6EE7B7" }}>
                          {h.badge}
                        </span>
                      </div>
                    </div>
                    {isSelected && <span style={{ color: "#10B981", fontSize: 18, fontWeight: 800 }}>✓</span>}
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid rgba(255, 255, 255, 0.08)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Link href="/login" style={{ color: "#94A3B8", fontSize: 12, textDecoration: "none" }}>
              ← Return to Main Login
            </Link>
            <span style={{ fontSize: 11, color: "#64748B" }}>ISO 27001 & ABDM Connected</span>
          </div>
        </div>

        {/* Right Side: Credentials & Staff Sign In Form */}
        <div
          style={{
            background: "rgba(30, 41, 59, 0.6)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: 20,
            padding: 24,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: "#94A3B8", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.5px" }}>Selected Facility</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#F8FAFC", marginTop: 2 }}>{selectedHospital.name}</div>
              <div style={{ fontSize: 12, color: "#10B981", fontWeight: 600 }}>ID: {selectedHospital.id} • {selectedHospital.beds}</div>
            </div>

            {error && (
              <div
                style={{
                  background: "rgba(239, 68, 68, 0.2)",
                  color: "#FCA5A5",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  padding: "10px 14px",
                  borderRadius: 10,
                  fontSize: 12,
                  fontWeight: 600,
                  marginBottom: 16,
                }}
              >
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#CBD5E1", marginBottom: 6 }}>
                  Staff Role / Desk Assignment
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => setStaffRole("receptionist")}
                    style={{
                      padding: "9px 10px",
                      borderRadius: 10,
                      background: staffRole === "receptionist" ? "#10B981" : "rgba(255, 255, 255, 0.05)",
                      color: staffRole === "receptionist" ? "#FFFFFF" : "#CBD5E1",
                      border: "none",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                      textAlign: "center",
                    }}
                  >
                    💁‍♀️ Reception / OPD Desk
                  </button>
                  <button
                    type="button"
                    onClick={() => setStaffRole("director")}
                    style={{
                      padding: "9px 10px",
                      borderRadius: 10,
                      background: staffRole === "director" ? "#10B981" : "rgba(255, 255, 255, 0.05)",
                      color: staffRole === "director" ? "#FFFFFF" : "#CBD5E1",
                      border: "none",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                      textAlign: "center",
                    }}
                  >
                    👨‍⚕️ Medical Director
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#CBD5E1", marginBottom: 6 }}>
                  Hospital Master Authorization Key
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPass ? "text" : "password"}
                    value={passcode}
                    onChange={(e) => {
                      setPasscode(e.target.value);
                      setError("");
                    }}
                    placeholder="Enter hospital key..."
                    style={{
                      width: "100%",
                      padding: "12px 42px 12px 14px",
                      borderRadius: 12,
                      background: "rgba(15, 23, 42, 0.8)",
                      border: "1.5px solid rgba(255, 255, 255, 0.15)",
                      color: "white",
                      fontSize: 14,
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    style={{
                      position: "absolute",
                      right: 12,
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      color: "#94A3B8",
                      cursor: "pointer",
                      fontSize: 13,
                    }}
                  >
                    {showPass ? "Hide" : "Show"}
                  </button>
                </div>
                <div style={{ fontSize: 11, color: "#64748B", marginTop: 4 }}>Demo Master Key: <code style={{ color: "#34D399" }}>aarogya123</code></div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  marginTop: 6,
                  padding: "13px",
                  borderRadius: 12,
                  background: "linear-gradient(135deg, #10B981, #059669)",
                  color: "white",
                  border: "none",
                  fontSize: 14,
                  fontWeight: 800,
                  cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(16, 185, 129, 0.4)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                {loading ? "Authenticating Facility..." : "🚀 Enter Hospital Command Center"}
              </button>
            </form>
          </div>

          <div style={{ marginTop: 20, background: "rgba(16, 185, 129, 0.08)", border: "1px dashed rgba(16, 185, 129, 0.3)", padding: "10px 12px", borderRadius: 10, fontSize: 11, color: "#A7F3D0" }}>
            💡 <strong>Receptionist Tip:</strong> You can verify patient phone numbers via 1-tap dial, video call suspicious accounts, manage referrals, and book physical OPD follow-ups.
          </div>
        </div>
      </div>
    </div>
  );
}
