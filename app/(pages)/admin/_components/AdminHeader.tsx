'use client';

import Link from 'next/link';

interface AdminHeaderProps {
  totalCount: number;
  onLogout: () => void;
}

export default function AdminHeader({
  totalCount,
  onLogout,
}: AdminHeaderProps) {
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

      <Link
        href="/admin/applicants"
        className="inline-flex items-center border-2 border-black px-3 py-1 text-xs font-medium uppercase"
      >
        view all applicants
      </Link>
    </header>
  );
}
