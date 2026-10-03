# 📱 Aarogya.AI — Offline-to-Online Architecture & Sync Engine

> **TL;DR for Team & GitHub Collaborators:**  
> This document explains how the ASHA worker app works in **0G / zero-connectivity rural areas** with **zero data loss**, functioning identically to how **WhatsApp chats** queue locally when offline and sync automatically upon reconnection.

---

## 💡 The WhatsApp Analogy (How to explain it in 30 seconds)

| Feature | WhatsApp Chat | Aarogya.AI Patient Triage |
| :--- | :--- | :--- |
| **When Offline (0G)** | You type and send a chat $\rightarrow$ shows **Clock icon** 🕒 | ASHA worker records patient $\rightarrow$ shows **"Saved Locally"** 🕒 |
| **Storage Location** | Local SQLite (`msgstore.db`) inside app sandbox | Local SQLite / IndexedDB (`Dexie.js` or `Room DB`) |
| **Reconnection (4G/Wi-Fi)**| Background service wakes up silently | Android **`WorkManager`** wakes up via `NetworkType.CONNECTED` |
| **Server Ingestion** | Uploads message $\rightarrow$ turns to **Single Checkmark** (✓) | Uploads batch to Next.js `/api/sync` $\rightarrow$ turns to **Synced** (✓) |
| **Stakeholder Action** | Recipient reads $\rightarrow$ **Double Blue Checkmark** (✓✓) | Pusher WebSocket alerts **Doctor / PHC Dashboard** in real time |

---

## 🛠️ Tech Stack & Responsibilities

1. **Client / Edge Layer**:
   - **Framework**: Next.js wrapped with **Capacitor.js** (or Native Android).
   - **Local Database**: **Dexie.js (IndexedDB)** for web/Capacitor or **Room (SQLite)** for Android.
   - **Edge Triage Engine**: Deterministic, rule-based clinical scoring (ICMR/WHO guidelines). *No heavy LLMs run on low-end phones!*
2. **Background Sync Engine**:
   - **Android WorkManager**: OS-level scheduler that monitors network state constraints (`CONNECTED`). Survives phone reboots, app task kills, and low battery states.
3. **Cloud Backend**:
   - **Next.js API Route**: `POST /api/sync` (Validates JWT, de-duplicates by Client UUID, bulk-upserts).
   - **Groq LLaMA 3.3 Engine**: Cloud-side deep triage analysis and clinical summary (only triggers when online).
   - **Pusher**: Real-time WebSockets dispatching high-severity alerts to doctors.
4. **Cloud Database**:
   - **MongoDB Atlas**: Central source of truth.

---

## 🔄 System Architecture Flow

![Offline System Architecture Flowchart](./assets/offline_sync_architecture_flowchart.png)

```mermaid
flowchart TD
    classDef client fill:#e0f2fe,stroke:#0284c7,stroke-width:2px,color:#0f172a
    classDef offline fill:#fef3c7,stroke:#d97706,stroke-width:2px,color:#0f172a
    classDef sync fill:#f3e8ff,stroke:#9333ea,stroke-width:2px,color:#0f172a
    classDef cloud fill:#dcfce7,stroke:#16a34a,stroke-width:2px,color:#0f172a
    classDef db fill:#ffe4e6,stroke:#e11d48,stroke-width:2px,color:#0f172a

    subgraph MobileDevice ["📱 MOBILE EDGE LAYER (ASHA Worker Device)"]
        UI["👤 ASHA Mobile UI<br/>(React / Capacitor / Native Android)"]:::client
        RuleEngine["⚡ Edge Rule Engine<br/>(Deterministic Offline Triage - WHO Rules)"]:::offline
        LocalDB[("💾 Local SQLite / IndexedDB<br/>(Room DB or Dexie.js)<br/>Status: PENDING_SYNC")]:::offline
        WorkManager["🔄 Android WorkManager / Sync Service<br/>(Monitors Network Constraints)"]:::sync
    end

    subgraph NetState ["📶 CONNECTIVITY TRANSITION"]
        OfflineMode["🚫 0G / Offline Village<br/>(Zero data loss; 100% saved to phone disk)"]:::offline
        OnlineMode["🟢 Network Restored (Wi-Fi / 4G)<br/>(Fires WorkManager constraint)"]:::sync
    end

    subgraph CloudAPI ["☁️ CLOUD BACKEND (Next.js & Services)"]
        SyncEndpoint["🛡️ /api/sync Endpoint<br/>(Auth, Schema Validation, De-duplication)"]:::cloud
        GroqTriage["🧠 Groq LLaMA 3.3 Engine<br/>(Deep AI Triage for High Severity)"]:::cloud
        PusherSockets["⚡ Pusher WebSockets<br/>(Real-Time Event Distribution)"]:::cloud
    end

    subgraph DatastoreAndPortals ["🏥 DATA PERSISTENCE & PORTALS"]
        MongoDB[("🍃 MongoDB Atlas<br/>(Central Master Database)")]:::db
        DoctorDashboard["💻 Doctor & Hospital Dashboard<br/>(Live Queue & SOS Alerts)"]:::client
        PharmacyInventory["🏪 Pharmacist Inventory Portal<br/>(Stock & Verification)"]:::client
    end

    %% Flow Steps
    UI -->|"1. Input Vitals & Symptoms"| RuleEngine
    RuleEngine -->|"2. Return Instant Triage Score"| UI
    RuleEngine -->|"3. Save Record (synced: false)"| LocalDB
    LocalDB -.->|"Stored safely in 0G"| OfflineMode
    OfflineMode -.-> OnlineMode
    OnlineMode -->|"4. Triggers NetworkConstraint.CONNECTED"| WorkManager
    WorkManager -->|"5. Fetch Pending Records"| LocalDB
    WorkManager -->|"6. POST /api/sync (Batch Payload)"| SyncEndpoint
    SyncEndpoint -->|"7. Idempotent Upsert"| MongoDB
    SyncEndpoint -->|"8. AI Cloud Enrichment"| GroqTriage
    SyncEndpoint -->|"9. Emit WebSocket Alert"| PusherSockets
    SyncEndpoint -->|"10. HTTP 200 { syncedIds: [...] }"| WorkManager
    WorkManager -->|"11. Update Status (synced: true)"| LocalDB
    PusherSockets -->|"12. Live Push Notification"| DoctorDashboard
    MongoDB -.->|"Verified Prescriptions"| PharmacyInventory
```

---

## ⏱️ Step-by-Step Lifecycle (Sequence Diagram)

![Offline-to-Online Sequence Flow](./assets/offline_sync_sequence_flow.png)

```mermaid
sequenceDiagram
    autonumber
    actor ASHA as 👩‍⚕️ ASHA Worker
    participant App as 📱 Mobile UI (Capacitor/Native)
    participant LocalDB as 💾 Local DB (Room / Dexie.js)
    participant WM as ⚙️ Android WorkManager
    participant API as 🌐 Next.js (/api/sync)
    participant DB as 🍃 MongoDB Atlas
    participant Doctor as 🏥 Doctor Dashboard (Pusher)

    Note over ASHA,LocalDB: 📍 PHASE 1: OFFLINE INGESTION (0G Rural Village)
    ASHA->>App: Input Vitals, Symptoms & Patient Info
    App->>App: Run Local Rule-Based Triage (Offline)
    App->>LocalDB: Store record (id, vitals, triage, synced=false)
    LocalDB-->>App: Saved to phone's private storage
    App-->>ASHA: Display "Saved Locally (Clock 🕒 Icon)"

    Note over WM,API: 📍 PHASE 2: RECONNECTION (Returns to PHC)
    WM->>WM: NetworkConstraint.CONNECTED fired
    WM->>LocalDB: Query records WHERE synced = false
    LocalDB-->>WM: Return pending batch [Record1, Record2]
    WM->>API: POST /api/sync (Bearer Token + JSON Batch)

    Note over API,DB: 📍 PHASE 3: SERVER INGESTION & DE-DUPLICATION
    API->>API: Verify Token & De-duplicate by Client UUID
    API->>DB: Bulk Upsert records into MongoDB
    DB-->>API: Insertion confirmed
    API->>Doctor: Pusher WebSocket event (New Patient Triage)
    API-->>WM: HTTP 200 OK { success: true, syncedIds: [id1, id2] }

    Note over WM,LocalDB: 📍 PHASE 4: LOCAL STATE FINALIZATION
    WM->>LocalDB: UPDATE records SET synced = true WHERE id IN (syncedIds)
    LocalDB-->>WM: Confirmed
    WM-->>App: Broadcast Sync Complete
    App-->>ASHA: Status badge turns Green (Checkmark ✓)
```

---

## 🔒 Security & Data Persistence Guarantees

1. **App-Private Storage (Sandbox)**:
   - Data is stored in `/data/data/com.aarogya.ai/databases/` (SQLite) or Chromium's private IndexedDB.
   - Other apps (WhatsApp, File Manager, Gallery) cannot access or tamper with patient medical records.
2. **Crash & Reboot Resilient**:
   - Written to non-volatile flash storage. If the phone battery dies in a village, zero data is lost.
3. **Idempotent Sync (No Duplicate Records)**:
   - Each record has a client-generated UUID `v4`.
   - The cloud uses MongoDB `bulkWrite` with `upsert: true` matching on `client_id`, ensuring poor network reconnect retries never duplicate patient entries.
