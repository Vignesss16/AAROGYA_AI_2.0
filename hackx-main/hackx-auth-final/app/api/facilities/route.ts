export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Facility from "@/models/Facility";

// Seed data representing regional hospitals like theatres in BookMyShow
const DEFAULT_FACILITIES = [
  {
    facilityId: "HOSP-NBH-001",
    name: "Nabha Civil Sub-Divisional Hospital",
    shortName: "Nabha Civil Hospital",
    type: "Govt Civil Hospital",
    location: "Civil Hospital Road, Nabha",
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
  },
  {
    facilityId: "HOSP-PTL-002",
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
  },
  {
    facilityId: "HOSP-KSR-003",
    name: "Kesri Primary Health Center & Community Clinic",
    shortName: "PHC Kesri",
    type: "Primary Health Center (PHC)",
    location: "Village Kesri, District Nabha",
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
  },
  {
    facilityId: "HOSP-KLY-004",
    name: "Kalyan District Super-Specialty Healthcare Center",
    shortName: "Kalyan Civil Hospital",
    type: "Govt Civil Hospital",
    location: "Kalyan West, Thane",
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
  },
  {
    facilityId: "HOSP-DMB-005",
    name: "CityCare Super-Specialty Medical Institute",
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
  },
  {
    facilityId: "HOSP-THN-006",
    name: "Thane Central District & Trauma Care Hospital",
    shortName: "Thane Civil Hospital",
    type: "Govt Civil Hospital",
    location: "Civil Hospital Road, Thane West",
    city: "Thane",
    state: "Maharashtra",
    address: "Tembi Naka, Thane West, Maharashtra 400601",
    phone: "+91 22 25422444",
    lat: 19.1970,
    lng: 72.9765,
    departments: ["Emergency & Trauma 24/7", "General Medicine", "Cardiology", "Pediatrics", "Burn Ward", "Diagnostic Lab"],
    emergencyAvailable: true,
    ayushmanBharat: true,
    opdTimings: "24/7 Emergency & Regular OPD 08:00 AM - 02:00 PM",
    receptionistPhone: "+91 98765 01006",
    receptionistEmail: "reception.thane@aarogya.ai",
    status: "ACTIVE",
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

    // Auto-seed default facilities if collection is empty
    for (const df of DEFAULT_FACILITIES) {
      await Facility.findOneAndUpdate(
        { facilityId: df.facilityId },
        { $setOnInsert: df },
        { upsert: true, new: true }
      );
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
        // Approximate distance based on city
        if (city && f.city?.toLowerCase() === city.toLowerCase()) {
          distanceKm = Number((1.2 + (f.lat % 1) * 3).toFixed(1));
        } else {
          distanceKm = Number((3.5 + (f.lat % 1) * 8).toFixed(1));
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
