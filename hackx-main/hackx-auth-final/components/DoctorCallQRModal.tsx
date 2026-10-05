"use client";
import { useState } from "react";
import { QrCode, Phone, Copy, Check, X, Contact, PhoneCall } from "lucide-react";

interface DoctorCallQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  doctor: {
    name: string;
    phone?: string;
    dept?: string;
    specialization?: string;
    hospital?: string;
    role?: string;
  } | null;
}

export default function DoctorCallQRModal({
  isOpen,
  onClose,
  doctor,
}: DoctorCallQRModalProps) {
  const [copied, setCopied] = useState(false);
  const [qrType, setQrType] = useState<"tel" | "vcard">("tel");

  if (!isOpen || !doctor) return null;

  const isAshaOrStaff = doctor.role?.toLowerCase().includes("asha") || doctor.role?.toLowerCase().includes("community") || doctor.role?.toLowerCase().includes("nurse") || (!doctor.name.toLowerCase().startsWith("dr.") && !doctor.role?.toLowerCase().includes("doctor") && !doctor.role?.toLowerCase().includes("physician") && !doctor.role?.toLowerCase().includes("surgeon"));

  const cleanName = isAshaOrStaff
    ? doctor.name
    : (doctor.name.toLowerCase().startsWith("dr.") ? doctor.name : `Dr. ${doctor.name.replace(/^(Dr\.?\s*)/i, "").trim()}`);

  const phone = doctor.phone || "+91 98765 01002";
  const hospital = doctor.hospital || "AarogyaAI Medical Command Center";
  const specialty = doctor.dept || doctor.specialization || doctor.role || (isAshaOrStaff ? "ASHA Field Lead" : "Medical Specialist");

  const vCardData = `BEGIN:VCARD
VERSION:3.0
FN:${cleanName}
ORG:${hospital}
TITLE:${specialty}
TEL;TYPE=CELL:${phone}
NOTE:AarogyaAI ${isAshaOrStaff ? "ASHA Field Worker & Health Roster" : "On-Duty Hospital Clinician"}
END:VCARD`;

  const rawData = qrType === "tel" ? `tel:${phone}` : vCardData;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=10&data=${encodeURIComponent(rawData)}`;

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(phone);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 999999,
      background: "rgba(10, 15, 26, 0.82)",
      backdropFilter: "blur(8px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 16,
      animation: "fadeIn .2s ease-out",
    }}>
      <div style={{
        background: "linear-gradient(145deg, #0F172A, #1E293B)",
        borderRadius: 24,
        border: "1px solid rgba(255,255,255,0.14)",
        boxShadow: "0 25px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(56, 189, 248, 0.2)",
        width: "100%",
        maxWidth: 380,
        overflow: "hidden",
        animation: "popIn .25s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
      }}>
        {/* Header */}
        <div style={{
          padding: "16px 20px",
          background: "rgba(0,0,0,0.3)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: isAshaOrStaff ? "rgba(245, 158, 11, 0.18)" : "rgba(56, 189, 248, 0.15)",
              border: isAshaOrStaff ? "1px solid rgba(245, 158, 11, 0.4)" : "1px solid rgba(56, 189, 248, 0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: isAshaOrStaff ? "#F59E0B" : "#38BDF8"
            }}>
              <QrCode size={20} />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "white" }}>
                {isAshaOrStaff ? "Scan to Call ASHA / Staff" : "Scan to Call Doctor"}
              </div>
              <div style={{ fontSize: 11, color: "#94A3B8" }}>Instant phone connect for receptionists</div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.1)",
              border: "none",
              borderRadius: 8,
              width: 30,
              height: 30,
              color: "white",
              fontSize: 14,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
            <X size={16} />
          </button>
        </div>

        {/* Doctor / Staff Info Card */}
        <div style={{ padding: "20px", textAlign: "center" }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: "#F8FAFC" }}>{cleanName}</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: isAshaOrStaff ? "#FBBF24" : "#38BDF8", marginTop: 2 }}>{specialty}</div>
          <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>{hospital}</div>

          {/* QR Code Type Selector */}
          <div style={{
            display: "inline-flex",
            background: "rgba(15, 23, 42, 0.7)",
            padding: 3,
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.1)",
            margin: "14px 0 16px",
          }}>
            <button
              onClick={() => setQrType("tel")}
              style={{
                padding: "6px 12px",
                borderRadius: 9,
                border: "none",
                background: qrType === "tel" ? "#0284C7" : "transparent",
                color: "white",
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
              }}>
              <Phone size={13} /> Direct Call QR
            </button>
            <button
              onClick={() => setQrType("vcard")}
              style={{
                padding: "6px 12px",
                borderRadius: 9,
                border: "none",
                background: qrType === "vcard" ? "#0284C7" : "transparent",
                color: "white",
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
              }}>
              <Contact size={13} /> Save Contact QR
            </button>
          </div>

          {/* QR Code Container */}
          <div style={{
            background: "white",
            padding: 14,
            borderRadius: 18,
            display: "inline-block",
            boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
            border: "4px solid rgba(56, 189, 248, 0.4)",
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrUrl}
              alt={`Scan to Call ${cleanName}`}
              style={{ width: 190, height: 190, display: "block", borderRadius: 6 }}
            />
          </div>

          <div style={{ fontSize: 12, color: "#CBD5E1", marginTop: 14 }}>
            Direct Phone: <strong style={{ color: "#38BDF8", letterSpacing: "0.5px" }}>{phone}</strong>
          </div>

          <div style={{ fontSize: 11, color: "#64748B", marginTop: 4 }}>
            Point any mobile camera at this QR code to instantly dial or add contact.
          </div>

          {/* Action Buttons */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 18 }}>
            <button
              onClick={handleCopyPhone}
              style={{
                padding: "10px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.15)",
                background: "rgba(255,255,255,0.06)",
                color: copied ? "#4ADE80" : "#F8FAFC",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}>
              {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? "Copied!" : "Copy Phone"}
            </button>

            <a
              href={`tel:${phone}`}
              style={{
                padding: "10px",
                borderRadius: 12,
                border: "none",
                background: "linear-gradient(135deg, #10B981, #047857)",
                color: "white",
                fontSize: 12,
                fontWeight: 800,
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                boxShadow: "0 4px 12px rgba(16, 185, 129, 0.4)",
              }}>
              <PhoneCall size={14} /> Call Now
            </a>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes popIn { 0% { transform: scale(0.9); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
      `}</style>
    </div>
  );
}
