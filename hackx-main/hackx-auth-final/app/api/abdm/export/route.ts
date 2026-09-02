import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import mongoose from "mongoose";
import { mapConsultationToFHIR } from "@/lib/fhir-mapper";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();
    const { consultationId } = body;

    if (!consultationId) {
      return NextResponse.json({ error: "Missing consultationId" }, { status: 400 });
    }

    const ConsultationModel = mongoose.models.Consultation;
    if (!ConsultationModel) {
      return NextResponse.json({ error: "Consultation model not loaded" }, { status: 500 });
    }

    const consultation = await ConsultationModel.findById(consultationId);
    if (!consultation) {
      return NextResponse.json({ error: "Consultation not found" }, { status: 404 });
    }

    // 1. Generate FHIR Bundle
    const fhirBundle = mapConsultationToFHIR(consultation);

    // 2. Here, in a real production environment, you would push this bundle 
    // to the ABDM Health Information Provider (HIP) gateway via HTTPS.
    // Example:
    // await fetch("https://dev.abdm.gov.in/gateway/v0.5/health-information/notify", { ... })

    // Simulate an API delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // For now, return the FHIR bundle as proof of export readiness.
    return NextResponse.json({ 
      success: true, 
      message: "Successfully exported to ABDM compliant FHIR format.",
      fhirBundle 
    });
  } catch (err: any) {
    return NextResponse.json({ error: "Export failed: " + err.message }, { status: 500 });
  }
}
