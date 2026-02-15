'use client';

import { useState } from 'react';
import { Application } from '@/app/_types/application';
import { Status } from '@/app/_types/applicationFilters';
// import { generateTitoCSV } from '@utils/tito/generateTitoCSV';
import { prepareMailchimpInvites } from '@utils/mailchimp/prepareMailchimp';
import { useMailchimp } from '../_hooks/useMailchimp';
import { updateMailchimp } from '@actions/mailchimp/updateMailchimp';
import getRsvpLists from '@utils/tito/getRsvpLists';
import getReleases from '@utils/tito/getReleases';
import bulkCreateInvitations from '@utils/tito/bulkCreateInvitations';

interface FinalizeButtonProps {
  apps: Application[];
  onFinalizeStatus: (
    appId: string,
    nextStatus: Status,
    fromPhase: 'tentative',
    options?: {
      wasWaitlisted?: boolean;
      refreshPhase?: 'processed' | 'unseen';
      batchNumber?: number;
    }
  ) => void;
}

interface RsvpList {
  id: string;
  slug: string;
  title: string;
}

interface Release {
  id: string;
  slug: string;
  title: string;
  quantity?: number;
}

const FINAL_STATUS_MAP: Record<string, Status> = {
  tentatively_accepted: 'accepted',
  tentatively_waitlisted: 'waitlisted',
  tentatively_waitlist_accepted: 'waitlist_accepted',
  tentatively_waitlist_rejected: 'waitlist_rejected',
};

const WAITLIST_STATUSES = [
  'tentatively_waitlisted',
  'tentatively_waitlist_accepted',
  'tentatively_waitlist_rejected',
];

export default function FinalizeButton({
  apps,
  onFinalizeStatus,
}: FinalizeButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showTitoModal, setShowTitoModal] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [processingResults, setProcessingResults] = useState<{
    titoSucceeded: number;
    titoTotal: number;
    mailchimpResults: string;
    csvFilename: string;
    totalErrors: number;
    titoFailures: string[];
    mailchimpFailures: string[];
  } | null>(null);
  const [rsvpLists, setRsvpLists] = useState<RsvpList[]>([]);
  const [releases, setReleases] = useState<Release[]>([]);
  const [selectedRsvpList, setSelectedRsvpList] = useState<string>('');
  const [selectedReleases, setSelectedReleases] = useState<string[]>([]);
  const [loadingTitoData, setLoadingTitoData] = useState(false);

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

      // Helper: process one Mailchimp batch and collect results
      const processMailchimpBatch = async (
        label: string,
        status: string,
        titoInviteMapRecord: Record<string, string>
      ): Promise<boolean> => {
        const res = await prepareMailchimpInvites(status, {
          titoInviteMap: titoInviteMapRecord,
          rsvpListSlug: selectedRsvpList,
        });
        const processedCount = res.ids?.length ?? 0;

        // Track successful Mailchimp sends
        if (processedCount > 0) {
          res.ids.forEach((id: string) => mailchimpSuccessIds.add(id));

          const successfulApps = apps.filter((app) =>
            res.ids.includes(app._id)
          );
          await Promise.all(
            successfulApps.map((app) =>
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
              !res.ids.includes(app._id) &&
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
          titoFailures.push(...titoResult.errors);
          console.log(
            `[Process All] Tito: ${titoInviteMapLocal.size} succeeded, ${titoFailures.length} failed`
          );
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
        titoFailures,
        mailchimpSuccessIds,
        mailchimpErrorMap
      );

      // Download CSV
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

      // Increment batch number if no errors
      const hadErrors = titoFailures.length > 0 || mailchimpFailures.length > 0;
      if (!hadErrors) {
        try {
          await updateMailchimp({ batchNumber: 1, lastUpdate: new Date() });
        } catch (err) {
          console.error('Failed to increment Mailchimp batch number: ', err);
        }
      }
      await refreshMailchimp();

      // Store results and show results modal
      const totalErrors = titoFailures.length + mailchimpFailures.length;
      setProcessingResults({
        titoSucceeded: titoInviteMapLocal.size,
        titoTotal: acceptedApps.length,
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

  // Generate comprehensive CSV with all applicant data
  const generateComprehensiveCSV = (
    applicants: Application[],
    titoInviteMap: Map<string, string>,
    titoFailures: string[],
    mailchimpSuccessIds: Set<string>,
    mailchimpErrorMap: Map<string, string>
  ): string => {
    const headers = [
      'Email',
      'First Name',
      'Last Name',
      'Status',
      'Acceptance Type',
      'Tito Invite URL',
      'Success',
      'Notes',
    ];

    const rows = applicants.map((app) => {
      const email = app.email.toLowerCase();
      const isAccepted = [
        'tentatively_accepted',
        'tentatively_waitlist_accepted',
      ].includes(app.status);

      let acceptanceType = '';
      let success = 'TRUE';
      let notes = '';

      if (app.status === 'tentatively_accepted') {
        acceptanceType = 'Accepted';
      } else if (app.status === 'tentatively_waitlist_accepted') {
        acceptanceType = 'Waitlist Accepted';
      } else if (app.status === 'tentatively_waitlisted') {
        acceptanceType = 'Waitlisted';
      } else if (app.status === 'tentatively_waitlist_rejected') {
        acceptanceType = 'Waitlist Rejected';
      }

      const titoUrl = titoInviteMap.get(email) || '';
      const hadTitoFailure = titoFailures.some((f) => f.includes(email));
      const mailchimpSuccess = mailchimpSuccessIds.has(app._id);
      const mailchimpError = mailchimpErrorMap.get(email);

      // Build error messages array
      const errorMessages: string[] = [];

      // Determine success status and notes
      if (isAccepted) {
        // Accepted applicants should have Tito + Mailchimp
        const titoFailed = !titoUrl;
        const mailchimpFailed = !mailchimpSuccess;

        if (titoFailed) {
          errorMessages.push(
            hadTitoFailure
              ? 'Tito invitation creation failed'
              : 'Tito invitation not created'
          );
        }

        if (mailchimpFailed) {
          errorMessages.push(
            mailchimpError || 'Mailchimp email failed to send'
          );
        }

        if (errorMessages.length > 0) {
          success = 'FALSE';
          notes = errorMessages.join('; ');
        } else {
          success = 'TRUE';
          notes = '';
        }
      } else {
        // Non-accepted applicants only need Mailchimp
        if (mailchimpSuccess) {
          success = 'TRUE';
          notes = '';
        } else {
          success = 'FALSE';
          notes = mailchimpError || 'Mailchimp email failed to send';
        }
      }

      return [
        app.email,
        app.firstName,
        app.lastName,
        app.status,
        acceptanceType,
        titoUrl,
        success,
        notes,
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  };

  const toggleRelease = (releaseId: string) => {
    setSelectedReleases((prev) =>
      prev.includes(releaseId)
        ? prev.filter((id) => id !== releaseId)
        : [...prev, releaseId]
    );
  };

  return (
    <div>
      <button
        type="button"
        className="special-button border-2 border-black px-3 py-1 text-xs font-medium uppercase"
        title="finalize tentative applicants"
        onClick={handleFinalize}
        disabled={isProcessing || apps.length === 0 || apps.length > 110}
      >
        {apps.length > 110 ? 'batch size limit: 110' : 'finalize'}
      </button>

      {/* Tito Configuration & Processing Modal */}
      {showTitoModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 relative max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-4">Finalize All Applicants</h2>

            {loadingTitoData ? (
              <div className="text-center py-8">
                <p className="text-sm">Loading Tito data...</p>
              </div>
            ) : (
              <>
                {/* RSVP List Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold mb-2">
                    Select RSVP List:
                  </label>
                  {rsvpLists.length === 0 ? (
                    <p className="text-xs text-gray-600">
                      No RSVP lists found. Create one in Tito first.
                    </p>
                  ) : (
                    <select
                      value={selectedRsvpList}
                      onChange={(e) => setSelectedRsvpList(e.target.value)}
                      className="w-full border-2 border-black px-3 py-2 text-xs"
                      disabled={isProcessing}
                    >
                      <option value="">-- Select RSVP List --</option>
                      {rsvpLists.map((list) => (
                        <option key={list.slug} value={list.slug}>
                          {list.title} ({list.slug})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Release Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold mb-2">
                    Select Release(s):
                  </label>
                  {releases.length === 0 ? (
                    <p className="text-xs text-gray-600">
                      No releases found. Create releases in Tito first.
                    </p>
                  ) : (
                    <div className="border-2 border-black p-3 max-h-60 overflow-y-auto">
                      {releases.map((release) => (
                        <label
                          key={release.id}
                          className="flex items-center space-x-2 mb-2 cursor-pointer hover:bg-gray-100 p-2"
                        >
                          <input
                            type="checkbox"
                            checked={selectedReleases.includes(release.id)}
                            onChange={() => toggleRelease(release.id)}
                            className="w-4 h-4"
                            disabled={isProcessing}
                          />
                          <span className="text-xs">
                            {release.title}
                            {release.quantity && ` (Qty: ${release.quantity})`}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                  {selectedReleases.length > 0 && (
                    <p className="text-xs text-gray-600 mt-2">
                      {selectedReleases.length} release(s) selected
                    </p>
                  )}
                </div>

                {/* Info */}
                {!isProcessing && (
                  <div className="mb-4 p-3 border-2 border-black bg-gray-50">
                    <p className="text-xs font-semibold mb-1">
                      This single button will:
                    </p>
                    <ol className="text-xs space-y-1 list-decimal list-inside">
                      <li>Create Tito invitations for accepted applicants</li>
                      <li>Create Hub invitations for accepted applicants</li>
                      <li>Send Mailchimp emails to all applicants</li>
                      <li>Update application statuses in database</li>
                      <li>Download CSV with all data and any errors</li>
                    </ol>
                  </div>
                )}

                {/* Processing Status - Warning */}
                {isProcessing && (
                  <div className="mb-4 p-3 border-2 border-yellow-600 bg-yellow-50">
                    <p className="text-xs font-bold text-yellow-800 mb-2">
                      IMPORTANT: DO NOT EXIT THIS PAGE UNTIL COMPLETE!
                    </p>
                    <p className="text-xs text-yellow-800">
                      The process will take several minutes. Wait for success or
                      error message.
                    </p>
                  </div>
                )}

                {/* Buttons */}
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => setShowTitoModal(false)}
                    className="special-button border-2 border-black px-3 py-1 text-xs font-medium uppercase"
                    disabled={isProcessing}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleProcessAll}
                    className="special-button border-2 border-black px-3 py-1 text-xs font-medium uppercase bg-black text-white hover:bg-gray-800"
                    disabled={
                      isProcessing ||
                      !selectedRsvpList ||
                      selectedReleases.length === 0
                    }
                  >
                    {isProcessing ? 'PROCESSING...' : 'PROCESS ALL'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Results Modal */}
      {showResultsModal && processingResults && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full p-6 relative max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-4">
              {processingResults.totalErrors === 0
                ? 'Process Complete - Success!'
                : 'Process Complete - With Errors'}
            </h2>

            {/* Summary Section */}
            <div
              className={`mb-4 p-4 border-2 ${
                processingResults.totalErrors === 0
                  ? 'border-green-600 bg-green-50'
                  : 'border-yellow-600 bg-yellow-50'
              }`}
            >
              <p className="text-sm font-semibold mb-2">Summary:</p>
              <ul className="text-xs space-y-1">
                <li>
                  Tito Invitations: {processingResults.titoSucceeded}/
                  {processingResults.titoTotal} succeeded
                </li>
                <li>CSV Downloaded: {processingResults.csvFilename}</li>
                {processingResults.totalErrors > 0 && (
                  <li className="font-bold text-red-600">
                    Total Errors: {processingResults.totalErrors}
                  </li>
                )}
              </ul>
            </div>

            {/* Mailchimp Results */}
            <div className="mb-4 p-4 border-2 border-black bg-gray-50">
              <p className="text-sm font-semibold mb-2">Mailchimp Results:</p>
              <pre className="text-xs whitespace-pre-wrap">
                {processingResults.mailchimpResults}
              </pre>
            </div>

            {/* Tito Failures */}
            {processingResults.titoFailures.length > 0 && (
              <div className="mb-4 p-4 border-2 border-red-600 bg-red-50">
                <p className="text-sm font-bold text-red-600 mb-2">
                  Tito Failures ({processingResults.titoFailures.length}):
                </p>
                <div className="text-xs space-y-1 max-h-40 overflow-y-auto">
                  {processingResults.titoFailures
                    .slice(0, 20)
                    .map((failure, idx) => (
                      <div key={idx} className="text-red-700">
                        {failure}
                      </div>
                    ))}
                  {processingResults.titoFailures.length > 20 && (
                    <div className="text-red-700 font-semibold">
                      ...and {processingResults.titoFailures.length - 20} more
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Mailchimp Failures */}
            {processingResults.mailchimpFailures.length > 0 && (
              <div className="mb-4 p-4 border-2 border-red-600 bg-red-50">
                <p className="text-sm font-bold text-red-600 mb-2">
                  Mailchimp Failures:
                </p>
                <div className="text-xs space-y-1">
                  {processingResults.mailchimpFailures.map((failure, idx) => (
                    <div key={idx} className="text-red-700">
                      {failure}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Close Button */}
            <div className="flex justify-end">
              <button
                onClick={() => {
                  setShowResultsModal(false);
                  setProcessingResults(null);
                }}
                className="special-button border-2 border-black px-4 py-2 text-xs font-medium uppercase bg-black text-white hover:bg-gray-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
