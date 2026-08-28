"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { getPusherClient, disconnectPusher } from "@/lib/pusher-client";

export type CallMode = "video" | "audio" | "connecting" | "idle" | "ended" | "incoming";
export type NetworkQuality = "good" | "poor" | "critical";

export interface WebRTCState {
  callMode: CallMode;
  networkQuality: NetworkQuality;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMuted: boolean;
  isCameraOff: boolean;
  callDuration: number;
  statusMessage: string;
  isVideoFallback: boolean;
  incomingCallType: "video" | "audio" | null;
}

export interface WebRTCActions {
  startCall: (mode: "video" | "audio") => Promise<void>;
  endCall: () => void;
  toggleMute: () => void;
  toggleCamera: () => void;
  answerCall: (mode: "video" | "audio") => Promise<void>;
  rejectCall: () => void;
}

const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  {
    urls: "turn:openrelay.metered.ca:80",
    username: "openrelayproject",
    credential: "openrelayproject",
  },
  {
    urls: "turn:openrelay.metered.ca:443",
    username: "openrelayproject",
    credential: "openrelayproject",
  },
];

const POOR_RTT_MS = 400;
const CRITICAL_RTT_MS = 800;
const POOR_PACKET_LOSS = 0.05;

// Each tab gets a unique clientId so same-browser testing works correctly
function makeClientId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

async function sendSignal(
  roomId: string,
  fromClientId: string,
  type: string,
  data?: unknown
) {
  try {
    await fetch("/api/signal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId, fromClientId, type, data }),
    });
  } catch {}
}

export function useWebRTC(
  roomId: string,
  isInitiator: boolean
): [WebRTCState, WebRTCActions] {
  // Stable per-tab clientId
  const clientIdRef = useRef<string>(makeClientId());
  const role = isInitiator ? "doctor" : "patient";

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const networkMonitorRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const durationRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pendingOfferRef = useRef<RTCSessionDescriptionInit | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const [state, setState] = useState<WebRTCState>({
    callMode: "idle",
    networkQuality: "good",
    localStream: null,
    remoteStream: null,
    isMuted: false,
    isCameraOff: false,
    callDuration: 0,
    statusMessage: "",
    isVideoFallback: false,
    incomingCallType: null,
  });

  const cleanup = useCallback(() => {
    if (networkMonitorRef.current) clearInterval(networkMonitorRef.current);
    if (durationRef.current) clearInterval(durationRef.current);
    
    // Stop recording if active
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }

    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    pcRef.current?.close();
    pcRef.current = null;
    localStreamRef.current = null;
    pendingOfferRef.current = null;
    pendingCandidatesRef.current = [];
    setState((s) => ({
      ...s,
      localStream: null,
      remoteStream: null,
      callDuration: 0,
      networkQuality: "good",
      isVideoFallback: false,
      incomingCallType: null,
    }));
  }, []);

  const monitorNetwork = useCallback(async () => {
    const pc = pcRef.current;
    if (!pc || pc.connectionState !== "connected") return;
    try {
      const stats = await pc.getStats();
      let rtt = 0, packetLoss = 0, hasVideoTrack = false;
      stats.forEach((report: RTCStats & Record<string, unknown>) => {
        if (report.type === "candidate-pair" && report["state"] === "succeeded")
          rtt = ((report["currentRoundTripTime"] as number) ?? 0) * 1000;
        if (report.type === "outbound-rtp" && report["kind"] === "video") {
          hasVideoTrack = true;
          const lost = (report["packetsLost"] as number) || 0;
          const sent = (report["packetsSent"] as number) || 1;
          packetLoss = lost / (lost + sent);
        }
      });
      let quality: NetworkQuality = "good";
      if (rtt > CRITICAL_RTT_MS || packetLoss > POOR_PACKET_LOSS * 3) quality = "critical";
      else if (rtt > POOR_RTT_MS || packetLoss > POOR_PACKET_LOSS) quality = "poor";
      setState((s) => {
        if (quality === "critical" && s.callMode === "video" && hasVideoTrack)
          handleDowngradeToAudio(false);
        return { ...s, networkQuality: quality };
      });
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDowngradeToAudio = useCallback((fromRemote: boolean) => {
    const stream = localStreamRef.current;
    if (!stream) return;
    stream.getVideoTracks().forEach((t) => { t.stop(); stream.removeTrack(t); });
    const pc = pcRef.current;
    if (pc) pc.getSenders().forEach((s) => { if (s.track?.kind === "video") pc.removeTrack(s); });
    if (!fromRemote) sendSignal(roomId, clientIdRef.current, "downgrade-to-audio");
    setState((s) => ({
      ...s,
      callMode: "audio",
      isVideoFallback: true,
      statusMessage: fromRemote
        ? "⚠️ Network weak — switched to audio call"
        : "⚠️ Poor network — switched to audio to maintain connection",
    }));
  }, [roomId]);

  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    pcRef.current = pc;

    pc.onicecandidate = (e) => {
      if (e.candidate)
        sendSignal(roomId, clientIdRef.current, "ice-candidate", e.candidate.toJSON());
    };
    pc.ontrack = (e) => setState((s) => ({ ...s, remoteStream: e.streams[0] }));
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "connected") {
        setState((s) => ({ ...s, statusMessage: "" }));
        networkMonitorRef.current = setInterval(monitorNetwork, 3000);
        durationRef.current = setInterval(
          () => setState((s) => ({ ...s, callDuration: s.callDuration + 1 })),
          1000
        );

        // Start recording if initiator (doctor)
        if (isInitiator && localStreamRef.current && !mediaRecorderRef.current) {
          const audioTrack = localStreamRef.current.getAudioTracks()[0];
          if (audioTrack) {
            try {
              const recorder = new MediaRecorder(new MediaStream([audioTrack]), { mimeType: "audio/webm;codecs=opus" });
              recorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data);
              };
              recorder.onstop = async () => {
                const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
                audioChunksRef.current = [];
                mediaRecorderRef.current = null;
                
                // Upload blob to backend
                const formData = new FormData();
                formData.append("audio", blob, "consultation.webm");
                formData.append("roomId", roomId);

                try {
                  await fetch("/api/consultations/summary", {
                    method: "POST",
                    body: formData,
                  });
                } catch (err) {
                  console.error("Failed to upload summary audio", err);
                }
              };
              recorder.start(1000);
              mediaRecorderRef.current = recorder;
            } catch (err) {
              console.warn("MediaRecorder init failed:", err);
            }
          }
        }
      } else if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
        setState((s) => ({ ...s, statusMessage: "⚠️ Connection lost — trying to reconnect..." }));
      }
    };
    return pc;
  }, [roomId, monitorNetwork, isInitiator]);

  // ── Pusher subscription ────────────────────────────────────────────────────
  useEffect(() => {
    if (!roomId) return;
    const cid = clientIdRef.current;
    const channelName = roomId;
    const pusher = getPusherClient();
    const channel = pusher.subscribe(channelName);

    console.log(`[${role}] Subscribed to ${channelName}`);

    channel.bind("pusher:subscription_succeeded", () => {
      console.log(`[${role}] Successfully subscribed to ${channelName}`);
      if (!isInitiator) {
        sendSignal(roomId, cid, "patient-ready");
      } else {
        const currentPc = pcRef.current;
        if (currentPc?.localDescription && currentPc.signalingState === "have-local-offer") {
          sendSignal(roomId, cid, "offer", currentPc.localDescription);
        }
      }
    });

    channel.bind("signal", async (msg: { type: string; data?: unknown; fromClientId?: string }) => {
      console.log(`[${role}] Received signal:`, msg);
      const { type, data, fromClientId } = msg;
      // Ignore own messages (safety net)
      if (fromClientId === cid) return;

      const pc = pcRef.current;

      if (type === "patient-ready" && isInitiator) {
        // Patient's hook just (re-)connected. Re-send our offer only if
        // the exchange is not yet complete (still waiting for answer).
        const currentPc = pcRef.current;
        if (currentPc?.localDescription && currentPc.signalingState === "have-local-offer") {
          await sendSignal(roomId, cid, "offer", currentPc.localDescription);
        }
      } else if (type === "call-invite") {
        const callType = (data as { mode: string }).mode as "video" | "audio";
        setState((s) => ({
          ...s,
          callMode: "incoming",
          incomingCallType: callType,
          statusMessage: "Incoming call from Doctor...",
        }));
      } else if (type === "call-rejected") {
        cleanup();
        setState((s) => ({ ...s, callMode: "ended", statusMessage: "Call was declined" }));
      } else if (type === "offer" && !isInitiator) {
        // Store offer for answerCall() to consume.
        // If PC already exists and hasn't been through an exchange yet
        // (stable + no remoteDescription = fresh PC), apply immediately.
        // Ignore re-delivered offers after exchange is complete (stable + remoteDescription set).
        pendingOfferRef.current = data as RTCSessionDescriptionInit;
        if (pc && pc.signalingState === "stable" && !pc.remoteDescription) {
          // PC created before offer arrived — apply offer immediately
          await pc.setRemoteDescription(new RTCSessionDescription(data as RTCSessionDescriptionInit));
          for (const c of pendingCandidatesRef.current) {
            try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch {}
          }
          pendingCandidatesRef.current = [];
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          await sendSignal(roomId, cid, "answer", answer);
          pendingOfferRef.current = null; // consumed
        }
        // else: no PC yet → answerCall() will consume pendingOfferRef
        // else: exchange already complete → ignore duplicate offer
      } else if (type === "answer" && isInitiator) {
        // Only apply answer if we're waiting for one (have-local-offer)
        // Ignore duplicate answers that arrive after exchange is complete
        if (pc && pc.signalingState === "have-local-offer") {
          await pc.setRemoteDescription(new RTCSessionDescription(data as RTCSessionDescriptionInit));
          for (const c of pendingCandidatesRef.current) {
            try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch {}
          }
          pendingCandidatesRef.current = [];
        }
      } else if (type === "ice-candidate") {
        if (pc && pc.remoteDescription) {
          try { await pc.addIceCandidate(new RTCIceCandidate(data as RTCIceCandidateInit)); } catch {}
        } else {
          pendingCandidatesRef.current.push(data as RTCIceCandidateInit);
        }
      } else if (type === "downgrade-to-audio") {
        handleDowngradeToAudio(true);
      } else if (type === "end-call") {
        cleanup();
        setState((s) => ({ ...s, callMode: "ended", statusMessage: "Call ended by other party" }));
      }
    });

    // Removed the setTimeout patient-ready signal; it is now strictly sent in pusher:subscription_succeeded

    return () => {
      pusher.unsubscribe(channelName);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, role]);

  const startCall = useCallback(async (mode: "video" | "audio") => {
    const cid = clientIdRef.current;
    console.log(`[Doctor] Starting call to room: ${roomId}, mode: ${mode}`);
    setState((s) => ({ ...s, callMode: "connecting", statusMessage: "Calling..." }));

    // Send call-invite first so the patient opens the modal & joins the Pusher channel
    const inviteResult = await sendSignal(roomId, cid, "call-invite", { mode });
    console.log(`[Doctor] Sent call-invite`);

    const pc = createPeerConnection();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: mode === "video" ? { width: 640, height: 480, frameRate: 24 } : false,
      });
      localStreamRef.current = stream;
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));
      setState((s) => ({ ...s, localStream: stream }));

      if (isInitiator) {
        // Create the offer immediately and store it as localDescription.
        // Wait a bit for patient to subscribe, then send the offer.
        // The patient will send "patient-ready" when they successfully connect to Pusher,
        // which triggers a re-send if they missed this initial offer.
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await sendSignal(roomId, cid, "offer", offer);
      }
      setState((s) => ({ ...s, callMode: mode, statusMessage: "Ringing..." }));
    } catch {
      setState((s) => ({ ...s, callMode: "idle", statusMessage: "Could not access camera/microphone" }));
    }
  }, [isInitiator, roomId, createPeerConnection]);

  const answerCall = useCallback(async (mode: "video" | "audio") => {
    const cid = clientIdRef.current;
    setState((s) => ({ ...s, callMode: "connecting", statusMessage: "Connecting..." }));

    // If the SSE handler already created a PC and applied the offer (Bug 3 fix),
    // reuse it. Otherwise create a new one.
    let pc = pcRef.current;
    if (!pc) {
      pc = createPeerConnection();
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: mode === "video" ? { width: 640, height: 480, frameRate: 24 } : false,
      });
      localStreamRef.current = stream;
      stream.getTracks().forEach((t) => pc!.addTrack(t, stream));
      setState((s) => ({ ...s, localStream: stream, callMode: mode }));

      if (pendingOfferRef.current) {
        // Offer not yet applied — apply it now
        await pc.setRemoteDescription(new RTCSessionDescription(pendingOfferRef.current));
        for (const c of pendingCandidatesRef.current) {
          try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch {}
        }
        pendingCandidatesRef.current = [];
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        await sendSignal(roomId, cid, "answer", answer);
        pendingOfferRef.current = null;
      } else if (pc.localDescription && pc.signalingState !== "stable") {
        // Offer was already applied & answered by SSE handler but exchange
        // not yet complete — re-send answer in case doctor missed it.
        // Do NOT re-send if already stable (exchange complete) — would cause
        // InvalidStateError on doctor's setRemoteDescription.
        await sendSignal(roomId, cid, "answer", pc.localDescription);
      }
      // else: offer hasn't arrived yet — it will be handled by SSE onmessage
    } catch {
      setState((s) => ({ ...s, callMode: "idle", statusMessage: "Could not access camera/microphone" }));
    }
  }, [roomId, createPeerConnection]);

  const rejectCall = useCallback(() => {
    sendSignal(roomId, clientIdRef.current, "call-rejected");
    cleanup();
    setState((s) => ({ ...s, callMode: "idle", statusMessage: "" }));
  }, [roomId, cleanup]);

  const endCall = useCallback(() => {
    sendSignal(roomId, clientIdRef.current, "end-call");
    cleanup();
    setState((s) => ({ ...s, callMode: "ended", statusMessage: "Call ended" }));
  }, [roomId, cleanup]);

  const toggleMute = useCallback(() => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (track) { track.enabled = !track.enabled; setState((s) => ({ ...s, isMuted: !track.enabled })); }
  }, []);

  const toggleCamera = useCallback(() => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (track) { track.enabled = !track.enabled; setState((s) => ({ ...s, isCameraOff: !track.enabled })); }
  }, []);

  useEffect(() => () => cleanup(), [cleanup]);

  return [state, { startCall, endCall, toggleMute, toggleCamera, answerCall, rejectCall }];
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}
