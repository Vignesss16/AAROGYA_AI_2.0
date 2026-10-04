"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { seedOfflineData } from "@/lib/db-offline";

export default function SplashPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [checking, setChecking] = useState(true);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // Seed offline DB on load
    seedOfflineData().catch(console.error);

    if (typeof window !== "undefined") {
      setIsOffline(!navigator.onLine);
      const handleOnline = () => setIsOffline(false);
      const handleOffline = () => setIsOffline(true);
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);

      // Preload routes
      try {
        router.prefetch("/home");
        router.prefetch("/login");
        router.prefetch("/asha/dashboard");
      } catch {}

      // WhatsApp-like auto-login check across all storage keys:
      const lastRole = localStorage.getItem("last_logged_role");

      // 1. Check ASHA worker cached session
      const cachedAsha = localStorage.getItem("cachedAshaUser") || localStorage.getItem("asha_user") || localStorage.getItem("ashaworker");
      if (cachedAsha || lastRole === "ashaworker" || lastRole === "asha") {
        router.replace("/asha/dashboard");
        return;
      }

      // 2. Check Doctor cached session
      const cachedDoc = localStorage.getItem("cachedDoctorUser") || localStorage.getItem("doctor_user");
      if (cachedDoc || lastRole === "doctor") {
        router.replace("/doctor/dashboard");
        return;
      }

      // 3. Check Pharmacist cached session
      const cachedPharm = localStorage.getItem("pharmacist");
      if (cachedPharm || lastRole === "pharmacist") {
        router.replace("/pharmacist");
        return;
      }

      // 4. Check Patient cached session or previously logged in patient
      const cachedPatient = localStorage.getItem("cachedPatientUser") || localStorage.getItem("aarogya_user") || localStorage.getItem("patient");
      const lastPhone = localStorage.getItem("last_login_phone");
      if (cachedPatient || lastRole === "patient" || lastPhone) {
        router.replace("/home");
        return;
      }

      // 5. If device is currently OFFLINE:
      // Go straight to /home to access offline medical services without network errors
      if (!navigator.onLine) {
        router.replace("/home");
        return;
      }

      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }

    // 6. Online NextAuth session check
    if (status === "authenticated" && session?.user) {
      if ((session.user as any).role === "ashaworker") {
        router.replace("/asha/dashboard");
        return;
      }
      if ((session.user as any).role === "doctor") {
        router.replace("/doctor/dashboard");
        return;
      }
      router.replace("/home");
      return;
    }

    if (status !== "loading") {
      setChecking(false);
    }
  }, [session, status, router]);

  const handleSelectLanguage = (lang: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("lang", lang);

      const lastRole = localStorage.getItem("last_logged_role");

      const cachedAsha = localStorage.getItem("cachedAshaUser") || localStorage.getItem("asha_user") || localStorage.getItem("ashaworker");
      if (cachedAsha || lastRole === "ashaworker" || lastRole === "asha") {
        router.push("/asha/dashboard");
        return;
      }

      const cachedDoc = localStorage.getItem("cachedDoctorUser") || localStorage.getItem("doctor_user");
      if (cachedDoc || lastRole === "doctor") {
        router.push("/doctor/dashboard");
        return;
      }

      const cachedPharm = localStorage.getItem("pharmacist");
      if (cachedPharm || lastRole === "pharmacist") {
        router.push("/pharmacist");
        return;
      }

      const cachedPatient = localStorage.getItem("cachedPatientUser") || localStorage.getItem("aarogya_user") || localStorage.getItem("patient");
      const lastPhone = localStorage.getItem("last_login_phone");
      if (cachedPatient || lastRole === "patient" || lastPhone || !navigator.onLine) {
        router.push("/home");
        return;
      }

      // If online and unauthenticated: route to /login
      router.push("/login");
    }
  };

  if (checking) {
    return (
      <div style={{
        background: "linear-gradient(145deg, #0f3d61 0%, #1B6CA8 100%)",
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center"
      }}>
        <div style={{ width: 38, height: 38, border: "4px solid rgba(255,255,255,.3)", borderTop: "4px solid white", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <div style={{ 
      background: "linear-gradient(145deg, #0f3d61 0%, #1B6CA8 100%)", 
      minHeight: "100vh", 
      display: "flex", 
      justifyContent: "center", 
      alignItems: "center" 
    }}>
      <div style={{ 
        display: "flex", 
        flexDirection: "column", 
        justifyContent: "center", 
        alignItems: "center", 
        padding: "40px 24px", 
        gap: 0, 
        background: "transparent", 
        position: "relative",
        overflow: "hidden",
        width: "100%",
        maxWidth: 480
      }}>
        
        {/* BACKGROUND GLOW */}
        <div style={{ position: "absolute", top: "20%", left: "50%", transform: "translate(-50%, -50%)", width: 250, height: 250, background: "radial-gradient(circle, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 70%)", borderRadius: "50%", zIndex: 0 }} />

        {/* LOGO BOX WITH ACTUAL IMAGE */}
        <div style={{ 
          width: 100, 
          height: 100, 
          background: "rgba(255,255,255,.15)", 
          borderRadius: 30, 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center", 
          marginBottom: 24, 
          border: "2px solid rgba(255,255,255,.25)", 
          boxShadow: "0 10px 40px rgba(0,0,0,.25)",
          backdropFilter: "blur(10px)",
          zIndex: 1
        }}>
          <img src="/icon-192.png" alt="Aarogya AI Logo" style={{ width: 60, height: 60, objectFit: "contain", filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.3))" }} />
        </div>
        
        <div style={{ fontFamily: "var(--font-en)", fontSize: 38, fontWeight: 900, color: "white", textAlign: "center", lineHeight: 1.1, letterSpacing: -0.5, zIndex: 1 }}>AAROGYA.AI</div>
        <div style={{ fontSize: 15, fontWeight: 600, color: "rgba(255,255,255,.9)", textAlign: "center", marginTop: 8, letterSpacing: 0.5, zIndex: 1 }}>Bridge to Health — स्वास्थ्य का सेतु</div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,.6)", textAlign: "center", marginTop: 6, fontStyle: "italic", zIndex: 1 }}>ग्रामीण टेलीमेडिसिन · AI-Powered · Offline-First</div>
        
        <div style={{ width: 50, height: 4, background: "linear-gradient(90deg, transparent, rgba(255,255,255,.5), transparent)", borderRadius: 4, margin: "28px auto", zIndex: 1 }} />
        
        {/* BUTTONS */}
        <div style={{ display: "flex", gap: 14, width: "100%", zIndex: 1 }}>
          <button 
            type="button"
            onClick={() => handleSelectLanguage("hi")} 
            style={{ 
              flex: 1, 
              padding: "16px 0", 
              borderRadius: 16, 
              border: "none", 
              fontSize: 18, 
              fontWeight: 800, 
              cursor: "pointer", 
              background: "white", 
              color: "#0F4C7A", 
              fontFamily: "var(--font-hi)", 
              textAlign: "center", 
              boxShadow: "0 6px 20px rgba(0,0,0,0.15)"
            }}
          >
            हिंदी
          </button>
          <button 
            type="button"
            onClick={() => handleSelectLanguage("en")} 
            style={{ 
              flex: 1, 
              padding: "16px 0", 
              borderRadius: 16, 
              border: "2px solid rgba(255,255,255,.5)", 
              fontSize: 17, 
              fontWeight: 800, 
              cursor: "pointer", 
              background: "rgba(255,255,255,0.05)", 
              color: "white", 
              textAlign: "center", 
              backdropFilter: "blur(5px)"
            }}
          >
            English
          </button>
        </div>


        
        <div style={{ fontSize: 12, color: "rgba(255,255,255,.4)", textAlign: "center", marginTop: 24, zIndex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: "#2ecc71", boxShadow: "0 0 6px #2ecc71" }} />
          Works offline · काम करता है बिना इंटरनेट
        </div>
      </div>
    </div>
  );
}
