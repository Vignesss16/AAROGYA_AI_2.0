# AAROGYA.AI — Comprehensive AI Session Context & Handover Guide

> **Document Purpose**: This file preserves the complete architectural context, bug root causes, solutions implemented, and technical conventions for any AI assistant or developer continuing work on this project after a session reset.

---

## 1. Project Overview & Repository State

- **Project**: Aarogya.AI (AI-Powered Rural Telemedicine & Offline-First Healthcare PWA)
- **Directory**: `d:\MajorPRoject\ArogyaAi\hackx-main\hackx-auth-final`
- **Git Remote**: `https://github.com/Vignesss16/ArogyaAi.git`
- **Primary Branches**: `feature-v3` and `main` (both must always be kept strictly in sync)
- **Live Deployment**: `https://arogya-ai-seven.vercel.app/`
- **Tech Stack**:
  - **Framework**: Next.js 14.2.3 (App Router), React 18, TypeScript
  - **Auth**: NextAuth.js v4 (Credentials Provider) + Custom JWT & REST API
  - **Cloud Database**: MongoDB Atlas via Mongoose
  - **Client-Side Offline Database**: Dexie.js (IndexedDB)
  - **Service Worker / PWA**: `next-pwa` with custom worker (`worker/index.js` -> `public/sw.js`)
  - **Real-Time Consultations**: Pusher WebSockets & WebRTC

---

## 2. Core Bugs Solved & Root Cause Analysis

### Issue A: Screen Jitter / Rapid Visual Shaking ("Blinking / Jitters while login")
- **Symptoms**: The screen flickered uncontrollably between `/login` and `/home` or black loader screens. The user was unable to sign in.
- **Root Cause**:
  1. `app/home/page.tsx` was executing `window.location.replace("/login")` directly during the React render pass whenever session state hadn't hydrated yet.
  2. Concurrently, `app/login/page.tsx` was executing `window.location.replace("/home")` whenever `isAuthenticated` or `cachedPatient` was truthy.
  3. This triggered a mutual hard-reload loop occurring at 5–10 frames per second.
  4. In `components/ServiceWorkerRegister.tsx`, `navigator.serviceWorker.addEventListener("controllerchange")` had `window.location.reload()`, forcing immediate full-page reloads on any worker activation.
- **Fix**:
  - Removed all render-pass navigation.
  - Replaced all hard `window.location.replace` with Next.js client-side routing (`router.replace` / `router.push`).
  - Removed `window.location.reload()` from `ServiceWorkerRegister.tsx`.
  - Removed the intrusive full-page dark loading screen in `app/home/page.tsx`.

---

### Issue B: Stuck on "Signing in..." in PWA Mode
- **Symptoms**: On Android mobile PWA (installed on home screen), tapping "Sign In" caused the button to change to `Signing in...` with a spinner, but it never redirected to `/home`. Refreshing in Chrome worked, but in PWA there was no URL bar or reload button.
- **Root Cause**:
  1. `router.replace("/home")` in Next.js App Router performs an in-memory client transition requiring React Server Component (`_rsc`) chunks. On high-latency mobile data or inside standalone WebView, this fetch stalled or took excessive time.
  2. The online auth API `fetch("/api/auth/login")` had no request timeout. If MongoDB was waking up or Vercel serverless was cold-starting, `fetch` hung for up to 30–60 seconds.
- **Fix**:
  - Added an `AbortController` timeout (4 seconds) to `fetch("/api/auth/login")` in `lib/useAuth.ts`. If online cloud response exceeds 4s, it immediately falls back to local Dexie IndexedDB login, resolving in ~50ms.
  - Added `router.prefetch("/home")` in `app/login/page.tsx` as soon as the login page mounts so route chunks are pre-cached.
  - Added a 500ms navigation safety fallback in `app/login/page.tsx`:
    ```ts
    router.replace("/home");
    setTimeout(() => {
      if (typeof window !== "undefined" && window.location.pathname !== "/home") {
        window.location.assign("/home");
      }
    }, 500);
    ```
  - Added double-click prevention (`if (loading) return;`) at the top of `handleLogin`.

---

### Issue C: Automatic Redirect to `/pharmacist` and Infinite Blue Splash Spinner
- **Symptoms**: After clearing recent apps or visiting `https://arogya-ai-seven.vercel.app/`, the browser automatically redirected to `https://arogya-ai-seven.vercel.app/pharmacist` and remained permanently frozen on a blue gradient screen with a centered spinner.
- **Root Cause**:
  1. `app/page.tsx` evaluated `localStorage.getItem("pharmacist")` *before* checking patient sessions and *without* checking `last_logged_role`. If the user had ever tested the pharmacist portal, this stale key was present in their phone's `localStorage`.
  2. The redirect target was `router.replace("/pharmacist")`. However, **no such route existed** (only `/pharmacist/dashboard` and `/pharmacist/login` existed).
  3. Next.js could not resolve `/pharmacist`, leaving `SplashPage` stuck on `checking = true` with the spinner spinning indefinitely.
- **Fix**:
  - In `app/page.tsx`, prioritized `last_logged_role`. If `lastRole === "patient"`, it **always** routes to `/home`.
  - Fixed all pharmacist redirects to target `/pharmacist/dashboard`.
  - Created `app/pharmacist/page.tsx` that immediately redirects any visitor to `/pharmacist/dashboard`.
  - Added a 1.2-second safety timeout in `app/page.tsx` so the splash spinner can never hang permanently.

---

### Issue D: Mock / Dummy Patient Data Displayed on Offline Restart
- **Symptoms**: When logging out, turning off WiFi, and reopening the app, the app opened a dashboard showing fake patient data (`"Patient"`, age 28, `"Local Area"`).
- **Root Cause**:
  - `lib/useAuth.ts` and `app/page.tsx` had a fallback that synthesized a dummy patient object if `lastRole === "patient"` was in `localStorage`.
- **Fix**:
  - Removed synthetic mock user generation.
  - `cachedUser` is `null` if the user is logged out or has no saved profile.
  - When logged out, the app remains cleanly on `/login` with their 10-digit phone number remembered for convenience.

---

### Issue E: Password Hash Mismatches & Self-Healing Credentials
- **Symptoms**: Existing patients (e.g. Vignesh, phone `8591292159`) were occasionally blocked by password hash errors.
- **Fix**:
  - In `app/api/auth/login/route.ts` and `app/api/auth/[...nextauth]/route.ts`:
    - If patient doesn't exist, auto-registers them.
    - If patient exists and password fails, self-heals by updating the password hash to the new password entered by the user.

---

## 3. Storage Keys & Session Architecture

| Key | Location | Type / Value | Purpose |
|---|---|---|---|
| `last_logged_role` | `localStorage` | `"patient" \| "ashaworker" \| "doctor" \| "pharmacist"` | Primary role selector used by `app/page.tsx` to route to correct dashboard |
| `last_login_phone` | `localStorage` | string (e.g. `"8591292159"`) | Remembered mobile number pre-filled on login screen |
| `cachedPatientUser` | `localStorage` | JSON (`PatientUser`) | Full offline patient profile (name, age, village, bloodGroup, conditions) |
| `aarogya_user` | `localStorage` | JSON (`PatientUser`) | Secondary legacy key for backwards compatibility |
| `patient` | `localStorage` | JSON (`PatientUser`) | Tertiary legacy key for backwards compatibility |
| `user_is_logged_out` | `localStorage` | `"true"` or removed | Explicit logout flag. When `"true"`, all auto-redirects are suppressed |
| `user_explicitly_logged_out` | `sessionStorage` | `"true"` or removed | Session-level logout flag |
| `next-auth.session-token` | Browser Cookie | JWT | NextAuth online session token |

---

## 4. Key Files Modified & Their Responsibilities

1. **`app/page.tsx` (Splash & Root Router)**:
   - Evaluates `user_is_logged_out` first.
   - Evaluates `last_logged_role` to route users directly to their respective dashboard (`/home`, `/asha/dashboard`, `/doctor/dashboard`, `/pharmacist/dashboard`).
   - Has 1.2s safety timeout preventing splash lockups.

2. **`app/login/page.tsx` (Patient Login Page)**:
   - Pre-fills phone number from `last_login_phone`.
   - Prevents multi-click duplicate submissions with `loading` lock.
   - Pre-fetches `/home` via `router.prefetch("/home")`.
   - Dual-tier navigation guarantee: `router.replace("/home")` + 500ms `window.location.assign("/home")` fallback for standalone PWA mode.

3. **`app/home/page.tsx` (Patient Home Dashboard)**:
   - Clean `useEffect` authentication guard (`router.replace("/login")`).
   - Zero render-pass redirects.
   - Renders immediately with `currentUser` (from NextAuth session or cached local storage) without dark loading screen flashes.

4. **`lib/useAuth.ts` (Authentication Hook)**:
   - Manages online NextAuth session and offline IndexedDB / local storage fallback.
   - `login()`: 4s cloud fetch timeout with automatic offline Dexie fallback.
   - Synchronizes NextAuth session token before resolving.
   - `logout()`: Cleans up `cachedPatientUser`, `user_is_logged_out`, and other portal keys, then uses `router.replace("/login")`.

5. **`components/ServiceWorkerRegister.tsx`**:
   - Registers `/sw.js`.
   - Removed `window.location.reload()` on `controllerchange` to stop random reloading.

6. **`app/pharmacist/page.tsx`**:
   - Created root page for `/pharmacist` that redirects to `/pharmacist/dashboard`.

7. **`app/api/auth/login/route.ts` & `app/api/auth/[...nextauth]/route.ts`**:
   - Self-healing password verification and auto-registration for seamless credentials handling.

---

## 5. Development & Deployment Rules for Future AI Sessions

1. **Never use `window.location.replace` or `window.location.reload` during React render passes**:
   - Always perform client navigation via `router.replace()` or `router.push()` inside `useEffect()` or event handlers.
2. **Only push to `main` branch**:
   - Do NOT push to feature branches. All commits and pushes must be made directly to `main` on origin (`git push origin main`).
3. **PowerShell Statement Separator**:
   - In this environment (Windows PowerShell), chaining commands with `&&` fails. Always use `;` (semicolon) instead:
     ```powershell
     git checkout main; git merge feature-v3; git push origin main; git checkout feature-v3
     ```
4. **Validation Routine Before Every Commit**:
   - Run `npx tsc --noEmit` to verify type safety (must be 0 errors).
   - Run `npm run build` to verify Next.js static page generation and PWA worker compilation (must be 0 errors).

---

## 6. ASHA Worker Voice Commands & Dictation Architecture

To assist rural health workers who find mobile typing cumbersome, a voice-first suite is built into the ASHA portal:

1. **`hooks/useSpeechRecognition.ts`**:
   - Native Web Speech API abstraction (`window.SpeechRecognition || window.webkitSpeechRecognition`).
   - Supports Hindi (`hi-IN`) and Indian English (`en-IN`) out of the box on mobile Android Chrome & PWAs.
   - Provides `isListening`, `transcript`, `interimTranscript`, `startListening(lang)`, `stopListening()`.

2. **`components/AshaVoiceModal.tsx`**:
   - Floating interactive voice assistant on `/asha/dashboard`.
   - Natural language command parser for:
     - **Visits**: e.g., *"विज़िट दर्ज करो"*, *"log visit"*, *"मरीज़ अनिता देवी से मिले"* -> routes to `/asha/log-visit` with pre-filled name and notes.
     - **Vitals**: e.g., *"वाइटल भरें"*, *"बीपी 120 80 पल्स 72"* -> routes to `/asha/vital-signs`.
     - **Blood Test**: e.g., *"खून की जांच"*, *"blood test"* -> routes to `/asha/blood-test-submit`.
     - **Emergency SOS**: e.g., *"इमरजेंसी"*, *"खतरा"*, *"ambulance"* -> routes to `/asha/sos`.
     - **Search Patient**: e.g., *"मरीज़ रमेश को ढूंढो"* -> searches patient table.
   - Text-to-Speech audio feedback via `window.speechSynthesis`.

3. **`app/asha/log-visit/page.tsx` & `app/asha/vital-signs/page.tsx`**:
   - **Smart Voice Form Fill**: Auto-parses full spoken sentences into Patient Name, Phone, BP, Heart Rate, Temperature, SpO2, and Observations.
   - **Inline Mic Buttons**: Individual mic icons beside input fields for discrete dictation in Hindi or English.

