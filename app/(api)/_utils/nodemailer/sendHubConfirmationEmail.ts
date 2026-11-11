'use server';

export type HackerAdmissionType =
  | 'accept'
  | 'waitlist_accept'
  | 'waitlist'
  | 'reject';

export async function sendHubConfirmationEmail(
  firstName: string,
  lastName: string,
  email: string,
  admissionType: string,
  RSVPList?: string,
  ticketReleaseIDs?: string
) {
  try {
    return await fetch(
      `${process.env.HACKDAVIS_HUB_BASE_URL}/api/admissions/hackers`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          authorization: `Bearer ${process.env.ADMISSIONS_API_KEY}`,
        },
        body: JSON.stringify({
          hackers: [
            {
              firstName: firstName,
              lastName: lastName,
              email: email,
              type: admissionType,
            },
          ],
          rsvpListSlug: RSVPList ? RSVPList : undefined,
          releaseIds: ticketReleaseIDs ? ticketReleaseIDs : undefined,
        }),
      }
    );
  } catch (err: any) {
    return Response.json({ ok: false, error: err }, { status: 500 });
  }
}
