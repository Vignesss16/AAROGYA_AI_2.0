export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import LabOrder from "@/models/LabOrder";
import Lab from "@/models/Lab";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const url = req.nextUrl;
    const consultationId = url.searchParams.get("consultationId");
    const patientPhone = url.searchParams.get("patientPhone");
    const doctorId = url.searchParams.get("doctorId");
    const labId = url.searchParams.get("labId");
    const orderId = url.searchParams.get("orderId");
    const status = url.searchParams.get("status");

    const query: Record<string, any> = {};

    if (orderId) query.orderId = orderId;
    if (consultationId) query.consultationId = consultationId;
    if (doctorId) query.doctorId = doctorId;
    if (labId) query.labId = labId;
    if (status && status !== "ALL") query.status = status;

    if (patientPhone) {
      const cleanDigits = patientPhone.replace(/\D/g, "");
      const cleanName = patientPhone.trim();
      const orClauses: any[] = [
        { patientPhone: patientPhone },
        { patientName: cleanName },
      ];
      if (cleanDigits.length >= 6) {
        orClauses.push({ patientPhone: { $regex: cleanDigits, $options: "i" } });
        if (cleanDigits.length >= 10) {
          orClauses.push({ patientPhone: { $regex: cleanDigits.slice(-10), $options: "i" } });
        }
      }
      if (cleanName.length >= 2) {
        orClauses.push({ patientName: { $regex: cleanName, $options: "i" } });
      }
      query.$or = orClauses;
    }

    const orders = await LabOrder.find(query).sort({ createdAt: -1 }).lean();

    return NextResponse.json(
      { orders },
      { headers: { "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate" } }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch lab orders" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();

    const {
      consultationId,
      patientPhone,
      patientName,
      doctorId,
      doctorName,
      labId,
      labName,
      tests,
      priority,
      doctorInstructions,
    } = body;

    if (!consultationId || !patientPhone || !patientName || !labId || !tests || tests.length === 0) {
      return NextResponse.json(
        { error: "consultationId, patient details, labId, and at least 1 test are required." },
        { status: 400 }
      );
    }

    // Generate readable order ID
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderId = `LAB-${new Date().getFullYear()}-${randomSuffix}`;

    // Lookup lab name if not provided
    let finalLabName = labName;
    if (!finalLabName) {
      const lab = await Lab.findOne({ labId });
      finalLabName = lab?.name || "Registered Diagnostic Lab";
    }

    const newOrder = await LabOrder.create({
      orderId,
      consultationId,
      patientPhone,
      patientName,
      doctorId: doctorId || "",
      doctorName: doctorName || "Consulting Doctor",
      labId,
      labName: finalLabName,
      tests,
      priority: priority || "NORMAL",
      doctorInstructions: doctorInstructions || "",
      status: "SENT_TO_LAB",
    });

    return NextResponse.json({ order: newOrder }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to create lab order" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();
    const { orderId, _id, status, rejectionReason, appointmentSlot, reportUrl, reportFileName, reportData, doctorReviewNotes } = body;

    const filter = orderId ? { orderId } : _id ? { _id } : null;
    if (!filter) {
      return NextResponse.json({ error: "orderId or _id is required to update order" }, { status: 400 });
    }

    const order = await LabOrder.findOne(filter);
    if (!order) {
      return NextResponse.json({ error: "Lab order not found" }, { status: 404 });
    }

    if (status) {
      order.status = status;
    }

    if (rejectionReason !== undefined) {
      order.rejectionReason = rejectionReason;
    }

    if (appointmentSlot !== undefined) {
      order.appointmentSlot = appointmentSlot;
      if (order.status === "LAB_ACCEPTED" || !order.status) {
        order.status = "APPOINTMENT_CONFIRMED";
      }
    }

    if (status === "SAMPLE_COLLECTED") {
      order.sampleCollectedAt = new Date();
    }

    if (reportUrl) {
      order.reportUrl = reportUrl;
      order.reportFileName = reportFileName || "diagnostic_report.pdf";
      order.uploadedAt = new Date();
      order.status = "REPORT_UPLOADED";
    }

    if (reportData) {
      order.reportData = reportData;
    }

    if (doctorReviewNotes !== undefined) {
      order.doctorReviewNotes = doctorReviewNotes;
      order.reviewedAt = new Date();
      order.status = "DOCTOR_REVIEWED";
    }

    await order.save();

    return NextResponse.json({ order, success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update lab order" }, { status: 500 });
  }
}
