"use client";
import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import dynamic from "next/dynamic";
import { PatientCallDetails } from "@/components/VideoCallModal";

const VideoCallModal = dynamic(() => import("@/components/VideoCallModal"), { ssr: false });

export interface CallSessionParams {
  patientName: string;
  patientId: string;
  isDoctor: boolean;
  callerRole?: "doctor" | "receptionist" | "asha" | "hospital";
  callerTitle?: string;
  facilityName?: string;
  department?: string;
  patientDetails?: PatientCallDetails;
  initialIncomingCallType?: "video" | "audio" | null;
  consultationId?: string;
  onSaveNotes?: (notes: string, verifiedStatus?: string) => Promise<void> | void;
}

interface CallContextType {
  currentCall: CallSessionParams | null;
  isOpen: boolean;
  startCallSession: (params: CallSessionParams) => void;
  endCallSession: () => void;
}

const CallContext = createContext<CallContextType>({
  currentCall: null,
  isOpen: false,
  startCallSession: () => {},
  endCallSession: () => {},
});

export const useCall = () => useContext(CallContext);

export function CallProvider({ children }: { children: ReactNode }) {
  const [currentCall, setCurrentCall] = useState<CallSessionParams | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const startCallSession = useCallback((params: CallSessionParams) => {
    setCurrentCall(params);
    setIsOpen(true);
  }, []);

  const endCallSession = useCallback(() => {
    setIsOpen(false);
    setCurrentCall(null);
  }, []);

  return (
    <CallContext.Provider value={{ currentCall, isOpen, startCallSession, endCallSession }}>
      {children}

      {/* Global Persistent VideoCallModal rendered at Root Layout level */}
      {isOpen && currentCall && (
        <VideoCallModal
          isOpen={isOpen}
          onClose={endCallSession}
          patientName={currentCall.patientName}
          patientId={currentCall.patientId}
          isDoctor={currentCall.isDoctor}
          callerRole={currentCall.callerRole}
          callerTitle={currentCall.callerTitle}
          facilityName={currentCall.facilityName}
          department={currentCall.department}
          patientDetails={currentCall.patientDetails}
          onSaveNotes={currentCall.onSaveNotes}
          initialIncomingCallType={currentCall.initialIncomingCallType}
        />
      )}
    </CallContext.Provider>
  );
}
