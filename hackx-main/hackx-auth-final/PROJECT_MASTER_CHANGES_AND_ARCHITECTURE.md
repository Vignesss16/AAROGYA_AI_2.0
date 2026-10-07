# 🏥 AROGYA.AI — MASTER TECHNICAL ARCHITECTURE, IMPLEMENTATION & CHANGELOG
**Version:** 2.4.0 (Production & Local Evaluation Ready)  
**Last Updated:** October 2026  
**Repository Path:** `d:\MajorPRoject\ArogyaAi\hackx-main\hackx-auth-final`  
**Permanent Reference Document:** This file serves as the single source of truth for all architectural designs, implementation sequences, recent bug fixes, and presentation slides.

---

## 📑 TABLE OF CONTENTS
1. [Recent Codebase Bug Fixes & Improvements](#1-recent-codebase-bug-fixes--improvements)
2. [Slide Section 1: Technical Architecture Diagram](#2-slide-section-1-technical-architecture-diagram)
3. [Slide Section 2: Implementation & Data Journey Flow](#3-slide-section-2-implementation--data-journey-flow)
4. [Slide Section 3: What Makes Our Technical Approach Unique?](#4-slide-section-3-what-makes-our-technical-approach-unique)
5. [Slide Section 4: Tech Stack Matrix with Badges](#5-slide-section-4-tech-stack-matrix-with-badges)
6. [Mobile Strategy: PWA Prototype ➔ React Native Production](#6-mobile-strategy-pwa-prototype--react-native-production)
7. [Master ChatGPT Prompts for All Quadrants](#7-master-chatgpt-prompts-for-all-quadrants)
8. [Local Running & Testing Instructions](#8-local-running--testing-instructions)

---

## 1. Recent Codebase Bug Fixes & Improvements

| Issue / Feature | Root Cause | Fix Applied | Files Modified |
| :--- | :--- | :--- | :--- |
| **Hospital Dashboard Appointment Disappearing on Reload** | Strict substring regex filter on `q.hospital` dropped older records or records tagged as `"Civil Hospital"` / undefined facility. | Broadened SION Apex hospital (`HOSP-SION-001`) matching to include general/civil/untagged records; added `.lean()` and `Cache-Control: no-store`. | `app/hospital/page.tsx`<br/>`app/api/consultations/route.ts` |
| **Patient Lab Reports & Records Missing** | Phone lookup only matched exact strings, missing 10-digit clean digit variants for patient Vignesh (`8591292159`). | Upgraded `app/api/lab-orders/route.ts` and `app/api/consultations/my/route.ts` with fuzzy 10-digit clean regex matching and no-store headers. | `app/api/lab-orders/route.ts`<br/>`app/api/consultations/my/route.ts` |
| **Records Page React Child Render Crash** | Diagnostic tests array contained object items `{ name: "...", code: "BLD" }`. React crashed when rendering `🧪 {test}` as an object child. | Sanitized test names as string primitives (`typeof t === 'string' ? t : t.name`); linked both Lab Orders and Diagnostic Blood Tests. | `app/records/page.tsx` |
| **Next.js Hydration Mismatch in `HomePage`** | `localStorage` and `window` were read during initial SSR render pass, causing HTML mismatch with client-side cached user state. | Added `mounted` lifecycle state; deferred `localStorage` reads to `useEffect`; added `suppressHydrationWarning` to `<html>` and `<body>`. | `app/home/page.tsx`<br/>`app/layout.tsx` |
| **AI Engine Clarification** | Stack clarified from legacy placeholder references to actual Groq LPU API. | Confirmed Groq LPU (`openai/gpt-oss-120b` / `llama-3.3-70b-versatile`) + Groq Whisper-Large-v3 + Local Clinical CSV RAG. | `lib/ai-triage.ts` |
| **NextAuth Production URL & Secret Resilience** | NextAuth failed or misdirected in production if `NEXTAUTH_URL` was set to localhost instead of the live Vercel domain. | Added resilient fallback secret in `authOptions` and documented setting `NEXTAUTH_URL` to the live Vercel domain in Vercel settings. | `app/api/auth/[...nextauth]/route.ts` |
| **Nerul & Kharghar Hospitals Added** | Added two major Navi Mumbai hospitals: D. Y. Patil Multi-Specialty Hospital (Nerul) & Kharghar Super-Specialty Civil Hospital. | Added `HOSP-NERUL-007` & `HOSP-KHAR-008` with live OPD counters, passkeys, doctor queues, and catchment areas. | `app/api/facilities/route.ts`<br/>`app/hospital/login/page.tsx`<br/>`app/hospital/page.tsx`<br/>`app/api/consultations/route.ts` |
| **Hospital Isolation & Private Appointment Privacy** | Appointments booked with private doctors or across unrelated hospitals were leaking into general hospital dashboards (e.g. Patiala appearing on Nerul). | Enforced strict `facilityId` scoping in `facilityScopedQueue`, MongoDB facility upsert synchronization, and location-ranked discovery in `/confirm`. | `app/hospital/page.tsx`<br/>`app/api/facilities/route.ts`<br/>`app/confirm/page.tsx` |

---

## 2. Slide Section 1: Technical Architecture Diagram
*(Pure System Architecture — Zero Third-Party Brand Clutter in Diagram Blocks)*

```mermaid
graph TB
    %% STYLES
    classDef client fill:#e0f2fe,stroke:#0284c7,stroke-width:2px,color:#0369a1;
    classDef omni fill:#ffedd5,stroke:#ea580c,stroke-width:2px,color:#9a3412;
    classDef gateway fill:#fef3c7,stroke:#d97706,stroke-width:2px,color:#92400e;
    classDef ai fill:#f3e8ff,stroke:#7c3aed,stroke-width:2px,color:#5b21b6;
    classDef humanLoop fill:#dbeafe,stroke:#2563eb,stroke-width:2px,color:#1e40af;
    classDef redCase fill:#fee2e2,stroke:#dc2626,stroke-width:2px,color:#991b1b;
    classDef lab fill:#fef9c3,stroke:#ca8a04,stroke-width:2px,color:#854d0e;
    classDef realTime fill:#ede9fe,stroke:#6d28d9,stroke-width:2px,color:#4c1d95;
    classDef storage fill:#ecfdf5,stroke:#059669,stroke-width:2px,color:#065f46;

    %% 1. MULTI-MODAL INTAKE & PORTALS
    subgraph S1 [" 1. Multi-Modal Intake & Role Portals "]
        subgraph IntakeModes [" 👤 Patient Multi-Modal Channels "]
            V_IN["🎙️ Vernacular Voice Input"]:::client
            T_IN["⌨️ Multilingual Text Chat"]:::client
            ICON_IN["🩺 Visual Symptom Icon Grid"]:::client
            OMNI["📞 OmniDimension Voice Agent<br/>(Automates ~75% of IVR Triage & Follow-ups)"]:::omni
        end
        DOC["🩺 Senior Doctor Desk"]:::client
        JR_DOC["👨‍⚕️ Jr./Intern Doctor Desk<br/>(Human-in-the-Loop Triage Review)"]:::humanLoop
        HOSP["🏥 Hospital Admin Command"]:::client
        LAB["🧪 Diagnostic Lab Portal"]:::client
    end

    %% 2. API GATEWAY & SERVICES
    subgraph S2 [" 2. API Gateway & Microservices Engine "]
        AUTH["🔐 RBAC & Session Controller"]:::gateway
        TRIAGE_API["🤖 Clinical Triage Controller"]:::gateway
        QUEUE_API["📅 OPD Token & Queue Service"]:::gateway
        LAB_API["🔬 Diagnostic Lab Orders Service"]:::lab
        EMERG_API["🚨 Red-Case Emergency Dispatcher"]:::redCase
    end

    %% 3. 2-STEP AI GROUNDING
    subgraph S3 [" 3. 2-Step AI Intelligence & Grounding Engine "]
        STT["🎙️ Speech-to-Text & Dialect Normalizer"]:::ai
        subgraph TwoStepAI [" 🔬 2-Step Clinical Comparison Pipeline "]
            RAG["📚 Step 1: Local Verified Clinical RAG<br/>(Curated Protocols & Medical Dataset)"]:::ai
            WEB_LLM["🌐 Step 2: LLM + Medical Wikipedia / Web Compare<br/>(Hallucination-Check & Rare Symptom Grounding)"]:::ai
        end
        TRIAGE_SCORE["⚖️ Preliminary Urgency Scorer (Green / Yellow / Red)"]:::ai
    end

    %% 4. 2-STEP HUMAN-IN-THE-LOOP VERIFICATION
    subgraph S4 [" 4. 2-Step Verification & Clinical Override "]
        HITL_GATE["🛡️ Human-in-the-Loop Gate<br/>(Jr. Doctor / Intern / ASHA Review)"]:::humanLoop
        OVERRIDE["✏️ Modify Triage Level / Urgency / Department"]:::humanLoop
    end

    %% 5. RED EMERGENCY RESPONSE
    subgraph S5 [" 5. Critical Red-Case Emergency Response "]
        EMERG_PACKET["📦 Emergency Data Packet (GPS, Vitals, Phone)"]:::redCase
        ADMIN_ALERT["⚡ Live Admin Siren & Visual Beacon"]:::redCase
        ONE_CLICK["📞 1-Click Direct Phone Call to Patient"]:::redCase
        AMB["🚑 Instant GPS Ambulance Routing"]:::redCase
    end

    %% 6. REAL-TIME BUS & PERSISTENCE
    subgraph S6 [" 6. Event Bus & Document Vault "]
        EVENT_BUS["📡 WebSocket Event Bus (0ms Token Sync, Siren, Lab Alerts)"]:::realTime
        WEBRTC["📹 Encrypted P2P Telehealth Video Relay"]:::realTime
        DATABASE[("🗄️ Primary Clinical Database (EHR, Tokens, Lab Orders)")]:::storage
        MEDIA_VAULT["📁 Secure Medical Media Vault (Lab Reports & PDFs)"]:::storage
    end

    %% CONNECTIONS
    IntakeModes --> S2 --> AUTH --> TRIAGE_API --> STT
    STT --> RAG --> WEB_LLM --> TRIAGE_SCORE

    %% VERIFICATION GATE
    TRIAGE_SCORE --> HITL_GATE
    JR_DOC <-->|Review & Optional Override| HITL_GATE
    HITL_GATE --> OVERRIDE

    %% RED EMERGENCY PATH
    OVERRIDE -- "🔴 RED: Critical / Trauma" --> EMERG_API
    EMERG_API --> EMERG_PACKET --> EVENT_BUS
    EVENT_BUS --> HOSP
    HOSP --> ADMIN_ALERT --> ONE_CLICK
    ADMIN_ALERT --> AMB

    %% GREEN/YELLOW OPD PATH
    OVERRIDE -- "🟢/🟡 Routine or Urgent" --> QUEUE_API
    QUEUE_API --> DATABASE
    QUEUE_API --> EVENT_BUS
    EVENT_BUS --> HOSP
    EVENT_BUS --> DOC

    %% DOCTOR TELECONSULT & LAB FLOW
    DOC <-->|HD Video Teleconsult| WEBRTC <--> IntakeModes
    DOC -->|Prescribe Lab Tests| LAB_API --> DATABASE
    LAB_API --> EVENT_BUS --> LAB
    LAB -->|Upload Certified Reports| MEDIA_VAULT
    MEDIA_VAULT -.->|Sync URL| DATABASE --> IntakeModes
```

---

## 3. Slide Section 2: Implementation & Data Journey Flow

```mermaid
sequenceDiagram
    autonumber
    actor Patient as 👤 Patient (Voice / Text / Icons / Call)
    participant AI as 🧠 2-Step AI Comparison (RAG + Web)
    actor JrDoc as 👨‍⚕️ Jr./Intern Doctor (Verification)
    actor Admin as 🚨 Hospital Admin Command
    actor Doc as 🩺 Senior Doctor Desk
    actor Lab as 🧪 Diagnostic Lab
    participant DB as 💾 Database & Vault

    %% STAGE 1: INTAKE & 2-STEP AI COMPARISON
    Note over Patient,AI: Stage 1: Intake & 2-Step AI Comparison
    Patient->>AI: Submits symptoms (Voice/Text/Icons or Phone Call)
    AI->>AI: Step 1: Query Local Verified Clinical RAG
    AI->>AI: Step 2: Cross-compare with LLM / Medical Wikipedia & Live Web
    AI-->>JrDoc: Generate Preliminary Assessment & Urgency Score

    %% STAGE 2: 2-STEP VERIFICATION GATE
    Note over JrDoc,Admin: Stage 2: 2-Step Human-in-the-Loop Review
    JrDoc->>JrDoc: Reviews AI reasoning; can OVERRIDE urgency (e.g., Green ➔ Red)
    
    %% BRANCH A: RED CRITICAL EMERGENCY
    alt 🔴 RED CASE: Severe Emergency (Cardiac, Stroke, Trauma)
        JrDoc->>Admin: 🚨 Verified Emergency Signal dispatched
        Admin->>Patient: 📞 1-Click Direct Phone Call to Patient / Bystander
        Admin->>Patient: 🚑 GPS Ambulance Dispatched & ICU Bed Reserved
    
    %% BRANCH B: ROUTINE OPD & LAB FLOW
    else 🟢/🟡 GREEN or YELLOW: Standard OPD & Diagnostic Testing
        JrDoc->>DB: Lock Triage & Issue Live Token (#OPD-XXX)
        DB->>Admin: ⚡ Instant Token visible on Hospital Reception Dashboard
        Doc->>Patient: Conduct Encrypted WebRTC Video Consultation
        Doc->>DB: Prescribe Medications & Order Diagnostic Lab Tests
        
        %% LAB FULFILLMENT
        DB->>Lab: Order appears on Diagnostic Lab Portal
        Lab->>DB: Updates status ("Sample Collected" ➔ "Report Uploaded")
        DB->>Patient: 🔔 Instant Sync to Health Records (/records)
    end
```

---

## 4. Slide Section 3: What Makes Our Technical Approach Unique?

1. **🔬 2-Step AI Grounding & Comparison (RAG + Medical Wikipedia/Web):**
   - Eliminates AI hallucinations by cross-verifying patient symptoms in two steps: first against our **curated clinical RAG database**, and secondly against **live medical knowledge & medical Wikipedia sources** before calculating triage score.
2. **🛡️ 2-Step Human-in-the-Loop Clinical Verification:**
   - AI never acts as an unchecked final authority. Every AI-generated triage assessment and urgency score can be **reviewed, refined, or overridden by a Junior/Intern Doctor or ASHA supervisor** before final hospital routing.
3. **📞 OmniDimension Voice Agent (75% Automation):**
   - Conversational voice AI that handles ~75% of operations: telephone IVR triage, autonomous OPD slot booking, outbound post-consultation follow-ups, and medicine reminders.
4. **🚨 Zero-Latency Red-Case Emergency Protocol:**
   - Detects critical conditions in real time, bypassing queues to send an emergency packet (GPS coordinates, vitals, phone) to the Hospital Command Center for **1-click direct patient calling and instant ambulance dispatch**.
5. **🧪 Integrated Closed-Loop Diagnostic Lab Ecosystem:**
   - Prescriptions made during teleconsultations directly generate orders on diagnostic lab portals, supporting sample tracking and instant PDF report sync to patient health records.
6. **📱 Offline-First PWA with React Native Scale:**
   - Built as an offline-first **Progressive Web App (PWA)** for zero install friction in 2G rural areas, ready for seamless production transition to **React Native** (BLE medical sensors & background GPS).

---

## 5. Slide Section 4: Tech Stack Matrix with Badges

| Category | Technology & Component | Architectural Role | Official Badge |
| :--- | :--- | :--- | :--- |
| **Voice & Telephony AI** | **OmniDimension Voice AI** | Conversational voice calls, telephone IVR triage, automated follow-up calls (~75% automation) | ![Voice AI](https://img.shields.io/badge/OmniDimension-Voice_Agent-FF6B00?style=for-the-badge&logo=soundcharts&logoColor=white) |
| **AI Inference & Speech** | **Groq LPU (GPT-OSS-120B / LLaMA) + Groq Whisper-v3** | Sub-second symptom triage, vernacular speech-to-text, clinical department routing | ![Groq](https://img.shields.io/badge/Groq_LPU-F55036?style=for-the-badge&logo=groq&logoColor=white) ![Whisper](https://img.shields.io/badge/Whisper_v3-412991?style=for-the-badge&logo=openai&logoColor=white) |
| **2-Step AI Grounding** | **Clinical RAG + Medical Wikipedia / Web** | Dual-source symptom verification: cross-references local clinical guidelines with external medical databases to eliminate hallucinations | ![RAG](https://img.shields.io/badge/Clinical_RAG-Grounding-7C3AED?style=for-the-badge&logo=probot&logoColor=white) |
| **Mobile Client Strategy** | **PWA (Prototype) ➔ React Native (Roadmap)** | **Phase 1 (PWA):** Offline Service Workers, 2G resilience, zero install friction.<br/>**Phase 2 (React Native):** Native BLE medical sensors, background GPS, lockscreen SOS. | ![PWA](https://img.shields.io/badge/Prototype-PWA-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white) ➔ ![React Native](https://img.shields.io/badge/Roadmap-React_Native-61DAFB?style=for-the-badge&logo=react&logoColor=black) |
| **Web & API Gateway** | **Next.js 14 + TypeScript** | Serverless API routes, App Router, strict type-safe clinical models | ![Next.js](https://img.shields.io/badge/Next.js_14-000000?style=for-the-badge&logo=nextdotjs&logoColor=white) ![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white) |
| **Database & Real-Time** | **MongoDB Atlas + Pusher WebSockets** | Document EHR store, 0ms live token counters, and emergency siren broadcasts | ![MongoDB](https://img.shields.io/badge/MongoDB_Atlas-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white) ![Pusher](https://img.shields.io/badge/Pusher_WebSockets-300D4F?style=for-the-badge&logo=pusher&logoColor=white) |
| **Teleconsult & Vault** | **Daily.co (WebRTC) + Cloudinary CDN** | Encrypted peer-to-peer video rooms and secure cloud storage for lab reports/PDFs | ![WebRTC](https://img.shields.io/badge/Daily.co_WebRTC-3399FF?style=for-the-badge&logo=webrtc&logoColor=white) ![Cloudinary](https://img.shields.io/badge/Cloudinary-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white) |

---

## 6. Mobile Strategy: PWA Prototype ➔ React Native Production

### Why PWA for Phase 1 (Working Prototype):
- **Zero Install Friction:** Patients in rural areas with low phone storage or poor internet can open the full app instantly via link/QR.
- **Offline-First Service Workers:** Caches patient EHR, previous prescriptions, and emergency helpline numbers in IndexedDB/CacheStorage for offline operation.
- **Unified Cross-Platform Codebase:** Single responsive Next.js frontend runs across Android, iOS, tablets, and desktop.

### Why React Native for Phase 2 (Production Scale):
- **Native Bluetooth Low Energy (BLE):** Direct hardware pairing with digital stethoscopes, pulse oximeters (SpO2), BP monitors, and 12-lead ECG patches.
- **Background Continuous GPS:** Enables real-time moving ambulance tracking even when the app is minimized.
- **Hardware SOS Hotkeys:** Trigger emergency SOS by double-pressing the physical power button when the phone is locked.
- **Zero Backend Rewrite:** Because our Next.js API Gateway, MongoDB, Groq AI, and Pusher WebSockets are headless REST/WebSocket microservices, the React Native app plugs in with 100% backend reuse.

---

## 7. Master ChatGPT Prompts for All Quadrants

```text
Act as a Principal Healthcare Systems Architect and Pitch Coach.

I am preparing the "Technical Approach" slide for "Arogya AI" (SIH Hackathon).

Generate the 4 complete slide sections:
1. Pure System Architecture Diagram (Mermaid) with Multi-Modal intake (Voice, Text, Visual Icons, OmniDimension Voice Agent 75% automation), 2-Step AI Grounding (RAG + Medical Wikipedia), 2-Step Clinical Verification (Jr Doctor override), Red-Case Emergency Dispatch (1-click calling + GPS ambulance), Doctor Teleconsult Desk, and Prescribed Lab Diagnostics.
2. Implementation Flow Diagram (Mermaid sequence) showing the end-to-end data journey.
3. 5 High-Impact Bullet Points for "WHAT MAKES OUR TECHNICAL APPROACH UNIQUE ??".
4. Tech Stack Table with Shields.io badges, explaining PWA prototype vs React Native roadmap.
```

---

## 8. Local Running & Testing Instructions

To run and evaluate the application locally without pushing or deploying to Vercel:

```bash
# Navigate to the project directory
cd d:\MajorPRoject\ArogyaAi\hackx-main\hackx-auth-final

# Verify TypeScript types
npx tsc --noEmit

# Start the local development server
npm run dev
```

- **Local Web App:** `http://localhost:3000`
- **Patient Dashboard & Triage:** `http://localhost:3000/home`
- **Hospital Admin & Emergency Command:** `http://localhost:3000/hospital`
- **Doctor Teleconsult Desk:** `http://localhost:3000/doctor/dashboard`
- **Diagnostic Lab Portal:** `http://localhost:3000/lab/dashboard`
- **Patient Health Records:** `http://localhost:3000/records`
