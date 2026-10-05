"use client";
import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import { getPusherClient } from "@/lib/pusher-client";
import { Stethoscope, Building2, User, PhoneCall, Video, Mic, X } from "lucide-react";

const VideoCallModal = dynamic(() => import("@/components/VideoCallModal"), { ssr: false });

export default function GlobalCallListener() {
  const { data: session } = useSession();
  const [callOpen, setCallOpen] = useState(false);
  const [incomingCallType, setIncomingCallType] = useState<"video" | "audio" | null>(null);
  const [incomingCaller, setIncomingCaller] = useState<{
    callerRole?: string;
    callerTitle?: string;
    facilityName?: string;
    department?: string;
  } | null>(null);
  const [showCallBanner, setShowCallBanner] = useState(false);
  
  const patientClientIdRef = useRef<string>(
    typeof window !== "undefined"
      ? (sessionStorage.getItem("patientSignalClientId") ||
        (() => {
          const id = Math.random().toString(36).slice(2) + Date.now().toString(36);
          sessionStorage.setItem("patientSignalClientId", id);
          return id;
        })())
      : "patient-ssr"
  );

  useEffect(() => {
    // Only patients should listen for incoming calls globally
    if (!session?.user || (session.user as any).role === "doctor") return;

    const patientId = (session.user as any).phone || session.user.name || "patient-001";
    const roomId = `consultation-${patientId}`;
    const channelName = roomId;
    const cid = patientClientIdRef.current;

    const pusher = getPusherClient();
    const channel = pusher.subscribe(channelName);

    channel.bind("pusher:subscription_succeeded", () => {
      console.log(`[GlobalCallListener] Subscribed to ${channelName}`);
    });

    channel.bind("signal", (msg: { type: string; data?: unknown; fromClientId?: string }) => {
      // Ignore own echoes
      if (msg.fromClientId === cid) return;

      if (msg.type === "call-invite") {
        const inviteData = (msg.data as {
          mode?: string;
          callerRole?: string;
          callerTitle?: string;
          facilityName?: string;
          department?: string;
        }) || {};
        const mode = (inviteData.mode as "video" | "audio") ?? "video";
        const role = inviteData.callerRole || "doctor";
        const title = inviteData.callerTitle || (role === "receptionist" ? "Hospital Reception Desk" : "Doctor Consultation");
        
        setIncomingCallType(mode);
        setIncomingCaller({
          callerRole: role,
          callerTitle: title,
          facilityName: inviteData.facilityName,
          department: inviteData.department,
        });
        setShowCallBanner(true);
        setCallOpen(true);
        
        if (typeof window !== "undefined" && "Notification" in window) {
          const notifTitle = `Incoming ${mode.toUpperCase()} Call`;
          const notifBody = `${title} is calling you on AarogyaAI`;
          if (Notification.permission === "granted") {
            new Notification(notifTitle, {
              body: notifBody,
              icon: "/favicon.ico",
            });
          } else if (Notification.permission !== "denied") {
            Notification.requestPermission().then((perm) => {
              if (perm === "granted") {
                new Notification(notifTitle, {
                  body: notifBody,
                  icon: "/favicon.ico",
                });
              }
            });
          }
        }
      }
    });

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        pusher.connect();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      pusher.unsubscribe(channelName);
    };
  }, [session]);

  if (!session?.user || (session.user as any).role === "doctor") return null;

  const isDoctorCaller = incomingCaller?.callerRole === "doctor" || (incomingCaller?.callerTitle && /^Dr\./i.test(incomingCaller.callerTitle));
  const isRecepCaller = !isDoctorCaller && incomingCaller?.callerRole === "receptionist";
  const callerLabel = incomingCaller?.callerTitle || (isDoctorCaller ? "Dr. Consultation" : isRecepCaller ? "Hospital Reception Desk" : "Tele-Health Consultation");

  return (
    <>
      {showCallBanner && !callOpen && (
        <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", zIndex: 9999, width: "92%", maxWidth: 460 }}>
          <div style={{
            background: "linear-gradient(135deg, #0F172A, #1E293B)", borderRadius: 20, padding: "16px 20px",
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14,
            boxShadow: "0 12px 35px rgba(0,0,0,.6)", border: "1px solid rgba(255,255,255,0.15)",
            animation: "popIn .4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
              <div style={{
                width: 46, height: 46, borderRadius: "50%", background: isDoctorCaller ? "rgba(16, 185, 129, 0.2)" : "rgba(59, 130, 246, 0.2)",
                border: isDoctorCaller ? "1px solid rgba(16, 185, 129, 0.4)" : "1px solid rgba(59, 130, 246, 0.4)",
                display: "flex", alignItems: "center", justifyContent: "center", color: isDoctorCaller ? "#4ADE80" : "#38BDF8",
                animation: "ring 1.2s infinite ease-in-out", flexShrink: 0
              }}>
                {isDoctorCaller ? <Stethoscope size={24} /> : isRecepCaller ? <Building2 size={24} /> : <User size={24} />}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#F8FAFC", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {callerLabel}
                </div>
                <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 2, display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    {incomingCallType === "video" ? <Video size={13} color="#38BDF8" /> : <Mic size={13} color="#38BDF8" />}
                    {incomingCallType === "video" ? "Video Call" : "Audio Call"}
                  </span>
                  {incomingCaller?.facilityName && !isDoctorCaller && <span>• {incomingCaller.facilityName}</span>}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
              <button onClick={() => { setCallOpen(true); setShowCallBanner(false); }}
                style={{ padding: "8px 16px", borderRadius: 30, border: "none", background: "#10B981", color: "white", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                <PhoneCall size={14} /> Accept
              </button>
              <button onClick={() => {
                setShowCallBanner(false);
                const patientId = (session.user as any).phone || session.user.name || "patient-001";
                fetch("/api/signal", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ roomId: `consultation-${patientId}`, fromClientId: patientClientIdRef.current, type: "call-rejected" }),
                });
              }}
                style={{ padding: "8px 12px", borderRadius: 30, border: "none", background: "#EF4444", color: "white", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <X size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {callOpen && (
        <VideoCallModal
          isOpen={true}
          onClose={() => { setCallOpen(false); setShowCallBanner(false); }}
          patientName={session.user.name || "Patient"}
          patientId={(session.user as any).phone || session.user.name || "patient-001"}
          isDoctor={false}
          callerRole="patient"
          callerTitle={incomingCaller?.callerTitle}
          facilityName={incomingCaller?.facilityName}
          department={incomingCaller?.department}
          initialIncomingCallType={incomingCallType}
        />
      )}
      <style>{`
        @keyframes popIn { 
          0% { transform: scale(0.5); opacity: 0; } 
          100% { transform: scale(1); opacity: 1; } 
        }
        @keyframes ring { 0%,100% { transform: rotate(0); } 10%,30%,50%,70%,90% { transform: rotate(-10deg); } 20%,40%,60%,80% { transform: rotate(10deg); } }
      `}</style>
    </>
  );
}
