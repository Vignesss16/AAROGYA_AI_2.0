export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Consultation from "@/models/Consultation";
import { pusher } from "@/lib/pusher-server";

function normalizeUrgency(val?: string): "RED" | "YELLOW" | "GREEN" {
  if (!val) return "GREEN";
  const upper = String(val).toUpperCase();
  if (upper.includes("RED") || upper.includes("CRITICAL") || upper.includes("HIGH")) return "RED";
  if (upper.includes("YELLOW") || upper.includes("URGENT") || upper.includes("MODERATE")) return "YELLOW";
  return "GREEN";
}

function inferFacilityId(facilityId?: string, hospital?: string): string {
  if (facilityId && facilityId.trim()) return facilityId.trim();
  const h = (hospital || "").toLowerCase();
  if (h.includes("sion") || h.includes("lokmanya")) return "HOSP-SION-001";
  if (h.includes("kalyan")) return "HOSP-KLY-002";
  if (h.includes("kalwa") || h.includes("csmh")) return "HOSP-KLW-003";
  if (h.includes("palghar")) return "HOSP-PLG-004";
  if (h.includes("murbad")) return "HOSP-MRB-005";
  if (h.includes("jawhar")) return "HOSP-JWH-006";
  if (h.includes("nerul") || h.includes("dy patil") || h.includes("d.y. patil")) return "HOSP-NERUL-007";
  if (h.includes("kharghar") || h.includes("actrec") || h.includes("tata")) return "HOSP-KHAR-008";
  if (h.includes("citycare") || h.includes("dombivli")) return "HOSP-DMB-009";
  if (h.includes("nabha")) return "HOSP-NBH-008";
  if (h.includes("patiala") || h.includes("rajindra")) return "HOSP-PTL-009";
  if (h.includes("kesri")) return "HOSP-KSR-010";
  return "HOSP-SION-001";
}

const INITIAL_SAMPLE_PATIENTS = [
  {
    patientName: "Suresh Patil",
    patientPhone: "+91 98201 54321",
    age: 48,
    gender: "M",
    symptoms: ["Chest heaviness", "shortness of breath"],
    urgency: "RED",
    department: "Cardiology",
    doctorName: "Dr. Aniruddh Joshi",
    consultationRoom: "Room 104 (Cardiac OPD)",
    slotTime: "Immediate Priority",
    hospital: "Lokmanya Tilak Municipal General Hospital (SION Hospital)",
    facilityId: "HOSP-SION-001",
    source: "Apex Trauma Triage",
    receptionistStatus: "CONFIRMED",
    checkInStatus: "ARRIVED",
    status: "confirmed",
    tokenNumber: "OPD-SION-101",
    queueNo: "OPD-SION-101",
    triageResult: { urgency: "RED", department: "Cardiology", summary: "High risk cardiac triage" },
  },
  {
    patientName: "Meenakshi Kadam",
    patientPhone: "+91 98192 65432",
    age: 34,
    gender: "F",
    symptoms: ["High fever 103F", "severe body pain"],
    urgency: "YELLOW",
    department: "General Medicine",
    doctorName: "Dr. Vilas Patil",
    consultationRoom: "Room 102 (General OPD)",
    slotTime: "10:30 AM",
    hospital: "Lokmanya Tilak Municipal General Hospital (SION Hospital)",
    facilityId: "HOSP-SION-001",
    source: "Reception Desk",
    receptionistStatus: "CONFIRMED",
    checkInStatus: "ARRIVED",
    status: "confirmed",
    tokenNumber: "OPD-SION-102",
    queueNo: "OPD-SION-102",
    triageResult: { urgency: "YELLOW", department: "General Medicine", summary: "Moderate febrile illness" },
  },
  {
    patientName: "Santosh Yadav",
    patientPhone: "+91 98670 12345",
    age: 55,
    gender: "M",
    symptoms: ["Diabetes routine checkup", "insulin refill"],
    urgency: "GREEN",
    department: "General Medicine",
    doctorName: "Dr. Vilas Patil",
    consultationRoom: "Room 102 (General OPD)",
    slotTime: "11:15 AM",
    hospital: "Lokmanya Tilak Municipal General Hospital (SION Hospital)",
    facilityId: "HOSP-SION-001",
    source: "OPD Walk-in",
    receptionistStatus: "CONFIRMED",
    status: "confirmed",
    tokenNumber: "OPD-SION-103",
    queueNo: "OPD-SION-103",
    triageResult: { urgency: "GREEN", department: "General Medicine", summary: "Routine metabolic follow-up" },
  },
  {
    patientName: "Aarav Sharma",
    patientPhone: "+91 98331 45678",
    age: 6,
    gender: "M",
    symptoms: ["Acute wheezing", "persistent cough"],
    urgency: "YELLOW",
    department: "Pediatrics",
    doctorName: "Dr. Priya Nair",
    consultationRoom: "Room 201 (Child Health)",
    slotTime: "11:45 AM",
    hospital: "Lokmanya Tilak Municipal General Hospital (SION Hospital)",
    facilityId: "HOSP-SION-001",
    source: "Pediatric Emergency Desk",
    receptionistStatus: "PENDING_CONFIRMATION",
    status: "pending",
    tokenNumber: "OPD-SION-104",
    queueNo: "OPD-SION-104",
    triageResult: { urgency: "YELLOW", department: "Pediatrics", summary: "Pediatric respiratory wheeze" },
  },
  {
    patientName: "Sunita Kamble",
    patientPhone: "+91 98765 11001",
    age: 29,
    gender: "F",
    symptoms: ["Antenatal 3rd trimester routine check"],
    urgency: "GREEN",
    department: "Maternal Health",
    doctorName: "Dr. Priya Nair",
    consultationRoom: "Room 201 (Maternal Care)",
    slotTime: "12:15 PM",
    hospital: "Lokmanya Tilak Municipal General Hospital (SION Hospital)",
    facilityId: "HOSP-SION-001",
    source: "ASHA Field Referral",
    receptionistStatus: "CONFIRMED",
    status: "confirmed",
    tokenNumber: "OPD-SION-105",
    queueNo: "OPD-SION-105",
    triageResult: { urgency: "GREEN", department: "Maternal Health", summary: "Routine ANC checkup" },
  }
];

export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get("status") || "pending";
  const id = req.nextUrl.searchParams.get("id");
  const doctorId = req.nextUrl.searchParams.get("doctorId");
  const facilityId = req.nextUrl.searchParams.get("facilityId");
  try {
    await dbConnect();

    // Auto-seed initial queue patients if database is empty
    const count = await Consultation.estimatedDocumentCount();
    if (count === 0) {
      try {
        await Consultation.insertMany(INITIAL_SAMPLE_PATIENTS);
      } catch {}
    }

    // Fetch single consultation by ID
    if (id) {
      const consultation = await Consultation.findById(id).lean();
      if (!consultation) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json(
        { consultation },
        { headers: { "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate" } }
      );
    }

    // Fetch consultations based on status and doctorId
    const query: any = status === "all" ? {} : { status };
    if (doctorId) {
      query.doctorId = doctorId;
    }
    if (facilityId && facilityId !== "ALL") {
      query.facilityId = facilityId;
    }

    const raw = await Consultation.find(query).sort({ createdAt: -1 }).lean();
    const priority: Record<string, number> = { RED: 0, YELLOW: 1, GREEN: 2 };
    const sorted = (raw || []).sort((a: any, b: any) => {
      const pDiff = (priority[a.urgency] ?? 3) - (priority[b.urgency] ?? 3);
      if (pDiff !== 0) return pDiff;
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });
    return NextResponse.json(
      { consultations: sorted },
      { headers: { "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate" } }
    );
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    await dbConnect();

    const normalizedUrgency = normalizeUrgency(body.urgency);
    const resolvedFacilityId = inferFacilityId(body.facilityId, body.hospital);
    const token = body.tokenNumber || body.queueNo || `OPD-${Math.floor(100 + Math.random() * 899)}`;

    const payload = {
      ...body,
      urgency: normalizedUrgency,
      facilityId: resolvedFacilityId,
      tokenNumber: token,
      queueNo: token,
      status: body.status || "pending",
      receptionistStatus: body.receptionistStatus || (body.bookingType === "HOSPITAL_RECEPTIONIST_ASSISTED" ? "PENDING_CONFIRMATION" : "CONFIRMED"),
    };

    const consultation = await Consultation.create(payload);

    try {
      await pusher.trigger("hospital-channel", "new-appointment", consultation);
    } catch {}

    return NextResponse.json({ consultation }, { status: 201 });
  } catch (err) {
    console.error("Failed to create consultation:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      id,
      status,
      doctorNotes,
      prescription,
      doctorName,
      urgency,
      receptionistStatus,
      checkInStatus,
      arrivedAt,
      consultationRoom,
      verificationNotes,
      verificationStatus,
      slot,
      facilityId,
      department,
      estimatedConfirmationTime,
    } = body;

    await dbConnect();
    const update: Record<string, unknown> = {};
    if (status) update.status = status;
    if (doctorNotes !== undefined) update.doctorNotes = doctorNotes;
    if (prescription !== undefined) update.prescription = prescription;
    if (doctorName !== undefined) update.doctorName = doctorName;
    if (urgency !== undefined) update.urgency = normalizeUrgency(urgency);
    if (receptionistStatus !== undefined) update.receptionistStatus = receptionistStatus;
    if (checkInStatus !== undefined) update.checkInStatus = checkInStatus;
    if (arrivedAt !== undefined) update.arrivedAt = arrivedAt;
    if (consultationRoom !== undefined) update.consultationRoom = consultationRoom;
    if (verificationNotes !== undefined) update.verificationNotes = verificationNotes;
    if (verificationStatus !== undefined) update.verificationStatus = verificationStatus;
    if (slot !== undefined) update.slot = slot;
    if (facilityId !== undefined) update.facilityId = facilityId;
    if (department !== undefined) update.department = department;
    if (estimatedConfirmationTime !== undefined) update.estimatedConfirmationTime = estimatedConfirmationTime;

    const consultation = await Consultation.findByIdAndUpdate(id, update, { new: true });
    if (!consultation) return NextResponse.json({ error: "Not found" }, { status: 404 });

    try {
      await pusher.trigger("hospital-channel", "appointment-updated", consultation);
    } catch {}

    return NextResponse.json({ consultation });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
