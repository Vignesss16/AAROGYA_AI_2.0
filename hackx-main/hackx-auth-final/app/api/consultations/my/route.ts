export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';
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

    const cleanDigits = identifier.replace(/\D/g, "");
    const cleanName = identifier.trim();

    const orConditions: any[] = [
      { patientPhone: identifier },
      { patientName: identifier },
    ];

    if (cleanDigits.length >= 6) {
      orConditions.push({ patientPhone: { $regex: new RegExp(cleanDigits, "i") } });
    }

    if (cleanName.length >= 2) {
      orConditions.push({ patientName: { $regex: new RegExp(cleanName, "i") } });
    }

    const consultations = await Consultation.find({ $or: orConditions })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(
      { consultations },
      { headers: { "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate" } }
    );
  } catch (err: any) {
    console.warn("Could not fetch remote consultations:", err.message);
    return NextResponse.json({ consultations: [], isOffline: true });
  }
}
