"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { addToSyncQueue, getDB } from "@/lib/db-offline";

const C = { primary: "#1B6CA8", primaryDark: "#0F4C7A", green: "#1E8449", bg: "#F0F4F8", card: "#FFFFFF", text: "#1A2332", muted: "#6B7C93", border: "#DDE3EC" };

export default function LogVisitPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { isOnline, justCameOnline } = useOnlineStatus();
  const lang = typeof window !== "undefined" ? localStorage.getItem("lang") || "hi" : "hi";
  const t = (hi: string, en: string) => lang === "hi" ? hi : en;

  const [appLearned, setAppLearned] = useState(false);
  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedOffline, setSavedOffline] = useState(false);
  const [queueCount, setQueueCount] = useState(0);

  // Pre-fill if navigated from a patient card in the dashboard
  useEffect(() => {
    const stored = localStorage.getItem("ashaVisitPatient");
    if (stored) {
      try {
        const p = JSON.parse(stored);
        setPatientName(p.name || "");
        setPatientPhone(p.phone || "");
        localStorage.removeItem("ashaVisitPatient");
      } catch {}
    }
  }, []);

  // Update queue count and auto-sync when coming back online
  useEffect(() => {
    if (justCameOnline && typeof window !== "undefined") {
      getDB().syncQueue.count().then(setQueueCount);
    }
  }, [justCameOnline]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      getDB().syncQueue.count().then(setQueueCount);
    }
  }, []);

  const cachedAshaPhone = typeof window !== "undefined"
    ? (() => { try { return JSON.parse(localStorage.getItem("cachedAshaUser") || "{}").phone; } catch { return ""; } })()
    : "";
  const ashaPhone = (session?.user as any)?.phone || cachedAshaPhone || "9876502001";

  const saveVisit = async () => {
    if (!patientName.trim()) {
      setError(t("मरीज़ का नाम दर्ज करें", "Enter patient name"));
      return;
    }
    setSaving(true);
    setError("");
    setSavedOffline(false);

    const visitData = {
      patientPhone: patientPhone.trim() || "unknown",
      patientName: patientName.trim(),
      visitDate: date,
      notes,
      appLearned,
      ashaWorkerPhone: ashaPhone,
    };

    let wasOffline = false;

    try {
      if (isOnline) {
        // Send directly to server when online
        const res = await fetch("/api/asha/visits", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(visitData),
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Failed to save to server");
        }
      } else {
        wasOffline = true;
        // OFFLINE: Save to IndexedDB + sync queue
        const db = getDB();

        // 1. Save directly to ashaVisits table so it displays in ASHA dashboard right away
        await db.ashaVisits.add({
          patientPhone: visitData.patientPhone,
          patientName: visitData.patientName,
          visitDate: visitData.visitDate,
          notes: visitData.notes,
          appLearned: visitData.appLearned,
          ashaWorkerPhone: visitData.ashaWorkerPhone,
          needsSync: true,
        });

        // 2. Save to offline consultations table
        await db.consultations.add({
          patientPhone: visitData.patientPhone,
          patientName: visitData.patientName,
          symptoms: ["ASHA Visit"],
          urgency: "GREEN" as const,
          triageResult: JSON.stringify({ notes: visitData.notes, visitDate: visitData.visitDate }),
          createdAt: new Date(),
          needsSync: true,
        });

        // 3. Add to sync queue for later
        await addToSyncQueue("/api/asha/visits", "POST", visitData);

        setSavedOffline(true);
        const newCount = await db.syncQueue.count();
        setQueueCount(newCount);
      }
    } catch (err) {
      console.error("Failed to save visit:", err);
      setError(t("सेव करने में त्रुटि", "Error saving visit"));
      setSaving(false);
      return;
    }

    setSaving(false);

    if (wasOffline) {
      // Show confirmation briefly before navigating back to dashboard
      setTimeout(() => {
        router.push("/asha/dashboard");
      }, 1500);
    } else {
      router.push("/asha/dashboard");
    }
  };

  return (
    <div style={{ background: "#0d1520", minHeight: "100vh", display: "flex", justifyContent: "center" }}>
      <div style={{ width: 390, background: C.bg, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", padding: "44px 14px 10px", gap: 10, background: C.card, borderBottom: `1px solid ${C.border}` }}>
          <button onClick={() => router.push("/asha/dashboard")} style={{ width: 36, height: 36, borderRadius: 10, background: C.bg, border: "none", fontSize: 18, cursor: "pointer" }}>←</button>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{t("Visit Log करें", "Log Patient Visit")}</div>
            <div style={{ fontSize: 11, color: C.muted }}>Log Patient Visit</div>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>

          {/* Queue count indicator */}
          {queueCount > 0 && (
            <div style={{ background: "#FEF9E7", borderRadius: 10, padding: "10px 14px", marginBottom: 14, fontSize: 13, color: "#B7770D", border: "1px solid #F4D03F", display: "flex", alignItems: "center", gap: 6 }}>
              <span>📦</span>
              <span>{queueCount} {t("आइटम सिंक के लिए इंतज़ार कर रहे हैं", "item(s) waiting to sync")}</span>
            </div>
          )}

          {/* Offline saved confirmation */}
          {savedOffline && (
            <div style={{ background: "#E8F8EF", borderRadius: 10, padding: "10px 14px", marginBottom: 14, fontSize: 13, color: C.green, border: "1px solid #A9DFBF", display: "flex", alignItems: "center", gap: 6 }}>
              <span>✅</span>
              <span>{t("ऑफलाइन सेव हो गया! ऑनलाइन आने पर सिंक होगा", "Saved offline! Will sync when online")}</span>
            </div>
          )}

          {error && (
            <div style={{ background: "#FADBD8", borderRadius: 10, padding: "10px 14px", marginBottom: 14, fontSize: 13, color: "#C0392B", border: "1px solid #C0392B" }}>
              {error}
            </div>
          )}

          {/* Patient Name — free text input */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: C.muted, marginBottom: 6, display: "block" }}>
              👤 {t("मरीज़ का नाम *", "Patient Name *")}
            </label>
            <input
              style={{ width: "100%", padding: "14px 16px", border: `2px solid ${C.border}`, borderRadius: 12, fontSize: 15, fontFamily: "inherit", background: C.card, color: C.text, outline: "none", boxSizing: "border-box" }}
              type="text"
              placeholder={t("मरीज़ का पूरा नाम लिखें", "Enter patient full name")}
              value={patientName}
              onChange={e => setPatientName(e.target.value)}
            />
          </div>

          {/* Patient Phone — optional */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: C.muted, marginBottom: 6, display: "block" }}>
              📱 {t("मोबाइल नंबर (वैकल्पिक)", "Mobile Number (optional)")}
            </label>
            <input
              style={{ width: "100%", padding: "14px 16px", border: `2px solid ${C.border}`, borderRadius: 12, fontSize: 15, fontFamily: "inherit", background: C.card, color: C.text, outline: "none", boxSizing: "border-box" }}
              type="tel"
              placeholder="e.g. 9876501001"
              value={patientPhone}
              maxLength={10}
              onChange={e => setPatientPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
            />
          </div>

          {/* Visit Date */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: C.muted, marginBottom: 6, display: "block" }}>📅 {t("Visit Date", "Visit Date")}</label>
            <input
              style={{ width: "100%", padding: "14px 16px", border: `2px solid ${C.border}`, borderRadius: 12, fontSize: 15, fontFamily: "inherit", background: C.card, color: C.text, outline: "none", boxSizing: "border-box" }}
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
            />
          </div>

          {/* Notes */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: C.muted, marginBottom: 6, display: "block" }}>📝 {t("Notes", "Notes")}</label>
            <textarea
              style={{ width: "100%", padding: "14px 16px", border: `2px solid ${C.border}`, borderRadius: 12, fontSize: 14, fontFamily: "inherit", background: C.card, color: C.text, outline: "none", lineHeight: 1.6, boxSizing: "border-box" }}
              rows={3}
              placeholder={t("घर पर मरीज़ से मिले...", "Visited patient at home...")}
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>

          {/* App Learned Toggle */}
          <div style={{ background: C.card, borderRadius: 16, padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, border: `1px solid ${C.border}` }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{t("क्या मरीज़ ने आज App सीखा?", "Did patient learn app today?")}</div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>Did patient learn to use app today?</div>
            </div>
            <div onClick={() => setAppLearned(!appLearned)} style={{ width: 48, height: 26, borderRadius: 13, background: appLearned ? C.green : C.border, cursor: "pointer", position: "relative", transition: "background .2s", flexShrink: 0 }}>
              <div style={{ width: 22, height: 22, borderRadius: "50%", background: "white", position: "absolute", top: 2, left: 2, transition: "transform .2s", transform: appLearned ? "translateX(22px)" : "translateX(0)", boxShadow: "0 2px 4px rgba(0,0,0,.2)" }} />
            </div>
          </div>

          <button onClick={saveVisit} disabled={saving} style={{ width: "100%", padding: 16, borderRadius: 14, border: "none", cursor: saving ? "not-allowed" : "pointer", fontWeight: 700, fontSize: 15, background: `linear-gradient(135deg,${C.primary},${C.primaryDark})`, color: "white", opacity: saving ? 0.7 : 1 }}>
            {saving ? "⏳ " + t("सेव हो रहा है...", "Saving...") : isOnline ? "💾 " + t("Save Visit", "Save Visit") : "💾 " + t("ऑफलाइन सेव करें", "Save Offline")}
          </button>
        </div>
      </div>
    </div>
  );
}
