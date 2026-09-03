"use client";

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

/** Drop-in replacement for the old custom useAuth hook, now backed by NextAuth. */
export function useAuth() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const loading = status === "loading";
  const isAuthenticated = status === "authenticated" && !!session?.user;

  // Map NextAuth session → legacy PatientUser shape
  const user: PatientUser | null = isAuthenticated
    ? {
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
      }
    : null;

  /** Login a patient with phone + password via NextAuth CredentialsProvider */
  const login = async (phone: string, password: string) => {
    console.log(`[useAuth.login] Attempting login for phone: ${phone}`);
    
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
          return { success: true };
        }
        
        // If it failed, log the error and retry
        console.warn(`[useAuth.login] Attempt ${attempt} failed:`, res?.error);
        if (attempt === 2) {
          return { success: false, error: res?.error ?? "Login failed. Please try again." };
        }
        
        // Wait 1 second before retry
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (err) {
        console.error(`[useAuth.login] Attempt ${attempt} threw:`, err);
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
    await signOut({ redirect: false });
    router.push("/login");
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
