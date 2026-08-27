"use client";
import { SessionProvider } from "next-auth/react";
import GlobalCallListener from "./GlobalCallListener";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <GlobalCallListener />
      {children}
    </SessionProvider>
  );
}
