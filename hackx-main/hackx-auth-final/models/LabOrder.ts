import mongoose, { Schema, Document, Model } from "mongoose";

export type LabOrderStatus =
  | "SENT_TO_LAB"
  | "LAB_ACCEPTED"
  | "LAB_REJECTED"
  | "APPOINTMENT_CONFIRMED"
  | "SAMPLE_COLLECTED"
  | "PROCESSING"
  | "REPORT_UPLOADED"
  | "DOCTOR_REVIEWED"
  | "CANCELLED";

export interface ILabOrder extends Document {
  orderId: string;
  consultationId: string;
  patientPhone: string;
  patientName: string;
  doctorId?: string;
  doctorName?: string;
  labId: string;
  labName: string;
  tests: string[];
  priority: "NORMAL" | "URGENT";
  doctorInstructions?: string;
  status: LabOrderStatus;
  rejectionReason?: string;
  appointmentSlot?: string;
  sampleCollectedAt?: Date;
  reportUrl?: string;
  reportFileName?: string;
  reportData?: Record<string, any>;
  uploadedAt?: Date;
  doctorReviewNotes?: string;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const LabOrderSchema = new Schema<ILabOrder>(
  {
    orderId: { type: String, required: true, unique: true, index: true },
    consultationId: { type: String, required: true, index: true },
    patientPhone: { type: String, required: true, index: true },
    patientName: { type: String, required: true },
    doctorId: { type: String, index: true },
    doctorName: { type: String, default: "Dr. Consulting Physician" },
    labId: { type: String, required: true, index: true },
    labName: { type: String, required: true },
    tests: { type: [String], required: true },
    priority: { type: String, enum: ["NORMAL", "URGENT"], default: "NORMAL" },
    doctorInstructions: { type: String, default: "" },
    status: {
      type: String,
      enum: [
        "SENT_TO_LAB",
        "LAB_ACCEPTED",
        "LAB_REJECTED",
        "APPOINTMENT_CONFIRMED",
        "SAMPLE_COLLECTED",
        "PROCESSING",
        "REPORT_UPLOADED",
        "DOCTOR_REVIEWED",
        "CANCELLED",
      ],
      default: "SENT_TO_LAB",
      index: true,
    },
    rejectionReason: { type: String, default: "" },
    appointmentSlot: { type: String, default: "" },
    sampleCollectedAt: { type: Date },
    reportUrl: { type: String, default: "" },
    reportFileName: { type: String, default: "" },
    reportData: { type: Schema.Types.Mixed, default: {} },
    uploadedAt: { type: Date },
    doctorReviewNotes: { type: String, default: "" },
    reviewedAt: { type: Date },
  },
  { timestamps: true }
);

// Indexes for fast queries
LabOrderSchema.index({ labId: 1, status: 1, createdAt: -1 });
LabOrderSchema.index({ consultationId: 1, createdAt: -1 });
LabOrderSchema.index({ patientPhone: 1, createdAt: -1 });

const LabOrder: Model<ILabOrder> =
  mongoose.models.LabOrder || mongoose.model<ILabOrder>("LabOrder", LabOrderSchema);

export default LabOrder;
