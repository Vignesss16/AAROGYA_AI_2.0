import PusherClient from "pusher-js";

let pusher: PusherClient | null = null;

export function getPusherClient(): PusherClient {
  if (!pusher && typeof window !== "undefined") {
    const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
    console.log(`[Pusher] Initializing with key: ${key?.substring(0, 5)}..., cluster: ${cluster}`);
    
    if (!key || !cluster) {
      console.error("[Pusher] Missing NEXT_PUBLIC_PUSHER_KEY or NEXT_PUBLIC_PUSHER_CLUSTER in .env.local");
      throw new Error("Pusher environment variables not set");
    }

    pusher = new PusherClient(key, {
      cluster,
    });

    pusher.connection.bind("state_change", (states: { current: string; previous: string }) => {
      console.log(`[Pusher] Connection state: ${states.previous} -> ${states.current}`);
    });

    pusher.connection.bind("connected", () => {
      console.log("[Pusher] Connected successfully");
    });

    pusher.connection.bind("error", (err: unknown) => {
      console.error("[Pusher] Connection error:", err);
    });
  }
  return pusher!;
}

export function disconnectPusher() {
  if (pusher) {
    pusher.disconnect();
    pusher = null;
  }
}
