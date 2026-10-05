export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Doctor from "@/models/Doctor";
import { hashPassword } from "@/lib/auth";

export async function GET() {
  try {
    await dbConnect();
    // Exclude password hash from the response
    const doctors = await Doctor.find({}).select("-passwordHash").sort({ createdAt: -1 });
    return NextResponse.json({ doctors });
  } catch (error: any) {
    console.warn("Could not connect to MongoDB for doctors list, using fallback:", error.message);
    return NextResponse.json({
      doctors: [
        { _id: "doc-1", name: "Dr. S. Kulkarni", specialization: "Emergency & Trauma", hospital: "Lokmanya Tilak Municipal General Hospital (SION Hospital)" },
        { _id: "doc-2", name: "Dr. Aniruddh Joshi", specialization: "Cardiology", hospital: "Lokmanya Tilak Municipal General Hospital (SION Hospital)" },
        { _id: "doc-3", name: "Dr. Ramesh Sharma", specialization: "General Physician", hospital: "Kalyan Civil Hospital" },
        { _id: "doc-4", name: "Dr. Anjali Deshmukh", specialization: "Pediatrics & Maternal", hospital: "Palghar Rural Civil Hospital" },
        { _id: "doc-5", name: "Dr. Vasanth", specialization: "General Physician", hospital: "Nabha Civil Hospital" },
        { _id: "doc-6", name: "Dr. Allwin Nadar", specialization: "General Physician", hospital: "CityCare Hospital Dombivli" },
      ],
      isFallback: true
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, specialization, hospital } = await req.json();

    if (!name || !email || !password || !specialization || !hospital) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    }

    await dbConnect();

    // Check if doctor with this email already exists
    const existingDoctor = await Doctor.findOne({ email: email.toLowerCase().trim() });
    if (existingDoctor) {
      return NextResponse.json({ error: "A doctor with this email already exists." }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);

    const doctor = await Doctor.create({
      name,
      email: email.toLowerCase().trim(),
      passwordHash,
      specialization,
      hospital,
      role: "doctor"
    });

    return NextResponse.json({ message: "Doctor created successfully", doctor: { id: doctor._id, name, email } }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
