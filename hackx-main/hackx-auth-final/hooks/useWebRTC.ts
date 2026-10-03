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
  downgradeToAudio: () => void;
}

const ICE_SERVERS: RTCIceServer[] = [
  { urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"] },
  { urls: "stun:stun.cloudflare.com:3478" },
  {
    urls: [
      "turn:openrelay.metered.ca:80",
      "turn:openrelay.metered.ca:443",
      "turn:openrelay.metered.ca:443?transport=tcp",
    ],
    username: "openrelayproject",
    credential: "openrelayproject",
  },
];

const POOR_RTT_MS = 350;
const CRITICAL_RTT_MS = 650;
const POOR_PACKET_LOSS = 0.06;

// Each tab gets a unique clientId so same-browser testing works correctly
function makeClientId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

async function sendSignal(
  roomId: string,
  fromClientId: string,
  type: string,
  data?: unknown,
  retries = 2
) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch("/api/signal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId, fromClientId, type, data }),
      });
      if (res.ok) return;
    } catch (err) {
      if (attempt === retries) {
        console.warn(`[WebRTC] sendSignal failed for ${type} after ${retries + 1} attempts`, err);
      } else {
        await new Promise((r) => setTimeout(r, 350 * (attempt + 1)));
      }
    }
  }
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
  const candidateBatchRef = useRef<RTCIceCandidateInit[]>([]);
  const candidateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const currentQualityRef = useRef<NetworkQuality>("good");
  const criticalCountRef = useRef<number>(0);
  const lastRestartRef = useRef<number>(0);

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
    if (candidateTimerRef.current) clearTimeout(candidateTimerRef.current);
    candidateBatchRef.current = [];
    currentQualityRef.current = "good";
    criticalCountRef.current = 0;
    
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

  // ── Adaptive Bitrate & Resolution (YouTube Auto Mode) ──
  const applyAdaptiveEncoding = useCallback(async (quality: NetworkQuality) => {
    const pc = pcRef.current;
    if (!pc) return;
    const videoSender = pc.getSenders().find((s) => s.track?.kind === "video");
    if (!videoSender) return;

    try {
      const params = videoSender.getParameters();
      if (!params.encodings || params.encodings.length === 0) {
        params.encodings = [{}];
      }

      if (quality === "good") {
        // Full Crisp HD (720p/1080p, 30fps, 2.0 Mbps)
        params.encodings[0].maxBitrate = 2000000;
        params.encodings[0].scaleResolutionDownBy = 1.0;
        params.encodings[0].maxFramerate = 30;
        params.degradationPreference = "balanced";
      } else if (quality === "poor") {
        // Scaled Down (360p-480p, 20fps, 450 kbps)
        params.encodings[0].maxBitrate = 450000;
        params.encodings[0].scaleResolutionDownBy = 2.0;
        params.encodings[0].maxFramerate = 20;
        params.degradationPreference = "maintain-framerate";
      } else if (quality === "critical") {
        // Low Bandwidth Mode (240p, 15fps, 180 kbps)
        params.encodings[0].maxBitrate = 180000;
        params.encodings[0].scaleResolutionDownBy = 3.0;
        params.encodings[0].maxFramerate = 15;
        params.degradationPreference = "maintain-framerate";
      }

      await videoSender.setParameters(params);
      console.log(`[WebRTC Auto-Resolution] Switched video encoding profile to: ${quality.toUpperCase()}`);
    } catch (err) {
      console.warn("[WebRTC Auto-Resolution] Failed to set encoding parameters:", err);
    }
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
      if (rtt > CRITICAL_RTT_MS || packetLoss > POOR_PACKET_LOSS * 3) {
        quality = "critical";
        criticalCountRef.current += 1;
      } else if (rtt > POOR_RTT_MS || packetLoss > POOR_PACKET_LOSS) {
        quality = "poor";
        criticalCountRef.current = 0;
      } else {
        quality = "good";
        criticalCountRef.current = 0;
      }

      // Auto-tune resolution & bitrate like YouTube Auto mode
      if (quality !== currentQualityRef.current) {
        currentQualityRef.current = quality;
        applyAdaptiveEncoding(quality);
      }

      setState((s) => {
        if (criticalCountRef.current >= 3 && s.callMode === "video" && hasVideoTrack) {
          handleDowngradeToAudio(false);
        }
        return { ...s, networkQuality: quality };
      });
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applyAdaptiveEncoding]);

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

  const triggerIceRestart = useCallback(async () => {
    const pc = pcRef.current;
    if (!pc || pc.connectionState === "closed") return;
    const now = Date.now();
    if (now - lastRestartRef.current < 2000) return;
    lastRestartRef.current = now;

    console.log(`[${role}] Initiating ICE restart...`);
    try {
      if (pc.signalingState === "stable") {
        const offer = await pc.createOffer({ iceRestart: true });
        await pc.setLocalDescription(offer);
        await sendSignal(roomId, clientIdRef.current, "offer", pc.localDescription);
        console.log(`[${role}] Sent ICE restart offer`);
      }
    } catch (err) {
      console.warn(`[${role}] ICE restart failed:`, err);
    }
  }, [roomId, role]);

  const requestReconnect = useCallback(async () => {
    const now = Date.now();
    if (now - lastRestartRef.current < 2000) return;
    lastRestartRef.current = now;
    console.log(`[${role}] Requesting reconnection from initiator...`);
    await sendSignal(roomId, clientIdRef.current, "need-reconnect");
  }, [roomId, role]);

  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection({
      iceServers: ICE_SERVERS,
      iceCandidatePoolSize: 10,
      bundlePolicy: "max-bundle",
      rtcpMuxPolicy: "require",
    });
    pcRef.current = pc;

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        candidateBatchRef.current.push(e.candidate.toJSON());
        if (!candidateTimerRef.current) {
          candidateTimerRef.current = setTimeout(() => {
            if (candidateBatchRef.current.length > 0) {
              sendSignal(roomId, clientIdRef.current, "ice-candidates", [...candidateBatchRef.current]);
              candidateBatchRef.current = [];
            }
            candidateTimerRef.current = null;
          }, 40);
        }
      }
    };

    pc.ontrack = (e) => setState((s) => ({ ...s, remoteStream: e.streams[0] }));

    // Auto ICE Restart when connection drops or fails on fluctuating network (e.g. Wi-Fi / Mobile switch)
    pc.oniceconnectionstatechange = () => {
      console.log(`[${role}] ICE connection state: ${pc.iceConnectionState}`);
      if (pc.iceConnectionState === "disconnected" || pc.iceConnectionState === "failed") {
        setState((s) => ({ ...s, statusMessage: "⚠️ Connection lost — reconnecting..." }));
        if (isInitiator) {
          triggerIceRestart();
        } else {
          requestReconnect();
        }
      } else if (pc.iceConnectionState === "connected" || pc.iceConnectionState === "completed") {
        setState((s) => ({ ...s, statusMessage: "" }));
      }
    };

    pc.onconnectionstatechange = () => {
      console.log(`[${role}] Peer connection state: ${pc.connectionState}`);
      if (pc.connectionState === "connected") {
        setState((s) => ({ ...s, statusMessage: "" }));
        if (!networkMonitorRef.current) {
          networkMonitorRef.current = setInterval(monitorNetwork, 3000);
        }
        if (!durationRef.current) {
          durationRef.current = setInterval(
            () => setState((s) => ({ ...s, callDuration: s.callDuration + 1 })),
            1000
          );
        }

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
        setState((s) => ({ ...s, statusMessage: "⚠️ Connection lost — reconnecting..." }));
        if (isInitiator) {
          triggerIceRestart();
        } else {
          requestReconnect();
        }
      }
    };
    return pc;
  }, [roomId, monitorNetwork, isInitiator, role, triggerIceRestart, requestReconnect]);

  // ── Pusher subscription & Network recovery ──────────────────────────────────
  useEffect(() => {
    if (!roomId) return;
    const cid = clientIdRef.current;
    const channelName = roomId;
    const pusher = getPusherClient();
    const channel = pusher.subscribe(channelName);

    console.log(`[${role}] Subscribed to ${channelName}`);

    const onSubSucceeded = () => {
      console.log(`[${role}] Successfully subscribed to ${channelName}`);
      if (!isInitiator) {
        if (localStreamRef.current && pcRef.current) {
          requestReconnect();
        } else {
          sendSignal(roomId, cid, "patient-ready");
        }
      } else {
        const currentPc = pcRef.current;
        if (currentPc?.localDescription && currentPc.signalingState === "have-local-offer") {
          sendSignal(roomId, cid, "offer", currentPc.localDescription);
        } else if (currentPc && currentPc.connectionState !== "connected" && localStreamRef.current) {
          triggerIceRestart();
        }
      }
    };

    const onSignalMsg = async (msg: { type: string; data?: unknown; fromClientId?: string }) => {
      console.log(`[${role}] Received signal:`, msg);
      const { type, data, fromClientId } = msg;
      // Ignore own messages (safety net)
      if (fromClientId === cid) return;

      const pc = pcRef.current;

      if (type === "patient-ready" && isInitiator) {
        const currentPc = pcRef.current;
        if (currentPc?.localDescription && currentPc.signalingState === "have-local-offer") {
          await sendSignal(roomId, cid, "offer", currentPc.localDescription);
        } else if (currentPc && currentPc.connectionState !== "connected" && localStreamRef.current) {
          triggerIceRestart();
        }
      } else if (type === "need-reconnect" && isInitiator) {
        console.log(`[Doctor] Received need-reconnect signal from patient`);
        triggerIceRestart();
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
        pendingOfferRef.current = data as RTCSessionDescriptionInit;
        if (pc && pc.signalingState === "stable" && localStreamRef.current) {
          try {
            console.log(`[Patient] Applying renegotiation/ICE restart offer...`);
            await pc.setRemoteDescription(new RTCSessionDescription(data as RTCSessionDescriptionInit));
            for (const c of pendingCandidatesRef.current) {
              try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch {}
            }
            pendingCandidatesRef.current = [];
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            await sendSignal(roomId, cid, "answer", answer);
            pendingOfferRef.current = null;
            console.log(`[Patient] Responded with answer`);
          } catch (err) {
            console.warn(`[Patient] Error handling offer:`, err);
          }
        }
      } else if (type === "answer" && isInitiator) {
        if (pc && pc.signalingState === "have-local-offer") {
          console.log(`[Doctor] Applying answer for offer...`);
          await pc.setRemoteDescription(new RTCSessionDescription(data as RTCSessionDescriptionInit));
          for (const c of pendingCandidatesRef.current) {
            try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch {}
          }
          pendingCandidatesRef.current = [];
        }
      } else if (type === "ice-candidates" || type === "ice-candidate") {
        const candidates: RTCIceCandidateInit[] = Array.isArray(data) ? (data as RTCIceCandidateInit[]) : [data as RTCIceCandidateInit];
        for (const c of candidates) {
          if (pc && pc.remoteDescription && pc.signalingState !== "closed") {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(c));
            } catch {
              pendingCandidatesRef.current.push(c);
            }
          } else {
            pendingCandidatesRef.current.push(c);
          }
        }
      } else if (type === "downgrade-to-audio") {
        handleDowngradeToAudio(true);
      } else if (type === "end-call") {
        cleanup();
        setState((s) => ({ ...s, callMode: "ended", statusMessage: "Call ended by other party" }));
      }
    };

    const handleOnline = () => {
      console.log(`[${role}] Online event detected — network interface changed`);
      try {
        const p = getPusherClient();
        p.disconnect();
        p.connect();
      } catch {}

      if (localStreamRef.current && pcRef.current) {
        setTimeout(() => {
          if (isInitiator) {
            triggerIceRestart();
          } else {
            requestReconnect();
          }
        }, 400);
      }
    };

    window.addEventListener("online", handleOnline);
    channel.bind("pusher:subscription_succeeded", onSubSucceeded);
    channel.bind("signal", onSignalMsg);

    return () => {
      window.removeEventListener("online", handleOnline);
      channel.unbind("pusher:subscription_succeeded", onSubSucceeded);
      channel.unbind("signal", onSignalMsg);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, role, isInitiator, triggerIceRestart, requestReconnect]);

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
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: mode === "video" ? {
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 30, max: 30 },
          facingMode: "user",
        } : false,
      });
      localStreamRef.current = stream;
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));
      setState((s) => ({ ...s, localStream: stream }));

      // Set audio bitrate and initialize with High Quality mode
      pc.getSenders().forEach((sender) => {
        if (sender.track?.kind === "audio") {
          const p = sender.getParameters();
          if (!p.encodings || p.encodings.length === 0) p.encodings = [{}];
          p.encodings[0].maxBitrate = 32000;
          try { sender.setParameters(p); } catch {}
        }
      });
      currentQualityRef.current = "good";
      criticalCountRef.current = 0;
      await applyAdaptiveEncoding("good");

      if (isInitiator) {
        // Create the offer immediately and store it as localDescription.
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

    let pc = pcRef.current;
    if (!pc) {
      pc = createPeerConnection();
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: mode === "video" ? {
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 30, max: 30 },
          facingMode: "user",
        } : false,
      });
      localStreamRef.current = stream;
      stream.getTracks().forEach((t) => pc!.addTrack(t, stream));
      setState((s) => ({ ...s, localStream: stream, callMode: mode }));

      // Set audio bitrate and initialize with High Quality mode
      pc.getSenders().forEach((sender) => {
        if (sender.track?.kind === "audio") {
          const p = sender.getParameters();
          if (!p.encodings || p.encodings.length === 0) p.encodings = [{}];
          p.encodings[0].maxBitrate = 32000;
          try { sender.setParameters(p); } catch {}
        }
      });
      currentQualityRef.current = "good";
      criticalCountRef.current = 0;
      await applyAdaptiveEncoding("good");

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
        await sendSignal(roomId, cid, "answer", pc.localDescription);
      }
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

  const downgradeToAudio = useCallback(() => {
    handleDowngradeToAudio(false);
  }, [handleDowngradeToAudio]);

  useEffect(() => () => cleanup(), [cleanup]);

  return [state, { startCall, endCall, toggleMute, toggleCamera, answerCall, rejectCall, downgradeToAudio }];
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}
