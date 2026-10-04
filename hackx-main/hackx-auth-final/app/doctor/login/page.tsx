"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";

type Step = "credentials" | "forgot_password" | "otp" | "reset_password";

export default function DoctorLoginPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [step, setStep] = useState<Step>("credentials");
  
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showDocPass, setShowDocPass] = useState(false);
  
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [devOtp, setDevOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "doctor") {
      router.replace("/doctor/dashboard");
    }
  }, [status, session, router]);

  const handleLogin = async () => {
    if (!email || !password) { setError("Please fill all fields"); return; }
    setLoading(true); setError("");

    const res = await signIn("doctor-credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);
    if (res?.ok) {
      if (typeof window !== "undefined") {
        localStorage.setItem("last_logged_role", "doctor");
        localStorage.setItem("cachedDoctorUser", JSON.stringify({ email }));
      }
      router.push("/doctor/dashboard");
    } else {
      setError(res?.error ?? "Invalid email or password");
    }
  };

  const handleForgotPasswordSendOtp = async () => {
    setError("");
    if (!email) {
      setError("Enter your email address");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: email }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setDevOtp(data.devOtp ?? "");
      setStep("otp");
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = () => {
    const otpValue = otp.join("");
    if (otpValue.length !== 6) {
      setError("Enter the 6-digit OTP");
      return;
    }
    setError("");
    setStep("reset_password");
  };

  const handleResetPassword = async () => {
    setError("");
    const otpValue = otp.join("");
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: email, role: "doctor", otp: otpValue, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setStep("credentials");
        setPassword("");
        setNewPassword("");
        setOtp(["", "", "", "", "", ""]);
        alert("Password reset successfully!");
      } else {
        setError(data.error || "Password reset failed");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: "radial-gradient(circle at 50% 0%, #1A2332 0%, #0F172A 100%)", minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", position: "relative", overflow: "hidden" }}>
      {/* Animated Mesh Background Elements */}
      <div style={{ position: "absolute", width: 400, height: 400, background: "radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%)", top: "-5%", left: "30%", borderRadius: "50%", filter: "blur(40px)" }} />
      <div style={{ position: "absolute", width: 500, height: 500, background: "radial-gradient(circle, rgba(2, 132, 199, 0.15) 0%, transparent 70%)", bottom: "-10%", right: "20%", borderRadius: "50%", filter: "blur(50px)" }} />
      
      <div style={{ width: "100%", maxWidth: 420, margin: "0 20px", background: "rgba(255, 255, 255, 0.05)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", borderRadius: 28, padding: "48px 36px", boxSizing: "border-box", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.1)", zIndex: 10 }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ width: 64, height: 64, borderRadius: 20, background: "linear-gradient(135deg, rgba(15,118,110,0.8), rgba(2,132,199,0.8))", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", boxShadow: "0 10px 20px -5px rgba(2, 132, 199, 0.5), inset 0 0 10px rgba(255,255,255,0.2)" }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
          </div>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: "white", margin: 0, letterSpacing: "-0.5px" }}>Clinical Portal</h2>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,.6)", marginTop: 8, fontWeight: 500 }}>AarogyaAI Staff Login</p>
        </div>

        {error && (
          <div style={{ background: "rgba(239, 68, 68, 0.15)", borderRadius: 12, padding: "12px", marginBottom: 24, fontSize: 14, color: "#FECACA", fontWeight: 600, border: "1px solid rgba(239, 68, 68, 0.3)", textAlign: "center" }}>
            {error}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          
          {step === "credentials" && (
            <>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.8)", display: "block", marginBottom: 8 }}>Email or Employee ID</label>
                <input
                  style={{ width: "100%", padding: "16px 16px", border: `1px solid rgba(255,255,255,0.2)`, borderRadius: 14, fontSize: 15, fontFamily: "inherit", background: "rgba(0,0,0,0.2)", color: "white", outline: "none", boxSizing: "border-box", transition: "all 0.2s" }}
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(""); }}
                  type="email"
                  placeholder="dr.smith@aarogya.ai"
                />
              </div>

              <div style={{ position: "relative" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.8)", display: "block" }}>Secure Password</label>
                  <button type="button" onClick={() => { setStep("forgot_password"); setError(""); }} style={{ background: "none", border: "none", padding: 0, color: "#38bdf8", fontSize: 12, fontWeight: 600, cursor: "pointer", textDecoration: "underline" }}>
                    Forgot?
                  </button>
                </div>
                <input
                  style={{ width: "100%", padding: "16px 44px 16px 16px", border: `1px solid rgba(255,255,255,0.2)`, borderRadius: 14, fontSize: 15, fontFamily: "inherit", background: "rgba(0,0,0,0.2)", color: "white", outline: "none", boxSizing: "border-box", transition: "all 0.2s" }}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(""); }}
                  type={showDocPass ? "text" : "password"}
                  placeholder="••••••••"
                />
                <button 
                  type="button"
                  onClick={() => setShowDocPass(!showDocPass)}
                  style={{ position: "absolute", right: 16, top: 40, background: "transparent", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer", display: "flex", alignItems: "center" }}
                >
                  {showDocPass ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" y1="2" x2="22" y2="22"/></svg>
                  )}
                </button>
              </div>

              <button onClick={handleLogin} disabled={loading} style={{ width: "100%", padding: 18, borderRadius: 14, border: "none", cursor: loading ? "not-allowed" : "pointer", fontWeight: 800, fontSize: 16, background: "white", color: "#0F172A", opacity: loading ? 0.7 : 1, marginTop: 12 }}>
                {loading ? "Authenticating..." : "Access Dashboard"}
              </button>
            </>
          )}

          {step === "forgot_password" && (
            <>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.8)", display: "block", marginBottom: 8 }}>Email Address</label>
                <input
                  style={{ width: "100%", padding: "16px 16px", border: `1px solid rgba(255,255,255,0.2)`, borderRadius: 14, fontSize: 15, fontFamily: "inherit", background: "rgba(0,0,0,0.2)", color: "white", outline: "none", boxSizing: "border-box" }}
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(""); }}
                  type="email"
                  placeholder="dr.smith@aarogya.ai"
                />
              </div>

              <button onClick={handleForgotPasswordSendOtp} disabled={loading || !email} style={{ width: "100%", padding: 18, borderRadius: 14, border: "none", cursor: loading ? "not-allowed" : "pointer", fontWeight: 800, fontSize: 16, background: "white", color: "#0F172A", marginTop: 12 }}>
                {loading ? "Sending..." : "Send Reset OTP"}
              </button>

              <button onClick={() => setStep("credentials")} disabled={loading} style={{ width: "100%", padding: 14, borderRadius: 14, border: `1px solid rgba(255,255,255,0.1)`, background: "transparent", color: "rgba(255,255,255,0.6)", fontWeight: 600, fontSize: 14, cursor: "pointer", marginTop: 8 }}>
                Back to Login
              </button>
            </>
          )}

          {step === "otp" && (
            <>
              <p style={{ textAlign: "center", color: "rgba(255,255,255,0.8)", fontSize: 14, marginBottom: 10 }}>We sent a code to {email}</p>
              
              <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 20 }}>
                {otp.map((d, i) => (
                  <input
                    key={i} id={`otp-${i}`}
                    style={{ width: 44, height: 50, borderRadius: 12, border: "1px solid rgba(255,255,255,0.3)", background: "rgba(0,0,0,0.3)", textAlign: "center", fontSize: 20, fontWeight: 700, color: "white", outline: "none" }}
                    type="tel" maxLength={1} value={d}
                    onChange={e => {
                      if (!/^\d?$/.test(e.target.value)) return;
                      const next = [...otp]; next[i] = e.target.value; setOtp(next);
                      if (e.target.value && i < 5) document.getElementById(`otp-${i + 1}`)?.focus();
                    }}
                    onKeyDown={e => {
                      if (e.key === "Backspace" && !otp[i] && i > 0) document.getElementById(`otp-${i - 1}`)?.focus();
                    }}
                  />
                ))}
              </div>

              {devOtp && (
                <div style={{ background: "rgba(245, 158, 11, 0.2)", borderRadius: 10, padding: 10, fontSize: 13, color: "#FCD34D", textAlign: "center", border: "1px solid rgba(245, 158, 11, 0.3)", marginBottom: 10 }}>
                  🛠 Dev OTP: <strong>{devOtp}</strong>
                </div>
              )}

              <button onClick={handleVerifyOtp} disabled={loading || otp.join("").length !== 6} style={{ width: "100%", padding: 18, borderRadius: 14, border: "none", cursor: loading ? "not-allowed" : "pointer", fontWeight: 800, fontSize: 16, background: "white", color: "#0F172A" }}>
                Verify OTP
              </button>

              <button onClick={() => setStep("forgot_password")} disabled={loading} style={{ width: "100%", padding: 14, borderRadius: 14, border: `1px solid rgba(255,255,255,0.1)`, background: "transparent", color: "rgba(255,255,255,0.6)", fontWeight: 600, fontSize: 14, cursor: "pointer", marginTop: 8 }}>
                Back
              </button>
            </>
          )}

          {step === "reset_password" && (
            <>
              <div style={{ position: "relative", marginBottom: 20 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.8)", display: "block", marginBottom: 8 }}>New Password</label>
                <input
                  style={{ width: "100%", padding: "16px 44px 16px 16px", border: `1px solid rgba(255,255,255,0.2)`, borderRadius: 14, fontSize: 15, fontFamily: "inherit", background: "rgba(0,0,0,0.2)", color: "white", outline: "none", boxSizing: "border-box" }}
                  value={newPassword}
                  onChange={e => { setNewPassword(e.target.value); setError(""); }}
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Enter new password"
                />
                <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} style={{ position: "absolute", right: 16, top: 40, background: "transparent", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer" }}>
                  {showNewPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" y1="2" x2="22" y2="22"/></svg>
                  )}
                </button>
              </div>

              <button onClick={handleResetPassword} disabled={loading || newPassword.length < 6} style={{ width: "100%", padding: 18, borderRadius: 14, border: "none", cursor: loading ? "not-allowed" : "pointer", fontWeight: 800, fontSize: 16, background: "white", color: "#0F172A" }}>
                {loading ? "Resetting..." : "Save New Password"}
              </button>
            </>
          )}

          {step === "credentials" && (
            <button
              onClick={() => router.push("/login")}
              style={{ width: "100%", padding: 14, borderRadius: 14, border: `1px solid rgba(255,255,255,0.1)`, background: "transparent", color: "rgba(255,255,255,0.6)", fontWeight: 600, fontSize: 14, cursor: "pointer", marginTop: 8 }}
            >
              Switch to Patient Portal
            </button>
          )}

          <div style={{ textAlign: "center", marginTop: 24 }}>
            <a href="/terms" style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", textDecoration: "underline", cursor: "pointer" }}>
              Terms & Conditions
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}