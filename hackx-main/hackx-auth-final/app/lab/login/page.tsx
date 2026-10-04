"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const DEMO_LABS = [
  {
    name: "ABC Diagnostic Center",
    location: "Kalyan, Thane",
    id: "LAB-KLY-001",
    phone: "9876504001",
  },
  {
    name: "CityCare Pathology & Diagnostic Lab",
    location: "Dombivli, Thane",
    id: "LAB-DMB-002",
    phone: "9876504002",
  },
  {
    name: "Government Sub-District Diagnostic Centre",
    location: "Civil Hospital, Nabha",
    id: "LAB-NBH-003",
    phone: "9876504003",
  },
  {
    name: "Apex Advanced Molecular Lab",
    location: "Medical Square, Patiala / Thane",
    id: "LAB-APX-004",
    phone: "9876504004",
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setError("Please enter your Lab ID or Registered Phone number.");
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

  return (
    <div
      style={{
        background: "radial-gradient(circle at 10% 20%, rgb(15, 118, 110) 0%, rgb(2, 132, 199) 90.2%)",
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        position: "relative",
        overflow: "hidden",
        padding: "24px 16px",
      }}
    >
      {/* Background Glow Elements */}
      <div
        style={{
          position: "absolute",
          width: 550,
          height: 550,
          background: "radial-gradient(circle, rgba(20, 184, 166, 0.35) 0%, transparent 70%)",
          top: -120,
          left: -100,
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
          background: "radial-gradient(circle, rgba(2, 132, 199, 0.35) 0%, transparent 70%)",
          bottom: -100,
          right: -100,
          borderRadius: "50%",
          filter: "blur(50px)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          width: "100%",
          maxWidth: 480,
          background: "rgba(255, 255, 255, 0.12)",
          backdropFilter: "blur(28px)",
          WebkitBackdropFilter: "blur(28px)",
          borderRadius: 24,
          padding: "36px 28px",
          boxSizing: "border-box",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.45)",
          border: "1px solid rgba(255, 255, 255, 0.22)",
          zIndex: 10,
          color: "white",
        }}
      >
        {/* Header with SVG Icon */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 20,
              background: "rgba(255, 255, 255, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
              boxShadow: "inset 0 0 20px rgba(255, 255, 255, 0.15)",
              border: "1px solid rgba(255, 255, 255, 0.3)",
            }}
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
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
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, letterSpacing: "-0.5px", color: "white" }}>
            AAROGYA.AI
          </h1>
          <p style={{ fontSize: 13, marginTop: 4, fontWeight: 600, color: "rgba(255, 255, 255, 0.85)" }}>
            Diagnostic Pathology & Laboratory Portal
          </p>
        </div>

        {error && (
          <div
            style={{
              background: "rgba(239, 68, 68, 0.25)",
              color: "#FECACA",
              padding: "12px 14px",
              borderRadius: 12,
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 20,
              display: "flex",
              alignItems: "center",
              gap: 8,
              border: "1px solid rgba(239, 68, 68, 0.4)",
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

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6, color: "rgba(255,255,255,0.9)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Lab ID or Phone Number
            </label>
            <div style={{ position: "relative" }}>
              <input
                type="text"
                placeholder="e.g. LAB-KLY-001 or 9876504001"
                value={identifier}
                onChange={(e) => {
                  setIdentifier(e.target.value);
                  setError("");
                }}
                style={{
                  width: "100%",
                  padding: "14px 16px 14px 42px",
                  border: "1px solid rgba(255,255,255,0.25)",
                  borderRadius: 14,
                  fontSize: 14,
                  fontFamily: "inherit",
                  background: "rgba(0,0,0,0.2)",
                  color: "white",
                  outline: "none",
                  boxSizing: "border-box",
                  transition: "all 0.2s",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.7)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)")}
              />
              <div style={{ position: "absolute", left: 14, top: 15, color: "rgba(255,255,255,0.6)", pointerEvents: "none" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6, color: "rgba(255,255,255,0.9)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPass ? "text" : "password"}
                placeholder="Enter password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                style={{
                  width: "100%",
                  padding: "14px 44px 14px 42px",
                  border: "1px solid rgba(255,255,255,0.25)",
                  borderRadius: 14,
                  fontSize: 14,
                  fontFamily: "inherit",
                  background: "rgba(0,0,0,0.2)",
                  color: "white",
                  outline: "none",
                  boxSizing: "border-box",
                  transition: "all 0.2s",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.7)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)")}
              />
              <div style={{ position: "absolute", left: 14, top: 15, color: "rgba(255,255,255,0.6)", pointerEvents: "none" }}>
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
                  color: "rgba(255,255,255,0.7)",
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
              background: "#FFFFFF",
              color: "#0F766E",
              boxShadow: "0 6px 20px rgba(0, 0, 0, 0.25)",
              transition: "all 0.2s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              marginTop: 4,
              opacity: loading ? 0.75 : 1,
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

        {/* 1-Click Fast Fill for all 4 registered labs */}
        <div style={{ marginTop: 24, paddingTop: 18, borderTop: "1px solid rgba(255, 255, 255, 0.18)" }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              color: "rgba(255, 255, 255, 0.8)",
              textTransform: "uppercase",
              letterSpacing: "0.8px",
              marginBottom: 10,
              textAlign: "center",
            }}
          >
            Registered Diagnostic Centres (1-Click Demo Select)
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {DEMO_LABS.map((demo) => {
              const isSelected = identifier === demo.id || identifier === demo.phone;
              return (
                <button
                  key={demo.id}
                  type="button"
                  onClick={() => {
                    setIdentifier(demo.id);
                    setPassword("lab123");
                  }}
                  style={{
                    background: isSelected ? "rgba(255, 255, 255, 0.25)" : "rgba(0, 0, 0, 0.18)",
                    border: `1.5px solid ${isSelected ? "rgba(255,255,255,0.85)" : "rgba(255, 255, 255, 0.12)"}`,
                    borderRadius: 12,
                    padding: "10px 14px",
                    textAlign: "left",
                    cursor: "pointer",
                    color: "white",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div style={{ overflow: "hidden", paddingRight: 8 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: "white", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {demo.name}
                    </div>
                    <div style={{ fontSize: 11, color: "rgba(255, 255, 255, 0.7)", marginTop: 2 }}>
                      {demo.location} · <span style={{ fontFamily: "monospace" }}>{demo.id}</span>
                    </div>
                  </div>
                  <div
                    style={{
                      background: isSelected ? "white" : "rgba(255,255,255,0.15)",
                      color: isSelected ? "#0F766E" : "white",
                      padding: "4px 10px",
                      borderRadius: 8,
                      fontSize: 11,
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {isSelected ? "Active" : "Select"}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Back link */}
        <div style={{ textAlign: "center", marginTop: 20 }}>
          <button
            type="button"
            onClick={() => router.push("/home")}
            style={{
              background: "none",
              border: "none",
              color: "rgba(255, 255, 255, 0.75)",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            ← Back to Aarogya.AI Home
          </button>
        </div>
      </div>
    </div>
  );
}
