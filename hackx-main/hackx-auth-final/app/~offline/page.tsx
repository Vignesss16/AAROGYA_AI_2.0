"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function OfflineFallbackPage() {
  const router = useRouter();
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const cachedAsha = localStorage.getItem("cachedAshaUser");
      if (cachedAsha) {
        try {
          const parsed = JSON.parse(cachedAsha);
          if (parsed && (parsed.role === "ashaworker" || parsed.phone)) {
            setUserRole("ashaworker");
            router.replace("/asha/dashboard");
            return;
          }
        } catch {}
      }

      const cachedPatient = localStorage.getItem("cachedPatientUser");
      if (cachedPatient) {
        try {
          setUserRole("patient");
          router.replace("/home");
          return;
        } catch {}
      }
    }
  }, [router]);

  return (
    <div style={{ background: "#0d1520", minHeight: "100vh", display: "flex", justifyContent: "center" }}>
      <div style={{ width: 390, background: "#F0F4F8", minHeight: "100vh", display: "flex", flexDirection: "column", padding: 20 }}>
        {/* Offline Status */}
        <div style={{ background: "#FEF3C7", padding: "8px 14px", borderRadius: 10, fontSize: 12, fontWeight: 700, color: "#D97706", display: "flex", alignItems: "center", gap: 6, marginBottom: 24 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#D97706" }} />
          ऑफ़लाइन मोड (स्थानीय AI सक्रिय) · Offline Mode (0G)
        </div>

        <div style={{ textAlign: "center", margin: "16px 0 24px" }}>
          <div style={{ width: 68, height: 68, borderRadius: 20, background: "#1B6CA8", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", boxShadow: "0 8px 24px rgba(27,108,168,0.3)" }}>
            <img src="/icon-192.png" alt="Aarogya AI" style={{ width: 44, height: 44, objectFit: "contain" }} />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1A2332", margin: 0 }}>AAROGYA.AI</h2>
          <p style={{ fontSize: 13, color: "#6B7C93", marginTop: 4 }}>बिना इंटरनेट काम करता है · Works 100% Offline</p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <button
            onClick={() => router.push(userRole === "ashaworker" ? "/asha/dashboard" : "/home")}
            style={{ padding: "16px", borderRadius: 14, border: "none", background: "linear-gradient(135deg,#1B6CA8,#0F4C7A)", color: "white", fontSize: 15, fontWeight: 800, cursor: "pointer", boxShadow: "0 4px 16px rgba(27,108,168,.3)" }}
          >
            🏠 {userRole === "ashaworker" ? "आशा डैशबोर्ड खोलें (ASHA Dashboard)" : "होम पेज खोलें (Open Home)"}
          </button>

          <button
            onClick={() => router.push("/symptoms")}
            style={{ padding: "16px", borderRadius: 14, border: "none", background: "linear-gradient(135deg,#6C3483,#4A235A)", color: "white", fontSize: 15, fontWeight: 800, cursor: "pointer", boxShadow: "0 4px 16px rgba(108,52,131,.3)" }}
          >
            🩺 लक्षण जाँचें (Check Symptoms — Local AI)
          </button>

          <button
            onClick={() => router.push("/records")}
            style={{ padding: "16px", borderRadius: 14, border: "none", background: "linear-gradient(135deg,#1E8449,#27AE60)", color: "white", fontSize: 15, fontWeight: 800, cursor: "pointer", boxShadow: "0 4px 16px rgba(30,132,73,.3)" }}
          >
            📋 स्वास्थ्य रिकॉर्ड (My Health Records)
          </button>

          <a
            href="tel:+16893083089"
            style={{ padding: "16px", borderRadius: 14, border: "none", background: "linear-gradient(135deg,#E67E22,#CA6F1E)", color: "white", fontSize: 15, fontWeight: 800, cursor: "pointer", textDecoration: "none", textAlign: "center", boxShadow: "0 4px 16px rgba(230,126,34,.3)" }}
          >
            📞 वॉइस असिस्टेंट को कॉल करें (Call Voice Agent)
          </a>
        </div>
      </div>
    </div>
  );
}
