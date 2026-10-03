import mongoose, { Schema, Document, Model } from "mongoose";

export interface IConsultation extends Document {
  clientId?: string;
  patientPhone: string;
  patientName: string;
  symptoms: string[];
  urgency: "RED" | "YELLOW" | "GREEN";
  triageResult: object;
  patientContext?: any;
  uploadedRecords?: any[];
  voiceNoteBase64?: string;
  doctorId?: string;
  doctorName?: string;
  hospital?: string;
  slot?: string;
  queueNo?: string;
  doctorNotes?: string;
  prescription?: string;
  status: "pending" | "in-review" | "completed";
  createdAt: Date;
  updatedAt: Date;
}

const ConsultationSchema = new Schema<IConsultation>(
  {
    clientId:     { type: String, sparse: true, index: true },
    patientPhone: { type: String, required: true, index: true },
    patientName:  { type: String, required: true },
    symptoms:     { type: [String], required: true },
    urgency:      { type: String, enum: ["RED", "YELLOW", "GREEN"], required: true, index: true },
    triageResult: { type: Schema.Types.Mixed, required: true },
    patientContext: { type: Schema.Types.Mixed },
    uploadedRecords: { type: Schema.Types.Mixed },
    voiceNoteBase64: { type: String },
    doctorId:     { type: String },
    doctorName:   { type: String },
    hospital:     { type: String },
    slot:         { type: String },
    queueNo:      { type: String },
    doctorNotes:  { type: String },
    prescription: { type: String },
    status:       { type: String, enum: ["pending", "in-review", "completed"], default: "pending" },
  },
  { timestamps: true }
);

// Sort RED first by default
ConsultationSchema.index({ urgency: 1, createdAt: -1 });

const Consultation: Model<IConsultation> =
  mongoose.models.Consultation ||
  mongoose.model<IConsultation>("Consultation", ConsultationSchema);

export default Consultation;