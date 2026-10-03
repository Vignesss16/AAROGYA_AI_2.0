# 🏥 SMART INDIA HACKATHON 2025 — TECHNICAL APPROACH DIAGRAM

**Team Name:** Aarogya.AI (आरोग्य एआई)  
**Slide Title:** TECHNICAL APPROACH FLOWCHART & WIREFRAME  

---

## 🖼️ 1. Slide Layout Wireframe (ASCII Diagram)

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                               TECHNICAL APPROACH                                          [SIH 2025 LOGO]              │
├─────────────────────┬──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ [TEAM LOGO]         │  (👤) Patient / ASHA Input ──➔ (⚙️) Edge Gateway & Connectivity Check                                                            │
│ Aarogya.AI          │  [16-Icons / Voice / Vitals]    [Auto-detects Online vs 0G/2G Offline]                                                           │
│                     │                                              │                                                                                   │
│ Techstack Used:     │                   ┌──────────────────────────┴──────────────────────────┐                                                        │
│ 1. Next.js 14 App   │                   ▼ [If Offline (0G/2G)]                                ▼ [If Online / Synced]                                   │
│    Router & React 18│       ┌───────────────────────────────┐                     ┌───────────────────────────────┐                                    │
│ 2. Groq LLaMA 3.3   │       │   Offline Engine (Dexie.js)   │                     │     Process Patient Input     │                                    │
│    70B (AI Triage)  │       │ • IndexedDB Local Storage     │                     │ • Clean & Format Symptoms     │                                    │
│ 3. Dexie.js (PWA    │       │ • Offline Triage Fallback     │                     │ • Check Illness Duration      │                                    │
│    IndexedDB Edge)  │       │ • Auto-Sync on Reconnect      │                     │ • Check Medical History       │                                    │
│ 4. MongoDB Atlas &  │       └───────────────┬───────────────┘                     └───────────────┬───────────────┘                                    │
│    Mongoose 8.23    │                       └──────────────────────────────┬──────────────────────┘                                                    │
│ 5. WebRTC & TURN    │                                                      ▼                                                                           │
│    (OpenRelay P2P)  │                         ┌──────────────────────────────────────────────────────────┐                                             │
│ 6. Pusher WebSockets│                         │                     AI & DIAGNOSTIC HUB                  │                                             │
│    (Real-time Push) │                         │  ┌─────────────────────────┐  ┌───────────────────────┐  │                                             │
│ 7. Leaflet / GIS    │                         │  │ AI Clinical Triage      │  │ Diagnostic Analyzer   │  │                                             │
│    (OpenStreetMap)  │                         │  │ • Local Indian RAG CSV  │  │ • Point-of-Care Flags │  │                                             │
│ 8. ABDM & HL7 FHIR  │                         │  │ • Groq LLaMA 3.3 70B    │  │ • Hb%, Sugar, SpO2,   │  │                                             │
│    (Standardization)│                         │  │ • Wikipedia Verifier    │  │   Dengue/Malaria Rapid│  │                                             │
│                     │                         │  └─────────────────────────┘  └───────────────────────┘  │                                             │
│ [Tech Badges]       │                         └────────────────────────────┬─────────────────────────────┘                                             │
│ Next.js · Groq      │                                                      │                                                                           │
│ MongoDB · WebRTC    │                        ┌─────────────────────────────┼─────────────────────────────┐                                             │
│ Pusher · Dexie      │                        ▼ [RED - Emergency]           ▼ [YELLOW - Moderate Risk]    ▼ [GREEN - Mild/Routine]                      │
│                     │             ┌──────────────────────┐      ┌──────────────────────┐      ┌──────────────────────┐                                 │
│ Prototype Link:     │             │ 🚨 Immediate Alert   │      │ 🩺 Assisted Telemed  │      │ 🌿 Local Care & Meds │      ┌────────────────────────┐ │
│ 🔗 Live Web App     │             │ • Instant Pusher Push│      │ • WebRTC Video Call  │      │ • Bilingual Home-Care│      │ Continuous Care Loop   │ │
│                     │             │ • Doctor Dashboard   │      │   with Doctor (TURN) │   ┌──┤ • Leaflet GIS Map of │      │ ┌────────────────────┐ │ │
│ Video Demo Link:    │             │   Blinking Animation │      │ • E-Prescription Gen │   │  │   Jan Aushadhi Stores│      │ │ Longitudinal ABHA  │ │ │
│ ▶️ YouTube Video    │             │ • Hospital Emergency │      │ • SC ➔ PHC ➔ DH      │   │  │ • Medicine Tracking  │      │ │ Health Record      │ │ │
│                     │             │   Escalation         │      │   Closed-Loop Refer  │   │  └──────────────────────┘      │ ├────────────────────┤ │ │
│                     │             └──────────┬───────────┘      └──────────┬───────────┘   │                                │ │ Closed-Loop        │ │ │
│                     │                        │                             │               │                                │ │ Referral Tracking  │ │ │
│                     │                        └──────────────────────┬──────┴───────────────┘                                │ ├────────────────────┤ │ │
│                     │                                               ▼                                                       │ │ High-Risk Follow-up│ │ │
│                     │                                   ┌───────────────────────────────┐                                   │ │ (ANC/PNC & NCDs)   │ │ │
│                     │                                   │ Interoperable Health Record   │──────────────────────────────────➔│ ├────────────────────┤ │ │
│                     │                                   │ • Approved Standards (ABDM)   │                                   │ │ Epidemic Heatmaps  │ │ │
│                     │                                   │ • Longitudinal Record (ABHA)  │                                   │ │ & Quality Monitor  │ │ │
│                     │                                   └───────────────────────────────┘                                   │ └────────────────────┘ │ │
│                     │                                                                                                       └────────────────────────┘ │
├─────────────────────┴──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ @SIH Idea submission- Template                                                                                                                Slide 04 │
└────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📐 2. Renderable Mermaid Flowchart Diagram

```mermaid
flowchart TD
    %% ─────────────────────────────────────────────────────────────
    %% STAGE 1: INPUT & EDGE GATEWAY
    %% ─────────────────────────────────────────────────────────────
    USER["👤 Patient / ASHA Field Worker\n(16-Icon Tap, IVR Voice, or Vitals)"] 
    --> GATEWAY{"🌐 Connectivity Check\n(Online vs Offline 0G/2G)"}

    %% Offline Branch
    GATEWAY -- "Offline (0G/2G)" --> DEXIE["💾 Edge Engine (Dexie.js / IndexedDB)\n• Local Symptom & Medicine DB\n• Offline Fallback Triage\n• Transactional Sync Queue"]
    DEXIE -- "Auto-Sync on Reconnect" --> EXTRACT

    %% Online Branch
    GATEWAY -- "Online" --> EXTRACT["⚙️ Process Patient Input\n• Clean & Format Symptoms (Voice/Hindi)\n• Check Illness Duration (Days Sick)\n• Check Existing Medical History"]

    %% ─────────────────────────────────────────────────────────────
    %% STAGE 2: AI & DIAGNOSTIC ANALYSIS HUB
    %% ─────────────────────────────────────────────────────────────
    EXTRACT --> HUB

    subgraph HUB["🧠 Intelligent Triage & Diagnostic Hub"]
        direction TB
        subgraph AI_BOX["AI Clinical Triage Engine"]
            RAG["Local Indian RAG\n(Diseases_Symptoms.csv)"]
            LLM["Groq LLaMA 3.3 70B\nDual-Pass Clinical Reasoning"]
            WIKI["Wikipedia Search API\nAnti-Hallucination Verifier"]
            RAG --> LLM --> WIKI
        end

        subgraph DIAG_BOX["Point-of-Care Diagnostics"]
            TESTS["Critical Value Detection\n• Hb% Anemia Flag\n• Blood Sugar (Fasting/Random)\n• Malaria Rapid / Dengue NS1\n• SpO2 & BP Vitals"]
        end
    end

    %% ─────────────────────────────────────────────────────────────
    %% STAGE 3: MULTI-BRANCH TRIAGE DECISIONS
    %% ─────────────────────────────────────────────────────────────
    HUB -- "🔴 RED: Critical / Emergency" --> RED_ACTION["🚨 Immediate Emergency Escalation\n• Instant Pusher WebSocket Push\n• Doctor Dashboard Blinking Alert\n• SOS Broadcast to Nearest CHC/Hospital"]
    
    HUB -- "🟡 YELLOW: Moderate Risk / Referral" --> YEL_ACTION["🩺 Assisted Teleconsultation & Referral\n• WebRTC P2P Video Call (TURN Relays)\n• Doctor Voice Transcription & E-Prescription\n• Sub-Centre ➔ PHC ➔ DH Digital Referral"]
    
    HUB -- "🟢 GREEN: Mild / Routine" --> GRN_ACTION["🌿 Local Care & Medicine Discovery\n• Bilingual Home Care Guidance\n• Leaflet GIS Map of Open Jan Aushadhi Stores\n• Medicine Tracking & Real-Time Stock Alerts"]

    %% ─────────────────────────────────────────────────────────────
    %% STAGE 4: CONTINUOUS CARE & ABDM GOVERNANCE LOOP
    %% ─────────────────────────────────────────────────────────────
    RED_ACTION --> ABDM_BRIDGE["📄 Interoperable Health Record (Approved Standards)\n• Longitudinal Patient Record (ABHA Linked)\n• Information Continuity Across Facilities"]
    YEL_ACTION --> ABDM_BRIDGE
    GRN_ACTION -.-> ABDM_BRIDGE

    ABDM_BRIDGE --> FEEDBACK

    subgraph FEEDBACK["🔄 Continuous Care & Public Health Loop"]
        F1["🆔 ABHA-Linked Longitudinal Record"]
        F2["🔁 Closed-Loop Referral Tracking\n(Zero Patient Drop-Off across Tiers)"]
        F3["🤰 High-Risk Follow-Up\n(Maternal ANC/PNC & Chronic NCDs)"]
        F4["📊 Facility Quality & Outbreak Surveillance\n(8-Tile Hospital KPI Dashboard)"]
        F1 --- F2 --- F3 --- F4
    end
```
