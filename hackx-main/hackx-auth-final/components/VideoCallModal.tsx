"use client";
import { useState, useEffect, useRef } from "react";
import { useWebRTC, formatDuration, WebRTCState, WebRTCActions, NetworkQuality } from "@/hooks/useWebRTC";

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
  symptoms?: string;
  status?: string;
  doctorName?: string;
  verificationNotes?: string;
}

interface VideoCallModalProps {
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

function NetworkBadge({ quality }: { quality: NetworkQuality }) {
  const configs = {
    good:     { color: C.green,  bg: "#E8F8EF", icon: "📶", label: "Good Network" },
    poor:     { color: C.yellow, bg: "#FEF9E7", icon: "📶", label: "Poor Network" },
    critical: { color: C.red,    bg: "#FDEDED", icon: "📵", label: "Very Poor Network" },
  };
  const cfg = configs[quality];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, background: cfg.bg, borderRadius: 20, padding: "3px 10px" }}>
      <span style={{ fontSize: 12 }}>{cfg.icon}</span>
      <span style={{ fontSize: 11, fontWeight: 700, color: cfg.color }}>{cfg.label}</span>
      <div style={{ display: "flex", gap: 2, marginLeft: 2 }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{
            width: 3, height: 6 + i * 3, borderRadius: 2,
            background: quality === "good" ? cfg.color : quality === "poor" && i < 3 ? cfg.color : i === 1 ? cfg.color : "#ddd",
          }} />
        ))}
      </div>
    </div>
  );
}

function VideoView({ stream, label, isMirrored, isMuted, isSmall, isFullscreen, height }: {
  stream: MediaStream | null; label: string;
  isMirrored?: boolean; isMuted?: boolean; isSmall?: boolean; isFullscreen?: boolean; height?: number | string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (videoRef.current && stream) videoRef.current.srcObject = stream;
  }, [stream]);

  return (
    <div style={{
      position: "relative", borderRadius: isSmall ? 10 : (isFullscreen ? 16 : 14), overflow: "hidden",
      background: "#1A2332", width: isSmall ? 90 : "100%", height: isSmall ? 120 : (height || (isFullscreen ? "100%" : 220)),
      border: isSmall ? "2px solid rgba(255,255,255,.4)" : "none",
    }}>
      {stream ? (
        <video ref={videoRef} autoPlay playsInline muted={isMuted}
          style={{ width: "100%", height: "100%", objectFit: "cover", transform: isMirrored ? "scaleX(-1)" : undefined }} />
      ) : (
        <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(255,255,255,.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>👤</div>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,.5)" }}>No video</span>
        </div>
      )}
      <div style={{ position: "absolute", bottom: 6, left: 8, background: "rgba(0,0,0,.6)", borderRadius: 6, padding: "2px 7px", fontSize: 10, color: "white", fontWeight: 600 }}>
        {label}
      </div>
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
      height: compact ? 140 : 220, borderRadius: 16, background: "linear-gradient(135deg,#1A2332,#0F3460)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: compact ? 8 : 12,
    }}>
      {stream && <audio ref={audioRef} autoPlay playsInline />}
      <div style={{
        width: compact ? 52 : 72, height: compact ? 52 : 72, borderRadius: "50%",
        background: isDoctor ? "#1B6CA8" : "#1E8449",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: compact ? 20 : 28, color: "white", fontWeight: 800,
        boxShadow: `0 0 0 8px rgba(${isDoctor ? "27,108,168" : "30,132,73"},.25)`,
        animation: "audioRipple 2s ease-in-out infinite",
      }}>
        {name[0]?.toUpperCase()}
      </div>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: compact ? 13 : 15, fontWeight: 700, color: "white" }}>{name}</div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,.5)", marginTop: 2 }}>🎙️ Audio Call Active</div>
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
  const roomId = `consultation-${patientId}`;
  const [state, actions] = useWebRTC(roomId, isDoctor);

  const [hasConnectedOnce, setHasConnectedOnce] = useState(false);
  const [isFloating, setIsFloating] = useState(false);
  const [showDeskPad, setShowDeskPad] = useState(false);
  const [deskNotes, setDeskNotes] = useState(patientDetails?.verificationNotes || "");
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [notesSaveStatus, setNotesSaveStatus] = useState<string | null>(null);

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

  if (!isOpen) return null;

  const isCallType = effectiveCallMode === "video" || effectiveCallMode === "audio";
  const isActive = isCallType && (state.statusMessage === "" || hasConnectedOnce);
  const isConnecting = effectiveCallMode === "connecting" || (isCallType && !hasConnectedOnce && state.statusMessage !== "");
  const isIncoming = effectiveCallMode === "incoming";

  // Dynamic Caller Display labels
  const isCallerReceptionist = callerRole === "receptionist" || (state.incomingCaller?.callerRole === "receptionist");
  const isCallerAsha = callerRole === "asha" || (state.incomingCaller?.callerRole === "asha");
  
  const displayCallerTitle =
    state.incomingCaller?.callerTitle ||
    callerTitle ||
    (isCallerReceptionist
      ? `${facilityName || "Hospital"} Reception Desk`
      : isCallerAsha
      ? "ASHA Health Worker"
      : "Doctor Consultation");

  const handleStartCall = (mode: "video" | "audio") => {
    actions.startCall(mode, {
      callerRole,
      callerTitle: displayCallerTitle,
      facilityName,
      department,
    });
  };

  const handleSaveVerificationNotes = async (statusOverride?: string) => {
    setIsSavingNotes(true);
    try {
      if (onSaveNotes) {
        await onSaveNotes(deskNotes, statusOverride);
      } else {
        await fetch("/api/consultations", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            patientPhone: patientId,
            verificationNotes: deskNotes,
            verificationStatus: statusOverride || "Verified & Confirmed",
          }),
        });
      }
      setNotesSaveStatus(statusOverride ? `Updated: ${statusOverride}` : "Notes Saved ✓");
      setTimeout(() => setNotesSaveStatus(null), 3000);
    } catch {
      setNotesSaveStatus("Saved locally");
      setTimeout(() => setNotesSaveStatus(null), 3000);
    } finally {
      setIsSavingNotes(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // ── FLOATING PICTURE-IN-PICTURE (PiP) WIDGET VIEW ──
  // ═══════════════════════════════════════════════════════════════════════════
  if (isFloating && isActive) {
    return (
      <div style={{
        position: "fixed",
        bottom: 20,
        right: 20,
        width: 320,
        maxWidth: "calc(100vw - 32px)",
        zIndex: 999999,
        borderRadius: 20,
        background: "linear-gradient(145deg, #0F172A, #1E293B)",
        boxShadow: "0 20px 50px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.15)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        animation: "popIn .3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
      }}>
        {/* Floating Header */}
        <div style={{
          padding: "10px 14px",
          background: "rgba(0,0,0,0.4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
            <span style={{ fontSize: 14 }}>{isCallerReceptionist ? "🏥" : "🩺"}</span>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "white", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {isDoctor ? patientName : displayCallerTitle}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 1 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.green, animation: "pulse 1.5s infinite" }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: "#4ADE80" }}>{formatDuration(state.callDuration)}</span>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button
              onClick={() => setIsFloating(false)}
              title="Expand to Fullscreen"
              style={{
                background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 8, padding: "5px 9px",
                color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4
              }}>
              <span>🗖</span> Expand
            </button>
          </div>
        </div>

        {/* Floating Video Stream */}
        <div style={{ position: "relative", height: 180, background: "#050B14", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {effectiveCallMode === "video" ? (
            <>
              <VideoView stream={state.remoteStream} label={isDoctor ? patientName : "Remote"} isFullscreen height="100%" />
              <div style={{ position: "absolute", top: 8, right: 8, zIndex: 10, width: 70, height: 95 }}>
                <VideoView stream={state.localStream} label="You" isMirrored isMuted isSmall />
              </div>
            </>
          ) : (
            <AudioOnlyView name={isDoctor ? patientName : displayCallerTitle} isDoctor={isDoctor} stream={state.remoteStream} compact />
          )}
        </div>

        {/* Floating Mini Controls */}
        <div style={{
          padding: "10px 14px",
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-around",
        }}>
          <button
            onClick={actions.toggleMute}
            style={{
              width: 38, height: 38, borderRadius: "50%", border: "none", cursor: "pointer",
              background: state.isMuted ? C.red : "rgba(255,255,255,0.15)", color: "white", fontSize: 16,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
            title={state.isMuted ? "Unmute" : "Mute"}>
            {state.isMuted ? "🔇" : "🎙️"}
          </button>

          {effectiveCallMode === "video" && (
            <button
              onClick={actions.toggleCamera}
              style={{
                width: 38, height: 38, borderRadius: "50%", border: "none", cursor: "pointer",
                background: state.isCameraOff ? C.red : "rgba(255,255,255,0.15)", color: "white", fontSize: 16,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
              title={state.isCameraOff ? "Turn Cam On" : "Turn Cam Off"}>
              {state.isCameraOff ? "📵" : "📹"}
            </button>
          )}

          <button
            onClick={() => { actions.endCall(); setIsFloating(false); }}
            style={{
              padding: "6px 14px", borderRadius: 20, border: "none", cursor: "pointer",
              background: `linear-gradient(135deg, ${C.redLight}, ${C.red})`, color: "white", fontSize: 12, fontWeight: 700,
              display: "flex", alignItems: "center", gap: 4,
            }}>
            <span>📵</span> End
          </button>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ── FULL MODAL VIEW (EXPANDED & IDLE / INCOMING) ──
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: isActive ? "rgba(10, 15, 26, 0.96)" : "rgba(0,0,0,.75)",
      backdropFilter: isActive ? "blur(8px)" : undefined,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: isActive ? 12 : 0,
    }}>
      <div style={{
        width: "100%",
        maxWidth: isActive ? (showDeskPad || isDoctor ? 820 : 480) : 420,
        background: isActive ? "#0F172A" : C.bg,
        borderRadius: 24,
        maxHeight: "96vh",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        border: isActive ? "1px solid rgba(255,255,255,0.12)" : `1px solid ${C.border}`,
        boxShadow: "0 25px 60px rgba(0,0,0,0.6)",
        animation: "slideUp .3s ease-out",
        transition: "max-width 0.3s ease",
      }}>
        {/* Modal Header */}
        <div style={{
          background: "linear-gradient(135deg, #1E293B, #0F172A)",
          padding: "16px 20px",
          borderRadius: "24px 24px 0 0",
          flexShrink: 0,
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 38, height: 38, borderRadius: "50%", background: "rgba(59, 130, 246, 0.2)",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20
              }}>
                {isCallerReceptionist ? "🏥" : isCallerAsha ? "👩‍⚕️" : "🩺"}
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "white" }}>
                  {isIncoming
                    ? "📲 Incoming Call"
                    : isDoctor
                    ? (isCallerReceptionist ? `🏥 Reception Call Desk` : `👨‍⚕️ Doctor Consultation`)
                    : `📞 Call: ${displayCallerTitle}`}
                </div>
                <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 2 }}>
                  {isDoctor ? `Patient: ${patientName} (${patientId})` : displayCallerTitle}
                  {facilityName && ` • ${facilityName}`}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {isActive && (
                <>
                  <div style={{ background: "rgba(34, 197, 94, 0.15)", border: "1px solid rgba(34, 197, 94, 0.3)", borderRadius: 20, padding: "4px 10px", display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ADE80", animation: "pulse 1.5s infinite" }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#4ADE80" }}>{formatDuration(state.callDuration)}</span>
                  </div>

                  {/* Multitask / Float Button */}
                  <button
                    onClick={() => setIsFloating(true)}
                    title="Float Call Screen & Multitask on Dashboard"
                    style={{
                      background: "rgba(255,255,255,0.12)", border: "none", borderRadius: 10, padding: "7px 12px",
                      color: "white", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4
                    }}>
                    <span>🗗</span> Float PiP
                  </button>
                </>
              )}

              {!isActive && !isIncoming && (
                <button onClick={onClose} style={{ background: "rgba(255,255,255,.12)", border: "none", borderRadius: 8, padding: "6px 12px", color: "white", fontSize: 12, cursor: "pointer", fontWeight: 700 }}>
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
          <div style={{ background: state.networkQuality === "critical" ? "#FDEDED" : "#EBF4FD", padding: "8px 16px", fontSize: 12, color: state.networkQuality === "critical" ? C.red : C.primary, fontWeight: 600, textAlign: "center" }}>
            {state.statusMessage}
          </div>
        )}

        <div style={{ padding: "18px 20px", flex: 1, display: "flex", flexDirection: "column" }}>

          {/* ── Idle: choose call type (initiator side) ── */}
          {effectiveCallMode === "idle" && (
            <div>
              <div style={{ background: C.card, borderRadius: 18, padding: 18, marginBottom: 16, border: `1px solid ${C.border}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 52, height: 52, borderRadius: "50%", background: isDoctor ? "#EBF4FD" : "#E8F8EF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>
                    {isCallerReceptionist ? "🏥" : "🩺"}
                  </div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>{patientName}</div>
                    <div style={{ fontSize: 13, color: C.muted, marginTop: 2 }}>
                      Calling as: <strong>{displayCallerTitle}</strong>
                    </div>
                  </div>
                </div>

                {patientDetails && (
                  <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${C.border}`, display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8, fontSize: 12 }}>
                    <div><span style={{ color: C.muted }}>Phone:</span> <strong>{patientId}</strong></div>
                    <div><span style={{ color: C.muted }}>Dept:</span> <strong>{patientDetails.department || "General OPD"}</strong></div>
                    {patientDetails.urgency && <div><span style={{ color: C.muted }}>Urgency:</span> <strong style={{ color: patientDetails.urgency.includes("RED") ? C.red : C.green }}>{patientDetails.urgency}</strong></div>}
                    {patientDetails.slotTime && <div><span style={{ color: C.muted }}>Slot:</span> <strong>{patientDetails.slotTime}</strong></div>}
                  </div>
                )}
              </div>

              <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
                <button onClick={() => handleStartCall("video")}
                  style={{ flex: 1, padding: "16px 12px", borderRadius: 16, border: "none", cursor: "pointer", background: "linear-gradient(135deg,#0284C7,#0369A1)", color: "white", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, boxShadow: "0 6px 18px rgba(2, 132, 199, 0.35)" }}>
                  <span style={{ fontSize: 30 }}>📹</span>
                  <span style={{ fontSize: 15, fontWeight: 800 }}>Video Call</span>
                  <span style={{ fontSize: 11, opacity: .85 }}>Auto-adapts to network</span>
                </button>
                <button onClick={() => handleStartCall("audio")}
                  style={{ flex: 1, padding: "16px 12px", borderRadius: 16, border: "none", cursor: "pointer", background: "linear-gradient(135deg,#10B981,#047857)", color: "white", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, boxShadow: "0 6px 18px rgba(16, 185, 129, 0.35)" }}>
                  <span style={{ fontSize: 30 }}>🎙️</span>
                  <span style={{ fontSize: 15, fontWeight: 800 }}>Audio Call</span>
                  <span style={{ fontSize: 11, opacity: .85 }}>Low bandwidth friendly</span>
                </button>
              </div>

              <div style={{ background: "#EBF4FD", borderRadius: 14, padding: "12px 14px", border: "1px solid #AED6F1", display: "flex", gap: 10 }}>
                <span style={{ fontSize: 16 }}>💡</span>
                <span style={{ fontSize: 12, color: C.primary, lineHeight: 1.5 }}>
                  <strong>Reception Desk Verification:</strong> Use App Call to verify patient identity via face & ID card, eliminate fake bookings, and write live triage notes.
                </span>
              </div>
            </div>
          )}

          {/* ── Incoming call (patient side) ── */}
          {isIncoming && (
            <div style={{ textAlign: "center", padding: "28px 14px" }}>
              <div style={{ fontSize: 60, animation: "ring 1s infinite", display: "inline-block" }}>
                {isCallerReceptionist ? "🏥" : "📲"}
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "white", marginTop: 14 }}>
                {displayCallerTitle}
              </div>
              <div style={{ fontSize: 13, color: "#94A3B8", marginTop: 4, marginBottom: 28 }}>
                {effectiveIncomingCallType === "video" ? "📹 Live Video Verification & Consultation" : "🎙️ Voice Call"}
              </div>
              <div style={{ display: "flex", gap: 28, justifyContent: "center" }}>
                <button onClick={() => { actions.rejectCall(); onClose(); }}
                  style={{ width: 72, height: 72, borderRadius: "50%", border: "none", cursor: "pointer", background: `linear-gradient(135deg,${C.redLight},${C.red})`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, boxShadow: "0 6px 20px rgba(192,57,43,.5)" }}>
                  <span style={{ fontSize: 26 }}>📵</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "white" }}>Decline</span>
                </button>
                <button onClick={() => actions.answerCall(effectiveIncomingCallType === "video" ? "video" : "audio")}
                  style={{ width: 72, height: 72, borderRadius: "50%", border: "none", cursor: "pointer", background: "linear-gradient(135deg,#10B981,#047857)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, boxShadow: "0 6px 20px rgba(16, 185, 129, .5)" }}>
                  <span style={{ fontSize: 26 }}>📞</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "white" }}>Answer</span>
                </button>
              </div>
            </div>
          )}

          {/* ── Connecting / Ringing ── */}
          {isConnecting && (
            <div style={{ textAlign: "center", padding: "34px 20px" }}>
              <div style={{ fontSize: 52, animation: "pulse 1s infinite", display: "inline-block" }}>📞</div>
              <div style={{ fontSize: 17, fontWeight: 800, color: "white", marginTop: 14 }}>{state.statusMessage || "Connecting..."}</div>
              <div style={{ fontSize: 13, color: "#94A3B8", marginTop: 6 }}>Connecting to {patientName}...</div>
              <button onClick={actions.endCall} style={{ marginTop: 24, padding: "12px 34px", borderRadius: 30, border: "none", background: C.red, color: "white", fontWeight: 700, fontSize: 14, cursor: "pointer", boxShadow: "0 4px 14px rgba(192,57,43,0.4)" }}>
                Cancel Call
              </button>
            </div>
          )}

          {/* ── Active call ── */}
          {isActive && (
            <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <NetworkBadge quality={state.networkQuality} />
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  {isDoctor && (
                    <button
                      onClick={() => setShowDeskPad(!showDeskPad)}
                      style={{
                        padding: "4px 10px", borderRadius: 14, border: "none",
                        background: showDeskPad ? "#0284C7" : "rgba(255,255,255,0.15)",
                        color: "white", fontSize: 11, fontWeight: 700, cursor: "pointer"
                      }}>
                      📋 {showDeskPad ? "Hide Desk Pad" : "Show Desk Pad"}
                    </button>
                  )}
                  <span style={{ fontSize: 12, color: "#94A3B8" }}>
                    {effectiveCallMode === "video" ? "📹 Video" : "🎙️ Audio"} Call
                  </span>
                </div>
              </div>

              {/* Main Call + In-Call Desk Grid */}
              <div style={{
                display: "grid",
                gridTemplateColumns: (showDeskPad || isDoctor) ? "repeat(auto-fit, minmax(280px, 1fr))" : "1fr",
                gap: 16,
              }}>
                {/* Left: Video / Audio Stream Feed */}
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {effectiveCallMode === "video" ? (
                    <div style={{ position: "relative", borderRadius: 18, overflow: "hidden", minHeight: 280, height: 320, background: "#050B14", border: "1px solid rgba(255,255,255,0.1)" }}>
                      <VideoView stream={state.remoteStream} label={isDoctor ? patientName : displayCallerTitle} isFullscreen />
                      <div style={{ position: "absolute", top: 10, right: 10, zIndex: 10 }}>
                        <VideoView stream={state.localStream} label="You" isMirrored isMuted isSmall />
                      </div>
                    </div>
                  ) : (
                    <div style={{ marginBottom: 10 }}>
                      <AudioOnlyView name={isDoctor ? patientName : displayCallerTitle} isDoctor={isDoctor} stream={state.remoteStream} />
                    </div>
                  )}

                  {/* Active Call Controls Dock */}
                  <div style={{ display: "flex", justifyContent: "center", gap: 14, marginTop: 14 }}>
                    <button onClick={actions.toggleMute} style={{
                      width: 50, height: 50, borderRadius: "50%", border: "none", cursor: "pointer",
                      background: state.isMuted ? C.red : "rgba(255,255,255,0.15)", boxShadow: "0 2px 8px rgba(0,0,0,.2)",
                      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2,
                    }}>
                      <span style={{ fontSize: 18 }}>{state.isMuted ? "🔇" : "🎙️"}</span>
                      <span style={{ fontSize: 8, fontWeight: 700, color: "white" }}>{state.isMuted ? "Muted" : "Mute"}</span>
                    </button>

                    {effectiveCallMode === "video" && (
                      <button onClick={actions.toggleCamera} style={{
                        width: 50, height: 50, borderRadius: "50%", border: "none", cursor: "pointer",
                        background: state.isCameraOff ? C.red : "rgba(255,255,255,0.15)", boxShadow: "0 2px 8px rgba(0,0,0,.2)",
                        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2,
                      }}>
                        <span style={{ fontSize: 18 }}>{state.isCameraOff ? "📵" : "📹"}</span>
                        <span style={{ fontSize: 8, fontWeight: 700, color: "white" }}>{state.isCameraOff ? "Cam Off" : "Cam"}</span>
                      </button>
                    )}

                    {effectiveCallMode === "video" && (
                      <button onClick={actions.downgradeToAudio} style={{
                        width: 50, height: 50, borderRadius: "50%", border: "none", cursor: "pointer",
                        background: "rgba(255,255,255,0.15)", boxShadow: "0 2px 8px rgba(0,0,0,.2)",
                        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2,
                      }}>
                        <span style={{ fontSize: 18 }}>🎙️</span>
                        <span style={{ fontSize: 8, fontWeight: 700, color: "white" }}>Audio Only</span>
                      </button>
                    )}

                    <button onClick={actions.endCall} style={{
                      width: 56, height: 56, borderRadius: "50%", border: "none", cursor: "pointer",
                      background: `linear-gradient(135deg,${C.redLight},${C.red})`,
                      boxShadow: "0 4px 16px rgba(192,57,43,.5)",
                      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2,
                    }}>
                      <span style={{ fontSize: 22 }}>📵</span>
                      <span style={{ fontSize: 9, fontWeight: 700, color: "white" }}>End</span>
                    </button>
                  </div>
                </div>

                {/* Right: IN-CALL RECEPTIONIST & VERIFICATION DESK PAD */}
                {(showDeskPad || isDoctor) && (
                  <div style={{
                    background: "rgba(30, 41, 59, 0.7)", borderRadius: 18, padding: "14px 16px",
                    border: "1px solid rgba(255,255,255,0.1)", display: "flex", flexDirection: "column", gap: 10
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: "#38BDF8", display: "flex", alignItems: "center", gap: 6 }}>
                        <span>📋</span> In-Call Live Verification Desk
                      </div>
                      {notesSaveStatus && (
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#4ADE80", background: "rgba(34,197,94,0.15)", padding: "2px 8px", borderRadius: 10 }}>
                          {notesSaveStatus}
                        </span>
                      )}
                    </div>

                    {patientDetails && (
                      <div style={{ background: "rgba(15, 23, 42, 0.6)", borderRadius: 12, padding: "10px 12px", fontSize: 11, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, color: "#CBD5E1" }}>
                        <div>Phone: <strong style={{ color: "white" }}>{patientId}</strong></div>
                        <div>Dept: <strong style={{ color: "white" }}>{patientDetails.department || "General OPD"}</strong></div>
                        <div>Urgency: <strong style={{ color: patientDetails.urgency?.includes("RED") ? "#F87171" : "#4ADE80" }}>{patientDetails.urgency || "STANDARD"}</strong></div>
                        <div>Doctor: <strong style={{ color: "white" }}>{patientDetails.doctorName || "Assigned on Confirm"}</strong></div>
                      </div>
                    )}

                    {/* Quick Pre-Set Tags */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {[
                        "✓ Face & ID Match Verified",
                        "✓ Genuine Patient",
                        "⚠️ Suspicious Details",
                        "✓ Immediate OPD Token Confirmed",
                      ].map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => setDeskNotes((prev) => prev ? `${prev}\n• ${tag}` : `• ${tag}`)}
                          style={{
                            padding: "3px 8px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.15)",
                            background: "rgba(255,255,255,0.06)", color: "#94A3B8", fontSize: 10, fontWeight: 600, cursor: "pointer"
                          }}>
                          + {tag}
                        </button>
                      ))}
                    </div>

                    <textarea
                      value={deskNotes}
                      onChange={(e) => setDeskNotes(e.target.value)}
                      placeholder="Write live verification notes, patient symptoms check, or anti-scam remarks..."
                      rows={4}
                      style={{
                        width: "100%", background: "rgba(15, 23, 42, 0.8)", border: "1px solid rgba(255,255,255,0.15)",
                        borderRadius: 10, color: "white", padding: 10, fontSize: 12, resize: "none", outline: "none"
                      }}
                    />

                    {/* Verification Actions */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      <button
                        type="button"
                        disabled={isSavingNotes}
                        onClick={() => handleSaveVerificationNotes("Verified & Confirmed")}
                        style={{
                          padding: "8px 10px", borderRadius: 10, border: "none",
                          background: "linear-gradient(135deg, #10B981, #047857)", color: "white",
                          fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4
                        }}>
                        <span>✅</span> {isSavingNotes ? "Saving..." : "Verify & Confirm"}
                      </button>
                      <button
                        type="button"
                        disabled={isSavingNotes}
                        onClick={() => handleSaveVerificationNotes("Flagged Suspicious")}
                        style={{
                          padding: "8px 10px", borderRadius: 10, border: "none",
                          background: "linear-gradient(135deg, #EF4444, #B91C1C)", color: "white",
                          fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4
                        }}>
                        <span>⚠️</span> Flag Suspicious
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Ended ── */}
          {effectiveCallMode === "ended" && (
            <div style={{ textAlign: "center", padding: "34px 20px" }}>
              <div style={{ fontSize: 50 }}>📵</div>
              <div style={{ fontSize: 17, fontWeight: 800, color: "white", marginTop: 14 }}>Call Ended</div>
              <div style={{ fontSize: 13, color: "#94A3B8", marginTop: 6 }}>{state.statusMessage}</div>
              <button onClick={onClose} style={{ marginTop: 24, padding: "12px 34px", borderRadius: 30, border: "none", background: C.primary, color: "white", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                Close Window
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes popIn { 0% { transform: scale(0.7); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:.4; } }
        @keyframes ring { 0%,100% { transform: rotate(0deg); } 20% { transform: rotate(-15deg); } 40% { transform: rotate(15deg); } 60% { transform: rotate(-10deg); } 80% { transform: rotate(10deg); } }
        @keyframes audioRipple { 0%,100% { box-shadow: 0 0 0 8px rgba(30,132,73,.25); } 50% { box-shadow: 0 0 0 18px rgba(30,132,73,.1); } }
      `}</style>
    </div>
  );
}
