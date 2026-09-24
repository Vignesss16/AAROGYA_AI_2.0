export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Consultation from "@/models/Consultation";

export async function GET(req: NextRequest) {
  const identifier = req.nextUrl.searchParams.get("identifier");

  if (!identifier) {
    return NextResponse.json({ error: "identifier required" }, { status: 400 });
  }

  try {
    await dbConnect();

    // Match by phone OR by name (for Google users who may not have a phone)
    const consultations = await Consultation.find({
      $or: [
        { patientPhone: identifier },
        { patientName:  identifier },
      ],
    }).sort({ createdAt: -1 });

    return NextResponse.json({ consultations });
  } catch (err: any) {
    console.warn("Could not fetch remote consultations (offline or DB unreachable):", err.message);
    return NextResponse.json({ consultations: [], isOffline: true });
  }
}
