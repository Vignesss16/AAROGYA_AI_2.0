export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { Referral } from "@/models/index";
import Consultation from "@/models/Consultation";
import { pusher } from "@/lib/pusher-server";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const targetFacility = req.nextUrl.searchParams.get("targetFacility");
    const sourceFacility = req.nextUrl.searchParams.get("sourceFacility");
    const doctorId = req.nextUrl.searchParams.get("doctorId");
    const doctorName = req.nextUrl.searchParams.get("doctorName");
    const referralType = req.nextUrl.searchParams.get("referralType");
    const status = req.nextUrl.searchParams.get("status");

    let query: any = {};
    if (targetFacility && targetFacility !== "all") query.targetFacility = targetFacility;
    if (sourceFacility && sourceFacility !== "all") query.sourceFacility = sourceFacility;
    if (referralType && referralType !== "all") query.referralType = referralType;
    if (status && status !== "all") query.status = status;

    if (doctorId || doctorName) {
      const orConditions: any[] = [];
      if (doctorId) {
        orConditions.push({ referredByDoctorId: doctorId });
      }
      if (doctorName) {
        orConditions.push({ referredByDoctorName: { $regex: doctorName, $options: "i" } });
        orConditions.push({ targetDoctorName: { $regex: doctorName, $options: "i" } });
      }
      if (orConditions.length > 0) {
        query.$or = orConditions;
      }
    }

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
    const {
      patientPhone,
      patientName,
      consultationId,
      referredByDoctorId,
      referredByDoctorName,
      sourceFacility,
      targetFacility,
      targetDepartment,
      targetDoctorName,
      referralType,
      scheduledDate,
      scheduledSlot,
      opdToken,
      reasonForReferral,
      clinicalNotes,
      urgency,
    } = body;

    if (!patientPhone || !patientName || !targetFacility || !reasonForReferral) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const generatedToken = opdToken || `OPD-${Math.floor(1000 + Math.random() * 9000)}`;

    const referral = await Referral.create({
      patientPhone,
      patientName,
      consultationId: consultationId || "N/A",
      referredByDoctorId: referredByDoctorId || "doctor",
      referredByDoctorName: referredByDoctorName || "Consulting Doctor",
      sourceFacility: sourceFacility || "Online Telemedicine Desk",
      targetFacility,
      targetDepartment: targetDepartment || "General Medicine",
      targetDoctorName: targetDoctorName || "",
      referralType: referralType || "SPECIALIST_FACILITY_TRANSFER",
      scheduledDate: scheduledDate || new Date().toISOString().split("T")[0],
      scheduledSlot: scheduledSlot || "Morning 10:00 AM - 01:00 PM",
      opdToken: generatedToken,
      reasonForReferral,
      clinicalNotes: clinicalNotes || "",
      urgency: urgency || "YELLOW",
      status: "pending",
    });

    // Also auto-sync an incoming Consultation entry into the target hospital's physical queue
    try {
      const hospitalConsultation = await Consultation.create({
        patientPhone,
        patientName,
        urgency: urgency || "YELLOW",
        department: targetDepartment || "General Medicine",
        doctorName: targetDoctorName || referredByDoctorName || "OPD Duty Doctor",
        hospital: targetFacility,
        source: referralType === "IN_PERSON_FOLLOWUP" ? "Doctor In-Person Physical Referral" : "Specialist Tertiary Transfer",
        receptionistStatus: "CONFIRMED",
        checkInStatus: "PENDING_ARRIVAL",
        status: "confirmed",
        tokenNumber: generatedToken,
        queueNo: generatedToken,
        slot: scheduledSlot || "Scheduled OPD",
        doctorNotes: `Referred by ${referredByDoctorName}: ${reasonForReferral}. Clinical Notes: ${clinicalNotes || "None"}`,
        triageResult: { urgency: urgency || "YELLOW", summary: reasonForReferral, department: targetDepartment || "General Medicine" },
        bookingType: "HOSPITAL_RECEPTIONIST_ASSISTED",
        symptoms: [reasonForReferral || "Clinical Physical Referral"],
      });
      try {
        await pusher.trigger("hospital-channel", "new-appointment", hospitalConsultation);
      } catch {}
    } catch (syncErr) {
      console.warn("Could not sync referral to Consultation queue:", syncErr);
    }

    // Notify the target facility command center
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
    const { id, status, clinicalNotes, scheduledDate, scheduledSlot } = body;

    if (!id || !status) {
      return NextResponse.json({ error: "Missing id or status" }, { status: 400 });
    }

    const updateFields: any = { status };
    if (clinicalNotes) updateFields.clinicalNotes = clinicalNotes;
    if (scheduledDate) updateFields.scheduledDate = scheduledDate;
    if (scheduledSlot) updateFields.scheduledSlot = scheduledSlot;

    const referral = await Referral.findByIdAndUpdate(id, { $set: updateFields }, { new: true });

    try {
      await pusher.trigger("hospital-channel", "referral-updated", referral);
    } catch (pushErr) {
      console.error("Pusher referral update error:", pushErr);
    }

    return NextResponse.json({ referral });
  } catch (err: any) {
    return NextResponse.json({ error: "DB error: " + err.message }, { status: 500 });
  }
}
