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
  if (medCount > 0) return; // already seeded

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
  console.log("✅ Offline data seeded");
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
