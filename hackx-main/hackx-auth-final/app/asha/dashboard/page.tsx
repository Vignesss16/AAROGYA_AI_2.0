"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { useLang } from "@/lib/useLang";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { getDB, seedOfflineData } from "@/lib/db-offline";

const C = { primary: "#1B6CA8", green: "#1E8449", red: "#C0392B", yellow: "#F39C12", purple: "#7D3C98", bg: "#F0F4F8", card: "#FFFFFF", text: "#1A2332", muted: "#6B7C93", border: "#DDE3EC" };

type Patient = { _id: string; name: string; phone: string; age?: number; gender?: string; village?: string; conditions?: string[]; bloodGroup?: string; };
type Visit   = { _id: string; patientName: string; patientPhone: string; visitDate: string; notes: string; appLearned: boolean; createdAt: string; };

function timeAgo(dateStr: string) {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7)  return `${days} days ago`;
  return `${Math.floor(days / 7)} week(s) ago`;
}

export default function ASHADashboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { isOnline } = useOnlineStatus();
  const { lang, setLang, mounted } = useLang();
  const [activeTab, setActiveTab]     = useState<"patients" | "visits" | "stats" | "blood-tests" | "vitals" | "patient-history">("patients");
  const [searchQuery, setSearchQuery] = useState("");
  const [patients, setPatients]       = useState<Patient[]>([]);
  const [visits, setVisits]           = useState<Visit[]>([]);
  const [loadingPt, setLoadingPt]     = useState(true);
  const [loadingVt, setLoadingVt]     = useState(true);

  // Read cached ASHA credentials for WhatsApp-style instant offline login
  const [cachedAsha, setCachedAsha] = useState<any>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("cachedAshaUser");
        if (stored) return JSON.parse(stored);
      } catch {}
    }
    return null;
  });

  // Keep cachedAshaUser fresh when live NextAuth session is active
  useEffect(() => {
    if (session?.user && (session.user as any).role === "ashaworker") {
      const u = {
        id: session.user.id,
        phone: session.user.phone,
        name: session.user.name,
        villages: (session.user as any).villages,
        role: "ashaworker",
      };
      localStorage.setItem("cachedAshaUser", JSON.stringify(u));
      setCachedAsha(u);
    }
  }, [session]);

  const ashaPhone = session?.user?.phone || cachedAsha?.phone || "9876502001";
  const ashaName  = session?.user?.name  || cachedAsha?.name  || "Priya Sharma";
  const ashaVillages = (session?.user as any)?.villages || cachedAsha?.villages || "Kesri, Nabha Sector 4";

  // Auth protection: don't kick user out to login if offline and cached session exists
  useEffect(() => {
    if (status === "loading") return;
    const hasAccess = (status === "authenticated" && session?.user?.role === "ashaworker") || !!cachedAsha;
    if (!hasAccess) {
      router.replace("/asha/login");
    }
  }, [status, session, cachedAsha, router]);

  // Seed offline DB on first mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      seedOfflineData().catch(console.error);
    }
  }, []);

  const fetchPatients = useCallback(async () => {
    try {
      if (isOnline) {
        const queryParams = ashaVillages ? `?village=${encodeURIComponent(ashaVillages)}` : "";
        const r = await fetch(`/api/patients${queryParams}`);
        const d = await r.json();
        const serverPatients = d.patients || [];
        setPatients(serverPatients);

        // Cache in Dexie for offline use
        if (typeof window !== "undefined" && serverPatients.length > 0) {
          const db = getDB();
          for (const sp of serverPatients) {
            const existing = await db.patients.where("phone").equals(sp.phone).first();
            if (!existing) {
              await db.patients.add({
                phone: sp.phone,
                name: sp.name,
                age: sp.age || 0,
                gender: sp.gender || "",
                village: sp.village || "",
                conditions: Array.isArray(sp.conditions) ? sp.conditions.join(", ") : (sp.conditions || ""),
                bloodGroup: sp.bloodGroup || "",
                needsSync: false,
              });
            }
          }
        }
      } else {
        // Offline: Load from Dexie
        const db = getDB();
        const offlinePts = await db.patients.toArray();
        if (offlinePts.length > 0) {
          setPatients(offlinePts.map(p => ({
            _id: String(p.id || p.phone),
            name: p.name,
            phone: p.phone,
            age: p.age,
            gender: p.gender,
            village: p.village,
            conditions: p.conditions ? p.conditions.split(", ") : [],
            bloodGroup: p.bloodGroup,
          })));
        }
      }
    } catch {
      // Fetch failed: fallback to Dexie
      try {
        const db = getDB();
        const offlinePts = await db.patients.toArray();
        if (offlinePts.length > 0) {
          setPatients(offlinePts.map(p => ({
            _id: String(p.id || p.phone),
            name: p.name,
            phone: p.phone,
            age: p.age,
            gender: p.gender,
            village: p.village,
            conditions: p.conditions ? p.conditions.split(", ") : [],
            bloodGroup: p.bloodGroup,
          })));
        }
      } catch {}
    }
    setLoadingPt(false);
  }, [ashaVillages, isOnline]);

  const fetchVisits = useCallback(async () => {
    try {
      if (isOnline && ashaPhone) {
        const r = await fetch(`/api/asha/visits?ashaPhone=${ashaPhone}`);
        const d = await r.json();
        const serverVisits = d.visits || [];
        setVisits(serverVisits);

        // Cache in Dexie
        if (typeof window !== "undefined" && serverVisits.length > 0) {
          const db = getDB();
          for (const sv of serverVisits) {
            const existing = await db.ashaVisits.where("patientPhone").equals(sv.patientPhone).first();
            if (!existing) {
              await db.ashaVisits.add({
                patientPhone: sv.patientPhone,
                patientName: sv.patientName,
                visitDate: sv.visitDate || sv.createdAt,
                notes: sv.notes || "",
                appLearned: !!sv.appLearned,
                ashaWorkerPhone: ashaPhone,
                needsSync: false,
              });
            }
          }
        }
      } else {
        // Offline: Load from Dexie
        const db = getDB();
        const offlineV = await db.ashaVisits.toArray();
        if (offlineV.length > 0) {
          setVisits(offlineV.map(v => ({
            _id: `offline-${v.id}`,
            patientName: v.patientName,
            patientPhone: v.patientPhone,
            visitDate: v.visitDate,
            notes: v.notes,
            appLearned: v.appLearned,
            createdAt: v.visitDate || new Date().toISOString(),
          })));
        }
      }
    } catch {
      try {
        const db = getDB();
        const offlineV = await db.ashaVisits.toArray();
        if (offlineV.length > 0) {
          setVisits(offlineV.map(v => ({
            _id: `offline-${v.id}`,
            patientName: v.patientName,
            patientPhone: v.patientPhone,
            visitDate: v.visitDate,
            notes: v.notes,
            appLearned: v.appLearned,
            createdAt: v.visitDate || new Date().toISOString(),
          })));
        }
      } catch {}
    }
    setLoadingVt(false);
  }, [ashaPhone, isOnline]);

  // Re-fetch when switching tabs
  useEffect(() => {
    if (activeTab === "patients") fetchPatients();
    if (activeTab === "visits") fetchVisits();
  }, [activeTab, fetchPatients, fetchVisits]);

  useEffect(() => {
    if (ashaPhone) {
      fetchPatients();
      fetchVisits();
    }
  }, [fetchPatients, fetchVisits, ashaPhone]);

  const T = (hi: string, en: string) => lang === "hi" ? hi : en;

  if (!mounted) return null;

  const filtered = patients.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.village || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.phone || "").includes(searchQuery)
  );
  const redCount    = visits.filter(v => v.notes.toLowerCase().includes("red")).length;
  const yellowCount = visits.filter(v => v.notes.toLowerCase().includes("yellow")).length;

  return (
    <div style={{ background: "#0d1520", minHeight: "100vh", display: "flex", justifyContent: "center" }}>
      <div style={{ width: 390, background: C.bg, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        {/* Status bar */}
        <div style={{
          background: isOnline ? "#E8F8EF" : "#FEF3C7",
          padding: "8px 16px",
          fontSize: 12,
          fontWeight: 700,
          color: isOnline ? C.green : "#D97706",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: isOnline ? C.green : "#D97706",
              animation: "pulse 2s infinite"
            }} />
            {isOnline ? T("ऑनलाइन", "Online") : T("ऑफ़लाइन मोड (लोकल डेटा)", "Offline Mode (0G)")}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button onClick={() => { const newLang = lang === "hi" ? "en" : "hi"; setLang(newLang); }} style={{ background: C.primary, border: "none", borderRadius: 12, padding: "4px 10px", fontSize: 11, fontWeight: 800, color: "white", cursor: "pointer" }}>
              {lang === "hi" ? "EN" : "हिं"}
            </button>
            <button onClick={() => {
              if (typeof window !== "undefined") {
                localStorage.removeItem("cachedAshaUser");
                localStorage.removeItem("asha_user");
                localStorage.removeItem("ashaworker");
                localStorage.setItem("last_logged_role", "patient");
                sessionStorage.removeItem("user_explicitly_logged_out");
              }
              window.location.href = "/login";
            }} style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 10, padding: "4px 8px", fontSize: 11, fontWeight: 700, color: "white", cursor: "pointer" }}>
              👤 {T("मरीज़ पोर्टल", "Patient Portal")}
            </button>
            <button onClick={async () => {
              if (typeof window !== "undefined") {
                localStorage.removeItem("cachedAshaUser");
                localStorage.removeItem("asha_user");
                localStorage.removeItem("ashaworker");
                localStorage.removeItem("last_logged_role");
                sessionStorage.setItem("user_explicitly_logged_out", "true");
              }
              try { await signOut({ redirect: false }); } catch {}
              window.location.href = "/asha/login";
            }} style={{ background: "rgba(0,0,0,0.08)", border: "none", borderRadius: 10, padding: "4px 8px", fontSize: 11, fontWeight: 700, color: C.muted, cursor: "pointer" }}>
              {T("लॉग आउट", "Logout")}
            </button>
          </div>
        </div>
        <div style={{ background: `linear-gradient(135deg,${C.purple},#5B2C6F)`, padding: "16px 16px 20px", position: "relative" }}>
          <div style={{ position: "absolute", right: -10, top: -10, fontSize: 80, opacity: .07, pointerEvents: "none" }}>👩</div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: "white", margin: 0 }}>{T("मेरे गाँव के मरीज़", "My Village Patients")}</h2>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,.65)", marginTop: 3 }}>{ashaName} · {ashaVillages}</p>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => { window.location.href = "/asha/sos"; }} style={{ background: C.red, color: "white", border: "none", borderRadius: 10, padding: "8px 10px", fontWeight: 800, fontSize: 12, cursor: "pointer" }}>
                🚨 SOS
              </button>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            {[
              { n: patients.length, l: T("कुल", "Total"),    c: "rgba(255,255,255,.9)" },
              { n: visits.length,   l: T("विज़िट", "Visits"), c: "#A9DFBF" },
              { n: redCount,        l: "RED",                  c: "#F1948A" },
              { n: yellowCount,     l: "YELLOW",               c: "#FAD7A0" },
            ].map((s, i) => (
              <div key={i} style={{ flex: 1, background: "rgba(255,255,255,.12)", borderRadius: 10, padding: "8px 6px", textAlign: "center" }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: s.c }}>{s.n}</div>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,.6)", marginTop: 1 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", background: C.card, borderBottom: `1px solid ${C.border}` }}>
          {[
            { id: "patients", l: T("मरीज़", "Patients") },
            { id: "visits", l: T("विज़िट", "Visits") },
            { id: "blood-tests", l: T("ब्लड टेस्ट", "Blood Tests") },
            { id: "vitals", l: T("वाइटल", "Vitals") },
            { id: "patient-history", l: T("इतिहास", "History") },
            { id: "stats", l: T("रिपोर्ट", "Report") },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as typeof activeTab)}
              style={{ flex: 1, padding: "12px 8px", border: "none", background: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, color: activeTab === tab.id ? C.purple : C.muted, borderBottom: activeTab === tab.id ? `3px solid ${C.purple}` : "3px solid transparent", transition: "all .2s" }}>
              {tab.l}
            </button>
          ))}
        </div>

        {activeTab === "patients" && (
          <div style={{ flex: 1, overflowY: "auto", padding: "10px 16px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", border: `2px solid ${C.border}`, borderRadius: 12, background: C.card, marginBottom: 10, overflow: "hidden" }}>
              <span style={{ padding: "10px 12px", fontSize: 16 }}>🔍</span>
              <input style={{ flex: 1, border: "none", outline: "none", fontSize: 14, padding: "10px 0", background: "transparent" }}
                placeholder={T("मरीज़, फ़ोन या गाँव खोजें...", "Search name, phone or village...")} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>
            {loadingPt ? (
              <div style={{ textAlign: "center", padding: "30px 20px", color: C.muted }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>⏳</div>
                <div style={{ fontSize: 13 }}>{T("मरीज़ लोड हो रहे हैं...", "Loading patients...")}</div>
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: "30px 20px", color: C.muted }}>
                <div style={{ fontSize: 36 }}>👥</div>
                <div style={{ fontSize: 14, fontWeight: 700, marginTop: 10 }}>{T("कोई मरीज़ नहीं मिला", "No patients found")}</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>{T("नए मरीज़ Login से जुड़ेंगे", "New patients register via login")}</div>
              </div>
            ) : filtered.map((p) => {
              const initial = p.name.trim()[0]?.toUpperCase() || "?";
              const metaAge = p.age ? `${p.age}${p.gender === "male" ? "M" : p.gender === "female" ? "F" : ""}` : "";
              return (
                <div key={p._id} style={{ background: C.card, borderRadius: 16, padding: 14, display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10, border: `1px solid ${C.border}` }}>
                  <div style={{ width: 42, height: 42, borderRadius: "50%", background: "#EBF4FD", border: `2px solid ${C.primary}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: C.primary, flexShrink: 0 }}>{initial}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <div style={{ fontSize: 14, fontWeight: 800 }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: C.muted }}>{metaAge}{p.village ? ` · ${p.village}` : ""}</div>
                    </div>
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>📱 {p.phone}</div>
                    {p.conditions && p.conditions.length > 0 && (
                      <div style={{ display: "flex", gap: 4, marginTop: 6, flexWrap: "wrap" }}>
                        {p.conditions.slice(0, 3).map((c, j) => (
                          <span key={j} style={{ padding: "3px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: "#EBF4FD", color: C.primary }}>{c}</span>
                        ))}
                      </div>
                    )}
                    <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                      <button onClick={() => {
                        localStorage.setItem("ashaVisitPatient", JSON.stringify({ phone: p.phone, name: p.name }));
                        router.push("/asha/log-visit");
                      }} style={{ flex: 1, padding: "7px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.bg, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                        📝 {T("Log विज़िट", "Log Visit")}
                      </button>
                      <a href={`tel:${p.phone}`} style={{ flex: 1, padding: "7px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.bg, fontSize: 11, fontWeight: 700, cursor: "pointer", textDecoration: "none", color: C.text, textAlign: "center" }}>
                        📞 {T("कॉल", "Call")}
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
            <button onClick={() => router.push("/asha/log-visit")} style={{ width: "100%", padding: 14, borderRadius: 14, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 14, background: `linear-gradient(135deg,${C.purple},#5B2C6F)`, color: "white", marginTop: 4 }}>
              + {T("नई विज़िट दर्ज करें", "Log New Visit")}
            </button>
          </div>
        )}

        {activeTab === "visits" && (
          <div style={{ flex: 1, overflowY: "auto", padding: "10px 16px 16px" }}>
            {loadingVt ? (
              <div style={{ textAlign: "center", padding: "30px 20px", color: C.muted }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>⏳</div>
                <div style={{ fontSize: 13 }}>{T("विज़िट लोड हो रहे हैं...", "Loading visits...")}</div>
              </div>
            ) : visits.length === 0 ? (
              <div style={{ textAlign: "center", padding: "30px 20px", color: C.muted }}>
                <div style={{ fontSize: 36 }}>📋</div>
                <div style={{ fontSize: 14, fontWeight: 700, marginTop: 10 }}>{T("कोई विज़िट नहीं", "No visits yet")}</div>
                <button onClick={() => router.push("/asha/log-visit")} style={{ marginTop: 12, padding: "10px 20px", borderRadius: 10, border: "none", background: C.purple, color: "white", fontWeight: 700, cursor: "pointer" }}>
                  + {T("पहली विज़िट दर्ज करें", "Log First Visit")}
                </button>
              </div>
            ) : visits.map((v) => (
              <div key={v._id} style={{ background: C.card, borderRadius: 14, padding: 14, marginBottom: 10, border: `1px solid ${C.border}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{v.patientName}</div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: v.appLearned ? C.green : C.yellow, background: v.appLearned ? "#E8F8EF" : "#FEF9E7", padding: "3px 8px", borderRadius: 8 }}>
                    {v.appLearned ? T("✓ App सीखा", "✓ App Learned") : T("⏳ Pending", "⏳ Pending")}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>📅 {v.visitDate || timeAgo(v.createdAt)}</div>
                {v.notes && <div style={{ fontSize: 13, color: C.text, marginTop: 6, lineHeight: 1.5 }}>{v.notes}</div>}
              </div>
            ))}
          </div>
        )}

        {activeTab === "blood-tests" && (
          <div style={{ flex: 1, overflowY: "auto", padding: "10px 16px 16px" }}>
            <button onClick={() => router.push("/asha/blood-test-submit")} style={{ width: "100%", padding: 14, borderRadius: 14, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 14, background: `linear-gradient(135deg,${C.purple},#5B2C6F)`, color: "white", marginBottom: 12 }}>
              ➕ {T("ब्लड टेस्ट जमा करें", "Submit Blood Test")}
            </button>
            <div style={{ fontSize: 12, color: C.muted, textAlign: "center" }}>
              {T("रक्त परीक्षण परिणाम देखने के लिए ऊपर क्लिक करें", "Click above to view & submit blood test results")}
            </div>
          </div>
        )}

        {activeTab === "vitals" && (
          <div style={{ flex: 1, overflowY: "auto", padding: "10px 16px 16px" }}>
            <button onClick={() => router.push("/asha/vital-signs")} style={{ width: "100%", padding: 14, borderRadius: 14, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 14, background: `linear-gradient(135deg,#27AE60,#1E8449)`, color: "white", marginBottom: 12 }}>
              🫀 {T("वाइटल साइन रिकॉर्ड करें", "Record Vital Signs")}
            </button>
            <div style={{ fontSize: 12, color: C.muted, textAlign: "center" }}>
              {T("मरीज़ के वाइटल साइन रिकॉर्ड करने के लिए ऊपर क्लिक करें", "Click above to record vital signs")}
            </div>
          </div>
        )}

        {activeTab === "patient-history" && (
          <div style={{ flex: 1, overflowY: "auto", padding: "10px 16px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", border: `2px solid ${C.border}`, borderRadius: 12, background: C.card, marginBottom: 10, overflow: "hidden" }}>
              <span style={{ padding: "10px 12px", fontSize: 16 }}>🔍</span>
              <input style={{ flex: 1, border: "none", outline: "none", fontSize: 14, padding: "10px 0", background: "transparent" }}
                placeholder={T("मरीज़ का फ़ोन नंबर...", "Enter patient phone number...")} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>
            <button onClick={() => { if (searchQuery) router.push(`/asha/patient-history?phone=${searchQuery}`); }}
              disabled={!searchQuery}
              style={{ width: "100%", padding: 14, borderRadius: 14, border: "none", cursor: searchQuery ? "pointer" : "not-allowed", fontWeight: 700, fontSize: 14, background: searchQuery ? C.primary : "#ccc", color: "white", marginBottom: 12 }}>
              👁️ {T("मरीज़ इतिहास देखें", "View Patient History")}
            </button>
            <div style={{ fontSize: 12, color: C.muted, textAlign: "center" }}>
              {T("मरीज़ की पिछली विज़िट, ब्लड टेस्ट और वाइटल साइन देखें", "View patient's past visits, blood tests & vitals")}
            </div>
          </div>
        )}

        {activeTab === "stats" && (
          <div style={{ flex: 1, overflowY: "auto", padding: "10px 16px 16px" }}>
            <div style={{ background: `linear-gradient(135deg,${C.purple},#5B2C6F)`, borderRadius: 16, padding: 16, marginBottom: 12, color: "white" }}>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,.65)", fontWeight: 700, textTransform: "uppercase" }}>{T("कुल विज़िट", "Total Visits")}</div>
              <div style={{ fontSize: 28, fontWeight: 800, marginTop: 4 }}>{visits.length} {T("विज़िट", "Visits")}</div>
            </div>
            {[
              { icon: "🔴", label: T("RED Cases", "RED Cases"),                   val: redCount.toString(),                              color: C.red },
              { icon: "🟡", label: T("YELLOW Cases", "YELLOW Cases"),             val: yellowCount.toString(),                           color: "#B7770D" },
              { icon: "✅", label: T("App Onboarding", "App Onboarding"),         val: `${visits.filter(v => v.appLearned).length}/${visits.length}`, color: C.green },
              { icon: "👥", label: T("कुल मरीज़ रजिस्टर्ड", "Total Patients"),  val: patients.length.toString(),                       color: C.primary },
            ].map((s, i) => (
              <div key={i} style={{ background: C.card, borderRadius: 12, padding: "12px 16px", marginBottom: 8, border: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span style={{ fontSize: 20 }}>{s.icon}</span>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{s.label}</div>
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, color: s.color }}>{s.val}</div>
              </div>
            ))}
            <button onClick={() => router.push("/asha/sos")} style={{ width: "100%", marginTop: 8, padding: 14, borderRadius: 14, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 14, background: `linear-gradient(135deg,#E74C3C,${C.red})`, color: "white" }}>
              🚨 {T("SOS — आपातकाल भेजें", "SOS — Send Emergency Alert")}
            </button>
          </div>
        )}
        <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
      </div>
    </div>
  );
}