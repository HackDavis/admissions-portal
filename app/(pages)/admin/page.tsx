"use client";

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-900 p-6">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold">HackDavis Admissions Admin</h1>
        <p className="text-sm text-neutral-600 mt-1">
          basic admin dashboard setup — will add functionality later
        </p>
      </header>

      <main className="space-y-6">
        {/* todo: placeholder for applicant pools section */}
        <section className="border rounded-lg p-4 bg-white">
          <h2 className="font-medium mb-2">Applicant Pools</h2>
          <p className="text-sm text-neutral-600">
            todo: add pools (new, reviewing, interview, accepted, etc.)
          </p>
        </section>

        {/* todo: placeholder for filters */}
        <section className="border rounded-lg p-4 bg-white">
          <h2 className="font-medium mb-2">Filters</h2>
          <p className="text-sm text-neutral-600">
            todo: add search + role filters here
          </p>
        </section>

        {/* todo: list applicants once data is added */}
        <section className="border rounded-lg p-4 bg-white">
          <h2 className="font-medium mb-2">Applicants List</h2>
          <p className="text-sm text-neutral-600">
            todo: show applicant cards once pools are implemented
          </p>
        </section>
      </main>
    </div>
  );
}
