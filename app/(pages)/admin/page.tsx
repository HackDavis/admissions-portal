'use client';

import { signOut } from 'next-auth/react';

import AdminHeader from './_components/AdminHeader';
import ApplicationsGrid from './_components/ApplicationsGrid';
import FiltersBar from './_components/FiltersBar';
import ProgressBar from './_components/ProgressBar';
import StatsView from './_components/StatsView';
import useApplications from './_hooks/useApplications';

export default function AdminPage() {
  const handleLogout = () => {
    signOut({ callbackUrl: '/login' });
  };

  const {
    appsByPhase,
    error,
    loading,
    processedStatus,
    setProcessedStatus,
    setTentativeStatus,
    setUnseenStatus,
    setUcd,
    tentativeStatus,
    totalCount,
    unseenStatus,
    ucd,
    updateApplicantStatus,
  } = useApplications();
  const processedCount = appsByPhase.processed.length;
  const tentativeCount = appsByPhase.tentative.length;

  return (
    <div className="min-h-screen p-6 text-sm text-black">
      <AdminHeader totalCount={totalCount} onLogout={handleLogout} />

      <ProgressBar
        processedCount={processedCount}
        tentativeCount={tentativeCount}
        totalCount={totalCount}
      />

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
        unseenStatus={unseenStatus}
        tentativeStatus={tentativeStatus}
        processedStatus={processedStatus}
        onUnseenStatusChange={setUnseenStatus}
        onTentativeStatusChange={setTentativeStatus}
        onProcessedStatusChange={setProcessedStatus}
        onUpdateStatus={updateApplicantStatus}
      />
      <div className="mt-8">
        <StatsView />
      </div>
    </div>
  );
}
