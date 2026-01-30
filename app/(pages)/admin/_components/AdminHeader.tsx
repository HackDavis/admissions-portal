'use client';

import { useMailchimp } from '../_hooks/useMailchimp';
// import Link from 'next/link';

interface AdminHeaderProps {
  totalCount: number;
  onLogout: () => void;
}

export default function AdminHeader({
  totalCount,
  onLogout,
}: AdminHeaderProps) {
  const { mailchimp } = useMailchimp();
  const mc = mailchimp ?? {
    batchNumber: 'N/A',
    apiCallsMade: 0,
    maxApiCalls: 0,
    apiKeyIndex: 0,
    maxApiKeys: 0,
    lastUpdate: 'N/A',
    lastReset: 'N/A',
  };
  return (
    <header className="mb-6 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-xl font-semibold">hackdavis admissions admin</h1>
        <button onClick={onLogout} className="special-button px-2 py-1 text-xs">
          Logout
        </button>
        <p className="mt-1 text-xs">
          loaded: {totalCount} applications (filtered server-side)
        </p>
      </div>

      {/* <Link
        href="/admin/applicants"
        className="inline-flex items-center border-2 border-black px-3 py-1 text-xs font-medium uppercase"
      >
        view all applicants
      </Link> */}
      <div>
        <p className="mt-1 text-xs font-semibold">Mailchimp API status</p>
        <p className="mt-1 text-xs">Batch: {mc.batchNumber}</p>
        <p className="mt-1 text-xs">
          Calls: {mc.apiCallsMade}/{mc.maxApiCalls} (key #{mc.apiKeyIndex}/
          {mc.maxApiKeys})
        </p>
        <p className="mt-1 text-xs">Last update: {mc.lastUpdate.toString()}</p>
        <p className="mt-1 text-xs">Last reset: {mc.lastReset.toString()}</p>
      </div>
    </header>
  );
}
