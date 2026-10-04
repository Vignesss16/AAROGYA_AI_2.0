export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Review from "@/models/Review";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const doctorId = searchParams.get("doctorId");
    const doctorName = searchParams.get("doctorName");
    const patientPhone = searchParams.get("patientPhone");
    const consultationId = searchParams.get("consultationId");
    const status = searchParams.get("status");

    const query: Record<string, any> = {};

    if (consultationId) {
      query.consultationId = consultationId;
    }
    if (patientPhone) {
      query.patientPhone = patientPhone;
    }
    if (doctorId) {
      query.doctorId = doctorId;
    } else if (doctorName) {
      query.doctorName = new RegExp(doctorName.replace(/^(Dr\.?\s*)/i, "").trim(), "i");
    }

    if (status && status !== "ALL") {
      query.status = status;
    } else if (!status) {
      // By default show only published reviews unless admin requests all
      query.status = { $ne: "HIDDEN" };
    }

    const reviews = await Review.find(query).sort({ createdAt: -1 });

    // Calculate aggregated metrics if querying for a doctor or overall
    const totalReviews = reviews.length;
    const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let ratingSum = 0;

    reviews.forEach((r) => {
      const star = Math.min(5, Math.max(1, Math.round(r.rating))) as 1 | 2 | 3 | 4 | 5;
      breakdown[star] = (breakdown[star] || 0) + 1;
      ratingSum += r.rating;
    });

    const averageRating = totalReviews > 0 ? Number((ratingSum / totalReviews).toFixed(1)) : 5.0;

    const percentageBreakdown = {
      5: totalReviews > 0 ? Math.round((breakdown[5] / totalReviews) * 100) : 0,
      4: totalReviews > 0 ? Math.round((breakdown[4] / totalReviews) * 100) : 0,
      3: totalReviews > 0 ? Math.round((breakdown[3] / totalReviews) * 100) : 0,
      2: totalReviews > 0 ? Math.round((breakdown[2] / totalReviews) * 100) : 0,
      1: totalReviews > 0 ? Math.round((breakdown[1] / totalReviews) * 100) : 0,
    };

    return NextResponse.json({
      reviews,
      metrics: {
        totalReviews,
        averageRating,
        breakdown,
        percentageBreakdown,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch reviews" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();

    const {
      consultationId,
      patientPhone,
      patientName,
      doctorId,
      doctorName,
      hospital,
      rating,
      comment,
    } = body;

    if (!consultationId || !patientPhone || !rating) {
      return NextResponse.json(
        { error: "Consultation ID, patient phone, and rating are required." },
        { status: 400 }
      );
    }

    const numericRating = Number(rating);
    if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      return NextResponse.json(
        { error: "Rating must be a number between 1 and 5." },
        { status: 400 }
      );
    }

    // Check if review already exists for this consultation (1 Consultation = 1 Review)
    const existing = await Review.findOne({ consultationId });
    if (existing) {
      return NextResponse.json(
        { error: "A review has already been submitted for this consultation.", review: existing },
        { status: 409 }
      );
    }

    const year = new Date().getFullYear();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const reviewId = `REV-${year}-${randomSuffix}`;

    const review = await Review.create({
      reviewId,
      consultationId,
      patientPhone,
      patientName: patientName || "Patient",
      doctorId: doctorId || "DOC-DEFAULT",
      doctorName: doctorName || "Consultant Doctor",
      hospital: hospital || "",
      rating: numericRating,
      comment: comment?.trim() || "",
      status: "PUBLISHED",
    });

    return NextResponse.json({ review }, { status: 201 });
  } catch (err: any) {
    if (err.code === 11000) {
      return NextResponse.json(
        { error: "A review already exists for this consultation." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: err.message || "Failed to submit review" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();
    const { reviewId, status, moderationReason } = body;

    if (!reviewId) {
      return NextResponse.json({ error: "reviewId is required." }, { status: 400 });
    }

    const updates: Record<string, any> = {};
    if (status) updates.status = status;
    if (moderationReason !== undefined) updates.moderationReason = moderationReason;

    const review = await Review.findOneAndUpdate({ reviewId }, updates, { new: true });

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    return NextResponse.json({ review });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update review" }, { status: 500 });
  }
}
