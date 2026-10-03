export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Patient from "@/models/Patient";
import Consultation from "@/models/Consultation";
import { ASHAVisit, SOSAlert } from "@/models/index";
import { pusher } from "@/lib/pusher-server";

export async function POST(req: NextRequest) {
  try {
    const { patients, consultations, ashaVisits, sosAlerts } = await req.json();
    const results = {
      synced: 0,
      patientsSynced: 0,
      consultationsSynced: 0,
      visitsSynced: 0,
      sosSynced: 0,
      errors: [] as string[]
    };

    await dbConnect();

    // 1. Batch Upsert Patients (Single MongoDB Roundtrip)
    if (patients && Array.isArray(patients) && patients.length > 0) {
      try {
        const patientOps = patients.map((p: any) => ({
          updateOne: {
            filter: { phone: p.phone },
            update: { $set: p },
            upsert: true,
          }
        }));
        const pRes = await Patient.bulkWrite(patientOps, { ordered: false });
        const count = (pRes.upsertedCount || 0) + (pRes.modifiedCount || 0) + (pRes.matchedCount || 0);
        results.patientsSynced = count;
        results.synced += count;
      } catch (err: any) {
        console.error("[Sync API] Patient bulkWrite error:", err);
        results.errors.push(`Patients: ${err.message || String(err)}`);
      }
    }

    // 2. Batch Upsert Consultations with Idempotent Deduplication
    if (consultations && Array.isArray(consultations) && consultations.length > 0) {
      try {
        const consultOps = consultations.map((c: any) => {
          // Deduplicate by clientId if provided, or patientPhone + createdAt/slot
          const filter = c.clientId
            ? { clientId: c.clientId }
            : c._id
            ? { _id: c._id }
            : { patientPhone: c.patientPhone, createdAt: c.createdAt || new Date() };

          return {
            updateOne: {
              filter,
              update: { $set: c },
              upsert: true,
            }
          };
        });

        const cRes = await Consultation.bulkWrite(consultOps, { ordered: false });
        const count = (cRes.upsertedCount || 0) + (cRes.modifiedCount || 0) + (cRes.matchedCount || 0);
        results.consultationsSynced = count;
        results.synced += count;

        // Notify Doctor Dashboard via Pusher in real-time
        try {
          for (const c of consultations) {
            await pusher.trigger("consultations", "new-consultation", {
              patientName: c.patientName,
              patientPhone: c.patientPhone,
              urgency: c.urgency || "YELLOW",
              symptoms: c.symptoms || [],
              syncedFromOffline: true,
              createdAt: c.createdAt || new Date(),
            });
          }
        } catch (pushErr) {
          console.warn("[Sync API] Pusher notification non-critical error:", pushErr);
        }
      } catch (err: any) {
        console.error("[Sync API] Consultation bulkWrite error:", err);
        results.errors.push(`Consultations: ${err.message || String(err)}`);
      }
    }

    // 3. Batch Upsert ASHA Visits
    if (ashaVisits && Array.isArray(ashaVisits) && ashaVisits.length > 0) {
      try {
        const visitOps = ashaVisits.map((v: any) => ({
          updateOne: {
            filter: v._id ? { _id: v._id } : { ashaWorkerPhone: v.ashaWorkerPhone, patientPhone: v.patientPhone, visitDate: v.visitDate },
            update: { $set: v },
            upsert: true,
          }
        }));
        const vRes = await ASHAVisit.bulkWrite(visitOps, { ordered: false });
        const count = (vRes.upsertedCount || 0) + (vRes.modifiedCount || 0) + (vRes.matchedCount || 0);
        results.visitsSynced = count;
        results.synced += count;
      } catch (err: any) {
        console.error("[Sync API] ASHA Visit bulkWrite error:", err);
        results.errors.push(`Visits: ${err.message || String(err)}`);
      }
    }

    // 4. Batch Upsert SOS Alerts
    if (sosAlerts && Array.isArray(sosAlerts) && sosAlerts.length > 0) {
      try {
        const sosOps = sosAlerts.map((s: any) => ({
          updateOne: {
            filter: s._id ? { _id: s._id } : { village: s.village, ashaWorkerPhone: s.ashaWorkerPhone, createdAt: s.createdAt },
            update: { $set: s },
            upsert: true,
          }
        }));
        const sRes = await SOSAlert.bulkWrite(sosOps, { ordered: false });
        const count = (sRes.upsertedCount || 0) + (sRes.modifiedCount || 0) + (sRes.matchedCount || 0);
        results.sosSynced = count;
        results.synced += count;

        // Broadcast SOS alert to hospital & doctor channels immediately
        try {
          for (const s of sosAlerts) {
            await pusher.trigger("sos-alerts", "new-sos", {
              village: s.village,
              affectedCount: s.affectedCount,
              description: s.description,
              ashaWorkerPhone: s.ashaWorkerPhone,
              syncedFromOffline: true,
            });
          }
        } catch (pushErr) {
          console.warn("[Sync API] SOS Pusher trigger error:", pushErr);
        }
      } catch (err: any) {
        console.error("[Sync API] SOS bulkWrite error:", err);
        results.errors.push(`SOS: ${err.message || String(err)}`);
      }
    }

    return NextResponse.json({
      success: results.errors.length === 0,
      ...results,
    });
  } catch (err: any) {
    console.error("[Sync API] Top-level handler failure:", err);
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
