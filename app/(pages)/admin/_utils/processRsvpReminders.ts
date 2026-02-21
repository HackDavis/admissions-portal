'use client';

import { prepareMailchimpInvites } from '@utils/mailchimp/prepareMailchimp';

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
        // Extract error message if it failed
        const errorDetail = !isSuccess
          ? res.error
            ? 'API Error'
            : 'Unknown Error'
          : '';

        return [app.email, result, errorDetail]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(',');
      });

      const csvString = [headers.join(','), ...rows].join('\n');

      // Trigger Download
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const timestamp = new Date().toISOString();
      const filename = `rsvp_reminders_${timestamp}.csv`;
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 0);
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
