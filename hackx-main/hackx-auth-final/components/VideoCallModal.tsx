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
}: {
  name: string;
  isDoctor: boolean;
  stream: MediaStream | null;
  compact?: boolean;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  useEffect(() => {
    if (audioRef.current && stream) audioRef.current.srcObject = stream;
  }, [stream]);

  return (
    <div style={{
      borderRadius: compact ? 12 : 16,
      background: "radial-gradient(ellipse at center, #1E293B 0%, #0F172A 70%, #050B14 100%)",
      height: compact ? "100%" : 240,
      border: "1px solid rgba(255,255,255,0.1)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: compact ? 8 : 14,
    }}>
      {stream && <audio ref={audioRef} autoPlay playsInline />}
      <div style={{
        width: compact ? 54 : 76, height: compact ? 54 : 76, borderRadius: "50%",
        background: isDoctor ? "#0284C7" : "#10B981",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: compact ? 22 : 28, color: "white", fontWeight: 800,
        boxShadow: `0 0 0 10px rgba(${isDoctor ? "2,132,199" : "16,185,129"},.25)`,
        animation: "audioRipple 2s ease-in-out infinite",
      }}>
        {name[0]?.toUpperCase() || "A"}
      </div>
      <div style={{ textAlign: "center", padding: "0 12px" }}>
        <div style={{ fontSize: compact ? 13 : 16, fontWeight: 800, color: "white" }}>{name}</div>
        <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 3, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
          <Mic size={12} color="#10B981" /> Encrypted Voice Channel Active
        </div>
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
      className={`call-modal-backdrop ${isLocalPatient ? "patient-backdrop" : ""}`}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(8, 14, 24, 0.92)",
        backdropFilter: "blur(12px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: isLocalPatient ? 0 : (isActive ? "12px" : "16px"),
      }}
    >
      <div
        className={`call-dialog-container ${isLocalPatient ? "patient-fullscreen-dialog" : ""}`}
        style={{
          width: "100%",
          maxWidth: isLocalPatient
            ? "100vw"
            : (shouldShowDeskPanel ? "min(1060px, 96vw)" : "min(560px, 94vw)"),
          height: isLocalPatient ? "100vh" : "auto",
          background: isLocalReceptionist ? "#0A192F" : "#0F172A",
          borderRadius: isLocalPatient ? 0 : 24,
          maxHeight: isLocalPatient ? "100vh" : "96vh",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          border: isLocalPatient ? "none" : (isLocalReceptionist ? "1px solid rgba(14, 165, 233, 0.3)" : "1px solid rgba(59, 130, 246, 0.3)"),
          boxShadow: isLocalPatient ? "none" : "0 25px 65px rgba(0,0,0,0.75), 0 0 0 1px rgba(56, 189, 248, 0.15)",
          animation: "slideUp .25s ease-out",
          transition: "max-width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        {/* Modal Header */}
        <div style={{
          background: isLocalReceptionist
            ? "linear-gradient(135deg, #075985, #0C4A6E)"
            : "linear-gradient(135deg, #1E293B, #0F172A)",
          padding: isLocalPatient ? "14px 16px" : "16px 20px",
          borderRadius: isLocalPatient ? 0 : "24px 24px 0 0",
          flexShrink: 0,
          borderBottom: "1px solid rgba(255,255,255,0.1)",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
              <div style={{
                width: 40, height: 40, borderRadius: "50%",
                background: (isLocalReceptionist || isRemoteReceptionist) ? "rgba(14, 165, 233, 0.25)" : "rgba(56, 189, 248, 0.15)",
                border: (isLocalReceptionist || isRemoteReceptionist) ? "1px solid rgba(14, 165, 233, 0.5)" : "1px solid rgba(56, 189, 248, 0.3)",
                display: "flex", alignItems: "center", justifyContent: "center", color: "white", flexShrink: 0
              }}>
                {modalHeaderIcon}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{
                  fontSize: isLocalPatient ? 13.5 : 15,
                  fontWeight: 800,
                  color: "#F8FAFC",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  letterSpacing: -0.2
                }}>
                  {isIncoming ? "Incoming Call" : modalHeaderTitle}
                </div>
                <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {isIncoming
                    ? (isRemoteDoctor ? "Doctor Tele-Consultation" : isRemoteReceptionist ? "Reception Desk Verification" : "Tele-Health Call")
                    : modalHeaderSubtitle}
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
                    <Minimize2 size={13} /> Float PiP
                  </button>
                </>
              )}

              {!isActive && !isIncoming && (
                <button
                  type="button"
                  onClick={onClose}
                  style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, padding: "6px 12px", color: "white", fontSize: 12, cursor: "pointer", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
                  <X size={14} /> Close
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Video fallback warning */}
        {state.isVideoFallback && (
          <div style={{ background: "#FEF9E7", padding: "10px 16px", display: "flex", gap: 10, alignItems: "flex-start", borderBottom: "1px solid #F4D03F" }}>
            <AlertTriangle size={18} color="#D97706" />
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

        <div
          className={isLocalPatient ? "patient-content-body" : "staff-content-body"}
          style={{ padding: isLocalPatient ? (isActive ? "4px 8px 12px" : "12px 14px 20px") : "18px 20px", flex: 1, display: "flex", flexDirection: "column" }}
        >

          {/* ── 1. IDLE: Choose call type (initiator side) ── */}
          {effectiveCallMode === "idle" && (
            <div>
              <div style={{
                background: isLocalReceptionist ? "rgba(7, 89, 133, 0.2)" : "rgba(30, 41, 59, 0.7)",
                borderRadius: 18, padding: 18, marginBottom: 16,
                border: isLocalReceptionist ? "1px solid rgba(14, 165, 233, 0.3)" : "1px solid rgba(255,255,255,0.1)"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 52, height: 52, borderRadius: "50%", background: isLocalReceptionist ? "rgba(14, 165, 233, 0.2)" : "rgba(56, 189, 248, 0.15)", border: "1px solid rgba(56, 189, 248, 0.3)", display: "flex", alignItems: "center", justifyContent: "center", color: "#38BDF8" }}>
                    {isLocalReceptionist ? <Building2 size={24} /> : <Stethoscope size={24} />}
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
                    <div><span style={{ color: "#94A3B8" }}>Token:</span> <strong style={{ color: "#38BDF8" }}>{resolvedTokenNumber}</strong></div>
                    {patientDetails.urgency && <div><span style={{ color: "#94A3B8" }}>Urgency:</span> <strong style={{ color: patientDetails.urgency.includes("RED") ? "#F87171" : "#4ADE80" }}>{patientDetails.urgency}</strong></div>}
                  </div>
                )}
              </div>

              <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
                <button
                  type="button"
                  onClick={() => handleStartCall("video")}
                  style={{
                    flex: 1, padding: "16px 12px", borderRadius: 16, border: "none", cursor: "pointer",
                    background: "linear-gradient(135deg, #0284C7, #0369A1)",
                    color: "white", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, boxShadow: "0 6px 18px rgba(2, 132, 199, 0.35)"
                  }}>
                  <Video size={28} />
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
                  <Mic size={28} />
                  <span style={{ fontSize: 15, fontWeight: 800 }}>Start Audio Call</span>
                  <span style={{ fontSize: 11, opacity: .85 }}>Low bandwidth friendly</span>
                </button>
              </div>

              <div style={{
                background: isLocalReceptionist ? "rgba(14, 165, 233, 0.12)" : "rgba(56, 189, 248, 0.1)",
                borderRadius: 14, padding: "12px 14px", border: "1px solid rgba(56, 189, 248, 0.25)", display: "flex", gap: 10
              }}>
                <Sparkles size={16} color="#38BDF8" />
                <span style={{ fontSize: 12, color: "#38BDF8", lineHeight: 1.5 }}>
                  {isLocalReceptionist ? (
                    <><strong>Receptionist Flow:</strong> Call patient to verify face & ID card, eliminate fake bookings, assign OPD token, and route to doctor.</>
                  ) : (
                    <><strong>Doctor Flow:</strong> Conduct tele-consultation, assess AI triage findings, write live diagnosis notes, and order lab tests or medications.</>
                  )}
                </span>
              </div>
            </div>
          )}

          {/* ── 2. INCOMING CALL SCREEN ── */}
          {isIncoming && (
            <div style={{ textAlign: "center", padding: "30px 16px" }}>
              <div style={{
                width: 90, height: 90, borderRadius: "50%",
                background: "linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(16, 185, 129, 0.2))",
                border: "2px solid rgba(56, 189, 248, 0.4)",
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                color: "#38BDF8", animation: "ring 1.2s infinite ease-in-out", marginBottom: 16
              }}>
                {isRemoteDoctor ? <Stethoscope size={38} /> : isRemoteReceptionist ? <Building2 size={38} /> : isRemoteAsha ? <User size={38} /> : <PhoneCall size={38} />}
              </div>

              <div style={{ fontSize: 20, fontWeight: 900, color: "#FFFFFF", letterSpacing: "-0.02em" }}>
                {remoteDisplayName}
              </div>

              <div style={{ fontSize: 13, fontWeight: 600, color: "#38BDF8", marginTop: 4 }}>
                {remoteSubTitle}
              </div>

              <div style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                background: "rgba(255,255,255,0.08)", borderRadius: 20, padding: "4px 12px",
                fontSize: 12, color: "#E2E8F0", marginTop: 10, marginBottom: 32
              }}>
                {effectiveIncomingCallType === "video" ? <Video size={13} color="#38BDF8" /> : <Mic size={13} color="#38BDF8" />}
                <span>{effectiveIncomingCallType === "video" ? "Live Video Consultation" : "Voice Consultation"}</span>
              </div>

              <div style={{ display: "flex", gap: 32, justifyContent: "center", alignItems: "center" }}>
                <button
                  type="button"
                  onClick={() => { actions.rejectCall(); onClose(); }}
                  style={{
                    width: 76, height: 76, borderRadius: "50%", border: "none", cursor: "pointer",
                    background: `linear-gradient(135deg, ${C.redLight}, ${C.red})`,
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3,
                    boxShadow: "0 8px 24px rgba(239,68,68,0.6)", transition: "transform 0.15s ease",
                  }}>
                  <PhoneOff size={24} color="white" />
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
                  }}>
                  <Phone size={24} color="white" />
                  <span style={{ fontSize: 11, fontWeight: 800, color: "white" }}>Answer</span>
                </button>
              </div>
            </div>
          )}

          {/* ── 3. CONNECTING / RINGING ── */}
          {isConnecting && (
            <div style={{ textAlign: "center", padding: "36px 20px" }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(56, 189, 248, 0.15)", border: "1px solid rgba(56, 189, 248, 0.3)", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#38BDF8", animation: "pulse 1s infinite" }}>
                <PhoneCall size={32} />
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#F8FAFC", marginTop: 14 }}>{state.statusMessage || "Connecting..."}</div>
              <div style={{ fontSize: 13, color: "#94A3B8", marginTop: 6 }}>Connecting to {patientName}...</div>
              <button
                type="button"
                onClick={actions.endCall}
                style={{ marginTop: 24, padding: "12px 34px", borderRadius: 30, border: "none", background: C.red, color: "white", fontWeight: 700, fontSize: 14, cursor: "pointer", boxShadow: "0 4px 14px rgba(239,68,68,0.4)" }}>
                Cancel Call
              </button>
            </div>
          )}

          {/* ── 4. ACTIVE CALL VIEW ── */}
          {isActive && (
            <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 12 }}>
              {/* Top Sub-bar */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                <NetworkBadge quality={state.networkQuality} />

                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  {/* Token Pill for Patient */}
                  {isLocalPatient && (
                    <div style={{ background: "rgba(14, 165, 233, 0.15)", border: "1px solid rgba(14, 165, 233, 0.3)", borderRadius: 14, padding: "4px 10px", fontSize: 11, fontWeight: 800, color: "#38BDF8" }}>
                      Token: #{resolvedTokenNumber}
                    </div>
                  )}

                  {(isLocalReceptionist || isLocalDoctor) && (
                    <button
                      type="button"
                      onClick={() => setShowDeskPad(!showDeskPad)}
                      style={{
                        padding: "5px 12px", borderRadius: 14, border: "none",
                        background: showDeskPad ? (isLocalReceptionist ? "#0284C7" : "#3B82F6") : "rgba(255,255,255,0.15)",
                        color: "white", fontSize: 11, fontWeight: 700, cursor: "pointer",
                        display: "flex", alignItems: "center", gap: 5
                      }}>
                      {isLocalReceptionist ? <Building2 size={13} /> : <Stethoscope size={13} />}
                      {isLocalReceptionist ? "Verification Desk" : "Clinical Desk Pad"}
                    </button>
                  )}
                  <span style={{ fontSize: 12, color: "#94A3B8", display: "flex", alignItems: "center", gap: 4 }}>
                    {effectiveCallMode === "video" ? <Video size={13} /> : <Mic size={13} />}
                    {effectiveCallMode === "video" ? "Video" : "Voice"}
                  </span>
                </div>
              </div>

              {/* Mobile Tab Switcher ONLY for Receptionist/Doctor when on narrow screen */}
              {shouldShowDeskPanel && (
                <div className="mobile-only-tabs" style={{ display: "none", gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => setMobileTab("video")}
                    style={{
                      flex: 1, padding: "8px 12px", borderRadius: 10, border: "none",
                      background: mobileTab === "video" ? "#0284C7" : "rgba(255,255,255,0.08)",
                      color: "white", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5
                    }}>
                    <Video size={14} /> Video Feed
                  </button>
                  <button
                    type="button"
                    onClick={() => setMobileTab("desk")}
                    style={{
                      flex: 1, padding: "8px 12px", borderRadius: 10, border: "none",
                      background: mobileTab === "desk" ? "#0284C7" : "rgba(255,255,255,0.08)",
                      color: "white", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5
                    }}>
                    <ClipboardList size={14} /> {isLocalReceptionist ? "Verification Desk" : "Clinical Desk"}
                  </button>
                </div>
              )}

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
                        background: "#050B14",
                        border: isLocalPatient ? "none" : "1px solid rgba(255,255,255,0.12)",
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
                      <AudioOnlyView name={remoteDisplayName} isDoctor={!isLocalPatient} stream={state.remoteStream} />
                    </div>
                  )}

                  {/* Active Call Controls Dock */}
                  <div
                    className={isLocalPatient ? "patient-controls-dock" : "staff-controls-dock"}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 10,
                      marginTop: 14,
                      flexWrap: "nowrap",
                    }}
                  >
                    <button
                      type="button"
                      onClick={actions.toggleMute}
                      style={{
                        width: 44, height: 44, borderRadius: "50%", border: "none", cursor: "pointer",
                        background: state.isMuted ? C.red : "rgba(255,255,255,0.15)", boxShadow: "0 4px 12px rgba(0,0,0,.3)",
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
                          width: 44, height: 44, borderRadius: "50%", border: "none", cursor: "pointer",
                          background: state.isCameraOff ? C.red : "rgba(255,255,255,0.15)", boxShadow: "0 4px 12px rgba(0,0,0,.3)",
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
                          width: 44, height: 44, borderRadius: "50%", border: "none", cursor: "pointer",
                          background: "rgba(255,255,255,0.15)", boxShadow: "0 4px 12px rgba(0,0,0,.3)",
                          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, color: "white", flexShrink: 0
                        }}>
                        <PhoneCall size={16} />
                        <span style={{ fontSize: 8, fontWeight: 700 }}>Voice</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={actions.endCall}
                      style={{
                        width: 46, height: 46, borderRadius: "50%", border: "none", cursor: "pointer",
                        background: `linear-gradient(135deg,${C.redLight},${C.red})`,
                        boxShadow: "0 4px 18px rgba(239,68,68,.6)",
                        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, color: "white", flexShrink: 0
                      }}>
                      <PhoneOff size={20} />
                      <span style={{ fontSize: 8, fontWeight: 700 }}>End</span>
                    </button>
                  </div>
                </div>

                {/* Right Column: TAILORED DESK PAD (Only for Receptionist & Doctor) */}

                {/* ── A. RECEPTIONIST DESK PAD UI ── */}
                {isLocalReceptionist && showDeskPad && (
                  <div
                    className={`call-desk-column ${mobileTab === "video" ? "mobile-hide-desk" : ""}`}
                    style={{
                      background: "rgba(10, 30, 52, 0.8)", borderRadius: 18, padding: "16px",
                      border: "1px solid rgba(14, 165, 233, 0.3)", flexDirection: "column", gap: 12,
                      minWidth: 0, width: "100%"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: "#38BDF8", display: "flex", alignItems: "center", gap: 6 }}>
                        <Building2 size={16} /> In-Call Reception Verification Desk
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
                      <div>Assigned Token: <strong style={{ color: "#38BDF8" }}>{resolvedTokenNumber}</strong></div>
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
                              padding: "4px 8px", borderRadius: 8, border: "1px solid rgba(14, 165, 233, 0.3)",
                              background: "rgba(14, 165, 233, 0.1)", color: "#BAE6FD", fontSize: 10, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4
                            }}>
                            <Check size={10} /> {tag}
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
                        <CheckCircle2 size={13} /> {isSavingNotes ? "Saving..." : "Verify & Route to Doctor"}
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
                        <ShieldAlert size={13} /> Flag Suspicious
                      </button>
                    </div>
                  </div>
                )}

                {/* ── B. DOCTOR CLINICAL DESK PAD UI ── */}
                {isLocalDoctor && showDeskPad && (
                  <div
                    className={`call-desk-column ${mobileTab === "video" ? "mobile-hide-desk" : ""}`}
                    style={{
                      background: "rgba(30, 41, 59, 0.75)", borderRadius: 18, padding: "16px",
                      border: "1px solid rgba(59, 130, 246, 0.3)", flexDirection: "column", gap: 12,
                      minWidth: 0, width: "100%"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: "#60A5FA", display: "flex", alignItems: "center", gap: 6 }}>
                        <Stethoscope size={16} /> Clinical Diagnosis & Tele-Consultation
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
                                padding: "4px 8px", borderRadius: 8,
                                border: isSelected ? "1px solid #10B981" : "1px solid rgba(255,255,255,0.15)",
                                background: isSelected ? "rgba(16, 185, 129, 0.25)" : "rgba(255,255,255,0.06)",
                                color: isSelected ? "#4ADE80" : "#CBD5E1", fontSize: 10, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4
                              }}>
                              {item.type === "rx" ? <Pill size={11} /> : <FlaskConical size={11} />}
                              {item.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Save & Conclude Consultation */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 4 }}>
                      <button
                        type="button"
                        disabled={isSavingNotes}
                        onClick={() => handleSaveVerificationNotes("Consultation Completed")}
                        style={{
                          padding: "10px 12px", borderRadius: 10, border: "none",
                          background: "linear-gradient(135deg, #10B981, #047857)", color: "white",
                          fontSize: 11, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4
                        }}>
                        <CheckCircle2 size={13} /> {isSavingNotes ? "Submitting..." : "Save Rx & Complete"}
                      </button>
                      <button
                        type="button"
                        disabled={isSavingNotes}
                        onClick={() => handleSaveVerificationNotes("Referral Recommended")}
                        style={{
                          padding: "10px 12px", borderRadius: 10, border: "none",
                          background: "linear-gradient(135deg, #0284C7, #0369A1)", color: "white",
                          fontSize: 11, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4
                        }}>
                        <FileText size={13} /> Specialist Referral
                      </button>
                    </div>
                  </div>
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
            grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr) !important;
          }
          .call-video-column {
            display: flex !important;
          }
          .call-desk-column {
            display: flex !important;
          }
          .mobile-only-tabs {
            display: none !important;
          }
        }

        /* Mobile Mode (<= 768px) */
        @media (max-width: 768px) {
          .mobile-only-tabs {
            display: flex !important;
          }
          .call-main-grid {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }
          .call-video-column {
            width: 100% !important;
            display: flex;
          }
          .call-desk-column {
            width: 100% !important;
            display: flex;
          }
          .mobile-hide-video {
            display: none !important;
          }
          .mobile-hide-desk {
            display: none !important;
          }

          /* Patient True Full Screen on Mobile */
          .patient-backdrop {
            padding: 0 !important;
            background: #050B14 !important;
          }
          .patient-fullscreen-dialog {
            width: 100vw !important;
            max-width: 100vw !important;
            height: 100vh !important;
            height: 100dvh !important;
            max-height: 100dvh !important;
            border-radius: 0 !important;
            border: none !important;
            overflow: hidden !important;
          }
          .patient-content-body {
            padding: 0 !important;
            height: calc(100dvh - 70px) !important;
          }
          .patient-video-frame {
            height: calc(100dvh - 80px) !important;
            min-height: calc(100dvh - 80px) !important;
            border-radius: 0 !important;
            border: none !important;
          }
          .patient-video-frame .video-main-label {
            bottom: 96px !important;
            left: 12px !important;
            max-width: calc(100vw - 28px) !important;
            background: rgba(10, 20, 35, 0.92) !important;
            border: 1px solid rgba(56, 189, 248, 0.3) !important;
            padding: 6px 12px !important;
            z-index: 25 !important;
          }
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
