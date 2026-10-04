import mongoose, { Schema, Document, Model } from "mongoose";

export interface IFacility extends Document {
  facilityId: string;
  name: string;
  shortName: string;
  type: "Govt Civil Hospital" | "Community Health Center (CHC)" | "Primary Health Center (PHC)" | "Private Multi-Specialty Hospital";
  location: string;
  city: string;
  state: string;
  address: string;
  phone: string;
  lat: number;
  lng: number;
  departments: string[];
  affiliatedDoctorIds: string[];
  emergencyAvailable: boolean;
  ayushmanBharat: boolean;
  opdTimings: string;
  receptionistPhone: string;
  receptionistEmail?: string;
  status: "ACTIVE" | "INACTIVE";
  createdAt: Date;
  updatedAt: Date;
}

const FacilitySchema = new Schema<IFacility>(
  {
    facilityId:   { type: String, required: true, unique: true, index: true },
    name:         { type: String, required: true },
    shortName:    { type: String, required: true },
    type: {
      type: String,
      enum: ["Govt Civil Hospital", "Community Health Center (CHC)", "Primary Health Center (PHC)", "Private Multi-Specialty Hospital"],
      default: "Govt Civil Hospital",
    },
    location:     { type: String, required: true, index: true },
    city:         { type: String, required: true, index: true },
    state:        { type: String, default: "Punjab" },
    address:      { type: String, required: true },
    phone:        { type: String, required: true },
    lat:          { type: Number, required: true },
    lng:          { type: Number, required: true },
    departments:  { type: [String], default: ["General Medicine", "Emergency 24/7"] },
    affiliatedDoctorIds: { type: [String], default: [] },
    emergencyAvailable: { type: Boolean, default: true },
    ayushmanBharat: { type: Boolean, default: true },
    opdTimings:   { type: String, default: "09:00 AM - 02:00 PM / 04:00 PM - 07:00 PM" },
    receptionistPhone: { type: String, default: "1800-180-1104" },
    receptionistEmail: { type: String, default: "reception@aarogya.ai" },
    status:       { type: String, enum: ["ACTIVE", "INACTIVE"], default: "ACTIVE" },
  },
  { timestamps: true }
);

export const Facility: Model<IFacility> =
  mongoose.models.Facility || mongoose.model<IFacility>("Facility", FacilitySchema);

export default Facility;
