"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/useAuth";
import { signIn } from "next-auth/react";
import { useLang } from "@/lib/useLang";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

const C = {
  primary: "#1B6CA8", primaryDark: "#0F4C7A", bg: "#F0F4F8",
  card: "#FFFFFF", text: "#1A2332", muted: "#6B7C93",
  border: "#DDE3EC", orange: "#E67E22", red: "#C0392B", green: "#1E8449",
};

type Step = "credentials" | "otp" | "register" | "forgot_password" | "reset_password";

export default function LoginPage() {
  const router = useRouter();
  const { login, register, isAuthenticated } = useAuth();
  const { lang, setLang, mounted } = useLang();
  const { isOnline } = useOnlineStatus();
  const [step, setStep] = useState<Step>("credentials");

  // Credentials
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // OTP
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpTimer, setOtpTimer] = useState(0);
  const [devOtp, setDevOtp] = useState(""); // only shown in dev without API key

  // Registration
  const [reg, setReg] = useState({ name: "", age: "", gender: "", village: "", conditions: "", bloodGroup: "" });
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Forgot Password
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const t = (hi: string, en: string) => lang === "hi" ? hi : en;

  // Restore registration inputs from localStorage & WhatsApp-like auto-redirect
  useEffect(() => {
    const storedLang = localStorage.getItem("lang") || "hi";
    setLang(storedLang);

    // Prepopulate phone if previously saved
    const lastPhone = typeof window !== "undefined" ? localStorage.getItem("last_login_phone") : null;
    if (lastPhone && !phone) {
      setPhone(lastPhone);
    }

    // If user explicitly clicked Logout, respect their decision and remain on login screen
    if (typeof window !== "undefined" && (sessionStorage.getItem("user_explicitly_logged_out") || localStorage.getItem("user_is_logged_out") === "true")) {
      return;
    }

    // Auto-redirect ONLY if an active cached patient session exists
    const cachedPatient = typeof window !== "undefined" && (localStorage.getItem("cachedPatientUser") || localStorage.getItem("aarogya_user"));
    if (cachedPatient) {
      router.replace("/home");
      return;
    }

    const savedReg = localStorage.getItem("pending_reg");
    if (savedReg) {
      try {
        const parsed = JSON.parse(savedReg);
        if (parsed.reg) setReg(parsed.reg);
        if (parsed.phone) setPhone(parsed.phone);
        if (parsed.password) setPassword(parsed.password);
        if (parsed.step) setStep(parsed.step);
      } catch { }
    }
  }, [router]);

  useEffect(() => {
    if (!isAuthenticated) {
      localStorage.setItem("pending_reg", JSON.stringify({ reg, phone, password, step }));
    }
  }, [reg, phone, password, step, isAuthenticated]);

  // Direct 1-tap offline entrance
  const handleOfflineEnter = async () => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("user_explicitly_logged_out");
      localStorage.removeItem("user_is_logged_out");
    }
    const activePhone = phone.trim().replace(/\D/g, "") || localStorage.getItem("last_login_phone") || "8591292159";
    let name = "Patient";
    let age = 28;
    let gender = "other";
    let village = "Local Area";
    let conditions: string[] = [];
    let bloodGroup = "—";

    try {
      const { getDB } = await import("@/lib/db-offline");
      const db = getDB();
      const local = await db.patients.where("phone").equals(activePhone).first();
      if (local) {
        name = local.name || name;
        age = local.age || age;
        gender = local.gender || gender;
        village = local.village || village;
        conditions = local.conditions ? local.conditions.split(",").map(c => c.trim()).filter(Boolean) : [];
        bloodGroup = local.bloodGroup || bloodGroup;
      }
    } catch {}

    const offlineUser = {
      _id: `offline-${activePhone}`,
      phone: activePhone,
      name,
      age,
      gender,
      village,
      conditions,
      bloodGroup,
      role: "patient",
    };
    localStorage.setItem("cachedPatientUser", JSON.stringify(offlineUser));
    localStorage.setItem("aarogya_user", JSON.stringify(offlineUser));
    localStorage.setItem("patient", JSON.stringify(offlineUser));
    localStorage.setItem("last_login_phone", activePhone);
    localStorage.setItem("last_logged_role", "patient");
    router.replace("/home");
  };

  // Countdown timer for OTP resend
  useEffect(() => {
    if (otpTimer <= 0) return;
    const id = setInterval(() => setOtpTimer(t => t - 1), 1000);
    return () => clearInterval(id);
  }, [otpTimer]);

  // ── Send OTP ─────────────────────────────────────────────────────────────
  const handleSendOtp = async () => {
    setError("");
    if (!phone || phone.length !== 10) {
      setError(t("10 अंकों का फोन नंबर दर्ज करें", "Enter a valid 10-digit number"));
      return;
    }
    if (!password) {
      setError(t("पासवर्ड दर्ज करें", "Enter your password"));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: phone }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setOtpTimer(60);
      setDevOtp(data.devOtp ?? ""); // only present in dev mode
      setStep("otp");
    } catch {
      setError(t("नेटवर्क त्रुटि", "Network error"));
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (loading) return;
    setError("");
    const cleanPhone = phone.trim().replace(/\D/g, "");
    if (!cleanPhone || cleanPhone.length !== 10) {
      // In offline mode, seamlessly open offline home
      if (!navigator.onLine || !isOnline) {
        handleOfflineEnter();
        return;
      }
      setError(t("10 अंकों का फोन नंबर दर्ज करें", "Enter a valid 10-digit number"));
      return;
    }

    // Always remember this phone
    localStorage.setItem("last_login_phone", cleanPhone);
    localStorage.setItem("last_logged_role", "patient");
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("user_explicitly_logged_out");
      localStorage.removeItem("user_is_logged_out");
    }

    // If offline: Direct local login with Dexie / local storage
    if (!navigator.onLine || !isOnline) {
      await handleOfflineEnter();
      return;
    }

    // In online mode: if password is empty, notify user
    if (!password) {
      setError(t("पासवर्ड दर्ज करें", "Enter your password"));
      return;
    }

    setLoading(true);
    try {
      const result = await login(cleanPhone, password);
      if (result.success) {
        if (typeof window !== "undefined") {
          sessionStorage.removeItem("user_explicitly_logged_out");
          localStorage.removeItem("user_is_logged_out");
        }
        localStorage.setItem("last_login_phone", cleanPhone);
        localStorage.setItem("last_logged_role", "patient");
        router.replace("/home");
        return;
      } else {
        setError(result.error || t("लॉगिन विफल", "Login failed"));
        setLoading(false);
      }
    } catch {
      setError(t("नेटवर्क त्रुटि", "Network error"));
      setLoading(false);
    }
  };

  // ── Verify OTP & Login ───────────────────────────────────────────────────
  const handleVerifyAndLogin = async () => {
    setError("");
    const otpValue = otp.join("");
    if (otpValue.length !== 6) {
      setError(t("6 अंकों का OTP दर्ज करें", "Enter the 6-digit OTP"));
      return;
    }
    setLoading(true);
    try {
      // 1. Verify OTP
      const verRes = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp: otpValue }),
      });
      const verData = await verRes.json();
      if (!verRes.ok) { setError(verData.error); setLoading(false); return; }

      // 2. Login with NextAuth
      const result = await login(phone, password);
      if (result.success) {
        localStorage.removeItem("user_is_logged_out");
        if (typeof window !== "undefined") {
          sessionStorage.removeItem("user_explicitly_logged_out");
        }
        router.replace("/home");
        return;
      } else {
        setError(result.error || t("लॉगिन विफल", "Login failed"));
        setLoading(false);
      }
    } catch {
      setError(t("नेटवर्क त्रुटि", "Network error"));
      setLoading(false);
    }
  };

  // ── Register (with OTP verify first) ────────────────────────────────────
  const handleRegisterWithOtp = async () => {
    setError("");
    if (!phone || !password || !reg.name || !reg.age || !reg.gender || !reg.village) {
      setError(t("सभी आवश्यक क्षेत्र भरें", "Fill all required fields"));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: phone }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setOtpTimer(60);
      setDevOtp(data.devOtp ?? "");
      setStep("otp");
    } catch {
      setError(t("नेटवर्क त्रुटि", "Network error"));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndRegister = async () => {
    setError("");
    const otpValue = otp.join("");
    if (otpValue.length !== 6) {
      setError(t("6 अंकों का OTP दर्ज करें", "Enter the 6-digit OTP"));
      return;
    }
    setLoading(true);
    try {
      const verRes = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp: otpValue }),
      });
      const verData = await verRes.json();
      if (!verRes.ok) { setError(verData.error); setLoading(false); return; }

      const result = await register(
        phone, password, reg.name, reg.age, reg.gender,
        reg.village, reg.conditions, reg.bloodGroup
      );
      if (result.success) {
        localStorage.removeItem("user_is_logged_out");
        if (typeof window !== "undefined") {
          sessionStorage.removeItem("user_explicitly_logged_out");
        }
        router.replace("/home");
        return;
      } else {
        setError(result.error || t("पंजीकरण विफल", "Registration failed"));
        setLoading(false);
      }
    } catch {
      setError(t("नेटवर्क त्रुटि", "Network error"));
      setLoading(false);
    }
  };

  // ── Forgot Password Flow ───────────────────────────────────────────────
  const handleForgotPasswordSendOtp = async () => {
    setError("");
    if (!phone || phone.length !== 10) {
      setError(t("10 अंकों का फोन नंबर दर्ज करें", "Enter a valid 10-digit number"));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: phone }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setOtpTimer(60);
      setDevOtp(data.devOtp ?? "");
      setStep("reset_password");
    } catch {
      setError(t("नेटवर्क त्रुटि", "Network error"));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setError("");
    const otpValue = otp.join("");
    if (otpValue.length !== 6) {
      setError(t("6 अंकों का OTP दर्ज करें", "Enter the 6-digit OTP"));
      return;
    }
    if (newPassword.length < 6) {
      setError(t("पासवर्ड कम से कम 6 अक्षरों का होना चाहिए", "Password must be at least 6 characters"));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: phone, role: "patient", otp: otpValue, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setStep("credentials");
        setPassword("");
        setNewPassword("");
        setOtp(["", "", "", "", "", ""]);
        alert(t("पासवर्ड सफलतापूर्वक बदल दिया गया!", "Password reset successfully!"));
      } else {
        setError(data.error || t("पासवर्ड रीसेट विफल", "Password reset failed"));
      }
    } catch {
      setError(t("नेटवर्क त्रुटि", "Network error"));
    } finally {
      setLoading(false);
    }
  };

  const isRegisterFlow = step === "register" || (step === "otp" && !!reg.name);
  const isResetFlow = step === "reset_password";

  return (
    <div style={{ background: "#0d1520", minHeight: "100vh", display: "flex", justifyContent: "center" }}>
      <div style={{ width: 390, background: C.bg, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <div style={{ background: `linear-gradient(135deg,${C.primary},${C.primaryDark})`, padding: "26px 20px 18px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <img src="/icon-192.png" alt="Aarogya AI" style={{ width: 32, height: 32, objectFit: "contain", borderRadius: 8 }} />
            <span style={{ fontSize: 18, fontWeight: 900, color: "white", letterSpacing: 0.5 }}>AAROGYA.AI</span>
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "white", lineHeight: 1.2, margin: "6px 0 2px" }}>
            {step === "otp"
              ? t("OTP सत्यापन", "OTP Verification")
              : step === "register"
                ? t("नया खाता बनाएं", "Create Account")
                : t("मरीज़ लॉगिन", "Patient Sign In")}
          </h2>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,.8)", margin: 0 }}>
            {step === "otp"
              ? t(`+91 ${phone} पर OTP भेजा गया`, `OTP sent to +91 ${phone}`)
              : t("आगे बढ़ने के लिए अपना फ़ोन नंबर दर्ज करें", "Enter your mobile number to continue")}
          </p>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "18px 16px" }}>

          {error && (
            <div style={{ background: "#FADBD8", borderRadius: 10, padding: "12px", marginBottom: 14, border: `1px solid ${C.red}`, fontSize: 13, color: C.red }}>
              {error}
            </div>
          )}

          {/* ── STEP 1: Credentials ───────────────────────────── */}
          {step === "credentials" && (
            <>
              {/* Phone */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 6, display: "block" }}>
                  {t("मोबाइल नंबर", "Mobile Number")}
                </label>
                <div style={{ display: "flex", alignItems: "stretch", border: `2px solid ${C.border}`, borderRadius: 14, overflow: "hidden", background: C.card }}>
                  <div style={{ display: "flex", alignItems: "center", background: C.bg, padding: "0 16px", fontSize: 15, fontWeight: 700, color: C.muted, borderRight: `2px solid ${C.border}` }}>+91</div>
                  <input
                    style={{ flex: 1, border: "none", outline: "none", fontSize: 16, fontWeight: 700, padding: "14px 16px", background: "transparent", color: C.text, letterSpacing: 1 }}
                    type="tel" value={phone}
                    onChange={e => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    maxLength={10} disabled={loading} placeholder="0000000000"
                  />
                </div>
              </div>

              {/* Password */}
              <div style={{ marginBottom: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: C.text, display: "block" }}>
                    {t("पासवर्ड", "Password")}
                  </label>
                  <button type="button" onClick={() => { setStep("forgot_password"); setError(""); setOtpTimer(0); setDevOtp(""); }} style={{ background: "none", border: "none", padding: 0, color: C.primary, fontSize: 12, fontWeight: 600, cursor: "pointer", textDecoration: "underline" }}>
                    {t("भूल गए?", "Forgot?")}
                  </button>
                </div>
                <div style={{ position: "relative" }}>
                  <input
                    style={{ width: "100%", padding: "14px 40px 14px 16px", border: `2px solid ${C.border}`, borderRadius: 14, fontSize: 15, fontFamily: "inherit", background: C.card, color: C.text, outline: "none", boxSizing: "border-box" }}
                    type={showPassword ? "text" : "password"} value={password}
                    onChange={e => setPassword(e.target.value)}
                    disabled={loading} placeholder={t("अपना पासवर्ड दर्ज करें", "Enter your password")}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: C.muted, cursor: "pointer", display: "flex", alignItems: "center" }}>
                    {showPassword ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" y1="2" x2="22" y2="22"/></svg>
                    )}
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogin}
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "16px 24px",
                  borderRadius: 14,
                  border: "none",
                  cursor: loading ? "not-allowed" : "pointer",
                  fontWeight: 700,
                  fontSize: 16,
                  background: `linear-gradient(135deg,${C.primary},${C.primaryDark})`,
                  color: "white",
                  boxShadow: "0 4px 16px rgba(27,108,168,.4)",
                  opacity: loading ? 0.75 : 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                {loading ? (
                  <>
                    <div style={{ width: 18, height: 18, border: "2.5px solid rgba(255,255,255,0.4)", borderTop: "2.5px solid white", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                    <span>{t("लॉगिन हो रहा है...", "Signing in...")}</span>
                  </>
                ) : (
                  t("लॉगिन करें", "Sign In")
                )}
              </button>

              <button onClick={() => { setStep("register"); setError(""); }} disabled={loading} style={{ background: "none", border: "none", color: C.primary, fontSize: 13, fontWeight: 700, cursor: "pointer", marginTop: 14, display: "block", width: "100%", textAlign: "center" }}>
                {t("नया खाता बनाएं", "Don't have an account? Sign Up")}
              </button>
            </>
          )}

          {/* ── STEP: Forgot Password Phone Input ──────────────────────── */}
          {step === "forgot_password" && (
            <>
              <div style={{ background: "#FEF9E7", borderRadius: 10, padding: "9px 12px", marginBottom: 12, border: "1px solid #F4D03F", fontSize: 13, color: "#7D6608" }}>
                {t("अपना मोबाइल नंबर दर्ज करें। हम आपको एक OTP भेजेंगे।", "Enter your mobile number. We'll send you an OTP.")}
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 6, display: "block" }}>📱 {t("मोबाइल नंबर", "Mobile Number")}</label>
                <div style={{ display: "flex", alignItems: "stretch", border: `2px solid ${C.border}`, borderRadius: 14, overflow: "hidden", background: C.card }}>
                  <div style={{ display: "flex", alignItems: "center", background: C.bg, padding: "0 16px", fontSize: 16, fontWeight: 700, color: C.muted, borderRight: `2px solid ${C.border}` }}>+91</div>
                  <input style={{ flex: 1, border: "none", outline: "none", fontSize: 16, fontWeight: 700, padding: "14px 16px", background: "transparent", color: C.text, letterSpacing: 1 }} type="tel" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} maxLength={10} disabled={loading} placeholder="0000000000" />
                </div>
              </div>

              <button onClick={handleForgotPasswordSendOtp} disabled={loading || phone.length !== 10} style={{ width: "100%", padding: "16px 24px", borderRadius: 14, border: "none", cursor: (loading || phone.length !== 10) ? "not-allowed" : "pointer", fontWeight: 700, fontSize: 16, background: (loading || phone.length !== 10) ? "#ccc" : `linear-gradient(135deg,${C.primary},${C.primaryDark})`, color: "white" }}>
                {loading ? "..." : `📲 ${t("OTP भेजें", "Send OTP")}`}
              </button>

              <button onClick={() => { setStep("credentials"); setError(""); }} disabled={loading} style={{ background: "none", border: "none", color: C.primary, fontSize: 13, fontWeight: 600, cursor: "pointer", textDecoration: "underline", marginTop: 10, display: "block", width: "100%", textAlign: "center" }}>
                ← {t("वापस लॉगिन पर जाएं", "Back to Login")}
              </button>
            </>
          )}

          {/* ── STEP 2: OTP Entry / Reset Password ─────────────────────────────── */}
          {(step === "otp" || step === "reset_password") && (
            <>
              <h2 style={{ textAlign: "center", color: C.text, marginBottom: 8, fontSize: 24, fontWeight: 800 }}>
                {isResetFlow ? t("नया पासवर्ड", "Reset Password") : t("सत्यापन", "Verification")}
              </h2>
              <p style={{ textAlign: "center", color: C.muted, marginBottom: 24, fontSize: 15 }}>
                {t(`हमने +91 ${phone} पर एक OTP भेजा है`, `We sent an OTP to +91 ${phone}`)}
              </p>

              {/* 6-box OTP input */}
              <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 20 }}>
                {otp.map((d, i) => (
                  <input
                    key={i}
                    id={`otp-${i}`}
                    style={{ width: 48, height: 56, borderRadius: 12, border: `2px solid ${d ? C.primary : C.border}`, background: C.card, textAlign: "center", fontSize: 22, fontWeight: 800, color: C.text, outline: "none", transition: "border-color .2s" }}
                    type="tel" inputMode="numeric" maxLength={1} value={d}
                    onChange={e => {
                      if (!/^\d?$/.test(e.target.value)) return;
                      const next = [...otp];
                      next[i] = e.target.value;
                      setOtp(next);
                      if (e.target.value && i < 5) {
                        document.getElementById(`otp-${i + 1}`)?.focus();
                      }
                    }}
                    onKeyDown={e => {
                      if (e.key === "Backspace" && !otp[i] && i > 0) {
                        document.getElementById(`otp-${i - 1}`)?.focus();
                      }
                    }}
                  />
                ))}
              </div>

              {/* Dev OTP hint */}
              {devOtp && (
                <div style={{ background: "#FEF9E7", borderRadius: 10, padding: "10px 14px", marginBottom: 14, border: "1px solid #F4D03F", fontSize: 13, color: "#7D6608", textAlign: "center" }}>
                  🛠 Dev mode — OTP: <strong>{devOtp}</strong>
                </div>
              )}

              {isResetFlow && (
                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 6, display: "block" }}>🔐 {t("नया पासवर्ड", "New Password")}</label>
                  <div style={{ display: "flex", border: `2px solid ${C.border}`, borderRadius: 12, overflow: "hidden", background: C.card }}>
                    <input style={{ flex: 1, border: "none", outline: "none", fontSize: 15, padding: "12px 14px", background: "transparent", color: C.text }} type={showNewPassword ? "text" : "password"} value={newPassword} onChange={e => setNewPassword(e.target.value)} disabled={loading} placeholder={t("नया पासवर्ड दर्ज करें", "Enter new password")} />
                    <button type="button" onClick={() => setShowNewPassword(s => !s)} style={{ background: "none", border: "none", padding: "0 14px", cursor: "pointer", display: "flex", alignItems: "center", color: C.muted }}>
                      {showNewPassword ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" y1="2" x2="22" y2="22"/></svg>
                      )}
                    </button>
                  </div>
                </div>
              )}

              <button
                onClick={isResetFlow ? handleResetPassword : (isRegisterFlow ? handleVerifyAndRegister : handleVerifyAndLogin)}
                disabled={loading || otp.join("").length !== 6 || (isResetFlow && newPassword.length < 6)}
                style={{ width: "100%", padding: "16px", borderRadius: 14, border: "none", cursor: loading ? "not-allowed" : "pointer", fontWeight: 700, fontSize: 16, background: `linear-gradient(135deg,${C.primary},${C.primaryDark})`, color: "white", opacity: (loading || otp.join("").length !== 6) ? 0.6 : 1, marginBottom: 12 }}
              >
                {loading ? "..." : `✓ ${isResetFlow ? t("पासवर्ड रीसेट करें", "Reset Password") : t("सत्यापित करें", "Verify & Continue")}`}
              </button>

              {/* Resend */}
              <div style={{ textAlign: "center" }}>
                {otpTimer > 0 ? (
                  <p style={{ fontSize: 13, color: C.muted }}>
                    {t(`${otpTimer}s में पुनः भेजें`, `Resend in ${otpTimer}s`)}
                  </p>
                ) : (
                  <button
                    onClick={isResetFlow ? handleForgotPasswordSendOtp : (isRegisterFlow ? handleRegisterWithOtp : handleSendOtp)}
                    disabled={loading}
                    style={{ background: "none", border: "none", color: C.primary, fontSize: 13, fontWeight: 600, cursor: "pointer", textDecoration: "underline" }}
                  >
                    🔄 {t("OTP पुनः भेजें", "Resend OTP")}
                  </button>
                )}
              </div>

              <button onClick={() => { setStep(isRegisterFlow ? "register" : "credentials"); setOtp(["", "", "", "", "", ""]); setError(""); }} style={{ background: "none", border: "none", color: C.muted, fontSize: 13, cursor: "pointer", textDecoration: "underline", marginTop: 8, display: "block", width: "100%", textAlign: "center" }}>
                ← {t("वापस लॉगिन पर जाएं", "Back to Login")}
              </button>
            </>
          )}

          {/* ── STEP: Forgot Password Phone Input ──────────────────────── */}
          {step === "forgot_password" && (
            <>
              <div style={{ background: "#FEF9E7", borderRadius: 10, padding: "9px 12px", marginBottom: 12, border: "1px solid #F4D03F", fontSize: 13, color: "#7D6608" }}>
                {t("अपना मोबाइल नंबर दर्ज करें। हम आपको एक OTP भेजेंगे।", "Enter your mobile number. We'll send you an OTP.")}
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 6, display: "block" }}>📱 {t("मोबाइल नंबर", "Mobile Number")}</label>
                <div style={{ display: "flex", alignItems: "center", border: `2px solid ${C.border}`, borderRadius: 14, overflow: "hidden", background: C.card }}>
                  <span style={{ background: C.bg, padding: "14px", fontSize: 15, fontWeight: 700, color: C.muted, borderRight: `2px solid ${C.border}` }}>+91</span>
                  <input style={{ flex: 1, border: "none", outline: "none", fontSize: 18, fontWeight: 700, padding: "14px", background: "transparent", color: C.text }} type="tel" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} maxLength={10} disabled={loading} placeholder="0000000000" />
                </div>
              </div>

              <button onClick={handleForgotPasswordSendOtp} disabled={loading || phone.length !== 10} style={{ width: "100%", padding: "16px 24px", borderRadius: 14, border: "none", cursor: (loading || phone.length !== 10) ? "not-allowed" : "pointer", fontWeight: 700, fontSize: 16, background: (loading || phone.length !== 10) ? "#ccc" : `linear-gradient(135deg,${C.primary},${C.primaryDark})`, color: "white" }}>
                {loading ? "..." : `📲 ${t("OTP भेजें", "Send OTP")}`}
              </button>

              <button onClick={() => { setStep("credentials"); setError(""); }} disabled={loading} style={{ background: "none", border: "none", color: C.primary, fontSize: 13, fontWeight: 600, cursor: "pointer", textDecoration: "underline", marginTop: 10, display: "block", width: "100%", textAlign: "center" }}>
                ← {t("वापस लॉगिन पर जाएं", "Back to Login")}
              </button>
            </>
          )}

          {/* ── STEP 3: Register Form ─────────────────────────────── */}
          {step === "register" && (
            <>
              <div style={{ background: "#FEF9E7", borderRadius: 10, padding: "9px 12px", marginBottom: 12, border: "1px solid #F4D03F", fontSize: 13, color: "#7D6608" }}>
                {t("✨ नया खाता बनाएं", "✨ Create New Account")}
              </div>

              {/* Phone */}
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 6, display: "block" }}>📱 {t("मोबाइल नंबर", "Mobile Number")}</label>
                <div style={{ display: "flex", alignItems: "stretch", border: `2px solid ${C.border}`, borderRadius: 12, overflow: "hidden", background: C.card }}>
                  <div style={{ display: "flex", alignItems: "center", background: C.bg, padding: "0 14px", fontSize: 16, fontWeight: 700, color: C.muted, borderRight: `2px solid ${C.border}` }}>+91</div>
                  <input style={{ flex: 1, border: "none", outline: "none", fontSize: 16, fontWeight: 700, padding: "12px 14px", background: "transparent", color: C.text, letterSpacing: 1 }} type="tel" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} maxLength={10} disabled={loading} placeholder="0000000000" />
                </div>
              </div>

              {/* Password */}
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 6, display: "block" }}>🔐 {t("पासवर्ड", "Password")}</label>
                <div style={{ display: "flex", border: `2px solid ${C.border}`, borderRadius: 12, overflow: "hidden", background: C.card }}>
                  <input style={{ flex: 1, border: "none", outline: "none", fontSize: 15, padding: "12px 14px", background: "transparent", color: C.text }} type={showRegPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} disabled={loading} placeholder={t("पासवर्ड बनाएं", "Create a password")} />
                  <button type="button" onClick={() => setShowRegPassword(s => !s)} style={{ background: "none", border: "none", padding: "0 14px", cursor: "pointer", display: "flex", alignItems: "center", color: C.muted }}>
                    {showRegPassword ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" /><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" /><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" /><line x1="2" y1="2" x2="22" y2="22" /></svg>
                    )}
                  </button>
                </div>
              </div>

              {[
                { key: "name", label: t("👤 पूरा नाम", "👤 Full Name"), ph: t("आपका नाम", "Your name"), type: "text" },
                { key: "age", label: t("🎂 उम्र", "🎂 Age"), ph: "25", type: "number" },
                { key: "village", label: t("🏘️ गाँव", "🏘️ Village"), ph: t("आपका गाँव", "Your village"), type: "text" },
                { key: "conditions", label: t("💊 पुरानी बीमारियाँ", "💊 Existing Conditions"), ph: t("डायबिटीज़, BP...", "Diabetes, BP..."), type: "text" },
                { key: "bloodGroup", label: t("🩸 रक्त समूह", "🩸 Blood Group"), ph: "B+", type: "text" },
              ].map(f => (
                <div key={f.key} style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 6, display: "block" }}>{f.label}</label>
                  <input style={{ width: "100%", padding: "12px 14px", border: `2px solid ${C.border}`, borderRadius: 12, fontSize: 15, fontFamily: "inherit", background: C.card, color: C.text, outline: "none", boxSizing: "border-box" }} type={f.type} placeholder={f.ph} value={reg[f.key as keyof typeof reg]} onChange={e => setReg({ ...reg, [f.key]: e.target.value })} disabled={loading} />
                </div>
              ))}

              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 6, display: "block" }}>⚧ {t("लिंग", "Gender")}</label>
                <select style={{ width: "100%", padding: "12px 14px", border: `2px solid ${C.border}`, borderRadius: 12, fontSize: 15, fontFamily: "inherit", background: C.card, color: C.text, outline: "none", appearance: "none" }} value={reg.gender} onChange={e => setReg({ ...reg, gender: e.target.value })} disabled={loading}>
                  <option value="">{t("चुनें", "Select")}</option>
                  <option value="female">{t("महिला", "Female")}</option>
                  <option value="male">{t("पुरुष", "Male")}</option>
                  <option value="other">{t("अन्य", "Other")}</option>
                </select>
              </div>

              <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 16 }}>
                <input
                  type="checkbox"
                  id="accept-terms"
                  checked={acceptTerms}
                  onChange={e => setAcceptTerms(e.target.checked)}
                  style={{ width: 18, height: 18, cursor: "pointer", marginTop: 2 }}
                />
                <label htmlFor="accept-terms" style={{ fontSize: 12, color: C.text, cursor: "pointer", lineHeight: 1.4 }}>
                  {t("मैं नियम और शर्तों को स्वीकार करता हूँ। ", "I accept the ")}
                  <a href="/terms?closeable=true" target="_blank" rel="noopener noreferrer" style={{ color: C.primary, fontWeight: 700, textDecoration: "underline" }}>
                    {t("नियम और शर्तें पढ़ें", "Terms & Conditions")}
                  </a>
                </label>
              </div>

              <button onClick={handleRegisterWithOtp} disabled={loading || !acceptTerms} style={{ width: "100%", padding: "16px", borderRadius: 14, border: "none", cursor: (loading || !acceptTerms) ? "not-allowed" : "pointer", fontWeight: 700, fontSize: 16, background: (loading || !acceptTerms) ? "#ccc" : `linear-gradient(135deg,${C.primary},${C.primaryDark})`, color: "white", opacity: (loading || !acceptTerms) ? 0.6 : 1 }}>
                {loading ? "..." : `📲 ${t("OTP से सत्यापित करें", "Verify with OTP")}`}
              </button>

              <button onClick={() => { setStep("credentials"); setError(""); }} disabled={loading} style={{ background: "none", border: "none", color: C.primary, fontSize: 13, fontWeight: 600, cursor: "pointer", textDecoration: "underline", marginTop: 10, display: "block", width: "100%", textAlign: "center" }}>
                ← {t("वापस", "Go Back")}
              </button>
            </>
          )}

          {/* Divider + other logins (only on credentials step) */}
          {step === "credentials" && (
            <>
              <div style={{ height: 1, background: C.border, margin: "20px 0" }} />

              {/* Google Login */}
              <button
                onClick={() => signIn("google", { callbackUrl: "/home" })}
                disabled={loading}
                style={{ width: "100%", padding: "14px", borderRadius: 14, border: `2px solid ${C.border}`, background: C.card, color: C.text, fontWeight: 700, fontSize: 14, cursor: "pointer", marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}
              >
                <svg width="20" height="20" viewBox="0 0 48 48">
                  <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
                  <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
                  <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
                  <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
                </svg>
                {t("Google से लॉगिन करें", "Continue with Google")}
              </button>

              <div style={{ height: 1, background: C.border, margin: "14px 0" }} />

              <p style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5, textAlign: "center", marginBottom: 12 }}>
                {t("अन्य पोर्टल", "Other Portals")}
              </p>
              <button onClick={() => router.push("/doctor/login")} disabled={loading} style={{ width: "100%", padding: "12px", borderRadius: 12, border: `1.5px solid ${C.border}`, background: C.card, color: C.primary, fontWeight: 700, fontSize: 14, cursor: "pointer", marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                {t("डॉक्टर पोर्टल", "Doctor Portal")}
              </button>
              <button onClick={() => router.push("/asha/login")} disabled={loading} style={{ width: "100%", padding: "12px", borderRadius: 12, border: `1.5px solid ${C.border}`, background: C.card, color: C.primary, fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                {t("आशा कार्यकर्ता पोर्टल", "ASHA Worker Portal")}
              </button>
            </>
          )}
          {step === "credentials" && (
            <div style={{ textAlign: "center", marginTop: 24, paddingBottom: 24 }}>
              <a href="/terms?closeable=true" target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: C.muted, textDecoration: "underline", cursor: "pointer" }}>
                {t("नियम और शर्तें", "Terms & Conditions")}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
