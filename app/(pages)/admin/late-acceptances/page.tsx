import Link from 'next/link';
import LateAcceptanceForm from '../_components/LateAcceptanceForm';

export default function LateAcceptancesPage() {
  return (
    <section className="min-h-screen p-6 text-sm text-black">
      <Link href="/admin" className="special-button px-2 py-1 text-sm">
        back
      </Link>
      <div className="mt-6 mb-4 max-w-3xl">
        <h1 className="text-xl font-semibold">add late acceptance</h1>
        <p className="mt-1 text-xs">
          Adds an applicant as accepted, skipping review and the auto waitlist.
          All fields required by the application are required here.
        </p>
      </div>
      <div className="max-w-3xl">
        <LateAcceptanceForm />
      </div>
    </section>
  );
}
