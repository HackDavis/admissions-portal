'use client';

import { signOut } from "next-auth/react";

import AdminHeader from "./_components/AdminHeader";
import ApplicationsGrid from "./_components/ApplicationsGrid";
import FiltersBar from "./_components/FiltersBar";
import useApplications from "./_hooks/useApplications";

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
