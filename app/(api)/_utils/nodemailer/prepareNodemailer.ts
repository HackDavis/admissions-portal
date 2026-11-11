'use server';

import { AxiosInstance } from 'axios';

import { ApplicationCondensed } from '@/app/_types/application';
import {
  getApplicationsByStatuses,
  getApplicationsForRsvpReminder,
} from '../getFilteredApplications';
import { getUnredeemedRsvpInvitations } from '../tito/getUnredeemedRsvpInvitations';
import { getHubSession } from '../hub/createHubInvite';
import { sendHubConfirmationEmail } from './sendHubConfirmationEmail';

// Main
export async function prepareNodemailerInvites(
  targetStatus:
    | 'tentatively_accepted'
    | 'tentatively_waitlisted'
    | 'tentatively_waitlist_accepted'
    | 'tentatively_waitlist_rejected'
    | 'rsvp_reminder',
  options?: {
    applicantIds?: string[];
    titoInviteMap?: Record<string, string>;
    rsvpListSlug?: string;
    releaseIds?: string;
  }
) {
  const successfulIds: string[] = [];
  const errorDetails: string[] = [];
  const hubInviteMap: Record<string, string> = {};
  const MAX_CONCURRENT_REQUESTS = 10;

  let dbApplicants: ApplicationCondensed[] = [];

  try {
    const isAccepted =
      targetStatus === 'tentatively_accepted' ||
      targetStatus === 'tentatively_waitlist_accepted';
    const rsvpSlug = options?.rsvpListSlug as string;

    // RSVP Reminders REQUIRE the slug
    if (targetStatus === 'rsvp_reminder' && !rsvpSlug) {
      throw new Error(
        'An RSVP List Slug is required for rsvp_reminder status.'
      );
    }

    // Accepted statuses REQUIRE either a pre-provided map OR a slug to fetch one
    if (isAccepted && !options?.titoInviteMap && !rsvpSlug) {
      throw new Error(
        'Either a Tito invite map or an RSVP List Slug is required for accepted statuses.'
      );
    }

    if (targetStatus === 'rsvp_reminder') {
      dbApplicants = await getApplicationsForRsvpReminder(rsvpSlug);
    } else {
      dbApplicants = await getApplicationsByStatuses(targetStatus);
    }

    if (options?.applicantIds !== undefined) {
      const applicantIds = new Set(options.applicantIds);
      dbApplicants = dbApplicants.filter((app) => applicantIds.has(app._id));
    }

    const seenEmails = new Set<string>();
    dbApplicants = dbApplicants.filter((app) => {
      const normalizedEmail = app.email.toLowerCase().trim();
      if (seenEmails.has(normalizedEmail)) {
        errorDetails.push(
          `[${app.email}]: Skipped duplicate applicant email in processing batch`
        );
        return false;
      }
      seenEmails.add(normalizedEmail);
      return true;
    });

    if (dbApplicants.length === 0)
      return {
        ok: true,
        ids: [],
        applicants: [],
        hubInviteMap: {},
        error: null,
      };

    // Double check all required env vars are present
    const requiredEnvs = [
      'HACKDAVIS_HUB_BASE_URL',
      'HUB_ADMIN_EMAIL',
      'HUB_ADMIN_PASSWORD',
    ];
    if (
      targetStatus === 'rsvp_reminder' ||
      (isAccepted && !options?.titoInviteMap)
    ) {
      requiredEnvs.push('TITO_AUTH_TOKEN', 'TITO_EVENT_BASE_URL');
    }
    for (const env of requiredEnvs) {
      if (!process.env[env])
        throw new Error(`Missing Environment Variable: ${env}`);
    }

    let titoInvitesMap = new Map<string, string>();
    let hubSession: AxiosInstance | null = null;

    // Note: rsvp_reminder does not require hub/tito info
    if (isAccepted) {
      // Get tito and hub for accepted and waitlist_accepted applicants
      if (options?.titoInviteMap) {
        for (const [email, url] of Object.entries(options.titoInviteMap)) {
          titoInvitesMap.set(email.toLowerCase(), url);
        }
        hubSession = await getHubSession();
      } else {
        // handles accepted applicants when no pre-provided titoInviteMap is available
        const [titoResponse, session] = await Promise.all([
          getUnredeemedRsvpInvitations(rsvpSlug),
          getHubSession(),
        ]);

        if (!titoResponse.ok || !titoResponse.body) {
          throw new Error(
            `Failed to fetch Tito invites: ${titoResponse.error}`
          );
        }
        titoInvitesMap = titoResponse.body;
        hubSession = session;
      }
    }

    // Note: Hub rate limit is unknown (likely stateless), but have successfully tested with 60+ acceptances at once
    // Mailchimp rate limit is 10 requests per second for free accounts
    // Currently kept the same amont of MAX_CONCURRENT_REQUESTS as Hub (which is 10)
    // Process nodemailer for each applicant
    const results: (string | null)[] = [];

    for (let i = 0; i < dbApplicants.length; i += MAX_CONCURRENT_REQUESTS) {
      const chunk = dbApplicants.slice(i, i + MAX_CONCURRENT_REQUESTS);
      const chunkResults = await Promise.all(
        chunk.map(async (applicant) => {
          try {
            // change app status to the acceptable type
            const admissionType =
              applicant.status === 'tentatively_accepted'
                ? 'accept'
                : applicant.status === 'tentatively_waitlist_accepted'
                ? 'waitlist_accept'
                : applicant.status === 'tentatively_waitlisted'
                ? 'waitlist'
                : applicant.status === 'tentatively_waitlist_rejected'
                ? 'reject'
                : '';
            if (admissionType === '')
              throw new Error(
                `Applicant ${applicant._id} (${applicant.firstName} ${applicant.lastName}) does not have an acceptable admission type: ${applicant.status}.`
              );

            // send confirmation email (via hub)
            const response = await sendHubConfirmationEmail(
              applicant.firstName,
              applicant.lastName,
              applicant.email,
              admissionType,
              admissionType == 'accept' || admissionType == 'waitlist'
                ? rsvpSlug
                : undefined,
              admissionType == 'accept' || admissionType == 'waitlist'
                ? options?.releaseIds
                : undefined
            );

            if (!response) {
              errorDetails.push(
                `[${applicant.email}]: Empty response from Hub.`
              );
              return null;
            }

            const result: { ok: boolean; error?: string } =
              await response.json();

            if (!result.ok) {
              if (result.error) {
                const reason = `Hub confirmation email request failed with status ${response.status} and error message '${result.error}'`;
                errorDetails.push(`[${applicant.email}]: ${reason}`);
              } else {
                const reason = `Hub confirmation email request failed with status ${response.status}`;
                errorDetails.push(`[${applicant.email}]: ${reason}`);
              }
              return null;
            }

            return applicant._id;
          } catch (err: any) {
            const reason =
              err.response?.data?.detail || err.message || 'Unknown Error';
            const context = `[${applicant.email}]: ${reason}`;
            console.error(`Failed: ${context}`);
            errorDetails.push(context);
            return null;
          }
        })
      );
      results.push(...chunkResults);
    }

    const finalIds = results.filter((id): id is string => id !== null);
    successfulIds.push(...finalIds);

    const totalRequested = dbApplicants.length;
    const failedCount = totalRequested - finalIds.length;

    // NOTE: ALLOWS FOR PARTIAL SUCCESS
    return {
      ok: true,
      ids: successfulIds,
      applicants: dbApplicants,
      hubInviteMap,
      error:
        failedCount === 0
          ? null
          : `${failedCount} FAILED:\n${errorDetails.join('\n')}`,
    };
  } catch (err: any) {
    return {
      ok: false,
      ids: successfulIds,
      applicants: dbApplicants,
      hubInviteMap,
      error: err.message,
    };
  }
}
