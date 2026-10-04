"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { jsPDF } from "jspdf";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { getDB, seedOfflineData } from "@/lib/db-offline";

const C = {
  primary: "#1B6CA8", primaryDark: "#0F4C7A", green: "#1E8449",
  red: "#C0392B", yellow: "#D68910", bg: "#F0F4F8",
  card: "#FFFFFF", text: "#1A2332", muted: "#6B7C93", border: "#DDE3EC",
};

import { generatePDF, PatientInfo, Consultation, urgencyConfig, formatDate, getTitle } from '@/lib/pdf';

import { useAuth } from "@/lib/useAuth";

export default function RecordsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { data: session, status } = useSession();
  const { isOnline } = useOnlineStatus();
  const [lang, setLang] = useState("hi");
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [fetching, setFetching] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  const t = (hi: string, en: string) => (lang === "hi" ? hi : en);

  useEffect(() => {
    setLang(localStorage.getItem("lang") || "hi");
  }, []);

  useEffect(() => {
    if (!authLoading && !user && status === "unauthenticated" && isOnline) {
      router.push("/login");
    }
  }, [authLoading, user, status, router, isOnline]);

  useEffect(() => {
    if (!user || fetched) return;
    const identifier = user.phone || user.name || (user as any)._id || "";
    if (!identifier) return;

    setFetched(true);
    setFetching(true);
    // Seed offline data on first visit
    if (typeof window !== "undefined") {
      seedOfflineData().catch(console.error);
    }

    // If offline, load directly from IndexedDB
    if (!isOnline) {
      console.log("📡 Offline mode — loading records from IndexedDB");
      setIsOfflineMode(true);
      setFetching(true);

      getDB()
        .consultations.toArray()
        .then((offlineRecords) => {
          // Convert IndexedDB format to Consultation interface
          const converted: Consultation[] = offlineRecords.map((rec) => ({
            _id: `offline-${rec.id}`,
            symptoms: rec.symptoms || [],
            urgency: rec.urgency,
            triageResult: typeof rec.triageResult === "string" ? JSON.parse(rec.triageResult) : rec.triageResult,
            status: "pending",
            createdAt: rec.createdAt instanceof Date ? rec.createdAt.toISOString() : String(rec.createdAt),
          }));

          setConsultations(converted);
          setFetching(false);
          setFetched(true);
        })
        .catch((err) => {
          console.error("Failed to load offline records:", err);
          setFetching(false);
        });
      return;
    }

    // If online, fetch from server AND cache in IndexedDB
    setIsOfflineMode(false);

    fetch(`/api/consultations/my?identifier=${encodeURIComponent(identifier)}`)
      .then((res) => res.json())
      .then(async (data) => {
        const serverConsultations = data.consultations || [];
        setConsultations(serverConsultations);

        // Cache in IndexedDB for offline use
        if (typeof window !== "undefined" && serverConsultations.length > 0) {
          try {
            const db = getDB();
            for (const c of serverConsultations) {
              const existing = await db.consultations
                .where("patientPhone")
                .equals(identifier)
                .first();

              if (!existing) {
                await db.consultations.add({
                  clientId: c._id,
                  patientPhone: identifier,
                  patientName: user.name || "",
                  symptoms: c.symptoms || [],
                  urgency: c.urgency || "GREEN",
                  triageResult: JSON.stringify(c.triageResult || {}),
                  createdAt: new Date(c.createdAt || Date.now()),
                  needsSync: false,
                });
              }
            }
          } catch (err) {
            console.error("Failed to cache records:", err);
          }
        }
      })
      .catch((err) => {
        console.warn("Online fetch failed, falling back to IndexedDB:", err);
        setIsOfflineMode(true);
        getDB()
          .consultations.toArray()
          .then((offlineRecords) => {
            const converted: Consultation[] = offlineRecords.map((rec) => ({
              _id: `offline-${rec.id}`,
              symptoms: rec.symptoms || [],
              urgency: rec.urgency,
              triageResult: typeof rec.triageResult === "string" ? JSON.parse(rec.triageResult) : rec.triageResult,
              status: "pending",
              createdAt: rec.createdAt instanceof Date ? rec.createdAt.toISOString() : String(rec.createdAt),
            }));
            setConsultations(converted);
          })
          .catch(console.error);
      })
      .finally(() => setFetching(false));
  }, [user, isOnline, fetched]);

  if (authLoading && !user) {
    return (
      <div style={{ background: "#0d1520", minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <div style={{ fontSize: 20, color: "white" }}>⏳ Loading...</div>
      </div>
    );
  }

  if (!user && !isOfflineMode) return null;

  const patient: PatientInfo = {
    name: user?.name || "Patient",
    gender: user?.gender === "female" ? t("महिला", "Female") : t("पुरुष", "Male"),
    age: user?.age ? String(user.age) : "—",
    phone: user?.phone || "—",
    bloodGroup: user?.bloodGroup || "—",
    condition: Array.isArray(user?.conditions) ? (user.conditions[0] || "—") : (typeof (user as any)?.conditions === "string" ? (user as any).conditions.split(",")[0] : "—"),
  };

  const handleDownloadAll = () => {
    setDownloading(true);
    setTimeout(() => {
      generatePDF(patient, consultations);
      setDownloading(false);
    }, 300);
  };

  const statusLabel: Record<string, string> = {
    pending:    t("⏳ डॉक्टर से जवाब का इंतज़ार", "⏳ Awaiting doctor response"),
    "in-review": t("👨‍⚕️ समीक्षा हो रही है", "👨‍⚕️ Doctor is reviewing"),
    completed:  t("✅ पूर्ण", "✅ Completed"),
  };

  return (
    <div style={{ background: "#0d1520", minHeight: "100vh", display: "flex", justifyContent: "center" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; font-family: 'Outfit', 'Segoe UI', sans-serif; }
        .rec-card { transition: box-shadow 0.18s, transform 0.18s; }
        .rec-card:hover { transform: translateY(-1px); box-shadow: 0 6px 24px rgba(0,0,0,0.09) !important; }
        .rec-pill { display:inline-flex; align-items:center; padding:3px 10px; border-radius:20px; font-size:11px; font-weight:600; background:#EBF4FD; color:${C.primary}; margin-right:5px; margin-bottom:3px; }
        .rec-btn { display:inline-flex; align-items:center; gap:6px; padding:8px 16px; border-radius:10px; font-size:13px; fontWeight:700; cursor:pointer; border:none; transition:opacity 0.15s, transform 0.1s; }
        .rec-btn:hover { opacity:0.85; transform:scale(0.98); }
        .rec-btn:active { transform:scale(0.96); }
        .rec-expand-row { cursor:pointer; }
        .rec-expand-row:hover .rec-chevron { color: ${C.primary}; }
      `}</style>

      <div style={{ width: 420, background: C.bg, minHeight: "100vh", display: "flex", flexDirection: "column" }}>

        {isOfflineMode ? (
          <div style={{ background: "#FEF9E7", padding: "6px 16px", fontSize: 12, fontWeight: 700, color: "#B7770D", display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#F39C12" }} />
            {t("ऑफलाइन — डिवाइस से रिकॉर्ड", "Offline — Records from device")}
          </div>
        ) : (
          <div style={{ background: "#E8F8EF", padding: "6px 16px", fontSize: 12, fontWeight: 700, color: C.green, display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.green, boxShadow: `0 0 6px ${C.green}` }} />
            {t("लाइव — सुरक्षित रूप से सिंक किया गया", "Live — Securely Synced")}
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", padding: "10px 14px", gap: 10, background: C.card, borderBottom: `1px solid ${C.border}` }}>
          <button onClick={() => router.push("/home")} style={{ width: 36, height: 36, borderRadius: 10, background: C.bg, border: "none", fontSize: 18, cursor: "pointer" }}>←</button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{t("मेरे स्वास्थ्य रिकॉर्ड", "My Health Records")}</div>
            <div style={{ fontSize: 11, color: C.muted }}>My Health Records</div>
          </div>
          {consultations.length > 0 && (
            <button className="rec-btn" onClick={handleDownloadAll} disabled={downloading} style={{ background: C.primary, color: "#fff", fontSize: 12, padding: "7px 12px" }}>
              {downloading ? "⏳" : "📄"} {downloading ? t("तैयार हो रहा है...", "Preparing...") : t("डाउनलोड PDF", "Download PDF")}
            </button>
          )}
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>

          <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, overflow: "hidden", marginBottom: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
            <div style={{ background: "linear-gradient(135deg,#EBF4FD,#DDEEFF)", padding: "16px 14px", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 52, height: 52, borderRadius: "50%", background: C.primary, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 800, color: "white", flexShrink: 0 }}>
                {patient.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800 }}>{patient.name}</div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>
                  {patient.gender} · {patient.age} {t("वर्ष", "years")} {patient.phone !== "—" ? `· 📱 ${patient.phone}` : ""}
                </div>
              </div>
            </div>
            <div style={{ padding: "12px 14px", display: "flex", gap: 10 }}>
              {[
                { v: patient.bloodGroup, l: t("रक्त समूह", "Blood Group") },
                { v: patient.age,        l: t("उम्र", "Age") },
                { v: patient.condition,  l: t("स्थिति", "Condition") },
              ].map((d, i) => (
                <div key={i} style={{ flex: 1, textAlign: "center", padding: 10, background: C.bg, borderRadius: 10 }}>
                  <div style={{ fontSize: 15, fontWeight: 800 }}>{d.v}</div>
                  <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{d.l}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <span style={{ fontSize: 14 }}>📋</span>
            <span style={{ fontWeight: 700, fontSize: 14, color: C.text }}>
              {t("पिछली विज़िट", "Past Consultations")}
            </span>
            {consultations.length > 0 && (
              <span style={{ background: C.primary, color: "white", borderRadius: 20, padding: "2px 9px", fontSize: 11, fontWeight: 700 }}>
                {consultations.length}
              </span>
            )}
          </div>

          {fetching ? (
            <div style={{ textAlign: "center", padding: 32, color: C.muted }}>
              ⏳ {t("लोड हो रहा है...", "Loading records...")}
            </div>
          ) : consultations.length === 0 ? (
            <div style={{ background: C.card, borderRadius: 16, padding: 28, textAlign: "center", border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 38, marginBottom: 10 }}>🩺</div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{t("कोई रिकॉर्ड नहीं", "No records yet")}</div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{t("लक्षण जाँचें और डॉक्टर बुक करें", "Check symptoms and book a doctor")}</div>
              <button className="rec-btn" onClick={() => router.push("/symptoms")} style={{ marginTop: 16, background: `linear-gradient(135deg,${C.primary},${C.primaryDark})`, color: "white" }}>
                🩺 {t("लक्षण जाँचें", "Check Symptoms")}
              </button>
            </div>
          ) : (
            consultations.map((c, i) => {
              const cfg = urgencyConfig[c.urgency] || urgencyConfig.GREEN;
              const title = getTitle(c);
              const isOpen = expanded === (c._id || String(i));
              const cardId = c._id || String(i);

              return (
                <div key={cardId} className="rec-card" style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, borderLeft: `4px solid ${cfg.color}`, marginBottom: 10, boxShadow: "0 2px 10px rgba(0,0,0,0.04)", overflow: "hidden" }}>
                  <div className="rec-expand-row" onClick={() => setExpanded(isOpen ? null : cardId)} style={{ padding: "14px 14px 12px" }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                      <div style={{ width: 10, height: 10, borderRadius: "50%", background: cfg.color, marginTop: 5, flexShrink: 0, boxShadow: `0 0 7px ${cfg.color}70` }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <span style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{title}</span>
                          <span style={{ background: cfg.bg, color: cfg.color, padding: "2px 9px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                            {cfg.label}
                          </span>
                        </div>
                        <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>{formatDate(c.createdAt)}</div>
                        <div style={{ marginTop: 6 }}>
                          {(c.symptoms || []).slice(0, 4).map((s) => (
                            <span key={s} className="rec-pill">{s}</span>
                          ))}
                        </div>
                        {(c.doctorName || c.slot) && (
                          <div style={{ fontSize: 11, color: C.primary, marginTop: 6 }}>
                            {c.doctorName && `🏥 Dr. ${c.doctorName.replace(/^(Dr\.?\s*)/i, "").trim()}`}
                            {c.slot && ` · 🕐 ${c.slot}`}
                            {c.queueNo && ` · #${c.queueNo}`}
                          </div>
                        )}
                        <div style={{ display: "flex", alignItems: "center", marginTop: 8 }}>
                          <span style={{ fontSize: 12, color: c.status === "completed" ? C.green : cfg.color, fontStyle: "italic" }}>
                            {statusLabel[c.status] || c.status}
                          </span>
                          <span className="rec-chevron" style={{ marginLeft: "auto", fontSize: 11, color: C.muted, fontWeight: 600 }}>
                            {isOpen ? "▲ Hide" : "▼ View Report"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {isOpen && (
                    <div style={{ padding: "0 14px 16px", borderTop: `1px solid ${C.border}`, paddingTop: 14 }}>
                      {(c.doctorName || c.hospital || c.slot || c.queueNo) && (
                        <div style={{ background: "linear-gradient(135deg, #EBF4FD, #DDEEFF)", borderRadius: 12, padding: "12px 14px", marginBottom: 12, border: `1px solid ${C.primary}30` }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                            <span style={{ fontSize: 14 }}>📅</span>
                            <span style={{ fontWeight: 700, fontSize: 11, color: C.primary, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                              {t("अपॉइंटमेंट बुक", "Appointment Booked")}
                            </span>
                          </div>
                          {c.doctorName && <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 4 }}>🏥 {t("डॉक्टर", "Doctor")}: Dr. {c.doctorName.replace(/^(Dr\.?\s*)/i, "").trim()}</div>}
                          {c.hospital && <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 4 }}>🏩 {t("अस्पताल", "Hospital")}: {c.hospital}</div>}
                          {c.slot && <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 4 }}>🕐 {t("समय", "Time")}: {c.slot}{c.queueNo && ` · ${t("कतार No.", "Queue No.")} #${c.queueNo}`}</div>}
                        </div>
                      )}

                      {c.uploadedRecords && c.uploadedRecords.length > 0 && (
                        <div style={{ marginBottom: 12 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                            <span style={{ fontSize: 14 }}>📎</span>
                            <span style={{ fontWeight: 700, fontSize: 11, color: C.text, textTransform: "uppercase" }}>
                              {t("अपलोड रिकॉर्ड", "Uploaded Records")} ({c.uploadedRecords.length})
                            </span>
                          </div>
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            {c.uploadedRecords.map((rec: any, idx: number) => (
                              rec.dataUrl ? (
                                <div key={idx}>
                                  <img src={rec.dataUrl} alt={rec.name || "record"} style={{ width: 80, height: 80, borderRadius: 10, objectFit: "cover", border: `1px solid ${C.border}` }} />
                                </div>
                              ) : null
                            ))}
                          </div>
                        </div>
                      )}

                      {c.symptoms && c.symptoms.length > 0 && (
                        <div style={{ background: "#FEF9E7", borderRadius: 10, padding: "10px 14px", marginBottom: 12, border: "1px solid #F4D03F" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                            <span style={{ fontSize: 14 }}>🤒</span>
                            <span style={{ fontWeight: 700, fontSize: 11, color: "#7D6608", textTransform: "uppercase" }}>{t("लक्षण", "Symptoms")}</span>
                          </div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                            {c.symptoms.map((s) => (
                              <span key={s} style={{ background: "#FFF9E6", padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600, color: "#7D6608" }}>{s}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {c.doctorNotes ? (
                        <div style={{ background: "#F8FAFC", borderRadius: 10, padding: "12px 14px", marginBottom: 12, border: `1px solid ${C.border}` }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                            <span style={{ fontSize: 14 }}>🩺</span>
                            <span style={{ fontWeight: 700, fontSize: 11, color: C.text, textTransform: "uppercase" }}>{t("डॉक्टर नोट्स", "Doctor Notes")}</span>
                          </div>
                          <p style={{ margin: 0, fontSize: 13, color: "#4b5563", lineHeight: 1.6 }}>{c.doctorNotes}</p>
                        </div>
                      ) : (
                        <div style={{ background: "#FAFAFA", borderRadius: 10, padding: "10px 14px", marginBottom: 12, border: `1px solid ${C.border}`, fontSize: 12, color: C.muted, fontStyle: "italic" }}>
                          🩺 {t("डॉक्टर के नोट्स अभी उपलब्ध नहीं", "Doctor notes not yet available")}
                        </div>
                      )}

                      {c.prescription ? (
                        <div style={{ background: "#F0FDF4", borderRadius: 10, padding: "12px 14px", marginBottom: 14, border: "1px solid #BBF7D0" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                            <span style={{ fontSize: 14 }}>💊</span>
                            <span style={{ fontWeight: 700, fontSize: 11, color: "#166534", textTransform: "uppercase" }}>{t("नुस्खा", "Prescription")}</span>
                          </div>
                          <p style={{ margin: 0, fontSize: 13, color: "#166534", lineHeight: 1.7, whiteSpace: "pre-line" }}>{c.prescription}</p>
                        </div>
                      ) : (
                        <div style={{ background: "#FAFAFA", borderRadius: 10, padding: "10px 14px", marginBottom: 14, border: `1px solid ${C.border}`, fontSize: 12, color: C.muted, fontStyle: "italic" }}>
                          💊 {t("अभी कोई नुस्खा नहीं", "No prescription yet")}
                        </div>
                      )}

                      <button className="rec-btn" onClick={() => generatePDF(patient, [c])} style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}40`, width: "100%", justifyContent: "center" }}>
                        📄 {t("PDF डाउनलोड करें", "Download PDF")}
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}