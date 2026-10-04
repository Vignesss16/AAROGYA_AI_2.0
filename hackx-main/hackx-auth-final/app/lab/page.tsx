"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LabRootPage() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("diagnostic_lab_user");
      if (stored) {
        router.replace("/lab/dashboard");
      } else {
        router.replace("/lab/login");
      }
    }
  }, [router]);

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0F172A", color: "white" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🧪</div>
        <div style={{ fontSize: 14, opacity: 0.8 }}>Redirecting to Diagnostic Lab Portal...</div>
      </div>
    </div>
  );
}
