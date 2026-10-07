export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Facility from "@/models/Facility";

// Seed data representing regional hospitals focused on Maharashtra and Punjab rural & semi-urban centers
const DEFAULT_FACILITIES = [
  {
    facilityId: "HOSP-SION-001",
    name: "Lokmanya Tilak Municipal General Hospital (SION Hospital)",
    shortName: "SION Hospital (LTMGH Mumbai)",
    type: "Govt Civil Hospital",
    location: "Sion West, Mumbai",
    city: "Mumbai",
    state: "Maharashtra",
    address: "Sion West, Mumbai, Maharashtra 400022",
    phone: "+91 22 24076381",
    lat: 19.0360,
    lng: 72.8601,
    departments: ["Emergency & Trauma 24/7", "Cardiology", "Neurology", "General Medicine", "Pediatrics", "Orthopedics", "Pulmonology", "Diagnostic Lab"],
    emergencyAvailable: true,
    ayushmanBharat: true,
    opdTimings: "24/7 Emergency & Casualty / OPD 08:00 AM - 02:00 PM",
    receptionistPhone: "+91 98765 01010",
    receptionistEmail: "reception.sion@aarogya.ai",
    status: "ACTIVE",
    totalBeds: 1400,
    occupiedBeds: 1120,
    catchmentVillages: ["Dharavi Health Ward", "Sion Koliwada", "Kurla West", "Chunabhatti"],
  },
  {
    facilityId: "HOSP-KLY-002",
    name: "Kalyan Sub-District & Rural Civil Hospital",
    shortName: "Kalyan Civil Hospital",
    type: "Govt Civil Hospital",
    location: "Kalyan West, Thane Rural",
    city: "Kalyan",
    state: "Maharashtra",
    address: "Station Road, Near Shivaji Chowk, Kalyan West, Maharashtra 421301",
    phone: "+91 251 2314567",
    lat: 19.2437,
    lng: 73.1355,
    departments: ["General Medicine", "Cardiology", "Pediatrics", "Gynecology", "Emergency 24/7", "Diagnostic Lab"],
    emergencyAvailable: true,
    ayushmanBharat: true,
    opdTimings: "08:30 AM - 02:00 PM / 04:00 PM - 07:30 PM",
    receptionistPhone: "+91 98765 01004",
    receptionistEmail: "reception.kalyan@aarogya.ai",
    status: "ACTIVE",
    totalBeds: 250,
    occupiedBeds: 180,
    catchmentVillages: ["Kalyan Rural Gaothan", "Titwala", "Khadegolavali", "Shahad"],
  },
  {
    facilityId: "HOSP-KLW-003",
    name: "Chhatrapati Shivaji Maharaj Hospital & Medical College",
    shortName: "CSMH Kalwa Hospital",
    type: "Govt Civil Hospital",
    location: "Kalwa, Thane",
    city: "Thane",
    state: "Maharashtra",
    address: "Belapur Road, Kalwa, Thane, Maharashtra 400605",
    phone: "+91 22 25372555",
    lat: 19.1916,
    lng: 73.0033,
    departments: ["Emergency & Trauma 24/7", "General Medicine", "Pediatrics", "Orthopedics", "ICU & Surgery"],
    emergencyAvailable: true,
    ayushmanBharat: true,
    opdTimings: "08:00 AM - 02:00 PM / 04:00 PM - 08:00 PM",
    receptionistPhone: "+91 98765 01006",
    receptionistEmail: "reception.kalwa@aarogya.ai",
    status: "ACTIVE",
    totalBeds: 500,
    occupiedBeds: 410,
    catchmentVillages: ["Kalwa Naka", "Mumbra Hills", "Digha Rural", "Kharegaon"],
  },
  {
    facilityId: "HOSP-PLG-004",
    name: "Palghar Tribal & Rural Sub-District Civil Hospital",
    shortName: "Palghar Rural Civil Hospital",
    type: "Community Health Center (CHC)",
    location: "Manor Road, Palghar Rural",
    city: "Palghar",
    state: "Maharashtra",
    address: "Manor Highway, Palghar Rural Tribal Belt, Maharashtra 401404",
    phone: "+91 2525 252033",
    lat: 19.6967,
    lng: 72.7699,
    departments: ["General Medicine", "Maternal Health & Delivery", "Pediatrics", "Malaria & Dengue Clinic", "Emergency 24/7"],
    emergencyAvailable: true,
    ayushmanBharat: true,
    opdTimings: "08:30 AM - 02:30 PM (24/7 Emergency)",
    receptionistPhone: "+91 98765 01007",
    receptionistEmail: "reception.palghar@aarogya.ai",
    status: "ACTIVE",
    totalBeds: 120,
    occupiedBeds: 92,
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
    lat: 19.2530,
    lng: 73.3980,
    departments: ["General Medicine", "Snakebite & Poisoning Unit", "Pediatrics", "Maternity & Delivery", "Emergency 24/7"],
    emergencyAvailable: true,
    ayushmanBharat: true,
    opdTimings: "08:00 AM - 02:00 PM (24/7 Casualty)",
    receptionistPhone: "+91 98765 01008",
    receptionistEmail: "reception.murbad@aarogya.ai",
    status: "ACTIVE",
    totalBeds: 80,
    occupiedBeds: 54,
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
    lat: 19.9056,
    lng: 73.2323,
    departments: ["General Medicine", "Malnutrition Care Unit (NRC)", "Maternal Health", "Pediatrics", "Emergency 24/7"],
    emergencyAvailable: true,
    ayushmanBharat: true,
    opdTimings: "08:30 AM - 02:00 PM (24/7 Casualty)",
    receptionistPhone: "+91 98765 01009",
    receptionistEmail: "reception.jawhar@aarogya.ai",
    status: "ACTIVE",
    totalBeds: 100,
    occupiedBeds: 78,
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
    lat: 19.0433,
    lng: 73.0163,
    departments: ["Emergency & Trauma 24/7", "Cardiology", "Neurology", "General Medicine", "Pediatrics", "Orthopedics", "Oncology", "Diagnostic Lab"],
    emergencyAvailable: true,
    ayushmanBharat: true,
    opdTimings: "08:00 AM - 02:00 PM / 04:00 PM - 08:30 PM (24/7 Casualty)",
    receptionistPhone: "+91 98765 01017",
    receptionistEmail: "reception.nerul@aarogya.ai",
    status: "ACTIVE",
    totalBeds: 1500,
    occupiedBeds: 1180,
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
    lat: 19.0473,
    lng: 73.0699,
    departments: ["Emergency 24/7", "Oncology & Radiation", "Cardiology", "General Medicine", "Gastroenterology", "Critical Care ICU", "Diagnostic Lab"],
    emergencyAvailable: true,
    ayushmanBharat: true,
    opdTimings: "08:30 AM - 02:00 PM / 03:30 PM - 07:30 PM (24/7 Casualty)",
    receptionistPhone: "+91 98765 01018",
    receptionistEmail: "reception.kharghar@aarogya.ai",
    status: "ACTIVE",
    totalBeds: 750,
    occupiedBeds: 580,
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
    lat: 19.2183,
    lng: 73.0867,
    departments: ["Cardiology", "General Medicine", "Neurology", "Orthopedics", "Emergency 24/7", "Advanced ICU"],
    emergencyAvailable: true,
    ayushmanBharat: true,
    opdTimings: "09:00 AM - 09:00 PM (24/7 Casualty)",
    receptionistPhone: "+91 98765 01005",
    receptionistEmail: "reception.citycare@aarogya.ai",
    status: "ACTIVE",
    totalBeds: 150,
    occupiedBeds: 110,
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
    lat: 30.3752,
    lng: 76.1528,
    departments: ["General Medicine", "Cardiology", "Pediatrics", "Orthopedics", "Emergency 24/7", "Diagnostic Lab"],
    emergencyAvailable: true,
    ayushmanBharat: true,
    opdTimings: "08:30 AM - 01:30 PM / 03:30 PM - 06:30 PM",
    receptionistPhone: "+91 98765 01001",
    receptionistEmail: "reception.nabha@aarogya.ai",
    status: "ACTIVE",
    totalBeds: 120,
    occupiedBeds: 85,
    catchmentVillages: ["Alhoran", "Rohti Chhanna", "Bhadson", "Dhingi"],
  },
  {
    facilityId: "HOSP-PTL-009",
    name: "Rajindra Multi-Specialty Government Hospital",
    shortName: "Rajindra Hospital Patiala",
    type: "Govt Civil Hospital",
    location: "Sangrur Road, Patiala",
    city: "Patiala",
    state: "Punjab",
    address: "Medical College Campus, Sangrur Road, Patiala, Punjab 147001",
    phone: "+91 175 2212018",
    lat: 30.3398,
    lng: 76.3869,
    departments: ["General Medicine", "Cardiology", "Neurology", "Pediatrics", "Orthopedics", "Emergency 24/7", "Dialysis Unit"],
    emergencyAvailable: true,
    ayushmanBharat: true,
    opdTimings: "08:00 AM - 02:00 PM / 04:00 PM - 08:00 PM",
    receptionistPhone: "+91 98765 01002",
    receptionistEmail: "reception.patiala@aarogya.ai",
    status: "ACTIVE",
    totalBeds: 900,
    occupiedBeds: 720,
    catchmentVillages: ["Patiala Rural", "Sanaur", "Bahadurgarh", "Samana"],
  },
  {
    facilityId: "HOSP-KSR-010",
    name: "Kesri Primary Health Center & Rural Clinic",
    shortName: "PHC Kesri",
    type: "Primary Health Center (PHC)",
    location: "Village Kesri, Nabha",
    city: "Kesri",
    state: "Punjab",
    address: "Main Village Square, Kesri, Punjab 147201",
    phone: "+91 1765 240011",
    lat: 30.4011,
    lng: 76.1923,
    departments: ["General Medicine", "Maternal & Child Health", "Immunization", "Emergency 24/7"],
    emergencyAvailable: true,
    ayushmanBharat: true,
    opdTimings: "09:00 AM - 03:00 PM",
    receptionistPhone: "+91 98765 01003",
    receptionistEmail: "phc.kesri@aarogya.ai",
    status: "ACTIVE",
    totalBeds: 25,
    occupiedBeds: 14,
    catchmentVillages: ["Kesri Gaon", "Kot Khurd", "Dula", "Laloda"],
  }
];

// Haversine formula to compute distance in km
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
}

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const city = searchParams.get("city");
    const query = searchParams.get("q");
    const latStr = searchParams.get("lat");
    const lngStr = searchParams.get("lng");

    const userLat = latStr ? parseFloat(latStr) : null;
    const userLng = lngStr ? parseFloat(lngStr) : null;

    // Auto-seed default facilities only if empty
    const count = await Facility.estimatedDocumentCount();
    if (count === 0) {
      await Facility.insertMany(DEFAULT_FACILITIES);
    }

    const filter: Record<string, any> = { status: "ACTIVE" };
    if (city && city !== "ALL") {
      filter.city = new RegExp(`^${city}`, "i");
    }
    if (query) {
      filter.$or = [
        { name: new RegExp(query, "i") },
        { shortName: new RegExp(query, "i") },
        { location: new RegExp(query, "i") },
        { departments: new RegExp(query, "i") },
      ];
    }

    let facilities = await Facility.find(filter).lean();

    // Map distances
    const processedFacilities = facilities.map((f: any) => {
      let distanceKm = 2.4;
      if (userLat !== null && userLng !== null && !isNaN(userLat) && !isNaN(userLng)) {
        distanceKm = calculateDistanceKm(userLat, userLng, f.lat, f.lng);
      } else {
        if (city && f.city?.toLowerCase() === city.toLowerCase()) {
          distanceKm = Number((1.2 + (f.lat % 1) * 2.5).toFixed(1));
        } else {
          distanceKm = Number((4.5 + (f.lat % 1) * 7.5).toFixed(1));
        }
      }

      return {
        ...f,
        distanceKm,
        availableSlotsCount: Math.floor(6 + (f.lat % 1) * 8),
      };
    });

    // Sort closest first
    processedFacilities.sort((a, b) => a.distanceKm - b.distanceKm);

    return NextResponse.json({ facilities: processedFacilities });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch facilities" }, { status: 500 });
  }
}
