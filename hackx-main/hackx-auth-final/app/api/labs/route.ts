export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Lab from "@/models/Lab";

const DEFAULT_LABS = [
  {
    labId: "LAB-KLY-001",
    name: "ABC Diagnostic Center",
    phone: "9876504001",
    password: "lab123",
    address: "Station Road, Near Civil Hospital",
    city: "Kalyan",
    district: "Thane",
    pincode: "421301",
    services: [
      "Complete Blood Count (CBC)",
      "Blood Sugar (Fasting)",
      "Blood Sugar (Random)",
      "HbA1c (Glycated Hemoglobin)",
      "Lipid Profile",
      "Liver Function Test (LFT)",
      "Kidney Function Test (KFT)",
      "Urine Routine & Microscopic",
      "Thyroid Profile (T3, T4, TSH)",
      "Malaria Rapid Test",
      "Dengue NS1 Antigen",
      "Typhoid (Widal Test)",
    ],
    workingHours: "07:30 AM - 08:30 PM",
    status: "ACTIVE",
    isVerified: true,
  },
  {
    labId: "LAB-DMB-002",
    name: "CityCare Pathology & Diagnostic Lab",
    phone: "9876504002",
    password: "lab123",
    address: "Manpada Road, Opp. Central Plaza",
    city: "Dombivli",
    district: "Thane",
    pincode: "421201",
    services: [
      "Complete Blood Count (CBC)",
      "Blood Sugar (Fasting)",
      "Blood Sugar (Random)",
      "HbA1c (Glycated Hemoglobin)",
      "Lipid Profile",
      "Liver Function Test (LFT)",
      "Kidney Function Test (KFT)",
      "Thyroid Profile (T3, T4, TSH)",
      "Urine Routine & Microscopic",
    ],
    workingHours: "08:00 AM - 09:00 PM",
    status: "ACTIVE",
    isVerified: true,
  },
  {
    labId: "LAB-NBH-003",
    name: "Government Sub-District Diagnostic Centre",
    phone: "9876504003",
    password: "lab123",
    address: "Civil Hospital Campus, Nabha Road",
    city: "Nabha",
    district: "Patiala",
    pincode: "147201",
    services: [
      "Complete Blood Count (CBC)",
      "Blood Sugar (Fasting)",
      "Blood Sugar (Random)",
      "HbA1c (Glycated Hemoglobin)",
      "Malaria Rapid Test",
      "Dengue NS1 Antigen",
      "Typhoid (Widal Test)",
      "Urine Routine & Microscopic",
    ],
    workingHours: "08:00 AM - 04:00 PM",
    status: "ACTIVE",
    isVerified: true,
  },
  {
    labId: "LAB-APX-004",
    name: "Apex Advanced Molecular Lab",
    phone: "9876504004",
    password: "lab123",
    address: "Main Bypass Circle, Medical Square",
    city: "Patiala",
    district: "Patiala",
    pincode: "147001",
    services: [
      "Complete Blood Count (CBC)",
      "Blood Sugar (Fasting)",
      "HbA1c (Glycated Hemoglobin)",
      "Lipid Profile",
      "Liver Function Test (LFT)",
      "Kidney Function Test (KFT)",
      "Thyroid Profile (T3, T4, TSH)",
      "Vitamin D & B12",
      "Serum Creatinine",
    ],
    workingHours: "24 Hours (Emergency Available)",
    status: "ACTIVE",
    isVerified: true,
  },
];

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    let labs = await Lab.find({ status: "ACTIVE" }).sort({ name: 1 });

    // Auto-seed if collection is empty
    if (!labs || labs.length === 0) {
      await Lab.insertMany(DEFAULT_LABS);
      labs = await Lab.find({ status: "ACTIVE" }).sort({ name: 1 });
    }

    return NextResponse.json({ labs });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch labs" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();

    if (!body.name || !body.phone || !body.city) {
      return NextResponse.json({ error: "Name, phone, and city are required." }, { status: 400 });
    }

    const labId = body.labId || `LAB-${Date.now().toString().slice(-6)}`;
    const lab = await Lab.create({
      ...body,
      labId,
    });

    return NextResponse.json({ lab }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to create lab" }, { status: 500 });
  }
}
