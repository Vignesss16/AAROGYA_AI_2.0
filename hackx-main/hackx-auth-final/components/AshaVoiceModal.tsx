"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";

interface AshaVoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSearchPatient?: (query: string) => void;
  onSelectTab?: (tab: "patients" | "visits" | "stats" | "blood-tests" | "vitals" | "patient-history") => void;
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
}: AshaVoiceModalProps) {
  const router = useRouter();
  const [lang, setLang] = useState<"hi-IN" | "en-IN">("hi-IN");
  const [feedback, setFeedback] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);

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

  // Start listening automatically when modal opens
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
  }, [isOpen, lang, startListening, stopListening, resetTranscript]);

  // Command interpretation when transcript completes
  useEffect(() => {
    const recognizedText = (transcript || "").trim().toLowerCase();
    if (!recognizedText || isListening) return;

    processCommand(recognizedText);
  }, [transcript, isListening]);

  const processCommand = (cmd: string) => {
    setIsProcessing(true);

    // 1. Log Visit Commands
    if (
      cmd.includes("विजिट") ||
      cmd.includes("विज़िट") ||
      cmd.includes("visit") ||
      cmd.includes("लॉग") ||
      cmd.includes("दर्ज") ||
      cmd.includes("नया") ||
      cmd.includes("घर")
    ) {
      setFeedback("✓ विज़िट पेज खोल रहे हैं... (Opening Log Visit)");
      speakResponse("विज़िट पेज खोल रहे हैं");
      setTimeout(() => {
        onClose();
        router.push("/asha/log-visit");
      }, 1000);
      return;
    }

    // 2. Vital Signs Commands
    if (
      cmd.includes("वाइटल") ||
      cmd.includes("vitals") ||
      cmd.includes("बीपी") ||
      cmd.includes("bp") ||
      cmd.includes("जांच") ||
      cmd.includes("चेकअप") ||
      cmd.includes("पल्स") ||
      cmd.includes("ऑक्सीजन")
    ) {
      setFeedback("✓ वाइटल साइन पेज खोल रहे हैं... (Opening Vital Signs)");
      speakResponse("वाइटल साइन पेज खोल रहे हैं");
      setTimeout(() => {
        onClose();
        router.push("/asha/vital-signs");
      }, 1000);
      return;
    }

    // 3. Blood Tests Commands
    if (
      cmd.includes("खून") ||
      cmd.includes("ब्लड") ||
      cmd.includes("blood") ||
      cmd.includes("टेस्ट") ||
      cmd.includes("लैब") ||
      cmd.includes("जांच")
    ) {
      setFeedback("✓ ब्लड टेस्ट पेज खोल रहे हैं... (Opening Blood Tests)");
      speakResponse("ब्लड टेस्ट पेज खोल रहे हैं");
      setTimeout(() => {
        onClose();
        router.push("/asha/blood-test-submit");
      }, 1000);
      return;
    }

    // 4. Emergency / SOS Commands
    if (
      cmd.includes("इमरजेंसी") ||
      cmd.includes("आपातकाल") ||
      cmd.includes("खतरा") ||
      cmd.includes("sos") ||
      cmd.includes("मदद") ||
      cmd.includes("help")
    ) {
      setFeedback("🚨 आपातकालीन SOS खोल रहे हैं! (Opening Emergency SOS)");
      speakResponse("आपातकालीन सेवा खोल रहे हैं");
      setTimeout(() => {
        onClose();
        router.push("/asha/sos");
      }, 900);
      return;
    }

    // 5. Patient History Commands
    if (
      cmd.includes("इतिहास") ||
      cmd.includes("history") ||
      cmd.includes("पुराना") ||
      cmd.includes("रिकॉर्ड")
    ) {
      setFeedback("✓ मरीज़ इतिहास खोल रहे हैं... (Opening Patient History)");
      speakResponse("मरीज़ इतिहास खोल रहे हैं");
      setTimeout(() => {
        onClose();
        if (onSelectTab) onSelectTab("patient-history");
        else router.push("/asha/patient-history");
      }, 1000);
      return;
    }

    // 6. Search Patient Commands: e.g. "मरीज़ खोजो रोहन" or "search ram"
    const searchMatch =
      cmd.match(/(?:खोजो|ढूंढो|search|मरीज|मरीज़|patient)\s+(.+)/i) ||
      cmd.match(/(.+)\s+(?:को\s+खोजो|को\s+ढूंढो)/i);

    if (searchMatch && searchMatch[1]) {
      const searchTarget = searchMatch[1].replace(/का|की|के|को/g, "").trim();
      setFeedback(`✓ "${searchTarget}" को खोज रहे हैं... (Searching)`);
      speakResponse(`${searchTarget} को खोज रहे हैं`);
      setTimeout(() => {
        onClose();
        if (onSearchPatient) onSearchPatient(searchTarget);
        if (onSelectTab) onSelectTab("patients");
      }, 1000);
      return;
    }

    // 7. General search fallback (if 1-3 words spoken without command prefix)
    const words = cmd.split(" ").filter(Boolean);
    if (words.length <= 3 && onSearchPatient) {
      const directSearch = words.join(" ");
      setFeedback(`✓ "${directSearch}" खोज रहे हैं...`);
      setTimeout(() => {
        onClose();
        onSearchPatient(directSearch);
        if (onSelectTab) onSelectTab("patients");
      }, 1000);
      return;
    }

    // Unrecognized command
    setFeedback(`❓ समझ नहीं आया: "${cmd}". कृपया दोबारा बोलें।`);
    speakResponse("कृपया दोबारा बोलें");
    setIsProcessing(false);
  };

  if (!isOpen) return null;

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
                आशा वॉइस असिस्टेंट
              </div>
              <div style={{ fontSize: 11, color: C.muted }}>ASHA Voice Commands</div>
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
              }}
            >
              EN
            </button>
          </div>
        </div>

        {/* Big Animated Mic Circle */}
        <div style={{ position: "relative", margin: "16px 0 20px" }}>
          {isListening && (
            <div
              style={{
                position: "absolute",
                inset: -14,
                borderRadius: "50%",
                background: "rgba(125, 60, 152, 0.2)",
                animation: "pulseRing 1.5s cubic-bezier(0.215, 0.61, 0.355, 1) infinite",
              }}
            />
          )}

          <button
            onClick={() => {
              if (isListening) stopListening();
              else {
                resetTranscript();
                setFeedback("");
                startListening(lang);
              }
            }}
            style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              border: "none",
              cursor: "pointer",
              background: isListening
                ? `linear-gradient(135deg, ${C.purple}, #9B59B6)`
                : "#E0E0E0",
              color: isListening ? "white" : "#666",
              fontSize: 34,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: isListening
                ? "0 10px 25px rgba(125, 60, 152, 0.45)"
                : "0 4px 12px rgba(0,0,0,0.1)",
              transition: "all 0.2s ease",
            }}
          >
            {isListening ? "🎙️" : "🔇"}
          </button>
        </div>

        {/* State Banner */}
        <div style={{ textAlign: "center", minHeight: 60, marginBottom: 16 }}>
          {isListening && !transcript && !interimTranscript && (
            <div style={{ fontSize: 15, fontWeight: 700, color: C.purple }}>
              बोलिए, हम सुन रहे हैं... (Listening...)
            </div>
          )}

          {(transcript || interimTranscript) && (
            <div
              style={{
                fontSize: 17,
                fontWeight: 800,
                color: C.text,
                padding: "8px 16px",
                background: C.bg,
                borderRadius: 14,
                maxWidth: 340,
                wordBreak: "break-word",
              }}
            >
              &ldquo;{transcript || interimTranscript}&rdquo;
            </div>
          )}

          {feedback && (
            <div
              style={{
                marginTop: 8,
                fontSize: 13,
                fontWeight: 700,
                color: feedback.startsWith("🚨")
                  ? C.red
                  : feedback.startsWith("✓")
                  ? C.green
                  : C.purple,
              }}
            >
              {feedback}
            </div>
          )}

          {error && (
            <div style={{ marginTop: 8, fontSize: 12, color: C.red, fontWeight: 600 }}>
              ⚠️ {error}
            </div>
          )}
        </div>

        {/* Quick Suggestion Chips */}
        <div style={{ width: "100%", marginTop: 8 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              color: C.muted,
              textTransform: "uppercase",
              letterSpacing: 0.6,
              marginBottom: 10,
              textAlign: "center",
            }}
          >
            बोलें या टैप करें (Try saying or tap)
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
                hi: "विज़िट दर्ज करो",
                en: "Log Visit",
                action: () => {
                  onClose();
                  router.push("/asha/log-visit");
                },
              },
              {
                icon: "❤️",
                hi: "वाइटल चेकअप",
                en: "Record Vitals",
                action: () => {
                  onClose();
                  router.push("/asha/vital-signs");
                },
              },
              {
                icon: "🩸",
                hi: "ब्लड टेस्ट",
                en: "Blood Tests",
                action: () => {
                  onClose();
                  router.push("/asha/blood-test-submit");
                },
              },
              {
                icon: "🚨",
                hi: "इमरजेंसी SOS",
                en: "Emergency SOS",
                action: () => {
                  onClose();
                  router.push("/asha/sos");
                },
              },
            ].map((chip, idx) => (
              <button
                key={idx}
                onClick={chip.action}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: `1px solid ${C.border}`,
                  background: C.bg,
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "background 0.15s",
                }}
              >
                <span style={{ fontSize: 18 }}>{chip.icon}</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{chip.hi}</div>
                  <div style={{ fontSize: 10, color: C.muted }}>{chip.en}</div>
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
            padding: "8px 24px",
            borderRadius: 20,
            border: "none",
            background: "transparent",
            color: C.muted,
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          बंद करें (Close)
        </button>

        <style>{`
          @keyframes slideUp {
            from { transform: translateY(100%); }
            to { transform: translateY(0); }
          }
          @keyframes pulseRing {
            0% { transform: scale(0.95); opacity: 0.8; }
            50% { transform: scale(1.15); opacity: 0.3; }
            100% { transform: scale(1.3); opacity: 0; }
          }
        `}</style>
      </div>
    </div>
  );
}
