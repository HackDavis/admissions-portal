"use client";

import Link from "next/link";
import { useState } from "react";

const POOLS = [
  { id: "to-be-processed", label: "to be processed" },
  { id: "accepted", label: "accepted" },
  { id: "waitlisted", label: "waitlisted" },
  { id: "rejected", label: "rejected" },
];

type Track = "best hack for social good" | "track2" | "track3";

interface Applicant {
  id: string;
  email: string;
  is18plus: boolean;
  track: Track;
  pool: string;
}

const INITIAL_APPLICANTS: Applicant[] = [
  {
    id: "1",
    email: "placeholder@hackdavis.io",
    is18plus: true,
    track: "best hack for social good",
    pool: "to-be-processed",
  },
];

export default function AdminPage() {
  const [applicants, setApplicants] = useState<Applicant[]>(INITIAL_APPLICANTS);

//   const handlePoolChange = (id: string, newPool: string) => {
//     setApplicants((prev) =>
//       prev.map((a) => (a.id === id ? { ...a, pool: newPool } : a))
//     );
//   };

  return (
    <div className="min-h-screen p-6 text-sm text-black">
      <header className="mb-6 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-semibold">hackdavis admissions admin</h1>
          <p className="mt-1">
            wip + will add other pages w/ full applicant pools
          </p>
        </div>

        <Link
          href="/admin/applicants"
          className="inline-flex items-center border-2 border-black px-3 py-1 text-xs font-medium uppercase"
        >
          view all applicants
        </Link>
      </header>

      {/* applicant pools */}
      <section className="space-y-3">
        <h2 className="font-medium">applicant pools</h2>

        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-4">
          {POOLS.map((pool) => {
            const poolApplicants = applicants.filter(
              (a) => a.pool === pool.id
            );

            return (
              <div
                key={pool.id}
                className="border-2 border-black p-3 flex flex-col"
              >
                <div className="mb-2">
                  <h3 className="text-xs font-semibold uppercase">
                    {pool.label}
                  </h3>
                  <p className="text-xs">
                    {poolApplicants.length} applicant
                    {poolApplicants.length === 1 ? "" : "s"}
                  </p>
                </div>

                <div className="space-y-2">
                  {poolApplicants.length === 0 ? (
                    <p className="text-xs">no applicants in this pool yet...</p>
                  ) : (
                    poolApplicants.map((a) => (
                      <div
                        key={a.id}
                        className="border-2 border-black p-2 flex flex-col gap-1"
                      >
                        <p className="text-xs">id: {a.id}</p>
                        <p className="text-xs">email: {a.email}</p>
                        <p className="text-xs">track: {a.track}</p>

                        {/* for switching the applicants but idk if we want this */}
                        {/* <select
                          value={a.pool}
                          onChange={(e) =>
                            handlePoolChange(a.id, e.target.value)
                          }
                          className="mt-2 border-2 border-black px-2 py-1 text-xs"
                        >
                          {POOLS.map((p) => (
                            <option key={p.id} value={p.id}>
                              move to: {p.label}
                            </option>
                          ))}
                        </select> */}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
