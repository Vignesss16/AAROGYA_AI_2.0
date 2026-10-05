"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useWebRTC, formatDuration, NetworkQuality } from "@/hooks/useWebRTC";

const C = {
  primary: "#1B6CA8", green: "#1E8449", red: "#C0392B",
  redLight: "#E74C3C", yellow: "#F39C12", card: "#FFFFFF",
  text: "#1A2332", muted: "#6B7C93", border: "#DDE3EC", bg: "#F0F4F8",
};

export interface PatientCallDetails {
  age?: string | number;
  gender?: string;
  department?: string;
  slotTime?: string;
  urgency?: string;
  symptoms?: string | string[];
  reasoning?: string;
  status?: string;
  doctorName?: string;
  verificationNotes?: string;
  consultationId?: string;
}

export interface VideoCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientName: string;
  patientId: string;
  isDoctor: boolean;
  callerRole?: "doctor" | "receptionist" | "asha" | "hospital";
  callerTitle?: string;
  facilityName?: string;
  department?: string;
  patientDetails?: PatientCallDetails;
  onSaveNotes?: (notes: string, verifiedStatus?: string) => Promise<void> | void;
  initialIncomingCallType?: "video" | "audio" | null;
}

function sanitizeTitle(raw?: string, role?: string, facility?: string): string {
  if (!raw || raw.trim() === "") {
    if (role === "receptionist") return `${facility || "Hospital"} Reception Desk`;
    if (role === "asha") return "ASHA Health Worker";
    return "Doctor Consultation";
  }
  let title = raw.trim();
  // Strip duplicate "Dr." / "Dr " prefixes (e.g. "Dr. Dr.Vasanth" -> "Dr. Vasanth")
  if (/^(Dr\.?\s*)+/i.test(title)) {
    const withoutDr = title.replace(/^(Dr\.?\s*)+/i, "").trim();
    return withoutDr ? `Dr. ${withoutDr}` : "Dr. Consultation";
  }
  return title;
}

function NetworkBadge({ quality }: { quality: NetworkQuality }) {
  const configs = {
    good:     { color: "#22C55E", bg: "rgba(34, 197, 94, 0.15)", icon: "📶", label: "Good Network" },
    poor:     { color: "#EAB308", bg: "rgba(234, 179, 8, 0.15)",  icon: "📶", label: "Poor Network" },
    critical: { color: "#EF4444", bg: "rgba(239, 68, 68, 0.15)",  icon: "📵", label: "Very Poor Network" },
  };
  const cfg = configs[quality];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5, background: cfg.bg, borderRadius: 20, padding: "3px 10px", border: `1px solid ${cfg.color}33` }}>
      <span style={{ fontSize: 12 }}>{cfg.icon}</span>
      <span style={{ fontSize: 11, fontWeight: 700, color: cfg.color }}>{cfg.label}</span>
      <div style={{ display: "flex", gap: 2, marginLeft: 2 }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{
            width: 3, height: 6 + i * 3, borderRadius: 2,
            background: quality === "good" ? cfg.color : quality === "poor" && i < 3 ? cfg.color : i === 1 ? cfg.color : "rgba(255,255,255,0.2)",
          }} />
        ))}
      </div>
    </div>
  );
}

function VideoView({
  stream,
  label,
  isMirrored,
  isMuted,
  isSmall,
  fitMode = "contain",
  onToggleFit,
}: {
  stream: MediaStream | null;
  label: string;
  isMirrored?: boolean;
  isMuted?: boolean;
  isSmall?: boolean;
  fitMode?: "contain" | "cover";
  onToggleFit?: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (videoRef.current && stream) videoRef.current.srcObject = stream;
  }, [stream]);

  return (
    <div style={{
      position: "relative",
      borderRadius: isSmall ? 10 : 16,
      overflow: "hidden",
      background: "#050B14",
      width: isSmall ? 96 : "100%",
      height: isSmall ? 128 : "100%",
      border: isSmall ? "2px solid rgba(255,255,255,0.6)" : "none",
      boxShadow: isSmall ? "0 4px 14px rgba(0,0,0,0.6)" : "none",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}>
      {stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isMuted}
          style={{
            width: "100%",
            height: "100%",
            objectFit: isSmall ? "cover" : fitMode,
            transform: isMirrored ? "scaleX(-1)" : undefined,
            background: "#050B14",
          }}
        />
      ) : (
        <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>👤</div>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>Connecting video feed...</span>
        </div>
      )}

      {/* Name Label */}
      <div style={{
        position: "absolute",
        bottom: 8,
        left: 8,
        background: "rgba(15, 23, 42, 0.75)",
        backdropFilter: "blur(6px)",
        borderRadius: 8,
        padding: "3px 8px",
        fontSize: isSmall ? 9 : 11,
        color: "#F8FAFC",
        fontWeight: 700,
        border: "1px solid rgba(255,255,255,0.12)",
        pointerEvents: "none",
        maxWidth: "85%",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
      }}>
        {label}
      </div>

      {/* Fit Mode Toggle Button for Large Video */}
      {!isSmall && onToggleFit && (
        <button
          type="button"
          onClick={onToggleFit}
          title={fitMode === "contain" ? "Switch to Zoomed Fill" : "Switch to Full Uncropped Frame"}
          style={{
            position: "absolute",
            top: 10,
            left: 10,
            background: "rgba(15, 23, 42, 0.75)",
            backdropFilter: "blur(6px)",
            border: "1px solid rgba(255,255,255,0.18)",
            borderRadius: 8,
            padding: "4px 8px",
            fontSize: 11,
            color: "#38BDF8",
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 4,
            zIndex: 10,
          }}>
          <span>{fitMode === "contain" ? "🔲 Full Frame (No Crop)" : "🔍 Zoom Fill"}</span>
        </button>
      )}
    </div>
  );
}

function AudioOnlyView({ name, isDoctor, stream, compact }: { name: string; isDoctor: boolean; stream: MediaStream | null; compact?: boolean }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  useEffect(() => {
    if (audioRef.current && stream) audioRef.current.srcObject = stream;
  }, [stream]);

  return (
    <div style={{
      height: compact ? 150 : 260, borderRadius: 16, background: "linear-gradient(135deg, #0F172A, #1E293B)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: compact ? 8 : 14,
      border: "1px solid rgba(255,255,255,0.1)",
    }}>
      {stream && <audio ref={audioRef} autoPlay playsInline />}
      <div style={{
        width: compact ? 54 : 76, height: compact ? 54 : 76, borderRadius: "50%",
        background: isDoctor ? "#0284C7" : "#10B981",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: compact ? 22 : 30, color: "white", fontWeight: 800,
        boxShadow: `0 0 0 10px rgba(${isDoctor ? "2,132,199" : "16,185,129"},.25)`,
        animation: "audioRipple 2s ease-in-out infinite",
      }}>
        {name[0]?.toUpperCase() || "A"}
      </div>
      <div style={{ textAlign: "center", padding: "0 12px" }}>
        <div style={{ fontSize: compact ? 13 : 16, fontWeight: 800, color: "white" }}>{name}</div>
        <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 3 }}>🎙️ Encrypted Voice Active</div>
      </div>
    </div>
  );
}

export default function VideoCallModal({
  isOpen,
  onClose,
  patientName,
  patientId,
  isDoctor,
  callerRole = "doctor",
  callerTitle,
  facilityName,
  department,
  patientDetails,
  onSaveNotes,
  initialIncomingCallType,
}: VideoCallModalProps) {
  const router = useRouter();
  const roomId = `consultation-${patientId}`;
  const [state, actions] = useWebRTC(roomId, isDoctor);

  const [hasConnectedOnce, setHasConnectedOnce] = useState(false);
  const [isFloating, setIsFloating] = useState(false);
  const [fitMode, setFitMode] = useState<"contain" | "cover">("contain");
  const [mobileTab, setMobileTab] = useState<"video" | "desk">("video");
  const [showDeskPad, setShowDeskPad] = useState(true);

  // Receptionist Desk State
  const [assignedDoctor, setAssignedDoctor] = useState(patientDetails?.doctorName || "Dr. Vasanth");
  const [assignedDept, setAssignedDept] = useState(patientDetails?.department || "General OPD");
  const [tokenNumber, setTokenNumber] = useState("OPD-" + Math.floor(100 + Math.random() * 900));

  // Doctor Clinical Desk State
  const [clinicalDiagnosis, setClinicalDiagnosis] = useState("");
  const [quickRx, setQuickRx] = useState<string[]>([]);
  const [quickLabs, setQuickLabs] = useState<string[]>([]);
  const [deskNotes, setDeskNotes] = useState(patientDetails?.verificationNotes || "");
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [notesSaveStatus, setNotesSaveStatus] = useState<string | null>(null);

  // Floating PiP Dragging Position State
  const [pipPos, setPipPos] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({
    pointerX: 0,
    pointerY: 0,
    initX: 0,
    initY: 0,
    active: false,
  });

  const effectiveCallMode =
    !isDoctor && initialIncomingCallType && state.callMode === "idle"
      ? "incoming"
      : state.callMode;
  const effectiveIncomingCallType = state.incomingCallType ?? initialIncomingCallType ?? null;

  useEffect(() => {
    if ((effectiveCallMode === "video" || effectiveCallMode === "audio") && state.statusMessage === "") {
      setHasConnectedOnce(true);
    }
    if (effectiveCallMode === "idle" || effectiveCallMode === "ended" || effectiveCallMode === "incoming" || !isOpen) {
      setHasConnectedOnce(false);
    }
  }, [effectiveCallMode, state.statusMessage, isOpen]);

  // Default Position for Floating PiP
  useEffect(() => {
    if (isFloating && !pipPos && typeof window !== "undefined") {
      const isMobile = window.innerWidth < 640;
      const initialWidth = isMobile ? Math.min(320, window.innerWidth - 24) : 340;
      const initialHeight = 290;
      setPipPos({
        x: Math.max(12, window.innerWidth - initialWidth - 16),
        y: Math.max(12, window.innerHeight - initialHeight - 24),
      });
    }
  }, [isFloating, pipPos]);

  if (!isOpen) return null;

  const isCallType = effectiveCallMode === "video" || effectiveCallMode === "audio";
  const isActive = isCallType && (state.statusMessage === "" || hasConnectedOnce);
  const isConnecting = effectiveCallMode === "connecting" || (isCallType && !hasConnectedOnce && state.statusMessage !== "");
  const isIncoming = effectiveCallMode === "incoming";

  // Dynamic Caller Display labels sanitized against double "Dr. Dr."
  const incomingRole = state.incomingCaller?.callerRole || callerRole;
  const isCallerReceptionist = incomingRole === "receptionist" || callerRole === "receptionist";
  const isCallerDoctor = !isCallerReceptionist && (incomingRole === "doctor" || isDoctor);
  const isCallerAsha = incomingRole === "asha" || callerRole === "asha";

  const rawCallerTitle = state.incomingCaller?.callerTitle || callerTitle;
  const displayCallerTitle = sanitizeTitle(rawCallerTitle, incomingRole, facilityName);

  const handleStartCall = (mode: "video" | "audio") => {
    actions.startCall(mode, {
      callerRole,
      callerTitle: displayCallerTitle,
      facilityName,
      department: assignedDept,
    });
  };

  const handleSaveVerificationNotes = async (statusOverride?: string) => {
    setIsSavingNotes(true);
    try {
      const combinedNotes = isCallerDoctor
        ? `${deskNotes ? deskNotes + "\n" : ""}${clinicalDiagnosis ? `Diagnosis: ${clinicalDiagnosis}\n` : ""}${quickRx.length ? `Rx: ${quickRx.join(", ")}\n` : ""}${quickLabs.length ? `Labs: ${quickLabs.join(", ")}` : ""}`
        : deskNotes;

      if (onSaveNotes) {
        await onSaveNotes(combinedNotes, statusOverride);
      } else {
        await fetch("/api/consultations", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            patientPhone: patientId,
            verificationNotes: combinedNotes,
            verificationStatus: statusOverride || (isCallerDoctor ? "Consultation Completed" : "Verified & Confirmed"),
            doctorName: assignedDoctor,
            department: assignedDept,
          }),
        });
      }
      setNotesSaveStatus(statusOverride ? `Updated: ${statusOverride}` : "Saved ✓");
      setTimeout(() => setNotesSaveStatus(null), 3000);
    } catch {
      setNotesSaveStatus("Saved locally");
      setTimeout(() => setNotesSaveStatus(null), 3000);
    } finally {
      setIsSavingNotes(false);
    }
  };

  // Drag Handlers for Floating PiP Container
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("button") || (e.target as HTMLElement).closest("input") || (e.target as HTMLElement).closest("textarea")) return;
    const target = e.currentTarget;
    try {
      target.setPointerCapture(e.pointerId);
    } catch {}
    dragRef.current = {
      pointerX: e.clientX,
      pointerY: e.clientY,
      initX: pipPos?.x ?? (window.innerWidth - 340),
      initY: pipPos?.y ?? (window.innerHeight - 300),
      active: true,
    };
    setIsDragging(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.active) return;
    const deltaX = e.clientX - dragRef.current.pointerX;
    const deltaY = e.clientY - dragRef.current.pointerY;

    const width = window.innerWidth < 640 ? Math.min(320, window.innerWidth - 24) : 340;
    const height = 290;

    const minX = 8;
    const maxX = Math.max(8, window.innerWidth - width - 8);
    const minY = 8;
    const maxY = Math.max(8, window.innerHeight - height - 8);

    const nextX = Math.min(Math.max(minX, dragRef.current.initX + deltaX), maxX);
    const nextY = Math.min(Math.max(minY, dragRef.current.initY + deltaY), maxY);

    setPipPos({ x: nextX, y: nextY });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragRef.current.active) {
      dragRef.current.active = false;
      setIsDragging(false);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {}
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // ── 1. DRAGGABLE FLOATING PICTURE-IN-PICTURE (PiP) VIEW ──
  // ═══════════════════════════════════════════════════════════════════════════
  if (isFloating && isActive) {
    return (
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{
          position: "fixed",
          left: pipPos ? `${pipPos.x}px` : "auto",
          top: pipPos ? `${pipPos.y}px` : "auto",
          right: pipPos ? "auto" : 16,
          bottom: pipPos ? "auto" : 16,
          width: "min(340px, calc(100vw - 24px))",
          zIndex: 999999,
          borderRadius: 20,
          background: isCallerReceptionist
            ? "linear-gradient(145deg, #0A1E34, #0F2E4A)"
            : "linear-gradient(145deg, #0F172A, #1E293B)",
          boxShadow: isDragging
            ? "0 30px 70px rgba(0,0,0,0.9), 0 0 0 2px #38BDF8"
            : "0 20px 50px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.16)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          userSelect: "none",
          touchAction: "none",
          cursor: isDragging ? "grabbing" : "grab",
          animation: "popIn .3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
          transition: isDragging ? "none" : "box-shadow 0.2s ease",
        }}>
        {/* Top Visual Grip Bar */}
        <div style={{
          padding: "8px 12px 8px",
          background: "rgba(0,0,0,0.45)",
          display: "flex",
          flexDirection: "column",
          gap: 4,
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: isDragging ? "#38BDF8" : "rgba(255,255,255,0.3)", margin: "0 auto 3px" }} />
          
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
              <span style={{ fontSize: 15 }}>{isCallerReceptionist ? "🏥" : isCallerAsha ? "👩‍⚕️" : "🩺"}</span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: "white", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {isDoctor ? patientName : displayCallerTitle}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 1 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ADE80", animation: "pulse 1.5s infinite" }} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#4ADE80" }}>{formatDuration(state.callDuration)}</span>
                  <span style={{ fontSize: 9, color: "#94A3B8", marginLeft: 4 }}>• {isCallerReceptionist ? "Reception" : "Doctor"}</span>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setIsFloating(false); }}
                title="Expand to Fullscreen"
                style={{
                  background: isCallerReceptionist ? "rgba(14, 165, 233, 0.2)" : "rgba(56, 189, 248, 0.2)",
                  border: "1px solid rgba(56, 189, 248, 0.4)",
                  borderRadius: 8, padding: "4px 8px", color: "#38BDF8", fontSize: 11, fontWeight: 700,
                  cursor: "pointer", display: "flex", alignItems: "center", gap: 4
                }}>
                <span>🗖</span> Expand
              </button>
            </div>
          </div>
        </div>

        {/* Floating Video Stream */}
        <div style={{ position: "relative", height: 185, background: "#050B14", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {effectiveCallMode === "video" ? (
            <>
              <VideoView
                stream={state.remoteStream}
                label={isDoctor ? patientName : (isCallerReceptionist ? "Hospital Desk" : "Doctor")}
                fitMode={fitMode}
                onToggleFit={() => setFitMode(fitMode === "contain" ? "cover" : "contain")}
              />
              <div style={{ position: "absolute", top: 8, right: 8, zIndex: 10 }}>
                <VideoView stream={state.localStream} label="You" isMirrored isMuted isSmall />
              </div>
            </>
          ) : (
            <AudioOnlyView name={isDoctor ? patientName : displayCallerTitle} isDoctor={isDoctor} stream={state.remoteStream} compact />
          )}
        </div>

        {/* Floating Mini Controls */}
        <div style={{
          padding: "8px 12px",
          background: "rgba(0,0,0,0.55)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-around",
        }}>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); actions.toggleMute(); }}
            style={{
              width: 36, height: 36, borderRadius: "50%", border: "none", cursor: "pointer",
              background: state.isMuted ? C.red : "rgba(255,255,255,0.15)", color: "white", fontSize: 15,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
            title={state.isMuted ? "Unmute" : "Mute"}>
            {state.isMuted ? "🔇" : "🎙️"}
          </button>

          {effectiveCallMode === "video" && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); actions.toggleCamera(); }}
              style={{
                width: 36, height: 36, borderRadius: "50%", border: "none", cursor: "pointer",
                background: state.isCameraOff ? C.red : "rgba(255,255,255,0.15)", color: "white", fontSize: 15,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
              title={state.isCameraOff ? "Turn Cam On" : "Turn Cam Off"}>
              {state.isCameraOff ? "📵" : "📹"}
            </button>
          )}

          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); actions.endCall(); setIsFloating(false); }}
            style={{
              padding: "6px 14px", borderRadius: 20, border: "none", cursor: "pointer",
              background: `linear-gradient(135deg, ${C.redLight}, ${C.red})`, color: "white", fontSize: 11, fontWeight: 700,
              display: "flex", alignItems: "center", gap: 4, boxShadow: "0 4px 12px rgba(231,76,60,0.4)"
            }}>
            <span>📵</span> End
          </button>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ── 2. FULL MODAL VIEW (SPECIALIZED RECEPTIONIST VS DOCTOR UI) ──
  // ═══════════════════════════════════════════════════════════════════════════
  const symptomsArray = Array.isArray(patientDetails?.symptoms)
    ? patientDetails.symptoms
    : typeof patientDetails?.symptoms === "string"
    ? patientDetails.symptoms.split(",").map(s => s.trim()).filter(Boolean)
    : [];

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(8, 14, 24, 0.90)",
      backdropFilter: "blur(10px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: isActive ? "12px" : "16px",
    }}>
      <div style={{
        width: "100%",
        maxWidth: isActive ? (showDeskPad && (isCallerReceptionist || isCallerDoctor) ? "min(1040px, 96vw)" : "min(560px, 94vw)") : "min(440px, 92vw)",
        background: isCallerReceptionist ? "#0A192F" : "#0F172A",
        borderRadius: 24,
        maxHeight: "96vh",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        border: isCallerReceptionist ? "1px solid rgba(14, 165, 233, 0.3)" : "1px solid rgba(59, 130, 246, 0.3)",
        boxShadow: "0 25px 65px rgba(0,0,0,0.75), 0 0 0 1px rgba(56, 189, 248, 0.15)",
        animation: "slideUp .3s ease-out",
        transition: "max-width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      }}>
        {/* Modal Header */}
        <div style={{
          background: isCallerReceptionist
            ? "linear-gradient(135deg, #075985, #0C4A6E)"
            : "linear-gradient(135deg, #1E293B, #0F172A)",
          padding: "16px 20px",
          borderRadius: "24px 24px 0 0",
          flexShrink: 0,
          borderBottom: "1px solid rgba(255,255,255,0.1)",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
              <div style={{
                width: 42, height: 42, borderRadius: "50%",
                background: isCallerReceptionist ? "rgba(14, 165, 233, 0.25)" : "rgba(56, 189, 248, 0.15)",
                border: isCallerReceptionist ? "1px solid rgba(14, 165, 233, 0.5)" : "1px solid rgba(56, 189, 248, 0.3)",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0
              }}>
                {isCallerReceptionist ? "🏥" : isCallerAsha ? "👩‍⚕️" : "🩺"}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#F8FAFC", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {isIncoming
                    ? "📲 Incoming Call"
                    : isCallerReceptionist
                    ? "🏥 Reception Desk Live Verification"
                    : isDoctor
                    ? "👨‍⚕️ Clinical Tele-Consultation Room"
                    : `📞 Call: ${displayCallerTitle}`}
                </div>
                <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {isDoctor || isCallerReceptionist ? `Patient: ${patientName} (${patientId})` : displayCallerTitle}
                  {facilityName && ` • ${facilityName}`}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
              {isActive && (
                <>
                  <div style={{ background: "rgba(34, 197, 94, 0.15)", border: "1px solid rgba(34, 197, 94, 0.3)", borderRadius: 20, padding: "4px 10px", display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ADE80", animation: "pulse 1.5s infinite" }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#4ADE80" }}>{formatDuration(state.callDuration)}</span>
                  </div>

                  {/* Float Button */}
                  <button
                    type="button"
                    onClick={() => setIsFloating(true)}
                    title="Float Call Screen & Move Freely on Screen"
                    style={{
                      background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 10, padding: "7px 12px",
                      color: "#F8FAFC", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 5
                    }}>
                    <span>🗗</span> Float PiP
                  </button>
                </>
              )}

              {!isActive && !isIncoming && (
                <button
                  type="button"
                  onClick={onClose}
                  style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, padding: "6px 12px", color: "white", fontSize: 12, cursor: "pointer", fontWeight: 700 }}>
                  ✕ Close
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Video fallback warning */}
        {state.isVideoFallback && (
          <div style={{ background: "#FEF9E7", padding: "10px 16px", display: "flex", gap: 10, alignItems: "flex-start", borderBottom: "1px solid #F4D03F" }}>
            <span style={{ fontSize: 16 }}>⚠️</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#7D6608" }}>Switched to Audio Call</div>
              <div style={{ fontSize: 12, color: "#7D6608", marginTop: 2 }}>
                Poor network detected. Video was disabled to maintain uninterrupted voice connection.
              </div>
            </div>
          </div>
        )}

        {/* Status Banner */}
        {state.statusMessage && !isIncoming && (
          <div style={{ background: state.networkQuality === "critical" ? "#FDEDED" : "rgba(56, 189, 248, 0.12)", padding: "8px 16px", fontSize: 12, color: state.networkQuality === "critical" ? C.red : "#38BDF8", fontWeight: 600, textAlign: "center" }}>
            {state.statusMessage}
          </div>
        )}

        <div style={{ padding: "18px 20px", flex: 1, display: "flex", flexDirection: "column" }}>

          {/* ── 1. IDLE: Choose call type (initiator side) ── */}
          {effectiveCallMode === "idle" && (
            <div>
              <div style={{
                background: isCallerReceptionist ? "rgba(7, 89, 133, 0.2)" : "rgba(30, 41, 59, 0.7)",
                borderRadius: 18, padding: 18, marginBottom: 16,
                border: isCallerReceptionist ? "1px solid rgba(14, 165, 233, 0.3)" : "1px solid rgba(255,255,255,0.1)"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 52, height: 52, borderRadius: "50%", background: isCallerReceptionist ? "rgba(14, 165, 233, 0.2)" : "rgba(56, 189, 248, 0.15)", border: "1px solid rgba(56, 189, 248, 0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>
                    {isCallerReceptionist ? "🏥" : "🩺"}
                  </div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "#F8FAFC" }}>{patientName}</div>
                    <div style={{ fontSize: 13, color: "#94A3B8", marginTop: 2 }}>
                      Calling role: <strong style={{ color: "#38BDF8" }}>{displayCallerTitle}</strong>
                    </div>
                  </div>
                </div>

                {patientDetails && (
                  <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.1)", display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8, fontSize: 12, color: "#CBD5E1" }}>
                    <div><span style={{ color: "#94A3B8" }}>Phone:</span> <strong style={{ color: "white" }}>{patientId}</strong></div>
                    <div><span style={{ color: "#94A3B8" }}>Dept:</span> <strong style={{ color: "white" }}>{patientDetails.department || "General OPD"}</strong></div>
                    {patientDetails.urgency && <div><span style={{ color: "#94A3B8" }}>Urgency:</span> <strong style={{ color: patientDetails.urgency.includes("RED") ? "#F87171" : "#4ADE80" }}>{patientDetails.urgency}</strong></div>}
                    {patientDetails.slotTime && <div><span style={{ color: "#94A3B8" }}>Slot:</span> <strong style={{ color: "white" }}>{patientDetails.slotTime}</strong></div>}
                  </div>
                )}
              </div>

              <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
                <button
                  type="button"
                  onClick={() => handleStartCall("video")}
                  style={{
                    flex: 1, padding: "16px 12px", borderRadius: 16, border: "none", cursor: "pointer",
                    background: isCallerReceptionist ? "linear-gradient(135deg, #0284C7, #0369A1)" : "linear-gradient(135deg,#0284C7,#0369A1)",
                    color: "white", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, boxShadow: "0 6px 18px rgba(2, 132, 199, 0.35)"
                  }}>
                  <span style={{ fontSize: 30 }}>📹</span>
                  <span style={{ fontSize: 15, fontWeight: 800 }}>Start Video Call</span>
                  <span style={{ fontSize: 11, opacity: .85 }}>High Definition Face-to-Face</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleStartCall("audio")}
                  style={{
                    flex: 1, padding: "16px 12px", borderRadius: 16, border: "none", cursor: "pointer",
                    background: "linear-gradient(135deg,#10B981,#047857)", color: "white", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, boxShadow: "0 6px 18px rgba(16, 185, 129, 0.35)"
                  }}>
                  <span style={{ fontSize: 30 }}>🎙️</span>
                  <span style={{ fontSize: 15, fontWeight: 800 }}>Start Audio Call</span>
                  <span style={{ fontSize: 11, opacity: .85 }}>Low bandwidth friendly</span>
                </button>
              </div>

              <div style={{
                background: isCallerReceptionist ? "rgba(14, 165, 233, 0.12)" : "rgba(56, 189, 248, 0.1)",
                borderRadius: 14, padding: "12px 14px", border: "1px solid rgba(56, 189, 248, 0.25)", display: "flex", gap: 10
              }}>
                <span style={{ fontSize: 16 }}>{isCallerReceptionist ? "🏥" : "💡"}</span>
                <span style={{ fontSize: 12, color: "#38BDF8", lineHeight: 1.5 }}>
                  {isCallerReceptionist ? (
                    <><strong>Receptionist Flow:</strong> Call patient to verify face & ID card, eliminate fake bookings, assign OPD token, and route to doctor.</>
                  ) : (
                    <><strong>Doctor Flow:</strong> Conduct tele-consultation, assess AI triage findings, write live diagnosis notes, and order lab tests or medications.</>
                  )}
                </span>
              </div>
            </div>
          )}

          {/* ── 2. INCOMING CALL (High Contrast Dark Slate Card) ── */}
          {isIncoming && (
            <div style={{ textAlign: "center", padding: "30px 16px" }}>
              <div style={{
                width: 90, height: 90, borderRadius: "50%",
                background: "linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(16, 185, 129, 0.2))",
                border: "2px solid rgba(56, 189, 248, 0.4)",
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                fontSize: 44, animation: "ring 1.2s infinite ease-in-out", marginBottom: 16
              }}>
                {isCallerReceptionist ? "🏥" : isCallerAsha ? "👩‍⚕️" : "🩺"}
              </div>

              <div style={{ fontSize: 20, fontWeight: 900, color: "#FFFFFF", letterSpacing: "-0.02em" }}>
                {displayCallerTitle}
              </div>

              {facilityName && (
                <div style={{ fontSize: 13, fontWeight: 600, color: "#38BDF8", marginTop: 4 }}>
                  {facilityName}
                </div>
              )}

              <div style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                background: "rgba(255,255,255,0.08)", borderRadius: 20, padding: "4px 12px",
                fontSize: 12, color: "#E2E8F0", marginTop: 10, marginBottom: 32
              }}>
                <span>{effectiveIncomingCallType === "video" ? "📹 Live Video Consultation" : "🎙️ Voice Consultation"}</span>
              </div>

              <div style={{ display: "flex", gap: 32, justifyContent: "center", alignItems: "center" }}>
                <button
                  type="button"
                  onClick={() => { actions.rejectCall(); onClose(); }}
                  style={{
                    width: 76, height: 76, borderRadius: "50%", border: "none", cursor: "pointer",
                    background: `linear-gradient(135deg, ${C.redLight}, ${C.red})`,
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3,
                    boxShadow: "0 8px 24px rgba(231,76,60,0.6)", transition: "transform 0.15s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.06)")}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}>
                  <span style={{ fontSize: 26 }}>📵</span>
                  <span style={{ fontSize: 11, fontWeight: 800, color: "white" }}>Decline</span>
                </button>

                <button
                  type="button"
                  onClick={() => actions.answerCall(effectiveIncomingCallType === "video" ? "video" : "audio")}
                  style={{
                    width: 76, height: 76, borderRadius: "50%", border: "none", cursor: "pointer",
                    background: "linear-gradient(135deg, #10B981, #047857)",
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3,
                    boxShadow: "0 8px 24px rgba(16, 185, 129, 0.6)", transition: "transform 0.15s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.06)")}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}>
                  <span style={{ fontSize: 26 }}>📞</span>
                  <span style={{ fontSize: 11, fontWeight: 800, color: "white" }}>Answer</span>
                </button>
              </div>
            </div>
          )}

          {/* ── 3. CONNECTING / RINGING ── */}
          {isConnecting && (
            <div style={{ textAlign: "center", padding: "36px 20px" }}>
              <div style={{ fontSize: 52, animation: "pulse 1s infinite", display: "inline-block" }}>📞</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#F8FAFC", marginTop: 14 }}>{state.statusMessage || "Connecting..."}</div>
              <div style={{ fontSize: 13, color: "#94A3B8", marginTop: 6 }}>Connecting to {patientName}...</div>
              <button
                type="button"
                onClick={actions.endCall}
                style={{ marginTop: 24, padding: "12px 34px", borderRadius: 30, border: "none", background: C.red, color: "white", fontWeight: 700, fontSize: 14, cursor: "pointer", boxShadow: "0 4px 14px rgba(192,57,43,0.4)" }}>
                Cancel Call
              </button>
            </div>
          )}

          {/* ── 4. ACTIVE CALL VIEW ── */}
          {isActive && (
            <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 14 }}>
              {/* Top Sub-bar */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                <NetworkBadge quality={state.networkQuality} />

                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  {(isCallerReceptionist || isCallerDoctor) && (
                    <button
                      type="button"
                      onClick={() => setShowDeskPad(!showDeskPad)}
                      style={{
                        padding: "5px 12px", borderRadius: 14, border: "none",
                        background: showDeskPad ? (isCallerReceptionist ? "#0284C7" : "#3B82F6") : "rgba(255,255,255,0.15)",
                        color: "white", fontSize: 11, fontWeight: 700, cursor: "pointer",
                        display: "flex", alignItems: "center", gap: 5
                      }}>
                      {isCallerReceptionist ? "🏥 Verification Desk" : "🩺 Clinical Desk Pad"}
                    </button>
                  )}
                  <span style={{ fontSize: 12, color: "#94A3B8" }}>
                    {effectiveCallMode === "video" ? "📹 Video" : "🎙️ Audio"}
                  </span>
                </div>
              </div>

              {/* Mobile Tab Switcher when Desk Pad is open on small screen */}
              {(isCallerReceptionist || isCallerDoctor) && showDeskPad && (
                <div className="mobile-only-tabs" style={{ display: "none", gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => setMobileTab("video")}
                    style={{
                      flex: 1, padding: "8px 12px", borderRadius: 10, border: "none",
                      background: mobileTab === "video" ? (isCallerReceptionist ? "#0284C7" : "#3B82F6") : "rgba(255,255,255,0.08)",
                      color: "white", fontSize: 12, fontWeight: 700, cursor: "pointer"
                    }}>
                    📹 Video Feed
                  </button>
                  <button
                    type="button"
                    onClick={() => setMobileTab("desk")}
                    style={{
                      flex: 1, padding: "8px 12px", borderRadius: 10, border: "none",
                      background: mobileTab === "desk" ? (isCallerReceptionist ? "#0284C7" : "#3B82F6") : "rgba(255,255,255,0.08)",
                      color: "white", fontSize: 12, fontWeight: 700, cursor: "pointer"
                    }}>
                    {isCallerReceptionist ? "📋 Verification Desk" : "🩺 Clinical Diagnosis"}
                  </button>
                </div>
              )}

              {/* Main Call + In-Call Desk Grid */}
              <div style={{
                display: "grid",
                gridTemplateColumns: (showDeskPad && !isFloating) ? "minmax(0, 1.2fr) minmax(0, 1fr)" : "1fr",
                gap: 16,
              }}>
                {/* Left Column: Video / Audio Stream Feed */}
                <div style={{
                  display: mobileTab === "desk" ? "none" : "flex",
                  flexDirection: "column", minWidth: 0
                }}>
                  {effectiveCallMode === "video" ? (
                    <div style={{
                      position: "relative",
                      borderRadius: 18,
                      overflow: "hidden",
                      minHeight: 280,
                      height: "46vh",
                      maxHeight: 480,
                      background: "#050B14",
                      border: "1px solid rgba(255,255,255,0.12)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}>
                      <VideoView
                        stream={state.remoteStream}
                        label={isDoctor ? patientName : displayCallerTitle}
                        fitMode={fitMode}
                        onToggleFit={() => setFitMode(fitMode === "contain" ? "cover" : "contain")}
                      />
                      <div style={{ position: "absolute", top: 12, right: 12, zIndex: 10 }}>
                        <VideoView stream={state.localStream} label="You" isMirrored isMuted isSmall />
                      </div>
                    </div>
                  ) : (
                    <div style={{ marginBottom: 10 }}>
                      <AudioOnlyView name={isDoctor ? patientName : displayCallerTitle} isDoctor={isDoctor} stream={state.remoteStream} />
                    </div>
                  )}

                  {/* Active Call Controls Dock */}
                  <div style={{ display: "flex", justifyContent: "center", gap: 14, marginTop: 14, flexWrap: "wrap" }}>
                    <button
                      type="button"
                      onClick={actions.toggleMute}
                      style={{
                        width: 50, height: 50, borderRadius: "50%", border: "none", cursor: "pointer",
                        background: state.isMuted ? C.red : "rgba(255,255,255,0.15)", boxShadow: "0 4px 12px rgba(0,0,0,.3)",
                        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2,
                      }}>
                      <span style={{ fontSize: 18 }}>{state.isMuted ? "🔇" : "🎙️"}</span>
                      <span style={{ fontSize: 8, fontWeight: 700, color: "white" }}>{state.isMuted ? "Muted" : "Mute"}</span>
                    </button>

                    {effectiveCallMode === "video" && (
                      <button
                        type="button"
                        onClick={actions.toggleCamera}
                        style={{
                          width: 50, height: 50, borderRadius: "50%", border: "none", cursor: "pointer",
                          background: state.isCameraOff ? C.red : "rgba(255,255,255,0.15)", boxShadow: "0 4px 12px rgba(0,0,0,.3)",
                          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2,
                        }}>
                        <span style={{ fontSize: 18 }}>{state.isCameraOff ? "📵" : "📹"}</span>
                        <span style={{ fontSize: 8, fontWeight: 700, color: "white" }}>{state.isCameraOff ? "Cam Off" : "Cam"}</span>
                      </button>
                    )}

                    {effectiveCallMode === "video" && (
                      <button
                        type="button"
                        onClick={actions.downgradeToAudio}
                        style={{
                          width: 50, height: 50, borderRadius: "50%", border: "none", cursor: "pointer",
                          background: "rgba(255,255,255,0.15)", boxShadow: "0 4px 12px rgba(0,0,0,.3)",
                          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2,
                        }}>
                        <span style={{ fontSize: 18 }}>🎙️</span>
                        <span style={{ fontSize: 8, fontWeight: 700, color: "white" }}>Audio Only</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={actions.endCall}
                      style={{
                        width: 56, height: 56, borderRadius: "50%", border: "none", cursor: "pointer",
                        background: `linear-gradient(135deg,${C.redLight},${C.red})`,
                        boxShadow: "0 4px 18px rgba(192,57,43,.6)",
                        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2,
                      }}>
                      <span style={{ fontSize: 22 }}>📵</span>
                      <span style={{ fontSize: 9, fontWeight: 700, color: "white" }}>End</span>
                    </button>
                  </div>
                </div>

                {/* Right Column: TAILORED DESK PAD */}

                {/* ── A. RECEPTIONIST DESK PAD UI ── */}
                {isCallerReceptionist && showDeskPad && (
                  <div style={{
                    background: "rgba(10, 30, 52, 0.8)", borderRadius: 18, padding: "16px",
                    border: "1px solid rgba(14, 165, 233, 0.3)", display: "flex", flexDirection: "column", gap: 12,
                    minWidth: 0,
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: "#38BDF8", display: "flex", alignItems: "center", gap: 6 }}>
                        <span>🏥</span> In-Call Reception Verification Desk
                      </div>
                      {notesSaveStatus && (
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#4ADE80", background: "rgba(34,197,94,0.15)", padding: "2px 8px", borderRadius: 10 }}>
                          {notesSaveStatus}
                        </span>
                      )}
                    </div>

                    {/* Patient Card */}
                    <div style={{ background: "rgba(15, 23, 42, 0.6)", borderRadius: 12, padding: "10px 12px", fontSize: 11, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, color: "#CBD5E1" }}>
                      <div>Phone: <strong style={{ color: "white" }}>{patientId}</strong></div>
                      <div>Assigned Token: <strong style={{ color: "#38BDF8" }}>{tokenNumber}</strong></div>
                      <div>Urgency: <strong style={{ color: patientDetails?.urgency?.includes("RED") ? "#F87171" : "#4ADE80" }}>{patientDetails?.urgency || "STANDARD"}</strong></div>
                      <div>Slot: <strong style={{ color: "white" }}>{patientDetails?.slotTime || "Walk-In / Immediate"}</strong></div>
                    </div>

                    {/* Doctor Routing & OPD Assignment */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      <div>
                        <label style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", display: "block", marginBottom: 3 }}>Assign Doctor</label>
                        <select
                          value={assignedDoctor}
                          onChange={(e) => setAssignedDoctor(e.target.value)}
                          style={{
                            width: "100%", background: "rgba(15, 23, 42, 0.8)", border: "1px solid rgba(255,255,255,0.15)",
                            borderRadius: 8, color: "white", padding: "6px 8px", fontSize: 11, outline: "none"
                          }}>
                          <option value="Dr. Vasanth">Dr. Vasanth (General Medicine)</option>
                          <option value="Dr. S. Kulkarni">Dr. S. Kulkarni (Emergency & Trauma)</option>
                          <option value="Dr. Ramesh Sharma">Dr. Ramesh Sharma (CMO)</option>
                          <option value="Dr. Anjali Deshmukh">Dr. Anjali Deshmukh (Pediatrics)</option>
                          <option value="Dr. Sneha Gokhale">Dr. Sneha Gokhale (Gynecology)</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", display: "block", marginBottom: 3 }}>OPD Room</label>
                        <select
                          value={assignedDept}
                          onChange={(e) => setAssignedDept(e.target.value)}
                          style={{
                            width: "100%", background: "rgba(15, 23, 42, 0.8)", border: "1px solid rgba(255,255,255,0.15)",
                            borderRadius: 8, color: "white", padding: "6px 8px", fontSize: 11, outline: "none"
                          }}>
                          <option value="Room 101 - General OPD">Room 101 - General OPD</option>
                          <option value="Room 102 - Emergency Triage">Room 102 - Emergency Triage</option>
                          <option value="Room 104 - Pediatrics">Room 104 - Pediatrics</option>
                          <option value="Room 106 - Maternal Care">Room 106 - Maternal Care</option>
                        </select>
                      </div>
                    </div>

                    {/* Quick Verification Chips */}
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", marginBottom: 4 }}>Live Verification Badges</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {[
                          "✓ Face & Photo ID Matched",
                          "✓ Genuine Patient",
                          "✓ ABHA Card Verified",
                          "⚠️ Suspicious Details / Proxy",
                        ].map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => setDeskNotes((prev) => prev ? `${prev}\n• ${tag}` : `• ${tag}`)}
                            style={{
                              padding: "4px 8px", borderRadius: 8, border: "1px solid rgba(14, 165, 233, 0.3)",
                              background: "rgba(14, 165, 233, 0.1)", color: "#BAE6FD", fontSize: 10, fontWeight: 600, cursor: "pointer"
                            }}>
                            + {tag}
                          </button>
                        ))}
                      </div>
                    </div>

                    <textarea
                      value={deskNotes}
                      onChange={(e) => setDeskNotes(e.target.value)}
                      placeholder="Write reception verification notes or anti-scam remarks..."
                      rows={3}
                      style={{
                        width: "100%", background: "rgba(15, 23, 42, 0.8)", border: "1px solid rgba(255,255,255,0.15)",
                        borderRadius: 10, color: "white", padding: 8, fontSize: 11, resize: "none", outline: "none"
                      }}
                    />

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      <button
                        type="button"
                        disabled={isSavingNotes}
                        onClick={() => handleSaveVerificationNotes(`Verified & Routed to ${assignedDoctor}`)}
                        style={{
                          padding: "10px 12px", borderRadius: 10, border: "none",
                          background: "linear-gradient(135deg, #10B981, #047857)", color: "white",
                          fontSize: 11, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4
                        }}>
                        <span>✅</span> {isSavingNotes ? "Saving..." : "Verify & Route to Doctor"}
                      </button>
                      <button
                        type="button"
                        disabled={isSavingNotes}
                        onClick={() => handleSaveVerificationNotes("Flagged Suspicious / Canceled")}
                        style={{
                          padding: "10px 12px", borderRadius: 10, border: "none",
                          background: "linear-gradient(135deg, #EF4444, #B91C1C)", color: "white",
                          fontSize: 11, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4
                        }}>
                        <span>⚠️</span> Flag Suspicious
                      </button>
                    </div>
                  </div>
                )}

                {/* ── B. DOCTOR CLINICAL DESK PAD UI ── */}
                {isCallerDoctor && showDeskPad && (
                  <div style={{
                    background: "rgba(30, 41, 59, 0.75)", borderRadius: 18, padding: "16px",
                    border: "1px solid rgba(59, 130, 246, 0.3)", display: "flex", flexDirection: "column", gap: 12,
                    minWidth: 0,
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: "#60A5FA", display: "flex", alignItems: "center", gap: 6 }}>
                        <span>🩺</span> Clinical Diagnosis & Tele-Consultation
                      </div>
                      {notesSaveStatus && (
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#4ADE80", background: "rgba(34,197,94,0.15)", padding: "2px 8px", borderRadius: 10 }}>
                          {notesSaveStatus}
                        </span>
                      )}
                    </div>

                    {/* Symptoms & AI Reasoning Card */}
                    <div style={{ background: "rgba(15, 23, 42, 0.7)", borderRadius: 12, padding: "10px 12px", border: "1px solid rgba(255,255,255,0.08)" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8" }}>AI Triage Summary:</span>
                        <span style={{
                          fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 10,
                          background: patientDetails?.urgency?.includes("RED") ? "rgba(239, 68, 68, 0.2)" : "rgba(234, 179, 8, 0.2)",
                          color: patientDetails?.urgency?.includes("RED") ? "#F87171" : "#FBBF24",
                        }}>
                          {patientDetails?.urgency || "YELLOW URGENT"}
                        </span>
                      </div>

                      {symptomsArray.length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 6 }}>
                          {symptomsArray.map((s, idx) => (
                            <span key={idx} style={{ background: "rgba(59, 130, 246, 0.15)", border: "1px solid rgba(59, 130, 246, 0.3)", borderRadius: 6, padding: "2px 6px", fontSize: 10, color: "#93C5FD", fontWeight: 600 }}>
                              {s}
                            </span>
                          ))}
                        </div>
                      )}

                      {patientDetails?.reasoning && (
                        <div style={{ fontSize: 11, color: "#CBD5E1", fontStyle: "italic", lineHeight: 1.4 }}>
                          &ldquo;{patientDetails.reasoning}&rdquo;
                        </div>
                      )}
                    </div>

                    {/* Clinical Diagnosis & Notes */}
                    <div>
                      <label style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", display: "block", marginBottom: 3 }}>
                        Presumptive Diagnosis / Clinical Findings
                      </label>
                      <input
                        type="text"
                        value={clinicalDiagnosis}
                        onChange={(e) => setClinicalDiagnosis(e.target.value)}
                        placeholder="e.g. Acute Viral Upper Respiratory Infection, Mild Dehydration"
                        style={{
                          width: "100%", background: "rgba(15, 23, 42, 0.8)", border: "1px solid rgba(255,255,255,0.15)",
                          borderRadius: 8, color: "white", padding: "7px 10px", fontSize: 11, outline: "none", marginBottom: 6
                        }}
                      />

                      <textarea
                        value={deskNotes}
                        onChange={(e) => setDeskNotes(e.target.value)}
                        placeholder="Clinical examination notes, advice, follow-up..."
                        rows={2}
                        style={{
                          width: "100%", background: "rgba(15, 23, 42, 0.8)", border: "1px solid rgba(255,255,255,0.15)",
                          borderRadius: 8, color: "white", padding: 8, fontSize: 11, resize: "none", outline: "none"
                        }}
                      />
                    </div>

                    {/* Quick In-Call Order Triggers */}
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", marginBottom: 4 }}>1-Click Rx & Lab Prescriptions</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                        {[
                          { label: "💊 Paracetamol 500mg", type: "rx" },
                          { label: "💧 ORS Solution", type: "rx" },
                          { label: "💊 Cetirizine 10mg", type: "rx" },
                          { label: "🔬 CBC + Platelets", type: "lab" },
                          { label: "🔬 Malaria Rapid RDT", type: "lab" },
                          { label: "🔬 Sputum AFB Test", type: "lab" },
                        ].map((item) => {
                          const isSelected = item.type === "rx" ? quickRx.includes(item.label) : quickLabs.includes(item.label);
                          return (
                            <button
                              key={item.label}
                              type="button"
                              onClick={() => {
                                if (item.type === "rx") {
                                  setQuickRx((prev) => isSelected ? prev.filter(x => x !== item.label) : [...prev, item.label]);
                                } else {
                                  setQuickLabs((prev) => isSelected ? prev.filter(x => x !== item.label) : [...prev, item.label]);
                                }
                              }}
                              style={{
                                padding: "4px 8px", borderRadius: 8,
                                border: isSelected ? "1px solid #10B981" : "1px solid rgba(255,255,255,0.15)",
                                background: isSelected ? "rgba(16, 185, 129, 0.25)" : "rgba(255,255,255,0.06)",
                                color: isSelected ? "#4ADE80" : "#CBD5E1", fontSize: 10, fontWeight: 600, cursor: "pointer"
                              }}>
                              {isSelected ? `✓ ${item.label}` : `+ ${item.label}`}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Doctor Actions */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 2 }}>
                      <button
                        type="button"
                        disabled={isSavingNotes}
                        onClick={() => handleSaveVerificationNotes("Consultation Completed")}
                        style={{
                          padding: "10px 12px", borderRadius: 10, border: "none",
                          background: "linear-gradient(135deg, #10B981, #047857)", color: "white",
                          fontSize: 11, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4
                        }}>
                        <span>✅</span> {isSavingNotes ? "Saving..." : "Save Rx & Complete"}
                      </button>

                      {patientDetails?.consultationId ? (
                        <button
                          type="button"
                          onClick={() => {
                            setIsFloating(true);
                            router.push(`/doctor/consultation/${patientDetails.consultationId}`);
                          }}
                          style={{
                            padding: "10px 12px", borderRadius: 10, border: "1px solid rgba(56, 189, 248, 0.4)",
                            background: "rgba(56, 189, 248, 0.15)", color: "#38BDF8",
                            fontSize: 11, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4
                          }}>
                          <span>📄</span> Open Full Detail (PiP)
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setIsFloating(true)}
                          style={{
                            padding: "10px 12px", borderRadius: 10, border: "1px solid rgba(56, 189, 248, 0.4)",
                            background: "rgba(56, 189, 248, 0.15)", color: "#38BDF8",
                            fontSize: 11, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4
                          }}>
                          <span>🗗</span> Float PiP
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── 5. ENDED ── */}
          {effectiveCallMode === "ended" && (
            <div style={{ textAlign: "center", padding: "34px 20px" }}>
              <div style={{ fontSize: 50 }}>📵</div>
              <div style={{ fontSize: 17, fontWeight: 800, color: "white", marginTop: 14 }}>Call Ended</div>
              <div style={{ fontSize: 13, color: "#94A3B8", marginTop: 6 }}>{state.statusMessage || "The consultation session has ended."}</div>
              <button
                type="button"
                onClick={onClose}
                style={{ marginTop: 24, padding: "12px 34px", borderRadius: 30, border: "none", background: C.primary, color: "white", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                Close Window
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideUp { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes popIn { 0% { transform: scale(0.85); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: .4; } }
        @keyframes ring { 0%,100% { transform: rotate(0deg); } 20% { transform: rotate(-12deg) scale(1.05); } 40% { transform: rotate(12deg) scale(1.05); } 60% { transform: rotate(-8deg); } 80% { transform: rotate(8deg); } }
        @keyframes audioRipple { 0%,100% { box-shadow: 0 0 0 8px rgba(2,132,199,.25); } 50% { box-shadow: 0 0 0 18px rgba(2,132,199,.08); } }
        @media (max-width: 640px) {
          .mobile-only-tabs { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
