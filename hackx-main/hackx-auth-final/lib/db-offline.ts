// ─────────────────────────────────────────────────────────
//  SehatSetu — Offline IndexedDB via Dexie.js
//  Works fully without internet connection
// ─────────────────────────────────────────────────────────
import Dexie, { Table } from "dexie";

export interface OfflinePatient {
  id?: number;
  phone: string;
  name: string;
  age: number;
  gender: string;
  village: string;
  conditions: string;
  bloodGroup?: string;
  syncedAt?: Date;
  needsSync: boolean;
}

export interface OfflineConsultation {
  id?: number;
  clientId?: string;
  patientPhone: string;
  patientName: string;
  symptoms: string[];
  urgency: "RED" | "YELLOW" | "GREEN";
  triageResult: string; // JSON
  createdAt: Date;
  syncedAt?: Date;
  needsSync: boolean;
}

export interface OfflineMedicine {
  id?: number;
  name: string;
  pharmacies: string; // JSON
}

export interface OfflineASHAVisit {
  id?: number;
  patientPhone: string;
  patientName: string;
  visitDate: string;
  notes: string;
  appLearned: boolean;
  ashaWorkerPhone: string;
  syncedAt?: Date;
  needsSync: boolean;
}

export interface OfflineSOSAlert {
  id?: number;
  village: string;
  description: string;
  affectedCount: number;
  ashaWorkerPhone: string;
  createdAt: Date;
  syncedAt?: Date;
  needsSync: boolean;
}

export interface SyncQueueItem {
  id?: number;
  endpoint: string;
  method: string;
  body: string;
  createdAt: Date;
  retries: number;
  idempotencyKey?: string;
}

class SehatSetuDB extends Dexie {
  patients!: Table<OfflinePatient>;
  consultations!: Table<OfflineConsultation>;
  medicines!: Table<OfflineMedicine>;
  ashaVisits!: Table<OfflineASHAVisit>;
  sosAlerts!: Table<OfflineSOSAlert>;
  syncQueue!: Table<SyncQueueItem>;

  constructor() {
    super("SehatSetuDB");
    this.version(1).stores({
      patients:      "++id, phone, needsSync",
      consultations: "++id, patientPhone, urgency, needsSync",
      medicines:     "++id, name",
      ashaVisits:    "++id, patientPhone, ashaWorkerPhone, needsSync",
      sosAlerts:     "++id, village, needsSync",
      syncQueue:     "++id, endpoint, createdAt",
    });
  }
}

let db: SehatSetuDB | null = null;

export function getDB(): SehatSetuDB {
  if (typeof window === "undefined") throw new Error("IndexedDB not available on server");
  if (!db) db = new SehatSetuDB();
  return db;
}

// ── Seed offline data on first install ───────────────────
export async function seedOfflineData() {
  const db = getDB();
  const medCount = await db.medicines.count();
  if (medCount === 0) {
    await db.medicines.bulkAdd([
      {
        name: "Paracetamol",
        pharmacies: JSON.stringify([
          { name: "Nabha Medical Store", village: "Nabha", dist: "1.2", phone: "9876500001", qty: 200, inStock: true },
          { name: "Punjab Pharmacy", village: "Kesri", dist: "3.4", phone: "9876500002", qty: 100, inStock: true },
          { name: "Sharma Medical", village: "Barnala Road", dist: "5.8", phone: "9876500003", qty: 150, inStock: true },
        ]),
      },
      {
        name: "Metformin",
        pharmacies: JSON.stringify([
          { name: "Nabha Medical Store", village: "Nabha", dist: "1.2", phone: "9876500001", qty: 50, inStock: true },
          { name: "Punjab Pharmacy", village: "Kesri", dist: "3.4", phone: "9876500002", qty: 0, inStock: false },
          { name: "Sharma Medical", village: "Barnala Road", dist: "5.8", phone: "9876500003", qty: 80, inStock: true },
        ]),
      },
      {
        name: "ORS",
        pharmacies: JSON.stringify([
          { name: "Nabha Medical Store", village: "Nabha", dist: "1.2", phone: "9876500001", qty: 500, inStock: true },
          { name: "Punjab Pharmacy", village: "Kesri", dist: "3.4", phone: "9876500002", qty: 300, inStock: true },
          { name: "Sharma Medical", village: "Barnala Road", dist: "5.8", phone: "9876500003", qty: 0, inStock: false },
        ]),
      },
      {
        name: "Amoxicillin",
        pharmacies: JSON.stringify([
          { name: "Nabha Medical Store", village: "Nabha", dist: "1.2", phone: "9876500001", qty: 0, inStock: false },
          { name: "Punjab Pharmacy", village: "Kesri", dist: "3.4", phone: "9876500002", qty: 80, inStock: true },
          { name: "Sharma Medical", village: "Barnala Road", dist: "5.8", phone: "9876500003", qty: 60, inStock: true },
        ]),
      },
    ]);
  }

  // Seed sample village patients if none exist
  const ptCount = await db.patients.count();
  if (ptCount === 0) {
    await db.patients.bulkAdd([
      {
        name: "Arya",
        phone: "8591292159",
        village: "Kesri",
        age: 24,
        gender: "female",
        conditions: "",
        bloodGroup: "B+",
        needsSync: false,
      },
      {
        name: "arya",
        phone: "8591292959",
        village: "Kesri",
        age: 24,
        gender: "female",
        conditions: "",
        bloodGroup: "B+",
        needsSync: false,
      },
      {
        name: "Suresh Kumar",
        phone: "9876501002",
        village: "Nabha Sector 4",
        age: 38,
        gender: "male",
        conditions: "",
        bloodGroup: "O+",
        needsSync: false,
      },
      {
        name: "Ramkali Devi",
        phone: "9876501001",
        village: "Kesri",
        age: 52,
        gender: "female",
        conditions: "diabetes, hypertension",
        bloodGroup: "B+",
        needsSync: false,
      },
    ]);
  }

  // Seed sample ASHA visits if none exist
  const visitCount = await db.ashaVisits.count();
  if (visitCount === 0) {
    await db.ashaVisits.bulkAdd([
      {
        patientName: "Ramkali Devi",
        patientPhone: "9876501001",
        ashaWorkerPhone: "9876502001",
        visitDate: "2026-10-02",
        notes: "BP & blood glucose checkup. Diet counselling given for diabetes.",
        appLearned: true,
        needsSync: false,
      },
      {
        patientName: "Suresh Kumar",
        patientPhone: "9876501002",
        ashaWorkerPhone: "9876502001",
        visitDate: "2026-10-01",
        notes: "Seasonal fever assessment. ORS and paracetamol advice provided.",
        appLearned: true,
        needsSync: false,
      },
      {
        patientName: "arya",
        patientPhone: "8591292959",
        ashaWorkerPhone: "9876502001",
        visitDate: "2026-09-29",
        notes: "Antenatal checkup check. Iron & folic acid tablets supplied.",
        appLearned: true,
        needsSync: false,
      },
    ]);
  }

  console.log("✅ Offline data seeded (medicines, patients, and visits)");
}

// ── Sync queue helpers ────────────────────────────────────
export async function addToSyncQueue(endpoint: string, method: string, body: object, idempotencyKey?: string) {
  const db = getDB();
  if (idempotencyKey) {
    const existing = await db.syncQueue.filter(item => item.idempotencyKey === idempotencyKey).first();
    if (existing) {
      console.log(`[syncQueue] Duplicate prevented for key: ${idempotencyKey}`);
      return;
    }
  }
  await db.syncQueue.add({
    endpoint,
    method,
    body: JSON.stringify(body),
    createdAt: new Date(),
    retries: 0,
    idempotencyKey,
  });
}

export async function flushSyncQueue() {
  const db = getDB();
  const items = await db.syncQueue.toArray();
  let synced = 0;
  let failed = 0;

  for (const item of items) {
    try {
      const res = await fetch(item.endpoint, {
        method: item.method,
        headers: { "Content-Type": "application/json" },
        body: item.body,
      });
      if (res.ok) {
        await db.syncQueue.delete(item.id!);
        synced++;
      } else {
        await db.syncQueue.update(item.id!, { retries: item.retries + 1 });
        failed++;
      }
    } catch {
      await db.syncQueue.update(item.id!, { retries: item.retries + 1 });
      failed++;
    }
  }

  if (synced > 0 && typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("syncComplete", { detail: { synced } }));
  }

  return { synced, failed };
}

// ── Complete Batch Sync (One-shot batch upload for all offline models) ──
export async function syncAllOfflineData(): Promise<{ synced: number; failed: number }> {
  const db = getDB();
  let totalSynced = 0;
  let totalFailed = 0;

  try {
    // 1. Flush any queued individual requests first
    const queueRes = await flushSyncQueue();
    totalSynced += queueRes.synced;
    totalFailed += queueRes.failed;

    // 2. Fetch all offline tables marked as needsSync
    const [pendingPatients, pendingConsultations, pendingVisits, pendingSOS] = await Promise.all([
      db.patients.filter((p) => p.needsSync === true).toArray(),
      db.consultations.filter((c) => c.needsSync === true).toArray(),
      db.ashaVisits.filter((v) => v.needsSync === true).toArray(),
      db.sosAlerts.filter((s) => s.needsSync === true).toArray(),
    ]);

    const hasData = pendingPatients.length > 0 || pendingConsultations.length > 0 || pendingVisits.length > 0 || pendingSOS.length > 0;
    if (!hasData) {
      return { synced: totalSynced, failed: totalFailed };
    }

    // Format consultations (parse triageResult JSON if string)
    const formattedConsultations = pendingConsultations.map((c) => ({
      clientId: c.clientId || `offline-${c.id}-${new Date(c.createdAt).getTime()}`,
      patientPhone: c.patientPhone,
      patientName: c.patientName,
      symptoms: c.symptoms,
      urgency: c.urgency,
      triageResult: typeof c.triageResult === "string" ? JSON.parse(c.triageResult) : c.triageResult,
      createdAt: c.createdAt,
    }));

    // Send single batch POST to /api/sync
    const res = await fetch("/api/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patients: pendingPatients,
        consultations: formattedConsultations,
        ashaVisits: pendingVisits,
        sosAlerts: pendingSOS,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      totalSynced += data.synced || 0;

      // Mark local items as synced
      const now = new Date();
      await db.transaction("rw", [db.patients, db.consultations, db.ashaVisits, db.sosAlerts], async () => {
        for (const p of pendingPatients) {
          if (p.id) await db.patients.update(p.id, { needsSync: false, syncedAt: now });
        }
        for (const c of pendingConsultations) {
          if (c.id) await db.consultations.update(c.id, { needsSync: false, syncedAt: now });
        }
        for (const v of pendingVisits) {
          if (v.id) await db.ashaVisits.update(v.id, { needsSync: false, syncedAt: now });
        }
        for (const s of pendingSOS) {
          if (s.id) await db.sosAlerts.update(s.id, { needsSync: false, syncedAt: now });
        }
      });
    } else {
      totalFailed += pendingPatients.length + pendingConsultations.length + pendingVisits.length + pendingSOS.length;
    }
  } catch (err) {
    console.error("[syncAllOfflineData] Batch sync failed:", err);
    totalFailed++;
  }

  return { synced: totalSynced, failed: totalFailed };
}
