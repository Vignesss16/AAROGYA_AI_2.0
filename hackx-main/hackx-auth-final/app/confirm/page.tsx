"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import type { TriageResult } from "@/lib/triage";
import { getDB, addToSyncQueue } from "@/lib/db-offline";

const C = {
  primary: "#0F766E",
  primaryDark: "#0D5E58",
  primaryLight: "#14B8A6",
  accent: "#0284C7",
  green: "#10B981",
  red: "#EF4444",
  yellow: "#F59E0B",
  bg: "#F8FAFC",
  card: "#FFFFFF",
  text: "#1E293B",
  muted: "#64748B",
  border: "#E2E8F0",
};

const DEFAULT_DOCTORS = [
  {
    id: "D1",
    name: "Dr. Arvind Kumar",
    specialization: "General Physician",
    hospital: "Nabha Civil Hospital",
    city: "Nabha",
    dist: "2.1 km",
    rating: 4.9,
    reviewCount: 28,
    slots: ["9:00 AM", "10:30 AM", "12:00 PM", "2:30 PM", "4:00 PM"],
    fee: "₹0 (Govt)",
  },
  {
    id: "D2",
    name: "Dr. Sunita Sharma",
    specialization: "Pediatrician",
    hospital: "PHC Kesri",
    city: "Kesri",
    dist: "0.8 km",
    rating: 4.8,
    reviewCount: 19,
    slots: ["9:30 AM", "11:00 AM", "3:00 PM", "4:00 PM"],
    fee: "₹0 (Govt)",
  },
  {
    id: "D3",
    name: "Dr. Ravi Patel",
    specialization: "Cardiologist",
    hospital: "District Hospital",
    city: "Patiala",
    dist: "5.2 km",
    rating: 4.9,
    reviewCount: 34,
    slots: ["10:00 AM", "11:30 AM", "4:30 PM"],
    fee: "₹200",
  },
  {
    id: "D4",
    name: "Dr. Vasanth",
    specialization: "General Physician",
    hospital: "Nabha Civil Hospital",
    city: "Nabha",
    dist: "3.7 km",
    rating: 5.0,
    reviewCount: 6,
    slots: ["9:00 AM", "10:30 AM", "12:00 PM", "2:30 PM", "5:00 PM"],
    fee: "₹0 (Govt)",
  },
  {
    id: "D5",
    name: "Dr. Ramesh Sharma",
    specialization: "General Physician",
    hospital: "Kalyan Civil Hospital",
    city: "Kalyan",
    dist: "2.2 km",
    rating: 4.7,
    reviewCount: 15,
    slots: ["9:00 AM", "11:00 AM", "1:30 PM", "4:00 PM"],
    fee: "₹0 (Govt)",
  },
  {
    id: "D6",
    name: "Dr. Allwin Nadar",
    specialization: "General Physician",
    hospital: "CityCare Hospital Dombivli",
    city: "Dombivli",
    dist: "2.5 km",
    rating: 4.9,
    reviewCount: 22,
    slots: ["9:00 AM", "10:30 AM", "12:00 PM", "2:30 PM"],
    fee: "₹0 (Govt)",
  },
];

const PRESET_LOCATIONS = [
  { city: "Nabha", state: "Punjab", label: "Nabha, Punjab", lat: 30.3752, lng: 76.1528 },
  { city: "Patiala", state: "Punjab", label: "Patiala, Punjab", lat: 30.3398, lng: 76.3869 },
  { city: "Kesri", state: "Punjab", label: "Kesri Village, Nabha", lat: 30.4011, lng: 76.1923 },
  { city: "Kalyan", state: "Maharashtra", label: "Kalyan West, Thane", lat: 19.2437, lng: 73.1355 },
  { city: "Dombivli", state: "Maharashtra", label: "Dombivli East, Thane", lat: 19.2183, lng: 73.0867 },
  { city: "Thane", state: "Maharashtra", label: "Thane West, Mumbai NCR", lat: 19.1970, lng: 72.9765 },
  { city: "Mumbai", state: "Maharashtra", label: "Mumbai Central", lat: 18.9712, lng: 72.8197 },
];

export default function ConfirmBookingPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [lang, setLang] = useState("hi");

  const [result, setResult] = useState<TriageResult | null>(null);
  const [patient, setPatient] = useState<{ name: string; phone: string } | null>(null);

  // Booking Flow State
  const [bookingSection, setBookingSection] = useState<"hospitals" | "doctors">("hospitals");
  const [selectedDeptFilter, setSelectedDeptFilter] = useState("ALL");
  const [step, setStep] = useState<"discovery" | "select-slot" | "booked">("discovery");

  // Location State
  const [currentLocation, setCurrentLocation] = useState<{ city: string; state: string; label: string; lat: number; lng: number }>({
    city: "Nabha",
    state: "Punjab",
    label: "Nabha, Punjab",
    lat: 30.3752,
    lng: 76.1528,
  });
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [locSearchQuery, setLocSearchQuery] = useState("");
  const [detectingGps, setDetectingGps] = useState(false);

  // Discovery Data
  const [facilities, setFacilities] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>(DEFAULT_DOCTORS);
  const [loadingFacilities, setLoadingFacilities] = useState(true);

  // Selection for Booking
  const [selectedFacility, setSelectedFacility] = useState<any | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<any | null>(null);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [bookingType, setBookingType] = useState<"DIRECT_DOCTOR" | "HOSPITAL_RECEPTIONIST_ASSISTED">("HOSPITAL_RECEPTIONIST_ASSISTED");

  // Post Booking
  const [queueNo, setQueueNo] = useState("");
  const [loading, setLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [isOfflineSaved, setIsOfflineSaved] = useState(false);

  const t = (hi: string, en: string) => (lang === "hi" ? hi : en);

  // Online detection
  useEffect(() => {
    if (typeof window !== "undefined") {
      setLang(localStorage.getItem("lang") || "hi");
      setIsOnline(window.navigator.onLine);
      const setOn = () => setIsOnline(true);
      const setOff = () => setIsOnline(false);
      window.addEventListener("online", setOn);
      window.addEventListener("offline", setOff);

      const savedLoc = localStorage.getItem("userLocation");
      if (savedLoc) {
        try {
          setCurrentLocation(JSON.parse(savedLoc));
        } catch {}
      }

      const r = localStorage.getItem("triageResult");
      if (r) setResult(JSON.parse(r));

      const p = localStorage.getItem("patient");
      if (p) setPatient(JSON.parse(p));

      return () => {
        window.removeEventListener("online", setOn);
        window.removeEventListener("offline", setOff);
      };
    }
  }, []);

  useEffect(() => {
    if (session?.user) {
      setPatient({
        name: session.user.name || "",
        phone: (session.user as any).phone || "",
      });
    }
  }, [session]);

  // Fetch Facilities and Reviews
  const fetchFacilitiesAndDoctors = useCallback(async () => {
    setLoadingFacilities(true);
    try {
      // 1. Fetch Reviews for doctor ratings map
      const revRes = await fetch("/api/reviews");
      const revData = await revRes.json();
      const ratingsMap = revData.doctorRatingsMap || {};

      // 2. Fetch Facilities with GPS coordinates
      const facUrl = `/api/facilities?city=${encodeURIComponent(currentLocation.city)}&lat=${currentLocation.lat}&lng=${currentLocation.lng}`;
      const facRes = await fetch(facUrl);
      const facData = await facRes.json();
      setFacilities(facData.facilities || []);

      // 3. Fetch Doctors and attach real ratings
      const docRes = await fetch("/api/admin/doctors");
      const docData = await docRes.json();

      let baseDocs = DEFAULT_DOCTORS;
      if (docData.doctors && docData.doctors.length > 0) {
        baseDocs = docData.doctors.map((d: any) => ({
          id: d._id,
          name: d.name.startsWith("Dr.") ? d.name : "Dr. " + d.name,
          specialization: d.specialization || "General Physician",
          hospital: d.hospital || "Civil Hospital",
          city: currentLocation.city,
          dist: `${(Math.random() * 3 + 1).toFixed(1)} km`,
          slots: ["9:00 AM", "10:30 AM", "12:00 PM", "2:30 PM", "4:00 PM"],
          fee: "₹0 (Govt)",
        }));
      }

      // Merge ratings into doctor list
      const enrichedDocs = baseDocs.map((doc) => {
        const normalizedName = doc.name.toLowerCase().replace(/^(dr\.?\s*)/i, "").trim();
        const docRating =
          ratingsMap[doc.id] ||
          ratingsMap[normalizedName] ||
          ratingsMap[doc.name.toLowerCase().trim()];

        return {
          ...doc,
          rating: docRating ? docRating.averageRating : doc.rating || 5.0,
          reviewCount: docRating ? docRating.totalReviews : doc.reviewCount || 0,
        };
      });

      setDoctors(enrichedDocs);
    } catch {
      setFacilities([]);
      setDoctors(DEFAULT_DOCTORS);
    } finally {
      setLoadingFacilities(false);
    }
  }, [currentLocation]);

  useEffect(() => {
    fetchFacilitiesAndDoctors();
  }, [fetchFacilitiesAndDoctors]);

  // GPS Auto-Detection
  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const detected = {
          city: "Nearby Location",
          state: "GPS",
          label: `GPS (${lat.toFixed(3)}, ${lng.toFixed(3)})`,
          lat,
          lng,
        };
        setCurrentLocation(detected);
        if (typeof window !== "undefined") {
          localStorage.setItem("userLocation", JSON.stringify(detected));
        }
        setDetectingGps(false);
        setLocationModalOpen(false);
      },
      () => {
        setDetectingGps(false);
        alert("Unable to retrieve GPS coordinates. Please select your city from the list.");
      },
      { timeout: 10000 }
    );
  };

  const handleSelectLocation = (loc: (typeof PRESET_LOCATIONS)[0]) => {
    setCurrentLocation(loc);
    if (typeof window !== "undefined") {
      localStorage.setItem("userLocation", JSON.stringify(loc));
    }
    setLocationModalOpen(false);
  };

  const fetchBookedSlots = async (docIdOrFacId: string) => {
    setLoadingSlots(true);
    try {
      const res = await fetch(`/api/consultations/slots?doctorId=${docIdOrFacId}`);
      if (res.ok) {
        const data = await res.json();
        setBookedSlots(data.bookedSlots || []);
      } else {
        setBookedSlots([]);
      }
    } catch {
      setBookedSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  // Trigger Booking Selection
  const startFacilityBooking = (facility: any) => {
    setSelectedFacility(facility);
    // Pick first affiliated doctor or default
    const matchingDoc = doctors.find((d) => d.hospital?.toLowerCase().includes(facility.city?.toLowerCase())) || doctors[0];
    setSelectedDoctor(matchingDoc);
    setBookingType("HOSPITAL_RECEPTIONIST_ASSISTED");
    setSelectedSlot("");
    setStep("select-slot");
    fetchBookedSlots(facility.facilityId);
  };

  const startDoctorBooking = (doc: any) => {
    setSelectedDoctor(doc);
    setSelectedFacility(null);
    setBookingType("DIRECT_DOCTOR");
    setSelectedSlot("");
    setStep("select-slot");
    fetchBookedSlots(doc.id);
  };

  // Submit Final Booking
  const handleConfirmBooking = async () => {
    if (!selectedSlot) return;
    setLoading(true);
    const qn = `Q-${Math.floor(Math.random() * 90 + 10)}`;
    setQueueNo(qn);

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
    const urg = result?.urgency || "GREEN";

    const consultationData = {
      patientPhone: (session?.user as any)?.phone || patient?.phone || "9876543210",
      patientName: session?.user?.name || patient?.name || "Patient",
      doctorId: selectedDoctor?.id || "DOC-DEFAULT",
      doctorName: selectedDoctor?.name || "Dr. Medical Consultant",
      hospital: selectedFacility ? selectedFacility.name : selectedDoctor?.hospital || "Civil Hospital",
      facilityId: selectedFacility?.facilityId,
      department: selectedDeptFilter !== "ALL" ? selectedDeptFilter : "General Medicine",
      bookingType,
      receptionistStatus: bookingType === "HOSPITAL_RECEPTIONIST_ASSISTED" ? "PENDING_CONFIRMATION" : "CONFIRMED",
      estimatedConfirmationTime: bookingType === "HOSPITAL_RECEPTIONIST_ASSISTED" ? "10 - 20 minutes" : "Instant",
      slot: selectedSlot,
      urgency: urg,
      queueNo: qn,
      triageResult: result || { summary: "General Consultation Booking" },
      symptoms: symptoms.length > 0 ? symptoms : ["General Health Checkup"],
      patientContext,
      uploadedRecords,
      voiceNoteBase64,
      status: "pending",
    };

    const idempotencyKey = `consult_${consultationData.patientPhone}_${Date.now()}`;
    let savedOffline = false;

    if (!isOnline) {
      savedOffline = true;
    } else {
      try {
        const res = await fetch("/api/consultations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(consultationData),
        });

        if (res.ok) {
          const saved = await res.json();
          const existing = JSON.parse(localStorage.getItem("myConsultations") || "[]");
          existing.unshift(saved.consultation);
          localStorage.setItem("myConsultations", JSON.stringify(existing));
        } else {
          savedOffline = true;
        }
      } catch {
        savedOffline = true;
      }
    }

    if (savedOffline) {
      setIsOfflineSaved(true);
      try {
        const db = getDB();
        await db.consultations.add({
          patientPhone: consultationData.patientPhone,
          patientName: consultationData.patientName,
          symptoms: consultationData.symptoms,
          urgency: consultationData.urgency as any,
          triageResult: JSON.stringify(consultationData.triageResult),
          createdAt: new Date(),
          needsSync: true,
        });
        await addToSyncQueue("/api/consultations", "POST", consultationData, idempotencyKey);
      } catch (err) {
        console.error("Dexie queue error:", err);
      }
    }

    setLoading(false);
    setStep("booked");
  };

  const urg = result?.urgency || "GREEN";
  const urgColor = { RED: C.red, YELLOW: C.yellow, GREEN: C.green }[urg];

  return (
    <div style={{ background: "#0d1520", minHeight: "100vh", display: "flex", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 440, background: C.bg, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        
        {/* Top Header & BookMyShow Location Banner */}
        <div style={{ background: `linear-gradient(135deg, ${C.primaryDark}, ${C.primary})`, padding: "16px 18px", color: "white" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <button
              onClick={() => (step === "select-slot" ? setStep("discovery") : router.push("/home"))}
              style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(255,255,255,0.15)", border: "none", color: "white", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              ←
            </button>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 16, fontWeight: 800 }}>{t("डॉक्टर व अस्पताल खोजें", "Healthcare & Doctor Discovery")}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.75)" }}>{t("बुकमायशो शैली में स्मार्ट अपॉइंटमेंट", "BookMyShow-Style Smart Booking")}</div>
            </div>
            <button
              onClick={() => setLang(lang === "hi" ? "en" : "hi")}
              style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: 12, padding: "4px 10px", fontSize: 11, fontWeight: 800, color: "white", cursor: "pointer" }}
            >
              {lang === "hi" ? "EN" : "हिं"}
            </button>
          </div>

          {/* Location Selector Bar */}
          <div
            onClick={() => setLocationModalOpen(true)}
            style={{
              background: "rgba(255,255,255,0.15)",
              borderRadius: 14,
              padding: "10px 14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              cursor: "pointer",
              backdropFilter: "blur(6px)",
              border: "1px solid rgba(255,255,255,0.25)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 16 }}>📍</span>
              <div>
                <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.5px", color: "rgba(255,255,255,0.75)", fontWeight: 700 }}>
                  {t("आपकी चुनी हुई लोकेशन", "Your Selected Location")}
                </div>
                <div style={{ fontSize: 13, fontWeight: 800, color: "white" }}>
                  {currentLocation.label}
                </div>
              </div>
            </div>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.85)", fontWeight: 700 }}>
              {t("बदलें", "Change")} ▼
            </span>
          </div>

          {/* Urgency Badge if from Triage */}
          {urg !== "GREEN" && (
            <div style={{ marginTop: 10, background: "rgba(255,255,255,0.2)", borderRadius: 10, padding: "6px 12px", display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: urgColor }} />
              <span style={{ fontSize: 12, fontWeight: 700 }}>
                {urg === "RED" ? t("🔴 उच्च प्राथमिकता — तुरंत परामर्श लें", "🔴 High Priority — Prompt Medical Attention") : t("🟡 मध्यम प्राथमिकता", "🟡 Moderate Urgency")}
              </span>
            </div>
          )}
        </div>

        {/* STEP 1: Discovery Screen (Hospitals vs Individual Doctors) */}
        {step === "discovery" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflowY: "auto" }}>
            
            {/* BookMyShow Style 2-Tier Segmented Toggle */}
            <div style={{ padding: "14px 16px 0", background: C.card, borderBottom: `1px solid ${C.border}` }}>
              <div style={{ display: "flex", background: "#F1F5F9", borderRadius: 12, padding: 3, marginBottom: 12 }}>
                <button
                  type="button"
                  onClick={() => setBookingSection("hospitals")}
                  style={{
                    flex: 1,
                    padding: "9px 8px",
                    borderRadius: 10,
                    border: "none",
                    background: bookingSection === "hospitals" ? C.primary : "transparent",
                    color: bookingSection === "hospitals" ? "white" : C.muted,
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    transition: "all 0.2s",
                  }}
                >
                  <span>🏥</span>
                  <span>{t("अस्पताल (हॉस्पिटल)", "Hospitals & Facilities")}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBookingSection("doctors")}
                  style={{
                    flex: 1,
                    padding: "9px 8px",
                    borderRadius: 10,
                    border: "none",
                    background: bookingSection === "doctors" ? C.primary : "transparent",
                    color: bookingSection === "doctors" ? "white" : C.muted,
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    transition: "all 0.2s",
                  }}
                >
                  <span>👨‍⚕️</span>
                  <span>{t("निजी / विशेषज्ञ डॉक्टर", "Private & OPD Doctors")}</span>
                </button>
              </div>

              {/* Department Filter Chips */}
              <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 10, scrollbarWidth: "none" }}>
                {["ALL", "General Medicine", "Cardiology", "Pediatrics", "Orthopedics", "Emergency 24/7"].map((dept) => {
                  const active = selectedDeptFilter === dept;
                  return (
                    <button
                      key={dept}
                      onClick={() => setSelectedDeptFilter(dept)}
                      style={{
                        whiteSpace: "nowrap",
                        padding: "5px 12px",
                        borderRadius: 20,
                        border: `1px solid ${active ? C.primary : C.border}`,
                        background: active ? `${C.primary}15` : C.card,
                        color: active ? C.primary : C.muted,
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      {dept === "ALL" ? t("सभी विभाग", "All Departments") : dept}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* List Content */}
            <div style={{ flex: 1, padding: "14px 16px 30px" }}>
              
              {/* SECTION 1: HOSPITALS & CLINICS (BookMyShow Theatre Style) */}
              {bookingSection === "hospitals" && (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      {t(`निकटवर्ती अस्पताल (${facilities.length})`, `Nearby Hospitals & Medical Centers (${facilities.length})`)}
                    </div>
                    <span style={{ fontSize: 11, color: C.primary, fontWeight: 700 }}>
                      {t("रिसेप्शनिस्ट असिस्टेड", "Receptionist-Assisted")}
                    </span>
                  </div>

                  {loadingFacilities ? (
                    <div style={{ textAlign: "center", padding: "40px 20px", color: C.muted }}>
                      <div style={{ fontSize: 28, marginBottom: 8 }}>⏳</div>
                      <div style={{ fontSize: 13 }}>{t("निकटवर्ती अस्पताल लोड हो रहे हैं...", "Loading nearby hospitals & facilities...")}</div>
                    </div>
                  ) : facilities.length === 0 ? (
                    <div style={{ background: C.card, borderRadius: 16, padding: "30px 20px", textAlign: "center", border: `1px dashed ${C.border}` }}>
                      <div style={{ fontSize: 32, marginBottom: 8 }}>🏥</div>
                      <div style={{ fontSize: 14, fontWeight: 800 }}>{t("इस लोकेशन में कोई अस्पताल पंजीकृत नहीं", "No Facilities in this Location")}</div>
                      <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>
                        {t("कृपया अपनी लोकेशन बदलें या डॉक्टर सेक्शन देखें।", "Try changing your city or view the Doctors tab.")}
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                      {facilities.map((fac) => (
                        <div
                          key={fac._id || fac.facilityId}
                          style={{
                            background: C.card,
                            borderRadius: 18,
                            padding: 16,
                            border: `1px solid ${C.border}`,
                            boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
                            transition: "transform 0.15s, box-shadow 0.15s",
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                            <div>
                              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                                <span style={{ fontSize: 15, fontWeight: 800, color: C.text }}>
                                  {fac.shortName || fac.name}
                                </span>
                                <span style={{ background: "#E0F2FE", color: "#0369A1", fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 6 }}>
                                  {fac.type?.includes("Govt") ? "Govt Hospital" : "Multi-Specialty"}
                                </span>
                              </div>
                              <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>
                                📍 {fac.location} · <strong>{fac.distanceKm} km</strong>
                              </div>
                            </div>

                            <span style={{ background: "#ECFDF5", color: "#065F46", padding: "3px 8px", borderRadius: 8, fontSize: 10, fontWeight: 700 }}>
                              {t("ओपीडी चालू", "OPD Active")}
                            </span>
                          </div>

                          {/* Hospital Highlight Badges */}
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, margin: "10px 0 12px" }}>
                            {fac.ayushmanBharat && (
                              <span style={{ background: "#FEF3C7", color: "#92400E", padding: "3px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700 }}>
                                🛡️ Ayushman Free
                              </span>
                            )}
                            {fac.emergencyAvailable && (
                              <span style={{ background: "#FEE2E2", color: "#B91C1C", padding: "3px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700 }}>
                                🚨 24/7 Casualty
                              </span>
                            )}
                            <span style={{ background: "#F1F5F9", color: "#475569", padding: "3px 8px", borderRadius: 6, fontSize: 10, fontWeight: 600 }}>
                              🧪 Lab Attached
                            </span>
                          </div>

                          {/* Departments Grid */}
                          <div style={{ background: "#F8FAFC", borderRadius: 12, padding: "8px 10px", marginBottom: 12 }}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", marginBottom: 4 }}>
                              {t("उपलब्ध विभाग", "Available Departments")}
                            </div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                              {(fac.departments || []).slice(0, 4).map((d: string) => (
                                <span key={d} style={{ background: "white", border: `1px solid ${C.border}`, padding: "2px 7px", borderRadius: 6, fontSize: 11, fontWeight: 600, color: C.text }}>
                                  {d}
                                </span>
                              ))}
                              {(fac.departments || []).length > 4 && (
                                <span style={{ fontSize: 11, color: C.muted, alignSelf: "center" }}>
                                  +{(fac.departments || []).length - 4} {t("और", "more")}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Receptionist Slot Request Action */}
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: `1px solid ${C.border}`, paddingTop: 12 }}>
                            <div style={{ fontSize: 11, color: C.muted }}>
                              🕒 {t("10-20 मिनट में रिसेप्शनिस्ट कन्फर्मेशन", "10-20 min receptionist confirmation")}
                            </div>
                            <button
                              onClick={() => startFacilityBooking(fac)}
                              style={{
                                background: `linear-gradient(135deg, ${C.primary}, ${C.primaryDark})`,
                                color: "white",
                                border: "none",
                                borderRadius: 10,
                                padding: "8px 14px",
                                fontSize: 12,
                                fontWeight: 800,
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                                boxShadow: "0 2px 6px rgba(15,118,110,0.25)",
                              }}
                            >
                              {t("स्लॉट चुनें", "Request Slot")} →
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* SECTION 2: INDIVIDUAL DOCTORS & DIRECT OPD (Practo Style with Ratings) */}
              {bookingSection === "doctors" && (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      {t(`उपलब्ध डॉक्टर (${doctors.length})`, `Verified Doctors & Consultants (${doctors.length})`)}
                    </div>
                    <span style={{ fontSize: 11, color: C.green, fontWeight: 700 }}>
                      ⚡ {t("तत्काल बुकिंग", "Instant Booking")}
                    </span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {doctors.map((doc) => {
                      return (
                        <div
                          key={doc.id}
                          style={{
                            background: C.card,
                            borderRadius: 18,
                            padding: 16,
                            border: `1px solid ${C.border}`,
                            boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
                          }}
                        >
                          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                            <div style={{ width: 48, height: 48, borderRadius: 14, background: "#E6FFFA", border: "1px solid #99F6E4", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>
                              👨‍⚕️
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                <div>
                                  <div style={{ fontSize: 15, fontWeight: 800, color: C.text }}>
                                    {doc.name}
                                  </div>
                                  <div style={{ fontSize: 12, color: C.primary, fontWeight: 700, marginTop: 1 }}>
                                    {doc.specialization}
                                  </div>
                                </div>
                                <div style={{ textAlign: "right" }}>
                                  <div style={{ fontSize: 13, fontWeight: 800, color: C.green }}>
                                    {doc.fee}
                                  </div>
                                </div>
                              </div>

                              <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>
                                🏥 {doc.hospital} · 📍 {doc.dist}
                              </div>

                              {/* Live Rating & Review Count Badge */}
                              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
                                <span style={{ background: "#FEF3C7", color: "#D97706", padding: "2px 7px", borderRadius: 6, fontSize: 11, fontWeight: 800, display: "inline-flex", alignItems: "center", gap: 3 }}>
                                  ★ {doc.rating || "5.0"}
                                </span>
                                <span style={{ fontSize: 11, color: C.muted }}>
                                  ({doc.reviewCount || 0} {t("समीक्षाएं", "reviews")})
                                </span>
                                <span style={{ marginLeft: "auto", fontSize: 10, color: "#0284C7", fontWeight: 700, background: "#E0F2FE", padding: "2px 6px", borderRadius: 4 }}>
                                  ABDM Verified
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Time Slots Preview */}
                          <div style={{ display: "flex", gap: 6, marginTop: 12, flexWrap: "wrap" }}>
                            {doc.slots.slice(0, 4).map((s: string) => (
                              <span key={s} style={{ background: "#F0FDF4", color: "#166534", border: "1px solid #BBF7D0", borderRadius: 8, padding: "4px 8px", fontSize: 11, fontWeight: 700 }}>
                                🕐 {s}
                              </span>
                            ))}
                            {doc.slots.length > 4 && (
                              <span style={{ background: C.bg, color: C.muted, borderRadius: 8, padding: "4px 8px", fontSize: 11, fontWeight: 600 }}>
                                +{doc.slots.length - 4} {t("और", "more")}
                              </span>
                            )}
                          </div>

                          <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
                            <button
                              onClick={() => startDoctorBooking(doc)}
                              style={{
                                background: "linear-gradient(135deg, #0284C7, #0369A1)",
                                color: "white",
                                border: "none",
                                borderRadius: 10,
                                padding: "8px 16px",
                                fontSize: 12,
                                fontWeight: 800,
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                                boxShadow: "0 2px 6px rgba(2,132,199,0.25)",
                              }}
                            >
                              {t("अपॉइंटमेंट बुक करें", "Book Appointment")} →
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 2: Slot Selection Screen */}
        {step === "select-slot" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "16px 18px 100px", overflowY: "auto" }}>
            
            {/* Header info of chosen entity */}
            <div style={{ background: C.card, borderRadius: 16, padding: 16, border: `1px solid ${C.border}`, marginBottom: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: "#E6FFFA", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
                  {bookingType === "HOSPITAL_RECEPTIONIST_ASSISTED" ? "🏥" : "👨‍⚕️"}
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: C.text }}>
                    {selectedFacility ? selectedFacility.shortName || selectedFacility.name : selectedDoctor?.name}
                  </div>
                  <div style={{ fontSize: 12, color: C.primary, fontWeight: 700 }}>
                    {selectedFacility ? `🏥 ${selectedFacility.type}` : selectedDoctor?.specialization}
                  </div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                    📍 {selectedFacility ? selectedFacility.location : selectedDoctor?.hospital}
                  </div>
                </div>
              </div>

              {bookingType === "HOSPITAL_RECEPTIONIST_ASSISTED" && (
                <div style={{ background: "#EFF6FF", borderRadius: 10, padding: "10px 12px", marginTop: 12, border: "1px solid #BFDBFE" }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "#1E40AF" }}>
                    ℹ️ {t("रिसेप्शनिस्ट असिस्टेड बुकिंग मोड", "Receptionist-Assisted Booking Mode")}
                  </div>
                  <div style={{ fontSize: 11, color: "#3B82F6", marginTop: 2 }}>
                    {t(
                      "अस्पताल रिसेप्शनिस्ट आपका स्लॉट कन्फर्म करेगा और 10-20 मिनट में कन्फर्मेशन नोटिफिकेशन भेजेगा।",
                      "The hospital receptionist will verify your slot and send a confirmation notification in 10-20 minutes."
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Select Slot Grid */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 10 }}>
                {t("परामर्श समय स्लॉट चुनें", "Select Consultation Slot")}
              </div>

              {loadingSlots && (
                <div style={{ textAlign: "center", padding: "12px", fontSize: 12, color: C.muted }}>
                  ⏳ {t("उपलब्ध स्लॉट जांच रहे हैं...", "Checking real-time slot availability...")}
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {(selectedDoctor?.slots || ["9:00 AM", "10:30 AM", "12:00 PM", "2:30 PM", "4:00 PM", "5:30 PM"]).map((slot: string) => {
                  const isBooked = bookedSlots.includes(slot);
                  const isSelected = selectedSlot === slot;
                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => !isBooked && setSelectedSlot(slot)}
                      disabled={isBooked}
                      style={{
                        padding: "14px 10px",
                        borderRadius: 12,
                        border: `2px solid ${isSelected ? C.primary : isBooked ? C.border : C.border}`,
                        background: isSelected ? "#CCFBF1" : isBooked ? "#F1F5F9" : C.card,
                        cursor: isBooked ? "not-allowed" : "pointer",
                        fontSize: 13,
                        fontWeight: 800,
                        color: isSelected ? C.primaryDark : isBooked ? "#94A3B8" : C.text,
                        boxShadow: isSelected ? "0 4px 12px rgba(15,118,110,0.15)" : "none",
                        transition: "all 0.15s",
                        position: "relative",
                      }}
                    >
                      <div>{isBooked ? "🔒 " : "🕐 "} {slot}</div>
                      {isBooked ? (
                        <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 2 }}>{t("भरा हुआ", "Booked")}</div>
                      ) : (
                        <div style={{ fontSize: 10, color: isSelected ? C.primary : C.green, marginTop: 2 }}>{t("उपलब्ध", "Available")}</div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Patient Context Summary */}
            <div style={{ background: C.card, borderRadius: 14, padding: "12px 14px", border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: C.muted, textTransform: "uppercase", marginBottom: 4 }}>
                👤 {t("मरीज़ विवरण", "Patient Details")}
              </div>
              <div style={{ fontSize: 14, fontWeight: 800, color: C.text }}>
                {patient?.name || "Patient"}
              </div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
                📱 {patient?.phone || "Phone not set"} · {urg === "RED" ? "🔴 RED" : urg === "YELLOW" ? "🟡 YELLOW" : "🟢 GREEN"}
              </div>
            </div>

            {/* Fixed Bottom Booking Confirmation Button */}
            <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 440, background: C.card, borderTop: `1px solid ${C.border}`, padding: "12px 16px", zIndex: 100, boxSizing: "border-box" }}>
              <button
                type="button"
                onClick={handleConfirmBooking}
                disabled={!selectedSlot || loading}
                style={{
                  width: "100%",
                  padding: "16px",
                  borderRadius: 14,
                  border: "none",
                  cursor: selectedSlot && !loading ? "pointer" : "not-allowed",
                  fontWeight: 800,
                  fontSize: 15,
                  background: selectedSlot ? `linear-gradient(135deg, ${C.primary}, ${C.primaryDark})` : "#CBD5E1",
                  color: "white",
                  boxShadow: selectedSlot ? "0 4px 14px rgba(15,118,110,0.3)" : "none",
                  transition: "all 0.2s",
                }}
              >
                {loading
                  ? t("बुक हो रहा है...", "Booking...")
                  : selectedSlot
                  ? `✓ ${t("बुकिंग कन्फर्म करें", "Confirm Booking")} — ${selectedSlot}`
                  : t("कृपया समय स्लॉट चुनें", "Please select a time slot")}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Booked Confirmation Card */}
        {step === "booked" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "30px 20px" }}>
            <div
              style={{
                width: 80,
                height: 80,
                background: "linear-gradient(135deg, #10B981, #059669)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 40,
                color: "white",
                marginBottom: 16,
                boxShadow: "0 10px 25px rgba(16,185,129,0.35)",
              }}
            >
              ✓
            </div>

            <div style={{ fontSize: 20, fontWeight: 800, color: C.text, textAlign: "center" }}>
              {bookingType === "HOSPITAL_RECEPTIONIST_ASSISTED"
                ? t("अपॉइंटमेंट अनुरोध भेजा गया!", "Appointment Request Submitted!")
                : t("अपॉइंटमेंट सफलतापूर्वक बुक हो गई!", "Appointment Booked Successfully!")}
            </div>

            <div style={{ fontSize: 13, color: C.muted, textAlign: "center", marginTop: 4 }}>
              {bookingType === "HOSPITAL_RECEPTIONIST_ASSISTED"
                ? t("रिसेप्शनिस्ट द्वारा सत्यापन के बाद आपको 10-20 मिनट में सूचना मिलेगी", "Hospital receptionist will verify and confirm within 10-20 minutes")
                : t("आपकी अपॉइंटमेंट डॉक्टर के डैशबोर्ड से सिंक हो गई है", "Synced directly with doctor command center")}
            </div>

            {/* Ticket Card */}
            <div style={{ background: C.card, borderRadius: 18, padding: 18, border: `1px solid ${C.border}`, width: "100%", margin: "20px 0", boxShadow: "0 4px 15px rgba(0,0,0,0.04)" }}>
              {[
                { lbl: t("📋 कतार टोकन (Queue No.)", "📋 Queue Token"), val: `#${queueNo}`, color: C.primary },
                { lbl: t("🏥 अस्पताल / डॉक्टर", "🏥 Facility / Doctor"), val: selectedFacility ? selectedFacility.name : selectedDoctor?.name || "" },
                { lbl: t("🕐 निर्धारित समय", "🕐 Scheduled Slot"), val: selectedSlot },
                {
                  lbl: t("⚡ बुकिंग प्रकार", "⚡ Booking Type"),
                  val: bookingType === "HOSPITAL_RECEPTIONIST_ASSISTED" ? t("रिसेप्शनिस्ट असिस्टेड", "Receptionist-Assisted") : t("डायरेक्ट डॉक्टर ओपीडी", "Direct OPD"),
                  color: bookingType === "HOSPITAL_RECEPTIONIST_ASSISTED" ? "#0284C7" : C.green,
                },
                { lbl: t("🔴 प्राथमिकता", "🔴 Priority"), val: urg === "RED" ? "RED (High)" : urg === "YELLOW" ? "YELLOW (Moderate)" : "GREEN (Normal)", color: urgColor },
              ].map((row, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: i < 4 ? `1px solid ${C.border}` : "none" }}>
                  <span style={{ fontSize: 12, color: C.muted }}>{row.lbl}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: row.color || C.text, textAlign: "right", maxWidth: 200 }}>{row.val}</span>
                </div>
              ))}
            </div>

            {(isOfflineSaved || !isOnline) && (
              <div style={{ background: "#FEF9E7", borderRadius: 12, padding: 12, width: "100%", marginBottom: 16, border: "1px solid #F4D03F", display: "flex", gap: 8 }}>
                <span>⚡</span>
                <p style={{ fontSize: 12, color: "#7D6608", margin: 0, lineHeight: 1.5, fontWeight: 600 }}>
                  {t("ऑफ़लाइन सेव हो गया — इंटरनेट आने पर स्वतः अस्पताल को सिंक होगा", "Saved Offline — will sync to hospital database once internet returns")}
                </p>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%" }}>
              <button
                type="button"
                onClick={() => router.push("/records")}
                style={{
                  width: "100%",
                  padding: "14px",
                  borderRadius: 12,
                  border: "none",
                  cursor: "pointer",
                  fontWeight: 800,
                  fontSize: 14,
                  background: `linear-gradient(135deg, ${C.primary}, ${C.primaryDark})`,
                  color: "white",
                  boxShadow: "0 4px 12px rgba(15,118,110,0.25)",
                }}
              >
                📄 {t("मेरे स्वास्थ्य रिकॉर्ड और टोकन देखें", "View My Records & Queue Token")}
              </button>

              <button
                type="button"
                onClick={() => router.push("/home")}
                style={{
                  width: "100%",
                  padding: "14px",
                  borderRadius: 12,
                  border: `1px solid ${C.border}`,
                  background: C.card,
                  color: C.text,
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: "pointer",
                }}
              >
                🏠 {t("होम पर जाएं", "Return to Home")}
              </button>
            </div>
          </div>
        )}

        {/* Location Picker Modal (BookMyShow Style) */}
        {locationModalOpen && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.7)",
              backdropFilter: "blur(6px)",
              zIndex: 999999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 16,
            }}
            onClick={() => setLocationModalOpen(false)}
          >
            <div
              style={{
                background: C.card,
                width: "100%",
                maxWidth: 400,
                borderRadius: 24,
                padding: 22,
                border: `1px solid ${C.border}`,
                boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: C.text }}>
                    📍 {t("लोकेशन चुनें", "Select Location / City")}
                  </h3>
                  <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
                    {t("निकटवर्ती अस्पताल और डॉक्टर देखने के लिए", "To discover nearby hospitals & doctors")}
                  </div>
                </div>
                <button
                  onClick={() => setLocationModalOpen(false)}
                  style={{ background: C.bg, border: "none", borderRadius: 8, width: 28, height: 28, cursor: "pointer", fontSize: 14 }}
                >
                  ✕
                </button>
              </div>

              {/* 1-Tap GPS Auto Detect */}
              <button
                type="button"
                onClick={handleDetectGPS}
                disabled={detectingGps}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: 12,
                  border: "1.5px solid #0284C7",
                  background: "#F0F9FF",
                  color: "#0369A1",
                  fontWeight: 800,
                  fontSize: 13,
                  cursor: detectingGps ? "wait" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  marginBottom: 16,
                }}
              >
                <span>🛰️</span>
                <span>{detectingGps ? t("GPS ढूंढा जा रहा है...", "Detecting GPS Location...") : t("वर्तमान GPS लोकेशन का उपयोग करें", "Use Current GPS Location")}</span>
              </button>

              {/* Search Box */}
              <div style={{ marginBottom: 14 }}>
                <input
                  type="text"
                  placeholder={t("शहर या जिला खोजें...", "Search city, district, or area...")}
                  value={locSearchQuery}
                  onChange={(e) => setLocSearchQuery(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 10,
                    border: `1px solid ${C.border}`,
                    background: C.bg,
                    fontSize: 13,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Quick Preset Location Grid */}
              <div style={{ fontSize: 11, fontWeight: 800, color: C.muted, textTransform: "uppercase", marginBottom: 8 }}>
                {t("पॉपुलर शहर / क्षेत्र", "Popular Cities & Rural Centers")}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, maxHeight: 220, overflowY: "auto" }}>
                {PRESET_LOCATIONS.filter(
                  (l) =>
                    !locSearchQuery.trim() ||
                    l.label.toLowerCase().includes(locSearchQuery.toLowerCase()) ||
                    l.city.toLowerCase().includes(locSearchQuery.toLowerCase())
                ).map((loc) => {
                  const isCur = currentLocation.city?.toLowerCase() === loc.city?.toLowerCase();
                  return (
                    <button
                      key={loc.city}
                      type="button"
                      onClick={() => handleSelectLocation(loc)}
                      style={{
                        padding: "10px 8px",
                        borderRadius: 10,
                        border: `1.5px solid ${isCur ? C.primary : C.border}`,
                        background: isCur ? "#E6FFFA" : C.bg,
                        color: isCur ? C.primaryDark : C.text,
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer",
                        textAlign: "left",
                        display: "flex",
                        flexDirection: "column",
                      }}
                    >
                      <span>{loc.city}</span>
                      <span style={{ fontSize: 10, color: C.muted }}>{loc.state}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}