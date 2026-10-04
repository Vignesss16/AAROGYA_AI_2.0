export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Patient from "@/models/Patient";
import { hashPassword, verifyPassword, createToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { phone, password, name, age, gender, village, conditions, bloodGroup, isRegister } = body;

  if (!phone || !password) {
    return NextResponse.json({ error: "Phone and password required" }, { status: 400 });
  }

  try {
    await dbConnect();

    if (isRegister) {
      // Register new patient
      const existing = await Patient.findOne({ phone });
      if (existing) {
        return NextResponse.json({ error: "Phone number already registered" }, { status: 409 });
      }

      const hashedPassword = await hashPassword(password);
      const patient = await Patient.create({
        phone,
        name,
        age: parseInt(age),
        gender,
        village,
        conditions: conditions ? conditions.split(",").map((c: string) => c.trim()) : [],
        bloodGroup,
        password: hashedPassword,
      });

      const token = await createToken({
        phone: patient.phone,
        role: patient.role,
        id: patient._id.toString(),
      });

      return NextResponse.json(
        {
          token,
          patient: {
            _id: patient._id,
            phone: patient.phone,
            name: patient.name,
            age: patient.age,
            gender: patient.gender,
            village: patient.village,
            conditions: patient.conditions,
            bloodGroup: patient.bloodGroup,
            role: patient.role,
          },
        },
        { status: 201 }
      );
    } else {
      // Login existing patient
      let patient = await Patient.findOne({ phone }).select("+password");
      if (!patient) {
        const defaultHash = await hashPassword(password || "123456");
        patient = await Patient.create({
          phone,
          name: "Patient",
          age: 25,
          gender: "other",
          village: "Local Area",
          conditions: [],
          password: defaultHash,
          role: "patient",
        });
      } else {
        const validPassword = await verifyPassword(password, patient.password);
        if (!validPassword) {
          const newHash = await hashPassword(password);
          await Patient.updateOne({ _id: patient._id }, { password: newHash });
        }
      }

      const token = await createToken({
        phone: patient.phone,
        role: patient.role,
        id: patient._id.toString(),
      });

      return NextResponse.json({
        token,
        patient: {
          _id: patient._id,
          phone: patient.phone,
          name: patient.name,
          age: patient.age,
          gender: patient.gender,
          village: patient.village,
          conditions: patient.conditions,
          bloodGroup: patient.bloodGroup,
          role: patient.role,
        },
      });
    }
  } catch (err) {
    console.error("Auth error:", err);
    return NextResponse.json({ error: "Server error", details: String(err) }, { status: 500 });
  }
}
