'use client';

import { useEffect, useState } from 'react';
import { RsvpList, Release } from '@/app/_types/tito';
import getRsvpLists from '@utils/tito/getRsvpLists';
import getReleases from '@utils/tito/getReleases';
import { sendLateAcceptanceInvite } from '@actions/applications/sendLateAcceptanceInvite';

interface LateAcceptanceInviteProps {
  applicationId: string;
  invitedAt?: Date | string;
}

// Sends a late acceptance the same Tito, Hub, and acceptance email invites
// that finalize sends, since late acceptances never go through finalize.
export default function LateAcceptanceInvite({
  applicationId,
  invitedAt: initialInvitedAt,
}: LateAcceptanceInviteProps) {
  const [invitedAt, setInvitedAt] = useState(initialInvitedAt);
  const [rsvpLists, setRsvpLists] = useState<RsvpList[]>([]);
  const [releases, setReleases] = useState<Release[]>([]);
  const [rsvpListSlug, setRsvpListSlug] = useState('');
  const [releaseIds, setReleaseIds] = useState<string[]>([]);
  const [loadingTito, setLoadingTito] = useState(!initialInvitedAt);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialInvitedAt) return;
    let cancelled = false;

    (async () => {
      try {
        const [listsRes, releasesRes] = await Promise.all([
          getRsvpLists(),
          getReleases(),
        ]);
        if (cancelled) return;
        if (!listsRes.ok || !listsRes.body)
          throw new Error(listsRes.error ?? 'Failed to load RSVP lists.');
        if (!releasesRes.ok || !releasesRes.body)
          throw new Error(releasesRes.error ?? 'Failed to load releases.');

        setRsvpLists(listsRes.body);
        setReleases(releasesRes.body);
        // Same "hacker" defaults as finalize.
        const list = listsRes.body.find((l) =>
          l.title.toLowerCase().includes('hacker')
        );
        const release = releasesRes.body.find((r) =>
          r.title.toLowerCase().includes('hacker')
        );
        setRsvpListSlug(list?.slug ?? '');
        setReleaseIds(release ? [release.id] : []);
      } catch (err) {
        if (!cancelled)
          setError(
            `Could not load Tito data: ${
              err instanceof Error ? err.message : String(err)
            }`
          );
      } finally {
        if (!cancelled) setLoadingTito(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [initialInvitedAt]);

  function toggleRelease(id: string) {
    setReleaseIds((current) =>
      current.includes(id) ? current.filter((r) => r !== id) : [...current, id]
    );
  }

  async function send() {
    setSending(true);
    setError(null);
    try {
      const res = await sendLateAcceptanceInvite(applicationId, {
        rsvpListSlug,
        releaseIds,
      });
      if (res.ok) setInvitedAt(res.body.invitedAt);
      else setError(res.error);
    } catch (err) {
      console.error('Error sending late acceptance invite:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setSending(false);
    }
  }

  if (invitedAt) {
    return (
      <div className="border border-black p-3 text-xs">
        <p className="font-semibold uppercase">invite sent</p>
        <p className="mt-1">
          Tito RSVP invite, Hub invite, and acceptance email sent{' '}
          {new Date(invitedAt).toLocaleString()}.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 border border-black p-3 text-xs">
      <div>
        <p className="font-semibold uppercase">send invite</p>
        <p className="mt-1">
          Creates their Tito RSVP invite and Hub invite, and sends the
          acceptance email. Nothing has been sent yet.
        </p>
      </div>

      {loadingTito ? (
        <p>Loading Tito data...</p>
      ) : (
        <>
          <label className="flex flex-col gap-1">
            <span className="font-semibold">RSVP list</span>
            <select
              value={rsvpListSlug}
              onChange={(e) => setRsvpListSlug(e.target.value)}
              disabled={sending}
              className="border border-black bg-white px-2 py-1"
            >
              <option value="">-- Select RSVP list --</option>
              {rsvpLists.map((list) => (
                <option key={list.slug} value={list.slug}>
                  {list.title} ({list.slug})
                </option>
              ))}
            </select>
          </label>

          <fieldset className="flex flex-col gap-1">
            <legend className="font-semibold">Release(s)</legend>
            {releases.map((release) => (
              <label key={release.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={releaseIds.includes(release.id)}
                  onChange={() => toggleRelease(release.id)}
                  disabled={sending}
                />
                {release.title}
              </label>
            ))}
          </fieldset>

          <button
            type="button"
            onClick={send}
            disabled={sending || !rsvpListSlug || releaseIds.length === 0}
            className="special-button self-start px-2 py-1 text-xs disabled:opacity-50"
          >
            {sending ? 'sending...' : 'send invite'}
          </button>
        </>
      )}

      {error && (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
