"use client";
import React, { useState, useEffect, useRef, memo } from "react";
import { useRouter } from "next/navigation";
import { useWebRTC, formatDuration, NetworkQuality } from "@/hooks/useWebRTC";
import {
  Phone,
  PhoneOff,
  PhoneCall,
  PhoneIncoming,
  Mic,
  MicOff,
  Video,
  VideoOff,
  User,
  Check,
  X,
  AlertTriangle,
  ShieldCheck,
  Stethoscope,
  Building2,
  Clock,
  FileText,
  Pill,
  Activity,
  CheckCircle2,
  Maximize2,
  Minimize2,
  Wifi,
  Sparkles,
  ClipboardList,
  FlaskConical,
  ShieldAlert
} from "lucide-react";

const C = {
  primary: "#0F766E",
  primaryDark: "#0D5E58",
  primaryLight: "#14B8A6",
  accent: "#0284C7",
  green: "#10B981",
  red: "#EF4444",
  redLight: "#F87171",
  yellow: "#F59E0B",
  card: "#FFFFFF",
  text: "#0F172A",
  muted: "#64748B",
  border: "#E2E8F0",
  bg: "#F8FAFC",
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
  tokenNumber?: string;
  queueNo?: string;
}

export interface VideoCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientName: string;
  patientId: string;
  isDoctor: boolean;
  callerRole?: "doctor" | "receptionist" | "asha" | "hospital" | "patient";
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
  if (/^(Dr\.?\s*)+/i.test(title)) {
    const withoutDr = title.replace(/^(Dr\.?\s*)+/i, "").trim();
    return withoutDr ? `Dr. ${withoutDr}` : "Dr. Consultation";
  }
  return title;
}

function NetworkBadge({ quality }: { quality: NetworkQuality }) {
  const configs = {
    good:     { color: "#10B981", bg: "rgba(16, 185, 129, 0.15)", label: "Good Network" },
    poor:     { color: "#F59E0B", bg: "rgba(245, 158, 11, 0.15)",  label: "Poor Network" },
    critical: { color: "#EF4444", bg: "rgba(239, 68, 68, 0.15)",  label: "Critical Network" },
  };
  const cfg = configs[quality];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, background: cfg.bg, borderRadius: 20, padding: "3px 10px", border: `1px solid ${cfg.color}33` }}>
      <Wifi size={13} color={cfg.color} />
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

const PersistentStreamVideo = React.memo(function PersistentStreamVideo({
  stream,
  isMirrored,
  isMuted,
  style,
}: {
  stream: MediaStream | null;
  isMirrored?: boolean;
  isMuted?: boolean;
  style?: React.CSSProperties;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      if (videoRef.current.srcObject !== stream) {
        videoRef.current.srcObject = stream;
      }
    }
  }, [stream]);

  if (!stream) {
    return (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, background: "#050B14" }}>
        <User size={isMirrored ? 14 : 24} color="#94A3B8" />
        {!isMirrored && <span style={{ fontSize: 10, color: "rgba(255,255,255,0.6)" }}>Connecting video...</span>}
      </div>
    );
  }

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted={isMuted}
      style={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
        background: "#050B14",
        transform: isMirrored ? "scaleX(-1)" : undefined,
        ...style,
      }}
    />
  );
});

function VideoView({
  stream,
  label,
  subLabel,
  isMirrored,
  isMuted,
  isSmall,
  fitMode = "cover",
  onToggleFit,
}: {
  stream: MediaStream | null;
  label: string;
  subLabel?: string;
  isMirrored?: boolean;
  isMuted?: boolean;
  isSmall?: boolean;
  fitMode?: "contain" | "cover";
  onToggleFit?: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (videoRef.current && stream) {
      if (videoRef.current.srcObject !== stream) {
        videoRef.current.srcObject = stream;
      }
    }
  }, [stream]);

  return (
    <div style={{
      position: "relative",
      borderRadius: isSmall ? 12 : 16,
      overflow: "hidden",
      background: "#050B14",
      width: isSmall ? 96 : "100%",
      height: isSmall ? 132 : "100%",
      border: isSmall ? "2px solid rgba(255,255,255,0.7)" : "none",
      boxShadow: isSmall ? "0 6px 18px rgba(0,0,0,0.7)" : "none",
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
          <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#94A3B8" }}>
            <User size={22} />
          </div>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>Connecting video stream...</span>
        </div>
      )}

      {/* Name & Role Label Badge Inside Video */}
      <div
        className={isSmall ? "video-pip-label" : "video-main-label"}
        style={{
          position: "absolute",
          bottom: isSmall ? 6 : 12,
          left: isSmall ? 6 : 12,
          background: "rgba(15, 23, 42, 0.88)",
          backdropFilter: "blur(10px)",
          borderRadius: isSmall ? 6 : 10,
          padding: isSmall ? "3px 6px" : "6px 12px",
          border: "1px solid rgba(255,255,255,0.18)",
          boxShadow: "0 4px 14px rgba(0,0,0,0.5)",
          pointerEvents: "none",
          maxWidth: isSmall ? "88%" : "85%",
          display: "flex",
          alignItems: "center",
          gap: 6,
          zIndex: 15,
        }}
      >
        {!isSmall && (
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#10B981", boxShadow: "0 0 8px #10B981", flexShrink: 0 }} />
        )}
        <div style={{ minWidth: 0 }}>
          <div style={{
            fontSize: isSmall ? 9 : 12,
            color: "#F8FAFC",
            fontWeight: 800,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            letterSpacing: 0.2
          }}>
            {label}
          </div>
          {subLabel && !isSmall && (
            <div style={{
              fontSize: 10,
              color: "#38BDF8",
              fontWeight: 700,
              marginTop: 1,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis"
            }}>
              {subLabel}
            </div>
          )}
        </div>
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
          {fitMode === "contain" ? <Maximize2 size={12} /> : <Minimize2 size={12} />}
          <span>{fitMode === "contain" ? "Fit" : "Fill"}</span>
        </button>
      )}
    </div>
  );
}

function AudioOnlyView({
  name,
  isDoctor,
  stream,
  compact = false,
  onSwitchToVideo,
}: {
  name: string;
  isDoctor: boolean;
  stream: MediaStream | null;
  compact?: boolean;
  onSwitchToVideo?: () => void;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  useEffect(() => {
    if (audioRef.current && stream) audioRef.current.srcObject = stream;
  }, [stream]);

  return (
    <div style={{
      borderRadius: compact ? 12 : 18,
      background: "radial-gradient(ellipse at center, rgba(15, 118, 110, 0.25) 0%, rgba(4, 29, 36, 0.95) 75%, #020B10 100%)",
      height: compact ? "100%" : 320,
      width: "100%",
      border: "1px solid rgba(20, 184, 166, 0.25)",
      boxShadow: "0 8px 30px rgba(0,0,0,0.5)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: compact ? 8 : 16,
      padding: "20px",
      position: "relative",
    }}>
      {stream && <audio ref={audioRef} autoPlay playsInline />}
      <div style={{
        width: compact ? 54 : 82, height: compact ? 54 : 82, borderRadius: "50%",
        background: "linear-gradient(135deg, #0F766E, #14B8A6)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: compact ? 22 : 32, color: "white", fontWeight: 800,
        boxShadow: "0 0 0 12px rgba(20, 184, 166, 0.2)",
        animation: "audioRipple 2s ease-in-out infinite",
      }}>
        {name[0]?.toUpperCase() || "P"}
      </div>
      <div style={{ textAlign: "center", padding: "0 12px" }}>
        <div style={{ fontSize: compact ? 13 : 17, fontWeight: 800, color: "white" }}>{name}</div>
        <div style={{ fontSize: 11.5, color: "#5EEAD4", marginTop: 4, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, fontWeight: 600 }}>
          <Mic size={13} color="#5EEAD4" /> Encrypted Voice Channel Active
        </div>
      </div>

      {!compact && onSwitchToVideo && (
        <button
          type="button"
          onClick={onSwitchToVideo}
          style={{
            marginTop: 4,
            padding: "8px 18px",
            borderRadius: 20,
            border: "1px solid rgba(20, 184, 166, 0.4)",
            background: "linear-gradient(135deg, rgba(15, 118, 110, 0.4), rgba(20, 184, 166, 0.2))",
            color: "#5EEAD4",
            fontSize: 12,
            fontWeight: 800,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
            boxShadow: "0 4px 14px rgba(15, 118, 110, 0.3)",
            transition: "all 0.15s ease",
          }}
        >
          <Video size={14} /> Turn Video On
        </button>
      )}
    </div>
  );
}

export default function VideoCallModal({
  isOpen,
  onClose,
  patientName,
  patientId,
  isDoctor,
  callerRole = "patient",
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
  const [fitMode, setFitMode] = useState<"contain" | "cover">("cover");
  const [mobileTab, setMobileTab] = useState<"video" | "desk">("video");
  const [showDeskPad, setShowDeskPad] = useState(true);

  // Receptionist Desk State
  const [assignedDoctor, setAssignedDoctor] = useState(patientDetails?.doctorName || "Dr. Vasanth");
  const [assignedDept, setAssignedDept] = useState(patientDetails?.department || "General OPD");

  // Consistent Token Number Calculation
  const resolvedTokenNumber = patientDetails?.tokenNumber || (patientDetails?.queueNo ? (patientDetails.queueNo.startsWith("OPD-") ? patientDetails.queueNo : `OPD-${patientDetails.queueNo.replace(/^Q-?/i, "")}`) : null) || (patientId ? `OPD-${patientId.slice(-4).toUpperCase()}` : "OPD-101");

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
      const initialWidth = isMobile ? 130 : 176;
      const initialHeight = isMobile ? 186 : 246;
      setPipPos({
        x: Math.max(10, window.innerWidth - initialWidth - 14),
        y: Math.max(10, window.innerHeight - initialHeight - 36),
      });
    }
  }, [isFloating, pipPos]);

  if (!isOpen) return null;

  const isCallType = effectiveCallMode === "video" || effectiveCallMode === "audio";
  const isActive = isCallType && (state.statusMessage === "" || hasConnectedOnce);
  const isConnecting = effectiveCallMode === "connecting" || (isCallType && !hasConnectedOnce && state.statusMessage !== "");
  const isIncoming = effectiveCallMode === "incoming";

  // Strict local role detection
  const isLocalReceptionist = callerRole === "receptionist";
  const isLocalDoctor = !isLocalReceptionist && (isDoctor || callerRole === "doctor");
  const isLocalAsha = callerRole === "asha";
  const isLocalPatient = !isLocalReceptionist && !isLocalDoctor && !isLocalAsha;

  // Remote role detection
  const incomingRole = state.incomingCaller?.callerRole;
  const rawCallerTitle = state.incomingCaller?.callerTitle || callerTitle;
  const displayCallerTitle = sanitizeTitle(rawCallerTitle, incomingRole || callerRole, facilityName);

  // Determine remote role when patient is receiving/viewing the call
  const isRemoteDoctor = isLocalPatient && Boolean(
    incomingRole === "doctor" ||
    (displayCallerTitle && (/^(Dr\.?|Doctor)/i.test(displayCallerTitle) || /Consultation/i.test(displayCallerTitle))) ||
    Boolean(patientDetails?.doctorName || assignedDoctor)
  );

  const isRemoteReceptionist = isLocalPatient && Boolean(
    !isRemoteDoctor && (
      incomingRole === "receptionist" ||
      (displayCallerTitle && /reception/i.test(displayCallerTitle)) ||
      (facilityName && !isRemoteDoctor && !displayCallerTitle?.startsWith("Dr."))
    )
  );

  const isRemoteAsha = isLocalPatient && Boolean(
    !isRemoteDoctor && !isRemoteReceptionist && (
      incomingRole === "asha" ||
      (displayCallerTitle && /asha/i.test(displayCallerTitle))
    )
  );

  // Dynamic remote participant, hospital name, and local user labels
  const isSionFacility = (facilityName || displayCallerTitle)?.includes("Lokmanya") || (facilityName || displayCallerTitle)?.includes("SION");

  let remoteDisplayName = "Remote Video";
  let remoteSubTitle = "Live Tele-Health";
  let modalHeaderTitle = "Tele-Health Consultation";
  let modalHeaderSubtitle = "Connected";
  let modalHeaderIcon = <PhoneCall size={20} />;

  if (isLocalPatient) {
    if (isRemoteDoctor) {
      remoteDisplayName = displayCallerTitle || assignedDoctor || "Dr. Consultation";
      remoteSubTitle = assignedDept ? `${assignedDept} • Tele-Consultation` : "Doctor Tele-Consultation";
      modalHeaderTitle = displayCallerTitle || assignedDoctor || "Dr. Consultation";
      modalHeaderSubtitle = assignedDept ? `${assignedDept} • Online Consultation` : "Doctor Tele-Consultation";
      modalHeaderIcon = <Stethoscope size={20} />;
    } else if (isRemoteReceptionist) {
      remoteDisplayName = isSionFacility ? "SION Hospital (LTMGH Mumbai)" : (facilityName || displayCallerTitle || "Hospital Reception Desk");
      remoteSubTitle = resolvedTokenNumber ? `Reception Desk • Token: #${resolvedTokenNumber}` : "Reception Desk Live Verification";
      modalHeaderTitle = isSionFacility ? "SION Hospital (LTMGH Mumbai)" : (facilityName || displayCallerTitle || "Hospital Reception Desk");
      modalHeaderSubtitle = resolvedTokenNumber ? `Live Verification Desk • Token: #${resolvedTokenNumber}` : "Reception Desk Live Verification";
      modalHeaderIcon = <Building2 size={20} />;
    } else if (isRemoteAsha) {
      remoteDisplayName = displayCallerTitle || "ASHA Community Health Worker";
      remoteSubTitle = "Community Health Assistance";
      modalHeaderTitle = displayCallerTitle || "ASHA Community Health Worker";
      modalHeaderSubtitle = "Community Health Assistance";
      modalHeaderIcon = <User size={20} />;
    } else {
      remoteDisplayName = displayCallerTitle || "Consultation Desk";
      remoteSubTitle = resolvedTokenNumber ? `Token: #${resolvedTokenNumber}` : "Tele-Health Call";
      modalHeaderTitle = displayCallerTitle || "Tele-Health Consultation";
      modalHeaderSubtitle = resolvedTokenNumber ? `Connected • Token: #${resolvedTokenNumber}` : "Connected";
      modalHeaderIcon = <PhoneCall size={20} />;
    }
  } else if (isLocalDoctor) {
    remoteDisplayName = patientName ? `${patientName}` : "Patient Feed";
    remoteSubTitle = patientId ? `Phone: ${patientId} • Token: ${resolvedTokenNumber}` : `Token: ${resolvedTokenNumber}`;
    modalHeaderTitle = "Clinical Tele-Consultation Room";
    modalHeaderSubtitle = patientName ? `Patient: ${patientName}${patientId ? ` (${patientId})` : ""}` : "Patient Consultation";
    modalHeaderIcon = <Stethoscope size={20} />;
  } else if (isLocalReceptionist) {
    remoteDisplayName = patientName ? `${patientName}` : "Patient Feed";
    remoteSubTitle = patientId ? `Phone: ${patientId} • Token: ${resolvedTokenNumber}` : `Token: ${resolvedTokenNumber}`;
    modalHeaderTitle = isSionFacility ? "SION Hospital (LTMGH Mumbai) — Reception Desk" : "Reception Desk Live Verification";
    modalHeaderSubtitle = patientName ? `Patient: ${patientName}${patientId ? ` (${patientId})` : ""}` : "Patient Live Verification";
    modalHeaderIcon = <Building2 size={20} />;
  } else if (isLocalAsha) {
    remoteDisplayName = patientName ? `${patientName}` : "Patient Feed";
    remoteSubTitle = patientId ? `Phone: ${patientId}` : "Patient Visit";
    modalHeaderTitle = "ASHA Field Consultation";
    modalHeaderSubtitle = patientName ? `Patient: ${patientName}` : "Patient Visit";
    modalHeaderIcon = <User size={20} />;
  }

  const localDisplayName = isLocalReceptionist
    ? "You (Reception)"
    : isLocalDoctor
    ? "You (Doctor)"
    : isLocalAsha
    ? "You (ASHA)"
    : (patientName ? `${patientName} (You)` : "You");

  const handleStartCall = (mode: "video" | "audio") => {
    actions.startCall(mode, {
      callerRole: callerRole === "patient" ? undefined : (callerRole as any),
      callerTitle: displayCallerTitle,
      facilityName: isLocalReceptionist ? facilityName : undefined,
      department: assignedDept,
    });
  };

  const handleSaveVerificationNotes = async (statusOverride?: string) => {
    setIsSavingNotes(true);
    try {
      const combinedNotes = isLocalDoctor
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
            verificationStatus: statusOverride || (isLocalDoctor ? "Consultation Completed" : "Verified & Confirmed"),
            doctorName: assignedDoctor,
            department: assignedDept,
          }),
        });
      }
      setNotesSaveStatus(statusOverride ? `Updated: ${statusOverride}` : "Saved");
      setTimeout(() => setNotesSaveStatus(null), 3000);
    } catch {
      setNotesSaveStatus("Saved locally");
      setTimeout(() => setNotesSaveStatus(null), 3000);
    } finally {
      setIsSavingNotes(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // ── 1. FLOATING PICTURE-IN-PICTURE (PiP) MODE (WHATSAPP-STYLE SLEEK CARD) ──
  // ═══════════════════════════════════════════════════════════════════════════
  if (isFloating && isActive) {
    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
      if ((e.target as HTMLElement).closest("button")) return;
      const isMobile = typeof window !== "undefined" && window.innerWidth < 640;
      const cardW = isMobile ? 130 : 176;
      const cardH = isMobile ? 186 : 246;
      const currentX = pipPos?.x ?? (typeof window !== "undefined" ? window.innerWidth - cardW - 14 : 20);
      const currentY = pipPos?.y ?? (typeof window !== "undefined" ? window.innerHeight - cardH - 36 : 20);

      dragRef.current = {
        pointerX: e.clientX,
        pointerY: e.clientY,
        initX: currentX,
        initY: currentY,
        active: true,
      };
      setIsDragging(true);
      (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
      if (!dragRef.current.active) return;
      const dx = e.clientX - dragRef.current.pointerX;
      const dy = e.clientY - dragRef.current.pointerY;
      const isMobile = window.innerWidth < 640;
      const cardW = isMobile ? 130 : 176;
      const cardH = isMobile ? 186 : 246;
      const newX = Math.max(6, Math.min(window.innerWidth - cardW - 6, dragRef.current.initX + dx));
      const newY = Math.max(6, Math.min(window.innerHeight - cardH - 6, dragRef.current.initY + dy));
      setPipPos({ x: newX, y: newY });
    };

    const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
      if (!dragRef.current.active) return;
      const dx = Math.abs(e.clientX - dragRef.current.pointerX);
      const dy = Math.abs(e.clientY - dragRef.current.pointerY);
      dragRef.current.active = false;
      setIsDragging(false);
      try {
        (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
      } catch {}

      // Tapping anywhere without dragging expands back to full modal
      if (dx < 5 && dy < 5) {
        setIsFloating(false);
      }
    };

    return (
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        title="Tap to expand fullscreen • Drag to move freely"
        style={{
          position: "fixed",
          left: pipPos?.x ?? "auto",
          top: pipPos?.y ?? "auto",
          right: pipPos ? "auto" : 14,
          bottom: pipPos ? "auto" : 36,
          zIndex: 999999,
          width: typeof window !== "undefined" && window.innerWidth < 640 ? 130 : 176,
          height: typeof window !== "undefined" && window.innerWidth < 640 ? 186 : 246,
          background: "#050B14",
          borderRadius: 18,
          border: isLocalReceptionist ? "2px solid #0284C7" : "2px solid rgba(255,255,255,0.35)",
          boxShadow: "0 16px 40px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.15)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          cursor: isDragging ? "grabbing" : "grab",
          userSelect: "none",
          touchAction: "none",
          animation: "popIn .2s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
        }}
      >
        {/* Full-bleed Remote Video View */}
        {effectiveCallMode === "video" ? (
          <div style={{ width: "100%", height: "100%", position: "relative", background: "#050B14" }}>
            <PersistentStreamVideo stream={state.remoteStream} />

            {/* Local Patient Thumbnail (Bottom-Right, WhatsApp style) */}
            <div style={{
              position: "absolute",
              bottom: 8,
              right: 8,
              width: 36,
              height: 50,
              borderRadius: 6,
              border: "1.5px solid rgba(255,255,255,0.9)",
              overflow: "hidden",
              boxShadow: "0 4px 12px rgba(0,0,0,0.6)",
              zIndex: 15,
              background: "#000",
            }}>
              <PersistentStreamVideo stream={state.localStream} isMirrored isMuted />
            </div>
          </div>
        ) : (
          <AudioOnlyView
            name={remoteDisplayName}
            isDoctor={!isLocalPatient}
            stream={state.remoteStream}
            compact
          />
        )}

        {/* Top-Left: Live Duration Badge */}
        <div style={{
          position: "absolute",
          top: 8,
          left: 8,
          background: "rgba(10, 15, 26, 0.8)",
          backdropFilter: "blur(8px)",
          borderRadius: 12,
          padding: "2px 6px",
          display: "flex",
          alignItems: "center",
          gap: 4,
          zIndex: 20,
          border: "1px solid rgba(255,255,255,0.2)",
          pointerEvents: "none"
        }}>
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#4ADE80", animation: "pulse 1.5s infinite" }} />
          <span style={{ fontSize: 9.5, fontWeight: 800, color: "white" }}>{formatDuration(state.callDuration)}</span>
        </div>

        {/* Top-Right: Expand Button */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setIsFloating(false); }}
          title="Expand to Fullscreen"
          style={{
            position: "absolute",
            top: 7,
            right: 7,
            width: 24,
            height: 24,
            borderRadius: "50%",
            background: "rgba(10, 15, 26, 0.82)",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(255,255,255,0.25)",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            zIndex: 25,
          }}
        >
          <Maximize2 size={11} />
        </button>

        {/* Bottom-Left: Remote Participant / Hospital Title */}
        <div style={{
          position: "absolute",
          bottom: 8,
          left: 8,
          maxWidth: "calc(100% - 52px)",
          background: "rgba(10, 15, 26, 0.85)",
          backdropFilter: "blur(8px)",
          borderRadius: 6,
          padding: "2px 6px",
          zIndex: 15,
          border: "1px solid rgba(255,255,255,0.18)",
          pointerEvents: "none",
        }}>
          <div style={{
            fontSize: 9,
            fontWeight: 800,
            color: "#F8FAFC",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}>
            {remoteDisplayName}
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ── 2. FULL MODAL VIEW (SPECIALIZED RECEPTIONIST VS DOCTOR VS PATIENT UI) ──
  // ═══════════════════════════════════════════════════════════════════════════
  const symptomsArray = Array.isArray(patientDetails?.symptoms)
    ? patientDetails.symptoms
    : typeof patientDetails?.symptoms === "string"
    ? patientDetails.symptoms.split(",").map(s => s.trim()).filter(Boolean)
    : [];

  const shouldShowDeskPanel = (isLocalReceptionist || isLocalDoctor) && showDeskPad;

  return (
    <div
      className={`call-modal-backdrop ${isLocalPatient ? "patient-backdrop" : "staff-backdrop"}`}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(8, 14, 24, 0.92)",
        backdropFilter: "blur(12px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: isLocalPatient ? 0 : (isActive ? "12px" : "16px"),
      }}
    >
      <div
        className={`call-dialog-container ${isLocalPatient ? "patient-fullscreen-dialog" : "staff-fullscreen-dialog"}`}
        style={{
          width: "100%",
          maxWidth: isLocalPatient
            ? "100vw"
            : (shouldShowDeskPanel ? "min(1080px, 96vw)" : "min(560px, 94vw)"),
          height: isLocalPatient ? "100vh" : "auto",
          background: "#041D24",
          backgroundImage: "radial-gradient(ellipse at top left, rgba(15, 118, 110, 0.18), transparent 60%), radial-gradient(ellipse at bottom right, rgba(2, 132, 199, 0.12), transparent 60%)",
          borderRadius: isLocalPatient ? 0 : 22,
          maxHeight: isLocalPatient ? "100vh" : "96vh",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          border: isLocalPatient ? "none" : "1px solid rgba(20, 184, 166, 0.28)",
          boxShadow: isLocalPatient ? "none" : "0 25px 65px rgba(0,0,0,0.85), 0 0 0 1px rgba(20, 184, 166, 0.15)",
          animation: "slideUp .25s cubic-bezier(0.16, 1, 0.3, 1)",
          transition: "max-width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        {/* Modal Header */}
        <div style={{
          background: "linear-gradient(135deg, #042F2E 0%, #0F766E 55%, #115E59 100%)",
          padding: isLocalPatient ? "14px 16px" : "16px 22px",
          borderRadius: isLocalPatient ? 0 : "22px 22px 0 0",
          flexShrink: 0,
          borderBottom: "1px solid rgba(20, 184, 166, 0.3)",
          boxShadow: "0 2px 10px rgba(0,0,0,0.25)",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
              <div style={{
                width: 42, height: 42, borderRadius: 12,
                background: "rgba(255, 255, 255, 0.15)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(255, 255, 255, 0.3)",
                display: "flex", alignItems: "center", justifyContent: "center", color: "white", flexShrink: 0,
                boxShadow: "0 4px 12px rgba(0,0,0,0.2)"
              }}>
                {modalHeaderIcon}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{
                  fontSize: isLocalPatient ? 14 : 15.5,
                  fontWeight: 800,
                  color: "#FFFFFF",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  letterSpacing: -0.2
                }}>
                  {isIncoming ? "Incoming Consultation Call" : modalHeaderTitle}
                </div>
                <div style={{ fontSize: 11.5, color: "#CCFBF1", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontWeight: 500 }}>
                  {isIncoming
                    ? (isRemoteDoctor ? "Doctor Tele-Consultation" : isRemoteReceptionist ? "Reception Desk Live Verification" : "AarogyaAI Tele-Health")
                    : modalHeaderSubtitle}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
              {isActive && (
                <>
                  <div style={{ background: "rgba(16, 185, 129, 0.2)", border: "1px solid rgba(16, 185, 129, 0.4)", borderRadius: 20, padding: "4px 12px", display: "flex", alignItems: "center", gap: 6, backdropFilter: "blur(8px)" }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#34D399", animation: "pulse 1.5s infinite" }} />
                    <span style={{ fontSize: 12, fontWeight: 800, color: "#A7F3D0", letterSpacing: 0.5 }}>{formatDuration(state.callDuration)}</span>
                  </div>

                  {/* Float Button */}
                  <button
                    type="button"
                    onClick={() => setIsFloating(true)}
                    title="Float Call Screen & Move Freely"
                    style={{
                      background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.28)", borderRadius: 10, padding: "7px 12px",
                      color: "#FFFFFF", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
                      backdropFilter: "blur(6px)", transition: "all 0.15s ease"
                    }}>
                    <Minimize2 size={13} /> Float PiP
                  </button>
                </>
              )}

              {!isActive && !isIncoming && (
                <button
                  type="button"
                  onClick={onClose}
                  style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)", borderRadius: 10, padding: "6px 14px", color: "white", fontSize: 12, cursor: "pointer", fontWeight: 700, display: "flex", alignItems: "center", gap: 5, backdropFilter: "blur(6px)" }}>
                  <X size={14} /> Close
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Status / Critical Network Alert Banner */}
        {state.networkQuality === "critical" && isActive && (
          <div style={{ background: "rgba(239, 68, 68, 0.15)", padding: "8px 18px", display: "flex", gap: 8, alignItems: "center", justifyContent: "center", borderBottom: "1px solid rgba(239, 68, 68, 0.3)" }}>
            <AlertTriangle size={16} color="#F87171" />
            <span style={{ fontSize: 12, color: "#FCA5A5", fontWeight: 600 }}>
              Network connection weak. Audio channel prioritized for uninterrupted clarity.
            </span>
          </div>
        )}

        {state.statusMessage && !isIncoming && !isActive && effectiveCallMode !== "ended" && (
          <div style={{ background: "rgba(20, 184, 166, 0.12)", padding: "8px 16px", fontSize: 12, color: "#5EEAD4", fontWeight: 700, textAlign: "center", borderBottom: "1px solid rgba(20, 184, 166, 0.2)" }}>
            {state.statusMessage}
          </div>
        )}

        <div
          className={isLocalPatient ? "patient-content-body" : "staff-content-body"}
          style={{ padding: isLocalPatient ? (isActive ? "4px 8px 12px" : "12px 14px 20px") : "20px 22px", flex: 1, display: "flex", flexDirection: "column" }}
        >

          {/* ── 1. IDLE: Choose call type (initiator side) ── */}
          {effectiveCallMode === "idle" && (
            <div>
              {/* Patient Verification Information Card */}
              <div style={{
                background: "rgba(6, 33, 40, 0.75)",
                backdropFilter: "blur(12px)",
                borderRadius: 18,
                padding: "20px",
                marginBottom: 18,
                border: "1px solid rgba(20, 184, 166, 0.28)",
                boxShadow: "0 8px 24px rgba(0, 0, 0, 0.35)"
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{
                      width: 52, height: 52, borderRadius: 14,
                      background: "linear-gradient(135deg, rgba(15, 118, 110, 0.4), rgba(20, 184, 166, 0.2))",
                      border: "1px solid rgba(20, 184, 166, 0.5)",
                      display: "flex", alignItems: "center", justifyContent: "center", color: "#5EEAD4",
                      boxShadow: "0 4px 14px rgba(15, 118, 110, 0.3)"
                    }}>
                      {isLocalReceptionist ? <Building2 size={26} /> : <Stethoscope size={26} />}
                    </div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 17, fontWeight: 800, color: "#F8FAFC", letterSpacing: -0.2 }}>{patientName}</span>
                        <span style={{ fontSize: 10, fontWeight: 800, background: "rgba(20, 184, 166, 0.15)", border: "1px solid rgba(20, 184, 166, 0.4)", color: "#5EEAD4", padding: "2px 8px", borderRadius: 12 }}>
                          TELE-HEALTH
                        </span>
                      </div>
                      <div style={{ fontSize: 12.5, color: "#94A3B8", marginTop: 3 }}>
                        Calling as: <strong style={{ color: "#2DD4BF" }}>{displayCallerTitle}</strong>
                      </div>
                    </div>
                  </div>

                  {resolvedTokenNumber && (
                    <div style={{
                      background: "rgba(15, 118, 110, 0.2)",
                      border: "1px solid rgba(20, 184, 166, 0.35)",
                      borderRadius: 12,
                      padding: "6px 14px",
                      textAlign: "right"
                    }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase" }}>Assigned Token</div>
                      <div style={{ fontSize: 15, fontWeight: 900, color: "#5EEAD4" }}>{resolvedTokenNumber}</div>
                    </div>
                  )}
                </div>

                {patientDetails && (
                  <div style={{
                    marginTop: 16,
                    paddingTop: 14,
                    borderTop: "1px solid rgba(20, 184, 166, 0.18)",
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
                    gap: 10,
                    fontSize: 12,
                    color: "#CBD5E1"
                  }}>
                    <div style={{ background: "rgba(4, 29, 36, 0.6)", padding: "8px 10px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)" }}>
                      <span style={{ color: "#94A3B8", display: "block", fontSize: 10, fontWeight: 600 }}>PHONE NUMBER</span>
                      <strong style={{ color: "#F8FAFC", fontSize: 12 }}>{patientId}</strong>
                    </div>
                    <div style={{ background: "rgba(4, 29, 36, 0.6)", padding: "8px 10px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)" }}>
                      <span style={{ color: "#94A3B8", display: "block", fontSize: 10, fontWeight: 600 }}>DEPARTMENT</span>
                      <strong style={{ color: "#F8FAFC", fontSize: 12 }}>{patientDetails.department || "General Medicine"}</strong>
                    </div>
                    {patientDetails.urgency && (
                      <div style={{ background: "rgba(4, 29, 36, 0.6)", padding: "8px 10px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)" }}>
                        <span style={{ color: "#94A3B8", display: "block", fontSize: 10, fontWeight: 600 }}>TRIAGE URGENCY</span>
                        <strong style={{ color: patientDetails.urgency.includes("RED") ? "#F87171" : patientDetails.urgency.includes("YELLOW") ? "#FDE047" : "#4ADE80", fontSize: 12 }}>
                          {patientDetails.urgency}
                        </strong>
                      </div>
                    )}
                    {patientDetails.slotTime && (
                      <div style={{ background: "rgba(4, 29, 36, 0.6)", padding: "8px 10px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)" }}>
                        <span style={{ color: "#94A3B8", display: "block", fontSize: 10, fontWeight: 600 }}>SLOT TIME</span>
                        <strong style={{ color: "#F8FAFC", fontSize: 12 }}>{patientDetails.slotTime}</strong>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Call Initiation Action Buttons */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
                <button
                  type="button"
                  onClick={() => handleStartCall("video")}
                  style={{
                    padding: "18px 16px", borderRadius: 16, border: "1px solid rgba(20, 184, 166, 0.4)", cursor: "pointer",
                    background: "linear-gradient(135deg, #0F766E 0%, #0D9488 100%)",
                    color: "white", display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                    boxShadow: "0 8px 24px rgba(15, 118, 110, 0.35)", transition: "transform 0.15s ease, box-shadow 0.15s ease"
                  }}>
                  <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Video size={24} />
                  </div>
                  <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: -0.2 }}>Start Video Call</span>
                  <span style={{ fontSize: 11, color: "#CCFBF1", fontWeight: 500 }}>High Definition Face-to-Face</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleStartCall("audio")}
                  style={{
                    padding: "18px 16px", borderRadius: 16, border: "1px solid rgba(16, 185, 129, 0.4)", cursor: "pointer",
                    background: "linear-gradient(135deg, #059669 0%, #10B981 100%)",
                    color: "white", display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                    boxShadow: "0 8px 24px rgba(16, 185, 129, 0.35)", transition: "transform 0.15s ease, box-shadow 0.15s ease"
                  }}>
                  <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Mic size={24} />
                  </div>
                  <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: -0.2 }}>Start Audio Call</span>
                  <span style={{ fontSize: 11, color: "#D1FAE5", fontWeight: 500 }}>Low bandwidth friendly</span>
                </button>
              </div>

              {/* AarogyaAI Workflow Tip Box */}
              <div style={{
                background: "rgba(15, 118, 110, 0.12)",
                borderRadius: 14, padding: "12px 16px", border: "1px solid rgba(20, 184, 166, 0.25)", display: "flex", alignItems: "center", gap: 12
              }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(20, 184, 166, 0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Sparkles size={16} color="#2DD4BF" />
                </div>
                <span style={{ fontSize: 12, color: "#99F6E4", lineHeight: 1.5 }}>
                  {isLocalReceptionist ? (
                    <><strong>Receptionist Workflow:</strong> Connect with patient to visually verify identity & symptoms, eliminate fraudulent registrations, assign OPD consultation token, and route to doctor.</>
                  ) : (
                    <><strong>Doctor Tele-Consultation:</strong> Conduct clinical video consultation, inspect AI triage recommendations, prescribe medications, or order laboratory diagnostics.</>
                  )}
                </span>
              </div>
            </div>
          )}

          {/* ── 2. INCOMING CALL SCREEN ── */}
          {isIncoming && (
            <div style={{ textAlign: "center", padding: "34px 18px" }}>
              <div style={{
                width: 96, height: 96, borderRadius: "50%",
                background: "linear-gradient(135deg, rgba(15, 118, 110, 0.3), rgba(20, 184, 166, 0.2))",
                border: "2px solid rgba(20, 184, 166, 0.6)",
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                color: "#5EEAD4", animation: "ring 1.2s infinite ease-in-out", marginBottom: 18,
                boxShadow: "0 0 35px rgba(20, 184, 166, 0.4)"
              }}>
                {isRemoteDoctor ? <Stethoscope size={42} /> : isRemoteReceptionist ? <Building2 size={42} /> : isRemoteAsha ? <User size={42} /> : <PhoneCall size={42} />}
              </div>

              <div style={{ fontSize: 22, fontWeight: 900, color: "#FFFFFF", letterSpacing: "-0.02em" }}>
                {remoteDisplayName}
              </div>

              <div style={{ fontSize: 13.5, fontWeight: 700, color: "#2DD4BF", marginTop: 4 }}>
                {remoteSubTitle}
              </div>

              <div style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                background: "rgba(20, 184, 166, 0.12)", border: "1px solid rgba(20, 184, 166, 0.3)", borderRadius: 20, padding: "5px 14px",
                fontSize: 12, color: "#CCFBF1", marginTop: 12, marginBottom: 34
              }}>
                {effectiveIncomingCallType === "video" ? <Video size={14} color="#5EEAD4" /> : <Mic size={14} color="#5EEAD4" />}
                <span style={{ fontWeight: 600 }}>{effectiveIncomingCallType === "video" ? "Incoming Live Video Consultation" : "Incoming Encrypted Voice Consultation"}</span>
              </div>

              <div style={{ display: "flex", gap: 36, justifyContent: "center", alignItems: "center" }}>
                <button
                  type="button"
                  onClick={() => { actions.rejectCall(); onClose(); }}
                  style={{
                    width: 78, height: 78, borderRadius: "50%", border: "none", cursor: "pointer",
                    background: `linear-gradient(135deg, ${C.redLight}, ${C.red})`,
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3,
                    boxShadow: "0 8px 26px rgba(239,68,68,0.6)", transition: "transform 0.15s ease",
                  }}>
                  <PhoneOff size={24} color="white" />
                  <span style={{ fontSize: 11, fontWeight: 800, color: "white" }}>Decline</span>
                </button>

                <button
                  type="button"
                  onClick={() => actions.answerCall(effectiveIncomingCallType === "video" ? "video" : "audio")}
                  style={{
                    width: 78, height: 78, borderRadius: "50%", border: "none", cursor: "pointer",
                    background: "linear-gradient(135deg, #059669, #10B981)",
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3,
                    boxShadow: "0 8px 26px rgba(16, 185, 129, 0.6)", transition: "transform 0.15s ease",
                  }}>
                  <Phone size={24} color="white" />
                  <span style={{ fontSize: 11, fontWeight: 800, color: "white" }}>Answer</span>
                </button>
              </div>
            </div>
          )}

          {/* ── 3. CONNECTING / RINGING ── */}
          {isConnecting && (
            <div style={{ textAlign: "center", padding: "40px 20px" }}>
              <div style={{ width: 68, height: 68, borderRadius: "50%", background: "rgba(20, 184, 166, 0.18)", border: "1px solid rgba(20, 184, 166, 0.4)", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#5EEAD4", animation: "pulse 1s infinite" }}>
                <PhoneCall size={34} />
              </div>
              <div style={{ fontSize: 19, fontWeight: 800, color: "#F8FAFC", marginTop: 16 }}>{state.statusMessage || "Connecting..."}</div>
              <div style={{ fontSize: 13, color: "#94A3B8", marginTop: 6 }}>Establishing encrypted WebRTC connection with {patientName}...</div>
              <button
                type="button"
                onClick={actions.endCall}
                style={{ marginTop: 26, padding: "12px 36px", borderRadius: 30, border: "none", background: C.red, color: "white", fontWeight: 800, fontSize: 14, cursor: "pointer", boxShadow: "0 4px 16px rgba(239,68,68,0.4)" }}>
                Cancel Call
              </button>
            </div>
          )}

          {/* ── 4. ACTIVE CALL VIEW ── */}
          {isActive && (
            <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 12 }}>
              {/* Top Sub-bar with Network Quality and Clean Segmented Switcher */}
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 8,
                padding: "2px 2px 4px"
              }}>
                <NetworkBadge quality={state.networkQuality} />

                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  {/* Token Pill for Patient */}
                  {isLocalPatient && (
                    <div style={{ background: "rgba(20, 184, 166, 0.15)", border: "1px solid rgba(20, 184, 166, 0.35)", borderRadius: 14, padding: "4px 12px", fontSize: 11, fontWeight: 800, color: "#5EEAD4" }}>
                      Token: #{resolvedTokenNumber}
                    </div>
                  )}

                  {/* High-Performance Segmented Switcher (Doctor & Receptionist) */}
                  {(isLocalReceptionist || isLocalDoctor) && (
                    <div style={{
                      display: "flex",
                      background: "rgba(4, 29, 36, 0.85)",
                      padding: "3px",
                      borderRadius: 12,
                      border: "1px solid rgba(20, 184, 166, 0.25)",
                      gap: 3,
                    }}>
                      <button
                        type="button"
                        onClick={() => {
                          setMobileTab("video");
                          if (typeof window !== "undefined" && window.innerWidth >= 769 && showDeskPad) {
                            setShowDeskPad(false);
                          }
                        }}
                        style={{
                          padding: "5px 12px",
                          borderRadius: 9,
                          border: "none",
                          background: (mobileTab === "video" && (!showDeskPad || (typeof window !== "undefined" && window.innerWidth < 769)))
                            ? "linear-gradient(135deg, #0F766E, #0D9488)"
                            : "transparent",
                          color: (mobileTab === "video") ? "white" : "#94A3B8",
                          fontSize: 11.5,
                          fontWeight: 700,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                          transition: "all .15s ease"
                        }}
                      >
                        <Video size={13} />
                        <span>Video Feed</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setMobileTab("desk");
                          setShowDeskPad(true);
                        }}
                        style={{
                          padding: "5px 12px",
                          borderRadius: 9,
                          border: "none",
                          background: (mobileTab === "desk" || (showDeskPad && typeof window !== "undefined" && window.innerWidth >= 769))
                            ? "linear-gradient(135deg, #0F766E, #0D9488)"
                            : "transparent",
                          color: (mobileTab === "desk" || showDeskPad) ? "white" : "#94A3B8",
                          fontSize: 11.5,
                          fontWeight: 700,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                          transition: "all .15s ease"
                        }}
                      >
                        {isLocalReceptionist ? <Building2 size={13} /> : <Stethoscope size={13} />}
                        <span>{isLocalReceptionist ? "Verification Desk" : "Clinical Desk"}</span>
                        {patientDetails?.urgency?.includes("RED") && (
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#EF4444" }} />
                        )}
                      </button>
                    </div>
                  )}

                  <span style={{ fontSize: 11, color: "#94A3B8", display: "flex", alignItems: "center", gap: 4, fontWeight: 600 }}>
                    {effectiveCallMode === "video" ? <Video size={13} color="#2DD4BF" /> : <Mic size={13} color="#2DD4BF" />}
                    {effectiveCallMode === "video" ? "Video Channel" : "Voice Channel"}
                  </span>
                </div>
              </div>

              {/* Main Call + In-Call Desk Grid */}
              <div
                className={`call-main-grid ${shouldShowDeskPanel ? "has-desk-panel" : ""}`}
                style={{
                  display: "grid",
                  gap: 16,
                }}
              >
                {/* Video / Audio Stream Feed */}
                <div
                  className={`call-video-column ${mobileTab === "desk" ? "mobile-hide-video" : ""}`}
                  style={{
                    flexDirection: "column", minWidth: 0, width: "100%"
                  }}
                >
                  {effectiveCallMode === "video" ? (
                    <div
                      className={isLocalPatient ? "patient-video-frame" : "staff-video-frame"}
                      style={{
                        position: "relative",
                        borderRadius: isLocalPatient ? 0 : 18,
                        overflow: "hidden",
                        minHeight: isLocalPatient ? "62vh" : 300,
                        height: isLocalPatient ? "calc(100dvh - 150px)" : "48vh",
                        maxHeight: isLocalPatient ? "none" : 520,
                        background: "#020B10",
                        border: isLocalPatient ? "none" : "1px solid rgba(20, 184, 166, 0.25)",
                        boxShadow: "0 8px 30px rgba(0, 0, 0, 0.5)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <VideoView
                        stream={state.remoteStream}
                        label={remoteDisplayName}
                        subLabel={remoteSubTitle}
                        fitMode={fitMode}
                        onToggleFit={() => setFitMode(fitMode === "contain" ? "cover" : "contain")}
                      />
                      <div style={{ position: "absolute", top: 12, right: 12, zIndex: 10 }}>
                        <VideoView stream={state.localStream} label={localDisplayName} isMirrored isMuted isSmall />
                      </div>
                    </div>
                  ) : (
                    <div style={{ marginBottom: 10, minHeight: isLocalPatient ? "60vh" : "auto", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <AudioOnlyView
                        name={remoteDisplayName}
                        isDoctor={!isLocalPatient}
                        stream={state.remoteStream}
                        onSwitchToVideo={actions.upgradeToVideo}
                      />
                    </div>
                  )}

                  {/* Active Call Controls Dock */}
                  <div
                    className={isLocalPatient ? "patient-controls-dock" : "staff-controls-dock"}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 12,
                      marginTop: 14,
                      flexWrap: "nowrap",
                    }}
                  >
                    <button
                      type="button"
                      onClick={actions.toggleMute}
                      style={{
                        width: 46, height: 46, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.15)", cursor: "pointer",
                        background: state.isMuted ? C.red : "rgba(255,255,255,0.12)", backdropFilter: "blur(8px)", boxShadow: "0 4px 14px rgba(0,0,0,.35)",
                        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, color: "white", flexShrink: 0
                      }}>
                      {state.isMuted ? <MicOff size={16} /> : <Mic size={16} />}
                      <span style={{ fontSize: 8, fontWeight: 700 }}>{state.isMuted ? "Muted" : "Mute"}</span>
                    </button>

                    {effectiveCallMode === "video" && (
                      <button
                        type="button"
                        onClick={actions.toggleCamera}
                        style={{
                          width: 46, height: 46, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.15)", cursor: "pointer",
                          background: state.isCameraOff ? C.red : "rgba(255,255,255,0.12)", backdropFilter: "blur(8px)", boxShadow: "0 4px 14px rgba(0,0,0,.35)",
                          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, color: "white", flexShrink: 0
                        }}>
                        {state.isCameraOff ? <VideoOff size={16} /> : <Video size={16} />}
                        <span style={{ fontSize: 8, fontWeight: 700 }}>{state.isCameraOff ? "Cam Off" : "Cam"}</span>
                      </button>
                    )}

                    {effectiveCallMode === "video" && (
                      <button
                        type="button"
                        onClick={actions.downgradeToAudio}
                        style={{
                          width: 46, height: 46, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.15)", cursor: "pointer",
                          background: "rgba(255,255,255,0.12)", backdropFilter: "blur(8px)", boxShadow: "0 4px 14px rgba(0,0,0,.35)",
                          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, color: "white", flexShrink: 0
                        }}>
                        <PhoneCall size={16} />
                        <span style={{ fontSize: 8, fontWeight: 700 }}>Voice</span>
                      </button>
                    )}

                    {effectiveCallMode === "audio" && (
                      <button
                        type="button"
                        onClick={actions.upgradeToVideo}
                        style={{
                          height: 46, padding: "0 18px", borderRadius: 24, border: "1px solid rgba(20, 184, 166, 0.4)", cursor: "pointer",
                          background: "linear-gradient(135deg, #0F766E, #0D9488)", backdropFilter: "blur(8px)", boxShadow: "0 4px 14px rgba(15, 118, 110, 0.4)",
                          display: "flex", alignItems: "center", justifyContent: "center", gap: 6, color: "white", flexShrink: 0
                        }}>
                        <Video size={17} />
                        <span style={{ fontSize: 11, fontWeight: 800 }}>Switch to Video</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={actions.endCall}
                      style={{
                        width: 48, height: 48, borderRadius: "50%", border: "none", cursor: "pointer",
                        background: `linear-gradient(135deg, ${C.redLight}, ${C.red})`,
                        boxShadow: "0 4px 20px rgba(239,68,68,.65)",
                        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, color: "white", flexShrink: 0
                      }}>
                      <PhoneOff size={20} />
                      <span style={{ fontSize: 8, fontWeight: 800 }}>End</span>
                    </button>
                  </div>
                </div>

                {/* Right Column: TAILORED DESK PAD (Only for Receptionist & Doctor) */}

                {/* ── A. RECEPTIONIST DESK PAD UI ── */}
                {isLocalReceptionist && showDeskPad && (
                  <div
                    className={`call-desk-column ${mobileTab === "video" ? "mobile-hide-desk" : ""}`}
                    style={{
                      background: "rgba(6, 33, 40, 0.85)", borderRadius: 18, padding: "18px",
                      border: "1px solid rgba(20, 184, 166, 0.3)", flexDirection: "column", gap: 14,
                      minWidth: 0, width: "100%", boxShadow: "0 8px 30px rgba(0,0,0,0.3)"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ fontSize: 14.5, fontWeight: 800, color: "#5EEAD4", display: "flex", alignItems: "center", gap: 8 }}>
                        <Building2 size={18} /> In-Call Reception Verification Desk
                      </div>
                      {notesSaveStatus && (
                        <span style={{ fontSize: 11, fontWeight: 800, color: "#4ADE80", background: "rgba(34,197,94,0.18)", padding: "3px 10px", borderRadius: 12, border: "1px solid rgba(34,197,94,0.3)" }}>
                          {notesSaveStatus}
                        </span>
                      )}
                    </div>

                    {/* Patient Card */}
                    <div style={{ background: "rgba(4, 29, 36, 0.75)", borderRadius: 12, padding: "12px 14px", fontSize: 11.5, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, color: "#CBD5E1", border: "1px solid rgba(20, 184, 166, 0.15)" }}>
                      <div><span style={{ color: "#94A3B8" }}>Phone:</span> <strong style={{ color: "white" }}>{patientId}</strong></div>
                      <div><span style={{ color: "#94A3B8" }}>Assigned Token:</span> <strong style={{ color: "#5EEAD4" }}>{resolvedTokenNumber}</strong></div>
                      <div><span style={{ color: "#94A3B8" }}>Urgency:</span> <strong style={{ color: patientDetails?.urgency?.includes("RED") ? "#F87171" : "#4ADE80" }}>{patientDetails?.urgency || "STANDARD"}</strong></div>
                      <div><span style={{ color: "#94A3B8" }}>Slot:</span> <strong style={{ color: "white" }}>{patientDetails?.slotTime || "Walk-In / Immediate"}</strong></div>
                    </div>

                    {/* Doctor Routing & OPD Assignment */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      <div>
                        <label style={{ fontSize: 10.5, fontWeight: 700, color: "#99F6E4", display: "block", marginBottom: 4 }}>Assign Doctor</label>
                        <select
                          value={assignedDoctor}
                          onChange={(e) => setAssignedDoctor(e.target.value)}
                          style={{
                            width: "100%", background: "#041D24", border: "1px solid rgba(20, 184, 166, 0.3)",
                            borderRadius: 10, color: "white", padding: "8px 10px", fontSize: 11.5, outline: "none"
                          }}>
                          <option value="Dr. Vasanth">Dr. Vasanth (General Medicine)</option>
                          <option value="Dr. S. Kulkarni">Dr. S. Kulkarni (Emergency & Trauma)</option>
                          <option value="Dr. Ramesh Sharma">Dr. Ramesh Sharma (CMO)</option>
                          <option value="Dr. Anjali Deshmukh">Dr. Anjali Deshmukh (Pediatrics)</option>
                          <option value="Dr. Sneha Gokhale">Dr. Sneha Gokhale (Gynecology)</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: 10.5, fontWeight: 700, color: "#99F6E4", display: "block", marginBottom: 4 }}>OPD Room</label>
                        <select
                          value={assignedDept}
                          onChange={(e) => setAssignedDept(e.target.value)}
                          style={{
                            width: "100%", background: "#041D24", border: "1px solid rgba(20, 184, 166, 0.3)",
                            borderRadius: 10, color: "white", padding: "8px 10px", fontSize: 11.5, outline: "none"
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
                      <div style={{ fontSize: 10.5, fontWeight: 700, color: "#99F6E4", marginBottom: 6 }}>Live Verification Badges</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {[
                          "Face & Photo ID Matched",
                          "Genuine Patient",
                          "ABHA Card Verified",
                          "Suspicious Details / Proxy",
                        ].map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => setDeskNotes((prev) => prev ? `${prev}\n• ${tag}` : `• ${tag}`)}
                            style={{
                              padding: "5px 10px", borderRadius: 8, border: "1px solid rgba(20, 184, 166, 0.35)",
                              background: "rgba(15, 118, 110, 0.18)", color: "#99F6E4", fontSize: 10.5, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
                              transition: "all 0.15s ease"
                            }}>
                            <Check size={11} color="#5EEAD4" /> {tag}
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
                        width: "100%", background: "#041D24", border: "1px solid rgba(20, 184, 166, 0.25)",
                        borderRadius: 10, color: "white", padding: "10px", fontSize: 11.5, resize: "none", outline: "none"
                      }}
                    />

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      <button
                        type="button"
                        disabled={isSavingNotes}
                        onClick={() => handleSaveVerificationNotes(`Verified & Routed to ${assignedDoctor}`)}
                        style={{
                          padding: "11px 14px", borderRadius: 12, border: "none",
                          background: "linear-gradient(135deg, #0F766E, #0D9488)", color: "white",
                          fontSize: 12, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                          boxShadow: "0 4px 14px rgba(15, 118, 110, 0.4)"
                        }}>
                        <CheckCircle2 size={15} /> {isSavingNotes ? "Saving..." : "Verify & Route to Doctor"}
                      </button>
                      <button
                        type="button"
                        disabled={isSavingNotes}
                        onClick={() => handleSaveVerificationNotes("Flagged Suspicious / Canceled")}
                        style={{
                          padding: "11px 14px", borderRadius: 12, border: "none",
                          background: "linear-gradient(135deg, #EF4444, #B91C1C)", color: "white",
                          fontSize: 12, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                          boxShadow: "0 4px 14px rgba(239, 68, 68, 0.4)"
                        }}>
                        <ShieldAlert size={15} /> Flag Suspicious
                      </button>
                    </div>
                  </div>
                )}

                {/* ── B. DOCTOR CLINICAL DESK PAD UI ── */}
                {isLocalDoctor && showDeskPad && (
                  <div
                    className={`call-desk-column ${mobileTab === "video" ? "mobile-hide-desk" : ""}`}
                    style={{
                      background: "rgba(6, 33, 40, 0.85)", borderRadius: 18, padding: "18px",
                      border: "1px solid rgba(20, 184, 166, 0.3)", flexDirection: "column", gap: 14,
                      minWidth: 0, width: "100%", boxShadow: "0 8px 30px rgba(0,0,0,0.3)"
                    }}
                  >
                    {/* Mobile Quick Return Banner */}
                    <div className="mobile-desk-header" style={{ display: "none", alignItems: "center", justifyContent: "space-between", background: "rgba(4, 29, 36, 0.9)", padding: "8px 12px", borderRadius: 12, border: "1px solid rgba(20, 184, 166, 0.25)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#4ADE80", animation: "pulse 1.5s infinite" }} />
                        <span style={{ fontSize: 11, fontWeight: 700, color: "white" }}>In Call with {patientName}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setMobileTab("video")}
                        style={{
                          background: "rgba(20, 184, 166, 0.2)",
                          border: "1px solid rgba(20, 184, 166, 0.4)",
                          borderRadius: 8,
                          padding: "4px 10px",
                          color: "#5EEAD4",
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <Video size={12} /> Video Feed
                      </button>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ fontSize: 14.5, fontWeight: 800, color: "#5EEAD4", display: "flex", alignItems: "center", gap: 8 }}>
                        <Stethoscope size={18} /> Clinical Diagnosis & Tele-Consultation
                      </div>
                      {notesSaveStatus && (
                        <span style={{ fontSize: 11, fontWeight: 800, color: "#4ADE80", background: "rgba(34,197,94,0.18)", padding: "3px 10px", borderRadius: 12, border: "1px solid rgba(34,197,94,0.3)" }}>
                          {notesSaveStatus}
                        </span>
                      )}
                    </div>

                    {/* Symptoms & AI Reasoning Card */}
                    <div style={{ background: "rgba(4, 29, 36, 0.75)", borderRadius: 12, padding: "12px 14px", border: "1px solid rgba(20, 184, 166, 0.15)" }}>
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
                            <span key={idx} style={{ background: "rgba(15, 118, 110, 0.2)", border: "1px solid rgba(20, 184, 166, 0.35)", borderRadius: 6, padding: "2px 6px", fontSize: 10, color: "#99F6E4", fontWeight: 600 }}>
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
                      <label style={{ fontSize: 10.5, fontWeight: 700, color: "#99F6E4", display: "block", marginBottom: 4 }}>
                        Presumptive Diagnosis / Clinical Findings
                      </label>
                      <input
                        type="text"
                        value={clinicalDiagnosis}
                        onChange={(e) => setClinicalDiagnosis(e.target.value)}
                        placeholder="e.g. Acute Viral Upper Respiratory Infection, Mild Dehydration"
                        style={{
                          width: "100%", background: "#041D24", border: "1px solid rgba(20, 184, 166, 0.3)",
                          borderRadius: 10, color: "white", padding: "8px 10px", fontSize: 11.5, outline: "none", marginBottom: 8
                        }}
                      />

                      <textarea
                        value={deskNotes}
                        onChange={(e) => setDeskNotes(e.target.value)}
                        placeholder="Clinical examination notes, advice, follow-up..."
                        rows={2}
                        style={{
                          width: "100%", background: "#041D24", border: "1px solid rgba(20, 184, 166, 0.25)",
                          borderRadius: 10, color: "white", padding: "10px", fontSize: 11.5, resize: "none", outline: "none"
                        }}
                      />
                    </div>

                    {/* Quick In-Call Order Triggers */}
                    <div>
                      <div style={{ fontSize: 10.5, fontWeight: 700, color: "#99F6E4", marginBottom: 6 }}>1-Click Rx & Lab Prescriptions</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {[
                          { label: "Paracetamol 500mg", type: "rx" },
                          { label: "ORS Solution", type: "rx" },
                          { label: "Cetirizine 10mg", type: "rx" },
                          { label: "CBC + Platelets", type: "lab" },
                          { label: "Malaria Rapid RDT", type: "lab" },
                          { label: "Sputum AFB Test", type: "lab" },
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
                                padding: "5px 10px", borderRadius: 8,
                                border: isSelected ? "1px solid #10B981" : "1px solid rgba(20, 184, 166, 0.25)",
                                background: isSelected ? "rgba(16, 185, 129, 0.25)" : "rgba(4, 29, 36, 0.6)",
                                color: isSelected ? "#4ADE80" : "#CBD5E1", fontSize: 10.5, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4
                              }}>
                              {item.type === "rx" ? <Pill size={11} /> : <FlaskConical size={11} />}
                              {item.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Save & Conclude Consultation */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 4 }}>
                      <button
                        type="button"
                        disabled={isSavingNotes}
                        onClick={() => handleSaveVerificationNotes("Consultation Completed")}
                        style={{
                          padding: "11px 14px", borderRadius: 12, border: "none",
                          background: "linear-gradient(135deg, #0F766E, #0D9488)", color: "white",
                          fontSize: 12, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                          boxShadow: "0 4px 14px rgba(15, 118, 110, 0.4)"
                        }}>
                        <CheckCircle2 size={15} /> {isSavingNotes ? "Submitting..." : "Save Rx & Complete"}
                      </button>
                      <button
                        type="button"
                        disabled={isSavingNotes}
                        onClick={() => handleSaveVerificationNotes("Referral Recommended")}
                        style={{
                          padding: "11px 14px", borderRadius: 12, border: "none",
                          background: "linear-gradient(135deg, #0284C7, #0369A1)", color: "white",
                          fontSize: 12, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                          boxShadow: "0 4px 14px rgba(2, 132, 199, 0.4)"
                        }}>
                        <FileText size={15} /> Specialist Referral
                      </button>
                    </div>
                  </div>
                )}

              </div>
            </div>
          )}

          {/* ── 5. POST-CALL SESSION SUMMARY SCREEN ── */}
          {effectiveCallMode === "ended" && (
            <div style={{ textAlign: "center", padding: isLocalPatient ? "24px 16px" : "32px 24px" }}>
              <div style={{
                width: 72, height: 72, borderRadius: "50%",
                background: "linear-gradient(135deg, rgba(15, 118, 110, 0.35), rgba(20, 184, 166, 0.15))",
                border: "2px solid rgba(20, 184, 166, 0.5)",
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                color: "#5EEAD4", marginBottom: 16,
                boxShadow: "0 4px 24px rgba(20, 184, 166, 0.25)"
              }}>
                <CheckCircle2 size={36} />
              </div>

              <div style={{ fontSize: 20, fontWeight: 900, color: "#FFFFFF", letterSpacing: "-0.02em" }}>
                Consultation Session Concluded
              </div>

              <div style={{ fontSize: 13, color: "#94A3B8", marginTop: 4 }}>
                {state.statusMessage || "Call ended"} • Duration: <strong style={{ color: "#5EEAD4" }}>{formatDuration(state.callDuration)}</strong>
              </div>

              {/* Consultation Summary Card */}
              <div style={{
                background: "rgba(6, 33, 40, 0.75)",
                backdropFilter: "blur(10px)",
                borderRadius: 16,
                padding: "16px 20px",
                margin: "20px auto 24px",
                maxWidth: 480,
                border: "1px solid rgba(20, 184, 166, 0.25)",
                textAlign: "left"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, paddingBottom: 10, borderBottom: "1px solid rgba(20, 184, 166, 0.15)" }}>
                  <div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase" }}>Patient Record</span>
                    <div style={{ fontSize: 15, fontWeight: 800, color: "#F8FAFC" }}>{patientName}</div>
                  </div>
                  {resolvedTokenNumber && (
                    <div style={{ background: "rgba(20, 184, 166, 0.15)", border: "1px solid rgba(20, 184, 166, 0.35)", borderRadius: 10, padding: "4px 10px", fontSize: 12, fontWeight: 800, color: "#5EEAD4" }}>
                      Token: #{resolvedTokenNumber}
                    </div>
                  )}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 12, color: "#CBD5E1" }}>
                  <div><span style={{ color: "#94A3B8" }}>Phone:</span> <strong style={{ color: "white" }}>{patientId}</strong></div>
                  <div><span style={{ color: "#94A3B8" }}>Department:</span> <strong style={{ color: "white" }}>{patientDetails?.department || assignedDept || "General Medicine"}</strong></div>
                  {isLocalReceptionist && (
                    <div><span style={{ color: "#94A3B8" }}>Assigned Doctor:</span> <strong style={{ color: "#5EEAD4" }}>{assignedDoctor}</strong></div>
                  )}
                  <div><span style={{ color: "#94A3B8" }}>Session Mode:</span> <strong style={{ color: "#5EEAD4" }}>Encrypted WebRTC</strong></div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", maxWidth: 480, margin: "0 auto" }}>
                {isLocalReceptionist && (
                  <>
                    <button
                      type="button"
                      onClick={async () => {
                        await handleSaveVerificationNotes(`Verified & Routed to ${assignedDoctor}`);
                        onClose();
                      }}
                      style={{
                        flex: 1, minWidth: 180, padding: "12px 18px", borderRadius: 12, border: "none", cursor: "pointer",
                        background: "linear-gradient(135deg, #0F766E, #0D9488)", color: "white", fontSize: 13, fontWeight: 800,
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 6, boxShadow: "0 4px 14px rgba(15, 118, 110, 0.4)"
                      }}
                    >
                      <CheckCircle2 size={16} /> Mark Verified & Route
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      style={{
                        padding: "12px 20px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.18)", cursor: "pointer",
                        background: "rgba(255,255,255,0.08)", color: "#F8FAFC", fontSize: 13, fontWeight: 700
                      }}
                    >
                      Close Window
                    </button>
                  </>
                )}

                {isLocalDoctor && (
                  <>
                    <button
                      type="button"
                      onClick={async () => {
                        await handleSaveVerificationNotes("Consultation Completed");
                        onClose();
                      }}
                      style={{
                        flex: 1, minWidth: 180, padding: "12px 18px", borderRadius: 12, border: "none", cursor: "pointer",
                        background: "linear-gradient(135deg, #0F766E, #0D9488)", color: "white", fontSize: 13, fontWeight: 800,
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 6, boxShadow: "0 4px 14px rgba(15, 118, 110, 0.4)"
                      }}
                    >
                      <CheckCircle2 size={16} /> Complete & Save Rx
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      style={{
                        padding: "12px 20px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.18)", cursor: "pointer",
                        background: "rgba(255,255,255,0.08)", color: "#F8FAFC", fontSize: 13, fontWeight: 700
                      }}
                    >
                      Close Window
                    </button>
                  </>
                )}

                {isLocalPatient && (
                  <button
                    type="button"
                    onClick={onClose}
                    style={{
                      flex: 1, minWidth: 200, padding: "13px 20px", borderRadius: 12, border: "none", cursor: "pointer",
                      background: "linear-gradient(135deg, #0F766E, #0D9488)", color: "white", fontSize: 13.5, fontWeight: 800,
                      boxShadow: "0 4px 14px rgba(15, 118, 110, 0.4)"
                    }}
                  >
                    Return to Home / Dashboard
                  </button>
                )}
              </div>
            </div>
          )}

        </div>
      </div>

      <style>{`
        @keyframes ring {
          0%, 100% { transform: rotate(0deg) scale(1); }
          25% { transform: rotate(-8deg) scale(1.05); }
          75% { transform: rotate(8deg) scale(1.05); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.9); }
        }
        @keyframes audioRipple {
          0%, 100% { transform: scale(1); opacity: 0.9; }
          50% { transform: scale(1.08); opacity: 0.6; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.85); }
          to { opacity: 1; transform: scale(1); }
        }

        /* Desktop Mode (>= 769px) */
        @media (min-width: 769px) {
          .has-desk-panel {
            grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr) !important;
          }
          .call-video-column {
            display: flex !important;
          }
          .call-desk-column {
            display: flex !important;
            max-height: 520px !important;
            overflow-y: auto !important;
          }
          .mobile-desk-header {
            display: none !important;
          }
        }

        /* Mobile Mode (<= 768px) */
        @media (max-width: 768px) {
          .call-modal-backdrop,
          .patient-backdrop,
          .staff-backdrop {
            padding: 0 !important;
            background: #050B14 !important;
          }
          .call-dialog-container,
          .patient-fullscreen-dialog,
          .staff-fullscreen-dialog {
            width: 100vw !important;
            max-width: 100vw !important;
            height: 100vh !important;
            height: 100dvh !important;
            max-height: 100dvh !important;
            border-radius: 0 !important;
            border: none !important;
            overflow: hidden !important;
          }
          .patient-content-body,
          .staff-content-body {
            padding: 0 !important;
            height: calc(100dvh - 66px) !important;
            display: flex !important;
            flex-direction: column !important;
            overflow: hidden !important;
          }
          .call-main-grid {
            grid-template-columns: 1fr !important;
            gap: 0 !important;
            flex: 1 !important;
            height: calc(100dvh - 116px) !important;
          }
          .call-video-column {
            width: 100% !important;
            height: 100% !important;
            display: flex !important;
            position: relative !important;
          }
          .call-desk-column {
            width: 100% !important;
            height: calc(100dvh - 116px) !important;
            max-height: calc(100dvh - 116px) !important;
            display: flex !important;
            overflow-y: auto !important;
            padding: 12px 14px 44px !important;
            border-radius: 0 !important;
            border: none !important;
          }
          .mobile-hide-video {
            display: none !important;
          }
          .mobile-hide-desk {
            display: none !important;
          }
          .mobile-desk-header {
            display: flex !important;
          }
          .staff-video-frame,
          .patient-video-frame {
            height: calc(100dvh - 116px) !important;
            min-height: calc(100dvh - 116px) !important;
            max-height: calc(100dvh - 116px) !important;
            border-radius: 0 !important;
            border: none !important;
            position: relative !important;
            flex: 1 !important;
          }
          .staff-video-frame .video-main-label,
          .patient-video-frame .video-main-label {
            bottom: 96px !important;
            left: 12px !important;
            max-width: calc(100vw - 28px) !important;
            background: rgba(10, 20, 35, 0.92) !important;
            border: 1px solid rgba(56, 189, 248, 0.3) !important;
            padding: 6px 12px !important;
            z-index: 25 !important;
          }
          .staff-controls-dock,
          .patient-controls-dock {
            position: absolute !important;
            bottom: 22px !important;
            left: 50% !important;
            transform: translateX(-50%) !important;
            z-index: 40 !important;
            background: rgba(15, 23, 42, 0.88) !important;
            backdrop-filter: blur(16px) !important;
            border: 1px solid rgba(255, 255, 255, 0.18) !important;
            border-radius: 36px !important;
            padding: 6px 14px !important;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6) !important;
            display: flex !important;
            flex-direction: row !important;
            flex-wrap: nowrap !important;
            align-items: center !important;
            justify-content: center !important;
            gap: 10px !important;
            margin-top: 0 !important;
            width: auto !important;
            max-width: 92vw !important;
          }
        }
      `}</style>
    </div>
  );
}
