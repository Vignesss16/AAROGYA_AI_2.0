export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Doctor from "@/models/Doctor";
import { hashPassword } from "@/lib/auth";

const DEFAULT_DOCTORS_SEED = [
  // 🏥 D. Y. Patil Multi-Specialty Hospital (Nerul) - HOSP-NERUL-007
  {
    name: "Dr. Sandeep Kadam",
    email: "sandeep.kadam@dypatil.edu",
    password: "nerul@doc1",
    specialization: "Emergency & Critical Care Lead",
    hospital: "Dr. D. Y. Patil Multi-Specialty Hospital (Nerul)",
    facilityId: "HOSP-NERUL-007",
    room: "Room 101 (Casualty)",
    experience: "16 yrs",
    onDuty: true,
    phone: "+91 98200 11001",
    role: "doctor",
  },
  {
    name: "Dr. Meenal Thakur",
    email: "meenal.thakur@dypatil.edu",
    password: "nerul@doc2",
    specialization: "Senior Cardiologist",
    hospital: "Dr. D. Y. Patil Multi-Specialty Hospital (Nerul)",
    facilityId: "HOSP-NERUL-007",
    room: "Room 105 (Cardiac OPD)",
    experience: "12 yrs",
    onDuty: true,
    phone: "+91 98200 11002",
    role: "doctor",
  },
  {
    name: "Dr. Rajesh Gaikwad",
    email: "rajesh.gaikwad@dypatil.edu",
    password: "nerul@doc3",
    specialization: "General Physician & Diabetologist",
    hospital: "Dr. D. Y. Patil Multi-Specialty Hospital (Nerul)",
    facilityId: "HOSP-NERUL-007",
    room: "Room 102 (General OPD)",
    experience: "10 yrs",
    onDuty: true,
    phone: "+91 98200 11003",
    role: "doctor",
  },

  // 🏥 Kharghar Super-Specialty Civil Hospital - HOSP-KHAR-008
  {
    name: "Dr. Alok Sharma",
    email: "alok.sharma@khargharhospital.org",
    password: "kharghar@doc1",
    specialization: "Oncology & Critical Care Lead",
    hospital: "Kharghar Super-Specialty Civil Hospital",
    facilityId: "HOSP-KHAR-008",
    room: "Room 201 (Oncology)",
    experience: "17 yrs",
    onDuty: true,
    phone: "+91 98200 12001",
    role: "doctor",
  },
  {
    name: "Dr. Neha Bendre",
    email: "neha.bendre@khargharhospital.org",
    password: "kharghar@doc2",
    specialization: "Consultant Cardiologist",
    hospital: "Kharghar Super-Specialty Civil Hospital",
    facilityId: "HOSP-KHAR-008",
    room: "Room 104 (Cardiac OPD)",
    experience: "13 yrs",
    onDuty: true,
    phone: "+91 98200 12002",
    role: "doctor",
  },
  {
    name: "Dr. Sanjay Chavan",
    email: "sanjay.chavan@khargharhospital.org",
    password: "kharghar@doc3",
    specialization: "General Physician & Casualty Incharge",
    hospital: "Kharghar Super-Specialty Civil Hospital",
    facilityId: "HOSP-KHAR-008",
    room: "Room 102 (General OPD)",
    experience: "11 yrs",
    onDuty: true,
    phone: "+91 98200 12003",
    role: "doctor",
  },

  // 🏥 SION Hospital (LTMGH Mumbai) - HOSP-SION-001
  {
    name: "Dr. S. Kulkarni",
    email: "s.kulkarni@sionhospital.org",
    password: "sion@doc1",
    specialization: "Head of Emergency & Trauma",
    hospital: "Lokmanya Tilak Municipal General Hospital (SION Hospital)",
    facilityId: "HOSP-SION-001",
    room: "Room 101 (Casualty)",
    experience: "18 yrs",
    onDuty: true,
    phone: "+91 98200 13001",
    role: "doctor",
  },
  {
    name: "Dr. Aniruddh Joshi",
    email: "aniruddh.joshi@sionhospital.org",
    password: "sion@doc2",
    specialization: "Senior Cardiologist",
    hospital: "Lokmanya Tilak Municipal General Hospital (SION Hospital)",
    facilityId: "HOSP-SION-001",
    room: "Room 104 (Cardiac OPD)",
    experience: "14 yrs",
    onDuty: true,
    phone: "+91 98200 13002",
    role: "doctor",
  },
  {
    name: "Dr. Priya Nair",
    email: "priya.nair@sionhospital.org",
    password: "sion@doc3",
    specialization: "Consultant Pediatrician",
    hospital: "Lokmanya Tilak Municipal General Hospital (SION Hospital)",
    facilityId: "HOSP-SION-001",
    room: "Room 201 (Child Health)",
    experience: "11 yrs",
    onDuty: true,
    phone: "+91 98200 13003",
    role: "doctor",
  },

  // 🏥 CSMH Kalwa Hospital - HOSP-KLW-003
  {
    name: "Dr. Vilas Patil",
    email: "vilas.patil@kalwahospital.org",
    password: "kalwa@doc1",
    specialization: "Head of Casualty & General Medicine",
    hospital: "Chhatrapati Shivaji Maharaj Hospital & Medical College",
    facilityId: "HOSP-KLW-003",
    room: "Room 101 (Casualty)",
    experience: "15 yrs",
    onDuty: true,
    phone: "+91 98200 14001",
    role: "doctor",
  },
  {
    name: "Dr. Amit Vernekar",
    email: "amit.vernekar@kalwahospital.org",
    password: "kalwa@doc2",
    specialization: "Orthopedic & Trauma Surgeon",
    hospital: "Chhatrapati Shivaji Maharaj Hospital & Medical College",
    facilityId: "HOSP-KLW-003",
    room: "Room 106 (Trauma OT)",
    experience: "11 yrs",
    onDuty: true,
    phone: "+91 98200 14002",
    role: "doctor",
  },

  // 🏥 Kalyan Civil Hospital - HOSP-KLY-002
  {
    name: "Dr. Ramesh Sharma",
    email: "ramesh.sharma@kalyanhospital.org",
    password: "kalyan@doc1",
    specialization: "Chief Medical Officer",
    hospital: "Kalyan Sub-District & Rural Civil Hospital",
    facilityId: "HOSP-KLY-002",
    room: "Room 102 (General OPD)",
    experience: "16 yrs",
    onDuty: true,
    phone: "+91 98200 15001",
    role: "doctor",
  },
  {
    name: "Dr. Sneha Gokhale",
    email: "sneha.gokhale@kalyanhospital.org",
    password: "kalyan@doc2",
    specialization: "Consultant Gynecologist",
    hospital: "Kalyan Sub-District & Rural Civil Hospital",
    facilityId: "HOSP-KLY-002",
    room: "Room 105 (Maternity)",
    experience: "12 yrs",
    onDuty: true,
    phone: "+91 98200 15002",
    role: "doctor",
  },

  // 🏥 Palghar Rural Civil Hospital - HOSP-PLG-004
  {
    name: "Dr. Anjali Deshmukh",
    email: "anjali.deshmukh@palgharhospital.org",
    password: "palghar@doc1",
    specialization: "Rural Maternal & Child Specialist",
    hospital: "Palghar Tribal & Rural Sub-District Civil Hospital",
    facilityId: "HOSP-PLG-004",
    room: "Room 101 (Maternal Care)",
    experience: "13 yrs",
    onDuty: true,
    phone: "+91 98200 16001",
    role: "doctor",
  },
  {
    name: "Dr. Deepak Vaze",
    email: "deepak.vaze@palgharhospital.org",
    password: "palghar@doc2",
    specialization: "Malaria & Communicable Diseases Lead",
    hospital: "Palghar Tribal & Rural Sub-District Civil Hospital",
    facilityId: "HOSP-PLG-004",
    room: "Room 103 (Fever Clinic)",
    experience: "8 yrs",
    onDuty: true,
    phone: "+91 98200 16002",
    role: "doctor",
  },

  // 🏥 Murbad Rural Hospital - HOSP-MRB-005
  {
    name: "Dr. Sanjay Raut",
    email: "sanjay.raut@murbadhospital.org",
    password: "murbad@doc1",
    specialization: "Rural Emergency & Toxicology Lead",
    hospital: "Murbad Rural Sub-District & Referral Hospital",
    facilityId: "HOSP-MRB-005",
    room: "Casualty Ward 1",
    experience: "15 yrs",
    onDuty: true,
    phone: "+91 98200 17001",
    role: "doctor",
  },

  // 🏥 Jawhar Tribal Hospital - HOSP-JWH-006
  {
    name: "Dr. Hemant Mukne",
    email: "hemant.mukne@jawharhospital.org",
    password: "jawhar@doc1",
    specialization: "Tribal Malnutrition & Primary Health Lead",
    hospital: "Jawhar Sub-District Hospital & Tribal Health Center",
    facilityId: "HOSP-JWH-006",
    room: "Room 102 (NRC Unit)",
    experience: "11 yrs",
    onDuty: true,
    phone: "+91 98200 18001",
    role: "doctor",
  },

  // 🌐 Statewide Tele-Consultation Leads
  {
    name: "Dr. Allwin Nadar",
    email: "allwin.nadar@aarogya.ai",
    password: "allwin@doc1",
    specialization: "General Physician & Tele-Consultation Lead",
    hospital: "CityCare Medical & SION Tele-Hub, Mumbai",
    facilityId: "HOSP-DMB-009",
    room: "Room 102 (Tele-Hub)",
    experience: "10 yrs",
    onDuty: true,
    phone: "+91 98200 19001",
    role: "doctor",
  },
  {
    name: "Dr. Vasanth",
    email: "dr.vasanth@aarogya.ai",
    password: "vasanth@doc1",
    specialization: "General Physician & State Tele-Health Lead",
    hospital: "Navi Mumbai Community Health & Teleconsult Center",
    facilityId: "HOSP-NERUL-007",
    room: "Room 104 (Tele-Health)",
    experience: "8 yrs",
    onDuty: true,
    phone: "+91 98200 19002",
    role: "doctor",
  },
];

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const facilityId = searchParams.get("facilityId");
    const queryStr = searchParams.get("q");

    // Auto-seed all default doctors with both their individual password hash and fallback
    for (const d of DEFAULT_DOCTORS_SEED) {
      const passwordHash = await hashPassword(d.password || "doctor123");
      await Doctor.updateOne(
        { email: d.email.toLowerCase().trim() },
        {
          $set: {
            name: d.name,
            specialization: d.specialization,
            hospital: d.hospital,
            facilityId: d.facilityId,
            room: d.room,
            experience: d.experience,
            onDuty: d.onDuty ?? true,
            phone: d.phone,
            role: "doctor",
            passwordHash,
          },
        },
        { upsert: true }
      );
    }

    const filter: any = {};
    if (facilityId && facilityId !== "ALL") {
      filter.$or = [
        { facilityId: facilityId },
        { hospital: { $regex: facilityId, $options: "i" } }
      ];
    }
    if (queryStr) {
      filter.$or = [
        { name: { $regex: queryStr, $options: "i" } },
        { specialization: { $regex: queryStr, $options: "i" } },
        { email: { $regex: queryStr, $options: "i" } },
      ];
    }

    const doctors = await Doctor.find(filter).select("-passwordHash").sort({ createdAt: -1 }).lean();
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
    const { name, email, password, specialization, hospital, facilityId, room, experience, phone, onDuty } = await req.json();

    if (!name || !email || !password || !specialization) {
      return NextResponse.json({ error: "Name, email, password, and specialization are required." }, { status: 400 });
    }

    await dbConnect();

    const existingDoctor = await Doctor.findOne({ email: email.toLowerCase().trim() });
    if (existingDoctor) {
      return NextResponse.json({ error: "A doctor with this email already exists." }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);

    const doctor = await Doctor.create({
      name: name.startsWith("Dr.") ? name : `Dr. ${name}`,
      email: email.toLowerCase().trim(),
      passwordHash,
      specialization,
      hospital: hospital || "Civil Hospital",
      facilityId: facilityId || "HOSP-SION-001",
      room: room || "Room 102 (OPD)",
      experience: experience || "5 yrs",
      phone: phone || "+91 98000 00000",
      onDuty: onDuty !== undefined ? onDuty : true,
      role: "doctor"
    });

    return NextResponse.json({ message: "Doctor created successfully", doctor }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, name, specialization, hospital, facilityId, room, experience, phone, onDuty, password } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "Doctor ID is required." }, { status: 400 });
    }

    await dbConnect();

    const update: any = {};
    if (name) update.name = name.startsWith("Dr.") ? name : `Dr. ${name}`;
    if (specialization) update.specialization = specialization;
    if (hospital) update.hospital = hospital;
    if (facilityId) update.facilityId = facilityId;
    if (room) update.room = room;
    if (experience) update.experience = experience;
    if (phone) update.phone = phone;
    if (onDuty !== undefined) update.onDuty = onDuty;
    if (password && password.trim().length >= 4) {
      update.passwordHash = await hashPassword(password.trim());
    }

    const doctor = await Doctor.findByIdAndUpdate(id, { $set: update }, { new: true }).select("-passwordHash");
    if (!doctor) {
      return NextResponse.json({ error: "Doctor not found." }, { status: 404 });
    }

    return NextResponse.json({ message: "Doctor updated successfully", doctor });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Doctor ID is required." }, { status: 400 });
    }

    await dbConnect();
    await Doctor.findByIdAndDelete(id);

    return NextResponse.json({ message: "Doctor deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
