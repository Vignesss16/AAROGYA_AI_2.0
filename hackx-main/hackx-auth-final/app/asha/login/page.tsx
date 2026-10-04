"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { useLang } from "@/lib/useLang";

const C = {
  purple: "#7D3C98", purpleDark: "#5B2C6F",
  bg: "#F0F4F8", card: "#FFFFFF", text: "#1A2332",
  muted: "#6B7C93", border: "#DDE3EC", red: "#C0392B",
};

export default function ASHALoginPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { lang, setLang, mounted } = useLang();
  const [phone, setPhone]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  // Already logged in as ASHA → go straight to dashboard (online or offline cached)
  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "ashaworker") {
      router.replace("/asha/dashboard");
      return;
    }
    if (typeof window !== "undefined") {
      const cachedAsha = localStorage.getItem("cachedAshaUser");
      if (cachedAsha) {
        try {
          const parsed = JSON.parse(cachedAsha);
          if (parsed && (parsed.role === "ashaworker" || parsed.phone)) {
            router.replace("/asha/dashboard");
          }
        } catch {}
      }
    }
  }, [session, status, router]);

  const T = (hi: string, en: string) => lang === "hi" ? hi : en;

  if (!mounted) return null;

  const handleLogin = async () => {
    if (phone.length !== 10) { setError(T("10 अंक का नंबर दर्ज करें", "Enter valid 10-digit number")); return; }
    if (!password)           { setError(T("पासवर्ड दर्ज करें", "Enter your password")); return; }

    setError(""); setLoading(true);
    const res = await signIn("asha-credentials", { phone, password, redirect: false });
    setLoading(false);

    if (res?.ok) {
      if (typeof window !== "undefined") {
        localStorage.setItem("cachedAshaUser", JSON.stringify({
          phone,
          role: "ashaworker",
          name: phone === "9876502001" ? "Priya Sharma" : "ASHA Worker",
          villages: "Kesri, Nabha Sector 4",
        }));
        localStorage.setItem("last_logged_role", "ashaworker");
      }
      router.replace("/asha/dashboard");
    } else {
      setError(T("नंबर या पासवर्ड गलत है", "Incorrect phone or password"));
    }
  };

  return (
    <div style={{ background: "#0d1520", minHeight: "100vh", display: "flex", justifyContent: "center" }}>
      <div style={{ width: 390, background: C.bg, minHeight: "100vh", display: "flex", flexDirection: "column" }}>

        {/* Header */}
        <div style={{ background: `linear-gradient(135deg,${C.purple},${C.purpleDark})`, padding: "56px 24px 36px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", right: -20, top: -20, fontSize: 120, opacity: .06, pointerEvents: "none" }}>👩</div>
          <div style={{ width: 52, height: 52, background: "rgba(255,255,255,.2)", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, marginBottom: 16 }}>🏘️</div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: "white", margin: 0 }}>
            {T("आशा वर्कर लॉगिन", "ASHA Worker Login")}
          </h2>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,.65)", marginTop: 8 }}>
            {T("अपने गाँव के मरीज़ देखें", "View and manage your village patients")}
          </p>
        </div>

        {/* Form */}
        <div style={{ flex: 1, padding: "28px 20px" }}>

          {error && (
            <div style={{ background: "#FDEDED", border: "1px solid #F1948A", borderRadius: 10, padding: "10px 14px", marginBottom: 18, fontSize: 13, color: C.red, fontWeight: 600 }}>
              ⚠ {error}
            </div>
          )}

          {/* Phone */}
          <label style={{ fontSize: 12, fontWeight: 700, color: C.muted, display: "block", marginBottom: 6 }}>
            📱 {T("मोबाइल नंबर", "Mobile Number")}
          </label>
          <div style={{ display: "flex", border: `2px solid ${C.border}`, borderRadius: 12, overflow: "hidden", background: C.card, marginBottom: 16 }}>
            <div style={{ background: C.bg, padding: "0 14px", display: "flex", alignItems: "center", borderRight: `2px solid ${C.border}`, fontSize: 14, fontWeight: 700, color: C.muted }}>+91</div>
            <input
              style={{ flex: 1, border: "none", outline: "none", fontSize: 20, fontWeight: 700, padding: "14px", background: "transparent", color: C.text, letterSpacing: 2 }}
              type="tel" inputMode="numeric" value={phone} autoFocus
              placeholder="98765 02001"
              onChange={e => { setPhone(e.target.value.replace(/\D/g, "").slice(0, 10)); setError(""); }}
              onKeyDown={e => e.key === "Enter" && document.getElementById("pw-input")?.focus()}
            />
          </div>

          {/* Password */}
          <label style={{ fontSize: 12, fontWeight: 700, color: C.muted, display: "block", marginBottom: 6 }}>
            🔒 {T("पासवर्ड", "Password")}
          </label>
          <input
            id="pw-input"
            style={{ width: "100%", padding: "14px 16px", border: `2px solid ${C.border}`, borderRadius: 12, fontSize: 15, fontFamily: "inherit", background: C.card, color: C.text, outline: "none", boxSizing: "border-box" }}
            type="password" placeholder="••••••••" value={password}
            onChange={e => { setPassword(e.target.value); setError(""); }}
            onKeyDown={e => e.key === "Enter" && handleLogin()}
          />

          {/* Login button */}
          <button
            onClick={handleLogin}
            disabled={loading}
            style={{ width: "100%", marginTop: 20, padding: 17, borderRadius: 14, border: "none", cursor: loading ? "not-allowed" : "pointer", fontWeight: 700, fontSize: 16, background: `linear-gradient(135deg,${C.purple},${C.purpleDark})`, color: "white", opacity: loading ? 0.7 : 1 }}
          >
            {loading ? T("लॉगिन हो रहा है...", "Logging in...") : `→ ${T("लॉगिन करें", "Login")}`}
          </button>

          {/* Demo hint */}
          <div style={{ background: "#F4ECF7", borderRadius: 12, padding: "12px 14px", marginTop: 24, border: "1px solid #D2B4DE" }}>
            <p style={{ fontSize: 12, color: C.purpleDark, margin: 0, fontWeight: 600 }}>
              💡 Demo: &nbsp;
              {T("नंबर: 9876502001 · पासवर्ड: asha123", "Phone: 9876502001 · Password: asha123")}
            </p>
          </div>

          <div style={{ height: 1, background: C.border, margin: "24px 0" }} />

          <button
            onClick={() => {
              if (typeof window !== "undefined") {
                localStorage.removeItem("cachedAshaUser");
                localStorage.removeItem("asha_user");
                localStorage.removeItem("ashaworker");
                localStorage.setItem("last_logged_role", "patient");
                sessionStorage.removeItem("user_explicitly_logged_out");
              }
              router.push("/login");
            }}
            style={{ width: "100%", padding: 14, borderRadius: 14, border: `2px solid ${C.border}`, background: C.card, color: C.muted, fontWeight: 600, fontSize: 14, cursor: "pointer" }}
          >
            ← {T("मरीज़ लॉगिन पर जाएं", "Go to Patient Login")}
          </button>

          <div style={{ textAlign: "center", marginTop: 24 }}>
            <a href="/terms" style={{ fontSize: 12, color: C.muted, textDecoration: "underline", cursor: "pointer" }}>
              {T("नियम और शर्तें (Terms & Conditions)", "Terms & Conditions")}
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
