"use client";
import { useEffect, useState } from "react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { syncAllOfflineData, seedOfflineData } from "@/lib/db-offline";

export default function OfflineBanner() {
  const { isOnline, justCameOnline } = useOnlineStatus();
  const [syncToast, setSyncToast] = useState<string | null>(null);

  // Auto-seed offline data on boot
  useEffect(() => {
    if (typeof window !== "undefined") {
      seedOfflineData().catch(console.error);
    }
  }, []);

  // WhatsApp-like silent background sync when connection restores
  useEffect(() => {
    if (justCameOnline && typeof window !== "undefined") {
      syncAllOfflineData()
        .then((result) => {
          if (result && result.synced > 0) {
            setSyncToast(`✓ ${result.synced} item${result.synced > 1 ? "s" : ""} synced to cloud`);
            const timer = setTimeout(() => setSyncToast(null), 3000);
            return () => clearTimeout(timer);
          }
        })
        .catch(console.error);
    }
  }, [justCameOnline]);

  // When offline or idle, show nothing (WhatsApp-like calm experience)
  if (!syncToast) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        left: "50%",
        transform: "translateX(-50%)",
        background: "rgba(26, 35, 50, 0.95)",
        backdropFilter: "blur(12px)",
        color: "#2ECC71",
        padding: "10px 20px",
        borderRadius: 24,
        fontSize: 13,
        fontWeight: 700,
        boxShadow: "0 8px 30px rgba(0,0,0,0.35)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        gap: 8,
        animation: "toastFade 0.3s ease-out",
        border: "1px solid rgba(46, 204, 113, 0.3)",
      }}
    >
      <span>{syncToast}</span>
      <style>{`
        @keyframes toastFade {
          from { opacity: 0; transform: translate(-50%, 15px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
      `}</style>
    </div>
  );
}
