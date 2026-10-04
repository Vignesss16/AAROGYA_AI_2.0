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
      const stored = localStorage.getItem("cachedPatientUser") || localStorage.getItem("aarogya_user") || localStorage.getItem("patient");
      if (stored) {
        try { return JSON.parse(stored); } catch {}
      }
      const lastPhone = localStorage.getItem("last_login_phone");
      const lastRole = localStorage.getItem("last_logged_role");
      if (lastRole === "patient" || (!lastRole && lastPhone)) {
        return {
          _id: `offline-${lastPhone || "patient"}`,
          phone: lastPhone || "",
          name: "Patient",
          age: 25,
          gender: "other",
          village: "Rural Area",
          conditions: [],
          bloodGroup: "—",
          role: "patient",
        };
      }
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
      setCachedUser(liveUser);
    }
  }, [liveUser]);

  // Use live session when online, fall back to cached user immediately (even during loading)
  const user: PatientUser | null = liveUser || cachedUser;
  const isAuthenticated = !!user;
  const loading = status === "loading" && !cachedUser;

  /** Login a patient with phone + password via NextAuth CredentialsProvider with offline fallback */
  const login = async (phone: string, password: string) => {
    console.log(`[useAuth.login] Attempting login for phone: ${phone}`);

    // OFFLINE LOGIN FALLBACK
    if (typeof window !== "undefined" && (!navigator.onLine || !window.navigator.onLine)) {
      console.log(`[useAuth.login] Device is offline, granting local access for phone: ${phone}`);
      try {
        const { getDB } = await import("@/lib/db-offline");
        const db = getDB();
        const localPatient = await db.patients.where("phone").equals(phone).first();

        const offlinePatientUser: PatientUser = {
          _id: localPatient ? `offline-${localPatient.id}` : `offline-${phone}`,
          phone: phone,
          name: localPatient?.name || "Patient",
          age: localPatient?.age || 25,
          gender: localPatient?.gender || "other",
          village: localPatient?.village || "Rural Area",
          conditions: localPatient?.conditions ? localPatient.conditions.split(",").filter(Boolean) : [],
          bloodGroup: localPatient?.bloodGroup || "—",
          role: "patient",
        };

        localStorage.setItem("cachedPatientUser", JSON.stringify(offlinePatientUser));
        localStorage.setItem("aarogya_user", JSON.stringify(offlinePatientUser));
        localStorage.setItem("patient", JSON.stringify(offlinePatientUser));
        localStorage.setItem("last_logged_role", "patient");
        localStorage.setItem("last_login_phone", phone);
        setCachedUser(offlinePatientUser);
        return { success: true };
      } catch {
        const fallbackUser: PatientUser = {
          _id: `offline-${phone}`,
          phone: phone,
          name: "Patient",
          age: 25,
          gender: "other",
          village: "Rural Area",
          conditions: [],
          role: "patient",
        };
        localStorage.setItem("cachedPatientUser", JSON.stringify(fallbackUser));
        localStorage.setItem("aarogya_user", JSON.stringify(fallbackUser));
        localStorage.setItem("patient", JSON.stringify(fallbackUser));
        localStorage.setItem("last_logged_role", "patient");
        localStorage.setItem("last_login_phone", phone);
        setCachedUser(fallbackUser);
        return { success: true };
      }
    }

    // Try up to 2 times (handles transient DB connection issues)
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const res = await signIn("patient-credentials", {
          phone,
          password,
          redirect: false,
        });

        console.log(`[useAuth.login] Attempt ${attempt} result:`, res);

        if (res?.ok) {
          console.log(`[useAuth.login] Success on attempt ${attempt}`);
          const activeUser: PatientUser = {
            _id: `online-${phone}`,
            phone: phone,
            name: "Patient",
            age: 25,
            gender: "other",
            village: "Rural Area",
            conditions: [],
            role: "patient",
          };
          localStorage.setItem("cachedPatientUser", JSON.stringify(activeUser));
          localStorage.setItem("aarogya_user", JSON.stringify(activeUser));
          localStorage.setItem("last_logged_role", "patient");
          localStorage.setItem("last_login_phone", phone);
          setCachedUser(activeUser);
          return { success: true };
        }
        
        console.warn(`[useAuth.login] Attempt ${attempt} failed:`, res?.error);
        if (attempt === 2) {
          return { success: false, error: res?.error ?? "Login failed. Please try again." };
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (err) {
        console.error(`[useAuth.login] Attempt ${attempt} threw:`, err);
        // If network error during submission, fall back to offline login if valid 10-digit phone
        if (phone.length === 10) {
          console.log("[useAuth.login] Network threw, granting offline access");
          const fallbackUser: PatientUser = {
            _id: `offline-${phone}`,
            phone: phone,
            name: "Patient",
            age: 25,
            gender: "other",
            village: "Rural Area",
            conditions: [],
            role: "patient",
          };
          localStorage.setItem("cachedPatientUser", JSON.stringify(fallbackUser));
          localStorage.setItem("aarogya_user", JSON.stringify(fallbackUser));
          localStorage.setItem("last_logged_role", "patient");
          localStorage.setItem("last_login_phone", phone);
          setCachedUser(fallbackUser);
          return { success: true };
        }
        if (attempt === 2) {
          return { success: false, error: "Network error. Please check your connection." };
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return { success: false, error: "Login failed" };
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

    // 2. Sign in via NextAuth so a proper session is created
    const res = await signIn("patient-credentials", {
      phone,
      password,
      redirect: false,
    });

    if (res?.ok) return { success: true };
    return { success: false, error: res?.error ?? "Sign-in after registration failed" };
  };

  const logout = async () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("cachedPatientUser");
      localStorage.removeItem("aarogya_user");
      localStorage.removeItem("patient");
      localStorage.removeItem("last_logged_role");
      localStorage.removeItem("last_login_phone");
      sessionStorage.setItem("user_explicitly_logged_out", "true");
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
