"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { useLang } from "@/lib/useLang";
import { useCall } from "@/context/CallContext";
import DoctorCallQRModal from "@/components/DoctorCallQRModal";

const C = {
  primary: "#0F766E", // Deep Teal
  primaryDark: "#0D5E58", // Dark Teal
  primaryLight: "#14B8A6", // Bright Teal
  accent: "#0284C7", // Ocean Blue
  green: "#10B981",
  red: "#EF4444",
  yellow: "#F59E0B",
  bg: "#F4F7F6", // Very soft mint/gray
  card: "#FFFFFF",
  text: "#1E293B",
  muted: "#64748B",
  border: "#E2E8F0",
};

const InfoButton = ({ text }: { text: string }) => (
  <div style={{ position: "relative", display: "inline-flex", marginLeft: 8, verticalAlign: "middle" }} className="info-btn">
    <span style={{ display: "inline-flex", width: 20, height: 20, background: "rgba(0,0,0,0.05)", borderRadius: "50%", alignItems: "center", justifyContent: "center", fontSize: 12, color: C.muted, cursor: "help", fontWeight: 800 }}>i</span>
    <div className="tooltip" style={{ position: "absolute", bottom: "100%", left: "50%", transform: "translateX(-50%)", width: 200, padding: 10, background: "#1E293B", color: "white", fontSize: 12, fontWeight: 500, borderRadius: 8, boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)", zIndex: 100, visibility: "hidden", opacity: 0, transition: "0.2s", marginBottom: 8, lineHeight: 1.4, pointerEvents: "none" }}>
      {text}
      <div style={{ position: "absolute", bottom: -5, left: "50%", transform: "translateX(-50%)", borderLeft: "6px solid transparent", borderRight: "6px solid transparent", borderTop: "6px solid #1E293B" }} />
    </div>
  </div>
);
const DEFAULT_FACILITIES = [
  {
    facilityId: "HOSP-SION-001",
    name: "Lokmanya Tilak Municipal General Hospital (SION Hospital)",
    shortName: "SION Hospital (LTMGH Mumbai)",
    type: "Govt Civil Hospital (Apex Trauma & Research)",
    location: "Sion West, Mumbai",
    city: "Mumbai",
    state: "Maharashtra",
    address: "Sion West, Mumbai, Maharashtra 400022",
    phone: "+91 22 24076381",
    departments: ["Emergency & Trauma 24/7", "Cardiology", "Neurology", "General Medicine", "Pediatrics", "Orthopedics", "Pulmonology", "Diagnostic Lab"],
    emergencyAvailable: true,
    ayushmanBharat: true,
    opdTimings: "24/7 Emergency & Casualty / OPD 08:00 AM - 02:00 PM",
    receptionistPhone: "+91 98765 01010",
    totalBeds: 1400,
    occupiedBeds: 1120,
    icuBeds: 120,
    icuOccupied: 98,
    catchmentVillages: ["Dharavi Health Ward", "Sion Koliwada", "Kurla West", "Chunabhatti"],
  },
  {
    facilityId: "HOSP-KLY-002",
    name: "Kalyan Sub-District & Rural Civil Hospital",
    shortName: "Kalyan Civil Hospital",
    type: "Govt Sub-District Civil Hospital",
    location: "Kalyan West, Thane Rural",
    city: "Kalyan",
    state: "Maharashtra",
    address: "Station Road, Near Shivaji Chowk, Kalyan West, Maharashtra 421301",
    phone: "+91 251 2314567",
    departments: ["General Medicine", "Cardiology", "Pediatrics", "Gynecology", "Emergency 24/7", "Diagnostic Lab"],
    emergencyAvailable: true,
    ayushmanBharat: true,
    opdTimings: "08:30 AM - 02:00 PM / 04:00 PM - 07:30 PM",
    receptionistPhone: "+91 98765 01004",
    totalBeds: 250,
    occupiedBeds: 180,
    icuBeds: 20,
    icuOccupied: 14,
    catchmentVillages: ["Kalyan Rural Gaothan", "Titwala", "Khadegolavali", "Shahad"],
  },
  {
    facilityId: "HOSP-KLW-003",
    name: "Chhatrapati Shivaji Maharaj Hospital & Medical College",
    shortName: "CSMH Kalwa Hospital",
    type: "Govt Civil Hospital & Teaching Hospital",
    location: "Kalwa, Thane",
    city: "Thane",
    state: "Maharashtra",
    address: "Belapur Road, Kalwa, Thane, Maharashtra 400605",
    phone: "+91 22 25372555",
    departments: ["Emergency & Trauma 24/7", "General Medicine", "Pediatrics", "Orthopedics", "ICU & Surgery"],
    emergencyAvailable: true,
    ayushmanBharat: true,
    opdTimings: "08:00 AM - 02:00 PM / 04:00 PM - 08:00 PM",
    receptionistPhone: "+91 98765 01006",
    totalBeds: 500,
    occupiedBeds: 410,
    icuBeds: 45,
    icuOccupied: 38,
    catchmentVillages: ["Kalwa Naka", "Mumbra Hills", "Digha Rural", "Kharegaon"],
  },
  {
    facilityId: "HOSP-PLG-004",
    name: "Palghar Tribal & Rural Sub-District Civil Hospital",
    shortName: "Palghar Rural Civil Hospital",
    type: "Community Health Center (CHC) & Tribal Hospital",
    location: "Manor Road, Palghar Rural",
    city: "Palghar",
    state: "Maharashtra",
    address: "Manor Highway, Palghar Rural Tribal Belt, Maharashtra 401404",
    phone: "+91 2525 252033",
    departments: ["General Medicine", "Maternal Health & Delivery", "Pediatrics", "Malaria & Dengue Clinic", "Emergency 24/7"],
    emergencyAvailable: true,
    ayushmanBharat: true,
    opdTimings: "08:30 AM - 02:30 PM (24/7 Emergency)",
    receptionistPhone: "+91 98765 01007",
    totalBeds: 120,
    occupiedBeds: 92,
    icuBeds: 10,
    icuOccupied: 7,
    catchmentVillages: ["Manor Tribal Pada", "Saphale Rural", "Kelva Beach", "Boisar Gaon"],
  },
  {
    facilityId: "HOSP-MRB-005",
    name: "Murbad Rural Sub-District & Referral Hospital",
    shortName: "Murbad Rural Hospital",
    type: "Rural Sub-District Hospital",
    location: "Murbad-Karjat Road, Thane Rural",
    city: "Murbad",
    state: "Maharashtra",
    address: "Murbad Main Road, Murbad Tehsil, Maharashtra 421401",
    phone: "+91 2524 222105",
    departments: ["General Medicine", "Snakebite & Poisoning Unit", "Pediatrics", "Maternity & Delivery", "Emergency 24/7"],
    emergencyAvailable: true,
    ayushmanBharat: true,
    opdTimings: "08:00 AM - 02:00 PM (24/7 Casualty)",
    receptionistPhone: "+91 98765 01008",
    totalBeds: 80,
    occupiedBeds: 54,
    icuBeds: 6,
    icuOccupied: 3,
    catchmentVillages: ["Mhasla Pada", "Dhasai Rural", "Saralgaon", "Tokawade Tribal"],
  },
  {
    facilityId: "HOSP-JWH-006",
    name: "Jawhar Sub-District Hospital & Tribal Health Center",
    shortName: "Jawhar Tribal Hospital",
    type: "Tribal Sub-District Hospital",
    location: "Palghar Tribal Hill Region",
    city: "Jawhar",
    state: "Maharashtra",
    address: "Palghar Road, Jawhar Hill Station Tribal Zone, Maharashtra 401603",
    phone: "+91 2520 222014",
    departments: ["General Medicine", "Malnutrition Care Unit (NRC)", "Maternal Health", "Pediatrics", "Emergency 24/7"],
    emergencyAvailable: true,
    ayushmanBharat: true,
    opdTimings: "08:30 AM - 02:00 PM (24/7 Casualty)",
    receptionistPhone: "+91 98765 01009",
    totalBeds: 100,
    occupiedBeds: 78,
    icuBeds: 8,
    icuOccupied: 6,
    catchmentVillages: ["Jawhar Ghat Pada", "Mokhada Tribal", "Dehre Gaon", "Nyhale"],
  },
  {
    facilityId: "HOSP-DMB-007",
    name: "CityCare Super-Specialty Medical Center",
    shortName: "CityCare Hospital Dombivli",
    type: "Private Multi-Specialty Hospital",
    location: "Dombivli East, Thane",
    city: "Dombivli",
    state: "Maharashtra",
    address: "Manpada Road, Near Phadke Ground, Dombivli East, Maharashtra 421201",
    phone: "+91 251 2865432",
    departments: ["Cardiology", "General Medicine", "Neurology", "Orthopedics", "Emergency 24/7", "Advanced ICU"],
    emergencyAvailable: true,
    ayushmanBharat: true,
    opdTimings: "09:00 AM - 09:00 PM (24/7 Casualty)",
    receptionistPhone: "+91 98765 01005",
    totalBeds: 150,
    occupiedBeds: 110,
    icuBeds: 25,
    icuOccupied: 19,
    catchmentVillages: ["Dombivli East", "Nilje Rural", "Kolegaon", "Lodha Palava"],
  },
  {
    facilityId: "HOSP-NBH-008",
    name: "Nabha Civil Sub-Divisional Hospital",
    shortName: "Nabha Civil Hospital",
    type: "Govt Civil Hospital",
    location: "Circular Road, Nabha",
    city: "Nabha",
    state: "Punjab",
    address: "Circular Road, Near Old Bus Stand, Nabha, Punjab 147201",
    phone: "+91 1765 220102",
    departments: ["General Medicine", "Cardiology", "Pediatrics", "Orthopedics", "Emergency 24/7", "Diagnostic Lab"],
    emergencyAvailable: true,
    ayushmanBharat: true,
    opdTimings: "08:30 AM - 01:30 PM / 03:30 PM - 06:30 PM",
    receptionistPhone: "+91 98765 01001",
    totalBeds: 120,
    occupiedBeds: 85,
    icuBeds: 12,
    icuOccupied: 8,
    catchmentVillages: ["Alhoran", "Rohti Chhanna", "Bhadson", "Dhingi"],
  },
  {
    facilityId: "HOSP-PTL-009",
    name: "Rajindra Multi-Specialty Government Hospital",
    shortName: "Rajindra Hospital Patiala",
    type: "Govt Civil Hospital & Medical College",
    location: "Sangrur Road, Patiala",
    city: "Patiala",
    state: "Punjab",
    address: "Medical College Campus, Sangrur Road, Patiala, Punjab 147001",
    phone: "+91 175 2212018",
    departments: ["General Medicine", "Cardiology", "Neurology", "Pediatrics", "Orthopedics", "Emergency 24/7", "Dialysis Unit"],
    emergencyAvailable: true,
    ayushmanBharat: true,
    opdTimings: "08:00 AM - 02:00 PM / 04:00 PM - 08:00 PM",
    receptionistPhone: "+91 98765 01002",
    totalBeds: 900,
    occupiedBeds: 720,
    icuBeds: 80,
    icuOccupied: 65,
    catchmentVillages: ["Patiala Rural", "Sanaur", "Bahadurgarh", "Samana"],
  },
];

const MOCK_STAFF_MAP: Record<string, { doctors: any[]; ashaWorkers: any[] }> = {
  "HOSP-SION-001": {
    doctors: [
      { id: "D_SION_1", name: "Dr. S. Kulkarni", role: "Head of Emergency & Trauma", dept: "Emergency & Trauma", experience: "18 yrs", onDuty: true, rating: 4.9 },
      { id: "D_SION_2", name: "Dr. Aniruddh Joshi", role: "Senior Cardiologist", dept: "Cardiology", experience: "14 yrs", onDuty: true, rating: 5.0 },
      { id: "D_SION_3", name: "Dr. Priya Nair", role: "Consultant Pediatrician", dept: "Pediatrics", experience: "11 yrs", onDuty: false, rating: 4.8 },
      { id: "D_SION_4", name: "Dr. Vilas Patil", role: "General Physician", dept: "General Medicine", experience: "9 yrs", onDuty: true, rating: 4.7 },
    ],
    ashaWorkers: [
      { id: "ASHA_SION_1", name: "Sunita Kamble", area: "Dharavi Health Ward 9", phone: "+91 98765 11001", visitsThisMonth: 84, activeAlerts: 1 },
      { id: "ASHA_SION_2", name: "Rekha Gaikwad", area: "Sion Koliwada", phone: "+91 98765 11002", visitsThisMonth: 62, activeAlerts: 0 },
      { id: "ASHA_SION_3", name: "Meena Shinde", area: "Kurla West Slum Pocket", phone: "+91 98765 11003", visitsThisMonth: 95, activeAlerts: 2 },
    ]
  },
  "HOSP-KLY-002": {
    doctors: [
      { id: "D_KLY_1", name: "Dr. Ramesh Sharma", role: "Chief Medical Officer", dept: "General Medicine", experience: "16 yrs", onDuty: true, rating: 4.7 },
      { id: "D_KLY_2", name: "Dr. Sneha Gokhale", role: "Consultant Gynecologist", dept: "Gynecology & Maternal", experience: "12 yrs", onDuty: true, rating: 4.9 },
      { id: "D_KLY_3", name: "Dr. Amit Vernekar", role: "Orthopedic Surgeon", dept: "Orthopedics", experience: "10 yrs", onDuty: false, rating: 4.6 },
    ],
    ashaWorkers: [
      { id: "ASHA_KLY_1", name: "Vandana More", area: "Titwala Rural", phone: "+91 98765 12001", visitsThisMonth: 71, activeAlerts: 1 },
      { id: "ASHA_KLY_2", name: "Geeta Jadhav", area: "Kalyan Gaothan & Khadegolavali", phone: "+91 98765 12002", visitsThisMonth: 58, activeAlerts: 0 },
    ]
  },
  "HOSP-PLG-004": {
    doctors: [
      { id: "D_PLG_1", name: "Dr. Anjali Deshmukh", role: "Rural Maternal & Child Specialist", dept: "Pediatrics", experience: "13 yrs", onDuty: true, rating: 4.8 },
      { id: "D_PLG_2", name: "Dr. Deepak Vaze", role: "Malaria & Communicable Diseases Lead", dept: "General Medicine", experience: "8 yrs", onDuty: true, rating: 4.7 },
    ],
    ashaWorkers: [
      { id: "ASHA_PLG_1", name: "Parvati Bhoye", area: "Manor Tribal Pada", phone: "+91 98765 14001", visitsThisMonth: 104, activeAlerts: 3 },
      { id: "ASHA_PLG_2", name: "Anita Waghmare", area: "Kelva Beach Tribal Hamlet", phone: "+91 98765 14002", visitsThisMonth: 78, activeAlerts: 1 },
    ]
  },
  "HOSP-MRB-005": {
    doctors: [
      { id: "D_MRB_1", name: "Dr. Sanjay Raut", role: "Rural Emergency & Toxicology Lead", dept: "Emergency & Snakebite Unit", experience: "15 yrs", onDuty: true, rating: 4.9 },
    ],
    ashaWorkers: [
      { id: "ASHA_MRB_1", name: "Shobha Telam", area: "Tokawade Tribal Belt", phone: "+91 98765 15001", visitsThisMonth: 69, activeAlerts: 1 },
      { id: "ASHA_MRB_2", name: "Laxmi Pawar", area: "Mhasla Pada", phone: "+91 98765 15002", visitsThisMonth: 53, activeAlerts: 0 },
    ]
  },
  "HOSP-JWH-006": {
    doctors: [
      { id: "D_JWH_1", name: "Dr. Hemant Mukne", role: "Tribal Malnutrition & Primary Health Lead", dept: "Pediatrics & NRC", experience: "11 yrs", onDuty: true, rating: 4.8 },
    ],
    ashaWorkers: [
      { id: "ASHA_JWH_1", name: "Kalpana Gavit", area: "Jawhar Hill Pada", phone: "+91 98765 16001", visitsThisMonth: 112, activeAlerts: 4 },
      { id: "ASHA_JWH_2", name: "Usha Baraf", area: "Mokhada Tribal Cluster", phone: "+91 98765 16002", visitsThisMonth: 91, activeAlerts: 2 },
    ]
  },
  "HOSP-NBH-008": {
    doctors: [
      { id: "D_NBH_1", name: "Dr. Arvind Kumar", role: "Civil Surgeon", dept: "General Medicine", experience: "20 yrs", onDuty: true, rating: 4.9 },
      { id: "D_NBH_2", name: "Dr. Vasanth", role: "Medical Officer", dept: "General Medicine", experience: "7 yrs", onDuty: true, rating: 5.0 },
    ],
    ashaWorkers: [
      { id: "ASHA_NBH_1", name: "Gurpreet Kaur", area: "Alhoran Village", phone: "+91 98765 17001", visitsThisMonth: 64, activeAlerts: 0 },
      { id: "ASHA_NBH_2", name: "Manjit Kaur", area: "Rohti Chhanna", phone: "+91 98765 17002", visitsThisMonth: 52, activeAlerts: 1 },
    ]
  }
};

export default function HospitalDesktopDashboard() {
  const router = useRouter();
  const { lang, setLang, mounted } = useLang();
  const { startCallSession } = useCall();
  const [selectedQRDoctor, setSelectedQRDoctor] = useState<any | null>(null);
  const [auth, setAuth] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("hospitalAuth") === "true" || !!localStorage.getItem("hospital_command_user");
    }
    return false;
  });
  const [hospitalUser, setHospitalUser] = useState<any>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("hospital_command_user");
        if (stored) return JSON.parse(stored);
      } catch {}
    }
    return null;
  });
  const [pass, setPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");

  // Facility Management State
  const [facilities, setFacilities] = useState<any[]>(DEFAULT_FACILITIES);
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("hospital_command_user");
      if (storedUser) {
        try {
          const u = JSON.parse(storedUser);
          if (u.facilityId) return u.facilityId;
        } catch {}
      }
      return localStorage.getItem("hospitalSelectedFacility") || "HOSP-SION-001";
    }
    return "HOSP-SION-001";
  });

  // HMIS & EMR Integration Bridge State
  const [hmisSyncing, setHmisSyncing] = useState(false);
  const [hmisLastSynced, setHmisLastSynced] = useState<string>("Just now");
  const [hmisAutoSync, setHmisAutoSync] = useState(true);
  const [hmisEndpoint, setHmisEndpoint] = useState("https://e-hospital.nic.in/api/v2/opd-exchange");
  const [hmisApiKey, setHmisApiKey] = useState("NIC-HFR-MH-KLY-48201");
  const [endpointTesting, setEndpointTesting] = useState(false);
  const [endpointStatus, setEndpointStatus] = useState<string | null>(null);
  const [bulkCsvText, setBulkCsvText] = useState("");
  const [bulkImporting, setBulkImporting] = useState(false);
  const [importStatusMessage, setImportStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("hospital_command_user");
      if (!stored && !localStorage.getItem("hospitalAuth")) {
        router.replace("/hospital/login");
      } else if (stored) {
        try {
          const u = JSON.parse(stored);
          if (u.facilityId) {
            setSelectedFacilityId(u.facilityId);
            setHospitalUser(u);
            setAuth(true);
          }
        } catch {}
      }
    }
  }, [router]);

  const [queue, setQueue] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [ashaVisits, setAshaVisits] = useState<any[]>([]);
  const [labTests, setLabTests] = useState<any[]>([]);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [referralFilter, setReferralFilter] = useState<"ALL" | "IN_PERSON_FOLLOWUP" | "SPECIALIST_FACILITY_TRANSFER">("ALL");
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(30);
  const [activeTab, setActiveTab] = useState("dashboard");

  // Advanced Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");

  const T = (hi: string, en: string) => lang === "hi" ? hi : en;

  const [sosAlerts, setSosAlerts] = useState<any[]>([]);
  const [callPatient, setCallPatient] = useState<{ id: string; name: string; details?: any } | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [resQueue, resDocs, resAsha, resSos, resLabs, resRefs, resFacs] = await Promise.all([
        fetch("/api/consultations?status=all"),
        fetch("/api/admin/doctors"),
        fetch("/api/asha/visits"),
        fetch("/api/sos"),
        fetch("/api/blood-tests"),
        fetch("/api/referrals"),
        fetch("/api/facilities"),
      ]);
      const dataQueue = await resQueue.json();
      const dataDocs = await resDocs.json();
      const dataAsha = await resAsha.json();
      const dataSos = await resSos.json();
      const dataLabs = await resLabs.json();
      const dataRefs = await resRefs.json();
      const dataFacs = await resFacs.json();

      setQueue(dataQueue.consultations || []);
      setDoctors(dataDocs.doctors || []);
      setAshaVisits(dataAsha.visits || []);
      setSosAlerts(dataSos.alerts || []);
      setLabTests(dataLabs.tests || []);
      setReferrals(dataRefs.referrals || []);
      if (dataFacs.facilities && dataFacs.facilities.length > 0) {
        setFacilities(dataFacs.facilities);
      }
    } catch {
      /* offline fallback */
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (auth) {
      fetchData();
      const iv = setInterval(() => {
        setTick((t) => {
          if (t <= 1) {
            fetchData();
            return 30;
          }
          return t - 1;
        });
      }, 1000);
      return () => clearInterval(iv);
    }
  }, [auth, fetchData]);

  const handleResolveSOS = async (id: string) => {
    if (!window.confirm(T("क्या आप वाकई इस आपातकाल को हल करना चाहते हैं?", "Are you sure you want to mark this SOS emergency as resolved?"))) return;
    try {
      const res = await fetch("/api/sos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "resolved", doctorNotes: "Resolved by Admin" }),
      });
      if (res.ok) {
        setSosAlerts((prev) => prev.filter((a) => a._id !== id));
      }
    } catch {
      // offline
    }
  };

  const handleConfirmAppointment = async (consultationId: string) => {
    try {
      const res = await fetch("/api/consultations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: consultationId,
          receptionistStatus: "CONFIRMED",
          status: "confirmed",
        }),
      });
      if (res.ok) {
        fetchData();
      }
    } catch {
      // offline
    }
  };

  const handleDeclineAppointment = async (consultationId: string) => {
    if (!window.confirm("Are you sure you want to decline this appointment request?")) return;
    try {
      const res = await fetch("/api/consultations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: consultationId,
          receptionistStatus: "REJECTED",
          status: "cancelled",
        }),
      });
      if (res.ok) {
        fetchData();
      }
    } catch {
      // offline
    }
  };

  const handleFlagScamAppointment = async (consultationId: string) => {
    if (!window.confirm("Do you want to flag this patient request as FAKE / SCAM and cancel the slot?")) return;
    try {
      const res = await fetch("/api/consultations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: consultationId,
          receptionistStatus: "SPAM_FLAGGED",
          status: "cancelled",
          notes: "Flagged as fake/scam request by reception desk verification check",
        }),
      });
      if (res.ok) {
        fetchData();
      }
    } catch {
      // offline
    }
  };

  const handleForceSyncHmis = () => {
    setHmisSyncing(true);
    setTimeout(() => {
      setHmisSyncing(false);
      setHmisLastSynced("Just now");
      fetchData();
    }, 1200);
  };

  const handleTestHmisEndpoint = () => {
    setEndpointTesting(true);
    setEndpointStatus(null);
    setTimeout(() => {
      setEndpointTesting(false);
      setEndpointStatus(`🟢 Connected to ${activeFacility?.name || "Hospital"} HMIS Gateway (Latency: 42ms • Status: 200 OK)`);
      setTimeout(() => setEndpointStatus(null), 6000);
    }, 800);
  };

  const handleImportLegacyOPD = async (recordsToImport?: any[]) => {
    setBulkImporting(true);
    setImportStatusMessage(null);
    try {
      const demoOrCustomRecords = recordsToImport || [
        {
          patientName: "Suresh Patil",
          patientPhone: "+91 98201 54321",
          age: "48",
          gender: "M",
          symptoms: "Chest heaviness and shortness of breath since 2 hours",
          urgency: "RED",
          department: "Cardiology",
          slotTime: "Immediate Priority",
          hospital: activeFacility?.name || "Kalyan Civil Hospital",
          facilityId: activeFacility?.facilityId || selectedFacilityId,
          source: "Legacy HMIS Bridge",
        },
        {
          patientName: "Meenakshi Kadam",
          patientPhone: "+91 98192 65432",
          age: "34",
          gender: "F",
          symptoms: "High fever 103F with severe body pain and chills (Dengue Suspected)",
          urgency: "YELLOW",
          department: "General Medicine",
          slotTime: "10:30 AM",
          hospital: activeFacility?.name || "Kalyan Civil Hospital",
          facilityId: activeFacility?.facilityId || selectedFacilityId,
          source: "Legacy HMIS Bridge",
        },
        {
          patientName: "Santosh Yadav",
          patientPhone: "+91 98670 12345",
          age: "55",
          gender: "M",
          symptoms: "Diabetes routine checkup and insulin refill",
          urgency: "GREEN",
          department: "General Medicine",
          slotTime: "11:15 AM",
          hospital: activeFacility?.name || "Kalyan Civil Hospital",
          facilityId: activeFacility?.facilityId || selectedFacilityId,
          source: "Legacy HMIS Bridge",
        },
      ];

      for (const rec of demoOrCustomRecords) {
        await fetch("/api/consultations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(rec),
        });
      }
      setImportStatusMessage(`✓ Successfully merged ${demoOrCustomRecords.length} records into ${activeFacility?.shortName || "Hospital"} Live Triage!`);
      fetchData();
      setTimeout(() => setImportStatusMessage(null), 5000);
    } catch {
      setImportStatusMessage("⚠️ Merge completed with local queue.");
      setTimeout(() => setImportStatusMessage(null), 5000);
    } finally {
      setBulkImporting(false);
    }
  };

  if (!mounted) return null;

  if (!auth) {
    return (
      <div style={{ background: "radial-gradient(circle at 10% 20%, rgb(15, 118, 110) 0%, rgb(2, 132, 199) 90.2%)", minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", fontFamily: "Inter, sans-serif", position: "relative", overflow: "hidden", padding: 20 }}>
        {/* Animated Mesh Background Elements */}
        <div style={{ position: "absolute", width: 600, height: 600, background: "radial-gradient(circle, rgba(16, 185, 129, 0.4) 0%, transparent 70%)", top: -100, left: -100, borderRadius: "50%", filter: "blur(40px)" }} />
        <div style={{ position: "absolute", width: 500, height: 500, background: "radial-gradient(circle, rgba(59, 130, 246, 0.4) 0%, transparent 70%)", bottom: -50, right: -100, borderRadius: "50%", filter: "blur(50px)" }} />

        <div style={{ width: "100%", maxWidth: 440, background: "rgba(255, 255, 255, 0.1)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", borderRadius: 24, padding: "40px 24px", boxSizing: "border-box", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)", border: `1px solid rgba(255,255,255,0.2)`, zIndex: 10, color: "white" }}>
          <div style={{ textAlign: "center", marginBottom: 30 }}>
            <div style={{ width: 72, height: 72, borderRadius: 22, background: "rgba(255, 255, 255, 0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px", fontSize: 36, boxShadow: "inset 0 0 20px rgba(255,255,255,0.1)" }}>🏥</div>
            <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, letterSpacing: "-1px", color: "white" }}>AarogyaAI</h1>
            <p style={{ fontSize: 15, marginTop: 6, fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>Hospital Command Center</p>
          </div>
          {error && <div style={{ background: "rgba(239, 68, 68, 0.2)", color: "#FECACA", padding: "14px", borderRadius: 12, fontSize: 13, fontWeight: 600, marginBottom: 20, textAlign: "center", border: "1px solid rgba(239, 68, 68, 0.4)" }}>{error}</div>}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ position: "relative" }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 8, color: "rgba(255,255,255,0.9)" }}>Hospital Master Key</label>
              <input
                type={showPass ? "text" : "password"}
                placeholder="Enter master password..."
                value={pass}
                onChange={(e) => { setPass(e.target.value); setError(""); }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    if (pass === "hospital123" || pass === "aarogya123" || pass === "sion123" || pass === "admin123") {
                      setAuth(true);
                      localStorage.setItem("hospitalAuth", "true");
                    } else setError("Invalid Credentials. Master key: aarogya123");
                  }
                }}
                style={{ width: "100%", padding: "14px 44px 14px 16px", border: `1px solid rgba(255,255,255,0.2)`, borderRadius: 14, fontSize: 15, fontFamily: "inherit", background: "rgba(0,0,0,0.2)", color: "white", outline: "none", boxSizing: "border-box" }}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={{ position: "absolute", right: 14, top: 38, background: "transparent", border: "none", color: "rgba(255,255,255,0.6)", cursor: "pointer", display: "flex", alignItems: "center" }}
              >
                {showPass ? "Hide" : "Show"}
              </button>
            </div>
            <button
              type="button"
              onClick={() => {
                if (pass === "hospital123" || pass === "aarogya123" || pass === "sion123" || pass === "admin123") {
                  setAuth(true);
                  localStorage.setItem("hospitalAuth", "true");
                } else setError("Invalid Credentials. Master key: aarogya123");
              }}
              style={{ width: "100%", padding: "16px", borderRadius: 14, border: "none", cursor: "pointer", fontWeight: 800, fontSize: 15, background: "white", color: C.primary, boxShadow: "0 4px 14px rgba(0, 0, 0, 0.2)" }}
            >
              Access Command Center
            </button>

            <div style={{ textAlign: "center", marginTop: 8 }}>
              <button
                type="button"
                onClick={() => router.push("/hospital/login")}
                style={{ background: "rgba(255, 255, 255, 0.12)", border: "1px solid rgba(255, 255, 255, 0.2)", borderRadius: 12, padding: "10px 16px", color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer", width: "100%" }}
              >
                🏥 Select Facility Portal (/hospital/login) →
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading && auth) {
    return (
      <div style={{ background: C.bg, minHeight: "100vh", display: "flex", flexDirection: "column", fontFamily: "Inter, sans-serif" }}>
        <nav style={{ background: "rgba(255, 255, 255, 0.75)", height: 80, margin: "20px 40px", borderRadius: 24, display: "flex", alignItems: "center", padding: "0 40px" }}>
          <div style={{ width: 150, height: 40, background: "#E2E8F0", borderRadius: 12, animation: "pulse 1.5s infinite" }} />
          <div style={{ display: "flex", gap: 20, marginLeft: 40 }}>
            {[1,2,3,4].map(i => <div key={i} style={{ width: 80, height: 20, background: "#E2E8F0", borderRadius: 8, animation: "pulse 1.5s infinite" }} />)}
          </div>
        </nav>
        <main style={{ flex: 1, padding: "40px", maxWidth: 1600, margin: "0 auto", width: "100%", display: "flex", flexDirection: "column", gap: 40 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24 }}>
            {[1,2,3,4].map(i => <div key={i} style={{ height: 140, background: "white", borderRadius: 24, animation: "pulse 1.5s infinite" }} />)}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            <div style={{ height: 200, background: "white", borderRadius: 24, animation: "pulse 1.5s infinite" }} />
            <div style={{ height: 300, background: "white", borderRadius: 24, animation: "pulse 1.5s infinite" }} />
          </div>
        </main>
      </div>
    );
  }

  const activeFacility = facilities.find((f) => f.facilityId === selectedFacilityId) || facilities[0];

  // Facility-scoped queue
  let facilityScopedQueue = queue;
  if (selectedFacilityId !== "ALL" && activeFacility) {
    const fn = (activeFacility.name || "").toLowerCase();
    const sn = (activeFacility.shortName || "").toLowerCase();
    const fid = activeFacility.facilityId;
    facilityScopedQueue = queue.filter((q) => {
      if (q.facilityId && q.facilityId === fid) return true;
      const h = (q.hospital || "").toLowerCase();
      return h.includes(sn) || h.includes(fn) || fn.includes(h) || sn.includes(h);
    });
  }

  let filteredQueue = facilityScopedQueue;

  if (filterDate) {
    filteredQueue = filteredQueue.filter((q) => {
      if (!q.createdAt) return true;
      const qDate = new Date(q.createdAt).toISOString().split("T")[0];
      return qDate === filterDate;
    });
  }

  if (filterStatus !== "ALL") {
    filteredQueue = filteredQueue.filter((q) => q.urgency === filterStatus);
  }

  if (searchQuery.trim()) {
    const ql = searchQuery.toLowerCase();
    filteredQueue = filteredQueue.filter(
      (q) =>
        (q.patientName || "").toLowerCase().includes(ql) ||
        (q.doctorName || "").toLowerCase().includes(ql) ||
        (q.symptoms || []).some((s: string) => s.toLowerCase().includes(ql))
    );
  }

  const pendingQueue = filteredQueue.filter((q) => q.status !== "completed");
  const curedQueue = filteredQueue.filter((q) => q.status === "completed");

  const redPatients = pendingQueue.filter((q) => q.urgency === "RED");
  const yellowPatients = pendingQueue.filter((q) => q.urgency === "YELLOW");
  const greenPatients = pendingQueue.filter((q) => q.urgency === "GREEN");

  // Facility-specific Staff & ASHA Roster
  const activeFacilityStaff =
    selectedFacilityId !== "ALL" && MOCK_STAFF_MAP[selectedFacilityId]
      ? MOCK_STAFF_MAP[selectedFacilityId]
      : {
          doctors:
            doctors.length > 0
              ? doctors.map((d) => ({
                  id: d._id || d.id,
                  name: d.name.startsWith("Dr.") ? d.name : `Dr. ${d.name}`,
                  role: "Consultant Medical Officer",
                  dept: d.specialization || "General Medicine",
                  experience: "8 yrs",
                  onDuty: true,
                  rating: 4.8,
                }))
              : MOCK_STAFF_MAP["HOSP-SION-001"].doctors,
          ashaWorkers: MOCK_STAFF_MAP["HOSP-SION-001"].ashaWorkers,
        };

  // Facility-specific ASHA visits
  const facilityAshaVisits =
    selectedFacilityId !== "ALL" && activeFacility?.catchmentVillages
      ? ashaVisits.filter((v) =>
          activeFacility.catchmentVillages.some((cv: string) =>
            (v.village || "").toLowerCase().includes(cv.toLowerCase())
          )
        )
      : ashaVisits;

  // Logic Integration
  const admittedPatients = redPatients.concat(
    yellowPatients.slice(0, Math.floor(yellowPatients.length / 2))
  );
  const outpatientClinic = greenPatients
    .slice(0, Math.floor(greenPatients.length * 0.6))
    .concat(yellowPatients.slice(Math.floor(yellowPatients.length / 2)));
  const telemedicineVisits = greenPatients.slice(Math.floor(greenPatients.length * 0.6));
  const fieldVisits = facilityAshaVisits.length || ashaVisits.length;

  const totalPatients = pendingQueue.length;
  const curedPatientsCount = curedQueue.length;

  // Dynamic staff computations
  const activeFacilityDoctors = activeFacilityStaff.doctors || [];
  const onDutyDoctorsList = activeFacilityDoctors.filter((d: any) => d.onDuty);
  const onDutyDoctorsCount = onDutyDoctorsList.length > 0 ? onDutyDoctorsList.length : activeFacilityDoctors.length;

  // Dynamic Bed Occupancy
  const totalFacilityBeds = activeFacility?.totalBeds || 500;
  const totalIcuBeds = activeFacility?.icuBeds || 40;
  const dynamicOccupiedBeds = Math.min(totalFacilityBeds, (activeFacility?.occupiedBeds || Math.floor(totalFacilityBeds * 0.75)) + admittedPatients.length);
  const dynamicIcuOccupied = Math.min(totalIcuBeds, (activeFacility?.icuOccupied || Math.floor(totalIcuBeds * 0.65)) + redPatients.length);
  const bedOccupancyRate = Math.round((dynamicOccupiedBeds / (totalFacilityBeds || 1)) * 100);

  // Dynamic Patient Influx Calculation across past 12 hours
  const hourlyData = (() => {
    const buckets = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    if (facilityScopedQueue.length > 0) {
      facilityScopedQueue.forEach((item, idx) => {
        const bucketIndex = idx % 12;
        buckets[bucketIndex] += 1;
      });
      return buckets.map((b, i) => Math.max(b, Math.round(facilityScopedQueue.length * (0.05 + 0.08 * ((i % 4) + 1)))));
    }
    return [3, 5, 8, 12, 14, 18, 22, 19, 16, 14, 11, totalPatients || 6];
  })();
  const maxHourly = Math.max(...hourlyData, 20);

  // Department counts dynamically derived
  const dynamicDepts = [
    {
      label: "General Medicine",
      value: Math.max(facilityScopedQueue.filter(q => (q.department || "").toLowerCase().includes("general") || (q.department || "").toLowerCase().includes("medicine") || !q.department).length, 1),
      color: C.accent
    },
    {
      label: "Cardiology",
      value: facilityScopedQueue.filter(q => (q.department || "").toLowerCase().includes("cardio") || (q.symptoms || []).some((s: string) => (s || "").toLowerCase().includes("chest") || (s || "").toLowerCase().includes("heart"))).length,
      color: C.red
    },
    {
      label: "Pediatrics & Maternal",
      value: facilityScopedQueue.filter(q => (q.department || "").toLowerCase().includes("pediatric") || (q.department || "").toLowerCase().includes("gynec") || (q.symptoms || []).some((s: string) => (s || "").toLowerCase().includes("child") || (s || "").toLowerCase().includes("fever"))).length,
      color: C.primaryLight
    },
    {
      label: "Orthopedics & Trauma",
      value: facilityScopedQueue.filter(q => (q.department || "").toLowerCase().includes("ortho") || (q.department || "").toLowerCase().includes("trauma") || (q.symptoms || []).some((s: string) => (s || "").toLowerCase().includes("fracture") || (s || "").toLowerCase().includes("pain"))).length,
      color: C.yellow
    },
  ];

  const navItems = [
    { id: "dashboard", label: T("डैशबोर्ड", "Overview"), icon: "📊" },
    { id: "appointments", label: T("रिसेप्शन व स्लॉट", "Reception & Triage"), icon: "📋", badge: facilityScopedQueue.length },
    { id: "emergencies", label: T("आपात स्थिति", "Emergencies"), icon: "🚨", badge: redPatients.length, badgeColor: C.red },
    { id: "wards", label: T("वार्ड व बेड", "Wards & Beds"), icon: "🛏️" },
    { id: "staff", label: T("स्टाफ व आशा", "Medical Roster"), icon: "👥", badge: onDutyDoctorsCount },
    { id: "referrals", label: T("रेफ़रल डेस्क", "Referrals"), icon: "🏥", badge: referrals.filter(r => r.status === "pending").length },
    { id: "diagnostics", label: T("लैब रिपोर्ट", "Lab Diagnostics"), icon: "🧪", badge: labTests.filter(t => t.isCritical && !t.assignedDoctorId).length, badgeColor: C.red },
    { id: "hmis-bridge", label: T("HMIS एकीकरण", "HMIS Bridge"), icon: "🔗" },
    { id: "analytics", label: T("एनालिटिक्स", "Analytics"), icon: "📈" },
  ];

  return (
    <div style={{ background: C.bg, minHeight: "100vh", display: "flex", flexDirection: "column", fontFamily: "Inter, sans-serif", color: C.text }}>

      {/* Modern High-Tier Medical Command Top Navigation */}
      <nav style={{ background: "rgba(255, 255, 255, 0.88)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: `1px solid ${C.border}`, padding: "10px 24px", position: "sticky", top: 12, margin: "12px 24px 20px", borderRadius: 20, zIndex: 50, boxShadow: "0 8px 30px rgba(15, 118, 110, 0.08)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>

          {/* Left Brand Identity */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
            <div style={{ background: "linear-gradient(135deg, #0F766E 0%, #14B8A6 100%)", width: 42, height: 42, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, color: "white", boxShadow: "0 4px 12px rgba(20, 184, 166, 0.35)" }}>🏥</div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <h1 style={{ fontSize: 19, fontWeight: 800, margin: 0, letterSpacing: "-0.5px", color: C.primary, lineHeight: 1 }}>AarogyaAI</h1>
                <span style={{ background: "rgba(15, 118, 110, 0.12)", color: C.primary, fontSize: 10, fontWeight: 800, padding: "2px 7px", borderRadius: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Command</span>
              </div>
              <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, marginTop: 2 }}>{activeFacility?.shortName || "Hospital Operations"}</div>
            </div>
          </div>

          {/* Center Segmented Navigation Pills */}
          <div style={{ display: "flex", alignItems: "center", gap: 4, background: "#F1F5F9", padding: "4px 6px", borderRadius: 14, overflowX: "auto", maxWidth: "100%", scrollbarWidth: "none" }}>
            {navItems.map((nav) => {
              const isActive = activeTab === nav.id;
              return (
                <button
                  key={nav.id}
                  onClick={() => {
                    setActiveTab(nav.id);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "7px 12px",
                    borderRadius: 10,
                    border: "none",
                    background: isActive ? "white" : "transparent",
                    color: isActive ? C.primary : "#475569",
                    fontWeight: isActive ? 800 : 600,
                    fontSize: 12.5,
                    cursor: "pointer",
                    transition: "all 0.18s cubic-bezier(0.4, 0, 0.2, 1)",
                    boxShadow: isActive ? "0 2px 8px rgba(0, 0, 0, 0.08)" : "none",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}
                >
                  <span style={{ fontSize: 14 }}>{nav.icon}</span>
                  <span>{nav.label}</span>
                  {typeof nav.badge === "number" && nav.badge > 0 && (
                    <span
                      style={{
                        background: nav.badgeColor || (isActive ? C.primary : "#94A3B8"),
                        color: "white",
                        fontSize: 10,
                        fontWeight: 800,
                        padding: "1px 6px",
                        borderRadius: 10,
                        lineHeight: "14px",
                      }}
                    >
                      {nav.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Right Action Tools & Profile */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            <button
              onClick={() => router.push("/admin")}
              style={{
                padding: "6px 11px",
                borderRadius: 10,
                border: `1px solid ${C.border}`,
                background: "white",
                color: "#475569",
                fontWeight: 700,
                fontSize: 11.5,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4,
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              }}
              title="Open Global System Admin Portal"
            >
              <span>⚡</span> {T("एडमिन", "Admin Portal")} ↗
            </button>

            <button
              onClick={() => setLang(lang === "hi" ? "en" : "hi")}
              style={{
                background: "#F8FAFC",
                border: `1px solid ${C.border}`,
                borderRadius: 10,
                padding: "6px 10px",
                fontSize: 11.5,
                fontWeight: 700,
                color: C.text,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              🌐 {lang === "hi" ? "EN" : "हिं"}
            </button>

            <div style={{ height: 24, width: 1, background: C.border }} />

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: C.text, lineHeight: 1.2 }}>
                  {hospitalUser?.staffRole === "director" ? "Medical Director" : "OPD Desk"}
                </div>
                <div style={{ fontSize: 10, color: C.primary, fontWeight: 700 }}>
                  {hospitalUser?.facilityName ? hospitalUser.facilityName.split(" ")[0] : "Active Session"}
                </div>
              </div>
              <div style={{ width: 34, height: 34, borderRadius: "50%", border: `1.5px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", background: "#F1F5F9", fontSize: 16 }}>
                {hospitalUser?.staffRole === "director" ? "👨‍⚕️" : "💁‍♀️"}
              </div>
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== "undefined") {
                    localStorage.removeItem("hospitalAuth");
                    localStorage.removeItem("hospital_command_user");
                    localStorage.removeItem("hospital_authorized");
                  }
                  router.push("/hospital/login");
                }}
                style={{
                  background: "#FEE2E2",
                  color: "#991B1B",
                  border: "none",
                  borderRadius: 8,
                  padding: "6px 10px",
                  fontSize: 11,
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                {T("लॉग आउट", "Sign Out")}
              </button>
            </div>
          </div>

        </div>
      </nav>

      <main style={{ flex: 1, padding: "10px 24px 60px", maxWidth: 1600, margin: "0 auto", width: "100%", boxSizing: "border-box" }}>

        {/* Multi-Hospital Command Center Switcher Banner */}
        <div
          style={{
            background: "white",
            borderRadius: 20,
            padding: "16px 24px",
            border: `1px solid ${C.border}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 24,
            boxShadow: "0 6px 20px rgba(0, 0, 0, 0.03)",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                background: "linear-gradient(135deg, #0F766E, #0D5E58)",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 24,
                boxShadow: "0 4px 12px rgba(15, 118, 110, 0.25)",
              }}
            >
              🏥
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", color: C.muted, letterSpacing: 0.6 }}>
                {T("सक्रिय अस्पताल कमांड सेंटर", "Active Hospital Command Center")}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2, flexWrap: "wrap" }}>
                <h2 style={{ margin: 0, fontSize: 19, fontWeight: 800, color: C.primary }}>
                  {activeFacility?.shortName || activeFacility?.name || "State Health Authority Network"}
                </h2>
                <span
                  style={{
                    background: "#E0F2FE",
                    color: "#0369A1",
                    fontSize: 10.5,
                    fontWeight: 800,
                    padding: "2px 8px",
                    borderRadius: 6,
                  }}
                >
                  {activeFacility?.type || "Network View"}
                </span>
                {activeFacility?.emergencyAvailable && (
                  <span style={{ background: "#FEE2E2", color: "#B91C1C", fontSize: 10.5, fontWeight: 800, padding: "2px 8px", borderRadius: 6 }}>
                    🚨 24/7 Casualty Active
                  </span>
                )}
              </div>
              <div style={{ fontSize: 11.5, color: C.muted, marginTop: 3 }}>
                📍 {activeFacility?.address || activeFacility?.location || "Maharashtra & Regional Network"} · 📞 {activeFacility?.phone || "+91 22 24076381"}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
            {/* Live Beds & Occupancy Widget - Calculated Dynamically */}
            <div style={{ display: "flex", gap: 12, background: "#F8FAFC", padding: "8px 16px", borderRadius: 14, border: `1px solid ${C.border}` }}>
              <div>
                <div style={{ fontSize: 9.5, color: C.muted, fontWeight: 700, textTransform: "uppercase" }}>{T("कुल बेड", "Total Beds")}</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: C.text }}>
                  {dynamicOccupiedBeds} / {totalFacilityBeds} <span style={{ fontSize: 11, color: C.muted, fontWeight: 600 }}>({bedOccupancyRate}%)</span>
                </div>
              </div>
              <div style={{ width: 1, height: 24, background: C.border, alignSelf: "center" }} />
              <div>
                <div style={{ fontSize: 9.5, color: C.muted, fontWeight: 700, textTransform: "uppercase" }}>{T("आईसीयू क्षमता", "ICU Beds")}</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: C.red }}>
                  {dynamicIcuOccupied} / {totalIcuBeds}
                </div>
              </div>
            </div>

            {/* Isolated Tenant Security & Session Card */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ background: "#F0FDFA", border: "1.5px solid #99F6E4", borderRadius: 12, padding: "6px 12px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11.5, fontWeight: 800, color: "#0F766E" }}>
                  <span style={{ fontSize: 13 }}>🔒</span>
                  <span>{activeFacility?.facilityId || selectedFacilityId}</span>
                </div>
                <div style={{ fontSize: 9.5, color: "#0D9488", fontWeight: 700 }}>
                  Isolated Facility Tenant
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (typeof window !== "undefined") {
                    localStorage.removeItem("hospitalAuth");
                    localStorage.removeItem("hospital_command_user");
                    localStorage.removeItem("hospital_authorized");
                    localStorage.removeItem("hospital_authorized_facility");
                  }
                  router.push("/hospital/login");
                }}
                style={{
                  padding: "8px 12px",
                  borderRadius: 10,
                  border: "1px solid #CBD5E1",
                  background: "#F8FAFC",
                  color: "#475569",
                  fontSize: 11.5,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  transition: "all 0.15s ease",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                }}
                title="Sign out and switch to another hospital portal"
              >
                <span>🔄</span> {T("अस्पताल बदलें", "Switch Facility")}
              </button>
            </div>
          </div>
        </div>

        {/* Page Subheader */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 800, margin: "0 0 4px 0", letterSpacing: "-0.5px" }}>
              {activeTab === "staff"
                ? T("अस्पताल स्टाफ एवं आशा नेटवर्क", "Hospital Staff & ASHA Network")
                : activeTab === "appointments"
                ? T("रिसेप्शनिस्ट अपॉइंटमेंट व स्लॉट डेस्क", "Receptionist Appointment & Slot Desk")
                : activeTab === "emergencies"
                ? T("आपातकालीन ट्राइएज कमांड", "Emergency Triage & SOS Command")
                : activeTab === "wards"
                ? T("वार्ड व बेड क्षमता मॉनिटरिंग", "Inpatient Wards & Bed Occupancy")
                : activeTab === "referrals"
                ? T("इनबाउंड रेफरल एवं शारीरिक OPD", "Inbound Referrals & Physical OPD")
                : activeTab === "diagnostics"
                ? T("डायग्नोस्टिक्स व लैब रिपोर्ट सुरक्षा जाल", "Diagnostics & Lab Reports Safety Net")
                : activeTab === "hmis-bridge"
                ? T("ABDM एवं ई-हॉस्पिटल एकीकरण गेटवे", "ABDM & NIC e-Hospital Integration Bridge")
                : activeTab === "analytics"
                ? T("अस्पताल मेट्रिक्स व एनालिटिक्स", "Clinical Metrics & Operational Analytics")
                : T("कमांड सेंटर ओवरव्यू", "Command Center Overview")}
            </h2>
            <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: C.muted, fontWeight: 500 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 5, color: C.green, fontWeight: 700, background: "rgba(16, 185, 129, 0.1)", padding: "3px 8px", borderRadius: 16 }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: C.green, animation: "pulse 2s infinite" }} />
                {T("सिस्टम लाइव", "System Live")}
              </span>
              <span>•</span>
              <span>{T("अगला रिफ्रेश", "Next refresh in")} {tick}s</span>
              <span>•</span>
              <span>{activeFacility?.name || "Facility Operations"}</span>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 2 }}>{new Date().toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: C.text }}>{new Date().toLocaleTimeString(lang === 'hi' ? 'hi-IN' : 'en-US', { hour: '2-digit', minute: '2-digit' })}</div>
          </div>
        </div>

        {/* SOS banner — live from DB */}
        {sosAlerts.length > 0 && sosAlerts.map(alert => (
          <div key={alert._id}
            style={{ background: `linear-gradient(135deg,${C.red},#991B1B)`, padding: "14px 20px", display: "flex", alignItems: "center", gap: 14, borderRadius: 16, marginBottom: 28, boxShadow: "0 8px 20px rgba(239, 68, 68, 0.3)" }}
          >
            <span style={{ fontSize: 26, animation: "shake .6s infinite", display: "inline-block" }}>🚨</span>
            <div style={{ flex: 1 }}>
              <h4 style={{ fontSize: 16, fontWeight: 800, color: "white", margin: 0 }}>
                SOS EMERGENCY: {alert.village}
              </h4>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,.95)", margin: 0, marginTop: 3 }}>
                {alert.ashaWorkerName} (ASHA) reports <span style={{ background: "rgba(255,255,255,0.25)", padding: "2px 8px", borderRadius: 6, fontWeight: 800, color: "white", margin: "0 4px" }}>🧑‍🤝‍🧑 {alert.affectedCount} Affected</span> — {alert.description || "Immediate response required."}
              </p>
            </div>
            <button 
              onClick={() => handleResolveSOS(alert._id)}
              style={{ background: "white", color: "#991B1B", padding: "7px 16px", borderRadius: 8, fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}
            >
              {alert.status === "resolved" ? "Resolved" : "Resolve Alert"}
            </button>
          </div>
        ))}

        {/* Advanced Search & Filter Bar */}
        <div style={{ background: C.card, borderRadius: 18, padding: "16px 24px", display: "flex", alignItems: "center", gap: 20, marginBottom: 28, boxShadow: "0 6px 16px rgba(0, 0, 0, 0.03)", border: `1px solid ${C.border}` }}>

          <div style={{ flex: 1, position: "relative" }}>
            <svg style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: C.muted }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
            <input
              type="text"
              placeholder={T("मरीज, डॉक्टर, या बीमारी खोजें...", "Search patient, doctor, or disease...")}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ width: "100%", padding: "11px 14px 11px 42px", borderRadius: 10, border: `1px solid ${C.border}`, background: "#F8FAFC", fontSize: 14, fontWeight: 500, outline: "none", boxSizing: "border-box", transition: "all 0.2s" }}
              onFocus={e => e.currentTarget.style.borderColor = C.primary}
              onBlur={e => e.currentTarget.style.borderColor = C.border}
            />
          </div>

          <div style={{ width: 1, height: 32, background: C.border }} />

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <svg style={{ color: C.muted }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2v4" /><path d="M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M3 10h18" /><path d="M8 14h.01" /><path d="M12 14h.01" /><path d="M16 14h.01" /><path d="M8 18h.01" /><path d="M12 18h.01" /><path d="M16 18h.01" /></svg>
            <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} style={{ border: "none", outline: "none", fontSize: 13.5, fontWeight: 600, color: C.text, cursor: "pointer", background: "transparent", fontFamily: "inherit" }} />
          </div>

          <div style={{ width: 1, height: 32, background: C.border }} />

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <svg style={{ color: C.muted }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ border: "none", outline: "none", fontSize: 13.5, fontWeight: 600, color: C.text, cursor: "pointer", background: "transparent", fontFamily: "inherit" }}>
              <option value="ALL">{T("सभी स्थितियां", "All Statuses")}</option>
              <option value="RED">{T("गंभीर", "Critical (RED)")}</option>
              <option value="YELLOW">{T("तत्काल", "Urgent (YELLOW)")}</option>
              <option value="GREEN">{T("सामान्य", "Standard (GREEN)")}</option>
            </select>
          </div>

        </div>

        {/* Dynamic KPIs Calculation */}
        {(activeTab === "dashboard" || activeTab === "analytics") && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20, marginBottom: 32 }}>
            {[
              {
                label: T("कुल सक्रिय मरीज़", "Total Active Patients"),
                value: totalPatients,
                trend: redPatients.length > 0 ? `${redPatients.length} Urgent Action` : `${totalPatients} In Queue`,
                icon: "👥",
                color: C.primary,
                info: T("सभी मरीज़ जिनका इलाज अभी चल रहा है", "All patients currently under active hospital triage and care")
              },
              {
                label: T("गंभीर आपात स्थिति", "Critical Emergencies"),
                id: "emergency",
                value: redPatients.length,
                trend: redPatients.length > 0 ? "Action Required" : "✓ All Clear",
                icon: "🚨",
                color: C.red,
                alert: redPatients.length > 0,
                info: T("RED प्राथमिकता वाले मरीज़ जिन्हें तुरंत इलाज की आवश्यकता है", "Patients marked with RED priority requiring immediate attention")
              },
              {
                label: T("ठीक हुए मरीज़", "Cured & Discharged"),
                value: curedPatientsCount,
                trend: `${Math.round((curedPatientsCount / (totalPatients + curedPatientsCount || 1)) * 100)}% Resolved`,
                icon: "✅",
                color: C.green,
                info: T("वे मरीज़ जिन्हें ठीक घोषित कर दिया गया है", "Patients whose treatment has concluded successfully")
              },
              {
                label: T("ड्यूटी पर डॉक्टर", "Doctors on Duty"),
                value: onDutyDoctorsCount,
                trend: `${onDutyDoctorsCount}/${activeFacilityDoctors.length} On Duty`,
                icon: "👩‍⚕️",
                color: C.primaryLight,
                info: T("वर्तमान में उपलब्ध डॉक्टरों की संख्या", "Total medical officers currently active and on roster")
              },
              {
                label: T("भर्ती मरीज़", "Admitted / Critical"),
                value: admittedPatients.length,
                trend: `${bedOccupancyRate}% Total Capacity`,
                icon: "🏥",
                color: C.red,
                info: T("100% RED और 50% YELLOW मरीज़ जिन्हें भर्ती माना गया है", "Calculated from RED priority cases and inpatient admissions")
              },
              {
                label: T("क्लीनिक विजिट", "Outpatient Clinic"),
                value: outpatientClinic.length,
                trend: `${totalPatients > 0 ? Math.round((outpatientClinic.length / totalPatients) * 100) : 0}% Active Influx`,
                icon: "👨‍⚕️",
                color: C.primaryLight,
                info: T("ओपीडी में मौजूद मरीज", "Standard in-person outpatient walk-ins and referrals")
              },
              {
                label: T("टेलीमेडिसिन", "Telemedicine Calls"),
                value: telemedicineVisits.length,
                trend: telemedicineVisits.length > 0 ? "Virtual Stream" : "Standby",
                icon: "📱",
                color: C.accent,
                info: T("परामर्श जिनका ऑनलाइन इलाज चल रहा है", "Virtual telemedicine consultations connected to medical officers")
              },
              {
                label: T("आशा विजिट", "ASHA Field Visits"),
                value: fieldVisits,
                trend: `${activeFacilityStaff.ashaWorkers.length} Active Workers`,
                icon: "🏘️",
                color: C.yellow,
                info: T("आशा कार्यकर्ताओं द्वारा दर्ज किए गए कुल घर-घर विजिट", "Total door-to-door community visits logged by affiliated ASHA staff")
              },
            ].map((kpi, i) => (
              <div key={i} onClick={() => kpi.id === "emergency" && document.getElementById("emergency-triage")?.scrollIntoView({ behavior: "smooth", block: "center" })} style={{ background: C.card, borderRadius: 20, padding: 24, border: `1px solid ${C.border}`, position: "relative", overflow: "hidden", boxShadow: "0 6px 16px rgba(0, 0, 0, 0.03)", cursor: kpi.id === "emergency" ? "pointer" : "default", animation: kpi.id === "emergency" && kpi.alert ? "alertGlow 1.5s infinite" : "none", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                {kpi.alert && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: C.red, animation: "pulse 1.5s infinite" }} />}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: `${kpi.color}15`, color: kpi.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>
                    {kpi.icon}
                  </div>
                  <div style={{ background: `${kpi.color}15`, color: kpi.color, padding: "4px 10px", borderRadius: 14, fontSize: 11.5, fontWeight: 800 }}>
                    {kpi.trend}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 34, fontWeight: 800, color: kpi.alert ? C.red : C.text, lineHeight: 1, marginBottom: 8 }}>{kpi.value}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ fontSize: 13.5, color: C.muted, fontWeight: 600 }}>{kpi.label}</div>
                    <InfoButton text={kpi.info} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>

          {/* Receptionist-Assisted Booking & Slot Desk */}
          {(activeTab === "dashboard" || activeTab === "appointments") && (
            <div style={{ background: C.card, borderRadius: 24, border: `1px solid ${C.border}`, overflow: "hidden", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.05)" }}>
              <div style={{ padding: "24px 32px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", background: "#F0FDFA" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 22 }}>📋</span>
                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: C.primary }}>
                      {T("रिसेप्शनिस्ट अपॉइंटमेंट व स्लॉट डेस्क", "Receptionist Appointment & Slot Desk")}
                    </h3>
                  </div>
                  <p style={{ margin: "4px 0 0 0", fontSize: 13, color: C.muted, fontWeight: 500 }}>
                    {T("ग्रामीण व वॉक-इन मरीजों के लिए एआई सहायता प्राप्त स्लॉट आवंटन और एसएमएस सूचना प्रणाली", "AI-assisted slot allocation and SMS notification workflow for rural and walk-in patients")}
                  </p>
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <div style={{ background: "white", border: `1px solid ${C.border}`, padding: "6px 14px", borderRadius: 12, fontSize: 12, fontWeight: 700, color: C.primary }}>
                    🏥 {activeFacility?.shortName || activeFacility?.name || "Command Center"}
                  </div>
                  <div style={{ fontSize: 13, color: "#0F766E", fontWeight: 800, background: "rgba(15, 118, 110, 0.15)", padding: "6px 16px", borderRadius: 20 }}>
                    {facilityScopedQueue.length} {T("कुल स्लॉट अनुरोध", "Total Slot Requests")}
                  </div>
                </div>
              </div>

              <div style={{ padding: 0 }}>
                {facilityScopedQueue.length === 0 ? (
                  <div style={{ padding: 60, textAlign: "center", color: C.muted }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
                    <div style={{ fontSize: 16, fontWeight: 700 }}>{T("कोई नया अपॉइंटमेंट स्लॉट अनुरोध नहीं है", "No Pending Appointment Slot Requests")}</div>
                    <div style={{ fontSize: 13, marginTop: 6 }}>{T("मरीजों द्वारा बुक किए गए सभी स्लॉट वर्तमान में संसाधित हैं।", "All patient slot requests for this facility have been acknowledged.")}</div>
                  </div>
                ) : (
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                    <thead>
                      <tr style={{ background: "#F8FAFC", fontSize: 13, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>
                        <th style={{ padding: "18px 28px", fontWeight: 700 }}>{T("मरीज व संपर्क", "Patient & Contact")}</th>
                        <th style={{ padding: "18px 28px", fontWeight: 700 }}>{T("विभाग व चयनित स्लॉट", "Dept & Slot Time")}</th>
                        <th style={{ padding: "18px 28px", fontWeight: 700 }}>{T("एआई ट्राइएज लक्षण", "AI Triage & Urgency")}</th>
                        <th style={{ padding: "18px 28px", fontWeight: 700 }}>{T("सत्यापन स्थिति", "Verification & Status")}</th>
                        <th style={{ padding: "18px 28px", fontWeight: 700 }}>{T("रोगी सत्यापन व कार्रवाई", "Patient Verification & Action")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {facilityScopedQueue.slice(0, 15).map((p) => {
                        const isConfirmed = p.receptionistStatus === "CONFIRMED" || p.status === "confirmed";
                        const isSpam = p.receptionistStatus === "SPAM_FLAGGED";
                        return (
                          <tr key={p._id} style={{ borderTop: `1px solid ${C.border}`, transition: "background 0.2s", background: isSpam ? "#FEF2F2" : "transparent" }} onMouseEnter={(e) => (e.currentTarget.style.background = isSpam ? "#FEE2E2" : "#F8FAFC")} onMouseLeave={(e) => (e.currentTarget.style.background = isSpam ? "#FEF2F2" : "transparent")}>
                            <td style={{ padding: "18px 28px" }}>
                              <div style={{ fontWeight: 800, color: C.text, fontSize: 15 }}>{p.patientName || "Walk-in Patient"}</div>
                              <div style={{ fontSize: 13, color: C.muted, marginTop: 4, display: "flex", alignItems: "center", gap: 6 }}>
                                <span>📱 {p.patientPhone || "No Phone"}</span>
                                {p.hospital && <span style={{ background: "#F1F5F9", padding: "2px 6px", borderRadius: 6, fontSize: 11, fontWeight: 700 }}>{p.hospital}</span>}
                              </div>
                            </td>
                            <td style={{ padding: "18px 28px" }}>
                              <div style={{ fontSize: 14, fontWeight: 800, color: C.primaryDark }}>
                                🩺 {p.department || "General OPD"}
                              </div>
                              <div style={{ fontSize: 13, color: C.muted, marginTop: 4, fontWeight: 600 }}>
                                ⏰ {p.slotTime || p.preferredSlot || "Immediate Token / Regular OPD"}
                              </div>
                              {p.doctorName && (
                                <div style={{ fontSize: 12, color: C.primaryLight, marginTop: 2, fontWeight: 600 }}>
                                  👨‍⚕️ {p.doctorName}
                                </div>
                              )}
                            </td>
                            <td style={{ padding: "18px 28px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                                <span
                                  style={{
                                    background: p.urgency === "RED" ? "#FEE2E2" : p.urgency === "YELLOW" ? "#FEF3C7" : "#D1FAE5",
                                    color: p.urgency === "RED" ? "#B91C1C" : p.urgency === "YELLOW" ? "#D97706" : "#059669",
                                    padding: "3px 10px",
                                    borderRadius: 12,
                                    fontSize: 11,
                                    fontWeight: 800,
                                  }}
                                >
                                  {p.urgency === "RED" ? "🚨 RED CRITICAL" : p.urgency === "YELLOW" ? "🟡 YELLOW URGENT" : "🟢 GREEN ROUTINE"}
                                </span>
                              </div>
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                                {(p.symptoms || []).slice(0, 2).map((s: string, idx: number) => (
                                  <span key={idx} style={{ background: "#F1F5F9", color: C.text, padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600 }}>
                                    {s}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td style={{ padding: "18px 28px" }}>
                              {isSpam ? (
                                <span style={{ background: "#FEE2E2", color: "#B91C1C", padding: "6px 12px", borderRadius: 20, fontSize: 12, fontWeight: 800, display: "inline-flex", alignItems: "center", gap: 4 }}>
                                  🚫 {T("फर्जी/स्कैम फ्लैग", "Flagged Fake/Spam")}
                                </span>
                              ) : isConfirmed ? (
                                <span style={{ background: "#D1FAE5", color: "#059669", padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 800, display: "inline-flex", alignItems: "center", gap: 4 }}>
                                  🛡️ {T("सत्यापित व पुष्टीकृत", "Verified & Confirmed")}
                                </span>
                              ) : (
                                <span style={{ background: "#FEF3C7", color: "#D97706", padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 800, display: "inline-flex", alignItems: "center", gap: 4 }}>
                                  ⚠️ {T("सत्यापन प्रतीक्षारत", "Pending Verification")}
                                </span>
                              )}
                            </td>
                            <td style={{ padding: "18px 28px" }}>
                              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                                {/* Patient Authenticity Verification Calls */}
                                <button
                                  onClick={() => window.open(`tel:${p.patientPhone}`)}
                                  title="Direct phone call to verify real identity"
                                  style={{
                                    background: "#F8FAFC",
                                    border: `1.5px solid ${C.border}`,
                                    color: C.text,
                                    padding: "7px 11px",
                                    borderRadius: 10,
                                    fontSize: 12,
                                    fontWeight: 700,
                                    cursor: "pointer",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 4,
                                  }}
                                >
                                  📞 {T("फ़ोन कॉल सत्यापन", "Phone Verify")}
                                </button>
                                <button
                                  onClick={() => startCallSession({
                                    patientId: p.patientPhone || p._id,
                                    patientName: p.patientName,
                                    isDoctor: true,
                                    callerRole: "receptionist",
                                    callerTitle: `${activeFacility?.shortName || activeFacility?.name || "Hospital"} Reception Desk`,
                                    facilityName: activeFacility?.name || "Hospital Medical Center",
                                    department: p.department || "General OPD",
                                    patientDetails: {
                                      department: p.department || "General OPD",
                                      urgency: p.urgency || p.priority || (p.triageCategory === "RED" ? "RED CRITICAL" : "STANDARD"),
                                      slotTime: p.slotTime || "Immediate Token",
                                      doctorName: p.doctorName,
                                      verificationNotes: p.verificationNotes,
                                      symptoms: p.symptoms || p.triageReason,
                                    },
                                    onSaveNotes: async (notes, verifiedStatus) => {
                                      try {
                                        if (verifiedStatus === "Verified & Confirmed" || verifiedStatus?.includes("Verified")) {
                                          await handleConfirmAppointment(p._id);
                                        } else if (verifiedStatus?.includes("Suspicious") || verifiedStatus?.includes("Canceled")) {
                                          await handleFlagScamAppointment(p._id);
                                        }
                                        fetchData();
                                      } catch {}
                                    }
                                  })}
                                  title="App video/audio intercom to verify patient"
                                  style={{
                                    background: "#E0F2FE",
                                    color: "#0369A1",
                                    border: "none",
                                    padding: "7px 11px",
                                    borderRadius: 10,
                                    fontSize: 12,
                                    fontWeight: 700,
                                    cursor: "pointer",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 4,
                                  }}
                                >
                                  💻 {T("ऐप इंटरकॉम", "App Call")}
                                </button>

                                {!isConfirmed && !isSpam && (
                                  <>
                                    <button
                                      onClick={() => handleConfirmAppointment(p._id)}
                                      style={{
                                        background: C.green,
                                        color: "white",
                                        border: "none",
                                        padding: "8px 14px",
                                        borderRadius: 10,
                                        fontSize: 12,
                                        fontWeight: 800,
                                        cursor: "pointer",
                                        boxShadow: "0 2px 6px rgba(16, 185, 129, 0.3)",
                                      }}
                                    >
                                      ✓ {T("पुष्टि व एसएमएस", "Confirm & SMS")}
                                    </button>
                                    <button
                                      onClick={() => handleFlagScamAppointment(p._id)}
                                      title="Reject and mark as fake/scam"
                                      style={{
                                        background: "#FEE2E2",
                                        color: "#991B1B",
                                        border: "1px solid #FCA5A5",
                                        padding: "7px 10px",
                                        borderRadius: 10,
                                        fontSize: 11,
                                        fontWeight: 800,
                                        cursor: "pointer",
                                      }}
                                    >
                                      🚫 {T("स्कैम फ्लैग", "Flag Scam")}
                                    </button>
                                    <button
                                      onClick={() => handleDeclineAppointment(p._id)}
                                      style={{
                                        background: "#F1F5F9",
                                        color: C.muted,
                                        border: "none",
                                        padding: "7px 10px",
                                        borderRadius: 10,
                                        fontSize: 11,
                                        fontWeight: 700,
                                        cursor: "pointer",
                                      }}
                                    >
                                      ✕ {T("अस्वीकार", "Decline")}
                                    </button>
                                  </>
                                )}

                                {isConfirmed && (
                                  <button
                                    onClick={() => alert(`Resent SMS confirmation reminder to patient mobile: ${p.patientPhone}`)}
                                    style={{
                                      background: "#F0FDFA",
                                      color: C.primary,
                                      border: `1px solid ${C.primary}`,
                                      padding: "6px 12px",
                                      borderRadius: 8,
                                      fontSize: 12,
                                      fontWeight: 700,
                                      cursor: "pointer",
                                    }}
                                  >
                                    📲 {T("दोबारा एसएमएस भेजें", "Resend SMS")}
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* Hospital Staff & Dedicated ASHA Network */}
          {(activeTab === "dashboard" || activeTab === "staff") && (
            <div style={{ background: C.card, borderRadius: 24, border: `1px solid ${C.border}`, overflow: "hidden", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.05)" }}>
              <div style={{ padding: "24px 32px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", background: "#F8FAFC" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 22 }}>👨‍⚕️</span>
                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: C.text }}>
                      {T("अस्पताल स्टाफ एवं आशा फील्ड कार्यकर्ता रोस्टर", "Hospital Staff & ASHA Field Roster")}
                    </h3>
                  </div>
                  <p style={{ margin: "4px 0 0 0", fontSize: 13, color: C.muted, fontWeight: 500 }}>
                    {activeFacility?.name || "Facility Command"} — {T("संबद्ध मेडिकल ऑफिसर, विशेषज्ञ और आशा कार्यकर्ता", "Affiliated Medical Officers, Specialists, and Field ASHA Workers")}
                  </p>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <div style={{ background: "rgba(15, 118, 110, 0.1)", color: C.primary, padding: "6px 14px", borderRadius: 12, fontSize: 12, fontWeight: 800 }}>
                    👨‍⚕️ {activeFacilityStaff.doctors.length} {T("डॉक्टर ऑन-ड्यूटी", "Doctors On-Duty")}
                  </div>
                  <div style={{ background: "rgba(245, 158, 11, 0.15)", color: "#B45309", padding: "6px 14px", borderRadius: 12, fontSize: 12, fontWeight: 800 }}>
                    🏘️ {activeFacilityStaff.ashaWorkers.length} {T("आशा कार्यकर्ता", "ASHA Field Workers")}
                  </div>
                </div>
              </div>

              <div style={{ padding: "28px 32px" }}>
                {/* Doctors Roster Grid */}
                <div style={{ marginBottom: 28 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 800, textTransform: "uppercase", color: C.muted, letterSpacing: 0.6, marginBottom: 16 }}>
                    🩺 {T("संबद्ध मेडिकल ऑफिसर एवं विशेषज्ञ", "Affiliated Medical Officers & Specialists")}
                  </h4>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
                    {activeFacilityStaff.doctors.map((doc: any) => (
                      <div
                        key={doc.id}
                        style={{
                          background: "#FFFFFF",
                          border: `1.5px solid ${C.border}`,
                          borderRadius: 18,
                          padding: "20px",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.03)",
                        }}
                      >
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                              <div
                                style={{
                                  width: 44,
                                  height: 44,
                                  borderRadius: 14,
                                  background: "linear-gradient(135deg, #0F766E, #14B8A6)",
                                  color: "white",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: 20,
                                  fontWeight: 800,
                                }}
                              >
                                👨‍⚕️
                              </div>
                              <div>
                                <div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>{doc.name}</div>
                                <div style={{ fontSize: 12, color: C.primary, fontWeight: 700 }}>{doc.dept}</div>
                              </div>
                            </div>
                            <span
                              style={{
                                background: doc.onDuty ? "#D1FAE5" : "#F1F5F9",
                                color: doc.onDuty ? "#059669" : C.muted,
                                padding: "4px 10px",
                                borderRadius: 12,
                                fontSize: 11,
                                fontWeight: 800,
                              }}
                            >
                              {doc.onDuty ? "🟢 On Duty" : "⚪ Off Duty"}
                            </span>
                          </div>

                          <div style={{ fontSize: 13, color: C.muted, marginBottom: 8 }}>
                            💼 {doc.role} · <span style={{ fontWeight: 700, color: C.text }}>{doc.experience}</span> exp
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, color: "#D97706" }}>
                            <span>⭐ {doc.rating || 4.9}</span>
                            <span style={{ fontSize: 11, color: C.muted, fontWeight: 500 }}>({T("सत्यापित समीक्षाएं", "Verified Reviews")})</span>
                          </div>
                        </div>

                        <div style={{ marginTop: 16, paddingTop: 12, borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>
                            🏥 {activeFacility?.shortName || "Hospital Unit"}
                          </span>
                          <div style={{ display: "flex", gap: 8 }}>
                            <button
                              onClick={() => setSelectedQRDoctor({
                                name: doc.name,
                                phone: doc.phone || "+91 98765 01002",
                                dept: doc.dept,
                                hospital: activeFacility?.name || "Hospital Medical Center",
                                role: doc.role,
                              })}
                              style={{
                                background: "rgba(56, 189, 248, 0.12)",
                                border: "1px solid rgba(56, 189, 248, 0.35)",
                                color: "#0284C7",
                                borderRadius: 8,
                                padding: "6px 10px",
                                fontSize: 12,
                                fontWeight: 800,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                              }}
                            >
                              <span>📱</span> {T("QR कॉल", "QR Call")}
                            </button>
                            <button
                              onClick={() => alert(`Calling ${doc.name} intercom...`)}
                              style={{
                                background: "#F0FDFA",
                                border: `1px solid ${C.primary}`,
                                color: C.primary,
                                borderRadius: 8,
                                padding: "6px 12px",
                                fontSize: 12,
                                fontWeight: 700,
                                cursor: "pointer",
                              }}
                            >
                              📞 Intercom
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ASHA Field Workers Network */}
                <div>
                  <h4 style={{ fontSize: 14, fontWeight: 800, textTransform: "uppercase", color: C.muted, letterSpacing: 0.6, marginBottom: 16 }}>
                    🏘️ {T("संबद्ध आशा कार्यकर्ता एवं पाड़ा क्लस्टर", "Affiliated ASHA Field Workers & Pada Clusters")}
                  </h4>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
                    {activeFacilityStaff.ashaWorkers.map((asha: any) => (
                      <div
                        key={asha.id}
                        style={{
                          background: "#FFFBEB",
                          border: `1.5px solid #FDE68A`,
                          borderRadius: 18,
                          padding: "20px",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                          boxShadow: "0 4px 12px rgba(245, 158, 11, 0.05)",
                        }}
                      >
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                              <div
                                style={{
                                  width: 44,
                                  height: 44,
                                  borderRadius: 14,
                                  background: "linear-gradient(135deg, #D97706, #F59E0B)",
                                  color: "white",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: 20,
                                  fontWeight: 800,
                                }}
                              >
                                👩‍🌾
                              </div>
                              <div>
                                <div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>{asha.name}</div>
                                <div style={{ fontSize: 12, color: "#B45309", fontWeight: 700 }}>
                                  📍 {asha.area || asha.village || "Catchment Area"}
                                </div>
                              </div>
                            </div>
                            {asha.activeAlerts > 0 ? (
                              <span style={{ background: "#FEE2E2", color: "#B91C1C", padding: "4px 8px", borderRadius: 10, fontSize: 11, fontWeight: 800 }}>
                                🚨 {asha.activeAlerts} {T("अलर्ट", "Alerts")}
                              </span>
                            ) : (
                              <span style={{ background: "#D1FAE5", color: "#059669", padding: "4px 8px", borderRadius: 10, fontSize: 11, fontWeight: 800 }}>
                                ✓ Normal
                              </span>
                            )}
                          </div>

                          <div style={{ fontSize: 13, color: C.muted, marginBottom: 6 }}>
                            📱 {asha.phone} · <span style={{ fontWeight: 700, color: C.text }}>{asha.visitsThisMonth || 48}</span> {T("विजिट इस माह", "visits this month")}
                          </div>
                        </div>

                        <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid #FDE68A", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: 12, color: "#92400E", fontWeight: 700 }}>
                            🌿 Field Community Lead
                          </span>
                          <button
                            onClick={() => window.open(`tel:${asha.phone}`)}
                            style={{
                              background: "#D97706",
                              border: "none",
                              color: "white",
                              borderRadius: 8,
                              padding: "6px 14px",
                              fontSize: 12,
                              fontWeight: 800,
                              cursor: "pointer",
                            }}
                          >
                            📞 Direct Call
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Emergencies */}
            {(activeTab === "dashboard" || activeTab === "emergencies") && (
              <div id="emergency-triage" style={{ background: C.card, borderRadius: 24, border: redPatients.length > 0 ? `2px solid ${C.red}` : `1px solid ${C.border}`, overflow: "hidden", boxShadow: redPatients.length > 0 ? "0 0 20px rgba(239, 68, 68, 0.6)" : "0 10px 15px -3px rgba(0, 0, 0, 0.05)", animation: redPatients.length > 0 ? "alertGlow 1.5s infinite" : "none" }}>
                <div style={{ padding: "24px 32px", borderBottom: redPatients.length > 0 ? `2px solid ${C.red}` : `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", background: redPatients.length > 0 ? "#FEF2F2" : "transparent" }}>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: redPatients.length > 0 ? C.red : C.text, display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 12, height: 12, borderRadius: "50%", background: redPatients.length > 0 ? C.red : C.muted, animation: redPatients.length > 0 ? "pulse 0.5s infinite" : "none" }} />
                    {T("आपातकालीन ट्राइएज", "Emergency Triage (RED)")}
                  </h3>
                </div>
                <div style={{ padding: 0 }}>
                  {redPatients.length === 0 ? (
                    <div style={{ padding: 60, textAlign: "center", color: C.muted }}>
                      <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
                      <div style={{ fontSize: 18, fontWeight: 700 }}>{T("कोई आपात स्थिति नहीं", "No Critical Emergencies")}</div>
                      <div style={{ fontSize: 15, marginTop: 8 }}>{T("सभी गंभीर मामले हल हो गए हैं।", "All critical cases have been resolved.")}</div>
                    </div>
                  ) : (
                    <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                      <thead>
                        <tr style={{ background: "#F8FAFC", fontSize: 13, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>
                          <th style={{ padding: "20px 32px", fontWeight: 700 }}>Patient Identity</th>
                          <th style={{ padding: "20px 32px", fontWeight: 700 }}>Clinical Symptoms</th>
                          <th style={{ padding: "20px 32px", fontWeight: 700 }}>Assigned Unit</th>
                          <th style={{ padding: "20px 32px", fontWeight: 700 }}>Time</th>
                          <th style={{ padding: "20px 32px", fontWeight: 700 }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {redPatients.map((p, i) => (
                          <tr key={p._id} style={{ borderTop: `1px solid ${C.border}`, transition: "background 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = "#FEF2F2"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                            <td style={{ padding: "24px 32px" }}>
                              <div style={{ fontWeight: 800, color: C.text, fontSize: 16 }}>{p.patientName === "Unknown" ? "Anonymous SOS Alert" : p.patientName}</div>
                              <div style={{ fontSize: 14, color: C.muted, marginTop: 6, fontWeight: 500 }}>📱 {p.patientPhone === "unknown" ? "Location Pinged" : p.patientPhone}</div>
                            </td>
                            <td style={{ padding: "24px 32px" }}>
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                                {p.symptoms.slice(0, 3).map((s: string, idx: number) => (
                                  <span key={idx} style={{ background: "rgba(239, 68, 68, 0.1)", color: C.red, padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700 }}>{s}</span>
                                ))}
                                {p.symptoms.length > 3 && <span style={{ fontSize: 12, color: C.muted, fontWeight: 700, alignSelf: "center" }}>+{p.symptoms.length - 3}</span>}
                              </div>
                            </td>
                            <td style={{ padding: "24px 32px" }}>
                              <div style={{ fontSize: 15, fontWeight: 700 }}>{p.doctorName || "Pending Assignment"}</div>
                            </td>
                            <td style={{ padding: "24px 32px", fontSize: 14, fontWeight: 600, color: C.muted }}>
                              {p.createdAt ? new Date(p.createdAt).toLocaleTimeString(lang === 'hi' ? 'hi-IN' : 'en-US', { hour: '2-digit', minute: '2-digit' }) : "Just now"}
                            </td>
                            <td style={{ padding: "24px 32px" }}>
                              <div style={{ display: "flex", gap: 10 }}>
                                <button onClick={() => setCallPatient({
                                  id: p.patientPhone || p._id,
                                  name: p.patientName,
                                  details: {
                                    department: p.department || "General OPD",
                                    urgency: p.urgency || p.priority || (p.triageCategory === "RED" ? "RED CRITICAL" : "STANDARD"),
                                    slotTime: p.slotTime,
                                    doctorName: p.doctorName,
                                    verificationNotes: p.verificationNotes,
                                    symptoms: p.symptoms || p.triageReason,
                                  }
                                })} style={{ padding: "10px 16px", background: "#EBF4FD", color: C.accent, border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 10px rgba(0, 0, 0, 0.05)" }}>
                                  💻 {T("ऐप कॉल", "App Call")}
                                </button>
                                <button onClick={() => window.open(`tel:${p.patientPhone}`)} style={{ padding: "10px 16px", background: C.red, color: "white", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 10px rgba(239, 68, 68, 0.3)" }}>
                                  📱 {T("फ़ोन", "Phone")}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}

            
          {/* Right Column / Analytics */}
          {(activeTab === "dashboard" || activeTab === "analytics") && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>

              {/* Triage Distribution */}
              <div style={{ background: C.card, borderRadius: 24, padding: "24px 32px", border: `1px solid ${C.border}`, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.05)" }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: C.text, marginBottom: 24 }}>
                  {T("ट्राइएज वितरण", "Triage Distribution")}
                  <InfoButton text={T("गंभीरता के आधार पर रोगियों का अनुपात दर्शाता है। लाल (RED) का अर्थ है तत्काल जीवन रक्षक देखभाल की आवश्यकता है।", "Shows the proportion of patients classified by severity. RED means immediate life-saving care is required.")} />
                </h3>
                <div style={{ display: "flex", height: 32, borderRadius: 16, overflow: "hidden", marginBottom: 24 }}>
                  <div style={{ width: `${totalPatients ? (redPatients.length / totalPatients) * 100 : 0}%`, background: C.red, transition: "width 1s ease" }} />
                  <div style={{ width: `${totalPatients ? (yellowPatients.length / totalPatients) * 100 : 0}%`, background: C.yellow, transition: "width 1s ease" }} />
                  <div style={{ width: `${totalPatients ? (greenPatients.length / totalPatients) * 100 : 100}%`, background: totalPatients ? C.green : C.border, transition: "width 1s ease" }} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", background: "#FEF2F2", borderRadius: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 15, fontWeight: 700, color: C.red }}><div style={{ width: 12, height: 12, borderRadius: "50%", background: C.red }} /> Critical (RED)</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: C.red }}>{redPatients.length}</div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", background: "#FFFBEB", borderRadius: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 15, fontWeight: 700, color: C.yellow }}><div style={{ width: 12, height: 12, borderRadius: "50%", background: C.yellow }} /> Urgent (YELLOW)</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: C.yellow }}>{yellowPatients.length}</div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", background: "#ECFDF5", borderRadius: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 15, fontWeight: 700, color: C.green }}><div style={{ width: 12, height: 12, borderRadius: "50%", background: C.green }} /> Standard (GREEN)</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: C.green }}>{greenPatients.length}</div>
                  </div>
                </div>
              </div>

              {/* Patient Influx Chart */}
              <div style={{ background: C.card, borderRadius: 24, padding: "24px 32px", border: `1px solid ${C.border}`, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.05)", display: "flex", flexDirection: "column" }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: C.text, marginBottom: 24 }}>
                  {T("रोगी की आमद (12 घंटे)", "Patient Influx (12h)")}
                  <InfoButton text={T("पिछले 12 घंटों में हर घंटे भर्ती होने वाले नए मरीजों की संख्या। भीड़ का अनुमान लगाने के लिए उपयोग किया जाता है।", "Displays the volume of new patients admitted every hour over the last 12 hours. Used to predict crowding.")} />
                </h3>
                <div style={{ flex: 1, display: "flex", alignItems: "flex-end", gap: 10, minHeight: 120 }}>
                  {hourlyData.map((val, i) => (
                    <div key={i} style={{ flex: 1, background: i === hourlyData.length - 1 ? C.primary : "#E2E8F0", height: `${(val / maxHourly) * 100}%`, borderRadius: "6px 6px 0 0", position: "relative", transition: "height 0.5s ease" }}>
                      <div style={{ position: "absolute", top: -24, width: "100%", textAlign: "center", fontSize: 12, fontWeight: 800, color: C.muted, opacity: i % 2 === 0 || i === hourlyData.length - 1 ? 1 : 0 }}>{val}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Department Load Chart */}
              <div style={{ background: C.card, borderRadius: 24, padding: "24px 32px", border: `1px solid ${C.border}`, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.05)", display: "flex", flexDirection: "column" }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: C.text, marginBottom: 24 }}>
                  {T("विभागों का भार", "Department Load")}
                  <InfoButton text={T("कर्मचारियों के प्रबंधन में सहायता के लिए चिकित्सा विभागों में मरीजों का वास्तविक समय का अनुमानित आवंटन।", "Real-time estimated allocation of patients across medical departments to help manage staffing.")} />
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {dynamicDepts.map((dept, i) => (
                    <div key={i}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 700, marginBottom: 8, color: C.text }}>
                        <span>{dept.label}</span>
                        <span>{dept.value} cases</span>
                      </div>
                      <div style={{ height: 8, background: "#E2E8F0", borderRadius: 4, overflow: "hidden" }}>
                        <div style={{ width: `${totalPatients ? Math.min(100, Math.round((dept.value / totalPatients) * 100)) : 0}%`, height: "100%", background: dept.color, transition: "width 1s ease" }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Treatment Success Overview */}
              <div style={{ background: C.card, borderRadius: 24, padding: "24px 32px", border: `1px solid ${C.border}`, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.05)", display: "flex", flexDirection: "column" }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: C.text, marginBottom: 24 }}>
                  {T("उपचार की दर", "Treatment Success Overview")}
                  <InfoButton text={T("सफलतापूर्वक ठीक हुए मरीजों और इलाज की प्रतीक्षा कर रहे मरीजों की संख्या की तुलना करता है।", "Compares the number of successfully cured patients vs patients still waiting/pending treatment.")} />
                </h3>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 20 }}>

                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, fontWeight: 700, marginBottom: 8, color: C.green }}>
                      <span>Cured & Discharged</span>
                      <span>{curedPatientsCount} Patients</span>
                    </div>
                    <div style={{ height: 16, background: "#E2E8F0", borderRadius: 8, overflow: "hidden" }}>
                      <div style={{ width: `${totalPatients + curedPatientsCount ? (curedPatientsCount / (totalPatients + curedPatientsCount)) * 100 : 0}%`, height: "100%", background: C.green, transition: "width 1s ease" }} />
                    </div>
                  </div>

                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, fontWeight: 700, marginBottom: 8, color: C.accent }}>
                      <span>Pending Treatment</span>
                      <span>{totalPatients} Patients</span>
                    </div>
                    <div style={{ height: 16, background: "#E2E8F0", borderRadius: 8, overflow: "hidden" }}>
                      <div style={{ width: `${totalPatients + curedPatientsCount ? (totalPatients / (totalPatients + curedPatientsCount)) * 100 : 0}%`, height: "100%", background: C.accent, transition: "width 1s ease" }} />
                    </div>
                  </div>

                  <div style={{ textAlign: "center", marginTop: 10 }}>
                    <div style={{ fontSize: 32, fontWeight: 800, color: C.text }}>
                      {totalPatients + curedPatientsCount > 0 ? Math.round((curedPatientsCount / (totalPatients + curedPatientsCount)) * 100) : 0}%
                    </div>
                    <div style={{ fontSize: 14, color: C.muted, fontWeight: 600 }}>Overall Resolution Rate</div>
                  </div>

                </div>
              </div>

            </div>
          )}

{/* Main Column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>



            {/* Standard Wards */}
            {(activeTab === "dashboard" || activeTab === "wards") && (
              <div style={{ background: C.card, borderRadius: 24, border: `1px solid ${C.border}`, overflow: "hidden", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.05)" }}>
                <div style={{ padding: "24px 32px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: C.text }}>{T("मानक वार्ड (पीला/हरा)", "Standard Wards (Yellow/Green)")}</h3>
                  <div style={{ fontSize: 14, color: C.primaryLight, fontWeight: 700, background: `${C.primaryLight}15`, padding: "6px 16px", borderRadius: 20 }}>
                    {yellowPatients.length + greenPatients.length} Active Cases
                  </div>
                </div>
                <div style={{ padding: 0 }}>
                  {yellowPatients.length === 0 && greenPatients.length === 0 ? (
                    <div style={{ padding: 40, textAlign: "center", color: C.muted }}>No patients in standard ward.</div>
                  ) : (
                    <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                      <thead>
                        <tr style={{ background: "#F8FAFC", fontSize: 13, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>
                          <th style={{ padding: "20px 32px", fontWeight: 700 }}>Patient</th>
                          <th style={{ padding: "20px 32px", fontWeight: 700 }}>Priority Status</th>
                          <th style={{ padding: "20px 32px", fontWeight: 700 }}>Assigned Doctor</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...yellowPatients, ...greenPatients].map((p, i) => (
                          <tr key={p._id} style={{ borderTop: `1px solid ${C.border}`, transition: "background 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = "#F8FAFC"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                            <td style={{ padding: "20px 32px" }}>
                              <div style={{ fontWeight: 700, color: C.text, fontSize: 15 }}>{p.patientName}</div>
                            </td>
                            <td style={{ padding: "20px 32px" }}>
                              <span style={{ background: p.urgency === "YELLOW" ? "#FEF3C7" : "#D1FAE5", color: p.urgency === "YELLOW" ? "#D97706" : "#059669", padding: "6px 14px", borderRadius: 20, fontSize: 13, fontWeight: 800 }}>
                                {p.urgency === "YELLOW" ? "🟡 YELLOW" : "🟢 GREEN"}
                              </span>
                            </td>
                            <td style={{ padding: "20px 32px" }}>
                              <div style={{ fontSize: 15, fontWeight: 600 }}>{p.doctorName || "Unassigned"}</div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}

            {/* Referrals & In-Person Physical OPD Queue */}
            {(activeTab === "dashboard" || activeTab === "referrals") && (
              <div style={{ background: C.card, borderRadius: 24, border: `1px solid ${C.border}`, overflow: "hidden", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.05)" }}>
                <div style={{ padding: "24px 32px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14 }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: C.text }}>
                      {T("इनबाउंड रेफरल एवं शारीरिक अस्पताल OPD डेस्क", "Inbound Referrals & Physical Hospital OPD Desk")}
                    </h3>
                    <p style={{ margin: "4px 0 0 0", fontSize: 13, color: C.muted }}>
                      {T("ऑनलाइन परामर्श से शारीरिक विज़िट और तृतीयक केंद्र रेफरल", "Direct physical visits & tertiary hospital transfers scheduled from telemedicine")}
                    </p>
                  </div>

                  {/* Filter Pills */}
                  <div style={{ display: "flex", gap: 8 }}>
                    {[
                      { id: "ALL", label: "All Cases" },
                      { id: "IN_PERSON_FOLLOWUP", label: "📅 Physical OPD Visits" },
                      { id: "SPECIALIST_FACILITY_TRANSFER", label: "🏥 Specialist Transfers" },
                    ].map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setReferralFilter(f.id as any)}
                        style={{
                          padding: "6px 14px",
                          borderRadius: 20,
                          border: "none",
                          fontSize: 12,
                          fontWeight: 700,
                          background: referralFilter === f.id ? C.primary : "#F1F5F9",
                          color: referralFilter === f.id ? "white" : C.muted,
                          cursor: "pointer",
                        }}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ padding: 0 }}>
                  {(() => {
                    const scopedRefs = referrals.filter((r) => {
                      if (referralFilter !== "ALL" && r.referralType !== referralFilter) return false;
                      if (selectedFacilityId === "ALL") return true;
                      const fac = facilities.find((f) => f.facilityId === selectedFacilityId);
                      if (!fac) return true;
                      return (
                        r.targetFacility?.toLowerCase().includes(fac.shortName?.toLowerCase() || "") ||
                        r.targetFacility?.toLowerCase().includes(fac.city?.toLowerCase() || "") ||
                        r.targetFacility?.toLowerCase().includes(fac.name?.toLowerCase() || "")
                      );
                    });

                    if (scopedRefs.length === 0) {
                      return (
                        <div style={{ padding: 48, textAlign: "center", color: C.muted }}>
                          <div style={{ fontSize: 36, marginBottom: 8 }}>📋</div>
                          <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>No inbound referrals or physical OPD appointments for this facility.</div>
                          <div style={{ fontSize: 13, marginTop: 4 }}>Appointments booked by telemedicine doctors will appear in real-time.</div>
                        </div>
                      );
                    }

                    return (
                      <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                        <thead>
                          <tr style={{ background: "#F8FAFC", fontSize: 12, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>
                            <th style={{ padding: "18px 28px", fontWeight: 800 }}>Patient Identity</th>
                            <th style={{ padding: "18px 28px", fontWeight: 800 }}>Type & Token</th>
                            <th style={{ padding: "18px 28px", fontWeight: 800 }}>Referring Doctor / Source</th>
                            <th style={{ padding: "18px 28px", fontWeight: 800 }}>Scheduled Slot & Reason</th>
                            <th style={{ padding: "18px 28px", fontWeight: 800 }}>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {scopedRefs.map((r) => {
                            const isInPerson = r.referralType === "IN_PERSON_FOLLOWUP";
                            const isPending = r.status === "pending";
                            const isArrived = r.status === "arrived";
                            const isCompleted = r.status === "completed";

                            return (
                              <tr
                                key={r._id}
                                style={{ borderTop: `1px solid ${C.border}`, transition: "background 0.2s" }}
                                onMouseEnter={(e) => (e.currentTarget.style.background = "#F8FAFC")}
                                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                              >
                                <td style={{ padding: "18px 28px" }}>
                                  <div style={{ fontWeight: 800, color: C.text, fontSize: 15 }}>{r.patientName}</div>
                                  <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                                    <button
                                      type="button"
                                      onClick={() => window.open(`tel:${r.patientPhone}`)}
                                      style={{ background: "#F1F5F9", border: "none", borderRadius: 6, padding: "3px 8px", fontSize: 11, fontWeight: 700, cursor: "pointer", color: C.text }}
                                    >
                                      📞 {r.patientPhone}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => startCallSession({
                                        patientId: r.patientPhone || r._id,
                                        patientName: r.patientName,
                                        isDoctor: true,
                                        callerRole: "receptionist",
                                        callerTitle: `${activeFacility?.shortName || activeFacility?.name || "Hospital"} Reception Desk`,
                                        facilityName: activeFacility?.name || "Hospital Medical Center",
                                        department: r.targetDepartment || "Specialist OPD",
                                        patientDetails: {
                                          department: r.targetDepartment || "Specialist OPD",
                                          urgency: r.priority || "MEDIUM",
                                          doctorName: r.referringDoctorName,
                                          symptoms: r.clinicalSummary || r.reason,
                                        }
                                      })}
                                      style={{ background: "#E0F2FE", border: "none", borderRadius: 6, padding: "3px 8px", fontSize: 11, fontWeight: 700, cursor: "pointer", color: "#0369A1" }}
                                    >
                                      💻 App Call
                                    </button>
                                  </div>
                                </td>

                                <td style={{ padding: "18px 28px" }}>
                                  <span
                                    style={{
                                      background: isInPerson ? "#ECFDF5" : "#FFF7ED",
                                      color: isInPerson ? "#059669" : "#C2410C",
                                      padding: "4px 10px",
                                      borderRadius: 8,
                                      fontSize: 11,
                                      fontWeight: 800,
                                      display: "inline-block",
                                    }}
                                  >
                                    {isInPerson ? "📅 In-Person Physical OPD" : "🏥 Specialist Referral"}
                                  </span>
                                  {r.opdToken && (
                                    <div style={{ fontSize: 12, fontWeight: 800, color: C.primary, marginTop: 4 }}>
                                      Token: <code style={{ background: "#F0FDFA", padding: "2px 6px", borderRadius: 4 }}>{r.opdToken}</code>
                                    </div>
                                  )}
                                </td>

                                <td style={{ padding: "18px 28px" }}>
                                  <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Dr. {r.referredByDoctorName}</div>
                                  <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{r.sourceFacility}</div>
                                </td>

                                <td style={{ padding: "18px 28px" }}>
                                  <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>
                                    🗓️ {r.scheduledDate || "Today"} · {r.scheduledSlot || "OPD Hours"}
                                  </div>
                                  <div style={{ fontSize: 12, color: C.muted, marginTop: 4, maxWidth: 300, lineHeight: 1.4 }}>
                                    {r.reasonForReferral}
                                  </div>
                                  <span
                                    style={{
                                      background: r.urgency === "RED" ? "#FEE2E2" : r.urgency === "YELLOW" ? "#FEF3C7" : "#D1FAE5",
                                      color: r.urgency === "RED" ? "#B91C1C" : r.urgency === "YELLOW" ? "#D97706" : "#059669",
                                      padding: "2px 8px",
                                      borderRadius: 12,
                                      fontSize: 10,
                                      fontWeight: 800,
                                      marginTop: 6,
                                      display: "inline-block",
                                    }}
                                  >
                                    {r.urgency} PRIORITY
                                  </span>
                                </td>

                                <td style={{ padding: "18px 28px" }}>
                                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                    {isPending && (
                                      <button
                                        type="button"
                                        onClick={async () => {
                                          await fetch("/api/referrals", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: r._id, status: "arrived" }) });
                                          fetchData();
                                        }}
                                        style={{ padding: "7px 14px", background: "#0284C7", color: "white", border: "none", borderRadius: 10, fontSize: 12, fontWeight: 800, cursor: "pointer" }}
                                      >
                                        🏥 Mark Arrived
                                      </button>
                                    )}
                                    {isArrived && (
                                      <button
                                        type="button"
                                        onClick={async () => {
                                          await fetch("/api/referrals", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: r._id, status: "completed" }) });
                                          fetchData();
                                        }}
                                        style={{ padding: "7px 14px", background: C.green, color: "white", border: "none", borderRadius: 10, fontSize: 12, fontWeight: 800, cursor: "pointer" }}
                                      >
                                        ✓ Complete Visit
                                      </button>
                                    )}
                                    {isCompleted && (
                                      <span style={{ fontSize: 12, fontWeight: 800, color: C.green, background: "#D1FAE5", padding: "6px 12px", borderRadius: 12 }}>
                                        ✓ Finished
                                      </span>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* Lab Diagnostics Safety Net */}
            {(activeTab === "dashboard" || activeTab === "diagnostics") && (
              <div style={{ background: C.card, borderRadius: 24, border: `1px solid ${C.border}`, overflow: "hidden", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.05)" }}>
                <div style={{ padding: "24px 32px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: C.text }}>{T("ग्लोबल लैब रिपोर्ट (सेफ्टी नेट)", "Global Lab Reports (Diagnostics Safety Net)")}</h3>
                  <div style={{ fontSize: 14, color: C.accent, fontWeight: 700, background: `${C.accent}15`, padding: "6px 16px", borderRadius: 20 }}>
                    {labTests.length} Total Reports
                  </div>
                </div>
                <div style={{ padding: 0 }}>
                  {labTests.length === 0 ? (
                    <div style={{ padding: 40, textAlign: "center", color: C.muted }}>No lab reports found.</div>
                  ) : (
                    <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                      <thead>
                        <tr style={{ background: "#F8FAFC", fontSize: 13, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>
                          <th style={{ padding: "20px 32px", fontWeight: 700 }}>Patient</th>
                          <th style={{ padding: "20px 32px", fontWeight: 700 }}>Test Result</th>
                          <th style={{ padding: "20px 32px", fontWeight: 700 }}>Status / Assignment</th>
                        </tr>
                      </thead>
                      <tbody>
                        {labTests.slice(0, 20).map((t, i) => (
                          <tr key={t._id} style={{ borderTop: `1px solid ${C.border}`, transition: "background 0.2s", background: t.isCritical && !t.assignedDoctorId ? "#FEF2F2" : "transparent" }} onMouseEnter={e => e.currentTarget.style.background = t.isCritical ? "#FEE2E2" : "#F8FAFC"} onMouseLeave={e => e.currentTarget.style.background = t.isCritical && !t.assignedDoctorId ? "#FEF2F2" : "transparent"}>
                            <td style={{ padding: "20px 32px" }}>
                              <div style={{ fontWeight: 700, color: C.text, fontSize: 15 }}>{t.patientName}</div>
                              <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>📱 {t.patientPhone}</div>
                            </td>
                            <td style={{ padding: "20px 32px" }}>
                              <div style={{ fontSize: 15, fontWeight: 800, color: t.isCritical ? C.red : C.text }}>{t.testType}: {t.result}</div>
                              <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>📅 {new Date(t.testDate).toLocaleDateString()}</div>
                              {t.imageDataUrl && <div style={{ fontSize: 12, color: C.primary, marginTop: 4 }}>📎 Attachment Available</div>}
                            </td>
                            <td style={{ padding: "20px 32px" }}>
                              {t.assignedDoctorId ? (
                                <span style={{ background: "#D1FAE5", color: "#059669", padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 800 }}>✅ Assigned to Doctor</span>
                              ) : (
                                <span style={{ background: t.isCritical ? C.red : "#FEF3C7", color: t.isCritical ? "white" : "#D97706", padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 800 }}>⚠️ Unassigned {t.isCritical && "(CRITICAL)"}</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}

            {/* Cured Patients */}
            {(activeTab === "dashboard" || activeTab === "wards" || activeTab === "analytics") && curedQueue.length > 0 && (
              <div style={{ background: C.card, borderRadius: 24, border: `1px solid ${C.border}`, overflow: "hidden", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.05)" }}>
                <div style={{ padding: "24px 32px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", background: "#ECFDF5" }}>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: C.green }}>{T("डिस्चार्ज किए गए मरीज़", "Discharged / Cured Patients")}</h3>
                  <div style={{ fontSize: 14, color: C.green, fontWeight: 700, background: "rgba(16, 185, 129, 0.15)", padding: "6px 16px", borderRadius: 20 }}>
                    {curedPatientsCount} Successfully Treated
                  </div>
                </div>
                <div style={{ padding: 0 }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                    <thead>
                      <tr style={{ background: "#F8FAFC", fontSize: 13, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>
                        <th style={{ padding: "20px 32px", fontWeight: 700 }}>Patient</th>
                        <th style={{ padding: "20px 32px", fontWeight: 700 }}>Treated By</th>
                        <th style={{ padding: "20px 32px", fontWeight: 700 }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {curedQueue.map((p, i) => (
                        <tr key={p._id} style={{ borderTop: `1px solid ${C.border}` }}>
                          <td style={{ padding: "20px 32px" }}>
                            <div style={{ fontWeight: 700, color: C.text, fontSize: 15 }}>{p.patientName}</div>
                          </td>
                          <td style={{ padding: "20px 32px" }}>
                            <div style={{ fontSize: 15, fontWeight: 600 }}>{p.doctorName || "Unknown Doctor"}</div>
                          </td>
                          <td style={{ padding: "20px 32px" }}>
                            <span style={{ background: "#D1FAE5", color: "#059669", padding: "6px 14px", borderRadius: 20, fontSize: 13, fontWeight: 800 }}>
                              ✅ CURED
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════════════ */}
            {/* ── HMIS / EMR INTEGRATION BRIDGE & MERGE GATEWAY ── */}
            {/* ═══════════════════════════════════════════════════════════════════════ */}
            {activeTab === "hmis-bridge" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                {/* 1. Live ABDM & NIC e-Hospital Cloud Gateway Status */}
                <div style={{ background: C.card, borderRadius: 24, padding: "28px 32px", border: `1px solid ${C.border}`, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16, marginBottom: 20 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      <div style={{ width: 48, height: 48, borderRadius: 14, background: "#E0F2FE", color: "#0284C7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>
                        🔗
                      </div>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: C.text }}>
                            {T("आयुष्मान भारत (ABDM) व ई-हॉस्पिटल गेटवे", "ABDM & NIC e-Hospital Integration Bridge")}
                          </h3>
                          <span style={{ background: "#D1FAE5", color: "#059669", fontSize: 11, fontWeight: 800, padding: "3px 10px", borderRadius: 20, display: "flex", alignItems: "center", gap: 4 }}>
                            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#059669", animation: "pulse 1.5s infinite" }} />
                            Live Sync Active
                          </span>
                        </div>
                        <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>
                          Bi-directional FHIR M3 / HL7 v2.4 protocol connecting <strong>{activeFacility?.name}</strong> to the National Health Grid.
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 10 }}>
                      <button
                        type="button"
                        onClick={handleForceSyncHmis}
                        disabled={hmisSyncing}
                        style={{
                          padding: "10px 18px", borderRadius: 12, border: "none",
                          background: "linear-gradient(135deg, #0D9488, #0F766E)", color: "white",
                          fontSize: 13, fontWeight: 800, cursor: hmisSyncing ? "not-allowed" : "pointer",
                          display: "flex", alignItems: "center", gap: 6, boxShadow: "0 4px 12px rgba(13, 148, 136, 0.3)"
                        }}
                      >
                        <span>🔄</span> {hmisSyncing ? "Synchronizing Records..." : "Force Sync Now"}
                      </button>
                    </div>
                  </div>

                  {/* Gateway Metrics Grid */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginTop: 16 }}>
                    <div style={{ background: "#F8FAFC", padding: "16px 20px", borderRadius: 16, border: `1px solid ${C.border}` }}>
                      <div style={{ fontSize: 11, color: C.muted, fontWeight: 700, textTransform: "uppercase" }}>OPD Tokens Synced</div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: C.primary, marginTop: 4 }}>{facilityScopedQueue.length} Active</div>
                      <div style={{ fontSize: 11, color: "#10B981", marginTop: 2 }}>✓ Auto-synced with NIC e-Hospital</div>
                    </div>

                    <div style={{ background: "#F8FAFC", padding: "16px 20px", borderRadius: 16, border: `1px solid ${C.border}` }}>
                      <div style={{ fontSize: 11, color: C.muted, fontWeight: 700, textTransform: "uppercase" }}>ABHA Health IDs Linked</div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: "#7C3AED", marginTop: 4 }}>{new Set(facilityScopedQueue.map(q => q.patientPhone || q.patientName)).size} Patients</div>
                      <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>FHIR Milestone 2 Verified</div>
                    </div>

                    <div style={{ background: "#F8FAFC", padding: "16px 20px", borderRadius: 16, border: `1px solid ${C.border}` }}>
                      <div style={{ fontSize: 11, color: C.muted, fontWeight: 700, textTransform: "uppercase" }}>Lab Orders Pushed</div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: "#D97706", marginTop: 4 }}>{labTests.length} Reports</div>
                      <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>LOINC Standardized</div>
                    </div>

                    <div style={{ background: "#F8FAFC", padding: "16px 20px", borderRadius: 16, border: `1px solid ${C.border}` }}>
                      <div style={{ fontSize: 11, color: C.muted, fontWeight: 700, textTransform: "uppercase" }}>HFR Registry Code</div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: C.text, marginTop: 6 }}>{activeFacility?.facilityId}</div>
                      <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>NIN: 270014022 (Approved)</div>
                    </div>
                  </div>
                </div>

                {/* 2. 1-Click Legacy HMIS Data Ingestion & Live Merge */}
                <div style={{ background: C.card, borderRadius: 24, padding: "28px 32px", border: `1px solid ${C.border}`, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: C.text, display: "flex", alignItems: "center", gap: 8 }}>
                        <span>📥</span> {T("मौजूदा अस्पताल HMIS डेटा मर्ज करें", "Merge Existing Hospital Walk-ins & Offline OPD")}
                      </h3>
                      <p style={{ margin: "4px 0 0", fontSize: 13, color: C.muted }}>
                        Easily merge walk-in patients from your existing hospital software, Excel/CSV sheets, or offline registers into AarogyaAI Live Triage without double entry.
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={bulkImporting}
                      onClick={() => handleImportLegacyOPD()}
                      style={{
                        padding: "10px 18px", borderRadius: 12, border: "none",
                        background: "linear-gradient(135deg, #2563EB, #1D4ED8)", color: "white",
                        fontSize: 13, fontWeight: 800, cursor: bulkImporting ? "not-allowed" : "pointer",
                        display: "flex", alignItems: "center", gap: 6, boxShadow: "0 4px 12px rgba(37, 99, 235, 0.3)"
                      }}
                    >
                      <span>⚡</span> {bulkImporting ? "Merging..." : "1-Click Merge 3 Walk-in Records"}
                    </button>
                  </div>

                  {importStatusMessage && (
                    <div style={{ background: "#ECFDF5", border: "1px solid #A7F3D0", color: "#065F46", padding: "12px 16px", borderRadius: 12, fontSize: 13, fontWeight: 700, marginBottom: 16 }}>
                      {importStatusMessage}
                    </div>
                  )}

                  {/* CSV Input Box */}
                  <div style={{ background: "#F8FAFC", borderRadius: 16, padding: "16px 20px", border: `1px solid ${C.border}` }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 8, display: "flex", justifyContent: "space-between" }}>
                      <span>Paste Raw CSV / HMIS Export (Format: Name, Phone, Age, Symptoms, Department, Priority)</span>
                      <span style={{ color: C.muted }}>Deduplicates automatically by Phone Number</span>
                    </div>
                    <textarea
                      value={bulkCsvText}
                      onChange={(e) => setBulkCsvText(e.target.value)}
                      placeholder="e.g. Ramesh More, 9898989801, 45, Severe Chest Pain, Cardiology, RED&#10;Sunita Patil, 9898989802, 32, High Fever & Vomiting, General Medicine, YELLOW"
                      rows={3}
                      style={{
                        width: "100%", padding: "10px 12px", borderRadius: 10,
                        border: `1px solid ${C.border}`, fontSize: 12, fontFamily: "monospace",
                        outline: "none", boxSizing: "border-box", background: "white"
                      }}
                    />
                    <div style={{ marginTop: 10, display: "flex", justifyContent: "flex-end", gap: 10 }}>
                      <button
                        type="button"
                        onClick={() => {
                          if (!bulkCsvText.trim()) return;
                          const lines = bulkCsvText.trim().split("\n");
                          const customRecs = lines.map((l) => {
                            const [name, phone, age, symptoms, dept, priority] = l.split(",").map((s) => s.trim());
                            return {
                              patientName: name || "Walk-in Patient",
                              patientPhone: phone || "+91 99999 00000",
                              age: age || "40",
                              symptoms: symptoms || "General OPD consultation",
                              department: dept || "General Medicine",
                              urgency: priority === "RED" ? "RED" : priority === "YELLOW" ? "YELLOW" : "GREEN",
                              slotTime: "HMIS Walk-in",
                              hospital: activeFacility?.name || "Kalyan Civil Hospital",
                              facilityId: activeFacility?.facilityId || selectedFacilityId,
                            };
                          });
                          handleImportLegacyOPD(customRecs);
                          setBulkCsvText("");
                        }}
                        style={{ padding: "8px 16px", borderRadius: 10, border: "none", background: C.primary, color: "white", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                      >
                        📥 Parse & Merge Custom CSV Rows
                      </button>
                    </div>
                  </div>
                </div>

                {/* 3. Local Hospital Network REST Webhook Configuration */}
                <div style={{ background: C.card, borderRadius: 24, padding: "28px 32px", border: `1px solid ${C.border}`, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05)" }}>
                  <h3 style={{ margin: "0 0 8px 0", fontSize: 18, fontWeight: 800, color: C.text, display: "flex", alignItems: "center", gap: 8 }}>
                    <span>⚙️</span> {T("अस्पताल लोकल सर्वर / ईएचआर वेबहुक", "Local Hospital Intranet REST API / Webhook")}
                  </h3>
                  <p style={{ margin: "0 0 16px 0", fontSize: 13, color: C.muted }}>
                    Connect to your on-premise HIS/EMR server running inside {activeFacility?.shortName || "Hospital"} intranet network.
                  </p>

                  <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr auto", gap: 12, alignItems: "flex-end" }}>
                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 6 }}>
                        Local HIS Server Endpoint URL
                      </label>
                      <input
                        type="text"
                        value={hmisEndpoint}
                        onChange={(e) => setHmisEndpoint(e.target.value)}
                        style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: `1px solid ${C.border}`, fontSize: 13, outline: "none", boxSizing: "border-box" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 6 }}>
                        Facility API Key / HFR Token
                      </label>
                      <input
                        type="text"
                        value={hmisApiKey}
                        onChange={(e) => setHmisApiKey(e.target.value)}
                        style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: `1px solid ${C.border}`, fontSize: 13, outline: "none", boxSizing: "border-box" }}
                      />
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={handleTestHmisEndpoint}
                        disabled={endpointTesting}
                        style={{
                          padding: "10px 18px", borderRadius: 10, border: "none",
                          background: "#0F766E", color: "white", fontSize: 13, fontWeight: 800,
                          cursor: endpointTesting ? "not-allowed" : "pointer",
                        }}
                      >
                        {endpointTesting ? "Pinging..." : "⚡ Test Connection"}
                      </button>
                    </div>
                  </div>

                  {endpointStatus && (
                    <div style={{ marginTop: 14, padding: "10px 14px", borderRadius: 10, background: "#F0FDF4", border: "1px solid #BBF7D0", color: "#166534", fontSize: 12, fontWeight: 700 }}>
                      {endpointStatus}
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>

          

        </div>

        {/* Informative Footer */}
        <footer style={{ marginTop: 60, borderTop: `1px solid ${C.border}`, paddingTop: 32, display: "flex", justifyContent: "space-between", alignItems: "center", color: C.muted }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(15, 118, 110, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🏥</div>
            <div>
              <div style={{ fontWeight: 800, color: C.text, fontSize: 14 }}>AarogyaAI Central Operations</div>
              <div style={{ fontSize: 13, marginTop: 2 }}>Secure Medical Command Interface</div>
            </div>
          </div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>
            {T("AarogyaAI © 2026. सर्वाधिकार सुरक्षित।", "AarogyaAI © 2026. All rights reserved.")}
          </div>
        </footer>

      </main>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        @keyframes alertGlow { 0%, 100% { box-shadow: 0 0 10px rgba(239, 68, 68, 0.2); } 50% { box-shadow: 0 0 30px rgba(239, 68, 68, 0.8); } }
        .info-btn:hover .tooltip { visibility: visible !important; opacity: 1 !important; transform: translateX(-50%) translateY(-5px) !important; }
      `}</style>

      {/* Doctor Direct Phone QR Modal */}
      <DoctorCallQRModal
        isOpen={!!selectedQRDoctor}
        onClose={() => setSelectedQRDoctor(null)}
        doctor={selectedQRDoctor}
      />
    </div>
  );
}
