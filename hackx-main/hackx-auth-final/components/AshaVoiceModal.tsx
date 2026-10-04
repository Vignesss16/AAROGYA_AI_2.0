"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";

interface AshaVoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSearchPatient?: (query: string) => void;
  onSelectTab?: (tab: "patients" | "visits" | "stats" | "blood-tests" | "vitals" | "patient-history") => void;
  currentLang?: string;
}

const C = {
  purple: "#7D3C98",
  purpleDark: "#5B2C6F",
  green: "#1E8449",
  red: "#C0392B",
  blue: "#1B6CA8",
  bg: "#F0F4F8",
  card: "#FFFFFF",
  text: "#1A2332",
  muted: "#6B7C93",
  border: "#DDE3EC",
};

export default function AshaVoiceModal({
  isOpen,
  onClose,
  onSearchPatient,
  onSelectTab,
  currentLang = "hi",
}: AshaVoiceModalProps) {
  const router = useRouter();
  const [lang, setLang] = useState<"hi-IN" | "en-IN">(currentLang === "en" ? "en-IN" : "hi-IN");
  const [feedback, setFeedback] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Sync with currentLang or localStorage
  useEffect(() => {
    if (isOpen) {
      const stored = typeof window !== "undefined" ? localStorage.getItem("lang") : null;
      const targetLang = (currentLang === "en" || stored === "en") ? "en-IN" : "hi-IN";
      setLang(targetLang);
    }
  }, [isOpen, currentLang]);

  const {
    isListening,
    transcript,
    interimTranscript,
    error,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition({ lang, continuous: false });

  // Optional voice response via SpeechSynthesis
  const speakResponse = (text: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.rate = 1.0;
        window.speechSynthesis.speak(utterance);
      } catch {}
    }
  };

  // Start listening automatically when modal opens or language changes
  useEffect(() => {
    if (isOpen) {
      setFeedback("");
      resetTranscript();
      const timer = setTimeout(() => {
        startListening(lang);
      }, 300);
      return () => {
        clearTimeout(timer);
        stopListening();
      };
    } else {
      stopListening();
    }
  }, [isOpen, lang]);

  // Command interpretation when transcript completes
  useEffect(() => {
    const recognizedText = (transcript || "").trim();
    if (!recognizedText || isListening) return;

    processCommand(recognizedText);
  }, [transcript, isListening]);

  const processCommand = (rawText: string) => {
    const cmd = rawText.trim().toLowerCase();
    setIsProcessing(true);

    const isHi = lang === "hi-IN";

    // 1. Log Visit Commands
    if (
      cmd.includes("विजिट") ||
      cmd.includes("विज़िट") ||
      cmd.includes("visit") ||
      cmd.includes("लॉग") ||
      cmd.includes("दर्ज") ||
      cmd.includes("घर")
    ) {
      setFeedback(isHi ? "✓ विज़िट पेज खोल रहे हैं..." : "✓ Opening Log Visit page...");
      speakResponse(isHi ? "विज़िट पेज खोल रहे हैं" : "Opening log visit");
      setTimeout(() => {
        onClose();
        router.push("/asha/log-visit");
      }, 900);
      return;
    }

    // 2. Vital Signs Commands
    if (
      cmd.includes("वाइटल") ||
      cmd.includes("vitals") ||
      cmd.includes("vital") ||
      cmd.includes("बीपी") ||
      cmd.includes("bp") ||
      cmd.includes("जांच") ||
      cmd.includes("चेकअप") ||
      cmd.includes("पल्स") ||
      cmd.includes("pulse") ||
      cmd.includes("ऑक्सीजन") ||
      cmd.includes("oxygen")
    ) {
      setFeedback(isHi ? "✓ वाइटल साइन पेज खोल रहे हैं..." : "✓ Opening Vital Signs page...");
      speakResponse(isHi ? "वाइटल साइन पेज खोल रहे हैं" : "Opening vital signs");
      setTimeout(() => {
        onClose();
        router.push("/asha/vital-signs");
      }, 900);
      return;
    }

    // 3. Blood Tests Commands
    if (
      cmd.includes("खून") ||
      cmd.includes("ब्लड") ||
      cmd.includes("blood") ||
      cmd.includes("टेस्ट") ||
      cmd.includes("test") ||
      cmd.includes("लैब")
    ) {
      setFeedback(isHi ? "✓ ब्लड टेस्ट पेज खोल रहे हैं..." : "✓ Opening Blood Tests page...");
      speakResponse(isHi ? "ब्लड टेस्ट पेज खोल रहे हैं" : "Opening blood tests");
      setTimeout(() => {
        onClose();
        router.push("/asha/blood-test-submit");
      }, 900);
      return;
    }

    // 4. Emergency / SOS Commands
    if (
      cmd.includes("इमरजेंसी") ||
      cmd.includes("आपातकाल") ||
      cmd.includes("खतरा") ||
      cmd.includes("sos") ||
      cmd.includes("मदद") ||
      cmd.includes("help") ||
      cmd.includes("emergency")
    ) {
      setFeedback(isHi ? "🚨 आपातकालीन SOS खोल रहे हैं!" : "🚨 Opening Emergency SOS!");
      speakResponse(isHi ? "आपातकालीन सेवा खोल रहे हैं" : "Opening emergency SOS");
      setTimeout(() => {
        onClose();
        router.push("/asha/sos");
      }, 800);
      return;
    }

    // 5. Patient History Commands
    if (
      cmd.includes("इतिहास") ||
      cmd.includes("history") ||
      cmd.includes("पुराना") ||
      cmd.includes("रिकॉर्ड") ||
      cmd.includes("record")
    ) {
      setFeedback(isHi ? "✓ मरीज़ इतिहास खोल रहे हैं..." : "✓ Opening Patient History...");
      speakResponse(isHi ? "मरीज़ इतिहास खोल रहे हैं" : "Opening patient history");
      setTimeout(() => {
        onClose();
        if (onSelectTab) onSelectTab("patient-history");
        else router.push("/asha/patient-history");
      }, 900);
      return;
    }

    // 6. Search Patient Commands: e.g. "मरीज़ खोजो विग्नेश" or "search vignesh"
    const searchMatch =
      cmd.match(/(?:खोजो|ढूंढो|search|find|मरीज|मरीज़|patient|mareez|mariz|naam|name)\s+(.+)/i) ||
      cmd.match(/(.+)\s+(?:को\s+खोजो|को\s+ढूंढो|ढूंढना|खोजना)/i);

    let searchTarget = "";
    if (searchMatch && searchMatch[1]) {
      searchTarget = searchMatch[1].replace(/(?:का|की|के|को|मरीज़|patient|name|naam)/gi, "").trim();
    } else {
      // Fallback: direct patient name spoken
      const words = rawText.trim().split(" ").filter(Boolean);
      if (words.length <= 3) {
        searchTarget = words.join(" ");
      }
    }

    if (searchTarget) {
      setFeedback(isHi ? `✓ "${searchTarget}" को खोज रहे हैं...` : `✓ Searching for "${searchTarget}"...`);
      speakResponse(isHi ? `${searchTarget} खोज रहे हैं` : `Searching for ${searchTarget}`);
      setTimeout(() => {
        onClose();
        if (onSearchPatient) onSearchPatient(searchTarget);
        if (onSelectTab) onSelectTab("patients");
      }, 900);
      return;
    }

    // Unrecognized command
    setFeedback(isHi ? `❓ समझ नहीं आया: "${rawText}". कृपया दोबारा बोलें।` : `❓ Not recognized: "${rawText}". Please speak again.`);
    speakResponse(isHi ? "कृपया दोबारा बोलें" : "Please try again");
    setIsProcessing(false);
  };

  if (!isOpen) return null;

  const isHi = lang === "hi-IN";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        background: "rgba(10, 18, 30, 0.75)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background: C.card,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          padding: "24px 20px 32px",
          boxShadow: "0 -10px 40px rgba(0,0,0,0.3)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          animation: "slideUp 0.3s ease-out",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Grab bar */}
        <div
          style={{
            width: 44,
            height: 5,
            borderRadius: 3,
            background: C.border,
            marginBottom: 16,
          }}
        />

        {/* Header with Title & Language Switcher */}
        <div
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 22 }}>🎙️</span>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>
                {isHi ? "आशा वॉइस असिस्टेंट" : "ASHA Voice Assistant"}
              </div>
              <div style={{ fontSize: 11, color: C.muted }}>
                {isHi ? "बोलकर काम करें (Voice Commands)" : "Hands-Free Voice Commands"}
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              background: C.bg,
              padding: 3,
              borderRadius: 20,
              border: `1px solid ${C.border}`,
            }}
          >
            <button
              onClick={() => {
                setLang("hi-IN");
                resetTranscript();
                startListening("hi-IN");
              }}
              style={{
                border: "none",
                background: lang === "hi-IN" ? C.purple : "transparent",
                color: lang === "hi-IN" ? "white" : C.muted,
                fontSize: 11,
                fontWeight: 700,
                padding: "4px 10px",
                borderRadius: 16,
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
            >
              हिंदी
            </button>
            <button
              onClick={() => {
                setLang("en-IN");
                resetTranscript();
                startListening("en-IN");
              }}
              style={{
                border: "none",
                background: lang === "en-IN" ? C.purple : "transparent",
                color: lang === "en-IN" ? "white" : C.muted,
                fontSize: 11,
                fontWeight: 700,
                padding: "4px 10px",
                borderRadius: 16,
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
            >
              EN
            </button>
          </div>
        </div>

        {/* Big Animated Mic Circle */}
        <div
          onClick={() => {
            if (isListening) {
              stopListening();
            } else {
              resetTranscript();
              setFeedback("");
              startListening(lang);
            }
          }}
          style={{
            width: 100,
            height: 100,
            borderRadius: "50%",
            background: isListening
              ? `linear-gradient(135deg, ${C.purple}, #9B59B6)`
              : "#EAECEE",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            boxShadow: isListening
              ? "0 0 0 14px rgba(125,60,152,0.18), 0 0 0 28px rgba(125,60,152,0.08)"
              : "none",
            transition: "all 0.3s ease",
            marginBottom: 20,
          }}
        >
          <span style={{ fontSize: 36, filter: isListening ? "drop-shadow(0 2px 4px rgba(0,0,0,0.2))" : "none" }}>
            {isListening ? "🎙️" : "🔇"}
          </span>
        </div>

        {/* Live Listening / Spoken Text Display */}
        <div
          style={{
            minHeight: 48,
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 16,
            textAlign: "center",
            padding: "0 10px",
          }}
        >
          {isListening ? (
            <div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: C.purple,
                  marginBottom: 4,
                  animation: "pulse 1.5s infinite",
                }}
              >
                {isHi ? "बोलिए, हम सुन रहे हैं... (Listening...)" : "Listening, please speak..."}
              </div>
              <div style={{ fontSize: 15, color: C.text, fontWeight: 600 }}>
                {interimTranscript || transcript || (isHi ? "..." : "...")}
              </div>
            </div>
          ) : transcript ? (
            <div>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 800,
                  color: C.text,
                  background: C.bg,
                  padding: "6px 14px",
                  borderRadius: 12,
                  display: "inline-block",
                  marginBottom: 6,
                }}
              >
                &ldquo;{transcript}&rdquo;
              </div>
              {feedback && (
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: feedback.startsWith("✓") ? C.green : feedback.startsWith("🚨") ? C.red : C.purple,
                  }}
                >
                  {feedback}
                </div>
              )}
            </div>
          ) : (
            <div style={{ fontSize: 13, color: C.muted }}>
              {isHi ? "माइक पर टैप करें और बोलें" : "Tap mic and speak a command"}
            </div>
          )}
        </div>

        {/* Quick Voice Command Suggestions Grid */}
        <div style={{ width: "100%", marginTop: 8 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              color: C.muted,
              textTransform: "uppercase",
              letterSpacing: 0.8,
              marginBottom: 10,
              textAlign: "center",
            }}
          >
            {isHi ? "बोलें या टैप करें (TRY SAYING OR TAP)" : "TRY SAYING OR TAP"}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 8,
            }}
          >
            {[
              {
                icon: "📝",
                title: isHi ? "विज़िट दर्ज करो" : "Log Visit",
                sub: isHi ? "Log Visit" : "Record home visit",
                action: () => {
                  onClose();
                  router.push("/asha/log-visit");
                },
              },
              {
                icon: "❤️",
                title: isHi ? "वाइटल चेकअप" : "Record Vitals",
                sub: isHi ? "Record Vitals" : "BP, Pulse, SpO2",
                action: () => {
                  onClose();
                  router.push("/asha/vital-signs");
                },
              },
              {
                icon: "🩸",
                title: isHi ? "ब्लड टेस्ट" : "Blood Tests",
                sub: isHi ? "Blood Tests" : "Submit lab tests",
                action: () => {
                  onClose();
                  router.push("/asha/blood-test-submit");
                },
              },
              {
                icon: "🚨",
                title: isHi ? "इमरजेंसी SOS" : "Emergency SOS",
                sub: isHi ? "Emergency SOS" : "Ambulance / Alert",
                action: () => {
                  onClose();
                  router.push("/asha/sos");
                },
              },
            ].map((btn, idx) => (
              <button
                key={idx}
                onClick={btn.action}
                style={{
                  background: C.bg,
                  border: `1px solid ${C.border}`,
                  borderRadius: 14,
                  padding: "10px 12px",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.15s ease",
                }}
              >
                <span style={{ fontSize: 18 }}>{btn.icon}</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>
                    {btn.title}
                  </div>
                  <div style={{ fontSize: 10, color: C.muted }}>
                    {btn.sub}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            marginTop: 18,
            background: "none",
            border: "none",
            fontSize: 13,
            fontWeight: 700,
            color: C.muted,
            cursor: "pointer",
            padding: "8px 16px",
          }}
        >
          {isHi ? "बंद करें (Close)" : "Close"}
        </button>
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
