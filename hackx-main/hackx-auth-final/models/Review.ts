import mongoose, { Schema, Document, Model } from "mongoose";

export interface IReview extends Document {
  reviewId: string;
  consultationId: string; // Unique 1 review per consultation
  patientPhone: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  hospital?: string;
  rating: number; // 1 to 5
  comment?: string;
  status: "PUBLISHED" | "FLAGGED" | "HIDDEN";
  moderationReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    reviewId: { type: String, required: true, unique: true, index: true },
    consultationId: { type: String, required: true, unique: true, index: true },
    patientPhone: { type: String, required: true, index: true },
    patientName: { type: String, required: true },
    doctorId: { type: String, required: true, index: true },
    doctorName: { type: String, required: true },
    hospital: { type: String, default: "" },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: "" },
    status: {
      type: String,
      enum: ["PUBLISHED", "FLAGGED", "HIDDEN"],
      default: "PUBLISHED",
      index: true,
    },
    moderationReason: { type: String, default: "" },
  },
  { timestamps: true }
);

export const Review: Model<IReview> =
  mongoose.models.Review || mongoose.model<IReview>("Review", ReviewSchema);

export default Review;
