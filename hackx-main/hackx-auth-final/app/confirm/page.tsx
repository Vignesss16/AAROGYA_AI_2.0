// "use client";
// import { useRouter } from "next/navigation";
// import { useEffect, useState } from "react";
// import type { TriageResult } from "@/lib/triage";

// const C = { primary: "#1B6CA8", primaryDark: "#0F4C7A", green: "#1E8449", greenLight: "#27AE60", red: "#C0392B", yellow: "#F39C12", bg: "#F0F4F8", card: "#FFFFFF", text: "#1A2332", muted: "#6B7C93", border: "#DDE3EC" };

// export default function ConfirmPage() {
//   const router = useRouter();
//   const lang = typeof window !== "undefined" ? localStorage.getItem("lang") || "hi" : "hi";
//   const t = (hi: string, en: string) => lang === "hi" ? hi : en;
//   const [result, setResult] = useState<TriageResult | null>(null);

//   useEffect(() => {
//     const saved = localStorage.getItem("triageResult");
//     if (saved) setResult(JSON.parse(saved));
//   }, []);

//   const urgColor = result ? { RED: C.red, YELLOW: C.yellow, GREEN: C.green }[result.urgency] : C.green;

//   return (
//     <div style={{ background: "#0d1520", minHeight: "100vh", display: "flex", justifyContent: "center" }}>
//       <div style={{ width: 390, background: `linear-gradient(160deg,#EBF4FD,${C.bg})`, minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "40px 20px" }}>
//         <div style={{ width: 96, height: 96, background: `linear-gradient(135deg,${C.greenLight},${C.green})`, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 46, marginBottom: 22, boxShadow: `0 8px 32px rgba(30,132,73,.35)`, animation: "popin .5s cubic-bezier(.175,.885,.32,1.275)" }}>✓</div>
//         <div style={{ fontSize: 22, fontWeight: 800, color: C.text, textAlign: "center" }}>{t("अपॉइंटमेंट बुक हो गई!", "Appointment Booked!")}</div>
//         <div style={{ fontSize: 13, color: C.muted, textAlign: "center", marginTop: 6, lineHeight: 1.5 }}>{t("आपकी अपॉइंटमेंट सफलतापूर्वक बुक हुई", "Your appointment has been booked successfully")}</div>
//         <div style={{ background: C.card, borderRadius: 16, padding: 16, border: `1px solid ${C.border}`, width: "100%", margin: "18px 0" }}>
//           {[
//             { lbl: t("📋 Queue No.", "📋 Queue No."), val: "#Q-007" },
//             { lbl: t("⏱️ प्रतीक्षा समय", "⏱️ Wait Time"), val: t("लगभग 20 मिनट", "~20 minutes") },
//             { lbl: t("🏥 डॉक्टर", "🏥 Doctor"), val: "Dr. Arvind Kumar" },
//             { lbl: t("🔴 ज़रूरी", "🔴 Urgency"), val: result?.urgency === "RED" ? t("RED — उच्च प्राथमिकता", "RED — High Priority") : result?.urgency === "YELLOW" ? "YELLOW — Moderate" : "GREEN — Normal", color: urgColor },
//           ].map((row, i) => (
//             <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: i < 3 ? `1px solid ${C.border}` : "none" }}>
//               <span style={{ fontSize: 12, color: C.muted }}>{row.lbl}</span>
//               <span style={{ fontSize: 14, fontWeight: 700, color: row.color || C.text }}>{row.val}</span>
//             </div>
//           ))}
//         </div>
//         <div style={{ background: "#FEF9E7", borderRadius: 12, padding: 11, display: "flex", gap: 8, marginBottom: 18, width: "100%", border: "1px solid #F4D03F" }}>
//           <span>⚡</span>
//           <p style={{ fontSize: 13, color: "#7D6608", lineHeight: 1.5 }}>{t("जब इंटरनेट आएगा, डॉक्टर को सूचना मिलेगी", "When internet returns, doctor will be notified automatically")}</p>
//         </div>
//         <button onClick={() => router.push("/home")} style={{ width: "100%", padding: "16px", borderRadius: 14, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 16, background: `linear-gradient(135deg,${C.primary},${C.primaryDark})`, color: "white" }}>
//           🏠 {t("घर जाएं", "Go Home")}
//         </button>
//         <style>{`@keyframes popin{from{transform:scale(0);opacity:0}to{transform:scale(1);opacity:1}}`}</style>
//       </div>
//     </div>
//   );
// }




//---------------------new confirm page---------------------///


// "use client";
// import { useRouter } from "next/navigation";
// import { useEffect, useState } from "react";
// import type { TriageResult } from "@/lib/triage";

// const C = { primary: "#1B6CA8", primaryDark: "#0F4C7A", green: "#1E8449", greenLight: "#27AE60", red: "#C0392B", yellow: "#F39C12", bg: "#F0F4F8", card: "#FFFFFF", text: "#1A2332", muted: "#6B7C93", border: "#DDE3EC" };

// const DOCTORS = [
//   { id: "D1", name: "Dr. Arvind Kumar", spec: t => t("जनरल फिजिशियन", "General Physician"), hospital: "Nabha Civil Hospital", dist: "2.1 km", slots: ["9:00 AM", "9:30 AM", "10:30 AM", "11:00 AM", "2:00 PM", "3:30 PM"], fee: "₹0 (Govt)" },
//   { id: "D2", name: "Dr. Sunita Sharma", spec: t => t("बाल रोग विशेषज्ञ", "Pediatrician"), hospital: "PHC Kesri", dist: "0.8 km", slots: ["9:30 AM", "11:00 AM", "3:00 PM", "4:00 PM"], fee: "₹0 (Govt)" },
//   { id: "D3", name: "Dr. Ravi Patel", spec: t => t("हृदय रोग विशेषज्ञ", "Cardiologist"), hospital: "District Hospital", dist: "5.2 km", slots: ["10:00 AM", "11:30 AM", "4:30 PM"], fee: "₹200" },
// ];

// function t(lang: string, hi: string, en: string) { return lang === "hi" ? hi : en; }

// export default function ConfirmPage() {
//   const router = useRouter();
//   const [lang, setLang] = useState("hi");
//   const [result, setResult] = useState<TriageResult | null>(null);
//   const [patient, setPatient] = useState<{ name: string; phone: string } | null>(null);
//   const [step, setStep] = useState<"select-doctor" | "select-slot" | "booked">("select-doctor");
//   const [selectedDoctor, setSelectedDoctor] = useState<typeof DOCTORS[0] | null>(null);
//   const [selectedSlot, setSelectedSlot] = useState("");
//   const [queueNo, setQueueNo] = useState("");
//   const [loading, setLoading] = useState(false);

//   useEffect(() => {
//     setLang(localStorage.getItem("lang") || "hi");
//     const r = localStorage.getItem("triageResult"); if (r) setResult(JSON.parse(r));
//     const p = localStorage.getItem("patient"); if (p) setPatient(JSON.parse(p));
//   }, []);

//   const urg = result?.urgency || "GREEN";
//   const urgColor = { RED: C.red, YELLOW: C.yellow, GREEN: C.green }[urg];

//   const bookAppointment = async () => {
//     if (!selectedDoctor || !selectedSlot) return;
//     setLoading(true);
//     const qn = `Q-${Math.floor(Math.random() * 90 + 10)}`;
//     setQueueNo(qn);
//     try {
//       await fetch("/api/consultations", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ patientPhone: patient?.phone, patientName: patient?.name, doctorId: selectedDoctor.id, doctorName: selectedDoctor.name, slot: selectedSlot, urgency: urg, queueNo: qn, triageResult: result }),
//       });
//     } catch { /* save offline */ }
//     setLoading(false);
//     setStep("booked");
//   };

//   const T = (hi: string, en: string) => t(lang, hi, en);

//   // ── DOCTOR SELECTION ──
//   if (step === "select-doctor") return (
//     <div style={{ background: "#0d1520", minHeight: "100vh", display: "flex", justifyContent: "center" }}>
//       <div style={{ width: 390, background: C.bg, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
//         <div style={{ background: `linear-gradient(135deg,${C.primary},${C.primaryDark})`, padding: "44px 16px 20px" }}>
//           <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
//             <button onClick={() => router.back()} style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,.2)", border: "none", color: "white", fontSize: 18, cursor: "pointer" }}>←</button>
//             <div>
//               <div style={{ fontSize: 15, fontWeight: 800, color: "white" }}>{T("डॉक्टर चुनें", "Choose Doctor")}</div>
//               <div style={{ fontSize: 11, color: "rgba(255,255,255,.65)" }}>{T("उपलब्ध डॉक्टर और स्लॉट", "Available doctors & slots")}</div>
//             </div>
//           </div>
//           {urg !== "GREEN" && (
//             <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 12, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8 }}>
//               <span>{urg === "RED" ? "🔴" : "🟡"}</span>
//               <span style={{ fontSize: 13, fontWeight: 700, color: "white" }}>{urg === "RED" ? T("उच्च प्राथमिकता — जल्दी दिखाएं", "High Priority — See doctor soon") : T("मध्यम प्राथमिकता", "Moderate Priority")}</span>
//             </div>
//           )}
//         </div>
//         <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px 24px" }}>
//           <p style={{ fontSize: 12, color: C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12 }}>{T("पास के डॉक्टर", "Nearby Doctors")}</p>
//           {DOCTORS.map(doc => (
//             <div key={doc.id} onClick={() => { setSelectedDoctor(doc); setStep("select-slot"); }}
//               style={{ background: C.card, borderRadius: 16, padding: 16, marginBottom: 12, border: `1px solid ${C.border}`, cursor: "pointer", transition: "all .2s" }}>
//               <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
//                 <div style={{ width: 48, height: 48, borderRadius: 14, background: "#EBF4FD", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>👨‍⚕️</div>
//                 <div style={{ flex: 1 }}>
//                   <div style={{ fontSize: 15, fontWeight: 800, color: C.text }}>{doc.name}</div>
//                   <div style={{ fontSize: 12, color: C.primary, fontWeight: 600, marginTop: 2 }}>{doc.spec(T)}</div>
//                   <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>🏥 {doc.hospital} · 📍 {doc.dist}</div>
//                 </div>
//                 <div style={{ textAlign: "right" }}>
//                   <div style={{ fontSize: 13, fontWeight: 800, color: C.green }}>{doc.fee}</div>
//                   <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>{doc.slots.length} {T("स्लॉट", "slots")}</div>
//                 </div>
//               </div>
//               <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
//                 {doc.slots.slice(0, 4).map(s => (
//                   <span key={s} style={{ background: "#E8F8EF", color: C.green, borderRadius: 8, padding: "4px 10px", fontSize: 11, fontWeight: 700 }}>🕐 {s}</span>
//                 ))}
//                 {doc.slots.length > 4 && <span style={{ background: C.bg, color: C.muted, borderRadius: 8, padding: "4px 10px", fontSize: 11 }}>+{doc.slots.length - 4} {T("और", "more")}</span>}
//               </div>
//               <div style={{ marginTop: 10, textAlign: "right" }}>
//                 <span style={{ fontSize: 13, fontWeight: 700, color: C.primary }}>{T("स्लॉट बुक करें", "Book Slot")} →</span>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );

//   // ── SLOT SELECTION ──
//   if (step === "select-slot" && selectedDoctor) return (
//     <div style={{ background: "#0d1520", minHeight: "100vh", display: "flex", justifyContent: "center" }}>
//       <div style={{ width: 390, background: C.bg, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
//         <div style={{ background: `linear-gradient(135deg,${C.primary},${C.primaryDark})`, padding: "44px 16px 20px" }}>
//           <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
//             <button onClick={() => setStep("select-doctor")} style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,.2)", border: "none", color: "white", fontSize: 18, cursor: "pointer" }}>←</button>
//             <div>
//               <div style={{ fontSize: 15, fontWeight: 800, color: "white" }}>{selectedDoctor.name}</div>
//               <div style={{ fontSize: 11, color: "rgba(255,255,255,.65)" }}>{selectedDoctor.hospital}</div>
//             </div>
//           </div>
//         </div>
//         <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 100px" }}>
//           {/* Doctor card */}
//           <div style={{ background: C.card, borderRadius: 14, padding: 14, marginBottom: 16, border: `1px solid ${C.border}`, display: "flex", gap: 12 }}>
//             <div style={{ width: 44, height: 44, borderRadius: 12, background: "#EBF4FD", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>👨‍⚕️</div>
//             <div>
//               <div style={{ fontSize: 14, fontWeight: 800 }}>{selectedDoctor.name}</div>
//               <div style={{ fontSize: 12, color: C.primary, fontWeight: 600 }}>{selectedDoctor.spec(T)}</div>
//               <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>📍 {selectedDoctor.dist} · {selectedDoctor.fee}</div>
//             </div>
//           </div>
//           <p style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>{T("समय चुनें", "Select Time Slot")}</p>
//           <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 20 }}>
//             {selectedDoctor.slots.map(slot => (
//               <button key={slot} onClick={() => setSelectedSlot(slot)}
//                 style={{ padding: "12px 8px", borderRadius: 12, border: `2px solid ${selectedSlot === slot ? C.primary : C.border}`, background: selectedSlot === slot ? "#EBF4FD" : C.card, cursor: "pointer", fontSize: 13, fontWeight: 700, color: selectedSlot === slot ? C.primary : C.text, transition: "all .2s" }}>
//                 🕐 {slot}
//               </button>
//             ))}
//           </div>
//           {/* Patient summary */}
//           {patient && (
//             <div style={{ background: "#EBF4FD", borderRadius: 12, padding: 12, marginBottom: 16, border: "1px solid #AED6F1" }}>
//               <p style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", marginBottom: 6 }}>👤 {T("मरीज़", "Patient")}</p>
//               <p style={{ fontSize: 14, fontWeight: 700, color: C.text, margin: 0 }}>{patient.name}</p>
//               <p style={{ fontSize: 12, color: C.muted, margin: "2px 0 0" }}>📱 {patient.phone} · {urg === "RED" ? "🔴 RED" : urg === "YELLOW" ? "🟡 YELLOW" : "🟢 GREEN"}</p>
//             </div>
//           )}
//         </div>
//         <div style={{ position: "fixed", bottom: 0, width: 390, background: C.card, borderTop: `2px solid ${C.border}`, padding: "12px 16px", zIndex: 50 }}>
//           <button onClick={bookAppointment} disabled={!selectedSlot || loading}
//             style={{ width: "100%", padding: 16, borderRadius: 14, border: "none", cursor: selectedSlot ? "pointer" : "not-allowed", fontWeight: 700, fontSize: 16, background: selectedSlot ? `linear-gradient(135deg,${C.primary},${C.primaryDark})` : C.border, color: "white", transition: "all .2s" }}>
//             {loading ? "..." : selectedSlot ? `✓ ${T("बुक करें", "Confirm Booking")} — ${selectedSlot}` : T("पहले समय चुनें", "Select a time slot first")}
//           </button>
//         </div>
//       </div>
//     </div>
//   );

//   // ── BOOKED CONFIRMATION ──
//   return (
//     <div style={{ background: "#0d1520", minHeight: "100vh", display: "flex", justifyContent: "center" }}>
//       <div style={{ width: 390, background: `linear-gradient(160deg,#EBF4FD,${C.bg})`, minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "40px 20px" }}>
//         <div style={{ width: 96, height: 96, background: `linear-gradient(135deg,${C.greenLight},${C.green})`, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 46, marginBottom: 22, boxShadow: "0 8px 32px rgba(30,132,73,.35)", animation: "popin .5s cubic-bezier(.175,.885,.32,1.275)" }}>✓</div>
//         <div style={{ fontSize: 22, fontWeight: 800, color: C.text, textAlign: "center" }}>{T("अपॉइंटमेंट बुक हो गई!", "Appointment Booked!")}</div>
//         <div style={{ fontSize: 13, color: C.muted, textAlign: "center", marginTop: 6 }}>{T("सफलतापूर्वक बुक हुई", "Successfully confirmed")}</div>
//         <div style={{ background: C.card, borderRadius: 16, padding: 16, border: `1px solid ${C.border}`, width: "100%", margin: "20px 0" }}>
//           {[
//             { lbl: T("📋 Queue No.", "📋 Queue No."), val: `#${queueNo}` },
//             { lbl: T("🏥 डॉक्टर", "🏥 Doctor"), val: selectedDoctor?.name || "" },
//             { lbl: T("🕐 समय", "🕐 Time"), val: selectedSlot },
//             { lbl: T("📍 अस्पताल", "📍 Hospital"), val: selectedDoctor?.hospital || "" },
//             { lbl: T("🔴 ज़रूरी", "🔴 Urgency"), val: urg === "RED" ? T("RED — उच्च", "RED — High") : urg === "YELLOW" ? "YELLOW — Moderate" : "GREEN — Normal", color: urgColor },
//           ].map((row, i) => (
//             <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: i < 4 ? `1px solid ${C.border}` : "none" }}>
//               <span style={{ fontSize: 12, color: C.muted }}>{row.lbl}</span>
//               <span style={{ fontSize: 13, fontWeight: 700, color: row.color || C.text }}>{row.val}</span>
//             </div>
//           ))}
//         </div>
//         <div style={{ background: "#FEF9E7", borderRadius: 12, padding: 12, width: "100%", marginBottom: 16, border: "1px solid #F4D03F", display: "flex", gap: 8 }}>
//           <span>⚡</span>
//           <p style={{ fontSize: 13, color: "#7D6608", margin: 0, lineHeight: 1.5 }}>{T("जब इंटरनेट आएगा, डॉक्टर को सूचना मिलेगी", "When internet returns, doctor will be notified automatically")}</p>
//         </div>
//         <button onClick={() => router.push("/home")} style={{ width: "100%", padding: 16, borderRadius: 14, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 16, background: `linear-gradient(135deg,${C.primary},${C.primaryDark})`, color: "white" }}>
//           🏠 {T("घर जाएं", "Go Home")}
//         </button>
//         <style>{`@keyframes popin{from{transform:scale(0);opacity:0}to{transform:scale(1);opacity:1}}`}</style>
//       </div>
//     </div>
//   );
// }


//--------------------------------------------------------------------------------------------




// "use client";
// import { useRouter } from "next/navigation";
// import { useEffect, useState } from "react";
// import type { TriageResult } from "@/lib/triage";

// const C = { primary: "#1B6CA8", primaryDark: "#0F4C7A", green: "#1E8449", greenLight: "#27AE60", red: "#C0392B", yellow: "#F39C12", bg: "#F0F4F8", card: "#FFFFFF", text: "#1A2332", muted: "#6B7C93", border: "#DDE3EC" };

// export default function ConfirmPage() {
//   const router = useRouter();
//   const lang = typeof window !== "undefined" ? localStorage.getItem("lang") || "hi" : "hi";
//   const t = (hi: string, en: string) => lang === "hi" ? hi : en;
//   const [result, setResult] = useState<TriageResult | null>(null);

//   useEffect(() => {
//     const saved = localStorage.getItem("triageResult");
//     if (saved) setResult(JSON.parse(saved));
//   }, []);

//   const urgColor = result ? { RED: C.red, YELLOW: C.yellow, GREEN: C.green }[result.urgency] : C.green;

//   return (
//     <div style={{ background: "#0d1520", minHeight: "100vh", display: "flex", justifyContent: "center" }}>
//       <div style={{ width: 390, background: `linear-gradient(160deg,#EBF4FD,${C.bg})`, minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "40px 20px" }}>
//         <div style={{ width: 96, height: 96, background: `linear-gradient(135deg,${C.greenLight},${C.green})`, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 46, marginBottom: 22, boxShadow: `0 8px 32px rgba(30,132,73,.35)`, animation: "popin .5s cubic-bezier(.175,.885,.32,1.275)" }}>✓</div>
//         <div style={{ fontSize: 22, fontWeight: 800, color: C.text, textAlign: "center" }}>{t("अपॉइंटमेंट बुक हो गई!", "Appointment Booked!")}</div>
//         <div style={{ fontSize: 13, color: C.muted, textAlign: "center", marginTop: 6, lineHeight: 1.5 }}>{t("आपकी अपॉइंटमेंट सफलतापूर्वक बुक हुई", "Your appointment has been booked successfully")}</div>
//         <div style={{ background: C.card, borderRadius: 16, padding: 16, border: `1px solid ${C.border}`, width: "100%", margin: "18px 0" }}>
//           {[
//             { lbl: t("📋 Queue No.", "📋 Queue No."), val: "#Q-007" },
//             { lbl: t("⏱️ प्रतीक्षा समय", "⏱️ Wait Time"), val: t("लगभग 20 मिनट", "~20 minutes") },
//             { lbl: t("🏥 डॉक्टर", "🏥 Doctor"), val: "Dr. Arvind Kumar" },
//             { lbl: t("🔴 ज़रूरी", "🔴 Urgency"), val: result?.urgency === "RED" ? t("RED — उच्च प्राथमिकता", "RED — High Priority") : result?.urgency === "YELLOW" ? "YELLOW — Moderate" : "GREEN — Normal", color: urgColor },
//           ].map((row, i) => (
//             <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: i < 3 ? `1px solid ${C.border}` : "none" }}>
//               <span style={{ fontSize: 12, color: C.muted }}>{row.lbl}</span>
//               <span style={{ fontSize: 14, fontWeight: 700, color: row.color || C.text }}>{row.val}</span>
//             </div>
//           ))}
//         </div>
//         <div style={{ background: "#FEF9E7", borderRadius: 12, padding: 11, display: "flex", gap: 8, marginBottom: 18, width: "100%", border: "1px solid #F4D03F" }}>
//           <span>⚡</span>
//           <p style={{ fontSize: 13, color: "#7D6608", lineHeight: 1.5 }}>{t("जब इंटरनेट आएगा, डॉक्टर को सूचना मिलेगी", "When internet returns, doctor will be notified automatically")}</p>
//         </div>
//         <button onClick={() => router.push("/home")} style={{ width: "100%", padding: "16px", borderRadius: 14, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 16, background: `linear-gradient(135deg,${C.primary},${C.primaryDark})`, color: "white" }}>
//           🏠 {t("घर जाएं", "Go Home")}
//         </button>
//         <style>{`@keyframes popin{from{transform:scale(0);opacity:0}to{transform:scale(1);opacity:1}}`}</style>
//       </div>
//     </div>
//   );
// }




//---------------------new confirm page---------------------///


"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { TriageResult } from "@/lib/triage";

const C = { primary: "#1B6CA8", primaryDark: "#0F4C7A", green: "#1E8449", greenLight: "#27AE60", red: "#C0392B", yellow: "#F39C12", bg: "#F0F4F8", card: "#FFFFFF", text: "#1A2332", muted: "#6B7C93", border: "#DDE3EC" };

// Dynamic fetch handles this now

function t(lang: string, hi: string, en: string) { return lang === "hi" ? hi : en; }

export default function ConfirmPage() {
  const router = useRouter();
  const [lang, setLang] = useState("hi");
  const [result, setResult] = useState<TriageResult | null>(null);
  const [patient, setPatient] = useState<{ name: string; phone: string } | null>(null);
  const { data: session } = useSession();
  const [step, setStep] = useState<"select-doctor" | "select-slot" | "booked">("select-doctor");
  const [doctors, setDoctors] = useState<any[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<any | null>(null);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [queueNo, setQueueNo] = useState("");
  const [loading, setLoading] = useState(false);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsOnline(window.navigator.onLine);
      const setOnline = () => setIsOnline(true);
      const setOffline = () => setIsOnline(false);
      window.addEventListener("online", setOnline);
      window.addEventListener("offline", setOffline);
      return () => {
        window.removeEventListener("online", setOnline);
        window.removeEventListener("offline", setOffline);
      };
    }
  }, []);

  useEffect(() => {
    setLang(localStorage.getItem("lang") || "hi");
    const r = localStorage.getItem("triageResult"); if (r) setResult(JSON.parse(r));
   const p = localStorage.getItem("patient");
   if (p) setPatient(JSON.parse(p));
// Override with real session data if available
    if (session?.user) {
   setPatient({
    name:  session.user.name  || "",
    phone: (session.user as any).phone || "",
  });
}
  }, [session]);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const res = await fetch("/api/admin/doctors");
        const data = await res.json();
        if (data.doctors) {
          const mapped = data.doctors.map((d: any) => ({
            id: d._id,
            name: d.name.startsWith("Dr.") ? d.name : "Dr. " + d.name,
            spec: (t: any) => t(d.specialization, d.specialization),
            hospital: d.hospital,
            dist: `${(Math.random() * 5 + 1).toFixed(1)} km`,
            slots: ["9:00 AM", "10:30 AM", "12:00 PM", "2:30 PM", "4:00 PM"],
            fee: "₹0 (Govt)"
          }));
          setDoctors(mapped);
        }
      } catch {}
    };
    fetchDoctors();
  }, []);

  const urg = result?.urgency || "GREEN";
  const urgColor = { RED: C.red, YELLOW: C.yellow, GREEN: C.green }[urg];

  const bookAppointment = async () => {
    if (!selectedDoctor || !selectedSlot) return;
    setLoading(true);
    const qn = `Q-${Math.floor(Math.random() * 90 + 10)}`;
    setQueueNo(qn);

    // Get symptoms and context from localStorage
    const symptomsRaw = localStorage.getItem("selectedSymptomNames");
    const symptoms = symptomsRaw ? JSON.parse(symptomsRaw) : [];
    
    const customSymptoms = localStorage.getItem("customSymptoms");
    if (customSymptoms && customSymptoms.trim().length > 0) {
      symptoms.push(`Voice: "${customSymptoms.trim()}"`);
    }

    const detailRaw = localStorage.getItem("symptomDetailData");
    const patientContext = detailRaw ? JSON.parse(detailRaw) : null;

    const recordsRaw = localStorage.getItem("uploadedRecords");
    const uploadedRecords = recordsRaw ? JSON.parse(recordsRaw) : [];

    const voiceNoteBase64 = localStorage.getItem("voiceNoteBase64") || undefined;

    const consultationData = {
      patientPhone: (session?.user as any)?.phone || patient?.phone || "",
      patientName:  session?.user?.name || patient?.name || "",
      doctorId:     selectedDoctor.id,
      doctorName:   selectedDoctor.name,
      hospital:     selectedDoctor.hospital,
      slot:         selectedSlot,
      urgency:      urg,
      queueNo:      qn,
      triageResult: result,
      symptoms:     symptoms,
      patientContext: patientContext,
      uploadedRecords: uploadedRecords,
      voiceNoteBase64: voiceNoteBase64,
      status:       "pending",
    };

    try {
      const res = await fetch("/api/consultations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(consultationData),
      });

      if (res.ok) {
        // Also save to localStorage as backup
        const existing = JSON.parse(localStorage.getItem("myConsultations") || "[]");
        const saved = await res.json();
        existing.unshift(saved.consultation);
        localStorage.setItem("myConsultations", JSON.stringify(existing));
      }
    } catch {
      // Save offline as backup
      const existing = JSON.parse(localStorage.getItem("myConsultations") || "[]");
      existing.unshift({ ...consultationData, _id: Date.now().toString(), createdAt: new Date().toISOString() });
      localStorage.setItem("myConsultations", JSON.stringify(existing));
    }

    setLoading(false);
    setStep("booked");
  };

  const fetchBookedSlots = async (doctorId: string) => {
    setLoadingSlots(true);
    try {
      const res = await fetch(`/api/consultations/slots?doctorId=${doctorId}`);
      const data = await res.json();
      setBookedSlots(data.bookedSlots || []);
    } catch { setBookedSlots([]); }
    setLoadingSlots(false);
  };

  const selectDoctor = (doc: any) => {
    setSelectedDoctor(doc);
    setSelectedSlot("");
    setStep("select-slot");
    fetchBookedSlots(doc.id);
  };

  const T = (hi: string, en: string) => t(lang, hi, en);

  // ── DOCTOR SELECTION ──
  if (step === "select-doctor") return (
    <div style={{ background: "#0d1520", minHeight: "100vh", display: "flex", justifyContent: "center" }}>
      <div style={{ width: 390, background: C.bg, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <div style={{ background: `linear-gradient(135deg,${C.primary},${C.primaryDark})`, padding: "44px 16px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <button onClick={() => router.back()} style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,.2)", border: "none", color: "white", fontSize: 18, cursor: "pointer" }}>←</button>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "white" }}>{T("डॉक्टर चुनें", "Choose Doctor")}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,.65)" }}>{T("उपलब्ध डॉक्टर और स्लॉट", "Available doctors & slots")}</div>
            </div>
          </div>
          {urg !== "GREEN" && (
            <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 12, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8 }}>
              <span>{urg === "RED" ? "🔴" : "🟡"}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "white" }}>{urg === "RED" ? T("उच्च प्राथमिकता — जल्दी दिखाएं", "High Priority — See doctor soon") : T("मध्यम प्राथमिकता", "Moderate Priority")}</span>
            </div>
          )}
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px 24px" }}>
          <p style={{ fontSize: 12, color: C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12 }}>{T("पास के डॉक्टर", "Nearby Doctors")}</p>
          {doctors.length === 0 && <div style={{textAlign: "center", padding: 20, color: C.muted}}>{T("डॉक्टर लोड हो रहे हैं...", "Loading doctors...")}</div>}
          {doctors.map(doc => (
            <div key={doc.id} onClick={() => selectDoctor(doc)}
              style={{ background: C.card, borderRadius: 16, padding: 16, marginBottom: 12, border: `1px solid ${C.border}`, cursor: "pointer", transition: "all .2s" }}>
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: "#EBF4FD", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>👨‍⚕️</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: C.text }}>{doc.name}</div>
                  <div style={{ fontSize: 12, color: C.primary, fontWeight: 600, marginTop: 2 }}>{doc.spec(T)}</div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>🏥 {doc.hospital} · 📍 {doc.dist}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: C.green }}>{doc.fee}</div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>{doc.slots.length} {T("स्लॉट", "slots")}</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
                {doc.slots.slice(0, 4).map((s: string) => (
                  <span key={s} style={{ background: "#E8F8EF", color: C.green, borderRadius: 8, padding: "4px 10px", fontSize: 11, fontWeight: 700 }}>🕐 {s}</span>
                ))}
                {doc.slots.length > 4 && <span style={{ background: C.bg, color: C.muted, borderRadius: 8, padding: "4px 10px", fontSize: 11 }}>+{doc.slots.length - 4} {T("और", "more")}</span>}
              </div>
              <div style={{ marginTop: 10, textAlign: "right" }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: C.primary }}>{T("स्लॉट बुक करें", "Book Slot")} →</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ── SLOT SELECTION ──
  if (step === "select-slot" && selectedDoctor) return (
    <div style={{ background: "#0d1520", minHeight: "100vh", display: "flex", justifyContent: "center" }}>
      <div style={{ width: 390, background: C.bg, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <div style={{ background: `linear-gradient(135deg,${C.primary},${C.primaryDark})`, padding: "44px 16px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={() => setStep("select-doctor")} style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,.2)", border: "none", color: "white", fontSize: 18, cursor: "pointer" }}>←</button>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "white" }}>{selectedDoctor.name}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,.65)" }}>{selectedDoctor.hospital}</div>
            </div>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 100px" }}>
          {/* Doctor card */}
          <div style={{ background: C.card, borderRadius: 14, padding: 14, marginBottom: 16, border: `1px solid ${C.border}`, display: "flex", gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "#EBF4FD", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>👨‍⚕️</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800 }}>{selectedDoctor.name}</div>
              <div style={{ fontSize: 12, color: C.primary, fontWeight: 600 }}>{selectedDoctor.spec(T)}</div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>📍 {selectedDoctor.dist} · {selectedDoctor.fee}</div>
            </div>
          </div>
          <p style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>{T("समय चुनें", "Select Time Slot")}</p>
          {loadingSlots && <div style={{ textAlign: "center", padding: "10px 0", fontSize: 12, color: C.muted }}>⏳ {T("उपलब्ध स्लॉट देख रहे हैं...", "Checking available slots...")}</div>}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 20 }}>
            {selectedDoctor.slots.map((slot: string) => {
              const isBooked = bookedSlots.includes(slot);
              const isSelected = selectedSlot === slot;
              return (
                <button key={slot} onClick={() => !isBooked && setSelectedSlot(slot)} disabled={isBooked}
                  style={{ padding: "12px 8px", borderRadius: 12, border: `2px solid ${isSelected ? C.primary : isBooked ? C.border : C.border}`, background: isSelected ? "#EBF4FD" : isBooked ? "#F5F5F5" : C.card, cursor: isBooked ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 700, color: isSelected ? C.primary : isBooked ? "#BBBBBB" : C.text, transition: "all .2s", position: "relative" }}>
                  {isBooked ? "🔒" : "🕐"} {slot}
                  {isBooked && <div style={{ fontSize: 9, color: "#BBBBBB", marginTop: 2 }}>{T("भरा हुआ", "Booked")}</div>}
                </button>
              );
            })}
          </div>
          {/* Patient summary */}
          {patient && (
            <div style={{ background: "#EBF4FD", borderRadius: 12, padding: 12, marginBottom: 16, border: "1px solid #AED6F1" }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", marginBottom: 6 }}>👤 {T("मरीज़", "Patient")}</p>
              <p style={{ fontSize: 14, fontWeight: 700, color: C.text, margin: 0 }}>{patient.name}</p>
              <p style={{ fontSize: 12, color: C.muted, margin: "2px 0 0" }}>📱 {patient.phone} · {urg === "RED" ? "🔴 RED" : urg === "YELLOW" ? "🟡 YELLOW" : "🟢 GREEN"}</p>
            </div>
          )}
        </div>
        <div style={{ position: "fixed", bottom: 0, width: 390, background: C.card, borderTop: `2px solid ${C.border}`, padding: "12px 16px", zIndex: 50 }}>
          <button onClick={bookAppointment} disabled={!selectedSlot || loading}
            style={{ width: "100%", padding: 16, borderRadius: 14, border: "none", cursor: selectedSlot ? "pointer" : "not-allowed", fontWeight: 700, fontSize: 16, background: selectedSlot ? `linear-gradient(135deg,${C.primary},${C.primaryDark})` : C.border, color: "white", transition: "all .2s" }}>
            {loading ? "..." : selectedSlot ? `✓ ${T("बुक करें", "Confirm Booking")} — ${selectedSlot}` : T("पहले समय चुनें", "Select a time slot first")}
          </button>
        </div>
      </div>
    </div>
  );

  // ── BOOKED CONFIRMATION ──
  return (
    <div style={{ background: "#0d1520", minHeight: "100vh", display: "flex", justifyContent: "center" }}>
      <div style={{ width: 390, background: `linear-gradient(160deg,#EBF4FD,${C.bg})`, minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "40px 20px" }}>
        <div style={{ width: 96, height: 96, background: `linear-gradient(135deg,${C.greenLight},${C.green})`, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 46, marginBottom: 22, boxShadow: "0 8px 32px rgba(30,132,73,.35)", animation: "popin .5s cubic-bezier(.175,.885,.32,1.275)" }}>✓</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: C.text, textAlign: "center" }}>{T("अपॉइंटमेंट बुक हो गई!", "Appointment Booked!")}</div>
        <div style={{ fontSize: 13, color: C.muted, textAlign: "center", marginTop: 6 }}>{T("सफलतापूर्वक बुक हुई", "Successfully confirmed")}</div>
        <div style={{ background: C.card, borderRadius: 16, padding: 16, border: `1px solid ${C.border}`, width: "100%", margin: "20px 0" }}>
          {[
            { lbl: T("📋 Queue No.", "📋 Queue No."), val: `#${queueNo}` },
            { lbl: T("🏥 डॉक्टर", "🏥 Doctor"), val: selectedDoctor?.name || "" },
            { lbl: T("🕐 समय", "🕐 Time"), val: selectedSlot },
            { lbl: T("📍 अस्पताल", "📍 Hospital"), val: selectedDoctor?.hospital || "" },
            { lbl: T("🔴 ज़रूरी", "🔴 Urgency"), val: urg === "RED" ? T("RED — उच्च", "RED — High") : urg === "YELLOW" ? "YELLOW — Moderate" : "GREEN — Normal", color: urgColor },
          ].map((row, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: i < 4 ? `1px solid ${C.border}` : "none" }}>
              <span style={{ fontSize: 12, color: C.muted }}>{row.lbl}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: row.color || C.text }}>{row.val}</span>
            </div>
          ))}
        </div>
        {!isOnline && (
          <div style={{ background: "#FEF9E7", borderRadius: 12, padding: 12, width: "100%", marginBottom: 16, border: "1px solid #F4D03F", display: "flex", gap: 8 }}>
            <span>⚡</span>
            <p style={{ fontSize: 13, color: "#7D6608", margin: 0, lineHeight: 1.5 }}>{T("जब इंटरनेट आएगा, डॉक्टर को सूचना मिलेगी", "When internet returns, doctor will be notified automatically")}</p>
          </div>
        )}
        <button onClick={() => router.push("/home")} style={{ width: "100%", padding: 16, borderRadius: 14, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 16, background: `linear-gradient(135deg,${C.primary},${C.primaryDark})`, color: "white" }}>
          🏠 {T("घर जाएं", "Go Home")}
        </button>
        <style>{`@keyframes popin{from{transform:scale(0);opacity:0}to{transform:scale(1);opacity:1}}`}</style>
      </div>
    </div>
  );
}