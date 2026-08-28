"use client";
import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import { getPusherClient } from "@/lib/pusher-client";

const VideoCallModal = dynamic(() => import("@/components/VideoCallModal"), { ssr: false });

export default function GlobalCallListener() {
  const { data: session } = useSession();
  const [callOpen, setCallOpen] = useState(false);
  const [incomingCallType, setIncomingCallType] = useState<"video" | "audio" | null>(null);
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
        const mode = (msg.data as { mode?: string })?.mode as "video" | "audio" ?? "video";
        setIncomingCallType(mode);
        setShowCallBanner(true);
        setCallOpen(true);
        
        if (typeof window !== "undefined" && "Notification" in window) {
          if (Notification.permission === "granted") {
            new Notification("Incoming Call 📞", {
              body: `Doctor is calling you — ${mode} call`,
              icon: "/favicon.ico",
            });
          } else if (Notification.permission !== "denied") {
            Notification.requestPermission().then((perm) => {
              if (perm === "granted") {
                new Notification("Incoming Call 📞", {
                  body: `Doctor is calling you — ${mode} call`,
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

  return (
    <>
      {showCallBanner && !callOpen && (
        <div style={{
          position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
          zIndex: 9999, background: "#1A2332", borderRadius: 20, padding: "14px 24px",
          display: "flex", alignItems: "center", gap: 14, boxShadow: "0 8px 32px rgba(0,0,0,.4)",
          animation: "slideUp .3s ease-out",
        }}>
          <span style={{ fontSize: 28, animation: "ring 1s infinite", display: "inline-block" }}>📲</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "white" }}>Incoming {incomingCallType} call</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,.6)" }}>Doctor is calling</div>
          </div>
          <button onClick={() => { setCallOpen(true); setShowCallBanner(false); }}
            style={{ padding: "8px 16px", borderRadius: 30, border: "none", background: "#1E8449", color: "white", fontWeight: 700, cursor: "pointer" }}>
            Answer
          </button>
          <button onClick={() => setShowCallBanner(false)}
            style={{ padding: "8px 14px", borderRadius: 30, border: "none", background: "#C0392B", color: "white", fontWeight: 700, cursor: "pointer" }}>
            Dismiss
          </button>
        </div>
      )}

      {callOpen && (
        <VideoCallModal
          isOpen={true}
          onClose={() => { setCallOpen(false); setShowCallBanner(false); }}
          patientName={session.user.name || "Patient"}
          patientId={(session.user as any).phone || session.user.name || "patient-001"}
          isDoctor={false}
          initialIncomingCallType={incomingCallType}
        />
      )}
      <style>{`
        @keyframes slideUp { from { bottom: -100px; opacity: 0; } to { bottom: 24px; opacity: 1; } }
        @keyframes ring { 0%,100% { transform: rotate(0); } 10%,30%,50%,70%,90% { transform: rotate(-10deg); } 20%,40%,60%,80% { transform: rotate(10deg); } }
      `}</style>
    </>
  );
}
