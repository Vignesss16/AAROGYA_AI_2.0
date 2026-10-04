export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Consultation from "@/models/Consultation";

export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get("status") || "pending";
  const id = req.nextUrl.searchParams.get("id");
  const doctorId = req.nextUrl.searchParams.get("doctorId");
  try {
    await dbConnect();

    // Fetch single consultation by ID
    if (id) {
      const consultation = await Consultation.findById(id);
      if (!consultation) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json({ consultation });
    }

    // Fetch consultations based on status and doctorId
    const query: any = status === "all" ? {} : { status };
    if (doctorId) {
      query.doctorId = doctorId;
    }

    const raw = await Consultation.find(query).sort({ createdAt: -1 });
    const priority: Record<string, number> = { RED: 0, YELLOW: 1, GREEN: 2 };
    const sorted = raw.sort((a, b) => (priority[a.urgency] ?? 3) - (priority[b.urgency] ?? 3));
    return NextResponse.json({ consultations: sorted });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  try {
    await dbConnect();
    const consultation = await Consultation.create(body);
    return NextResponse.json({ consultation }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const {
    id,
    status,
    doctorNotes,
    prescription,
    doctorName,
    urgency,
    receptionistStatus,
    slot,
    facilityId,
    department,
    estimatedConfirmationTime,
  } = body;
  try {
    await dbConnect();
    const update: Record<string, unknown> = {};
    if (status) update.status = status;
    if (doctorNotes !== undefined) update.doctorNotes = doctorNotes;
    if (prescription !== undefined) update.prescription = prescription;
    if (doctorName !== undefined) update.doctorName = doctorName;
    if (urgency !== undefined) update.urgency = urgency;
    if (receptionistStatus !== undefined) update.receptionistStatus = receptionistStatus;
    if (slot !== undefined) update.slot = slot;
    if (facilityId !== undefined) update.facilityId = facilityId;
    if (department !== undefined) update.department = department;
    if (estimatedConfirmationTime !== undefined) update.estimatedConfirmationTime = estimatedConfirmationTime;

    const consultation = await Consultation.findByIdAndUpdate(id, update, { new: true });
    if (!consultation) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ consultation });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
