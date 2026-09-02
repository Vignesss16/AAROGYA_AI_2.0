export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { Referral } from "@/models/index";
import { pusher } from "@/lib/pusher-server";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const targetFacility = req.nextUrl.searchParams.get("targetFacility");
    const sourceFacility = req.nextUrl.searchParams.get("sourceFacility");
    const status = req.nextUrl.searchParams.get("status");

    let query: any = {};
    if (targetFacility) query.targetFacility = targetFacility;
    if (sourceFacility) query.sourceFacility = sourceFacility;
    if (status && status !== "all") query.status = status;

    const referrals = await Referral.find(query).sort({ createdAt: -1 });
    return NextResponse.json({ referrals });
  } catch (err: any) {
    return NextResponse.json({ error: "DB error: " + err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();
    const { patientPhone, patientName, consultationId, referredByDoctorId, referredByDoctorName, sourceFacility, targetFacility, reasonForReferral, urgency } = body;

    if (!patientPhone || !patientName || !targetFacility || !reasonForReferral) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const referral = await Referral.create({
      patientPhone,
      patientName,
      consultationId: consultationId || "N/A",
      referredByDoctorId,
      referredByDoctorName,
      sourceFacility,
      targetFacility,
      reasonForReferral,
      urgency: urgency || "YELLOW",
      status: "pending"
    });

    // Notify the target facility (e.g. District Hospital)
    try {
      await pusher.trigger("hospital-channel", "new-referral", referral);
    } catch (pushErr) {
      console.error("Pusher referral error:", pushErr);
    }

    return NextResponse.json({ referral });
  } catch (err: any) {
    return NextResponse.json({ error: "DB error: " + err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: "Missing id or status" }, { status: 400 });
    }

    const referral = await Referral.findByIdAndUpdate(id, { $set: { status } }, { new: true });
    
    return NextResponse.json({ referral });
  } catch (err: any) {
    return NextResponse.json({ error: "DB error: " + err.message }, { status: 500 });
  }
}
