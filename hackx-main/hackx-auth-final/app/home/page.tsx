"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/useAuth";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import dynamic from "next/dynamic";

const C = {
  primary: "#1B6CA8",
  primaryDark: "#0F4C7A",
  green: "#1E8449",
  greenLight: "#27AE60",
  bg: "#F0F4F8",
  card: "#FFFFFF",
  text: "#1A2332",
  muted: "#6B7C93",
  border: "#DDE3EC",
  red: "#C0392B",
};

export default function HomePage() {
  const router = useRouter();
  const { user, logout, loading } = useAuth();
  const { isOnline } = useOnlineStatus();
  const [lang, setLang] = useState("hi");
  const [hasReport, setHasReport] = useState(false);
  const [consultationCount, setConsultationCount] = useState(0);
  const [doctorsCount, setDoctorsCount] = useState(2);
  const [showVoiceModal, setShowVoiceModal] = useState(false);

  useEffect(() => {
    const storedLang = localStorage.getItem("lang") || "hi";
    setLang(storedLang);

    if (!loading && !user) {
      router.push("/login");
    } else {
      setHasReport(!!localStorage.getItem("triageResult"));
    }
  }, [user, loading, router]);


  // Fetch dynamic stats (consultations and doctors online) with offline caching
  useEffect(() => {
    if (!user) return;

    // Load cached counts first
    if (typeof window !== "undefined") {
      const cachedConsults = localStorage.getItem("cachedConsultationCount");
      if (cachedConsults) setConsultationCount(parseInt(cachedConsults) || 0);
      const cachedDocs = localStorage.getItem("cachedDoctorsCount");
      if (cachedDocs) setDoctorsCount(parseInt(cachedDocs) || 2);
    }

    if (!isOnline) return;

    // Fetch personal consultations history
    const identifier = (user as any).phone || (user as any)._id;
    if (identifier) {
      fetch(`/api/consultations/my?identifier=${encodeURIComponent(identifier)}`)
        .then(res => res.json())
        .then(data => {
          if (data.consultations) {
            setConsultationCount(data.consultations.length);
            localStorage.setItem("cachedConsultationCount", String(data.consultations.length));
          }
        })
        .catch(err => console.error("Error fetching consultations:", err));
    }

    // Fetch available doctors
    fetch("/api/admin/doctors")
      .then(res => res.json())
      .then(data => {
        if (data.doctors) {
          setDoctorsCount(data.doctors.length);
          localStorage.setItem("cachedDoctorsCount", String(data.doctors.length));
        }
      })
      .catch(err => console.error("Error fetching doctors:", err));
  }, [user, isOnline]);

  const t = (hi: string, en: string) => (lang === "hi" ? hi : en);

  if (loading && !user) {
    return (
      <div
        style={{
          background: "#0d1520",
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div style={{ fontSize: 20, color: "white" }}>⏳ {t("लोड हो रहा है", "Loading...")}</div>
      </div>
    );
  }

  if (!user) return null;

  const greeting =
    lang === "hi"
      ? `नमस्ते ${user.name.split(" ")[0]} जी`
      : `Hello ${user.name.split(" ")[0]}`;

  const badges: string[] = [];
  if (user.bloodGroup) badges.push(`🩸 ${user.bloodGroup}`);
  if (user.conditions && user.conditions.length > 0) badges.push(`💊 ${user.conditions[0]}`);
  if (user.age) badges.push(`${user.age} ${t("वर्ष", "years")}`);

  const pastVisits = hasReport ? 1 : 0;

  return (
    <>
      <div
        style={{
          background: "#0d1520",
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 390,
            background: C.bg,
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Online/Offline status bar */}
          <div
            style={{
              background: isOnline ? "#E8F8EF" : "#FEF3C7",
              padding: "6px 16px",
              fontSize: 12,
              fontWeight: 700,
              color: isOnline ? C.green : "#D97706",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: isOnline ? C.green : "#D97706",
                  animation: "pulse 2s infinite",
                }}
              />
              {isOnline
                ? t("ऑनलाइन — AI सक्रिय है", "Online — AI Active")
                : t("ऑफ़लाइन मोड — लोकल AI सक्रिय (0G)", "Offline Mode — Local AI Active (0G)")}
            </div>
            <button
              onClick={() => {
                const newLang = lang === "hi" ? "en" : "hi";
                setLang(newLang);
                localStorage.setItem("lang", newLang);
              }}
              style={{
                background: C.primary,
                border: "none",
                borderRadius: 20,
                padding: "4px 12px",
                fontSize: 11,
                fontWeight: 800,
                color: "white",
                cursor: "pointer",
              }}
            >
              {lang === "hi" ? "EN" : "हिं"}
            </button>
          </div>

          {/* Hero */}
          <div
            style={{
              background: `linear-gradient(135deg,${C.primary},${C.primaryDark})`,
              padding: "16px 16px 22px",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                right: -10,
                top: -10,
                fontSize: 80,
                opacity: 0.07,
                pointerEvents: "none",
              }}
            >
              🏥
            </div>

            <button
              onClick={logout}
              style={{
                position: "absolute",
                top: 14,
                right: 14,
                background: "rgba(255,255,255,.15)",
                border: "none",
                borderRadius: 8,
                color: "rgba(255,255,255,.9)",
                fontSize: 12,
                fontWeight: 700,
                padding: "6px 12px",
                cursor: "pointer",
                zIndex: 10,
              }}
            >
              {t("लॉग आउट", "Logout")}
            </button>

            {/* Clickable Profile Area */}
            <div
              onClick={() => router.push("/profile")}
              style={{ cursor: "pointer", position: "relative", zIndex: 1, paddingRight: 80 }}
            >
              <div style={{ fontSize: 24, fontWeight: 800, color: "white" }}>{greeting}</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,.8)", marginTop: 4 }}>
                {user.name} · {user.village}
              </div>
              {badges.length > 0 && (
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    background: "rgba(255,255,255,.2)",
                    padding: "6px 14px",
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 600,
                    color: "white",
                    marginTop: 12,
                  }}
                >
                  {badges.join(" · ")}
                </div>
              )}
            </div>
          </div>

          {/* Scrollable body */}
          <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
            {/* Action buttons */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                {
                  icon: "🩺",
                  title: t("लक्षण जाँचें", "Check My Symptoms"),
                  sub: t("AI से जाँचें — बिना इंटरनेट", "AI powered — works offline"),
                  bg: `linear-gradient(135deg,${C.primary},${C.primaryDark})`,
                  shadow: "rgba(27,108,168,.45)",
                  path: "/symptoms",
                },
                {
                  icon: "📋",
                  title: t("मेरे स्वास्थ्य रिकॉर्ड", "My Health Records"),
                  sub: t("पिछली विज़िट और नुस्खे देखें", "View past visits & prescriptions"),
                  bg: "linear-gradient(135deg,#6C3483,#4A235A)",
                  shadow: "rgba(108,52,131,.35)",
                  path: "/records",
                },
                {
                  icon: "💊",
                  title: t("दवाई खोजें", "Find Medicine Nearby"),
                  sub: t("पास की दुकान में दवाई उपलब्धता", "Check stock at nearby pharmacies"),
                  bg: `linear-gradient(135deg,${C.greenLight},${C.green})`,
                  shadow: "rgba(30,132,73,.35)",
                  path: "/medicine",
                },
              ].map((action, i) => (
                <button
                  key={i}
                  onClick={() => router.push(action.path)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: 18,
                    borderRadius: 18,
                    border: "none",
                    cursor: "pointer",
                    textAlign: "left",
                    gap: 14,
                    background: action.bg,
                    boxShadow: `0 6px 24px ${action.shadow}`,
                    transition: "all .2s",
                  }}
                >
                  <div
                    style={{
                      width: 54,
                      height: 54,
                      borderRadius: 14,
                      background: "rgba(255,255,255,.18)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 26,
                      flexShrink: 0,
                    }}
                  >
                    {action.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3
                      style={{
                        fontSize: 16,
                        fontWeight: 800,
                        color: "white",
                        lineHeight: 1.2,
                        margin: 0,
                      }}
                    >
                      {action.title}
                    </h3>
                    <p
                      style={{
                        fontSize: 11,
                        color: "rgba(255,255,255,.7)",
                        marginTop: 2,
                        marginBottom: 0,
                      }}
                    >
                      {action.sub}
                    </p>
                  </div>
                  <span style={{ fontSize: 20, color: "rgba(255,255,255,.5)" }}>›</span>
                </button>
              ))}
            </div>

            {/* Aarogya Voice Assistant */}
            <button
              onClick={() => setShowVoiceModal(true)}
              style={{
                display: "flex",
                alignItems: "center",
                padding: 18,
                borderRadius: 18,
                border: "none",
                cursor: "pointer",
                textAlign: "left",
                gap: 14,
                width: "100%",
                background: "linear-gradient(135deg,#E67E22,#CA6F1E)",
                boxShadow: "0 6px 24px rgba(230,126,34,.4)",
                marginTop: 12,
              }}
            >
              <div style={{
                width: 54, height: 54, borderRadius: 14,
                background: "rgba(255,255,255,.18)",
                display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: 26, flexShrink: 0,
              }}>
                🎙️
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: "white", lineHeight: 1.2, margin: 0 }}>
                  {t("आरोग्य वॉइस असिस्टेंट", "Aarogya Voice Assistant")}
                </h3>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,.7)", marginTop: 2, marginBottom: 0 }}>
                  {t("AI से बात करें — फ़ोन पर", "Talk to AI health assistant by phone")}
                </p>
              </div>
              <span style={{ fontSize: 20, color: "rgba(255,255,255,.5)" }}>›</span>
            </button>

            {/* Stats */}
            <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
              {[
                { n: String(pastVisits), l: t("AI विज़िट", "AI Scans") },
                { n: String(consultationCount), l: t("परामर्श", "Consults") },
                { n: String(doctorsCount), l: t("डॉक्टर उपलब्ध", "Doctors Online") },
              ].map((s, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    background: C.card,
                    borderRadius: 12,
                    padding: 12,
                    textAlign: "center",
                    border: `1px solid ${C.border}`,
                  }}
                >
                  <div style={{ fontSize: 22, fontWeight: 800, color: C.primary }}>{s.n}</div>
                  <div style={{ fontSize: 10, color: C.muted, marginTop: 2, lineHeight: 1.3 }}>
                    {s.l}
                  </div>
                </div>
              ))}
            </div>

            {/* Report / No checkup alert */}
            {hasReport ? (
              <div
                style={{
                  background: "#EBF4FD",
                  borderRadius: 12,
                  padding: 12,
                  border: "1px solid #AED6F1",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 8,
                  marginTop: 14,
                  cursor: "pointer",
                }}
                onClick={() => router.push("/report")}
              >
                <span style={{ fontSize: 20 }}>📋</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.primary }}>
                    {t("रिपोर्ट तैयार है", "Report Ready")}
                  </div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                    {t("अपनी स्वास्थ्य रिपोर्ट देखें →", "View your health report →")}
                  </div>
                </div>
              </div>
            ) : (
              <div
                style={{
                  background: "#FDEDED",
                  borderRadius: 12,
                  padding: 12,
                  border: "1px solid #F1948A",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 8,
                  marginTop: 14,
                }}
              >
                <span style={{ fontSize: 20 }}>🔴</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.red }}>
                    {t("कोई जाँच नहीं हुई", "No Checkup Done")}
                  </div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                    {t(
                      "लक्षण जाँच करके रिपोर्ट बनाएं",
                      "Run a symptom check to generate your report"
                    )}
                  </div>
                </div>
              </div>
            )}

          </div>

          <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
        </div>
      </div>


      {/* Aarogya Voice Assistant Modal */}
      {showVoiceModal && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
            display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 2000,
          }}
          onClick={() => setShowVoiceModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "white", borderRadius: "22px 22px 0 0",
              padding: 24, width: "100%", maxWidth: 420,
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 46, height: 46, borderRadius: 14,
                  background: "linear-gradient(135deg,#E67E22,#CA6F1E)",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
                }}>🎙️</div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#1A2332" }}>
                    {t("आरोग्य वॉइस असिस्टेंट", "Aarogya Voice Assistant")}
                  </h3>
                  <p style={{ margin: 0, fontSize: 11, color: "#6B7C93" }}>
                    {t("AI हेल्थ असिस्टेंट से फ़ोन पर बात करें", "Speak to AI health assistant by phone")}
                  </p>
                </div>
              </div>
              <button onClick={() => setShowVoiceModal(false)}
                style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#6B7C93" }}>
                ✕
              </button>
            </div>

            <div style={{ height: 1, background: "#DDE3EC", margin: "14px 0" }} />

            <p style={{ fontSize: 13, color: "#6B7C93", marginBottom: 16, marginTop: 0 }}>
              {t("नीचे दिए नंबर पर कॉल करें — AI आपकी भाषा में बात करेगा",
                "Call the number below — AI will speak in your language")}
            </p>

            {/* Number 1 */}
            {[
              { label: t("वॉइस एजेंट 1", "Voice Agent 1"), number: "+16893083089" },
              { label: t("वॉइस एजेंट 2", "Voice Agent 2"), number: "+14784437687" },
              { label: t("वॉइस एजेंट 3", "Voice Agent 3"), number: "+12602766832" },
            ].map((agent, i) => (
              <div key={i} style={{
                background: "#F8FAFC", borderRadius: 14, padding: "14px 16px",
                marginBottom: 10, border: "1px solid #DDE3EC",
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#1A2332" }}>{agent.label}</div>
                  <div style={{ fontSize: 17, fontWeight: 800, color: "#E67E22", marginTop: 3, letterSpacing: 0.5 }}>
                    {agent.number}
                  </div>
                </div>
                <a
                  href={`tel:${agent.number}`}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "10px 18px", borderRadius: 12, border: "none",
                    background: "linear-gradient(135deg,#E67E22,#CA6F1E)",
                    color: "white", fontWeight: 800, fontSize: 14,
                    textDecoration: "none", boxShadow: "0 4px 14px rgba(230,126,34,.4)",
                  }}
                >
                  📞 {t("कॉल", "Call")}
                </a>
              </div>
            ))}

            <p style={{ fontSize: 11, color: "#6B7C93", textAlign: "center", marginTop: 8, marginBottom: 0 }}>
              {t("कॉल करने पर आपका फ़ोन ऐप खुलेगा", "Tapping Call will open your phone dialer")}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
