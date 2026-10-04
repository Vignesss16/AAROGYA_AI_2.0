"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const DEMO_LABS = [
  {
    id: "LAB-KLY-001",
    name: "ABC Diagnostic Center",
    location: "Kalyan, Thane",
    phone: "9876504001",
    shortName: "ABC Diagnostics",
  },
  {
    id: "LAB-DMB-002",
    name: "CityCare Pathology & Lab",
    location: "Dombivli, Thane",
    phone: "9876504002",
    shortName: "CityCare Lab",
  },
  {
    id: "LAB-NBH-003",
    name: "Govt Sub-District Diagnostic",
    location: "Civil Hospital, Nabha",
    phone: "9876504003",
    shortName: "Govt Lab Nabha",
  },
  {
    id: "LAB-APX-004",
    name: "Apex Molecular Laboratory",
    location: "Medical Square, Patiala",
    phone: "9876504004",
    shortName: "Apex Molecular",
  },
];

export default function LabLoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("LAB-KLY-001");
  const [password, setPassword] = useState("lab123");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("diagnostic_lab_user");
      if (stored) {
        router.replace("/lab/dashboard");
      }
    }
  }, [router]);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!identifier.trim()) {
      setError("Please enter your Lab ID or Phone number.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/lab/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: identifier.trim(), password }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Authentication failed");
      }

      if (typeof window !== "undefined") {
        localStorage.setItem("diagnostic_lab_user", JSON.stringify(data.lab));
        localStorage.setItem("last_logged_role", "lab");
      }

      router.push("/lab/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to log in.");
    } finally {
      setLoading(false);
    }
  };

  const selectDemoLab = (lab: typeof DEMO_LABS[0]) => {
    setIdentifier(lab.id);
    setPassword("lab123");
    setError("");
  };

  return (
    <div
      style={{
        background: "radial-gradient(circle at 50% 0%, #1A2332 0%, #0F172A 100%)",
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        position: "relative",
        overflow: "hidden",
        padding: "32px 16px",
      }}
    >
      {/* Background Subtle Medical Glows */}
      <div
        style={{
          position: "absolute",
          width: 450,
          height: 450,
          background: "radial-gradient(circle, rgba(15, 118, 110, 0.2) 0%, transparent 70%)",
          top: "-8%",
          left: "25%",
          borderRadius: "50%",
          filter: "blur(50px)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 500,
          height: 500,
          background: "radial-gradient(circle, rgba(2, 132, 199, 0.18) 0%, transparent 70%)",
          bottom: "-10%",
          right: "20%",
          borderRadius: "50%",
          filter: "blur(60px)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          width: "100%",
          maxWidth: 440,
          margin: "0 auto",
          background: "rgba(255, 255, 255, 0.05)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderRadius: 28,
          padding: "40px 32px",
          boxSizing: "border-box",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.6)",
          border: "1px solid rgba(255,255,255,0.1)",
          zIndex: 10,
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 20,
              background: "linear-gradient(135deg, rgba(15,118,110,0.9), rgba(2,132,199,0.9))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 18px",
              boxShadow: "0 10px 20px -5px rgba(2, 132, 199, 0.5), inset 0 0 10px rgba(255,255,255,0.2)",
              border: "1px solid rgba(255,255,255,0.15)",
            }}
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 18h8" />
              <path d="M3 22h18" />
              <path d="M14 22a7 7 0 1 0-4 0" />
              <path d="M9 14h2" />
              <path d="M9 12a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2Z" />
              <path d="M12 6V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3" />
            </svg>
          </div>
          <h2 style={{ fontSize: 26, fontWeight: 800, color: "white", margin: 0, letterSpacing: "-0.5px" }}>
            Diagnostic Portal
          </h2>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", marginTop: 6, fontWeight: 500 }}>
            AarogyaAI Pathology & Laboratory Staff
          </p>
        </div>

        {error && (
          <div
            style={{
              background: "rgba(239, 68, 68, 0.15)",
              borderRadius: 12,
              padding: "12px 14px",
              marginBottom: 20,
              fontSize: 13,
              color: "#FECACA",
              fontWeight: 600,
              border: "1px solid rgba(239, 68, 68, 0.3)",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* 1-Click Fast Fill Selector Tabs (2x2 Grid) */}
        <div style={{ marginBottom: 24 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "rgba(255,255,255,0.7)",
              textTransform: "uppercase",
              letterSpacing: "0.8px",
              marginBottom: 10,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>Select Registered Facility</span>
            <span style={{ fontSize: 10, color: "#38BDF8", fontWeight: 600 }}>1-Click Demo</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {DEMO_LABS.map((lab) => {
              const isSelected = identifier === lab.id || identifier === lab.phone;
              return (
                <button
                  key={lab.id}
                  type="button"
                  onClick={() => selectDemoLab(lab)}
                  style={{
                    background: isSelected ? "rgba(15, 118, 110, 0.4)" : "rgba(255, 255, 255, 0.04)",
                    border: `1.5px solid ${isSelected ? "#14B8A6" : "rgba(255,255,255,0.1)"}`,
                    borderRadius: 12,
                    padding: "10px 12px",
                    textAlign: "left",
                    cursor: "pointer",
                    color: "white",
                    transition: "all 0.15s ease",
                    boxShadow: isSelected ? "0 4px 12px rgba(20,184,166,0.2)" : "none",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
                    <span style={{ fontSize: 10, fontFamily: "monospace", color: isSelected ? "#5EEAD4" : "rgba(255,255,255,0.5)", fontWeight: 700 }}>
                      {lab.id.replace("LAB-", "")}
                    </span>
                    {isSelected && (
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#14B8A6" }} />
                    )}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 12, color: "white", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {lab.shortName}
                  </div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.55)", marginTop: 2 }}>
                    {lab.location.split(",")[0]}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.8)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Lab ID or Registered Phone
            </label>
            <div style={{ position: "relative" }}>
              <input
                type="text"
                placeholder="LAB-KLY-001 or 9876504001"
                value={identifier}
                onChange={(e) => {
                  setIdentifier(e.target.value);
                  setError("");
                }}
                style={{
                  width: "100%",
                  padding: "14px 16px 14px 42px",
                  border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: 14,
                  fontSize: 14,
                  fontFamily: "inherit",
                  background: "rgba(0,0,0,0.25)",
                  color: "white",
                  outline: "none",
                  boxSizing: "border-box",
                  transition: "all 0.2s",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(56, 189, 248, 0.7)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)")}
              />
              <div style={{ position: "absolute", left: 14, top: 14, color: "rgba(255,255,255,0.45)", pointerEvents: "none" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
            </div>
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.8)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Secure Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPass ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                style={{
                  width: "100%",
                  padding: "14px 44px 14px 42px",
                  border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: 14,
                  fontSize: 14,
                  fontFamily: "inherit",
                  background: "rgba(0,0,0,0.25)",
                  color: "white",
                  outline: "none",
                  boxSizing: "border-box",
                  transition: "all 0.2s",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(56, 189, 248, 0.7)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)")}
              />
              <div style={{ position: "absolute", left: 14, top: 14, color: "rgba(255,255,255,0.45)", pointerEvents: "none" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={{
                  position: "absolute",
                  right: 14,
                  top: 14,
                  background: "transparent",
                  border: "none",
                  color: "rgba(255,255,255,0.5)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {showPass ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" /><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" /><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" /><line x1="2" y1="2" x2="22" y2="22" /></svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "16px",
              borderRadius: 14,
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              fontWeight: 800,
              fontSize: 15,
              background: "white",
              color: "#0F172A",
              boxShadow: "0 6px 20px rgba(0, 0, 0, 0.35)",
              transition: "all 0.2s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              marginTop: 6,
              opacity: loading ? 0.7 : 1,
            }}
          >
            <span>{loading ? "Authenticating..." : "Access Laboratory Portal"}</span>
            {!loading && (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            )}
          </button>
        </form>

        {/* Navigation & Role Switching */}
        <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 10 }}>
          <button
            type="button"
            onClick={() => router.push("/login")}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "transparent",
              color: "rgba(255,255,255,0.65)",
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            Switch to Patient Portal
          </button>

          <button
            type="button"
            onClick={() => router.push("/home")}
            style={{
              background: "none",
              border: "none",
              color: "rgba(255, 255, 255, 0.45)",
              fontSize: 12,
              fontWeight: 500,
              cursor: "pointer",
              textAlign: "center",
              marginTop: 4,
            }}
          >
            ← Back to Aarogya.AI Home
          </button>
        </div>
      </div>
    </div>
  );
}
