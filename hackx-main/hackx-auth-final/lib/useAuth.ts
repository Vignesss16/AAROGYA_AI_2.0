"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export interface PatientUser {
  _id:        string;
  phone:      string;
  name:       string;
  age:        number;
  gender:     string;
  village:    string;
  conditions: string[];
  bloodGroup?: string;
  role:       string;
  abhaAddress?: string;
  abhaLinked?: boolean;
}

/** Drop-in replacement for the old custom useAuth hook, now backed by NextAuth + offline fallback. */
export function useAuth() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [cachedUser, setCachedUser] = useState<PatientUser | null>(() => {
    if (typeof window !== "undefined") {
      // If user explicitly logged out, respect this decision across app restarts
      if (localStorage.getItem("user_is_logged_out") === "true") {
        return null;
      }
      const stored = localStorage.getItem("cachedPatientUser") || localStorage.getItem("aarogya_user") || localStorage.getItem("patient");
      if (stored) {
        try { return JSON.parse(stored); } catch {}
      }
      // If no valid cached patient profile exists, return null so user is not shown mock data
    }
    return null;
  });

  const isOnlineAuth = status === "authenticated" && !!session?.user;

  // Map NextAuth session → legacy PatientUser shape
  const liveUser: PatientUser | null = useMemo(() => {
    if (!isOnlineAuth) return null;
    return {
      _id:        session!.user.id,
      phone:      session!.user.phone ?? "",
      name:       session!.user.name  ?? "",
      age:        Number(session!.user.age ?? 0),
      gender:     session!.user.gender ?? "",
      village:    session!.user.village ?? "",
      bloodGroup: session!.user.bloodGroup ?? "",
      conditions: session!.user.conditions
        ? session!.user.conditions.split(",").filter(Boolean)
        : [],
      role:       session!.user.role ?? "patient",
      abhaAddress: (session!.user as any).abhaAddress,
      abhaLinked:  (session!.user as any).abhaLinked,
    };
  }, [isOnlineAuth, session]);

  // Cache user locally whenever live session exists
  useEffect(() => {
    if (liveUser && typeof window !== "undefined") {
      localStorage.setItem("cachedPatientUser", JSON.stringify(liveUser));
      localStorage.setItem("aarogya_user", JSON.stringify(liveUser));
      localStorage.setItem("patient", JSON.stringify(liveUser));
      localStorage.setItem("last_logged_role", "patient");
      if (liveUser.phone) localStorage.setItem("last_login_phone", liveUser.phone);
      localStorage.removeItem("user_is_logged_out");
      setCachedUser(liveUser);
    }
  }, [liveUser]);

  // Use live session when online, fall back to cached user immediately (even during loading)
  const user: PatientUser | null = liveUser || cachedUser;
  const isAuthenticated = !!user;
  const loading = status === "loading" && !cachedUser;

  /** Login a patient with phone + password with instant backend verification and offline fallback */
  const login = async (phone: string, password: string) => {
    console.log(`[useAuth.login] Attempting login for phone: ${phone}`);

    // OFFLINE LOGIN (No internet connection)
    if (typeof window !== "undefined" && (!navigator.onLine || !window.navigator.onLine)) {
      console.log(`[useAuth.login] Device is offline, checking offline database for phone: ${phone}`);
      try {
        const { getDB } = await import("@/lib/db-offline");
        const db = getDB();
        const localPatient = await db.patients.where("phone").equals(phone).first();

        const offlinePatientUser: PatientUser = {
          _id: localPatient?.id ? `offline-${localPatient.id}` : `offline-${phone}`,
          phone: phone,
          name: localPatient?.name || "Patient",
          age: localPatient?.age || 28,
          gender: localPatient?.gender || "other",
          village: localPatient?.village || "Local Area",
          conditions: localPatient?.conditions ? localPatient.conditions.split(",").map(c => c.trim()).filter(Boolean) : [],
          bloodGroup: localPatient?.bloodGroup || "—",
          role: "patient",
        };

        localStorage.setItem("cachedPatientUser", JSON.stringify(offlinePatientUser));
        localStorage.setItem("aarogya_user", JSON.stringify(offlinePatientUser));
        localStorage.setItem("patient", JSON.stringify(offlinePatientUser));
        localStorage.setItem("last_logged_role", "patient");
        localStorage.setItem("last_login_phone", phone);
        localStorage.removeItem("user_is_logged_out");
        sessionStorage.removeItem("user_explicitly_logged_out");
        setCachedUser(offlinePatientUser);
        return { success: true };
      } catch {
        const fallbackUser: PatientUser = {
          _id: `offline-${phone}`,
          phone: phone,
          name: "Patient",
          age: 28,
          gender: "other",
          village: "Local Area",
          conditions: [],
          bloodGroup: "—",
          role: "patient",
        };
        localStorage.setItem("cachedPatientUser", JSON.stringify(fallbackUser));
        localStorage.setItem("aarogya_user", JSON.stringify(fallbackUser));
        localStorage.setItem("patient", JSON.stringify(fallbackUser));
        localStorage.setItem("last_logged_role", "patient");
        localStorage.setItem("last_login_phone", phone);
        localStorage.removeItem("user_is_logged_out");
        sessionStorage.removeItem("user_explicitly_logged_out");
        setCachedUser(fallbackUser);
        return { success: true };
      }
    }

    // ONLINE LOGIN
    try {
      // 1. Direct verify with credentials API endpoint for instant authentication & real patient record
      const apiRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password }),
      });

      const apiData = await apiRes.json();

      if (!apiRes.ok) {
        return { success: false, error: apiData.error || "Login failed" };
      }

      const p = apiData.patient;
      const verifiedUser: PatientUser = {
        _id: p._id || `patient-${phone}`,
        phone: p.phone || phone,
        name: p.name || "Patient",
        age: Number(p.age || 28),
        gender: p.gender || "other",
        village: p.village || "Local Area",
        conditions: Array.isArray(p.conditions) ? p.conditions : (p.conditions ? String(p.conditions).split(",").map((c: string) => c.trim()) : []),
        bloodGroup: p.bloodGroup || "—",
        role: p.role || "patient",
      };

      if (typeof window !== "undefined") {
        localStorage.setItem("cachedPatientUser", JSON.stringify(verifiedUser));
        localStorage.setItem("aarogya_user", JSON.stringify(verifiedUser));
        localStorage.setItem("patient", JSON.stringify(verifiedUser));
        localStorage.setItem("last_logged_role", "patient");
        localStorage.setItem("last_login_phone", phone);
        localStorage.removeItem("user_is_logged_out");
        sessionStorage.removeItem("user_explicitly_logged_out");
      }
      setCachedUser(verifiedUser);

      // Cache into Dexie offline DB for seamless offline operation
      try {
        const { getDB } = await import("@/lib/db-offline");
        const db = getDB();
        const existing = await db.patients.where("phone").equals(phone).first();
        if (!existing) {
          await db.patients.add({
            name: verifiedUser.name,
            phone: verifiedUser.phone,
            village: verifiedUser.village,
            age: verifiedUser.age,
            gender: verifiedUser.gender,
            conditions: verifiedUser.conditions.join(", "),
            bloodGroup: verifiedUser.bloodGroup,
            needsSync: false,
          });
        } else {
          await db.patients.update(existing.id!, {
            name: verifiedUser.name,
            village: verifiedUser.village,
            age: verifiedUser.age,
            gender: verifiedUser.gender,
            conditions: verifiedUser.conditions.join(", "),
            bloodGroup: verifiedUser.bloodGroup,
          });
        }
      } catch (dexErr) {
        console.warn("Dexie sync error:", dexErr);
      }

      // 2. Sync NextAuth session cookie before navigating so session is immediately active
      try {
        await Promise.race([
          signIn("patient-credentials", {
            phone,
            password,
            redirect: false,
          }),
          new Promise((resolve) => setTimeout(resolve, 1200)),
        ]);
      } catch (syncErr) {
        console.warn("NextAuth session sync warning:", syncErr);
      }

      return { success: true };
    } catch (err: any) {
      console.error("[useAuth.login] Online attempt threw error, attempting offline fallback:", err);
      // Fall back to offline mode if phone is valid
      if (phone.length === 10) {
        try {
          const { getDB } = await import("@/lib/db-offline");
          const db = getDB();
          const localPatient = await db.patients.where("phone").equals(phone).first();

          const offlinePatientUser: PatientUser = {
            _id: localPatient?.id ? `offline-${localPatient.id}` : `offline-${phone}`,
            phone: phone,
            name: localPatient?.name || "Patient",
            age: localPatient?.age || 28,
            gender: localPatient?.gender || "other",
            village: localPatient?.village || "Local Area",
            conditions: localPatient?.conditions ? localPatient.conditions.split(",").map(c => c.trim()).filter(Boolean) : [],
            bloodGroup: localPatient?.bloodGroup || "—",
            role: "patient",
          };

          localStorage.setItem("cachedPatientUser", JSON.stringify(offlinePatientUser));
          localStorage.setItem("aarogya_user", JSON.stringify(offlinePatientUser));
          localStorage.setItem("patient", JSON.stringify(offlinePatientUser));
          localStorage.setItem("last_logged_role", "patient");
          localStorage.setItem("last_login_phone", phone);
          localStorage.removeItem("user_is_logged_out");
          sessionStorage.removeItem("user_explicitly_logged_out");
          setCachedUser(offlinePatientUser);
          return { success: true };
        } catch {
          const fallbackUser: PatientUser = {
            _id: `offline-${phone}`,
            phone: phone,
            name: "Patient",
            age: 28,
            gender: "other",
            village: "Local Area",
            conditions: [],
            bloodGroup: "—",
            role: "patient",
          };
          localStorage.setItem("cachedPatientUser", JSON.stringify(fallbackUser));
          localStorage.setItem("aarogya_user", JSON.stringify(fallbackUser));
          localStorage.setItem("patient", JSON.stringify(fallbackUser));
          localStorage.setItem("last_logged_role", "patient");
          localStorage.setItem("last_login_phone", phone);
          localStorage.removeItem("user_is_logged_out");
          sessionStorage.removeItem("user_explicitly_logged_out");
          setCachedUser(fallbackUser);
          return { success: true };
        }
      }
      return { success: false, error: "Network error. Please check your connection." };
    }
  };

  /** Register a new patient via the existing REST endpoint, then sign in */
  const register = async (
    phone: string,
    password: string,
    name: string,
    age: string,
    gender: string,
    village: string,
    conditions: string,
    bloodGroup?: string
  ) => {
    // 1. Create the account via existing API
    const regRes = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone, password, name, age, gender, village, conditions, bloodGroup,
        isRegister: true,
      }),
    });

    if (!regRes.ok) {
      const data = await regRes.json();
      return { success: false, error: data.error ?? "Registration failed" };
    }

    const regData = await regRes.json();
    const p = regData.patient;
    const verifiedUser: PatientUser = {
      _id: p?._id || `patient-${phone}`,
      phone: p?.phone || phone,
      name: p?.name || name,
      age: Number(p?.age || age),
      gender: p?.gender || gender,
      village: p?.village || village,
      conditions: p?.conditions || (conditions ? conditions.split(",").map(c => c.trim()) : []),
      bloodGroup: p?.bloodGroup || bloodGroup || "—",
      role: "patient",
    };

    if (typeof window !== "undefined") {
      localStorage.setItem("cachedPatientUser", JSON.stringify(verifiedUser));
      localStorage.setItem("aarogya_user", JSON.stringify(verifiedUser));
      localStorage.setItem("patient", JSON.stringify(verifiedUser));
      localStorage.setItem("last_logged_role", "patient");
      localStorage.setItem("last_login_phone", phone);
      localStorage.removeItem("user_is_logged_out");
      sessionStorage.removeItem("user_explicitly_logged_out");
    }
    setCachedUser(verifiedUser);

    // 2. Sign in via NextAuth so cookie session is created
    signIn("patient-credentials", {
      phone,
      password,
      redirect: false,
    }).catch(err => console.warn("NextAuth session registration sync:", err));

    return { success: true };
  };

  const logout = async () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("user_is_logged_out", "true");
      sessionStorage.setItem("user_explicitly_logged_out", "true");
      localStorage.removeItem("cachedPatientUser");
      localStorage.removeItem("aarogya_user");
      localStorage.removeItem("patient");
      localStorage.removeItem("last_logged_role");
      localStorage.removeItem("last_login_phone");
      localStorage.removeItem("token");
    }
    setCachedUser(null);
    try {
      await signOut({ redirect: false });
    } catch {}
    router.replace("/login");
  };

  return {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated,
    token: null as null,
  };
}
