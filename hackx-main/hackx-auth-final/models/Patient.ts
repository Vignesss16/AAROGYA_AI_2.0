import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPatient extends Document {
  phone:      string;
  email?:     string;
  googleId?:  string;
  name:       string;
  age:        number;
  gender:     "male" | "female" | "other";
  village:    string;
  conditions: string[];
  bloodGroup?: string;
  password:   string;
  role:       "patient";
  abhaAddress?: string;
  abhaLinked?:  boolean;
  createdAt:  Date;
  updatedAt:  Date;
}

const PatientSchema = new Schema<IPatient>(
  {
    phone:      { type: String, default: "" },
    email:      { type: String, sparse: true },
    googleId:   { type: String, sparse: true },
    name:       { type: String, required: true },
    age:        { type: Number, default: 0 },
    gender:     { type: String, enum: ["male", "female", "other"], default: "other" },
    village:    { type: String, default: "" },
    conditions: { type: [String], default: [] },
    bloodGroup: { type: String },
    password:   { type: String, required: true, select: false },
    role:       { type: String, default: "patient" },
    abhaAddress: { type: String, default: "" },
    abhaLinked: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Patient: Model<IPatient> =
  mongoose.models.Patient || mongoose.model<IPatient>("Patient", PatientSchema);

export default Patient;
