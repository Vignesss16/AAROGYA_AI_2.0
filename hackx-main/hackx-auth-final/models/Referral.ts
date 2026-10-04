import mongoose, { Schema, Document } from "mongoose";

export interface IReferral extends Document {
  patientPhone: string;
  patientName: string;
  consultationId: string;
  referredByDoctorId: string;
  referredByDoctorName: string;
  sourceFacility: string;
  targetFacility: string;
  targetDepartment?: string;
  targetDoctorName?: string;
  referralType?: "IN_PERSON_FOLLOWUP" | "SPECIALIST_FACILITY_TRANSFER";
  scheduledDate?: string;
  scheduledSlot?: string;
  opdToken?: string;
  reasonForReferral: string;
  clinicalNotes?: string;
  urgency: "RED" | "YELLOW" | "GREEN";
  status: "pending" | "arrived" | "completed" | "no-show" | "accepted";
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
    sourceFacility: { type: String, required: true },
    targetFacility: { type: String, required: true },
    targetDepartment: { type: String, default: "General Medicine" },
    targetDoctorName: { type: String, default: "" },
    referralType: { type: String, enum: ["IN_PERSON_FOLLOWUP", "SPECIALIST_FACILITY_TRANSFER"], default: "SPECIALIST_FACILITY_TRANSFER" },
    scheduledDate: { type: String, default: "" },
    scheduledSlot: { type: String, default: "" },
    opdToken: { type: String, default: "" },
    reasonForReferral: { type: String, required: true },
    clinicalNotes: { type: String, default: "" },
    urgency: { type: String, enum: ["RED", "YELLOW", "GREEN"], default: "YELLOW" },
    status: { type: String, enum: ["pending", "accepted", "arrived", "completed", "no-show"], default: "pending" },
  },
  { timestamps: true }
);

export default mongoose.models.Referral || mongoose.model<IReferral>("Referral", ReferralSchema);
