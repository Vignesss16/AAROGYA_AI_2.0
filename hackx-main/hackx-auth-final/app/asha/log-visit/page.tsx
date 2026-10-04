"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { addToSyncQueue, getDB } from "@/lib/db-offline";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";

const C = { primary: "#1B6CA8", primaryDark: "#0F4C7A", green: "#1E8449", bg: "#F0F4F8", card: "#FFFFFF", text: "#1A2332", muted: "#6B7C93", border: "#DDE3EC", accent: "#EBF3FA" };

export default function LogVisitPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { isOnline, justCameOnline } = useOnlineStatus();
  const [lang, setLang] = useState("hi");
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

  // Active voice field: 'all' | 'name' | 'phone' | 'notes' | null
  const [activeVoiceField, setActiveVoiceField] = useState<"all" | "name" | "phone" | "notes" | null>(null);
  const [voiceSuccessMsg, setVoiceSuccessMsg] = useState("");

  const speechLang = lang === "hi" ? "hi-IN" : "en-IN";
  const { isListening, transcript, isSupported, startListening, stopListening } = useSpeechRecognition({
    lang: speechLang,
    continuous: false,
    interimResults: true,
  });

  const speak = (msg: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(msg);
      u.lang = lang === "hi" ? "hi-IN" : "en-IN";
      u.rate = 1.0;
      window.speechSynthesis.speak(u);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      setLang(localStorage.getItem("lang") || "hi");
    }
  }, []);

  // Handle voice recognition result
  useEffect(() => {
    if (!transcript || !activeVoiceField) return;

    if (activeVoiceField === "name") {
      const cleaned = transcript.replace(/^(name is|naam hai|patient|mareez|mariz|naam|name)\s*/i, "").trim();
      setPatientName(cleaned);
    } else if (activeVoiceField === "phone") {
      const digits = transcript.replace(/\D/g, "").slice(0, 10);
      if (digits) setPatientPhone(digits);
    } else if (activeVoiceField === "notes") {
      setNotes(prev => (prev ? prev + " " + transcript : transcript));
    } else if (activeVoiceField === "all") {
      // Smart Natural Language Extraction
      parseFullVisitVoice(transcript);
    }
  }, [transcript]);

  const parseFullVisitVoice = (text: string) => {
    let foundName = "";
    let foundPhone = "";

    // Extract phone (10 consecutive digits)
    const phoneMatch = text.match(/\b\d{10}\b/);
    if (phoneMatch) {
      foundPhone = phoneMatch[0];
      setPatientPhone(foundPhone);
    }

    // Extract name patterns
    const nameMatch = text.match(/(?:मरीज़(?: का)? नाम|नाम|patient name|name is|patient)\s+([a-zA-Z\u0900-\u097F\s]{2,25}?)(?=\s+(?:फ़ोन|phone|mobile|नंबर|number|को|ने|से|notes|note|$))/i);
    if (nameMatch && nameMatch[1]) {
      foundName = nameMatch[1].trim();
      setPatientName(foundName);
    }

    // App learned check
    if (/ऐप सिखाया|app sikhaya|app learned|yes|हां सिखाया/i.test(text)) {
      setAppLearned(true);
    }

    // Clean text into notes if not already set
    const cleanNotes = text
      .replace(/(?:मरीज़(?: का)? नाम|नाम|patient name|name is|patient)\s+[a-zA-Z\u0900-\u097F\s]{2,25}/i, "")
      .replace(/\b\d{10}\b/g, "")
      .replace(/(?:फ़ोन|phone|mobile|नंबर|number)/gi, "")
      .replace(/(?:ऐप सिखाया|app sikhaya|app learned)/gi, "")
      .trim();

    if (cleanNotes.length > 3) {
      setNotes(cleanNotes);
    }

    setVoiceSuccessMsg(t("आवाज़ से फॉर्म भर दिया गया!", "Form auto-filled from voice!"));
    speak(t("विज़िट जानकारी भर दी गई है", "Visit information has been filled"));
  };

  const toggleVoice = (field: "all" | "name" | "phone" | "notes") => {
    if (isListening && activeVoiceField === field) {
      stopListening();
      setActiveVoiceField(null);
    } else {
      setActiveVoiceField(field);
      setVoiceSuccessMsg("");
      startListening(speechLang);
    }
  };

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
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{t("Visit Log करें", "Log Patient Visit")}</div>
            <div style={{ fontSize: 11, color: C.muted }}>Log Patient Visit</div>
          </div>
          <button
            onClick={() => setLang(l => l === "hi" ? "en" : "hi")}
            style={{ fontSize: 11, fontWeight: 700, padding: "5px 9px", borderRadius: 8, background: C.accent, color: C.primaryDark, border: `1px solid ${C.border}`, cursor: "pointer" }}
          >
            {lang === "hi" ? "🇮🇳 हिन्दी" : "🇬🇧 English"}
          </button>
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

          {/* Voice Auto-Fill Card */}
          {isSupported && (
            <div style={{
              background: isListening && activeVoiceField === "all" ? "#FFF8E7" : "linear-gradient(135deg, #1B6CA8 0%, #0F4C7A 100%)",
              color: isListening && activeVoiceField === "all" ? C.text : "white",
              borderRadius: 16,
              padding: "14px 16px",
              marginBottom: 16,
              boxShadow: "0 4px 14px rgba(27,108,168,0.2)",
              border: isListening && activeVoiceField === "all" ? "2px solid #F39C12" : "none",
              transition: "all 0.3s ease"
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                    <span>🎙️</span> {t("बोलकर पूरा फॉर्म भरें", "Smart Voice Form Fill")}
                  </div>
                  <div style={{ fontSize: 11, opacity: 0.85, marginTop: 2 }}>
                    {t('उदा: "मरीज़ अनिता देवी, 2 दिन से बुखार है"', 'e.g., "Patient Anita Devi, fever 2 days"')}
                  </div>
                </div>
                <button
                  onClick={() => toggleVoice("all")}
                  style={{
                    padding: "8px 14px",
                    borderRadius: 20,
                    background: isListening && activeVoiceField === "all" ? "#E74C3C" : "white",
                    color: isListening && activeVoiceField === "all" ? "white" : C.primaryDark,
                    border: "none",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.15)"
                  }}
                >
                  <span>{isListening && activeVoiceField === "all" ? "⏹️ रोकें" : "🎙️ बोलें"}</span>
                </button>
              </div>

              {isListening && activeVoiceField === "all" && (
                <div style={{ marginTop: 10, padding: "8px 10px", background: "rgba(255,255,255,0.8)", borderRadius: 8, color: "#333", fontSize: 12 }}>
                  <div style={{ fontWeight: 600, color: "#D35400", marginBottom: 2 }}>👂 सुन रहे हैं (Listening)...</div>
                  <div>{transcript || t("कृपया बोलें...", "Please speak now...")}</div>
                </div>
              )}

              {voiceSuccessMsg && (
                <div style={{ marginTop: 8, fontSize: 12, color: "#27AE60", fontWeight: 600 }}>
                  ✅ {voiceSuccessMsg}
                </div>
              )}
            </div>
          )}

          {error && (
            <div style={{ background: "#FADBD8", borderRadius: 10, padding: "10px 14px", marginBottom: 14, fontSize: 13, color: "#C0392B", border: "1px solid #C0392B" }}>
              {error}
            </div>
          )}

          {/* Patient Name — free text input with voice mic */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: C.muted }}>
                👤 {t("मरीज़ का नाम *", "Patient Name *")}
              </label>
              {isSupported && (
                <button
                  type="button"
                  onClick={() => toggleVoice("name")}
                  style={{
                    background: isListening && activeVoiceField === "name" ? "#E74C3C" : C.accent,
                    color: isListening && activeVoiceField === "name" ? "white" : C.primaryDark,
                    border: "none",
                    borderRadius: 6,
                    padding: "2px 8px",
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 4
                  }}
                >
                  🎙️ {isListening && activeVoiceField === "name" ? t("सुन रहे हैं...", "Listening...") : t("बोलें", "Speak")}
                </button>
              )}
            </div>
            <input
              style={{ width: "100%", padding: "14px 16px", border: `2px solid ${activeVoiceField === "name" && isListening ? "#3498DB" : C.border}`, borderRadius: 12, fontSize: 15, fontFamily: "inherit", background: C.card, color: C.text, outline: "none", boxSizing: "border-box" }}
              type="text"
              placeholder={t("मरीज़ का पूरा नाम लिखें या बोलें", "Enter or speak patient name")}
              value={patientName}
              onChange={e => setPatientName(e.target.value)}
            />
          </div>

          {/* Patient Phone — optional with voice mic */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: C.muted }}>
                📱 {t("मोबाइल नंबर (वैकल्पिक)", "Mobile Number (optional)")}
              </label>
              {isSupported && (
                <button
                  type="button"
                  onClick={() => toggleVoice("phone")}
                  style={{
                    background: isListening && activeVoiceField === "phone" ? "#E74C3C" : C.accent,
                    color: isListening && activeVoiceField === "phone" ? "white" : C.primaryDark,
                    border: "none",
                    borderRadius: 6,
                    padding: "2px 8px",
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 4
                  }}
                >
                  🎙️ {isListening && activeVoiceField === "phone" ? t("सुन रहे हैं...", "Listening...") : t("बोलें", "Speak")}
                </button>
              )}
            </div>
            <input
              style={{ width: "100%", padding: "14px 16px", border: `2px solid ${activeVoiceField === "phone" && isListening ? "#3498DB" : C.border}`, borderRadius: 12, fontSize: 15, fontFamily: "inherit", background: C.card, color: C.text, outline: "none", boxSizing: "border-box" }}
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

          {/* Notes with Voice Dictation */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: C.muted }}>
                📝 {t("Notes / लक्षण", "Notes / Symptoms")}
              </label>
              {isSupported && (
                <button
                  type="button"
                  onClick={() => toggleVoice("notes")}
                  style={{
                    background: isListening && activeVoiceField === "notes" ? "#E74C3C" : C.accent,
                    color: isListening && activeVoiceField === "notes" ? "white" : C.primaryDark,
                    border: "none",
                    borderRadius: 6,
                    padding: "2px 8px",
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 4
                  }}
                >
                  🎙️ {isListening && activeVoiceField === "notes" ? t("बोलते रहें...", "Speaking...") : t("बोलकर लिखें", "Dictate")}
                </button>
              )}
            </div>
            <textarea
              style={{ width: "100%", padding: "14px 16px", border: `2px solid ${activeVoiceField === "notes" && isListening ? "#3498DB" : C.border}`, borderRadius: 12, fontSize: 14, fontFamily: "inherit", background: C.card, color: C.text, outline: "none", lineHeight: 1.6, boxSizing: "border-box" }}
              rows={3}
              placeholder={t("घर पर मरीज़ से मिले, लक्षण या दवाइयां बोलें...", "Visited patient at home, speak symptoms or observations...")}
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
