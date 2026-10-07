export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Doctor from "@/models/Doctor";
import { hashPassword } from "@/lib/auth";

const DEFAULT_DOCTORS_SEED = [
  {
    name: "Dr. Sandeep Kadam",
    email: "sandeep.kadam@dypatil.edu",
    specialization: "Emergency & Critical Care Lead",
    hospital: "Dr. D. Y. Patil Multi-Specialty Hospital (Nerul)",
    role: "doctor",
  },
  {
    name: "Dr. Meenal Thakur",
    email: "meenal.thakur@dypatil.edu",
    specialization: "Senior Cardiologist",
    hospital: "Dr. D. Y. Patil Multi-Specialty Hospital (Nerul)",
    role: "doctor",
  },
  {
    name: "Dr. Rajesh Gaikwad",
    email: "rajesh.gaikwad@dypatil.edu",
    specialization: "General Physician & Diabetologist",
    hospital: "Dr. D. Y. Patil Multi-Specialty Hospital (Nerul)",
    role: "doctor",
  },
  {
    name: "Dr. Alok Sharma",
    email: "alok.sharma@khargharhospital.org",
    specialization: "Oncology & Critical Care Lead",
    hospital: "Kharghar Super-Specialty Civil Hospital",
    role: "doctor",
  },
  {
    name: "Dr. Neha Bendre",
    email: "neha.bendre@khargharhospital.org",
    specialization: "Consultant Cardiologist",
    hospital: "Kharghar Super-Specialty Civil Hospital",
    role: "doctor",
  },
  {
    name: "Dr. Allwin Nadar",
    email: "allwin.nadar@aarogya.ai",
    specialization: "General Physician & Tele-Specialist",
    hospital: "CityCare Medical & SION Tele-Hub, Mumbai",
    role: "doctor",
  },
  {
    name: "Dr. Vasanth",
    email: "dr.vasanth@aarogya.ai",
    specialization: "General Physician & Rural Health Specialist",
    hospital: "Navi Mumbai Community Health & Teleconsult Center",
    role: "doctor",
  },
  {
    name: "Dr. Ramesh Sharma",
    email: "doctor@sehat.com",
    specialization: "Chief Medical Officer (Cardiology & General)",
    hospital: "Kalyan Sub-District Civil Hospital & Maharashtra Tele-OPD",
    role: "doctor",
  },
  {
    name: "Dr. S. Kulkarni",
    email: "s.kulkarni@sionhospital.org",
    specialization: "Head of Emergency & Trauma",
    hospital: "Lokmanya Tilak Municipal General Hospital (SION Hospital)",
    role: "doctor",
  },
  {
    name: "Dr. Aniruddh Joshi",
    email: "aniruddh.joshi@sionhospital.org",
    specialization: "Senior Cardiologist",
    hospital: "Lokmanya Tilak Municipal General Hospital (SION Hospital)",
    role: "doctor",
  },
];

export async function GET() {
  try {
    await dbConnect();

    // Auto-seed doctors into MongoDB if not present
    const defaultHash = await hashPassword("doctor123");
    for (const d of DEFAULT_DOCTORS_SEED) {
      await Doctor.updateOne(
        { email: d.email.toLowerCase().trim() },
        {
          $set: {
            name: d.name,
            specialization: d.specialization,
            hospital: d.hospital,
            role: "doctor",
            passwordHash: defaultHash,
          },
        },
        { upsert: true }
      );
    }

    // Exclude password hash from the response
    const doctors = await Doctor.find({}).select("-passwordHash").sort({ createdAt: -1 }).lean();
    return NextResponse.json(
      { doctors },
      { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
    );
  } catch (error: any) {
    console.warn("Could not connect to MongoDB for doctors list, using fallback:", error.message);
    return NextResponse.json({
      doctors: DEFAULT_DOCTORS_SEED.map((d, i) => ({ _id: `doc-${i + 1}`, ...d })),
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
