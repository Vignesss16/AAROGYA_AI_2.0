import mongoose, { Schema, Document, Model } from "mongoose";

export interface IConsultation extends Document {
  clientId?: string;
  patientPhone: string;
  patientName: string;
  age?: string | number;
  gender?: string;
  symptoms: string[];
  urgency: "RED" | "YELLOW" | "GREEN";
  triageResult: object;
  patientContext?: any;
  uploadedRecords?: any[];
  voiceNoteBase64?: string;
  doctorId?: string;
  doctorName?: string;
  hospital?: string;
  facilityId?: string;
  department?: string;
  bookingType?: "DIRECT_DOCTOR" | "HOSPITAL_RECEPTIONIST_ASSISTED";
  receptionistStatus?: string;
  estimatedConfirmationTime?: string;
  slot?: string;
  queueNo?: string;
  tokenNumber?: string;
  checkInStatus?: string;
  arrivedAt?: string;
  consultationRoom?: string;
  verificationNotes?: string;
  verificationStatus?: string;
  source?: string;
  doctorNotes?: string;
  prescription?: string;
  status: "pending" | "in-review" | "confirmed" | "completed" | "cancelled";
  createdAt: Date;
  updatedAt: Date;
}

const ConsultationSchema = new Schema<IConsultation>(
  {
    clientId:     { type: String, sparse: true, index: true },
    patientPhone: { type: String, required: true, index: true },
    patientName:  { type: String, required: true },
    age:          { type: Schema.Types.Mixed },
    gender:       { type: String },
    symptoms:     { type: [String], required: true },
    urgency:      { type: String, default: "GREEN", index: true },
    triageResult: { type: Schema.Types.Mixed, required: true },
    patientContext: { type: Schema.Types.Mixed },
    uploadedRecords: { type: Schema.Types.Mixed },
    voiceNoteBase64: { type: String },
    doctorId:     { type: String },
    doctorName:   { type: String },
    hospital:     { type: String },
    facilityId:   { type: String, index: true },
    department:   { type: String },
    bookingType:  {
      type: String,
      default: "DIRECT_DOCTOR",
    },
    receptionistStatus: {
      type: String,
      default: "CONFIRMED",
    },
    estimatedConfirmationTime: { type: String },
    slot:         { type: String },
    queueNo:      { type: String },
    tokenNumber:  { type: String },
    checkInStatus: { type: String },
    arrivedAt:    { type: String },
    consultationRoom: { type: String },
    verificationNotes: { type: String },
    verificationStatus: { type: String },
    source:       { type: String },
    doctorNotes:  { type: String },
    prescription: { type: String },
    status:       {
      type: String,
      default: "pending",
      index: true,
    },
  },
  { timestamps: true }
);

// Sort RED first by default
ConsultationSchema.index({ urgency: 1, createdAt: -1 });

export const Consultation: Model<IConsultation> =
  mongoose.models.Consultation ||
  mongoose.model<IConsultation>("Consultation", ConsultationSchema);

export default Consultation;