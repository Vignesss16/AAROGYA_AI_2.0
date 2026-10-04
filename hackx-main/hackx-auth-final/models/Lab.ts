import mongoose, { Schema, Document, Model } from "mongoose";

export interface ILab extends Document {
  labId: string;
  name: string;
  phone: string;
  password?: string;
  address: string;
  village?: string;
  city: string;
  district: string;
  pincode?: string;
  services: string[];
  workingHours: string;
  status: "ACTIVE" | "INACTIVE";
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const LabSchema = new Schema<ILab>(
  {
    labId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true, index: true },
    password: { type: String, default: "lab123" },
    address: { type: String, required: true },
    village: { type: String, default: "" },
    city: { type: String, required: true },
    district: { type: String, default: "Nabha" },
    pincode: { type: String, default: "147201" },
    services: {
      type: [String],
      default: [
        "Complete Blood Count (CBC)",
        "Blood Sugar (Fasting)",
        "Blood Sugar (Random)",
        "HbA1c (Glycated Hemoglobin)",
        "Lipid Profile",
        "Liver Function Test (LFT)",
        "Kidney Function Test (KFT)",
        "Thyroid Profile (T3, T4, TSH)",
        "Urine Routine & Microscopic",
        "Malaria Rapid Test",
        "Dengue NS1 Antigen",
        "Typhoid (Widal Test)",
      ],
    },
    workingHours: { type: String, default: "08:00 AM - 08:00 PM" },
    status: { type: String, enum: ["ACTIVE", "INACTIVE"], default: "ACTIVE" },
    isVerified: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Lab: Model<ILab> = mongoose.models.Lab || mongoose.model<ILab>("Lab", LabSchema);

export default Lab;
