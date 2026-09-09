'use client';

import { prepareMailchimpInvites } from '@utils/mailchimp/prepareMailchimp';
import { downloadCSV } from './downloadCSV';

export async function processRsvpReminders(rsvpListSlug: string) {
  try {
    const res = await prepareMailchimpInvites('rsvp_reminder', {
      rsvpListSlug,
    });

    // GENERATES SUMMARY CSV
    if (res.ok && res.applicants) {
      const headers = ['Email', 'Success', 'Error Details'];
      const mailchimpSuccessIds = new Set(res.ids);

      const rows = res.applicants.map((app) => {
        const isSuccess = mailchimpSuccessIds.has(app._id);
        const result = isSuccess ? 'TRUE' : 'FALSE';

        let errorDetail = '';
        // Extract error message if it failed
        if (!isSuccess) {
          // Search the batch error for specific applicant's error
          const errorLine = res.error
            ?.split('\n')
            .find((line: string) => line.includes(`[${app.email}]`));

          // Clean up the string
          errorDetail = errorLine
            ? errorLine.split(']: ')[1] || errorLine
            : 'Unknown Error';
        }

        return [app.email, result, errorDetail]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(',');
      });

      const csvString = [headers.join(','), ...rows].join('\n');

      // Trigger Download
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `rsvp_reminders_${timestamp}.csv`;
      downloadCSV(csvString, filename);
    }

    const results: string[] = [];
    const processedCount = res.ids?.length ?? 0;

    if (processedCount > 0) {
      results.push(`[SUCCESS] Processed ${processedCount} RSVP reminders!`);
    } else {
      results.push('No RSVP reminders to process.');
    }

    if (!res.ok) {
      const errorMsg = res.error || 'Unknown error occurred';
      results.push(
        `[ERROR] Failed to process some RSVP reminders: ${errorMsg}`
      );
    }

    alert(results.join('\n'));
  } catch (err: any) {
    console.error('Error processing RSVP reminders:', err);
    alert(`Error processing RSVP reminders: ${err.message}`);
  }
}
