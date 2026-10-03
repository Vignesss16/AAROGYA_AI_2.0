# 🏗️ Aarogya.AI v2 — Production & Scalable Technical Architecture

> **Executive Summary:**  
> Aarogya.AI is a multi-tier, offline-first rural health triage and tele-consultation platform. It bridges grassroots community health workers (ASHA) operating in **0G/low-bandwidth environments** with Primary Health Centres (PHCs), hospital command networks, and qualified medical doctors.

---

## 🖼️ Scalable Architecture Diagram

![Aarogya.AI v2 Production Architecture](./assets/aarogya_scalable_architecture_v2.png)

```mermaid
flowchart TB
    classDef client fill:#e0f2fe,stroke:#0284c7,stroke-width:2px,color:#0f172a
    classDef gateway fill:#fef3c7,stroke:#d97706,stroke-width:2px,color:#0f172a
    classDef service fill:#f3e8ff,stroke:#9333ea,stroke-width:2px,color:#0f172a
    classDef ai fill:#dcfce7,stroke:#16a34a,stroke-width:2px,color:#0f172a
    classDef db fill:#ffe4e6,stroke:#e11d48,stroke-width:2px,color:#0f172a
    classDef external fill:#f1f5f9,stroke:#64748b,stroke-width:2px,color:#0f172a

    subgraph Tier1 ["📱 TIER 1: MULTI-CHANNEL CLIENT & EDGE INGESTION"]
        direction LR
        AshaApp["👩‍⚕️ ASHA Worker App<br/>(Capacitor / Android)<br/>• Dexie.js / Room SQLite<br/>• Offline Rule Engine<br/>• WorkManager Sync"]:::client
        PatientPWA["📱 Patient Portal (PWA)<br/>• NextAuth (ABHA / Phone)<br/>• Symptom Checker UI"]:::client
        IVRUser["📞 Feature Phone User<br/>(0G Voice / Keypad)<br/>• Omnidimension AI IVR"]:::client
        DoctorPortal["💻 Doctor Web Portal<br/>• WebRTC Video Call<br/>• Live Triage Queue"]:::client
        HospitalAdmin["🖥️ Hospital Command<br/>• Real-Time Bed & SOS Map"]:::client
        PharmacyPortal["🏪 Pharmacist Portal<br/>• Medicine Inventory<br/>• RxNorm & CSV Search"]:::client
    end

    subgraph Tier2 ["🛡️ TIER 2: EDGE GATEWAY & SECURITY LAYER"]
        EdgeCDN["🌐 Cloudflare / Vercel Edge CDN<br/>(DDoS Protection, SSL Termination, Caching)"]:::gateway
        AuthModule["🔐 NextAuth.js RBAC Guard<br/>(JWT Claims: Patient | ASHA | Doctor | Pharmacist | Admin)"]:::gateway
        RateLimit["⚡ Edge Rate Limiter & Idempotency Cache<br/>(Redis / Upstash Token Bucket)"]:::gateway
    end

    subgraph Tier3 ["⚙️ TIER 3: SCALABLE BACKEND & API MICROSERVICES (Next.js 14/15)"]
        SyncAPI["🔄 Sync Engine (/api/sync)<br/>• Batch Processing<br/>• Client UUID De-duplication"]:::service
        TriageAPI["🩺 Clinical Triage API (/api/triage)<br/>• 3-Level Severity Scoring<br/>(Red / Yellow / Green)"]:::service
        WebRTCAPI["📹 Tele-Consult Engine<br/>• WebRTC Peer Signaling<br/>• Consultation Session Auth"]:::service
        EmergencyAPI["🚨 Emergency SOS (/api/sos)<br/>• Fast2SMS Broadcast<br/>• Geo-Location Ingestion"]:::service
        PharmaAPI["💊 Pharmacy & Inventory API<br/>• Generic Drug Mapping<br/>• Stock Availability Search"]:::service
    end

    subgraph Tier4 ["🧠 TIER 4: AI REASONING & REAL-TIME EVENT BUS"]
        GroqLLM["⚡ Groq Cloud LLaMA 3.3 (70B)<br/>• Ultra-low latency (<500ms)<br/>• Clinical Summaries & Triage Analysis"]:::ai
        WhisperASR["🎙️ Whisper Voice Engine<br/>• Speech-to-Text Transcription<br/>• Regional Dialect Processing"]:::ai
        PusherSockets["⚡ Pusher WebSockets Pub/Sub<br/>• Instant SOS Dispatch<br/>• Live Doctor Queue Updates<br/>• WebRTC Signaling"]:::ai
    end

    subgraph Tier5 ["🗄️ TIER 5: PERSISTENCE, STORAGE & STANDARDS"]
        MongoDB[("🍃 MongoDB Atlas (Master DB)<br/>• Sharded Replica Set<br/>• Patients, Triages, Consultations<br/>• Compound Indexes on (clientId, status)")]:::db
        BlobStorage[("📦 Encrypted Object Store<br/>(AWS S3 / Cloudinary)<br/>• Medical Scans & Audio Notes")]:::db
        ABDMGateway["🏛️ ABDM / FHIR Interoperability<br/>• ABHA ID Verification<br/>• FHIR Bundle Referral Mapper"]:::external
    end

    %% Client to Gateway
    AshaApp -->|1. Authenticated Sync Payload| EdgeCDN
    PatientPWA -->|Web Traffic| EdgeCDN
    IVRUser -->|Webhook JSON| EdgeCDN
    DoctorPortal -->|Web Traffic| EdgeCDN
    HospitalAdmin -->|Web Traffic| EdgeCDN
    PharmacyPortal -->|Web Traffic| EdgeCDN

    EdgeCDN --> AuthModule
    AuthModule --> RateLimit

    %% Gateway to API
    RateLimit --> SyncAPI
    RateLimit --> TriageAPI
    RateLimit --> WebRTCAPI
    RateLimit --> EmergencyAPI
    RateLimit --> PharmaAPI

    %% API to AI & Events
    TriageAPI <-->|AI Clinical Assessment| GroqLLM
    SyncAPI <-->|Batch AI Enrichment| GroqLLM
    EmergencyAPI -->|Trigger Emergency Alert| PusherSockets
    WebRTCAPI <-->|Signaling Exchange| PusherSockets
    PusherSockets -.->|Push to Doctor| DoctorPortal
    PusherSockets -.->|Push to Command Center| HospitalAdmin

    %% API to Storage
    SyncAPI -->|Bulk Upsert| MongoDB
    TriageAPI -->|Read/Write Records| MongoDB
    EmergencyAPI -->|Audit Log| MongoDB
    PharmaAPI -->|Query Stock / CSV| MongoDB
    SyncAPI -->|Save Attachments| BlobStorage

    %% Interoperability
    TriageAPI -.->|Emit FHIR Referral| ABDMGateway
```

---

## 🎯 The Feasible Engineering Approach (Why this actually works)

### 1. Edge-First Feasibility (No Over-engineering)
- **Do NOT run 8B LLMs on cheap Android phones**: Running on-device models drains phone battery in 20 minutes and crashes on 2GB RAM devices.
- **Feasible Solution**: The edge app runs a **deterministic clinical rule engine** (WHO / ICMR red-flag symptom score). It executes in <5ms, works completely offline, and saves the result to `Dexie.js` or SQLite.
- When network coverage is restored, the cloud handles deep contextual triage using **Groq LLaMA 3.3 70B** in <500ms.

### 2. Zero-Loss WhatsApp-style Sync
- Every offline checkup creates a record with a client-generated UUID (`uuidv4()`) and `synced: false`.
- Android's native **WorkManager** listens to the OS network constraint (`NetworkType.CONNECTED`). When 4G/Wi-Fi is detected, it triggers in the background.
- Next.js `/api/sync` runs an **Idempotent Bulk Upsert** (`bulkWrite` in MongoDB). Even if network cuts out mid-upload and the app retries 5 times, **no duplicates are ever created**.

### 3. Safe Medical Scope (SIH / Hackathon Rule Compliance)
- **No AI Drug Prescriptions**: Aarogya.AI **never prescribes unverified medicines**. The pharmacy tier is an **inventory search and generic substitution tool** (querying verified CSV and RxNorm databases for what local PHC stores actually carry).
- Prescriptions are strictly authored by licensed medical officers during the WebRTC consultation.

### 4. Telemedicine at Scale (Low-Bandwidth WebRTC)
- Standard WebRTC peer connections with **Pusher WebSockets** for signaling.
- Audio-only fallback mode if bandwidth drops below 50 kbps, ensuring consultations continue even over erratic 2G/3G connections in rural clinics.

---

## 📋 Eraser.io Architecture Code (Ready to Paste)

```text
// TIER 1: MULTI-CHANNEL CLIENTS
Clients [icon: users, color: blue] {
  ASHA Worker Mobile App (Capacitor + Dexie.js) [icon: smartphone]
  Patient PWA (NextAuth + ABHA) [icon: globe]
  Feature Phone IVR (Omnidimension Voice) [icon: phone-call]
  Doctor Web Portal (WebRTC Video) [icon: user-check]
  Hospital Command Center [icon: monitor]
  Pharmacist Inventory System [icon: package]
}

// TIER 2: GATEWAY & SECURITY
Edge Gateway [icon: shield, color: purple] {
  Cloudflare / Vercel Edge CDN [icon: cloud]
  NextAuth.js Multi-Role RBAC [icon: lock]
  Redis Token-Bucket Rate Limiter [icon: zap]
}

// TIER 3: APPLICATION MICROSERVICES
Next.js Core Backend [icon: cpu, color: green] {
  /api/sync Idempotent Batch Engine [icon: refresh-cw]
  /api/triage 3-Level Severity Scorer [icon: activity]
  WebRTC Peer Signaling Engine [icon: video]
  /api/sos Emergency Broadcast Service [icon: alert-triangle]
  Pharmacy Stock & RxNorm Search [icon: search]
}

// TIER 4: AI & REAL-TIME EVENT BUS
AI & Event Bus [icon: radio, color: amber] {
  Groq LLaMA 3.3 70B Engine (<500ms) [icon: cpu]
  Whisper Multi-Dialect Audio Transcriber [icon: mic]
  Pusher Real-Time WebSockets [icon: activity]
}

// TIER 5: DATA PERSISTENCE & COMPLIANCE
Data & Standards [icon: database, color: red] {
  MongoDB Atlas Master Cluster [icon: server]
  Encrypted S3 Medical Blob Store [icon: hard-drive]
  ABDM / FHIR Referral Gateway [icon: file-text]
}

// CONNECTIONS
Clients > Edge Gateway: HTTPS / WSS
Edge Gateway > Next.js Core Backend: Authenticated Request
Next.js Core Backend > AI & Event Bus: Async LLM & Real-Time Events
Next.js Core Backend > Data & Standards: Bulk Upsert & Interop
AI & Event Bus > Clients: Instant Push Notifications & Signaling
```
