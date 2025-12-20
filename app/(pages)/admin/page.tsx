'use client';

import { signOut } from "next-auth/react";

import AdminHeader from "./_components/AdminHeader";
import ApplicationsGrid from "./_components/ApplicationsGrid";
import FiltersBar from "./_components/FiltersBar";
import useApplications from "./_hooks/useApplications";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Phase = "unseen" | "tentative" | "processed";

type Status =
  | "pending"
  | "tentatively_accepted"
  | "tentatively_rejected"
  | "tentatively_waitlisted"
  | "accepted"
  | "rejected"
  | "waitlisted";

type UcdParam = "all" | "true" | "false";

interface Application {
  id: string;
  email: string;
  isUCDavisStudent: boolean;
  status: Status;
  submittedAt?: string;
  reviewedAt?: string;
  processedAt?: string;
}

const PHASES: { id: Phase; label: string }[] = [
  { id: "unseen", label: "unseen" },
  { id: "tentative", label: "tentative" },
  { id: "processed", label: "processed" },
];

export default function AdminPage() {
  const handleLogout = () => {
    signOut({ callbackUrl: "/login" });
  };

  const {
    appsByPhase,
    error,
    loading,
    processedStatus,
    setProcessedStatus,
    setTentativeStatus,
    setUcd,
    tentativeStatus,
    totalCount,
    ucd,
  } = useApplications();

  return (
    <div className="min-h-screen p-6 text-sm text-black">
      <AdminHeader totalCount={totalCount} onLogout={handleLogout} />

      <FiltersBar ucd={ucd} onUcdChange={setUcd} />

      {error && (
        <div className="mb-4 border-2 border-black p-3">
          <p className="text-xs font-semibold uppercase">error</p>
          <p className="text-xs">{error}</p>

        </div>
      )}

      <ApplicationsGrid
        appsByPhase={appsByPhase}
        loading={loading}
        tentativeStatus={tentativeStatus}
        processedStatus={processedStatus}
        onTentativeStatusChange={setTentativeStatus}
        onProcessedStatusChange={setProcessedStatus}
      />
    </div>
  );
}


