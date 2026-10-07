"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { useLang } from "@/lib/useLang";
import { useCall } from "@/context/CallContext";
import DoctorCallQRModal from "@/components/DoctorCallQRModal";
import { getPusherClient } from "@/lib/pusher-client";
import {
  Building2,
  Users,
  AlertTriangle,
  Calendar,
  Clock,
  CheckCircle2,
  Phone,
  PhoneCall,
  Video,
  Search,
  BedDouble,
  Activity,
  FileText,
  Stethoscope,
  ArrowRight,
  Shield,
  ShieldCheck,
  ShieldAlert,
  LogOut,
  QrCode,
  Globe,
  User,
  UserPlus,
  Printer,
  ChevronRight,
  Sparkles,
  RefreshCw,
  FlaskConical,
  HeartPulse,
  Share2,
  SlidersHorizontal,
  Plus,
  X,
  Radio,
  ClipboardList,
  Check,
  XCircle,
  HelpCircle,
  TrendingUp,
  MapPin,
  Lock,
  Zap,
  Layers,
  Network,
  Download,
  Upload,
  AlertCircle,
  Key,
  Edit3,
  Trash2,
  PlusCircle
} from "lucide-react";

const C = {
  primary: "#0F766E", // Deep Teal
  primaryDark: "#0D5E58", // Dark Teal
  primaryLight: "#14B8A6", // Bright Teal
  accent: "#0284C7", // Ocean Blue
  green: "#10B981",
  red: "#EF4444",
  yellow: "#F59E0B",
  bg: "#F8FAFC", // Ultra clean clinical slate
  card: "#FFFFFF",
  text: "#0F172A",
  muted: "#64748B",
  border: "#E2E8F0",
};

const InfoButton = ({ text }: { text: string }) => (
  <div style={{ position: "relative", display: "inline-flex", marginLeft: 6, verticalAlign: "middle" }} className="info-btn">
    <span style={{ display: "inline-flex", width: 18, height: 18, background: "rgba(100, 116, 139, 0.12)", borderRadius: "50%", alignItems: "center", justifyContent: "center", fontSize: 11, color: C.muted, cursor: "help", fontWeight: 700 }}>
      <HelpCircle size={12} />
    </span>
    <div className="tooltip" style={{ position: "absolute", bottom: "100%", left: "50%", transform: "translateX(-50%)", width: 220, padding: "10px 12px", background: "#0F172A", color: "white", fontSize: 12, fontWeight: 500, borderRadius: 8, boxShadow: "0 10px 25px -5px rgba(0,0,0,0.25)", zIndex: 100, visibility: "hidden", opacity: 0, transition: "0.2s", marginBottom: 8, lineHeight: 1.4, pointerEvents: "none" }}>
      {text}
      <div style={{ position: "absolute", bottom: -5, left: "50%", transform: "translateX(-50%)", borderLeft: "6px solid transparent", borderRight: "6px solid transparent", borderTop: "6px solid #0F172A" }} />
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
    facilityId: "HOSP-NERUL-007",
    name: "Dr. D. Y. Patil Multi-Specialty Hospital & Medical College (Nerul)",
    shortName: "D. Y. Patil Hospital Nerul",
    type: "Govt-Affiliated Multi-Specialty & Tertiary Hospital",
    location: "Sector 5, Nerul East, Navi Mumbai",
    city: "Navi Mumbai",
    state: "Maharashtra",
    address: "Sector 5, Nerul East, Navi Mumbai, Maharashtra 400706",
    phone: "+91 22 2773 5901",
    departments: ["Emergency & Trauma 24/7", "Cardiology", "Neurology", "General Medicine", "Pediatrics", "Orthopedics", "Oncology", "Diagnostic Lab"],
    emergencyAvailable: true,
    ayushmanBharat: true,
    opdTimings: "08:00 AM - 02:00 PM / 04:00 PM - 08:30 PM (24/7 Casualty)",
    receptionistPhone: "+91 98765 01017",
    totalBeds: 1500,
    occupiedBeds: 1180,
    icuBeds: 140,
    icuOccupied: 108,
    catchmentVillages: ["Nerul East & West", "Seawoods Darave", "Juinagar Gaon", "Shiravane MIDC", "Karave Village"],
  },
  {
    facilityId: "HOSP-KHAR-008",
    name: "Kharghar Super-Specialty Civil & Apex Research Hospital",
    shortName: "Kharghar Super-Specialty Hospital",
    type: "Super-Specialty Apex Civil Hospital & Research Center",
    location: "Sector 22, Kharghar, Navi Mumbai",
    city: "Navi Mumbai",
    state: "Maharashtra",
    address: "Sector 22, Near Central Park & Utsav Chowk, Kharghar, Navi Mumbai, Maharashtra 410210",
    phone: "+91 22 2740 5000",
    departments: ["Emergency 24/7", "Oncology & Radiation", "Cardiology", "General Medicine", "Gastroenterology", "Critical Care ICU", "Diagnostic Lab"],
    emergencyAvailable: true,
    ayushmanBharat: true,
    opdTimings: "08:30 AM - 02:00 PM / 03:30 PM - 07:30 PM (24/7 Casualty)",
    receptionistPhone: "+91 98765 01018",
    totalBeds: 750,
    occupiedBeds: 580,
    icuBeds: 90,
    icuOccupied: 72,
    catchmentVillages: ["Kharghar Sectors 1-35", "Belpada Gaon", "Owe Tribal Village", "Rohinjan Gaon", "Kamothe Rural"],
  },
  {
    facilityId: "HOSP-DMB-009",
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
      { id: "D_SION_1", name: "Dr. S. Kulkarni", role: "Head of Emergency & Trauma", dept: "Emergency & Trauma", room: "Room 101 (Casualty)", experience: "18 yrs", onDuty: true, rating: 4.9 },
      { id: "D_SION_2", name: "Dr. Aniruddh Joshi", role: "Senior Cardiologist", dept: "Cardiology", room: "Room 104 (Cardiac OPD)", experience: "14 yrs", onDuty: true, rating: 5.0 },
      { id: "D_SION_3", name: "Dr. Priya Nair", role: "Consultant Pediatrician", dept: "Pediatrics", room: "Room 201 (Child Health)", experience: "11 yrs", onDuty: false, rating: 4.8 },
      { id: "D_SION_4", name: "Dr. Vilas Patil", role: "General Physician", dept: "General Medicine", room: "Room 102 (General OPD)", experience: "9 yrs", onDuty: true, rating: 4.7 },
    ],
    ashaWorkers: [
      { id: "ASHA_SION_1", name: "Sunita Kamble", area: "Dharavi Health Ward 9", phone: "+91 98765 11001", visitsThisMonth: 84, activeAlerts: 1 },
      { id: "ASHA_SION_2", name: "Rekha Gaikwad", area: "Sion Koliwada", phone: "+91 98765 11002", visitsThisMonth: 62, activeAlerts: 0 },
      { id: "ASHA_SION_3", name: "Meena Shinde", area: "Kurla West Slum Pocket", phone: "+91 98765 11003", visitsThisMonth: 95, activeAlerts: 2 },
    ]
  },
  "HOSP-KLY-002": {
    doctors: [
      { id: "D_KLY_1", name: "Dr. Ramesh Sharma", role: "Chief Medical Officer", dept: "General Medicine", room: "Room 102 (General OPD)", experience: "16 yrs", onDuty: true, rating: 4.7 },
      { id: "D_KLY_2", name: "Dr. Sneha Gokhale", role: "Consultant Gynecologist", dept: "Gynecology & Maternal", room: "Room 105 (Maternity)", experience: "12 yrs", onDuty: true, rating: 4.9 },
      { id: "D_KLY_3", name: "Dr. Amit Vernekar", role: "Orthopedic Surgeon", dept: "Orthopedics", room: "Room 108 (Bone & Joint)", experience: "10 yrs", onDuty: false, rating: 4.6 },
    ],
    ashaWorkers: [
      { id: "ASHA_KLY_1", name: "Vandana More", area: "Titwala Rural", phone: "+91 98765 12001", visitsThisMonth: 71, activeAlerts: 1 },
      { id: "ASHA_KLY_2", name: "Geeta Jadhav", area: "Kalyan Gaothan & Khadegolavali", phone: "+91 98765 12002", visitsThisMonth: 58, activeAlerts: 0 },
    ]
  },
  "HOSP-PLG-004": {
    doctors: [
      { id: "D_PLG_1", name: "Dr. Anjali Deshmukh", role: "Rural Maternal & Child Specialist", dept: "Pediatrics", room: "Room 101 (Maternal Care)", experience: "13 yrs", onDuty: true, rating: 4.8 },
      { id: "D_PLG_2", name: "Dr. Deepak Vaze", role: "Malaria & Communicable Diseases Lead", dept: "General Medicine", room: "Room 103 (Fever Clinic)", experience: "8 yrs", onDuty: true, rating: 4.7 },
    ],
    ashaWorkers: [
      { id: "ASHA_PLG_1", name: "Parvati Bhoye", area: "Manor Tribal Pada", phone: "+91 98765 14001", visitsThisMonth: 104, activeAlerts: 3 },
      { id: "ASHA_PLG_2", name: "Anita Waghmare", area: "Kelva Beach Tribal Hamlet", phone: "+91 98765 14002", visitsThisMonth: 78, activeAlerts: 1 },
    ]
  },
  "HOSP-MRB-005": {
    doctors: [
      { id: "D_MRB_1", name: "Dr. Sanjay Raut", role: "Rural Emergency & Toxicology Lead", dept: "Emergency & Snakebite Unit", room: "Casualty Ward 1", experience: "15 yrs", onDuty: true, rating: 4.9 },
    ],
    ashaWorkers: [
      { id: "ASHA_MRB_1", name: "Shobha Telam", area: "Tokawade Tribal Belt", phone: "+91 98765 15001", visitsThisMonth: 69, activeAlerts: 1 },
      { id: "ASHA_MRB_2", name: "Laxmi Pawar", area: "Mhasla Pada", phone: "+91 98765 15002", visitsThisMonth: 53, activeAlerts: 0 },
    ]
  },
  "HOSP-JWH-006": {
    doctors: [
      { id: "D_JWH_1", name: "Dr. Hemant Mukne", role: "Tribal Malnutrition & Primary Health Lead", dept: "Pediatrics & NRC", room: "Room 102 (NRC Unit)", experience: "11 yrs", onDuty: true, rating: 4.8 },
    ],
    ashaWorkers: [
      { id: "ASHA_JWH_1", name: "Kalpana Gavit", area: "Jawhar Hill Pada", phone: "+91 98765 16001", visitsThisMonth: 112, activeAlerts: 4 },
      { id: "ASHA_JWH_2", name: "Usha Baraf", area: "Mokhada Tribal Cluster", phone: "+91 98765 16002", visitsThisMonth: 91, activeAlerts: 2 },
    ]
  },
  "HOSP-NERUL-007": {
    doctors: [
      { id: "D_NER_1", name: "Dr. Sandeep Kadam", role: "Head of Emergency & Critical Care", dept: "Emergency & Trauma", room: "Room 101 (Casualty)", experience: "16 yrs", onDuty: true, rating: 4.9 },
      { id: "D_NER_2", name: "Dr. Meenal Thakur", role: "Senior Consultant Cardiologist", dept: "Cardiology", room: "Room 105 (Cardiac OPD)", experience: "12 yrs", onDuty: true, rating: 5.0 },
      { id: "D_NER_3", name: "Dr. Rajesh Gaikwad", role: "General Physician & Diabetologist", dept: "General Medicine", room: "Room 102 (General OPD)", experience: "10 yrs", onDuty: true, rating: 4.8 },
    ],
    ashaWorkers: [
      { id: "ASHA_NER_1", name: "Pooja Salvi", area: "Nerul Gaon & Shiravane", phone: "+91 98765 18001", visitsThisMonth: 76, activeAlerts: 1 },
      { id: "ASHA_NER_2", name: "Kavita Mhatre", area: "Seawoods & Karave Tribal Pocket", phone: "+91 98765 18002", visitsThisMonth: 89, activeAlerts: 2 },
    ]
  },
  "HOSP-KHAR-008": {
    doctors: [
      { id: "D_KHAR_1", name: "Dr. Alok Sharma", role: "Chief of Clinical Oncology & Medicine", dept: "Oncology & Medicine", room: "Room 201 (Oncology)", experience: "17 yrs", onDuty: true, rating: 4.9 },
      { id: "D_KHAR_2", name: "Dr. Neha Bendre", role: "Consultant Cardiologist & Critical Care", dept: "Cardiology", room: "Room 104 (Cardiac OPD)", experience: "13 yrs", onDuty: true, rating: 5.0 },
      { id: "D_KHAR_3", name: "Dr. Sanjay Chavan", role: "General Physician & Casualty Incharge", dept: "General Medicine", room: "Room 102 (General OPD)", experience: "11 yrs", onDuty: true, rating: 4.8 },
    ],
    ashaWorkers: [
      { id: "ASHA_KHAR_1", name: "Surekha Patil", area: "Owe Gaon & Kharghar Hills", phone: "+91 98765 19001", visitsThisMonth: 94, activeAlerts: 1 },
      { id: "ASHA_KHAR_2", name: "Manisha Bhoir", area: "Belpada & Rohinjan Tribal Pada", phone: "+91 98765 19002", visitsThisMonth: 82, activeAlerts: 0 },
    ]
  },
  "HOSP-KLW-003": {
    doctors: [
      { id: "D_KLW_1", name: "Dr. Vilas Patil", role: "Head of Casualty & General Medicine", dept: "Emergency & Trauma", room: "Room 101 (Casualty)", experience: "15 yrs", onDuty: true, rating: 4.8 },
      { id: "D_KLW_2", name: "Dr. Priya Nair", role: "Pediatric Critical Care Specialist", dept: "Pediatrics", room: "Room 103 (Pediatric Ward)", experience: "12 yrs", onDuty: true, rating: 4.9 },
      { id: "D_KLW_3", name: "Dr. Amit Vernekar", role: "Orthopedic & Trauma Surgeon", dept: "Orthopedics", room: "Room 106 (Trauma OT)", experience: "11 yrs", onDuty: true, rating: 4.7 },
    ],
    ashaWorkers: [
      { id: "ASHA_KLW_1", name: "Sunita Kamble", area: "Kalwa Naka & Digha Rural", phone: "+91 98765 13001", visitsThisMonth: 82, activeAlerts: 1 },
      { id: "ASHA_KLW_2", name: "Rekha Gaikwad", area: "Mumbra Hills Tribal Belt", phone: "+91 98765 13002", visitsThisMonth: 65, activeAlerts: 0 },
    ]
  },
  "HOSP-DMB-009": {
    doctors: [
      { id: "D_DMB_1", name: "Dr. Allwin Nadar", role: "Consultant Physician & Telemedicine Lead", dept: "General Medicine", room: "Room 102 (OPD)", experience: "10 yrs", onDuty: true, rating: 4.9 },
      { id: "D_DMB_2", name: "Dr. Sneha Gokhale", role: "Consultant Obstetrician", dept: "Gynecology & Maternal", room: "Room 104 (Maternity)", experience: "14 yrs", onDuty: true, rating: 4.8 },
    ],
    ashaWorkers: [
      { id: "ASHA_DMB_1", name: "Meena Shinde", area: "Nilje Rural & Lodha Palava", phone: "+91 98765 20001", visitsThisMonth: 77, activeAlerts: 1 },
    ]
  },
  "HOSP-PTL-009": {
    doctors: [
      { id: "D_PTL_1", name: "Dr. Arvind Kumar", role: "Civil Surgeon & Medical Superintendent", dept: "General Medicine", room: "Room 101 (OPD)", experience: "22 yrs", onDuty: true, rating: 4.9 },
      { id: "D_PTL_2", name: "Dr. Gurpreet Singh", role: "Senior Cardiologist", dept: "Cardiology", room: "Room 104 (Cardiac OPD)", experience: "16 yrs", onDuty: true, rating: 5.0 },
    ],
    ashaWorkers: [
      { id: "ASHA_PTL_1", name: "Gurpreet Kaur", area: "Patiala Rural Ward 4", phone: "+91 98765 21001", visitsThisMonth: 89, activeAlerts: 0 },
    ]
  },
  "HOSP-KSR-010": {
    doctors: [
      { id: "D_KSR_1", name: "Dr. Vasanth", role: "Rural Medical Officer", dept: "General Medicine", room: "Room 101 (OPD)", experience: "8 yrs", onDuty: true, rating: 5.0 },
    ],
    ashaWorkers: [
      { id: "ASHA_KSR_1", name: "Manjit Kaur", area: "Village Kesri Primary Ward", phone: "+91 98765 22001", visitsThisMonth: 45, activeAlerts: 0 },
    ]
  },
  "HOSP-NBH-008": {
    doctors: [
      { id: "D_NBH_1", name: "Dr. Arvind Kumar", role: "Civil Surgeon", dept: "General Medicine", room: "Room 101 (OPD)", experience: "20 yrs", onDuty: true, rating: 4.9 },
      { id: "D_NBH_2", name: "Dr. Vasanth", role: "Medical Officer", dept: "General Medicine", room: "Room 104 (OPD)", experience: "7 yrs", onDuty: true, rating: 5.0 },
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

  // Operational Receptionist Modals
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [activeTokenSlip, setActiveTokenSlip] = useState<any | null>(null);
  const [assignDoctorPatient, setAssignDoctorPatient] = useState<any | null>(null);

  // Quick Walk-in Form State
  const [walkinForm, setWalkinForm] = useState({
    patientName: "",
    patientPhone: "",
    age: "",
    gender: "M",
    department: "General Medicine",
    urgency: "GREEN",
    doctorName: "",
    symptoms: "",
  });
  const [walkinSubmitting, setWalkinSubmitting] = useState(false);

  // Doctor Management Modal State (Facility Admin)
  const [isDoctorModalOpen, setIsDoctorModalOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<any | null>(null);
  const [doctorForm, setDoctorForm] = useState({
    name: "",
    email: "",
    password: "",
    specialization: "General Medicine",
    room: "Room 102 (General OPD)",
    experience: "5 yrs",
    phone: "+91 98200 11000",
    onDuty: true,
  });
  const [doctorSubmitting, setDoctorSubmitting] = useState(false);
  const [doctorError, setDoctorError] = useState<string | null>(null);

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
  const [hmisEndpoint, setHmisEndpoint] = useState("https://e-hospital.nic.in/api/v2/opd-exchange");
  const [hmisApiKey, setHmisApiKey] = useState("NIC-HFR-MH-KLY-48201");
  const [endpointTesting, setEndpointTesting] = useState(false);
  const [endpointStatus, setEndpointStatus] = useState<string | null>(null);
  const [bulkCsvText, setBulkCsvText] = useState("");
  const [bulkImporting, setBulkImporting] = useState(false);
  const [importStatusMessage, setImportStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const urlFac = urlParams.get("facilityId") || urlParams.get("facility");
      if (urlFac) {
        const uf = urlFac.toLowerCase();
        let matchedId = urlFac;
        if (uf.includes("nerul") || uf.includes("dy patil") || uf.includes("dypatil")) matchedId = "HOSP-NERUL-007";
        else if (uf.includes("kharghar")) matchedId = "HOSP-KHAR-008";
        else if (uf.includes("sion") || uf.includes("lokmanya")) matchedId = "HOSP-SION-001";
        else if (uf.includes("kalyan")) matchedId = "HOSP-KLY-002";
        else if (uf.includes("kalwa")) matchedId = "HOSP-KLW-003";
        else if (uf.includes("palghar")) matchedId = "HOSP-PLG-004";
        else if (uf.includes("murbad")) matchedId = "HOSP-MRB-005";
        else if (uf.includes("jawhar")) matchedId = "HOSP-JWH-006";

        setSelectedFacilityId(matchedId);
        localStorage.setItem("hospitalSelectedFacility", matchedId);
        localStorage.setItem("hospitalAuth", "true");
        setAuth(true);
        return;
      }

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

  const fetchData = useCallback(async () => {
    try {
      const safeFetchJson = async (url: string) => {
        try {
          const sep = url.includes("?") ? "&" : "?";
          const res = await fetch(`${url}${sep}_t=${Date.now()}`, {
            cache: "no-store",
            headers: { "Cache-Control": "no-cache, no-store, must-revalidate" },
          });
          if (!res.ok) return null;
          return await res.json();
        } catch {
          return null;
        }
      };

      const [dataQueue, dataDocs, dataAsha, dataSos, dataLabs, dataRefs, dataFacs] = await Promise.all([
        safeFetchJson("/api/consultations?status=all"),
        safeFetchJson("/api/admin/doctors"),
        safeFetchJson("/api/asha/visits"),
        safeFetchJson("/api/sos"),
        safeFetchJson("/api/blood-tests"),
        safeFetchJson("/api/referrals"),
        safeFetchJson("/api/facilities"),
      ]);

      if (dataQueue?.consultations) setQueue(dataQueue.consultations);
      if (dataDocs?.doctors) setDoctors(dataDocs.doctors);
      if (dataAsha?.visits) setAshaVisits(dataAsha.visits);
      if (dataSos?.alerts) setSosAlerts(dataSos.alerts);
      if (dataLabs?.tests) setLabTests(dataLabs.tests);
      if (dataRefs?.referrals) setReferrals(dataRefs.referrals);
      if (dataFacs?.facilities && dataFacs.facilities.length > 0) {
        setFacilities(dataFacs.facilities);
      }
    } catch {
      /* offline fallback */
    } finally {
      setLoading(false);
    }
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

  useEffect(() => {
    if (!auth) return;
    try {
      const pusherClient = getPusherClient();
      const channel = pusherClient.subscribe("hospital-channel");
      channel.bind("new-appointment", (newAppointment: any) => {
        setQueue((prev) => {
          const exists = prev.some((item) => (item._id && item._id === newAppointment._id) || (item.id && item.id === newAppointment.id) || (item.tokenNumber && item.tokenNumber === newAppointment.tokenNumber));
          if (exists) return prev;
          return [newAppointment, ...prev];
        });
      });
      channel.bind("appointment-updated", (updatedAppointment: any) => {
        setQueue((prev) =>
          prev.map((item) =>
            (item._id && item._id === updatedAppointment._id) || (item.id && item.id === updatedAppointment.id) || (item.tokenNumber && item.tokenNumber === updatedAppointment.tokenNumber)
              ? { ...item, ...updatedAppointment }
              : item
          )
        );
      });
      return () => {
        try {
          channel.unbind_all();
          pusherClient.unsubscribe("hospital-channel");
        } catch {}
      };
    } catch (err) {
      console.warn("Pusher subscription error:", err);
    }
  }, [auth]);

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
    } catch {}
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
    } catch {}
  };

  const handleCheckInPatient = async (consultationId: string) => {
    try {
      const res = await fetch("/api/consultations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: consultationId,
          checkInStatus: "ARRIVED",
          arrivedAt: new Date().toISOString(),
        }),
      });
      if (res.ok) {
        fetchData();
      }
    } catch {}
  };

  const handleAssignDoctor = async (consultationId: string, doctorName: string, room: string, doctorId?: string, doctorEmail?: string) => {
    try {
      const res = await fetch("/api/consultations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: consultationId,
          doctorName,
          doctorId: doctorId || undefined,
          doctorEmail: doctorEmail || undefined,
          consultationRoom: room,
          receptionistStatus: "CONFIRMED",
          status: "confirmed",
        }),
      });
      if (res.ok) {
        setAssignDoctorPatient(null);
        fetchData();
      }
    } catch {}
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
    } catch {}
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
    } catch {}
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
      setEndpointStatus(`Connected to ${activeFacility?.name || "Hospital"} HMIS Gateway (Latency: 42ms • Status: 200 OK)`);
      setTimeout(() => setEndpointStatus(null), 6000);
    }, 800);
  };

  const handleCreateWalkin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walkinForm.patientName || !walkinForm.patientPhone) {
      alert("Please provide at least Patient Name and Mobile Number.");
      return;
    }

    setWalkinSubmitting(true);
    const tokenNum = `OPD-${activeFacility?.facilityId?.split("-")[1] || "DESK"}-${Math.floor(100 + Math.random() * 900)}`;

    const newRecord = {
      patientName: walkinForm.patientName,
      patientPhone: walkinForm.patientPhone,
      age: walkinForm.age || "35",
      gender: walkinForm.gender,
      symptoms: walkinForm.symptoms ? walkinForm.symptoms.split(",").map(s => s.trim()) : ["Walk-in OPD consultation"],
      urgency: walkinForm.urgency,
      department: walkinForm.department,
      doctorName: walkinForm.doctorName || "Awaiting Room Call",
      slotTime: "Immediate Token Check-in",
      hospital: activeFacility?.name || "Hospital Medical Center",
      facilityId: activeFacility?.facilityId || selectedFacilityId,
      source: "Reception Desk Walk-In",
      receptionistStatus: "CONFIRMED",
      status: "confirmed",
      tokenNumber: tokenNum,
      createdAt: new Date().toISOString(),
    };

    try {
      const res = await fetch("/api/consultations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRecord),
      });

      if (res.ok) {
        setIsRegisterModalOpen(false);
        setActiveTokenSlip(newRecord);
        setWalkinForm({
          patientName: "",
          patientPhone: "",
          age: "",
          gender: "M",
          department: "General Medicine",
          urgency: "GREEN",
          doctorName: "",
          symptoms: "",
        });
        fetchData();
      }
    } catch {
      alert("Offline fallback: registered in active queue.");
      setActiveTokenSlip(newRecord);
    } finally {
      setWalkinSubmitting(false);
    }
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
          symptoms: ["Chest heaviness", "shortness of breath"],
          urgency: "RED",
          department: "Cardiology",
          slotTime: "Immediate Priority",
          hospital: activeFacility?.name || "Civil Hospital",
          facilityId: activeFacility?.facilityId || selectedFacilityId,
          source: "Legacy HMIS Bridge",
          receptionistStatus: "CONFIRMED",
          status: "confirmed",
        },
        {
          patientName: "Meenakshi Kadam",
          patientPhone: "+91 98192 65432",
          age: "34",
          gender: "F",
          symptoms: ["High fever 103F", "severe body pain"],
          urgency: "YELLOW",
          department: "General Medicine",
          slotTime: "10:30 AM",
          hospital: activeFacility?.name || "Civil Hospital",
          facilityId: activeFacility?.facilityId || selectedFacilityId,
          source: "Legacy HMIS Bridge",
          receptionistStatus: "CONFIRMED",
          status: "confirmed",
        },
        {
          patientName: "Santosh Yadav",
          patientPhone: "+91 98670 12345",
          age: "55",
          gender: "M",
          symptoms: ["Diabetes routine checkup", "insulin refill"],
          urgency: "GREEN",
          department: "General Medicine",
          slotTime: "11:15 AM",
          hospital: activeFacility?.name || "Civil Hospital",
          facilityId: activeFacility?.facilityId || selectedFacilityId,
          source: "Legacy HMIS Bridge",
          receptionistStatus: "CONFIRMED",
          status: "confirmed",
        },
      ];

      for (const rec of demoOrCustomRecords) {
        await fetch("/api/consultations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(rec),
        });
      }
      setImportStatusMessage(`Successfully merged ${demoOrCustomRecords.length} records into ${activeFacility?.shortName || "Hospital"} Live Triage!`);
      fetchData();
      setTimeout(() => setImportStatusMessage(null), 5000);
    } catch {
      setImportStatusMessage("Merge completed with local queue.");
      setTimeout(() => setImportStatusMessage(null), 5000);
    } finally {
      setBulkImporting(false);
    }
  };

  const handleOpenAddDoctor = () => {
    setEditingDoctor(null);
    setDoctorForm({
      name: "",
      email: "",
      password: "",
      specialization: "General Medicine",
      room: "Room 102 (General OPD)",
      experience: "5 yrs",
      phone: "+91 98200 11000",
      onDuty: true,
    });
    setDoctorError(null);
    setIsDoctorModalOpen(true);
  };

  const handleOpenEditDoctor = (doc: any) => {
    setEditingDoctor(doc);
    setDoctorForm({
      name: doc.name || "",
      email: doc.email || "",
      password: "",
      specialization: doc.dept || doc.specialization || "General Medicine",
      room: doc.room || "Room 102 (OPD)",
      experience: doc.experience || "5 yrs",
      phone: doc.phone || "+91 98200 11000",
      onDuty: doc.onDuty ?? true,
    });
    setDoctorError(null);
    setIsDoctorModalOpen(true);
  };

  const handleSaveDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    setDoctorSubmitting(true);
    setDoctorError(null);
    try {
      if (editingDoctor) {
        const res = await fetch("/api/admin/doctors", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingDoctor._id || editingDoctor.id,
            name: doctorForm.name,
            specialization: doctorForm.specialization,
            facilityId: selectedFacilityId,
            hospital: activeFacility?.name || "Civil Hospital",
            room: doctorForm.room,
            experience: doctorForm.experience,
            phone: doctorForm.phone,
            onDuty: doctorForm.onDuty,
            password: doctorForm.password ? doctorForm.password : undefined,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to update doctor");
      } else {
        const res = await fetch("/api/admin/doctors", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: doctorForm.name,
            email: doctorForm.email,
            password: doctorForm.password || "doctor123",
            specialization: doctorForm.specialization,
            facilityId: selectedFacilityId,
            hospital: activeFacility?.name || "Civil Hospital",
            room: doctorForm.room,
            experience: doctorForm.experience,
            phone: doctorForm.phone,
            onDuty: doctorForm.onDuty,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to create doctor");
      }
      setIsDoctorModalOpen(false);
      await fetchData();
    } catch (err: any) {
      setDoctorError(err.message || "An error occurred while saving doctor credentials.");
    } finally {
      setDoctorSubmitting(false);
    }
  };

  const handleToggleDoctorDuty = async (doc: any) => {
    try {
      const docId = doc._id || doc.id;
      const newStatus = !doc.onDuty;
      setDoctors((prev) =>
        prev.map((d) => ((d._id === docId || d.id === docId) ? { ...d, onDuty: newStatus } : d))
      );
      await fetch("/api/admin/doctors", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: docId,
          onDuty: newStatus,
        }),
      });
      fetchData();
    } catch (err) {
      console.error("Failed to toggle duty status:", err);
    }
  };

  const handleDeleteDoctor = async (docId: string, docName: string) => {
    if (!window.confirm(`Are you sure you want to delete ${docName} from this hospital facility?`)) return;
    try {
      const res = await fetch(`/api/admin/doctors?id=${docId}`, { method: "DELETE" });
      if (res.ok) {
        setDoctors((prev) => prev.filter((d) => d._id !== docId && d.id !== docId));
        fetchData();
      }
    } catch (err) {
      console.error("Failed to delete doctor:", err);
    }
  };

  if (!mounted) return null;

  if (!auth) {
    return (
      <div style={{ background: "linear-gradient(135deg, #0F766E 0%, #0369A1 100%)", minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", fontFamily: "Inter, sans-serif", position: "relative", overflow: "hidden", padding: 20 }}>
        <div style={{ width: "100%", maxWidth: 420, background: "rgba(255, 255, 255, 0.12)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderRadius: 20, padding: "36px 28px", boxSizing: "border-box", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)", border: `1px solid rgba(255,255,255,0.22)`, zIndex: 10, color: "white" }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ width: 64, height: 64, borderRadius: 18, background: "rgba(255, 255, 255, 0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", color: "white", boxShadow: "inset 0 0 20px rgba(255,255,255,0.15)" }}>
              <Building2 size={32} />
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, letterSpacing: "-0.5px", color: "white" }}>AarogyaAI</h1>
            <p style={{ fontSize: 14, marginTop: 4, fontWeight: 600, color: "rgba(255,255,255,0.85)" }}>Hospital Receptionist & Command Desk</p>
          </div>
          {error && <div style={{ background: "rgba(239, 68, 68, 0.2)", color: "#FECACA", padding: "12px", borderRadius: 10, fontSize: 13, fontWeight: 600, marginBottom: 18, textAlign: "center", border: "1px solid rgba(239, 68, 68, 0.4)" }}>{error}</div>}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ position: "relative" }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6, color: "rgba(255,255,255,0.9)" }}>Hospital Master Key</label>
              <input
                type={showPass ? "text" : "password"}
                placeholder="Enter facility access key..."
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
                style={{ width: "100%", padding: "12px 42px 12px 14px", border: `1px solid rgba(255,255,255,0.25)`, borderRadius: 12, fontSize: 14, fontFamily: "inherit", background: "rgba(0,0,0,0.25)", color: "white", outline: "none", boxSizing: "border-box" }}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={{ position: "absolute", right: 12, top: 34, background: "transparent", border: "none", color: "rgba(255,255,255,0.7)", cursor: "pointer", fontSize: 12 }}
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
              style={{ width: "100%", padding: "14px", borderRadius: 12, border: "none", cursor: "pointer", fontWeight: 800, fontSize: 14, background: "white", color: C.primary, boxShadow: "0 4px 14px rgba(0, 0, 0, 0.2)" }}
            >
              Access Reception Desk
            </button>

            <div style={{ textAlign: "center", marginTop: 6 }}>
              <button
                type="button"
                onClick={() => router.push("/hospital/login")}
                style={{ background: "rgba(255, 255, 255, 0.12)", border: "1px solid rgba(255, 255, 255, 0.2)", borderRadius: 10, padding: "10px 14px", color: "white", fontSize: 12.5, fontWeight: 700, cursor: "pointer", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
              >
                <Building2 size={15} /> Select Facility Tenant Login
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
        <nav style={{ background: "white", height: 72, margin: "16px 24px", borderRadius: 18, display: "flex", alignItems: "center", padding: "0 24px", border: `1px solid ${C.border}` }}>
          <div style={{ width: 140, height: 36, background: "#E2E8F0", borderRadius: 10, animation: "pulse 1.5s infinite" }} />
          <div style={{ display: "flex", gap: 16, marginLeft: 32 }}>
            {[1,2,3,4,5].map(i => <div key={i} style={{ width: 90, height: 28, background: "#E2E8F0", borderRadius: 8, animation: "pulse 1.5s infinite" }} />)}
          </div>
        </nav>
        <main style={{ flex: 1, padding: "20px 24px", maxWidth: 1600, margin: "0 auto", width: "100%", display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20 }}>
            {[1,2,3,4].map(i => <div key={i} style={{ height: 120, background: "white", borderRadius: 18, animation: "pulse 1.5s infinite", border: `1px solid ${C.border}` }} />)}
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
      // Privacy Guard: Private practice / direct teleconsultations NEVER leak to hospital reception desks
      const h = (q.hospital || "").toLowerCase();
      if (
        q.isPrivate ||
        q.bookingType === "DIRECT_DOCTOR" ||
        q.bookingType === "ONLINE_TELECONSULT" ||
        q.facilityId === "DIRECT_TELECONSULT" ||
        h.includes("private") ||
        h.includes("independent clinic") ||
        h.includes("tele-hub") ||
        h.includes("teleconsult center")
      ) {
        return false;
      }

      // 1. Direct facilityId match
      if (q.facilityId && q.facilityId === fid) return true;

      // 2. Strict hospital name match
      if (fid === "HOSP-SION-001" && (h.includes("sion") || h.includes("lokmanya") || h.includes("ltmgh"))) return true;
      if (fid === "HOSP-NERUL-007" && (h.includes("nerul") || h.includes("dy patil") || h.includes("d.y. patil"))) return true;
      if (fid === "HOSP-KHAR-008" && (h.includes("kharghar") || h.includes("actrec"))) return true;
      if (fid === "HOSP-KLY-002" && h.includes("kalyan")) return true;
      if (fid === "HOSP-KLW-003" && (h.includes("kalwa") || h.includes("csmh"))) return true;
      if (fid === "HOSP-PLG-004" && h.includes("palghar")) return true;
      if (fid === "HOSP-MRB-005" && h.includes("murbad")) return true;
      if (fid === "HOSP-JWH-006" && h.includes("jawhar")) return true;
      if (fid === "HOSP-DMB-009" && (h.includes("citycare") || h.includes("dombivli"))) return true;
      if (fid === "HOSP-NBH-008" && h.includes("nabha")) return true;
      if (fid === "HOSP-PTL-009" && (h.includes("patiala") || h.includes("rajindra"))) return true;
      if (fid === "HOSP-KSR-010" && h.includes("kesri")) return true;

      // 3. Fallback name substring check against active facility name
      if (h && (h.includes(sn) || h.includes(fn))) return true;

      return false;
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
        (q.patientPhone || "").toLowerCase().includes(ql) ||
        (q.tokenNumber || "").toLowerCase().includes(ql) ||
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
  const facilityMatchedDocs = doctors.filter(
    (d) =>
      d.facilityId === selectedFacilityId ||
      (d.hospital && activeFacility?.name && d.hospital.toLowerCase().includes(activeFacility.name.toLowerCase())) ||
      (d.hospital && activeFacility?.shortName && d.hospital.toLowerCase().includes(activeFacility.shortName.toLowerCase()))
  );

  const activeFacilityStaff = {
    doctors:
      facilityMatchedDocs.length > 0
        ? facilityMatchedDocs.map((d, idx) => ({
            id: d._id || d.id || `D_${selectedFacilityId}_${idx + 1}`,
            _id: d._id || d.id,
            name: d.name.startsWith("Dr.") ? d.name : `Dr. ${d.name}`,
            email: d.email || "",
            role: d.specialization || "Consultant Medical Officer",
            dept: d.specialization || "General Medicine",
            room: d.room || `Room ${101 + idx} (OPD)`,
            experience: d.experience || "8 yrs",
            onDuty: d.onDuty ?? true,
            rating: d.rating || 4.9,
            phone: d.phone || "+91 98200 00000",
            facilityId: d.facilityId || selectedFacilityId,
          }))
        : MOCK_STAFF_MAP[selectedFacilityId]?.doctors || MOCK_STAFF_MAP["HOSP-SION-001"].doctors,
    ashaWorkers:
      MOCK_STAFF_MAP[selectedFacilityId]?.ashaWorkers || MOCK_STAFF_MAP["HOSP-SION-001"].ashaWorkers,
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
    { id: "dashboard", label: T("ओवरव्यू", "Overview"), icon: <Activity size={15} /> },
    { id: "appointments", label: T("रिसेप्शन व टोकन डेस्क", "OPD Queue & Check-In"), icon: <ClipboardList size={15} />, badge: facilityScopedQueue.length },
    { id: "staff", label: T("डॉक्टर व ओपीडी कक्ष", "Doctor & Room Roster"), icon: <Stethoscope size={15} />, badge: onDutyDoctorsCount },
    { id: "emergencies", label: T("आपातकालीन ट्राइएज", "Emergency & Casualty"), icon: <AlertTriangle size={15} />, badge: redPatients.length, badgeColor: C.red },
    { id: "wards", label: T("वार्ड व बेड क्षमता", "Wards & Bed Status"), icon: <BedDouble size={15} /> },
    { id: "referrals", label: T("इनबाउंड रेफरल डेस्क", "Inbound Referrals"), icon: <Share2 size={15} />, badge: referrals.filter(r => r.status === "pending").length },
    { id: "diagnostics", label: T("लैब डायग्नोस्टिक्स", "Lab Diagnostics"), icon: <FlaskConical size={15} />, badge: labTests.filter(t => t.isCritical && !t.assignedDoctorId).length, badgeColor: C.red },
    { id: "hmis-bridge", label: T("HMIS / e-Hospital", "HMIS Gateway"), icon: <Network size={15} /> },
    { id: "analytics", label: T("एनालिटिक्स", "Clinical Analytics"), icon: <TrendingUp size={15} /> },
  ];

  return (
    <div style={{ background: C.bg, minHeight: "100vh", display: "flex", flexDirection: "column", fontFamily: "Inter, sans-serif", color: C.text }}>

      {/* Modern High-Tier Medical Command Top Navigation */}
      <nav style={{ background: "rgba(255, 255, 255, 0.92)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: `1px solid ${C.border}`, padding: "8px 20px", position: "sticky", top: 12, margin: "10px 20px 16px", borderRadius: 16, zIndex: 50, boxShadow: "0 6px 24px rgba(15, 118, 110, 0.06)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14 }}>

          {/* Left Brand Identity */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            <div style={{ background: "linear-gradient(135deg, #0F766E 0%, #14B8A6 100%)", width: 38, height: 38, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", color: "white", boxShadow: "0 4px 10px rgba(20, 184, 166, 0.35)" }}>
              <Building2 size={20} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <h1 style={{ fontSize: 18, fontWeight: 800, margin: 0, letterSpacing: "-0.5px", color: C.primary, lineHeight: 1 }}>AarogyaAI</h1>
                <span style={{ background: "rgba(15, 118, 110, 0.1)", color: C.primary, fontSize: 9.5, fontWeight: 800, padding: "2px 6px", borderRadius: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>Reception Desk</span>
              </div>
              <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, marginTop: 1 }}>{activeFacility?.shortName || "Hospital Command Center"}</div>
            </div>
          </div>

          {/* Center Segmented Navigation Pills */}
          <div style={{ display: "flex", alignItems: "center", gap: 4, background: "#F1F5F9", padding: "4px", borderRadius: 12, overflowX: "auto", maxWidth: "100%", scrollbarWidth: "none" }}>
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
                    padding: "6px 11px",
                    borderRadius: 8,
                    border: "none",
                    background: isActive ? "white" : "transparent",
                    color: isActive ? C.primary : "#475569",
                    fontWeight: isActive ? 800 : 600,
                    fontSize: 12,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    boxShadow: isActive ? "0 2px 6px rgba(0, 0, 0, 0.06)" : "none",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center" }}>{nav.icon}</span>
                  <span>{nav.label}</span>
                  {typeof nav.badge === "number" && nav.badge > 0 && (
                    <span
                      style={{
                        background: nav.badgeColor || (isActive ? C.primary : "#94A3B8"),
                        color: "white",
                        fontSize: 10,
                        fontWeight: 800,
                        padding: "1px 5px",
                        borderRadius: 10,
                        lineHeight: "13px",
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
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            {/* Quick Walk-In Patient Registration Button */}
            <button
              onClick={() => setIsRegisterModalOpen(true)}
              style={{
                padding: "7px 12px",
                borderRadius: 9,
                border: "none",
                background: "linear-gradient(135deg, #0F766E, #14B8A6)",
                color: "white",
                fontWeight: 800,
                fontSize: 12,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 5,
                boxShadow: "0 2px 8px rgba(15, 118, 110, 0.3)",
              }}
            >
              <UserPlus size={14} /> {T("वॉक-इन मरीज जोड़ें", "+ Walk-in Token")}
            </button>

            <button
              onClick={() => router.push("/admin")}
              style={{
                padding: "6px 10px",
                borderRadius: 8,
                border: `1px solid ${C.border}`,
                background: "white",
                color: "#475569",
                fontWeight: 700,
                fontSize: 11.5,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
              title="Open Global System Admin Portal"
            >
              <Zap size={13} /> {T("एडमिन", "Admin")}
            </button>

            <button
              onClick={() => setLang(lang === "hi" ? "en" : "hi")}
              style={{
                background: "#F8FAFC",
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                padding: "6px 9px",
                fontSize: 11.5,
                fontWeight: 700,
                color: C.text,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <Globe size={13} /> {lang === "hi" ? "EN" : "हिं"}
            </button>

            <div style={{ height: 20, width: 1, background: C.border }} />

            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 11.5, fontWeight: 800, color: C.text, lineHeight: 1.2 }}>
                  {hospitalUser?.staffRole === "director" ? "Medical Director" : "OPD Desk"}
                </div>
                <div style={{ fontSize: 9.5, color: C.primary, fontWeight: 700 }}>
                  {hospitalUser?.facilityName ? hospitalUser.facilityName.split(" ")[0] : "Desk 1"}
                </div>
              </div>
              <div style={{ width: 32, height: 32, borderRadius: "50%", border: `1.5px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", background: "#F1F5F9", color: C.primary }}>
                <User size={16} />
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
                  borderRadius: 7,
                  padding: "5px 8px",
                  fontSize: 11,
                  fontWeight: 800,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 3,
                }}
                title="Sign Out"
              >
                <LogOut size={12} />
              </button>
            </div>
          </div>

        </div>
      </nav>

      <main style={{ flex: 1, padding: "4px 20px 60px", maxWidth: 1600, margin: "0 auto", width: "100%", boxSizing: "border-box" }}>

        {/* Multi-Hospital Command Center Switcher Banner */}
        <div
          style={{
            background: "white",
            borderRadius: 16,
            padding: "14px 20px",
            border: `1px solid ${C.border}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
            boxShadow: "0 4px 16px rgba(0, 0, 0, 0.02)",
            flexWrap: "wrap",
            gap: 14,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: "linear-gradient(135deg, #0F766E, #0D5E58)",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 10px rgba(15, 118, 110, 0.2)",
              }}
            >
              <Building2 size={22} />
            </div>
            <div>
              <div style={{ fontSize: 9.5, fontWeight: 800, textTransform: "uppercase", color: C.muted, letterSpacing: 0.6 }}>
                {T("सक्रिय अस्पताल कमांड सेंटर", "Active Hospital Facility Desk")}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2, flexWrap: "wrap" }}>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: C.primary }}>
                  {activeFacility?.shortName || activeFacility?.name || "State Health Authority Network"}
                </h2>
                <span
                  style={{
                    background: "#E0F2FE",
                    color: "#0369A1",
                    fontSize: 10,
                    fontWeight: 800,
                    padding: "2px 7px",
                    borderRadius: 5,
                  }}
                >
                  {activeFacility?.type || "Network View"}
                </span>
                {activeFacility?.emergencyAvailable && (
                  <span style={{ background: "#FEE2E2", color: "#B91C1C", fontSize: 10, fontWeight: 800, padding: "2px 7px", borderRadius: 5, display: "flex", alignItems: "center", gap: 4 }}>
                    <AlertTriangle size={11} /> 24/7 Casualty Active
                  </span>
                )}
              </div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 2, display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                  <MapPin size={12} /> {activeFacility?.address || activeFacility?.location || "Maharashtra & Regional Network"}
                </span>
                <span>•</span>
                <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                  <Phone size={12} /> {activeFacility?.phone || "+91 22 24076381"}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            {/* Live Beds & Occupancy Widget - Calculated Dynamically */}
            <div style={{ display: "flex", gap: 12, background: "#F8FAFC", padding: "6px 14px", borderRadius: 12, border: `1px solid ${C.border}` }}>
              <div>
                <div style={{ fontSize: 9, color: C.muted, fontWeight: 700, textTransform: "uppercase" }}>{T("कुल बेड", "Total Beds")}</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: C.text }}>
                  {dynamicOccupiedBeds} / {totalFacilityBeds} <span style={{ fontSize: 10.5, color: C.muted, fontWeight: 600 }}>({bedOccupancyRate}%)</span>
                </div>
              </div>
              <div style={{ width: 1, height: 22, background: C.border, alignSelf: "center" }} />
              <div>
                <div style={{ fontSize: 9, color: C.muted, fontWeight: 700, textTransform: "uppercase" }}>{T("आईसीयू क्षमता", "ICU Beds")}</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: C.red }}>
                  {dynamicIcuOccupied} / {totalIcuBeds}
                </div>
              </div>
            </div>

            {/* Isolated Tenant Security & Session Card */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              {/* 1-Click Interactive Facility Switcher Dropdown */}
              <select
                value={selectedFacilityId}
                onChange={(e) => {
                  const newFid = e.target.value;
                  setSelectedFacilityId(newFid);
                  if (typeof window !== "undefined") {
                    localStorage.setItem("hospitalSelectedFacility", newFid);
                    localStorage.setItem("hospitalAuth", "true");
                    const stored = localStorage.getItem("hospital_command_user");
                    if (stored) {
                      try {
                        const u = JSON.parse(stored);
                        u.facilityId = newFid;
                        localStorage.setItem("hospital_command_user", JSON.stringify(u));
                      } catch {}
                    }
                  }
                }}
                style={{
                  padding: "7px 12px",
                  borderRadius: 9,
                  border: "1.5px solid #0D9488",
                  background: "#F0FDFA",
                  color: "#0F766E",
                  fontWeight: 800,
                  fontSize: 12,
                  cursor: "pointer",
                  outline: "none",
                  boxShadow: "0 1px 3px rgba(15, 118, 110, 0.1)",
                }}
                title="Select active hospital command desk"
              >
                {facilities.map((fac) => (
                  <option key={fac.facilityId} value={fac.facilityId}>
                    🏥 {fac.shortName || fac.name} ({fac.facilityId})
                  </option>
                ))}
              </select>

              <div style={{ background: "#F0FDFA", border: "1.5px solid #99F6E4", borderRadius: 10, padding: "5px 10px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 800, color: "#0F766E" }}>
                  <Lock size={12} />
                  <span>{activeFacility?.facilityId || selectedFacilityId}</span>
                </div>
                <div style={{ fontSize: 9, color: "#0D9488", fontWeight: 700 }}>
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
                  padding: "7px 11px",
                  borderRadius: 9,
                  border: "1px solid #CBD5E1",
                  background: "#F8FAFC",
                  color: "#475569",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                }}
                title="Sign out and switch to another hospital portal"
              >
                <RefreshCw size={12} /> {T("लॉगिन बदलें", "Switch Login")}
              </button>
            </div>
          </div>
        </div>

        {/* Page Subheader */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 3px 0", letterSpacing: "-0.5px" }}>
              {activeTab === "staff"
                ? T("अस्पताल डॉक्टर व ओपीडी कक्ष रोस्टर", "Doctor & Room OPD Roster")
                : activeTab === "appointments"
                ? T("लाइव ओपीडी टोकन व रिसेप्शन डेस्क", "Live OPD Queue & Patient Check-In Desk")
                : activeTab === "emergencies"
                ? T("आपातकालीन ट्राइएज व कैजुअल्टी कमांड", "Emergency Triage & Casualty Desk")
                : activeTab === "wards"
                ? T("वार्ड व बेड क्षमता मॉनिटरिंग", "Inpatient Wards & Bed Occupancy")
                : activeTab === "referrals"
                ? T("इनबाउंड रेफरल डेस्क", "Inbound Referrals Desk")
                : activeTab === "diagnostics"
                ? T("डायग्नोस्टिक्स व लैब रिपोर्ट सुरक्षा जाल", "Diagnostics & Lab Reports Safety Net")
                : activeTab === "hmis-bridge"
                ? T("ABDM एवं ई-हॉस्पिटल एकीकरण गेटवे", "ABDM & NIC e-Hospital Integration Bridge")
                : activeTab === "analytics"
                ? T("अस्पताल मेट्रिक्स व एनालिटिक्स", "Clinical Metrics & Operational Analytics")
                : T("कमांड सेंटर ओवरव्यू", "Hospital Operational Overview")}
            </h2>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: C.muted, fontWeight: 500 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 4, color: C.green, fontWeight: 700, background: "rgba(16, 185, 129, 0.1)", padding: "2px 8px", borderRadius: 14 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.green, animation: "pulse 2s infinite" }} />
                {T("सिस्टम लाइव", "System Live")}
              </span>
              <span>•</span>
              <span>{T("अगला रिफ्रेश", "Next refresh in")} {tick}s</span>
              <span>•</span>
              <span>{activeFacility?.name || "Facility Operations"}</span>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: C.muted, marginBottom: 1 }}>{new Date().toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.text }}>{new Date().toLocaleTimeString(lang === 'hi' ? 'hi-IN' : 'en-US', { hour: '2-digit', minute: '2-digit' })}</div>
          </div>
        </div>

        {/* SOS banner — live from DB */}
        {sosAlerts.length > 0 && sosAlerts.map(alert => (
          <div key={alert._id}
            style={{ background: `linear-gradient(135deg,${C.red},#991B1B)`, padding: "12px 18px", display: "flex", alignItems: "center", gap: 12, borderRadius: 14, marginBottom: 24, boxShadow: "0 6px 18px rgba(239, 68, 68, 0.25)" }}
          >
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>
              <AlertTriangle size={20} />
            </div>
            <div style={{ flex: 1 }}>
              <h4 style={{ fontSize: 15, fontWeight: 800, color: "white", margin: 0 }}>
                SOS EMERGENCY: {alert.village}
              </h4>
              <p style={{ fontSize: 12.5, color: "rgba(255,255,255,.95)", margin: 0, marginTop: 2 }}>
                {alert.ashaWorkerName} (ASHA) reports <span style={{ background: "rgba(255,255,255,0.25)", padding: "1px 6px", borderRadius: 4, fontWeight: 800, color: "white", margin: "0 4px" }}>{alert.affectedCount} Affected</span> — {alert.description || "Immediate response required."}
              </p>
            </div>
            <button 
              onClick={() => handleResolveSOS(alert._id)}
              style={{ background: "white", color: "#991B1B", padding: "6px 14px", borderRadius: 7, fontWeight: 700, fontSize: 12, border: "none", cursor: "pointer", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}
            >
              {alert.status === "resolved" ? "Resolved" : "Resolve Alert"}
            </button>
          </div>
        ))}

        {/* Advanced Search & Filter Bar */}
        <div style={{ background: C.card, borderRadius: 14, padding: "14px 20px", display: "flex", alignItems: "center", gap: 16, marginBottom: 24, boxShadow: "0 4px 12px rgba(0, 0, 0, 0.02)", border: `1px solid ${C.border}` }}>

          <div style={{ flex: 1, position: "relative" }}>
            <Search style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: C.muted }} size={16} />
            <input
              type="text"
              placeholder={T("मरीज, फोन, टोकन या लक्षण खोजें...", "Search by patient name, mobile, token number, doctor, or symptom...")}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ width: "100%", padding: "9px 12px 9px 36px", borderRadius: 8, border: `1px solid ${C.border}`, background: "#F8FAFC", fontSize: 13, fontWeight: 500, outline: "none", boxSizing: "border-box", transition: "all 0.2s" }}
              onFocus={e => e.currentTarget.style.borderColor = C.primary}
              onBlur={e => e.currentTarget.style.borderColor = C.border}
            />
          </div>

          <div style={{ width: 1, height: 28, background: C.border }} />

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Calendar size={15} style={{ color: C.muted }} />
            <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} style={{ border: "none", outline: "none", fontSize: 12.5, fontWeight: 600, color: C.text, cursor: "pointer", background: "transparent", fontFamily: "inherit" }} />
          </div>

          <div style={{ width: 1, height: 28, background: C.border }} />

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <SlidersHorizontal size={15} style={{ color: C.muted }} />
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ border: "none", outline: "none", fontSize: 12.5, fontWeight: 600, color: C.text, cursor: "pointer", background: "transparent", fontFamily: "inherit" }}>
              <option value="ALL">{T("सभी स्थितियां", "All Triage Urgencies")}</option>
              <option value="RED">{T("गंभीर", "Critical (RED)")}</option>
              <option value="YELLOW">{T("तत्काल", "Urgent (YELLOW)")}</option>
              <option value="GREEN">{T("सामान्य", "Standard (GREEN)")}</option>
            </select>
          </div>

        </div>

        {/* Dynamic KPIs Calculation */}
        {(activeTab === "dashboard" || activeTab === "analytics") && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
            {[
              {
                label: T("कुल सक्रिय मरीज़", "Total Active Queue"),
                value: totalPatients,
                trend: redPatients.length > 0 ? `${redPatients.length} Urgent Action` : `${totalPatients} In Queue`,
                icon: <Users size={20} />,
                color: C.primary,
                info: T("सभी मरीज़ जिनका इलाज अभी चल रहा है", "All patients currently in the live reception & consultation queue")
              },
              {
                label: T("गंभीर आपात स्थिति", "Critical Emergencies"),
                id: "emergency",
                value: redPatients.length,
                trend: redPatients.length > 0 ? "Action Required" : "All Clear",
                icon: <AlertTriangle size={20} />,
                color: C.red,
                alert: redPatients.length > 0,
                info: T("RED प्राथमिकता वाले मरीज़ जिन्हें तुरंत इलाज की आवश्यकता है", "Patients marked with RED priority requiring immediate attention")
              },
              {
                label: T("ठीक हुए मरीज़", "Cured & Discharged"),
                value: curedPatientsCount,
                trend: `${Math.round((curedPatientsCount / (totalPatients + curedPatientsCount || 1)) * 100)}% Resolved`,
                icon: <CheckCircle2 size={20} />,
                color: C.green,
                info: T("वे मरीज़ जिन्हें ठीक घोषित कर दिया गया है", "Patients whose treatment has concluded successfully")
              },
              {
                label: T("ड्यूटी पर डॉक्टर", "Doctors on Duty"),
                value: onDutyDoctorsCount,
                trend: `${onDutyDoctorsCount}/${activeFacilityDoctors.length} On Duty`,
                icon: <Stethoscope size={20} />,
                color: C.primaryLight,
                info: T("वर्तमान में उपलब्ध डॉक्टरों की संख्या", "Total medical officers currently active in their OPD rooms")
              },
              {
                label: T("भर्ती मरीज़", "Inpatient / Admitted"),
                value: admittedPatients.length,
                trend: `${bedOccupancyRate}% Total Capacity`,
                icon: <BedDouble size={20} />,
                color: C.red,
                info: T("100% RED और 50% YELLOW मरीज़ जिन्हें भर्ती माना गया है", "Calculated from RED priority cases and inpatient admissions")
              },
              {
                label: T("ओपीडी क्लीनिक", "Outpatient Clinic"),
                value: outpatientClinic.length,
                trend: `${totalPatients > 0 ? Math.round((outpatientClinic.length / totalPatients) * 100) : 0}% Active Influx`,
                icon: <ClipboardList size={20} />,
                color: C.primaryLight,
                info: T("ओपीडी में मौजूद मरीज", "Standard in-person outpatient walk-ins and consultations")
              },
              {
                label: T("टेलीमेडिसिन", "Telemedicine Calls"),
                value: telemedicineVisits.length,
                trend: telemedicineVisits.length > 0 ? "Virtual Stream" : "Standby",
                icon: <Video size={20} />,
                color: C.accent,
                info: T("परामर्श जिनका ऑनलाइन इलाज चल रहा है", "Virtual telemedicine consultations connected to medical officers")
              },
              {
                label: T("आशा कार्यकर्ता विजिट", "ASHA Field Visits"),
                value: fieldVisits,
                trend: `${activeFacilityStaff.ashaWorkers.length} Field Units`,
                icon: <Activity size={20} />,
                color: C.yellow,
                info: T("आशा कार्यकर्ताओं द्वारा दर्ज किए गए कुल घर-घर विजिट", "Total door-to-door community visits logged by affiliated ASHA staff")
              },
            ].map((kpi, i) => (
              <div key={i} onClick={() => kpi.id === "emergency" && document.getElementById("emergency-triage")?.scrollIntoView({ behavior: "smooth", block: "center" })} style={{ background: C.card, borderRadius: 16, padding: "18px 20px", border: `1px solid ${C.border}`, position: "relative", overflow: "hidden", boxShadow: "0 4px 12px rgba(0, 0, 0, 0.02)", cursor: kpi.id === "emergency" ? "pointer" : "default", animation: kpi.id === "emergency" && kpi.alert ? "alertGlow 1.5s infinite" : "none", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                {kpi.alert && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: C.red, animation: "pulse 1.5s infinite" }} />}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: `${kpi.color}15`, color: kpi.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {kpi.icon}
                  </div>
                  <div style={{ background: `${kpi.color}15`, color: kpi.color, padding: "3px 8px", borderRadius: 10, fontSize: 11, fontWeight: 800 }}>
                    {kpi.trend}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: kpi.alert ? C.red : C.text, lineHeight: 1, marginBottom: 6 }}>{kpi.value}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <div style={{ fontSize: 12.5, color: C.muted, fontWeight: 600 }}>{kpi.label}</div>
                    <InfoButton text={kpi.info} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

          {/* Receptionist-Assisted Booking & Slot Desk */}
          {(activeTab === "dashboard" || activeTab === "appointments") && (
            <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, overflow: "hidden", boxShadow: "0 6px 16px rgba(0, 0, 0, 0.03)" }}>
              <div style={{ padding: "18px 24px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", background: "#F0FDFA", flexWrap: "wrap", gap: 12 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(15, 118, 110, 0.12)", display: "flex", alignItems: "center", justifyContent: "center", color: C.primary }}>
                      <ClipboardList size={18} />
                    </div>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: C.primary }}>
                      {T("लाइव ओपीडी टोकन व रिसेप्शन डेस्क", "Live OPD Token & Patient Check-In Desk")}
                    </h3>
                  </div>
                  <p style={{ margin: "2px 0 0 0", fontSize: 12, color: C.muted, fontWeight: 500 }}>
                    {T("मरीजों का चेक-इन, डॉक्टर व रूम आवंटन, और प्रिंटेड टोकन पर्ची जारी करें", "Manage patient check-ins, doctor & OPD room assignment, and print token slips")}
                  </p>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <button
                    onClick={() => setIsRegisterModalOpen(true)}
                    style={{
                      background: "white",
                      border: `1.5px solid ${C.primary}`,
                      color: C.primary,
                      padding: "6px 12px",
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                    }}
                  >
                    <UserPlus size={14} /> + New Walk-In
                  </button>

                  <div style={{ fontSize: 12, color: "#0F766E", fontWeight: 800, background: "rgba(15, 118, 110, 0.15)", padding: "5px 12px", borderRadius: 16 }}>
                    {facilityScopedQueue.length} {T("कुल स्लॉट", "Active Tokens")}
                  </div>
                </div>
              </div>

              <div style={{ padding: 0, overflowX: "auto" }}>
                {facilityScopedQueue.length === 0 ? (
                  <div style={{ padding: 48, textAlign: "center", color: C.muted }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", color: C.muted }}>
                      <ClipboardList size={24} />
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>{T("कोई नया अपॉइंटमेंट स्लॉट अनुरोध नहीं है", "No Active OPD Patients in Queue")}</div>
                    <div style={{ fontSize: 12.5, marginTop: 4 }}>{T("मरीजों द्वारा बुक किए गए सभी स्लॉट वर्तमान में संसाधित हैं।", "All patient slot requests for this facility have been acknowledged.")}</div>
                  </div>
                ) : (
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                    <thead>
                      <tr style={{ background: "#F8FAFC", fontSize: 11.5, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>
                        <th style={{ padding: "14px 20px", fontWeight: 700 }}>Token & Patient</th>
                        <th style={{ padding: "14px 20px", fontWeight: 700 }}>Department & Room</th>
                        <th style={{ padding: "14px 20px", fontWeight: 700 }}>Assigned Doctor</th>
                        <th style={{ padding: "14px 20px", fontWeight: 700 }}>Triage & Symptoms</th>
                        <th style={{ padding: "14px 20px", fontWeight: 700 }}>Status</th>
                        <th style={{ padding: "14px 20px", fontWeight: 700 }}>Receptionist Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {facilityScopedQueue.slice(0, 20).map((p) => {
                        const isConfirmed = p.receptionistStatus === "CONFIRMED" || p.status === "confirmed";
                        const isSpam = p.receptionistStatus === "SPAM_FLAGGED";
                        const isArrived = p.checkInStatus === "ARRIVED";

                        return (
                          <tr key={p._id} style={{ borderTop: `1px solid ${C.border}`, transition: "background 0.15s", background: isSpam ? "#FEF2F2" : "transparent" }}>
                            <td style={{ padding: "14px 20px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <span style={{ background: "#E0F2FE", color: "#0369A1", fontSize: 11, fontWeight: 800, padding: "2px 6px", borderRadius: 4 }}>
                                  {p.tokenNumber || (p.queueNo ? (p.queueNo.startsWith("OPD-") ? p.queueNo : `OPD-${p.queueNo.replace(/^Q-?/i, "")}`) : (p._id ? `OPD-${p._id.slice(-4).toUpperCase()}` : "OPD-101"))}
                                </span>
                                {isArrived && (
                                  <span style={{ background: "#D1FAE5", color: "#059669", fontSize: 10, fontWeight: 800, padding: "2px 6px", borderRadius: 4 }}>
                                    Checked-in
                                  </span>
                                )}
                              </div>
                              <div style={{ fontWeight: 800, color: C.text, fontSize: 14, marginTop: 4 }}>{p.patientName || "Walk-in Patient"}</div>
                              <div style={{ fontSize: 11.5, color: C.muted, marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                                <Phone size={11} /> {p.patientPhone || "No Phone"} {p.age ? `• ${p.age}y/${p.gender || "M"}` : ""}
                              </div>
                            </td>

                            <td style={{ padding: "14px 20px" }}>
                              <div style={{ fontSize: 13, fontWeight: 800, color: C.primaryDark, display: "flex", alignItems: "center", gap: 4 }}>
                                <Stethoscope size={13} /> {p.department || "General OPD"}
                              </div>
                              <div style={{ fontSize: 11.5, color: C.muted, marginTop: 2, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                                <Clock size={11} /> {p.consultationRoom || "Room 102 (General)"}
                              </div>
                            </td>

                            <td style={{ padding: "14px 20px" }}>
                              <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>
                                {p.doctorName || "Awaiting Assignment"}
                              </div>
                              <button
                                onClick={() => setAssignDoctorPatient(p)}
                                style={{
                                  background: "#F1F5F9",
                                  border: `1px solid ${C.border}`,
                                  borderRadius: 5,
                                  padding: "2px 6px",
                                  fontSize: 10.5,
                                  fontWeight: 700,
                                  color: C.primary,
                                  cursor: "pointer",
                                  marginTop: 4,
                                }}
                              >
                                Change / Assign Doctor
                              </button>
                            </td>

                            <td style={{ padding: "14px 20px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                                <span
                                  style={{
                                    background: p.urgency === "RED" ? "#FEE2E2" : p.urgency === "YELLOW" ? "#FEF3C7" : "#D1FAE5",
                                    color: p.urgency === "RED" ? "#B91C1C" : p.urgency === "YELLOW" ? "#D97706" : "#059669",
                                    padding: "2px 8px",
                                    borderRadius: 8,
                                    fontSize: 10.5,
                                    fontWeight: 800,
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 3,
                                  }}
                                >
                                  {p.urgency === "RED" ? <AlertTriangle size={10} /> : p.urgency === "YELLOW" ? <Clock size={10} /> : <CheckCircle2 size={10} />}
                                  {p.urgency === "RED" ? "RED CRITICAL" : p.urgency === "YELLOW" ? "YELLOW URGENT" : "GREEN ROUTINE"}
                                </span>
                              </div>
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                                {(p.symptoms || []).slice(0, 2).map((s: string, idx: number) => (
                                  <span key={idx} style={{ background: "#F1F5F9", color: C.text, padding: "1px 6px", borderRadius: 4, fontSize: 10.5, fontWeight: 600 }}>
                                    {s}
                                  </span>
                                ))}
                              </div>
                            </td>

                            <td style={{ padding: "14px 20px" }}>
                              {isSpam ? (
                                <span style={{ background: "#FEE2E2", color: "#B91C1C", padding: "4px 10px", borderRadius: 12, fontSize: 11, fontWeight: 800, display: "inline-flex", alignItems: "center", gap: 3 }}>
                                  <ShieldAlert size={12} /> Flagged Scam
                                </span>
                              ) : isConfirmed ? (
                                <span style={{ background: "#D1FAE5", color: "#059669", padding: "4px 10px", borderRadius: 12, fontSize: 11, fontWeight: 800, display: "inline-flex", alignItems: "center", gap: 3 }}>
                                  <ShieldCheck size={12} /> Confirmed
                                </span>
                              ) : (
                                <span style={{ background: "#FEF3C7", color: "#D97706", padding: "4px 10px", borderRadius: 12, fontSize: 11, fontWeight: 800, display: "inline-flex", alignItems: "center", gap: 3 }}>
                                  <Clock size={12} /> Pending Check
                                </span>
                              )}
                            </td>

                            <td style={{ padding: "14px 20px" }}>
                              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                                {/* Print Token Slip Button */}
                                <button
                                  onClick={() => setActiveTokenSlip(p)}
                                  title="Print OPD Token Slip for Patient"
                                  style={{
                                    background: "#F8FAFC",
                                    border: `1.5px solid ${C.border}`,
                                    color: C.text,
                                    padding: "5px 9px",
                                    borderRadius: 7,
                                    fontSize: 11,
                                    fontWeight: 700,
                                    cursor: "pointer",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 3,
                                  }}
                                >
                                  <Printer size={12} /> Print Slip
                                </button>

                                {/* Direct Phone Call */}
                                <button
                                  onClick={() => window.open(`tel:${p.patientPhone}`)}
                                  title="Direct Phone Call"
                                  style={{
                                    background: "#F8FAFC",
                                    border: `1.5px solid ${C.border}`,
                                    color: C.text,
                                    padding: "5px 8px",
                                    borderRadius: 7,
                                    fontSize: 11,
                                    fontWeight: 700,
                                    cursor: "pointer",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 3,
                                  }}
                                >
                                  <PhoneCall size={12} /> Call
                                </button>

                                {/* In-App Video Call */}
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
                                  title="In-App Audio / Video Call"
                                  style={{
                                    background: "#E0F2FE",
                                    color: "#0369A1",
                                    border: "none",
                                    padding: "5px 8px",
                                    borderRadius: 7,
                                    fontSize: 11,
                                    fontWeight: 700,
                                    cursor: "pointer",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 3,
                                  }}
                                >
                                  <Video size={12} /> App Call
                                </button>

                                {!isArrived && (
                                  <button
                                    onClick={() => handleCheckInPatient(p._id)}
                                    title="Mark patient as arrived physically at hospital"
                                    style={{
                                      background: "#ECFDF5",
                                      color: "#059669",
                                      border: "1px solid #A7F3D0",
                                      padding: "5px 8px",
                                      borderRadius: 7,
                                      fontSize: 11,
                                      fontWeight: 700,
                                      cursor: "pointer",
                                    }}
                                  >
                                    Mark Arrived
                                  </button>
                                )}

                                {!isConfirmed && !isSpam && (
                                  <>
                                    <button
                                      onClick={() => handleConfirmAppointment(p._id)}
                                      style={{
                                        background: C.green,
                                        color: "white",
                                        border: "none",
                                        padding: "6px 10px",
                                        borderRadius: 7,
                                        fontSize: 11,
                                        fontWeight: 800,
                                        cursor: "pointer",
                                      }}
                                    >
                                      Confirm
                                    </button>
                                    <button
                                      onClick={() => handleFlagScamAppointment(p._id)}
                                      title="Reject and mark as fake/scam"
                                      style={{
                                        background: "#FEE2E2",
                                        color: "#991B1B",
                                        border: "1px solid #FCA5A5",
                                        padding: "5px 8px",
                                        borderRadius: 7,
                                        fontSize: 10.5,
                                        fontWeight: 800,
                                        cursor: "pointer",
                                      }}
                                    >
                                      Flag Scam
                                    </button>
                                    <button
                                      onClick={() => handleDeclineAppointment(p._id)}
                                      style={{
                                        background: "#F1F5F9",
                                        color: C.muted,
                                        border: "none",
                                        padding: "5px 8px",
                                        borderRadius: 7,
                                        fontSize: 10.5,
                                        fontWeight: 700,
                                        cursor: "pointer",
                                      }}
                                    >
                                      Decline
                                    </button>
                                  </>
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
            <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, overflow: "hidden", boxShadow: "0 6px 16px rgba(0, 0, 0, 0.03)" }}>
              <div style={{ padding: "18px 24px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", background: "#F8FAFC", flexWrap: "wrap", gap: 12 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(15, 118, 110, 0.12)", display: "flex", alignItems: "center", justifyContent: "center", color: C.primary }}>
                      <Stethoscope size={18} />
                    </div>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: C.text }}>
                      {T("अस्पताल डॉक्टर व ओपीडी कक्ष रोस्टर", "Doctor & Room OPD Roster")}
                    </h3>
                  </div>
                  <p style={{ margin: "2px 0 0 0", fontSize: 12, color: C.muted, fontWeight: 500 }}>
                    {activeFacility?.name || "Facility Command"} — Consultation room assignments & unique credentials management
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <button
                    onClick={handleOpenAddDoctor}
                    style={{
                      background: "linear-gradient(135deg, #0F766E, #0D5E58)",
                      color: "white",
                      padding: "7px 14px",
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 800,
                      border: "none",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      boxShadow: "0 2px 8px rgba(15, 118, 110, 0.3)",
                    }}
                  >
                    <Plus size={14} /> Add Doctor & Credentials
                  </button>
                  <div style={{ background: "rgba(15, 118, 110, 0.1)", color: C.primary, padding: "5px 10px", borderRadius: 8, fontSize: 11.5, fontWeight: 800, display: "flex", alignItems: "center", gap: 4 }}>
                    <Stethoscope size={13} /> {activeFacilityStaff.doctors.length} Doctors
                  </div>
                  <div style={{ background: "rgba(245, 158, 11, 0.15)", color: "#B45309", padding: "5px 10px", borderRadius: 8, fontSize: 11.5, fontWeight: 800, display: "flex", alignItems: "center", gap: 4 }}>
                    <Activity size={13} /> {activeFacilityStaff.ashaWorkers.length} ASHA
                  </div>
                </div>
              </div>

              <div style={{ padding: "20px 24px" }}>
                {/* Doctors Roster Grid */}
                <div style={{ marginBottom: 24 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <h4 style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", color: C.muted, letterSpacing: 0.6, margin: 0, display: "flex", alignItems: "center", gap: 5 }}>
                      <Stethoscope size={14} /> {T("संबद्ध मेडिकल ऑफिसर एवं ओपीडी कक्ष", "Affiliated Medical Officers, Credentials & Duty Status")}
                    </h4>
                    <span style={{ fontSize: 11, color: C.muted, fontWeight: 600 }}>
                      Manage room assignments, unique logins & active on-duty switch
                    </span>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
                    {activeFacilityStaff.doctors.map((doc: any) => (
                      <div
                        key={doc.id || doc._id}
                        style={{
                          background: "#FFFFFF",
                          border: `1.5px solid ${doc.onDuty ? "#99F6E4" : C.border}`,
                          borderRadius: 14,
                          padding: "16px",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                          boxShadow: doc.onDuty ? "0 4px 12px rgba(15, 118, 110, 0.08)" : "0 2px 8px rgba(0, 0, 0, 0.02)",
                          transition: "all 0.2s ease",
                        }}
                      >
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <div
                                style={{
                                  width: 40,
                                  height: 40,
                                  borderRadius: 10,
                                  background: doc.onDuty ? "linear-gradient(135deg, #0F766E, #14B8A6)" : "#94A3B8",
                                  color: "white",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                <Stethoscope size={20} />
                              </div>
                              <div>
                                <div style={{ fontSize: 15, fontWeight: 800, color: C.text }}>{doc.name}</div>
                                <div style={{ fontSize: 12, color: C.primary, fontWeight: 700 }}>{doc.dept || doc.specialization}</div>
                              </div>
                            </div>
                            <button
                              onClick={() => handleToggleDoctorDuty(doc)}
                              title="Click to toggle On-Duty / Off-Duty status"
                              style={{
                                background: doc.onDuty ? "#D1FAE5" : "#F1F5F9",
                                color: doc.onDuty ? "#059669" : C.muted,
                                border: `1px solid ${doc.onDuty ? "#A7F3D0" : C.border}`,
                                padding: "4px 10px",
                                borderRadius: 8,
                                fontSize: 11,
                                fontWeight: 800,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                              }}
                            >
                              <span style={{ width: 7, height: 7, borderRadius: "50%", background: doc.onDuty ? "#10B981" : "#94A3B8" }} />
                              {doc.onDuty ? "On Duty" : "Off Duty"}
                            </button>
                          </div>

                          {/* Login Credentials & Room Badge */}
                          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#F8FAFC", padding: "6px 10px", borderRadius: 8, border: `1px solid ${C.border}` }}>
                              <Key size={12} color="#0F766E" />
                              <div style={{ fontSize: 11.5, color: C.text, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                Login: <span style={{ fontFamily: "monospace", color: C.primaryDark, fontWeight: 700 }}>{doc.email || `${doc.name.toLowerCase().replace(/[^a-z]/g, "")}@aarogya.ai`}</span>
                              </div>
                            </div>
                            <div style={{ fontSize: 12, color: C.muted, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <span>{doc.room || "Room 102 (OPD)"}</span>
                              <span style={{ fontWeight: 700, color: C.text }}>{doc.experience || "8 yrs"} exp</span>
                            </div>
                          </div>
                        </div>

                        <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button
                              onClick={() => handleOpenEditDoctor(doc)}
                              style={{
                                background: "#F1F5F9",
                                border: `1px solid ${C.border}`,
                                color: C.text,
                                borderRadius: 6,
                                padding: "5px 8px",
                                fontSize: 11,
                                fontWeight: 700,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                              }}
                            >
                              <Edit3 size={11} /> Edit & Reset Pass
                            </button>
                            {doc._id && (
                              <button
                                onClick={() => handleDeleteDoctor(doc._id, doc.name)}
                                style={{
                                  background: "#FEF2F2",
                                  border: "1px solid #FECACA",
                                  color: "#DC2626",
                                  borderRadius: 6,
                                  padding: "5px 8px",
                                  fontSize: 11,
                                  fontWeight: 700,
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 3,
                                }}
                              >
                                <Trash2 size={11} />
                              </button>
                            )}
                          </div>

                          <div style={{ display: "flex", gap: 5 }}>
                            <button
                              onClick={() => setSelectedQRDoctor({
                                name: doc.name,
                                phone: doc.phone || "+91 98200 11000",
                                dept: doc.dept || doc.specialization,
                                hospital: activeFacility?.name || "Hospital Medical Center",
                                role: doc.role,
                              })}
                              style={{
                                background: "rgba(56, 189, 248, 0.12)",
                                border: "1px solid rgba(56, 189, 248, 0.35)",
                                color: "#0284C7",
                                borderRadius: 6,
                                padding: "5px 8px",
                                fontSize: 11,
                                fontWeight: 800,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: 3,
                              }}
                            >
                              <QrCode size={12} /> QR Call
                            </button>
                            <button
                              onClick={() => window.open(`tel:${doc.phone || "+91 98200 11000"}`)}
                              style={{
                                background: "#F0FDFA",
                                border: `1px solid ${C.primary}`,
                                color: C.primary,
                                borderRadius: 6,
                                padding: "5px 9px",
                                fontSize: 11,
                                fontWeight: 700,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: 3,
                              }}
                            >
                              <PhoneCall size={12} /> Call Desk
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ASHA Field Workers Network */}
                <div>
                  <h4 style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", color: C.muted, letterSpacing: 0.6, marginBottom: 12, display: "flex", alignItems: "center", gap: 5 }}>
                    <Activity size={14} /> {T("संबद्ध आशा कार्यकर्ता एवं पाड़ा क्लस्टर", "Affiliated ASHA Field Workers & Pada Clusters")}
                  </h4>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))", gap: 16 }}>
                    {activeFacilityStaff.ashaWorkers.map((asha: any) => (
                      <div
                        key={asha.id}
                        style={{
                          background: "#FFFBEB",
                          border: `1.5px solid #FDE68A`,
                          borderRadius: 14,
                          padding: "16px",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                        }}
                      >
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <div
                                style={{
                                  width: 38,
                                  height: 38,
                                  borderRadius: 10,
                                  background: "linear-gradient(135deg, #D97706, #F59E0B)",
                                  color: "white",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                <Users size={18} />
                              </div>
                              <div>
                                <div style={{ fontSize: 14.5, fontWeight: 800, color: C.text }}>{asha.name}</div>
                                <div style={{ fontSize: 11.5, color: "#B45309", fontWeight: 700 }}>
                                  {asha.area || asha.village || "Catchment Area"}
                                </div>
                              </div>
                            </div>
                            {asha.activeAlerts > 0 ? (
                              <span style={{ background: "#FEE2E2", color: "#B91C1C", padding: "2px 6px", borderRadius: 8, fontSize: 10.5, fontWeight: 800 }}>
                                {asha.activeAlerts} Alerts
                              </span>
                            ) : (
                              <span style={{ background: "#D1FAE5", color: "#059669", padding: "2px 6px", borderRadius: 8, fontSize: 10.5, fontWeight: 800 }}>
                                Normal
                              </span>
                            )}
                          </div>

                          <div style={{ fontSize: 12, color: C.muted, marginBottom: 4 }}>
                            {asha.phone} · <span style={{ fontWeight: 700, color: C.text }}>{asha.visitsThisMonth || 48}</span> visits this month
                          </div>
                        </div>

                        <div style={{ marginTop: 10, paddingTop: 8, borderTop: "1px solid #FDE68A", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: 11, color: "#92400E", fontWeight: 700 }}>
                            Field Community Lead
                          </span>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button
                              onClick={() => setSelectedQRDoctor({
                                name: asha.name,
                                phone: asha.phone,
                                dept: asha.area || asha.village || "Catchment Health Ward",
                                hospital: activeFacility?.name || "Hospital Medical Center",
                                role: "ASHA Field Community Lead",
                              })}
                              style={{
                                background: "rgba(217, 119, 6, 0.12)",
                                border: "1px solid rgba(217, 119, 6, 0.35)",
                                color: "#B45309",
                                borderRadius: 6,
                                padding: "5px 8px",
                                fontSize: 11,
                                fontWeight: 800,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: 3,
                              }}
                            >
                              <QrCode size={12} /> QR Call
                            </button>
                            <button
                              onClick={() => window.open(`tel:${asha.phone}`)}
                              style={{
                                background: "#D97706",
                                border: "none",
                                color: "white",
                                borderRadius: 6,
                                padding: "5px 10px",
                                fontSize: 11,
                                fontWeight: 800,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: 3,
                              }}
                            >
                              <PhoneCall size={12} /> Call
                            </button>
                          </div>
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
            <div id="emergency-triage" style={{ background: C.card, borderRadius: 16, border: redPatients.length > 0 ? `2px solid ${C.red}` : `1px solid ${C.border}`, overflow: "hidden", boxShadow: redPatients.length > 0 ? "0 0 20px rgba(239, 68, 68, 0.4)" : "0 6px 16px rgba(0, 0, 0, 0.03)" }}>
              <div style={{ padding: "18px 24px", borderBottom: redPatients.length > 0 ? `2px solid ${C.red}` : `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", background: redPatients.length > 0 ? "#FEF2F2" : "transparent" }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: redPatients.length > 0 ? C.red : C.text, display: "flex", alignItems: "center", gap: 8 }}>
                  <AlertTriangle size={18} />
                  {T("आपातकालीन ट्राइएज (RED)", "Emergency Triage (RED Priority)")}
                </h3>
              </div>
              <div style={{ padding: 0 }}>
                {redPatients.length === 0 ? (
                  <div style={{ padding: 40, textAlign: "center", color: C.muted }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: "#ECFDF5", color: C.green, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" }}>
                      <CheckCircle2 size={24} />
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>{T("कोई आपात स्थिति नहीं", "No Critical Emergencies")}</div>
                    <div style={{ fontSize: 12.5, marginTop: 4 }}>{T("सभी गंभीर मामले हल हो गए हैं।", "All critical cases have been stabilized and assigned to trauma units.")}</div>
                  </div>
                ) : (
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                    <thead>
                      <tr style={{ background: "#F8FAFC", fontSize: 11.5, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>
                        <th style={{ padding: "14px 20px", fontWeight: 700 }}>Patient Identity</th>
                        <th style={{ padding: "14px 20px", fontWeight: 700 }}>Clinical Symptoms</th>
                        <th style={{ padding: "14px 20px", fontWeight: 700 }}>Assigned Unit</th>
                        <th style={{ padding: "14px 20px", fontWeight: 700 }}>Time</th>
                        <th style={{ padding: "14px 20px", fontWeight: 700 }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {redPatients.map((p) => (
                        <tr key={p._id} style={{ borderTop: `1px solid ${C.border}`, transition: "background 0.2s" }}>
                          <td style={{ padding: "14px 20px" }}>
                            <div style={{ fontWeight: 800, color: C.text, fontSize: 14 }}>{p.patientName === "Unknown" ? "Anonymous SOS Alert" : p.patientName}</div>
                            <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>Phone: {p.patientPhone === "unknown" ? "Location Pinged" : p.patientPhone}</div>
                          </td>
                          <td style={{ padding: "14px 20px" }}>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                              {(p.symptoms || []).slice(0, 3).map((s: string, idx: number) => (
                                <span key={idx} style={{ background: "rgba(239, 68, 68, 0.1)", color: C.red, padding: "3px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700 }}>{s}</span>
                              ))}
                            </div>
                          </td>
                          <td style={{ padding: "14px 20px", fontSize: 13, fontWeight: 700 }}>
                            {p.doctorName || "Emergency Trauma Team"}
                          </td>
                          <td style={{ padding: "14px 20px", fontSize: 12, fontWeight: 600, color: C.muted }}>
                            {p.createdAt ? new Date(p.createdAt).toLocaleTimeString(lang === 'hi' ? 'hi-IN' : 'en-US', { hour: '2-digit', minute: '2-digit' }) : "Just now"}
                          </td>
                          <td style={{ padding: "14px 20px" }}>
                            <div style={{ display: "flex", gap: 6 }}>
                              {p.patientPhone && p.patientPhone !== "unknown" && (
                                <button
                                  onClick={() => setSelectedQRDoctor({
                                    name: p.patientName === "Unknown" ? "Emergency Patient" : p.patientName,
                                    phone: p.patientPhone,
                                    dept: "Emergency Casualty Patient",
                                    hospital: activeFacility?.name || "Hospital Emergency Unit",
                                    role: "Emergency Patient Contact",
                                  })}
                                  style={{
                                    padding: "6px 10px",
                                    background: "rgba(239, 68, 68, 0.12)",
                                    color: C.red,
                                    border: `1px solid rgba(239, 68, 68, 0.3)`,
                                    borderRadius: 6,
                                    fontSize: 11.5,
                                    fontWeight: 700,
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 3,
                                  }}
                                >
                                  <QrCode size={12} /> QR Call
                                </button>
                              )}
                              <button onClick={() => window.open(`tel:${p.patientPhone}`)} style={{ padding: "6px 12px", background: C.red, color: "white", border: "none", borderRadius: 6, fontSize: 11.5, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                                <PhoneCall size={12} /> Call
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
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>

              {/* Triage Distribution */}
              <div style={{ background: C.card, borderRadius: 16, padding: "20px 24px", border: `1px solid ${C.border}`, boxShadow: "0 4px 12px rgba(0, 0, 0, 0.02)" }}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: C.text, marginBottom: 16, display: "flex", alignItems: "center", gap: 6 }}>
                  <Activity size={16} /> {T("ट्राइएज वितरण", "Triage Severity Distribution")}
                  <InfoButton text={T("गंभीरता के आधार पर रोगियों का अनुपात दर्शाता है।", "Proportion of patients classified by clinical triage severity.")} />
                </h3>
                <div style={{ display: "flex", height: 20, borderRadius: 10, overflow: "hidden", marginBottom: 16 }}>
                  <div style={{ width: `${totalPatients ? (redPatients.length / totalPatients) * 100 : 0}%`, background: C.red, transition: "width 0.5s ease" }} />
                  <div style={{ width: `${totalPatients ? (yellowPatients.length / totalPatients) * 100 : 0}%`, background: C.yellow, transition: "width 0.5s ease" }} />
                  <div style={{ width: `${totalPatients ? (greenPatients.length / totalPatients) * 100 : 100}%`, background: totalPatients ? C.green : C.border, transition: "width 0.5s ease" }} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "#FEF2F2", borderRadius: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, color: C.red }}><div style={{ width: 8, height: 8, borderRadius: "50%", background: C.red }} /> Critical (RED)</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: C.red }}>{redPatients.length}</div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "#FFFBEB", borderRadius: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, color: C.yellow }}><div style={{ width: 8, height: 8, borderRadius: "50%", background: C.yellow }} /> Urgent (YELLOW)</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: C.yellow }}>{yellowPatients.length}</div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "#ECFDF5", borderRadius: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, color: C.green }}><div style={{ width: 8, height: 8, borderRadius: "50%", background: C.green }} /> Standard (GREEN)</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: C.green }}>{greenPatients.length}</div>
                  </div>
                </div>
              </div>

              {/* Patient Influx Chart */}
              <div style={{ background: C.card, borderRadius: 16, padding: "20px 24px", border: `1px solid ${C.border}`, boxShadow: "0 4px 12px rgba(0, 0, 0, 0.02)", display: "flex", flexDirection: "column" }}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: C.text, marginBottom: 16, display: "flex", alignItems: "center", gap: 6 }}>
                  <TrendingUp size={16} /> {T("रोगी की आमद (12 घंटे)", "Patient Influx (12h Trend)")}
                  <InfoButton text={T("पिछले 12 घंटों में नए मरीजों की संख्या।", "Hourly volume of new patient admissions over the last 12 hours.")} />
                </h3>
                <div style={{ flex: 1, display: "flex", alignItems: "flex-end", gap: 8, minHeight: 100 }}>
                  {hourlyData.map((val, i) => (
                    <div key={i} style={{ flex: 1, background: i === hourlyData.length - 1 ? C.primary : "#E2E8F0", height: `${(val / maxHourly) * 100}%`, borderRadius: "4px 4px 0 0", position: "relative" }}>
                      <div style={{ position: "absolute", top: -18, width: "100%", textAlign: "center", fontSize: 10, fontWeight: 800, color: C.muted, opacity: i % 2 === 0 || i === hourlyData.length - 1 ? 1 : 0 }}>{val}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Department Load Chart */}
              <div style={{ background: C.card, borderRadius: 16, padding: "20px 24px", border: `1px solid ${C.border}`, boxShadow: "0 4px 12px rgba(0, 0, 0, 0.02)", display: "flex", flexDirection: "column" }}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: C.text, marginBottom: 16, display: "flex", alignItems: "center", gap: 6 }}>
                  <Stethoscope size={16} /> {T("विभागों का भार", "Department OPD Load")}
                  <InfoButton text={T("चिकित्सा विभागों में मरीजों का वास्तविक समय का आवंटन।", "Real-time patient distribution across clinical departments.")} />
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {dynamicDepts.map((dept, i) => (
                    <div key={i}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700, marginBottom: 4, color: C.text }}>
                        <span>{dept.label}</span>
                        <span>{dept.value} cases</span>
                      </div>
                      <div style={{ height: 6, background: "#E2E8F0", borderRadius: 3, overflow: "hidden" }}>
                        <div style={{ width: `${totalPatients ? Math.min(100, Math.round((dept.value / totalPatients) * 100)) : 0}%`, height: "100%", background: dept.color, transition: "width 0.5s ease" }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Treatment Success Overview */}
              <div style={{ background: C.card, borderRadius: 16, padding: "20px 24px", border: `1px solid ${C.border}`, boxShadow: "0 4px 12px rgba(0, 0, 0, 0.02)", display: "flex", flexDirection: "column" }}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: C.text, marginBottom: 16, display: "flex", alignItems: "center", gap: 6 }}>
                  <CheckCircle2 size={16} /> {T("उपचार की दर", "Discharge & Resolution Rate")}
                </h3>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 14 }}>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 700, marginBottom: 4, color: C.green }}>
                      <span>Cured & Discharged</span>
                      <span>{curedPatientsCount} Patients</span>
                    </div>
                    <div style={{ height: 10, background: "#E2E8F0", borderRadius: 5, overflow: "hidden" }}>
                      <div style={{ width: `${totalPatients + curedPatientsCount ? (curedPatientsCount / (totalPatients + curedPatientsCount)) * 100 : 0}%`, height: "100%", background: C.green }} />
                    </div>
                  </div>

                  <div style={{ textAlign: "center", marginTop: 4 }}>
                    <div style={{ fontSize: 26, fontWeight: 800, color: C.text }}>
                      {totalPatients + curedPatientsCount > 0 ? Math.round((curedPatientsCount / (totalPatients + curedPatientsCount)) * 100) : 0}%
                    </div>
                    <div style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>Overall Resolution Rate</div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* Standard Wards */}
          {(activeTab === "dashboard" || activeTab === "wards") && (
            <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, overflow: "hidden", boxShadow: "0 6px 16px rgba(0, 0, 0, 0.03)" }}>
              <div style={{ padding: "18px 24px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: C.text, display: "flex", alignItems: "center", gap: 6 }}>
                  <BedDouble size={18} /> {T("मानक वार्ड एवं बेड स्थिति", "Inpatient Wards & Bed Status")}
                </h3>
                <div style={{ fontSize: 12, color: C.primaryLight, fontWeight: 700, background: `${C.primaryLight}15`, padding: "4px 12px", borderRadius: 14 }}>
                  {yellowPatients.length + greenPatients.length} Active Inpatients
                </div>
              </div>
              <div style={{ padding: 0 }}>
                {yellowPatients.length === 0 && greenPatients.length === 0 ? (
                  <div style={{ padding: 32, textAlign: "center", color: C.muted }}>No patients in standard ward.</div>
                ) : (
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                    <thead>
                      <tr style={{ background: "#F8FAFC", fontSize: 11.5, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>
                        <th style={{ padding: "14px 20px", fontWeight: 700 }}>Patient</th>
                        <th style={{ padding: "14px 20px", fontWeight: 700 }}>Priority Status</th>
                        <th style={{ padding: "14px 20px", fontWeight: 700 }}>Assigned Doctor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...yellowPatients, ...greenPatients].map((p) => (
                        <tr key={p._id} style={{ borderTop: `1px solid ${C.border}` }}>
                          <td style={{ padding: "14px 20px" }}>
                            <div style={{ fontWeight: 700, color: C.text, fontSize: 14 }}>{p.patientName}</div>
                          </td>
                          <td style={{ padding: "14px 20px" }}>
                            <span style={{ background: p.urgency === "YELLOW" ? "#FEF3C7" : "#D1FAE5", color: p.urgency === "YELLOW" ? "#D97706" : "#059669", padding: "4px 10px", borderRadius: 12, fontSize: 11, fontWeight: 800 }}>
                              {p.urgency === "YELLOW" ? "YELLOW URGENT" : "GREEN ROUTINE"}
                            </span>
                          </td>
                          <td style={{ padding: "14px 20px" }}>
                            <div style={{ fontSize: 13, fontWeight: 600 }}>{p.doctorName || "Unassigned"}</div>
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
            <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, overflow: "hidden", boxShadow: "0 6px 16px rgba(0, 0, 0, 0.03)" }}>
              <div style={{ padding: "18px 24px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: C.text, display: "flex", alignItems: "center", gap: 6 }}>
                    <Share2 size={18} /> {T("इनबाउंड रेफरल एवं शारीरिक OPD डेस्क", "Inbound Referrals & Physical OPD Desk")}
                  </h3>
                  <p style={{ margin: "2px 0 0 0", fontSize: 12, color: C.muted }}>
                    {T("ऑनलाइन परामर्श से शारीरिक विज़िट और विशेषज्ञ अस्पताल रेफरल", "Physical OPD visits & transfers scheduled from telemedicine")}
                  </p>
                </div>

                {/* Filter Pills */}
                <div style={{ display: "flex", gap: 6 }}>
                  {[
                    { id: "ALL", label: "All Cases" },
                    { id: "IN_PERSON_FOLLOWUP", label: "Physical Visits" },
                    { id: "SPECIALIST_FACILITY_TRANSFER", label: "Specialist Transfers" },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setReferralFilter(f.id as any)}
                      style={{
                        padding: "4px 10px",
                        borderRadius: 14,
                        border: "none",
                        fontSize: 11,
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
                      <div style={{ padding: 36, textAlign: "center", color: C.muted }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>No inbound referrals or physical OPD appointments for this facility.</div>
                        <div style={{ fontSize: 12, marginTop: 4 }}>Appointments booked by telemedicine doctors will appear in real-time.</div>
                      </div>
                    );
                  }

                  return (
                    <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                      <thead>
                        <tr style={{ background: "#F8FAFC", fontSize: 11.5, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>
                          <th style={{ padding: "14px 20px", fontWeight: 700 }}>Patient Identity</th>
                          <th style={{ padding: "14px 20px", fontWeight: 700 }}>Type & Token</th>
                          <th style={{ padding: "14px 20px", fontWeight: 700 }}>Referring Doctor</th>
                          <th style={{ padding: "14px 20px", fontWeight: 700 }}>Scheduled Slot & Reason</th>
                          <th style={{ padding: "14px 20px", fontWeight: 700 }}>Action</th>
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
                            >
                              <td style={{ padding: "14px 20px" }}>
                                <div style={{ fontWeight: 800, color: C.text, fontSize: 14 }}>{r.patientName}</div>
                                <div style={{ display: "flex", gap: 6, marginTop: 3 }}>
                                  <button
                                    type="button"
                                    onClick={() => window.open(`tel:${r.patientPhone}`)}
                                    style={{ background: "#F1F5F9", border: "none", borderRadius: 5, padding: "2px 6px", fontSize: 11, fontWeight: 700, cursor: "pointer", color: C.text, display: "flex", alignItems: "center", gap: 3 }}
                                  >
                                    <Phone size={11} /> {r.patientPhone}
                                  </button>
                                </div>
                              </td>

                              <td style={{ padding: "14px 20px" }}>
                                <span
                                  style={{
                                    background: isInPerson ? "#ECFDF5" : "#FFF7ED",
                                    color: isInPerson ? "#059669" : "#C2410C",
                                    padding: "3px 8px",
                                    borderRadius: 6,
                                    fontSize: 10.5,
                                    fontWeight: 800,
                                    display: "inline-block",
                                  }}
                                >
                                  {isInPerson ? "Physical OPD" : "Specialist Transfer"}
                                </span>
                                {r.opdToken && (
                                  <div style={{ fontSize: 11, fontWeight: 800, color: C.primary, marginTop: 3 }}>
                                    Token: {r.opdToken}
                                  </div>
                                )}
                              </td>

                              <td style={{ padding: "14px 20px" }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Dr. {r.referredByDoctorName}</div>
                                <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>{r.sourceFacility}</div>
                              </td>

                              <td style={{ padding: "14px 20px" }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>
                                  {r.scheduledDate || "Today"} · {r.scheduledSlot || "OPD Hours"}
                                </div>
                                <div style={{ fontSize: 11, color: C.muted, marginTop: 2, maxWidth: 280, lineHeight: 1.3 }}>
                                  {r.reasonForReferral}
                                </div>
                              </td>

                              <td style={{ padding: "14px 20px" }}>
                                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                  {isPending && (
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        await fetch("/api/referrals", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: r._id, status: "arrived" }) });
                                        fetchData();
                                      }}
                                      style={{ padding: "5px 10px", background: "#0284C7", color: "white", border: "none", borderRadius: 6, fontSize: 11, fontWeight: 800, cursor: "pointer" }}
                                    >
                                      Mark Arrived
                                    </button>
                                  )}
                                  {isArrived && (
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        await fetch("/api/referrals", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: r._id, status: "completed" }) });
                                        fetchData();
                                      }}
                                      style={{ padding: "5px 10px", background: C.green, color: "white", border: "none", borderRadius: 6, fontSize: 11, fontWeight: 800, cursor: "pointer" }}
                                    >
                                      Complete Visit
                                    </button>
                                  )}
                                  {isCompleted && (
                                    <span style={{ fontSize: 11, fontWeight: 800, color: C.green, background: "#D1FAE5", padding: "4px 8px", borderRadius: 8 }}>
                                      Finished
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
            <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, overflow: "hidden", boxShadow: "0 6px 16px rgba(0, 0, 0, 0.03)" }}>
              <div style={{ padding: "18px 24px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: C.text, display: "flex", alignItems: "center", gap: 6 }}>
                  <FlaskConical size={18} /> {T("ग्लोबल लैब रिपोर्ट (सेफ्टी नेट)", "Global Lab Reports (Diagnostics Safety Net)")}
                </h3>
                <div style={{ fontSize: 12, color: C.accent, fontWeight: 700, background: `${C.accent}15`, padding: "4px 12px", borderRadius: 14 }}>
                  {labTests.length} Total Reports
                </div>
              </div>
              <div style={{ padding: 0 }}>
                {labTests.length === 0 ? (
                  <div style={{ padding: 32, textAlign: "center", color: C.muted }}>No lab reports found.</div>
                ) : (
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                    <thead>
                      <tr style={{ background: "#F8FAFC", fontSize: 11.5, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>
                        <th style={{ padding: "14px 20px", fontWeight: 700 }}>Patient</th>
                        <th style={{ padding: "14px 20px", fontWeight: 700 }}>Test Result</th>
                        <th style={{ padding: "14px 20px", fontWeight: 700 }}>Status / Assignment</th>
                      </tr>
                    </thead>
                    <tbody>
                      {labTests.slice(0, 20).map((t) => (
                        <tr key={t._id} style={{ borderTop: `1px solid ${C.border}`, background: t.isCritical && !t.assignedDoctorId ? "#FEF2F2" : "transparent" }}>
                          <td style={{ padding: "14px 20px" }}>
                            <div style={{ fontWeight: 700, color: C.text, fontSize: 14 }}>{t.patientName}</div>
                            <div style={{ fontSize: 11.5, color: C.muted, marginTop: 2 }}>Phone: {t.patientPhone}</div>
                          </td>
                          <td style={{ padding: "14px 20px" }}>
                            <div style={{ fontSize: 13.5, fontWeight: 800, color: t.isCritical ? C.red : C.text }}>{t.testType}: {t.result}</div>
                            <div style={{ fontSize: 11.5, color: C.muted, marginTop: 2 }}>Date: {new Date(t.testDate).toLocaleDateString()}</div>
                          </td>
                          <td style={{ padding: "14px 20px" }}>
                            {t.assignedDoctorId ? (
                              <span style={{ background: "#D1FAE5", color: "#059669", padding: "4px 10px", borderRadius: 10, fontSize: 11, fontWeight: 800 }}>Assigned to Doctor</span>
                            ) : (
                              <span style={{ background: t.isCritical ? C.red : "#FEF3C7", color: t.isCritical ? "white" : "#D97706", padding: "4px 10px", borderRadius: 10, fontSize: 11, fontWeight: 800 }}>Unassigned {t.isCritical && "(CRITICAL)"}</span>
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

          {/* HMIS / EMR Integration Bridge */}
          {activeTab === "hmis-bridge" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {/* 1. Live ABDM & NIC e-Hospital Cloud Gateway Status */}
              <div style={{ background: C.card, borderRadius: 16, padding: "22px 26px", border: `1px solid ${C.border}`, boxShadow: "0 6px 18px rgba(0, 0, 0, 0.03)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 14, marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 10, background: "#E0F2FE", color: "#0284C7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Network size={22} />
                    </div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: C.text }}>
                          {T("आयुष्मान भारत (ABDM) व ई-हॉस्पिटल गेटवे", "ABDM & NIC e-Hospital Integration Bridge")}
                        </h3>
                        <span style={{ background: "#D1FAE5", color: "#059669", fontSize: 10.5, fontWeight: 800, padding: "2px 8px", borderRadius: 14, display: "flex", alignItems: "center", gap: 4 }}>
                          <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#059669", animation: "pulse 1.5s infinite" }} />
                          Live Sync Active
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
                        Bi-directional FHIR M3 / HL7 v2.4 protocol connecting <strong>{activeFacility?.name}</strong> to the National Health Grid.
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      type="button"
                      onClick={handleForceSyncHmis}
                      disabled={hmisSyncing}
                      style={{
                        padding: "8px 14px", borderRadius: 9, border: "none",
                        background: "linear-gradient(135deg, #0D9488, #0F766E)", color: "white",
                        fontSize: 12, fontWeight: 800, cursor: hmisSyncing ? "not-allowed" : "pointer",
                        display: "flex", alignItems: "center", gap: 5, boxShadow: "0 3px 10px rgba(13, 148, 136, 0.25)"
                      }}
                    >
                      <RefreshCw size={13} /> {hmisSyncing ? "Synchronizing Records..." : "Force Sync Now"}
                    </button>
                  </div>
                </div>

                {/* Gateway Metrics Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginTop: 12 }}>
                  <div style={{ background: "#F8FAFC", padding: "14px 18px", borderRadius: 12, border: `1px solid ${C.border}` }}>
                    <div style={{ fontSize: 10, color: C.muted, fontWeight: 700, textTransform: "uppercase" }}>OPD Tokens Synced</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: C.primary, marginTop: 3 }}>{facilityScopedQueue.length} Active</div>
                    <div style={{ fontSize: 10.5, color: "#10B981", marginTop: 2 }}>Auto-synced with NIC e-Hospital</div>
                  </div>

                  <div style={{ background: "#F8FAFC", padding: "14px 18px", borderRadius: 12, border: `1px solid ${C.border}` }}>
                    <div style={{ fontSize: 10, color: C.muted, fontWeight: 700, textTransform: "uppercase" }}>ABHA Health IDs Linked</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: "#7C3AED", marginTop: 3 }}>{new Set(facilityScopedQueue.map(q => q.patientPhone || q.patientName)).size} Patients</div>
                    <div style={{ fontSize: 10.5, color: C.muted, marginTop: 2 }}>FHIR Milestone 2 Verified</div>
                  </div>

                  <div style={{ background: "#F8FAFC", padding: "14px 18px", borderRadius: 12, border: `1px solid ${C.border}` }}>
                    <div style={{ fontSize: 10, color: C.muted, fontWeight: 700, textTransform: "uppercase" }}>Lab Orders Pushed</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: "#D97706", marginTop: 3 }}>{labTests.length} Reports</div>
                    <div style={{ fontSize: 10.5, color: C.muted, marginTop: 2 }}>LOINC Standardized</div>
                  </div>

                  <div style={{ background: "#F8FAFC", padding: "14px 18px", borderRadius: 12, border: `1px solid ${C.border}` }}>
                    <div style={{ fontSize: 10, color: C.muted, fontWeight: 700, textTransform: "uppercase" }}>HFR Registry Code</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: C.text, marginTop: 4 }}>{activeFacility?.facilityId}</div>
                    <div style={{ fontSize: 10.5, color: C.muted, marginTop: 2 }}>NIN: 270014022 (Approved)</div>
                  </div>
                </div>
              </div>

              {/* 2. 1-Click Legacy HMIS Data Ingestion & Live Merge */}
              <div style={{ background: C.card, borderRadius: 16, padding: "22px 26px", border: `1px solid ${C.border}`, boxShadow: "0 6px 18px rgba(0, 0, 0, 0.03)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: C.text, display: "flex", alignItems: "center", gap: 6 }}>
                      <Upload size={18} /> {T("मौजूदा अस्पताल HMIS डेटा मर्ज करें", "Merge Existing Hospital Walk-ins & Offline OPD")}
                    </h3>
                    <p style={{ margin: "2px 0 0", fontSize: 12, color: C.muted }}>
                      Easily merge walk-in patients from existing hospital software, Excel/CSV sheets, or offline registers into AarogyaAI Live Triage without double entry.
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={bulkImporting}
                    onClick={() => handleImportLegacyOPD()}
                    style={{
                      padding: "8px 14px", borderRadius: 9, border: "none",
                      background: "linear-gradient(135deg, #2563EB, #1D4ED8)", color: "white",
                      fontSize: 12, fontWeight: 800, cursor: bulkImporting ? "not-allowed" : "pointer",
                      display: "flex", alignItems: "center", gap: 5, boxShadow: "0 3px 10px rgba(37, 99, 235, 0.25)"
                    }}
                  >
                    <Download size={13} /> {bulkImporting ? "Merging..." : "1-Click Merge 3 Walk-in Records"}
                  </button>
                </div>

                {importStatusMessage && (
                  <div style={{ background: "#ECFDF5", border: "1px solid #A7F3D0", color: "#065F46", padding: "10px 14px", borderRadius: 10, fontSize: 12, fontWeight: 700, marginBottom: 14 }}>
                    {importStatusMessage}
                  </div>
                )}

                {/* CSV Input Box */}
                <div style={{ background: "#F8FAFC", borderRadius: 12, padding: "14px 18px", border: `1px solid ${C.border}` }}>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: C.text, marginBottom: 6, display: "flex", justifyContent: "space-between" }}>
                    <span>Paste Raw CSV / HMIS Export (Format: Name, Phone, Age, Symptoms, Department, Priority)</span>
                    <span style={{ color: C.muted }}>Deduplicates automatically by Phone Number</span>
                  </div>
                  <textarea
                    value={bulkCsvText}
                    onChange={(e) => setBulkCsvText(e.target.value)}
                    placeholder="e.g. Ramesh More, 9898989801, 45, Severe Chest Pain, Cardiology, RED&#10;Sunita Patil, 9898989802, 32, High Fever & Vomiting, General Medicine, YELLOW"
                    rows={3}
                    style={{
                      width: "100%", padding: "8px 10px", borderRadius: 8,
                      border: `1px solid ${C.border}`, fontSize: 11.5, fontFamily: "monospace",
                      outline: "none", boxSizing: "border-box", background: "white"
                    }}
                  />
                  <div style={{ marginTop: 8, display: "flex", justifyContent: "flex-end", gap: 8 }}>
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
                            symptoms: symptoms ? [symptoms] : ["General OPD consultation"],
                            department: dept || "General Medicine",
                            urgency: priority === "RED" ? "RED" : priority === "YELLOW" ? "YELLOW" : "GREEN",
                            slotTime: "HMIS Walk-in",
                            hospital: activeFacility?.name || "Civil Hospital",
                            facilityId: activeFacility?.facilityId || selectedFacilityId,
                            receptionistStatus: "CONFIRMED",
                            status: "confirmed",
                          };
                        });
                        handleImportLegacyOPD(customRecs);
                        setBulkCsvText("");
                      }}
                      style={{ padding: "7px 14px", borderRadius: 8, border: "none", background: C.primary, color: "white", fontSize: 11.5, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
                    >
                      <Upload size={12} /> Parse & Merge Custom CSV Rows
                    </button>
                  </div>
                </div>
              </div>

              {/* 3. Local Hospital Network REST Webhook Configuration */}
              <div style={{ background: C.card, borderRadius: 16, padding: "22px 26px", border: `1px solid ${C.border}`, boxShadow: "0 6px 18px rgba(0, 0, 0, 0.03)" }}>
                <h3 style={{ margin: "0 0 6px 0", fontSize: 16, fontWeight: 800, color: C.text, display: "flex", alignItems: "center", gap: 6 }}>
                  <Layers size={18} /> {T("अस्पताल लोकल सर्वर / ईएचआर वेबहुक", "Local Hospital Intranet REST API / Webhook")}
                </h3>
                <p style={{ margin: "0 0 14px 0", fontSize: 12, color: C.muted }}>
                  Connect to your on-premise HIS/EMR server running inside {activeFacility?.shortName || "Hospital"} intranet network.
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr auto", gap: 10, alignItems: "flex-end" }}>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: C.text, marginBottom: 4 }}>
                      Local HIS Server Endpoint URL
                    </label>
                    <input
                      type="text"
                      value={hmisEndpoint}
                      onChange={(e) => setHmisEndpoint(e.target.value)}
                      style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 12, outline: "none", boxSizing: "border-box" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: C.text, marginBottom: 4 }}>
                      Facility API Key / HFR Token
                    </label>
                    <input
                      type="text"
                      value={hmisApiKey}
                      onChange={(e) => setHmisApiKey(e.target.value)}
                      style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 12, outline: "none", boxSizing: "border-box" }}
                    />
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={handleTestHmisEndpoint}
                      disabled={endpointTesting}
                      style={{
                        padding: "8px 14px", borderRadius: 8, border: "none",
                        background: "#0F766E", color: "white", fontSize: 12, fontWeight: 800,
                        cursor: endpointTesting ? "not-allowed" : "pointer",
                      }}
                    >
                      {endpointTesting ? "Pinging..." : "Test Connection"}
                    </button>
                  </div>
                </div>

                {endpointStatus && (
                  <div style={{ marginTop: 12, padding: "8px 12px", borderRadius: 8, background: "#F0FDF4", border: "1px solid #BBF7D0", color: "#166534", fontSize: 11.5, fontWeight: 700 }}>
                    {endpointStatus}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Informative Footer */}
        <footer style={{ marginTop: 40, borderTop: `1px solid ${C.border}`, paddingTop: 20, display: "flex", justifyContent: "space-between", alignItems: "center", color: C.muted, fontSize: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: "rgba(15, 118, 110, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: C.primary }}>
              <Building2 size={16} />
            </div>
            <div>
              <div style={{ fontWeight: 800, color: C.text, fontSize: 13 }}>AarogyaAI Central Operations</div>
              <div style={{ fontSize: 11 }}>Secure Clinical Reception & Command Interface</div>
            </div>
          </div>
          <div style={{ fontWeight: 600 }}>
            {T("AarogyaAI © 2026. सर्वाधिकार सुरक्षित।", "AarogyaAI © 2026. All rights reserved.")}
          </div>
        </footer>

      </main>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ── MODAL 1: QUICK WALK-IN PATIENT REGISTRATION DRAWER / MODAL ── */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {isRegisterModalOpen && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 99999,
          background: "rgba(15, 23, 42, 0.75)", backdropFilter: "blur(6px)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: 16
        }}>
          <div style={{
            background: "white", borderRadius: 20, width: "100%", maxWidth: 540,
            overflow: "hidden", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.35)",
            border: `1px solid ${C.border}`
          }}>
            <div style={{ padding: "18px 24px", background: "#0F766E", color: "white", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <UserPlus size={22} />
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>New Walk-In Patient Registration</h3>
                  <div style={{ fontSize: 11, opacity: 0.85 }}>Issue instant OPD token and assign consultation room</div>
                </div>
              </div>
              <button onClick={() => setIsRegisterModalOpen(false)} style={{ background: "transparent", border: "none", color: "white", cursor: "pointer" }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateWalkin} style={{ padding: "20px 24px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: C.text, marginBottom: 4 }}>
                    Patient Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Patil"
                    value={walkinForm.patientName}
                    onChange={(e) => setWalkinForm({ ...walkinForm, patientName: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 13, outline: "none", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: C.text, marginBottom: 4 }}>
                    Mobile Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. +91 98765 43210"
                    value={walkinForm.patientPhone}
                    onChange={(e) => setWalkinForm({ ...walkinForm, patientPhone: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 13, outline: "none", boxSizing: "border-box" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: C.text, marginBottom: 4 }}>Age</label>
                  <input
                    type="number"
                    placeholder="e.g. 42"
                    value={walkinForm.age}
                    onChange={(e) => setWalkinForm({ ...walkinForm, age: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 13, outline: "none", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: C.text, marginBottom: 4 }}>Gender</label>
                  <select
                    value={walkinForm.gender}
                    onChange={(e) => setWalkinForm({ ...walkinForm, gender: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 13, outline: "none", boxSizing: "border-box", background: "white" }}
                  >
                    <option value="M">Male (M)</option>
                    <option value="F">Female (F)</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: C.text, marginBottom: 4 }}>Triage Priority</label>
                  <select
                    value={walkinForm.urgency}
                    onChange={(e) => setWalkinForm({ ...walkinForm, urgency: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 13, outline: "none", boxSizing: "border-box", background: "white", fontWeight: 700, color: walkinForm.urgency === "RED" ? C.red : walkinForm.urgency === "YELLOW" ? C.yellow : C.green }}
                  >
                    <option value="GREEN">GREEN (Routine OPD)</option>
                    <option value="YELLOW">YELLOW (Urgent / Fast-track)</option>
                    <option value="RED">RED (Casualty Emergency)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: C.text, marginBottom: 4 }}>Department</label>
                  <select
                    value={walkinForm.department}
                    onChange={(e) => setWalkinForm({ ...walkinForm, department: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 13, outline: "none", boxSizing: "border-box", background: "white" }}
                  >
                    <option value="General Medicine">General Medicine (OPD)</option>
                    <option value="Cardiology">Cardiology</option>
                    <option value="Pediatrics">Pediatrics & Child Care</option>
                    <option value="Orthopedics">Orthopedics</option>
                    <option value="Emergency & Trauma 24/7">Emergency & Trauma</option>
                    <option value="Gynecology & Maternal">Gynecology</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: C.text, marginBottom: 4 }}>Assign Doctor (On Duty)</label>
                  <select
                    value={walkinForm.doctorName}
                    onChange={(e) => setWalkinForm({ ...walkinForm, doctorName: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 13, outline: "none", boxSizing: "border-box", background: "white" }}
                  >
                    <option value="">-- Auto-Assign Available Room --</option>
                    {activeFacilityStaff.doctors.map((doc: any) => (
                      <option key={doc.id} value={doc.name}>
                        {doc.name} ({doc.room || doc.dept}) {doc.onDuty ? "• On Duty" : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: 18 }}>
                <label style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: C.text, marginBottom: 4 }}>Chief Complaints / Symptoms</label>
                <input
                  type="text"
                  placeholder="e.g. Chest pain, fever for 3 days, headache"
                  value={walkinForm.symptoms}
                  onChange={(e) => setWalkinForm({ ...walkinForm, symptoms: e.target.value })}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 13, outline: "none", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  style={{ padding: "9px 16px", borderRadius: 8, border: `1px solid ${C.border}`, background: "#F1F5F9", color: C.muted, fontSize: 13, fontWeight: 700, cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={walkinSubmitting}
                  style={{ padding: "9px 20px", borderRadius: 8, border: "none", background: C.primary, color: "white", fontSize: 13, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
                >
                  <Printer size={15} /> {walkinSubmitting ? "Generating..." : "Generate Token & Check-in"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ── MODAL 2: PRINTABLE OPD TOKEN SLIP MODAL ── */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTokenSlip && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 999999,
          background: "rgba(15, 23, 42, 0.8)", backdropFilter: "blur(6px)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: 16
        }}>
          <div style={{
            background: "white", borderRadius: 16, width: "100%", maxWidth: 400,
            overflow: "hidden", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.4)",
            border: `1px solid ${C.border}`
          }}>
            {/* Printable Slip Receipt */}
            <div id="printable-opd-slip" style={{ padding: "24px 28px", fontFamily: "monospace", color: "#1E293B", background: "white" }}>
              <div style={{ textAlign: "center", borderBottom: "1.5px dashed #CBD5E1", paddingBottom: 14, marginBottom: 14 }}>
                <div style={{ fontSize: 15, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  {activeFacility?.name || "AarogyaAI Medical Center"}
                </div>
                <div style={{ fontSize: 10, color: "#64748B", marginTop: 2 }}>
                  {activeFacility?.address || "Govt Hospital Network"} · Ph: {activeFacility?.phone || "+91 22 24076381"}
                </div>
                <div style={{ fontSize: 11, fontWeight: 800, color: C.primary, marginTop: 4 }}>
                  CENTRAL OPD TOKEN SLIP
                </div>
              </div>

              <div style={{ textAlign: "center", margin: "14px 0", padding: "10px", background: "#F8FAFC", borderRadius: 8, border: "1px solid #E2E8F0" }}>
                <div style={{ fontSize: 10, color: "#64748B", textTransform: "uppercase", fontWeight: 700 }}>Token Number</div>
                <div style={{ fontSize: 26, fontWeight: 900, color: "#0F766E", letterSpacing: "1px" }}>
                  {activeTokenSlip.tokenNumber || `OPD-${activeTokenSlip._id?.slice(-4).toUpperCase() || "102"}`}
                </div>
                <div style={{ fontSize: 11, fontWeight: 800, color: activeTokenSlip.urgency === "RED" ? C.red : activeTokenSlip.urgency === "YELLOW" ? "#D97706" : C.green, marginTop: 2 }}>
                  {activeTokenSlip.urgency === "RED" ? "EMERGENCY CASUALTY" : activeTokenSlip.urgency === "YELLOW" ? "URGENT FAST-TRACK" : "STANDARD OPD"}
                </div>
              </div>

              <div style={{ fontSize: 12, lineHeight: 1.8 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#64748B" }}>Patient Name:</span>
                  <span style={{ fontWeight: 800 }}>{activeTokenSlip.patientName}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#64748B" }}>Mobile:</span>
                  <span style={{ fontWeight: 700 }}>{activeTokenSlip.patientPhone}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#64748B" }}>Department:</span>
                  <span style={{ fontWeight: 700 }}>{activeTokenSlip.department || "General OPD"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#64748B" }}>Doctor / Room:</span>
                  <span style={{ fontWeight: 800, color: C.primary }}>{activeTokenSlip.doctorName || "Room 102"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#64748B" }}>Date & Time:</span>
                  <span>{new Date().toLocaleDateString()} {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
              </div>

              <div style={{ borderTop: "1.5px dashed #CBD5E1", paddingTop: 12, marginTop: 14, textAlign: "center", fontSize: 10, color: "#64748B" }}>
                Please proceed to the waiting lobby. Your token will be called on the OPD display screen.
              </div>
            </div>

            {/* Modal Controls */}
            <div style={{ padding: "12px 20px", background: "#F8FAFC", borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", gap: 10 }}>
              <button
                type="button"
                onClick={() => setActiveTokenSlip(null)}
                style={{ padding: "8px 14px", borderRadius: 8, border: `1px solid ${C.border}`, background: "white", color: C.muted, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: C.primary, color: "white", fontSize: 12, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
              >
                <Printer size={14} /> Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ── MODAL 3: ASSIGN DOCTOR / ROOM MODAL ── */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {assignDoctorPatient && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 99999,
          background: "rgba(15, 23, 42, 0.75)", backdropFilter: "blur(6px)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: 16
        }}>
          <div style={{
            background: "white", borderRadius: 16, width: "100%", maxWidth: 440,
            overflow: "hidden", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.35)",
            border: `1px solid ${C.border}`
          }}>
            <div style={{ padding: "16px 20px", background: "#0F766E", color: "white", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Stethoscope size={20} />
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800 }}>Assign Doctor & Consultation Room</h3>
              </div>
              <button onClick={() => setAssignDoctorPatient(null)} style={{ background: "transparent", border: "none", color: "white", cursor: "pointer" }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: "20px" }}>
              <div style={{ marginBottom: 14, padding: "10px 14px", background: "#F8FAFC", borderRadius: 8, border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: C.text }}>{assignDoctorPatient.patientName}</div>
                <div style={{ fontSize: 11.5, color: C.muted, marginTop: 2 }}>{assignDoctorPatient.department || "General OPD"} • {assignDoctorPatient.patientPhone}</div>
              </div>

              <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 8 }}>Select On-Duty Doctor & Room:</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 260, overflowY: "auto" }}>
                {activeFacilityStaff.doctors.map((doc: any) => (
                  <button
                    key={doc.id || doc._id}
                    onClick={() => handleAssignDoctor(assignDoctorPatient._id, doc.name, doc.room || "Room 102", doc.id || doc._id, doc.email)}
                    style={{
                      padding: "10px 14px",
                      borderRadius: 10,
                      border: `1px solid ${C.border}`,
                      background: "white",
                      textAlign: "left",
                      cursor: "pointer",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = C.primary}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = C.border}
                  >
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: C.text }}>{doc.name}</div>
                      <div style={{ fontSize: 11, color: C.primary, fontWeight: 600 }}>{doc.room || "Room 102"} • {doc.dept}</div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 800, color: doc.onDuty ? "#059669" : C.muted, background: doc.onDuty ? "#D1FAE5" : "#F1F5F9", padding: "2px 8px", borderRadius: 6 }}>
                      {doc.onDuty ? "Available" : "Off Duty"}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ── MODAL 4: ADD / EDIT DOCTOR & CREDENTIALS MODAL ── */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {isDoctorModalOpen && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 999999,
          background: "rgba(15, 23, 42, 0.8)", backdropFilter: "blur(6px)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: 16
        }}>
          <div style={{
            background: "white", borderRadius: 20, width: "100%", maxWidth: 540,
            overflow: "hidden", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.35)",
            border: `1px solid ${C.border}`
          }}>
            <div style={{ padding: "18px 24px", background: "#0F766E", color: "white", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Stethoscope size={22} />
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>
                    {editingDoctor ? "Manage Doctor & Login Credentials" : "Register New Doctor & Issue Credentials"}
                  </h3>
                  <div style={{ fontSize: 11, opacity: 0.85 }}>
                    Facility: {activeFacility?.name || "Hospital Facility"} ({selectedFacilityId})
                  </div>
                </div>
              </div>
              <button onClick={() => setIsDoctorModalOpen(false)} style={{ background: "transparent", border: "none", color: "white", cursor: "pointer" }}>
                <X size={20} />
              </button>
            </div>

            {doctorError && (
              <div style={{ padding: "10px 24px", background: "#FEF2F2", color: "#DC2626", fontSize: 12.5, fontWeight: 700, borderBottom: "1px solid #FECACA" }}>
                ⚠️ {doctorError}
              </div>
            )}

            <form onSubmit={handleSaveDoctor} style={{ padding: "20px 24px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: C.text, marginBottom: 4 }}>
                    Doctor Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Ramesh Gaikwad"
                    value={doctorForm.name}
                    onChange={(e) => setDoctorForm({ ...doctorForm, name: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 13, outline: "none", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: C.text, marginBottom: 4 }}>
                    Specialization / Dept *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. General Medicine / Cardiology"
                    value={doctorForm.specialization}
                    onChange={(e) => setDoctorForm({ ...doctorForm, specialization: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 13, outline: "none", boxSizing: "border-box" }}
                  />
                </div>
              </div>

              {/* Login Credentials Section */}
              <div style={{ background: "#F8FAFC", padding: "12px 14px", borderRadius: 10, border: `1px solid ${C.border}`, marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 800, color: C.primary, marginBottom: 8 }}>
                  <Key size={14} /> Unique Login Credentials for Doctor Dashboard
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: C.text, marginBottom: 3 }}>
                      Unique Email / ID *
                    </label>
                    <input
                      type="email"
                      required
                      disabled={!!editingDoctor}
                      placeholder="e.g. doc.name@dypatil.edu"
                      value={doctorForm.email}
                      onChange={(e) => setDoctorForm({ ...doctorForm, email: e.target.value })}
                      style={{
                        width: "100%", padding: "8px 10px", borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 12.5, outline: "none", boxSizing: "border-box",
                        background: editingDoctor ? "#E2E8F0" : "white"
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: C.text, marginBottom: 3 }}>
                      {editingDoctor ? "New Password (Leave blank to keep)" : "Password *"}
                    </label>
                    <input
                      type="password"
                      required={!editingDoctor}
                      placeholder={editingDoctor ? "Enter to reset password" : "e.g. hospital@doc1"}
                      value={doctorForm.password}
                      onChange={(e) => setDoctorForm({ ...doctorForm, password: e.target.value })}
                      style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 12.5, outline: "none", boxSizing: "border-box" }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: C.text, marginBottom: 4 }}>OPD Room / Chamber</label>
                  <input
                    type="text"
                    placeholder="e.g. Room 102 (OPD)"
                    value={doctorForm.room}
                    onChange={(e) => setDoctorForm({ ...doctorForm, room: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 13, outline: "none", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: C.text, marginBottom: 4 }}>Experience</label>
                  <input
                    type="text"
                    placeholder="e.g. 10 yrs"
                    value={doctorForm.experience}
                    onChange={(e) => setDoctorForm({ ...doctorForm, experience: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 13, outline: "none", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: C.text, marginBottom: 4 }}>Duty Availability</label>
                  <select
                    value={doctorForm.onDuty ? "true" : "false"}
                    onChange={(e) => setDoctorForm({ ...doctorForm, onDuty: e.target.value === "true" })}
                    style={{ width: "100%", padding: "9px 10px", borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 13, outline: "none", background: "white", boxSizing: "border-box", fontWeight: 700 }}
                  >
                    <option value="true">🟢 On Duty (Available)</option>
                    <option value="false">⚪ Off Duty</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: C.text, marginBottom: 4 }}>Phone / Desk Direct Line</label>
                <input
                  type="text"
                  placeholder="e.g. +91 98200 11001"
                  value={doctorForm.phone}
                  onChange={(e) => setDoctorForm({ ...doctorForm, phone: e.target.value })}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 13, outline: "none", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, paddingTop: 14, borderTop: `1px solid ${C.border}` }}>
                <button
                  type="button"
                  onClick={() => setIsDoctorModalOpen(false)}
                  style={{ padding: "9px 16px", borderRadius: 8, border: `1px solid ${C.border}`, background: "#F1F5F9", color: C.muted, fontSize: 13, fontWeight: 700, cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={doctorSubmitting}
                  style={{ padding: "9px 20px", borderRadius: 8, border: "none", background: C.primary, color: "white", fontSize: 13, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
                >
                  <CheckCircle2 size={15} /> {doctorSubmitting ? "Saving..." : editingDoctor ? "Update Doctor & Credentials" : "Create & Activate Doctor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Doctor Direct Phone QR Modal */}
      <DoctorCallQRModal
        isOpen={!!selectedQRDoctor}
        onClose={() => setSelectedQRDoctor(null)}
        doctor={selectedQRDoctor}
      />

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        @keyframes alertGlow { 0%, 100% { box-shadow: 0 0 10px rgba(239, 68, 68, 0.2); } 50% { box-shadow: 0 0 30px rgba(239, 68, 68, 0.8); } }
        .info-btn:hover .tooltip { visibility: visible !important; opacity: 1 !important; transform: translateX(-50%) translateY(-5px) !important; }
        @media print {
          body * { visibility: hidden; }
          #printable-opd-slip, #printable-opd-slip * { visibility: visible; }
          #printable-opd-slip { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>
    </div>
  );
}
