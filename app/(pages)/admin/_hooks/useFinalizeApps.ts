'use client';

import { useState } from 'react';
import { Application } from '@/app/_types/application';
import {
  Status,
  WAITLIST_STATUSES,
  FINAL_STATUS_MAP,
} from '@typeDefs/applicationFilters';
import { RsvpList, Release } from '@/app/_types/tito';
import { generateComprehensiveCSV } from '../_utils/generateComprehensiveCSV';
import { prepareMailchimpInvites } from '@utils/mailchimp/prepareMailchimp';
import { useMailchimp } from '../_hooks/useMailchimp';
import { updateMailchimp } from '@actions/mailchimp/updateMailchimp';
import getRsvpLists from '@utils/tito/getRsvpLists';
import getReleases from '@utils/tito/getReleases';
import bulkCreateInvitations from '@utils/tito/bulkCreateInvitations';

type OnFinalizeStatusFn = (
  appId: string,
  nextStatus: Status,
  fromPhase: 'tentative',
  options?: {
    wasWaitlisted?: boolean;
    refreshPhase?: 'processed' | 'unseen';
    batchNumber?: number;
  }
) => Promise<void> | void;

export interface FinalizeResults {
  titoSucceeded: number;
  titoTotal: number;
  autoFixedCount: number;
  mailchimpResults: string;
  csvFilename: string;
  totalErrors: number;
  titoFailures: string[];
  mailchimpFailures: string[];
}

export function useFinalizeApps(
  apps: Application[],
  onFinalizeStatus: OnFinalizeStatusFn
) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showTitoModal, setShowTitoModal] = useState(false);
  const [loadingTitoData, setLoadingTitoData] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [processingResults, setProcessingResults] =
    useState<FinalizeResults | null>(null);
  const [rsvpLists, setRsvpLists] = useState<RsvpList[]>([]);
  const [releases, setReleases] = useState<Release[]>([]);
  const [selectedRsvpList, setSelectedRsvpList] = useState<string>('');
  const [selectedReleases, setSelectedReleases] = useState<string[]>([]);

  const { mailchimp, refresh: refreshMailchimp } = useMailchimp();
  const currentBatch = mailchimp?.batchNumber ?? -1;

  const handleFinalize = async () => {
    setShowTitoModal(true);
    setLoadingTitoData(true);
    try {
      // Fetch RSVP lists and releases
      const [rsvpListsRes, releasesRes] = await Promise.all([
        getRsvpLists(),
        getReleases(),
      ]);

      if (!rsvpListsRes.ok || !rsvpListsRes.body) {
        throw new Error(rsvpListsRes.error ?? 'Failed to fetch RSVP lists');
      }
      if (!releasesRes.ok || !releasesRes.body) {
        throw new Error(releasesRes.error ?? 'Failed to fetch releases');
      }

      setRsvpLists(rsvpListsRes.body);
      setReleases(releasesRes.body);

      // Auto-select first RSVP list if available
      if (rsvpListsRes.body.length > 0) {
        setSelectedRsvpList(rsvpListsRes.body[0].slug);
      }
    } catch (err: any) {
      console.error(err);
      alert(`Failed to load Tito data: ${err.message ?? err}`);
      setShowTitoModal(false);
    } finally {
      setLoadingTitoData(false);
    }
  };

  const handleProcessAll = async () => {
    if (!selectedRsvpList) {
      alert('Please select an RSVP list');
      return;
    }
    if (selectedReleases.length === 0) {
      alert('Please select at least one release');
      return;
    }

    setIsProcessing(true);
    const titoFailures: string[] = [];
    const mailchimpFailures: string[] = [];
    let processedResults = '';

    try {
      // Separate applicants by acceptance type
      const acceptedApps = apps.filter((app) =>
        ['tentatively_accepted', 'tentatively_waitlist_accepted'].includes(
          app.status
        )
      );

      const allApps = apps; // All tentative applicants
      console.log(
        `[Process All] Starting full process for ${allApps.length} applicants`
      );
      console.log(
        `[Process All] ${acceptedApps.length} accepted (will get Tito tickets)`
      );
      console.log(
        `[Process All] ${
          allApps.length - acceptedApps.length
        } non-accepted (no Tito tickets)`
      );

      const mailchimpResults: string[] = [];
      const mailchimpSuccessIds = new Set<string>();
      const mailchimpErrorMap = new Map<string, string>(); // email -> error message
      const hubInviteMapLocal = new Map<string, string>();

      // Helper: process one Mailchimp batch and collect results
      const processMailchimpBatch = async (
        label: string,
        status:
          | 'tentatively_accepted'
          | 'tentatively_waitlisted'
          | 'tentatively_waitlist_accepted'
          | 'tentatively_waitlist_rejected'
          | 'rsvp_reminder',
        titoInviteMapRecord: Record<string, string>
      ): Promise<boolean> => {
        const res = await prepareMailchimpInvites(status, {
          titoInviteMap: titoInviteMapRecord,
          rsvpListSlug: selectedRsvpList,
        });
        const processedIds: string[] = res.ids ?? [];
        const processedCount = processedIds.length;

        Object.entries(res.hubInviteMap ?? {}).forEach(([email, hubUrl]) => {
          if (typeof hubUrl === 'string' && hubUrl) {
            hubInviteMapLocal.set(email.toLowerCase(), hubUrl);
          }
        });

        if (processedCount > 0) {
          processedIds.forEach((id: string) => mailchimpSuccessIds.add(id));

          const successfulApps = apps.filter((app) =>
            processedIds.includes(app._id)
          );

          // Defense-in-depth: for accepted statuses, cross-check each app
          // against the Tito invite map before updating DB status.
          // This is a no-op for non-accepted paths (they pass {} for the map).
          const hasTitoMap = Object.keys(titoInviteMapRecord).length > 0;
          const verifiedApps = hasTitoMap
            ? successfulApps.filter((app) => {
                const email = app.email.toLowerCase();
                if (titoInviteMapRecord[email]) return true;
                // Block: app slipped through without a Tito URL
                console.warn(
                  `[FinalizeButton] Blocked status update for ${app.email}: no Tito invite URL found`
                );
                mailchimpSuccessIds.delete(app._id);
                mailchimpErrorMap.set(
                  email,
                  'Blocked by safety check: no Tito invite URL'
                );
                return false;
              })
            : successfulApps;

          await Promise.all(
            verifiedApps.map((app) =>
              onFinalizeStatus(
                app._id,
                FINAL_STATUS_MAP[app.status],
                'tentative',
                {
                  wasWaitlisted: WAITLIST_STATUSES.includes(app.status),
                  refreshPhase:
                    app.status === 'tentatively_waitlisted'
                      ? 'unseen'
                      : 'processed',
                  batchNumber: currentBatch,
                }
              )
            )
          );
        }

        // Track Mailchimp failures with specific error messages
        if (res.error) {
          const errorLines = res.error.split('\n').slice(1);

          errorLines.forEach((line: string) => {
            const match = line.match(/\[([^\]]+)\]:\s*(.+)/);
            if (match) {
              const email = match[1].toLowerCase();
              const reason = match[2];
              mailchimpErrorMap.set(email, reason);
            }
          });

          const failedApps = apps.filter(
            (app) =>
              app.status === status &&
              !processedIds.includes(app._id) &&
              !mailchimpErrorMap.has(app.email.toLowerCase())
          );
          failedApps.forEach((app) => {
            mailchimpErrorMap.set(
              app.email.toLowerCase(),
              `Failed during ${label} processing`
            );
          });
        }

        const statusPrefix = res.ok && !res.error ? '[SUCCESS]' : '[FAILED]';
        let batchMessage = `${statusPrefix} ${label}: ${processedCount} processed`;

        if (res.error) {
          batchMessage += `\n${res.error}`;
          mailchimpFailures.push(`${label}: ${res.error}`);
        }
        mailchimpResults.push(batchMessage);

        return res.ok;
      };

      // Run accepted path and non-accepted path in parallel
      let titoInviteMapLocal = new Map<string, string>();
      let titoAutoFixNotesMapLocal = new Map<string, string>();
      let autoFixedCount = 0;

      const acceptedPath = async () => {
        // Create Tito invitations first (accepted only)
        if (acceptedApps.length > 0) {
          console.log(
            `[Process All] Creating ${acceptedApps.length} Tito invitations...`
          );
          const releaseIds = selectedReleases.join(',');
          const titoResult = await bulkCreateInvitations({
            applicants: acceptedApps,
            rsvpListSlug: selectedRsvpList,
            releaseIds,
          });

          titoInviteMapLocal = titoResult.inviteMap;
          titoAutoFixNotesMapLocal = new Map(
            Object.entries(titoResult.autoFixedNotesMap ?? {}).map(
              ([email, note]) => [email.toLowerCase(), note]
            )
          );
          autoFixedCount = titoResult.autoFixedCount;
          titoFailures.push(...titoResult.errors);
        }

        // Then process Mailchimp for accepted statuses (need Tito map)
        const titoInviteMapRecord = Object.fromEntries(titoInviteMapLocal);
        const okAccepted = await processMailchimpBatch(
          'Acceptances',
          'tentatively_accepted',
          titoInviteMapRecord
        );
        if (!okAccepted) return;

        await processMailchimpBatch(
          'Waitlist Acceptances',
          'tentatively_waitlist_accepted',
          titoInviteMapRecord
        );
      };

      const nonAcceptedPath = async () => {
        // Non-accepted statuses don't need Tito map
        console.log(
          `[Process All] Processing Mailchimp for non-accepted applicants...`
        );
        const okWaitlisted = await processMailchimpBatch(
          'Waitlists',
          'tentatively_waitlisted',
          {}
        );
        if (!okWaitlisted) return;

        await processMailchimpBatch(
          'Waitlist Rejections',
          'tentatively_waitlist_rejected',
          {}
        );
      };

      await Promise.all([acceptedPath(), nonAcceptedPath()]);

      processedResults = mailchimpResults.join('\n');

      // STEP 3: Generate comprehensive CSV with all data
      console.log(
        '[Process All] Generating final CSV with all applicant data...'
      );
      const csvData = generateComprehensiveCSV(
        allApps,
        titoInviteMapLocal,
        hubInviteMapLocal,
        titoAutoFixNotesMapLocal,
        titoFailures,
        mailchimpSuccessIds,
        mailchimpErrorMap
      );

      const blob = new Blob([csvData], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const download = `applicants_finalized_${
        new Date().toISOString().split('T')[0]
      }.csv`;
      const a = document.createElement('a');
      a.href = url;
      a.download = download;
      a.click();
      URL.revokeObjectURL(url);

      const hadErrors = titoFailures.length > 0 || mailchimpFailures.length > 0;
      if (!hadErrors) {
        try {
          await updateMailchimp({ batchNumber: 1, lastUpdate: new Date() });
        } catch (err) {
          console.error('Failed to increment Mailchimp batch number: ', err);
        }
      }
      await refreshMailchimp();

      const totalErrors = titoFailures.length + mailchimpFailures.length;
      setProcessingResults({
        titoSucceeded: titoInviteMapLocal.size,
        titoTotal: acceptedApps.length,
        autoFixedCount,
        mailchimpResults: processedResults,
        csvFilename: download,
        totalErrors,
        titoFailures,
        mailchimpFailures,
      });
      setShowTitoModal(false);
      setShowResultsModal(true);
    } catch (err: any) {
      console.error('[Process All] Fatal error:', err);
      setProcessingResults({
        titoSucceeded: 0,
        titoTotal: 0,
        autoFixedCount: 0,
        mailchimpResults: '',
        csvFilename: '',
        totalErrors: 1,
        titoFailures: [],
        mailchimpFailures: [`Fatal error: ${err.message ?? err}`],
      });
      setShowTitoModal(false);
      setShowResultsModal(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleRelease = (releaseId: string) => {
    setSelectedReleases((prev) =>
      prev.includes(releaseId)
        ? prev.filter((id) => id !== releaseId)
        : [...prev, releaseId]
    );
  };

  return {
    state: {
      isProcessing,
      showTitoModal,
      showResultsModal,
      processingResults,
      rsvpLists,
      releases,
      selectedRsvpList,
      selectedReleases,
      loadingTitoData,
    },
    actions: {
      handleFinalize,
      handleProcessAll,
      toggleRelease,
      setShowTitoModal,
      setShowResultsModal,
      setSelectedRsvpList,
      setProcessingResults,
    },
  };
}
