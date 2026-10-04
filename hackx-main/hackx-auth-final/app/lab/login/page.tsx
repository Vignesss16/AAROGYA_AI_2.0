"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

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
  red: "#EF4444",
};

const DEMO_LABS = [
  { name: "ABC Diagnostic Center (Kalyan)", id: "LAB-KLY-001", phone: "9876504001" },
  { name: "CityCare Pathology (Dombivli)", id: "LAB-DMB-002", phone: "9876504002" },
  { name: "Govt Diagnostic Centre (Nabha)", id: "LAB-NBH-003", phone: "9876504003" },
];

export default function LabLoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("LAB-KLY-001");
  const [password, setPassword] = useState("lab123");
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
        throw new Error(data.error || "Login failed");
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
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 440, background: C.card, borderRadius: 24, padding: "32px 28px", border: `1px solid ${C.border}`, boxShadow: "0 20px 50px rgba(0,0,0,0.5)" }}>
        {/* Brand Header */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ width: 64, height: 64, borderRadius: 20, background: "linear-gradient(135deg, #06B6D4, #0E7490)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, margin: "0 auto 16px", boxShadow: "0 8px 24px rgba(6,182,212,0.3)" }}>
            🧪
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, letterSpacing: -0.5 }}>
            Diagnostic Lab Portal
          </h1>
          <p style={{ fontSize: 13, color: C.muted, marginTop: 6 }}>
            Aarogya.AI Pathology & Laboratory Management
          </p>
        </div>

        {error && (
          <div style={{ background: "rgba(239,68,68,0.15)", border: `1px solid ${C.red}`, borderRadius: 12, padding: "12px 14px", marginBottom: 20, color: "#FCA5A5", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: C.muted, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
              Lab ID or Registered Phone
            </label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="e.g. LAB-KLY-001 or 9876504001"
              style={{ width: "100%", padding: "14px 16px", borderRadius: 12, background: C.cardLight, border: `1px solid ${C.border}`, color: C.text, fontSize: 14, outline: "none", boxSizing: "border-box" }}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: C.muted, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              style={{ width: "100%", padding: "14px 16px", borderRadius: 12, background: C.cardLight, border: `1px solid ${C.border}`, color: C.text, fontSize: 14, outline: "none", boxSizing: "border-box" }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ width: "100%", padding: 15, borderRadius: 14, background: "linear-gradient(135deg, #06B6D4, #0E7490)", color: "white", border: "none", fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", boxShadow: "0 6px 20px rgba(6,182,212,0.35)", opacity: loading ? 0.7 : 1, transition: "all 0.2s" }}
          >
            {loading ? "Verifying Credentials..." : "Access Lab Portal →"}
          </button>
        </form>

        {/* Demo Fast Fill */}
        <div style={{ marginTop: 28, paddingTop: 20, borderTop: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 12, textAlign: "center" }}>
            Quick Demo Select
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {DEMO_LABS.map((demo) => (
              <button
                key={demo.id}
                type="button"
                onClick={() => {
                  setIdentifier(demo.id);
                  setPassword("lab123");
                }}
                style={{ background: identifier === demo.id ? "rgba(6,182,212,0.15)" : C.cardLight, border: `1px solid ${identifier === demo.id ? C.accent : C.border}`, borderRadius: 10, padding: "10px 12px", textAlign: "left", cursor: "pointer", color: C.text, display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12 }}
              >
                <div>
                  <div style={{ fontWeight: 600 }}>{demo.name}</div>
                  <div style={{ fontSize: 11, color: C.muted }}>ID: {demo.id}</div>
                </div>
                <span style={{ fontSize: 11, color: C.accent, fontWeight: 700 }}>Select</span>
              </button>
            ))}
          </div>
        </div>

        {/* Footer link to home */}
        <div style={{ textAlign: "center", marginTop: 24 }}>
          <button
            type="button"
            onClick={() => router.push("/home")}
            style={{ background: "none", border: "none", color: C.muted, fontSize: 12, cursor: "pointer", textDecoration: "underline" }}
          >
            ← Back to Aarogya.AI Home
          </button>
        </div>
      </div>
    </div>
  );
}
