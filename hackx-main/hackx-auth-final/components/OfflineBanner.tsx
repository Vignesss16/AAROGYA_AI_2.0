"use client";
import { useEffect, useState } from "react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { syncAllOfflineData, flushSyncQueue, getDB } from "@/lib/db-offline";

export default function OfflineBanner() {
  const { isOnline, justCameOnline } = useOnlineStatus();
  const [visible, setVisible] = useState(false);
  const [queueCount, setQueueCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [syncedCount, setSyncedCount] = useState(0);

  // Check sync queue and run batch sync when coming back online
  useEffect(() => {
    if (justCameOnline && typeof window !== "undefined") {
      setSyncing(true);
      syncAllOfflineData()
        .then((result) => {
          setSyncedCount(result.synced);
          // Update queue count after sync
          if (typeof window !== "undefined") {
            getDB().syncQueue.count().then(setQueueCount);
          }
        })
        .finally(() => {
          setSyncing(false);
        });
    }
  }, [justCameOnline]);

  // Update queue count when offline
  useEffect(() => {
    if (!isOnline && typeof window !== "undefined") {
      getDB().syncQueue.count().then(setQueueCount);
    }
  }, [isOnline]);

  // Show banner briefly when coming back online
  useEffect(() => {
    if (justCameOnline) {
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [justCameOnline]);

  // Show banner persistently when offline
  useEffect(() => {
    setVisible(!isOnline);
  }, [isOnline]);

  if (!visible) return null;

  // Online banner (temporary)
  if (isOnline && justCameOnline) {
    return (
      <div
        style={{
          background: "linear-gradient(135deg, #1E8449, #27AE60)",
          padding: "10px 16px",
          fontSize: 13,
          fontWeight: 700,
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          animation: "slideDown 0.3s ease-out",
        }}
      >
        <span style={{ fontSize: 16 }}>✅</span>
        <span>
          {syncing
            ? "Back online! Syncing your data..."
            : syncedCount > 0
            ? `Back online! ${syncedCount} item(s) synced successfully!`
            : queueCount > 0
            ? `Back online! ${queueCount} item(s) synced!`
            : "Back online! All data is up to date!"}
        </span>
        <style>{`@keyframes slideDown { from { transform: translateY(-100%); } to { transform: translateY(0); } }`}</style>
      </div>
    );
  }

  // Offline banner (persistent)
  return (
    <div
      style={{
        background: "linear-gradient(135deg, #C0392B, #E74C3C)",
        padding: "10px 16px",
        fontSize: 13,
        fontWeight: 700,
        color: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        animation: "slideDown 0.3s ease-out",
      }}
    >
      <span style={{ fontSize: 16 }}>⚠️</span>
      <span>
        You&apos;re offline — {queueCount > 0 ? `${queueCount} item(s) will sync when online` : "Some features limited"}
      </span>
      <style>{`@keyframes slideDown { from { transform: translateY(-100%); } to { transform: translateY(0); } }`}</style>
    </div>
  );
}
