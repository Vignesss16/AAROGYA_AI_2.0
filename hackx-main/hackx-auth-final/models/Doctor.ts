import mongoose, { Schema, Document, Model } from "mongoose";

export interface IDoctor extends Document {
  email: string;
  passwordHash: string;
  name: string;
  specialization: string;
  hospital: string;
  facilityId?: string;
  room?: string;
  experience?: string;
  onDuty?: boolean;
  phone?: string;
  role: "doctor";
  createdAt: Date;
}

const DoctorSchema = new Schema<IDoctor>(
  {
    email:          { type: String, required: true, unique: true },
    passwordHash:   { type: String, required: true },
    name:           { type: String, required: true },
    specialization: { type: String, default: "General Physician" },
    hospital:       { type: String, default: "Civil Hospital" },
    facilityId:     { type: String, index: true },
    room:           { type: String, default: "Room 102 (OPD)" },
    experience:     { type: String, default: "8 yrs" },
    onDuty:         { type: Boolean, default: true },
    phone:          { type: String },
    role:           { type: String, default: "doctor" },
  },
  { timestamps: true }
);

const Doctor: Model<IDoctor> =
  mongoose.models.Doctor || mongoose.model<IDoctor>("Doctor", DoctorSchema);

export default Doctor;
