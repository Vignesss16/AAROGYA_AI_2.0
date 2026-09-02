import mongoose, { Schema, Document } from "mongoose";

export interface IReferral extends Document {
  patientPhone: string;
  patientName: string;
  consultationId: string;
  referredByDoctorId: string;
  referredByDoctorName: string;
  sourceFacility: string;
  targetFacility: string;
  reasonForReferral: string;
  urgency: "RED" | "YELLOW" | "GREEN";
  status: "pending" | "arrived" | "completed" | "no-show";
  createdAt: Date;
  updatedAt: Date;
}

const ReferralSchema = new Schema<IReferral>(
  {
    patientPhone: { type: String, required: true },
    patientName: { type: String, required: true },
    consultationId: { type: String, required: true },
    referredByDoctorId: { type: String, required: true },
    referredByDoctorName: { type: String, required: true },
    sourceFacility: { type: String, required: true }, // e.g., "Primary Health Centre, Village X"
    targetFacility: { type: String, required: true }, // e.g., "District Hospital, City Y"
    reasonForReferral: { type: String, required: true },
    urgency: { type: String, enum: ["RED", "YELLOW", "GREEN"], default: "YELLOW" },
    status: { type: String, enum: ["pending", "arrived", "completed", "no-show"], default: "pending" },
  },
  { timestamps: true }
);

export default mongoose.models.Referral || mongoose.model<IReferral>("Referral", ReferralSchema);
