import Link from 'next/link';
import { auth } from '@/auth';
import { getDatabase } from '@utils/mongodb/mongoClient.mjs';
import { redirect } from 'next/navigation';

export default async function ReferralLinksPage() {
  const session = await auth();
  if (session?.user?.role !== 'admin') redirect('/login');

  let referrals: {
    _id: { toString(): string };
    name: string;
    code: string;
  }[];
  try {
    const db = await getDatabase();
    referrals = await db
      .collection('referrals')
      .find({})
      .sort({ name: 1 })
      .toArray();
  } catch {
    return (
      <section className="p-6 text-sm">
        Could not load referral links. Please refresh to try again.
      </section>
    );
  }

  return (
    <section className="p-6 text-sm text-black">
      <Link href="/admin" className="special-button px-2 py-1 text-sm">
        back
      </Link>
      <h1 className="mt-8 mb-2 text-xl font-semibold">referral links</h1>
      <p className="mb-6 text-xs">
        Make QR codes based off these links + use those to distribute.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full max-w-4xl border-collapse border border-black text-left">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-black p-3">Source</th>
              <th className="border border-black p-3">Referral link</th>
            </tr>
          </thead>
          <tbody>
            {referrals.map((referral) => {
              const url = `https://apply.hackdavis.io/?ref=${encodeURIComponent(
                referral.code
              )}`;
              return (
                <tr key={referral._id.toString()}>
                  <td className="border border-black p-3">{referral.name}</td>
                  <td className="border border-black p-3">
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="break-all underline"
                    >
                      {url}
                    </a>
                  </td>
                </tr>
              );
            })}
            {!referrals.length && (
              <tr>
                <td colSpan={2} className="p-3 text-gray-600">
                  No referral links available yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
