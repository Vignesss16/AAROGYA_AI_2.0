"use client";
import { useEffect, useRef } from "react";
import { useWebRTC, formatDuration, WebRTCState, WebRTCActions, NetworkQuality } from "@/hooks/useWebRTC";

const C = {
  primary: "#1B6CA8", green: "#1E8449", red: "#C0392B",
  redLight: "#E74C3C", yellow: "#F39C12", card: "#FFFFFF",
  text: "#1A2332", muted: "#6B7C93", border: "#DDE3EC", bg: "#F0F4F8",
};

interface VideoCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientName: string;
  patientId: string;
  isDoctor: boolean;
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

function VideoView({ stream, label, isMirrored, isMuted, isSmall, isFullscreen }: {
  stream: MediaStream | null; label: string;
  isMirrored?: boolean; isMuted?: boolean; isSmall?: boolean; isFullscreen?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (videoRef.current && stream) videoRef.current.srcObject = stream;
  }, [stream]);

  return (
    <div style={{
      position: "relative", borderRadius: isSmall ? 12 : (isFullscreen ? 16 : 16), overflow: "hidden",
      background: "#1A2332", width: isSmall ? 100 : "100%", height: isSmall ? 140 : (isFullscreen ? "100%" : 220),
      border: isSmall ? "2px solid rgba(255,255,255,.3)" : "none",
    }}>
      {stream ? (
        <video ref={videoRef} autoPlay playsInline muted={isMuted}
          style={{ width: "100%", height: "100%", objectFit: "cover", transform: isMirrored ? "scaleX(-1)" : undefined }} />
      ) : (
        <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(255,255,255,.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>👤</div>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,.5)" }}>No video</span>
        </div>
      )}
      <div style={{ position: "absolute", bottom: 6, left: 8, background: "rgba(0,0,0,.5)", borderRadius: 6, padding: "2px 7px", fontSize: 11, color: "white" }}>
        {label}
      </div>
    </div>
  );
}

function AudioOnlyView({ name, isDoctor }: { name: string; isDoctor: boolean }) {
  return (
    <div style={{
      height: 220, borderRadius: 16, background: "linear-gradient(135deg,#1A2332,#0F3460)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12,
    }}>
      <div style={{
        width: 72, height: 72, borderRadius: "50%",
        background: isDoctor ? "#1B6CA8" : "#1E8449",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 28, color: "white", fontWeight: 800,
        boxShadow: `0 0 0 8px rgba(${isDoctor ? "27,108,168" : "30,132,73"},.25)`,
        animation: "audioRipple 2s ease-in-out infinite",
      }}>
        {name[0]?.toUpperCase()}
      </div>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: "white" }}>{name}</div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,.5)", marginTop: 3 }}>🎙️ Audio Call Active</div>
      </div>
    </div>
  );
}

export default function VideoCallModal({ isOpen, onClose, patientName, patientId, isDoctor, initialIncomingCallType }: VideoCallModalProps) {
  const roomId = `consultation-${patientId}`;
  const [state, actions] = useWebRTC(roomId, isDoctor);

  if (!isOpen) return null;

  // Bug #2 fix: When the patient's home page SSE receives call-invite and opens
  // this modal, the hook's own SSE is brand-new and never saw the call-invite.
  // So callMode stays "idle". We override it using the prop passed from home/page.tsx
  // so the incoming call UI renders correctly right away.
  const effectiveCallMode =
    !isDoctor && initialIncomingCallType && state.callMode === "idle"
      ? "incoming"
      : state.callMode;
  const effectiveIncomingCallType = state.incomingCallType ?? initialIncomingCallType ?? null;

  const isActive = effectiveCallMode === "video" || effectiveCallMode === "audio";
  const isConnecting = effectiveCallMode === "connecting";
  const isIncoming = effectiveCallMode === "incoming";

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: isActive ? "#0d1520" : "rgba(0,0,0,.75)", display: "flex", alignItems: isActive ? "stretch" : "flex-end", justifyContent: "center",
    }}>
      <div style={{
        width: "100%", maxWidth: 390, background: isActive ? "#0d1520" : C.bg, borderRadius: isActive ? 0 : "24px 24px 0 0",
        height: isActive ? "100vh" : undefined,
        maxHeight: isActive ? "100vh" : "92vh", overflowY: "auto", paddingBottom: isActive ? 0 : 20,
        display: "flex", flexDirection: "column",
        animation: "slideUp .3s ease-out",
      }}>
        {/* Header */}
        <div style={{ background: "#1A2332", padding: "16px 16px 12px", borderRadius: isActive ? 0 : "24px 24px 0 0", flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "white" }}>
                {isIncoming ? "📲 Incoming Call" : isDoctor ? "📞 Call Patient" : "📞 Call Doctor"}
              </div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,.5)", marginTop: 2 }}>{patientName}</div>
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              {isActive && (
                <div style={{ background: "#E8F8EF", borderRadius: 20, padding: "4px 10px", display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.green, animation: "pulse 1.5s infinite" }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: C.green }}>{formatDuration(state.callDuration)}</span>
                </div>
              )}
              {!isActive && !isIncoming && (
                <button onClick={onClose} style={{ background: "rgba(255,255,255,.1)", border: "none", borderRadius: 8, padding: "6px 12px", color: "white", fontSize: 12, cursor: "pointer" }}>✕ Close</button>
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
                Poor network detected. Video was disabled to maintain the call.
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

        <div style={{ padding: "16px 16px 16px", flex: 1, display: "flex", flexDirection: "column" }}>

          {/* ── Idle: choose call type (doctor side) ── */}
          {effectiveCallMode === "idle" && (
            <div>
              <div style={{ background: C.card, borderRadius: 16, padding: 16, marginBottom: 14, border: `1px solid ${C.border}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 48, height: 48, borderRadius: "50%", background: isDoctor ? "#EBF4FD" : "#E8F8EF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                    {isDoctor ? "🩺" : "👤"}
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: C.text }}>{patientName}</div>
                    <div style={{ fontSize: 12, color: C.muted }}>Choose how you&apos;d like to connect</div>
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                <button onClick={() => actions.startCall("video")}
                  style={{ flex: 1, padding: "16px 10px", borderRadius: 16, border: "none", cursor: "pointer", background: `linear-gradient(135deg,${C.primary},#0F4C7A)`, color: "white", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 28 }}>📹</span>
                  <span style={{ fontSize: 14, fontWeight: 800 }}>Video Call</span>
                  <span style={{ fontSize: 11, opacity: .75 }}>Auto-switches to audio on weak network</span>
                </button>
                <button onClick={() => actions.startCall("audio")}
                  style={{ flex: 1, padding: "16px 10px", borderRadius: 16, border: "none", cursor: "pointer", background: `linear-gradient(135deg,${C.green},#155930)`, color: "white", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 28 }}>🎙️</span>
                  <span style={{ fontSize: 14, fontWeight: 800 }}>Audio Call</span>
                  <span style={{ fontSize: 11, opacity: .75 }}>Best for poor network areas</span>
                </button>
              </div>
              <div style={{ background: "#EBF4FD", borderRadius: 12, padding: "10px 14px", border: "1px solid #AED6F1", display: "flex", gap: 8 }}>
                <span style={{ fontSize: 14 }}>ℹ️</span>
                <span style={{ fontSize: 12, color: C.primary, lineHeight: 1.5 }}>
                  <strong>Smart Network Adaptation:</strong> If your network weakens during a video call, it will automatically switch to audio.
                </span>
              </div>
            </div>
          )}

          {/* ── Incoming call (patient side) ── */}
          {isIncoming && (
            <div style={{ textAlign: "center", padding: "24px 10px" }}>
              <div style={{ fontSize: 56, animation: "ring 1s infinite", display: "inline-block" }}>📲</div>
              <div style={{ fontSize: 17, fontWeight: 800, color: C.text, marginTop: 12 }}>
                {isDoctor ? patientName : `Doctor is calling`}
              </div>
              <div style={{ fontSize: 13, color: C.muted, marginTop: 6, marginBottom: 24 }}>
                {effectiveIncomingCallType === "video" ? "📹 Video Call" : "🎙️ Audio Call"}
              </div>
              <div style={{ display: "flex", gap: 14, justifyContent: "center" }}>
                <button onClick={() => actions.rejectCall()}
                  style={{ width: 64, height: 64, borderRadius: "50%", border: "none", cursor: "pointer", background: `linear-gradient(135deg,${C.redLight},${C.red})`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, boxShadow: "0 4px 16px rgba(192,57,43,.4)" }}>
                  <span style={{ fontSize: 22 }}>📵</span>
                  <span style={{ fontSize: 9, fontWeight: 700, color: "white" }}>Decline</span>
                </button>
                {effectiveIncomingCallType === "video" && (
                  <button onClick={() => actions.answerCall("video")}
                    style={{ width: 64, height: 64, borderRadius: "50%", border: "none", cursor: "pointer", background: `linear-gradient(135deg,${C.primary},#0F4C7A)`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, boxShadow: "0 4px 16px rgba(27,108,168,.4)" }}>
                    <span style={{ fontSize: 22 }}>📹</span>
                    <span style={{ fontSize: 9, fontWeight: 700, color: "white" }}>Video</span>
                  </button>
                )}
                <button onClick={() => actions.answerCall("audio")}
                  style={{ width: 64, height: 64, borderRadius: "50%", border: "none", cursor: "pointer", background: `linear-gradient(135deg,${C.green},#155930)`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, boxShadow: "0 4px 16px rgba(30,132,73,.4)" }}>
                  <span style={{ fontSize: 22 }}>🎙️</span>
                  <span style={{ fontSize: 9, fontWeight: 700, color: "white" }}>Audio</span>
                </button>
              </div>
            </div>
          )}

          {/* ── Connecting / Ringing ── */}
          {isConnecting && (
            <div style={{ textAlign: "center", padding: "30px 20px" }}>
              <div style={{ fontSize: 48, animation: "pulse 1s infinite", display: "inline-block" }}>📞</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginTop: 14 }}>Connecting...</div>
              <div style={{ fontSize: 13, color: C.muted, marginTop: 6 }}>Waiting for {patientName}</div>
              <button onClick={actions.endCall} style={{ marginTop: 20, padding: "12px 30px", borderRadius: 30, border: "none", background: C.red, color: "white", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                Cancel
              </button>
            </div>
          )}

          {/* ── Active call ── */}
          {isActive && (
            <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <NetworkBadge quality={state.networkQuality} />
                <span style={{ fontSize: 12, color: C.muted }}>
                  {effectiveCallMode === "video" ? "📹 Video" : "🎙️ Audio"} Call
                </span>
              </div>

              {effectiveCallMode === "video" ? (
                <div style={{ position: "relative", marginBottom: 14, flex: 1, display: "flex", borderRadius: 16, overflow: "hidden", minHeight: 300 }}>
                  <VideoView stream={state.remoteStream} label={patientName} isFullscreen />
                  <div style={{ position: "absolute", top: 10, right: 10, zIndex: 10 }}>
                    <VideoView stream={state.localStream} label="You" isMirrored isMuted isSmall />
                  </div>
                </div>
              ) : (
                <div style={{ marginBottom: 14 }}>
                  <AudioOnlyView name={patientName} isDoctor={isDoctor} />
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "center", gap: 16, marginBottom: 14 }}>
                <button onClick={actions.toggleMute} style={{
                  width: 54, height: 54, borderRadius: "50%", border: "none", cursor: "pointer",
                  background: state.isMuted ? C.red : C.card, boxShadow: "0 2px 8px rgba(0,0,0,.12)",
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2,
                }}>
                  <span style={{ fontSize: 20 }}>{state.isMuted ? "🔇" : "🎙️"}</span>
                  <span style={{ fontSize: 9, fontWeight: 700, color: state.isMuted ? "white" : C.muted }}>{state.isMuted ? "Muted" : "Mute"}</span>
                </button>

                {effectiveCallMode === "video" && (
                  <button onClick={actions.toggleCamera} style={{
                    width: 54, height: 54, borderRadius: "50%", border: "none", cursor: "pointer",
                    background: state.isCameraOff ? C.red : C.card, boxShadow: "0 2px 8px rgba(0,0,0,.12)",
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2,
                  }}>
                    <span style={{ fontSize: 20 }}>{state.isCameraOff ? "📵" : "📹"}</span>
                    <span style={{ fontSize: 9, fontWeight: 700, color: state.isCameraOff ? "white" : C.muted }}>{state.isCameraOff ? "Cam Off" : "Camera"}</span>
                  </button>
                )}

                <button onClick={actions.endCall} style={{
                  width: 64, height: 64, borderRadius: "50%", border: "none", cursor: "pointer",
                  background: `linear-gradient(135deg,${C.redLight},${C.red})`,
                  boxShadow: "0 4px 16px rgba(192,57,43,.4)",
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2,
                }}>
                  <span style={{ fontSize: 22 }}>📵</span>
                  <span style={{ fontSize: 9, fontWeight: 700, color: "white" }}>End</span>
                </button>
              </div>

              {state.networkQuality !== "good" && (
                <div style={{ background: state.networkQuality === "critical" ? "#FDEDED" : "#FEF9E7", borderRadius: 12, padding: "10px 14px", display: "flex", gap: 8 }}>
                  <span>{state.networkQuality === "critical" ? "🔴" : "🟡"}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: state.networkQuality === "critical" ? C.red : "#7D6608" }}>
                      {state.networkQuality === "critical" ? "Very Poor Network" : "Weak Network Detected"}
                    </div>
                    <div style={{ fontSize: 12, color: state.networkQuality === "critical" ? C.red : "#7D6608", marginTop: 2 }}>
                      {state.networkQuality === "critical"
                        ? "Switching to audio call to keep you connected..."
                        : "Video quality may be reduced. Will auto-switch to audio if needed."}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Ended ── */}
          {effectiveCallMode === "ended" && (
            <div style={{ textAlign: "center", padding: "30px 20px" }}>
              <div style={{ fontSize: 48 }}>📵</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginTop: 14 }}>Call Ended</div>
              <div style={{ fontSize: 13, color: C.muted, marginTop: 6 }}>{state.statusMessage}</div>
              <button onClick={onClose} style={{ marginTop: 20, padding: "12px 30px", borderRadius: 30, border: "none", background: C.primary, color: "white", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                Close
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:.4; } }
        @keyframes ring { 0%,100% { transform: rotate(0deg); } 20% { transform: rotate(-15deg); } 40% { transform: rotate(15deg); } 60% { transform: rotate(-10deg); } 80% { transform: rotate(10deg); } }
        @keyframes audioRipple { 0%,100% { box-shadow: 0 0 0 8px rgba(30,132,73,.25); } 50% { box-shadow: 0 0 0 18px rgba(30,132,73,.1); } }
      `}</style>
    </div>
  );
}
