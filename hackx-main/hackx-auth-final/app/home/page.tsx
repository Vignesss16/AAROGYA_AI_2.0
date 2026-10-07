"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/useAuth";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import dynamic from "next/dynamic";
import {
  Stethoscope,
  FileText,
  Pill,
  Mic,
  Droplet,
  ChevronRight,
  ClipboardList,
  Activity,
  Building2
} from "lucide-react";

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
  const [mounted, setMounted] = useState(false);
  const [lang, setLang] = useState("hi");
  const [hasReport, setHasReport] = useState(false);
  const [consultationCount, setConsultationCount] = useState(0);
  const [doctorsCount, setDoctorsCount] = useState(2);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [cachedUserParsed, setCachedUserParsed] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
    const storedLang = localStorage.getItem("lang") || "hi";
    setLang(storedLang);

    const isLoggedOut = localStorage.getItem("user_is_logged_out") === "true";
    const cachedPatientStr = localStorage.getItem("cachedPatientUser") || localStorage.getItem("aarogya_user") || localStorage.getItem("patient");

    if (cachedPatientStr) {
      try { setCachedUserParsed(JSON.parse(cachedPatientStr)); } catch {}
    }

    // Smoothly redirect unauthenticated visitors without cached session or if explicitly logged out
    if (isLoggedOut || (!loading && !user && !cachedPatientStr)) {
      router.replace("/login");
      return;
    }

    setHasReport(!!localStorage.getItem("triageResult"));
  }, [user, loading, router]);

  // Resilient current user shape for offline & online — uses real patient data
  const currentUser = user || cachedUserParsed || {
    _id: "patient",
    phone: (typeof window !== "undefined" && localStorage.getItem("last_login_phone")) || "",
    name: "Patient",
    age: 28,
    gender: "other",
    village: "Local Area",
    conditions: [],
    bloodGroup: "—",
    role: "patient",
  };

  // Fetch dynamic stats (consultations and doctors online) with offline caching
  useEffect(() => {
    if (!currentUser) return;

    // Load cached counts first
    if (typeof window !== "undefined") {
      const cachedConsults = localStorage.getItem("cachedConsultationCount");
      if (cachedConsults) setConsultationCount(parseInt(cachedConsults) || 0);
      const cachedDocs = localStorage.getItem("cachedDoctorsCount");
      if (cachedDocs) setDoctorsCount(parseInt(cachedDocs) || 2);

      if (!isOnline || !navigator.onLine) {
        import("@/lib/db-offline").then(({ getDB }) => {
          getDB().consultations.count().then(count => {
            if (count > 0) setConsultationCount(count);
          }).catch(() => {});
        });
        return;
      }
    }
    // Fetch personal consultations history
    const identifier = (currentUser as any).phone || (currentUser as any)._id;
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
  }, [currentUser, isOnline]);

  const t = (hi: string, en: string) => (lang === "hi" ? hi : en);

  // If visitor is unauthenticated or page is hydrating, show minimal neutral screen
  if (!mounted || loading || (!user && !cachedUserParsed)) {
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
        <div style={{ width: 32, height: 32, border: "3px solid rgba(255,255,255,.3)", borderTop: "3px solid white", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  const greeting =
    lang === "hi"
      ? `नमस्ते ${currentUser.name.split(" ")[0]} जी`
      : `Hello ${currentUser.name.split(" ")[0]}`;

  const badges: { icon?: React.ReactNode; text: string }[] = [];
  if (currentUser.bloodGroup && currentUser.bloodGroup !== "—") {
    badges.push({ icon: <Droplet size={12} fill="#EF4444" color="#EF4444" />, text: currentUser.bloodGroup });
  }
  if (currentUser.conditions && currentUser.conditions.length > 0) {
    badges.push({ icon: <Pill size={12} color="#FBBF24" />, text: currentUser.conditions[0] });
  }
  if (currentUser.age) {
    badges.push({ text: `${currentUser.age} ${t("वर्ष", "years")}` });
  }
  if (!isOnline) {
    badges.push({ icon: <Activity size={12} color="#60A5FA" />, text: t("ऑफ़लाइन AI", "Offline AI") });
  }

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
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Building2 size={88} color="white" />
            </div>

            {/* Top Right Actions: Language Switch & Logout */}
            <div
              style={{
                position: "absolute",
                top: 14,
                right: 14,
                display: "flex",
                alignItems: "center",
                gap: 8,
                zIndex: 10,
              }}
            >
              <button
                type="button"
                onClick={() => {
                  const newLang = lang === "hi" ? "en" : "hi";
                  setLang(newLang);
                  localStorage.setItem("lang", newLang);
                }}
                style={{
                  background: "rgba(255,255,255,.18)",
                  backdropFilter: "blur(8px)",
                  border: "1px solid rgba(255,255,255,.25)",
                  borderRadius: 8,
                  color: "white",
                  fontSize: 12,
                  fontWeight: 700,
                  padding: "6px 10px",
                  cursor: "pointer",
                }}
              >
                {lang === "hi" ? "EN" : "हिं"}
              </button>
              <button
                type="button"
                onClick={logout}
                style={{
                  background: "rgba(255,255,255,.18)",
                  backdropFilter: "blur(8px)",
                  border: "1px solid rgba(255,255,255,.25)",
                  borderRadius: 8,
                  color: "rgba(255,255,255,.9)",
                  fontSize: 12,
                  fontWeight: 700,
                  padding: "6px 12px",
                  cursor: "pointer",
                }}
              >
                {t("लॉग आउट", "Logout")}
              </button>
            </div>

            {/* Clickable Profile Area */}
            <div
              onClick={() => router.push("/profile")}
              style={{ cursor: "pointer", position: "relative", zIndex: 1, paddingRight: 125 }}
            >
              <div style={{ fontSize: 24, fontWeight: 800, color: "white" }}>{greeting}</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,.8)", marginTop: 4 }}>
                {currentUser.name} · {currentUser.village}
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
                  {badges.map((b, idx) => (
                    <span key={idx} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                      {b.icon}
                      <span>{b.text}</span>
                      {idx < badges.length - 1 && <span style={{ opacity: 0.6 }}>·</span>}
                    </span>
                  ))}
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
                  icon: <Stethoscope size={24} color="white" />,
                  title: t("लक्षण जाँचें", "Check My Symptoms"),
                  sub: t("AI से जाँचें — बिना इंटरनेट", "AI powered — works offline"),
                  bg: `linear-gradient(135deg,${C.primary},${C.primaryDark})`,
                  shadow: "rgba(27,108,168,.45)",
                  path: "/symptoms",
                },
                {
                  icon: <FileText size={24} color="white" />,
                  title: t("मेरे स्वास्थ्य रिकॉर्ड", "My Health Records"),
                  sub: t("पिछली विज़िट और नुस्खे देखें", "View past visits & prescriptions"),
                  bg: "linear-gradient(135deg,#6C3483,#4A235A)",
                  shadow: "rgba(108,52,131,.35)",
                  path: "/records",
                },
                {
                  icon: <Pill size={24} color="white" />,
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
                  <ChevronRight size={18} color="rgba(255,255,255,.6)" />
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
                justifyContent: "center", flexShrink: 0,
              }}>
                <Mic size={24} color="white" />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: "white", lineHeight: 1.2, margin: 0 }}>
                  {t("आरोग्य वॉइस असिस्टेंट", "Aarogya Voice Assistant")}
                </h3>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,.7)", marginTop: 2, marginBottom: 0 }}>
                  {t("AI से बात करें — फ़ोन पर", "Talk to AI health assistant by phone")}
                </p>
              </div>
              <ChevronRight size={18} color="rgba(255,255,255,.6)" />
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

            {/* Report / Assessment Action */}
            {hasReport ? (
              <div
                style={{
                  background: "#EBF4FD",
                  borderRadius: 14,
                  padding: "14px 16px",
                  border: "1px solid #AED6F1",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginTop: 14,
                  cursor: "pointer",
                }}
                onClick={() => router.push("/report")}
              >
                <div style={{ width: 38, height: 38, borderRadius: 10, background: "#D4E6F1", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <ClipboardList size={20} color={C.primary} />
                </div>
                <div style={{ flex: 1 }}>
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
                  background: "#F4F9FD",
                  borderRadius: 14,
                  padding: "14px 16px",
                  border: "1px solid #D6EAF8",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginTop: 14,
                  cursor: "pointer",
                }}
                onClick={() => router.push("/symptoms")}
              >
                <div style={{ width: 38, height: 38, borderRadius: 10, background: "#E8F4F8", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Stethoscope size={20} color={C.primary} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.primary }}>
                    {t("स्वास्थ्य जाँच शुरू करें", "Start Health Checkup")}
                  </div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                    {t(
                      "AI द्वारा प्राथमिक स्वास्थ्य सलाह लें →",
                      "Instant AI symptom assessment & guidance →"
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
