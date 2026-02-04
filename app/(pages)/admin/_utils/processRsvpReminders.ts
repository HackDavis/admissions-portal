'use client';

import { prepareMailchimpInvites } from '@utils/mailchimp/prepareMailchimp';

export async function processRsvpReminders() {
  try {
    const res = await prepareMailchimpInvites('rsvp_reminder');

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
