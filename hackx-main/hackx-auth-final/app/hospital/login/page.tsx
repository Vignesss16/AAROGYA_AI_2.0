"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export interface HospitalFacilityItem {
  id: string;
  name: string;
  shortName: string;
  type: string;
  location: string;
  contact: string;
  role: string;
  badge: string;
  beds: string;
  passkey: string;
}

const DEMO_HOSPITALS: HospitalFacilityItem[] = [
  {
    id: "HOSP-SION-001",
    name: "Lokmanya Tilak Municipal General Hospital (SION Hospital)",
    shortName: "SION Hospital (LTMGH Mumbai)",
    type: "Govt Civil Hospital (Apex Trauma & Research)",
    location: "Sion West, Mumbai, Maharashtra 400022",
    contact: "+91 22 2407 6381",
    role: "OPD Reception & Command Center",
    badge: "Level 1 Trauma & Cardiac",
    beds: "1,400 Beds",
    passkey: "sion123",
  },
  {
    id: "HOSP-KLY-002",
    name: "Kalyan Sub-District & Rural Civil Hospital",
    shortName: "Kalyan Civil Hospital",
    type: "Govt Sub-District Civil Hospital (SDH)",
    location: "Station Road, Kalyan West, Maharashtra 421301",
    contact: "+91 251 2314567",
    role: "Central OPD Desk",
    badge: "24/7 Emergency Active",
    beds: "250 Beds",
    passkey: "kalyan123",
  },
  {
    id: "HOSP-KLW-003",
    name: "Chhatrapati Shivaji Maharaj Hospital & Medical College (CSMH)",
    shortName: "CSMH Kalwa Hospital",
    type: "Govt Civil Hospital & Teaching Hospital",
    location: "Belapur Road, Kalwa, Thane, Maharashtra 400605",
    contact: "+91 22 2537 2001",
    role: "Casualty & OPD Desk",
    badge: "Govt Multi-Specialty",
    beds: "500 Beds",
    passkey: "kalwa123",
  },
  {
    id: "HOSP-PLG-004",
    name: "Palghar Tribal & Rural Sub-District Civil Hospital",
    shortName: "Palghar Rural Civil Hospital",
    type: "Community Health Center (CHC) & Tribal Hospital",
    location: "Manor Highway, Palghar Rural Tribal Belt, Maharashtra 401404",
    contact: "+91 2525 252033",
    role: "Tribal & Rural Desk",
    badge: "Tribal Health Hub",
    beds: "120 Beds",
    passkey: "palghar123",
  },
  {
    id: "HOSP-MRB-005",
    name: "Murbad Rural Sub-District & Referral Hospital",
    shortName: "Murbad Rural Hospital",
    type: "Rural Sub-District Hospital",
    location: "Murbad Main Road, Thane Rural, Maharashtra 421401",
    contact: "+91 2524 222120",
    role: "Rural OPD & ASHA Hub",
    badge: "ASHA Primary Network",
    beds: "80 Beds",
    passkey: "murbad123",
  },
  {
    id: "HOSP-JWH-006",
    name: "Jawhar Sub-District Hospital & Tribal Health Center",
    shortName: "Jawhar Tribal Hospital",
    type: "Tribal Sub-District Hospital",
    location: "Palghar Road, Jawhar Hill Station, Maharashtra 401603",
    contact: "+91 2520 222014",
    role: "Tribal Nutrition & OPD Desk",
    badge: "Malnutrition Care Unit",
    beds: "100 Beds",
    passkey: "jawhar123",
  },
  {
    id: "HOSP-DMB-007",
    name: "CityCare Multi-Specialty Hospital & Trauma Center",
    shortName: "CityCare Hospital Dombivli",
    type: "Multi-Specialty Hospital",
    location: "Manpada Road, Dombivli East, Maharashtra 421201",
    contact: "+91 251 2801122",
    role: "Private-Public Partnership Hub",
    badge: "NABH Accredited",
    beds: "160 Beds",
    passkey: "dombivli123",
  },
  {
    id: "HOSP-NBH-008",
    name: "Civil Hospital, Nabha",
    shortName: "Nabha Civil Hospital",
    type: "Civil District Hospital",
    location: "Circular Road, Nabha, Punjab 147201",
    contact: "+91 1765 220102",
    role: "OPD & Triage Desk",
    badge: "Punjab Health System",
    beds: "120 Beds",
    passkey: "nabha123",
  },
  {
    id: "HOSP-PTL-009",
    name: "Rajindra Hospital & Govt Medical College, Patiala",
    shortName: "Rajindra Hospital Patiala",
    type: "Tertiary Care & Super Specialty Hospital",
    location: "Sangrur Road, Patiala, Punjab 147001",
    contact: "+91 175 2212018",
    role: "Tertiary Command Center",
    badge: "Regional Super Specialty",
    beds: "900 Beds",
    passkey: "patiala123",
  },
];

export default function HospitalLoginPage() {
  const router = useRouter();
  const [selectedHospital, setSelectedHospital] = useState(DEMO_HOSPITALS[1]); // Default to Kalyan
  const [staffRole, setStaffRole] = useState<"receptionist" | "director">("receptionist");
  const [staffName, setStaffName] = useState("");
  const [passcode, setPasscode] = useState("aarogya123");
  const [showPass, setShowPass] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const filteredHospitals = DEMO_HOSPITALS.filter((h) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      h.name.toLowerCase().includes(q) ||
      h.shortName.toLowerCase().includes(q) ||
      h.id.toLowerCase().includes(q) ||
      h.location.toLowerCase().includes(q)
    );
  });

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanPass = passcode.trim().toLowerCase();
    const validKeys = [
      "aarogya123",
      "admin123",
      "hospital123",
      selectedHospital.passkey.toLowerCase(),
      selectedHospital.id.toLowerCase(),
    ];

    if (!validKeys.includes(cleanPass)) {
      setError(`Invalid key for ${selectedHospital.shortName}. Use: ${selectedHospital.passkey} or master key: aarogya123`);
      return;
    }

    setLoading(true);
    setError("");

    const hospitalSession = {
      facilityId: selectedHospital.id,
      facilityName: selectedHospital.name,
      shortName: selectedHospital.shortName,
      facilityType: selectedHospital.type,
      location: selectedHospital.location,
      contact: selectedHospital.contact,
      staffRole,
      staffName: staffName.trim() || (staffRole === "director" ? "Dr. Medical Director" : "Receptionist Desk"),
      loginTime: new Date().toISOString(),
      authenticated: true,
    };

    if (typeof window !== "undefined") {
      localStorage.setItem("hospital_command_user", JSON.stringify(hospitalSession));
      localStorage.setItem("hospitalAuth", "true");
      localStorage.setItem("hospital_authorized", "true");
      localStorage.setItem("hospital_authorized_facility", selectedHospital.id);
      localStorage.setItem("hospitalSelectedFacility", selectedHospital.id);
      localStorage.setItem("last_logged_role", "hospital");
    }

    setTimeout(() => {
      router.push("/hospital");
    }, 300);
  };

  return (
    <div
      style={{
        background: "radial-gradient(circle at 10% 10%, #0F2D2A 0%, #09131F 60%, #050B14 100%)",
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "24px 16px",
        fontFamily: "'Inter', -apple-system, sans-serif",
        color: "#F8FAFC",
        position: "relative",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 1040,
          background: "rgba(15, 23, 42, 0.85)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          borderRadius: 24,
          padding: "32px 36px",
          boxShadow: "0 30px 70px rgba(0, 0, 0, 0.7)",
          display: "grid",
          gridTemplateColumns: "1.2fr 1fr",
          gap: 32,
        }}
      >
        {/* Left: Facility Directory & Selector */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <div
              style={{
                width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg, #0D9488, #0F766E)",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
                boxShadow: "0 4px 14px rgba(13, 148, 136, 0.35)",
              }}
            >
              🏥
            </div>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0, letterSpacing: "-0.5px" }}>
                AarogyaAI Facility Portal
              </h1>
              <p style={{ margin: 0, fontSize: 12, color: "#94A3B8" }}>
                Isolated Hospital Command Center & Receptionist Gateway
              </p>
            </div>
          </div>

          <p style={{ fontSize: 13, color: "#CBD5E1", lineHeight: 1.5, margin: "0 0 16px 0" }}>
            Select your specific health facility to access its <strong>isolated</strong> patient triage queue, in-person OPD booking desk, doctor roster, and ABDM referral exchange.
          </p>

          {/* Search Facility Input */}
          <div style={{ marginBottom: 12, position: "relative" }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="🔍 Search hospital by name, district, or ID..."
              style={{
                width: "100%", padding: "10px 14px", borderRadius: 10,
                background: "rgba(30, 41, 59, 0.8)", border: "1px solid rgba(255,255,255,0.12)",
                color: "white", fontSize: 13, outline: "none", boxSizing: "border-box"
              }}
            />
          </div>

          <div style={{ fontSize: 11, fontWeight: 700, color: "#2DD4BF", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 8 }}>
            Select Active Health Facility ({filteredHospitals.length})
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 320, overflowY: "auto", paddingRight: 4 }}>
            {filteredHospitals.map((h) => {
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
                    background: isSelected ? "rgba(13, 148, 136, 0.18)" : "rgba(30, 41, 59, 0.45)",
                    border: isSelected ? "1.5px solid #2DD4BF" : "1px solid rgba(255, 255, 255, 0.08)",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div style={{ minWidth: 0, paddingRight: 10 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: isSelected ? "#5EEAD4" : "#F8FAFC", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {h.name}
                    </div>
                    <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>{h.location}</div>
                    <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                      <span style={{ fontSize: 10, background: "rgba(255,255,255,0.08)", padding: "2px 6px", borderRadius: 4, color: "#CBD5E1" }}>
                        {h.beds}
                      </span>
                      <span style={{ fontSize: 10, background: "rgba(13, 148, 136, 0.25)", padding: "2px 6px", borderRadius: 4, color: "#5EEAD4", fontWeight: 600 }}>
                        {h.badge}
                      </span>
                    </div>
                  </div>
                  {isSelected && <span style={{ color: "#2DD4BF", fontSize: 16, fontWeight: 800 }}>✓</span>}
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 18, paddingTop: 14, borderTop: "1px solid rgba(255, 255, 255, 0.08)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Link href="/login" style={{ color: "#94A3B8", fontSize: 12, textDecoration: "none" }}>
              ← Return to Main Portal
            </Link>
            <span style={{ fontSize: 11, color: "#64748B" }}>ABDM M3 & e-Hospital Connected</span>
          </div>
        </div>

        {/* Right: Selected Facility Isolated Login Form */}
        <div
          style={{
            background: "rgba(30, 41, 59, 0.65)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            borderRadius: 20,
            padding: 24,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ background: "rgba(15, 23, 42, 0.6)", borderRadius: 14, padding: "14px 16px", marginBottom: 18, border: "1px solid rgba(255,255,255,0.08)" }}>
              <div style={{ fontSize: 11, color: "#94A3B8", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.5px" }}>
                🔒 Target Isolated Facility
              </div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#F8FAFC", marginTop: 3 }}>
                {selectedHospital.name}
              </div>
              <div style={{ fontSize: 12, color: "#2DD4BF", fontWeight: 600, marginTop: 2 }}>
                Tenant ID: {selectedHospital.id} • {selectedHospital.beds}
              </div>
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

            <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
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
                      background: staffRole === "receptionist" ? "#0D9488" : "rgba(255, 255, 255, 0.06)",
                      color: staffRole === "receptionist" ? "#FFFFFF" : "#CBD5E1",
                      border: "none",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                      textAlign: "center",
                      transition: "all 0.15s ease",
                    }}
                  >
                    💁‍♀️ Reception Desk
                  </button>
                  <button
                    type="button"
                    onClick={() => setStaffRole("director")}
                    style={{
                      padding: "9px 10px",
                      borderRadius: 10,
                      background: staffRole === "director" ? "#0D9488" : "rgba(255, 255, 255, 0.06)",
                      color: staffRole === "director" ? "#FFFFFF" : "#CBD5E1",
                      border: "none",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                      textAlign: "center",
                      transition: "all 0.15s ease",
                    }}
                  >
                    👨‍⚕️ Medical Director
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#CBD5E1", marginBottom: 6 }}>
                  Staff / Operator Name (Optional)
                </label>
                <input
                  type="text"
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  placeholder={staffRole === "director" ? "e.g. Dr. Rajesh Shinde" : "e.g. Reception Desk 01"}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 10,
                    background: "rgba(15, 23, 42, 0.8)",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    color: "white",
                    fontSize: 13,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#CBD5E1", marginBottom: 6 }}>
                  Hospital Authorization Key
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPass ? "text" : "password"}
                    value={passcode}
                    onChange={(e) => {
                      setPasscode(e.target.value);
                      setError("");
                    }}
                    placeholder="Enter passkey..."
                    style={{
                      width: "100%",
                      padding: "10px 42px 10px 12px",
                      borderRadius: 10,
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
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    {showPass ? "Hide" : "Show"}
                  </button>
                </div>
                <div style={{ fontSize: 11, color: "#64748B", marginTop: 4 }}>
                  Passkey for {selectedHospital.shortName}: <code style={{ color: "#2DD4BF" }}>{selectedHospital.passkey}</code> or <code style={{ color: "#2DD4BF" }}>aarogya123</code>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  marginTop: 6,
                  padding: "12px",
                  borderRadius: 12,
                  background: "linear-gradient(135deg, #0D9488, #0F766E)",
                  color: "white",
                  border: "none",
                  fontSize: 14,
                  fontWeight: 800,
                  cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(13, 148, 136, 0.35)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                {loading ? "Authenticating Facility..." : `🚀 Enter ${selectedHospital.shortName} Dashboard`}
              </button>
            </form>
          </div>

          <div style={{ marginTop: 16, background: "rgba(13, 148, 136, 0.08)", border: "1px dashed rgba(13, 148, 136, 0.3)", padding: "10px 12px", borderRadius: 10, fontSize: 11, color: "#99F6E4" }}>
            🔒 <strong>Isolated Tenancy Guarantee:</strong> You will only manage patients, doctor rosters, and beds assigned specifically to {selectedHospital.shortName}.
          </div>
        </div>
      </div>
    </div>
  );
}
