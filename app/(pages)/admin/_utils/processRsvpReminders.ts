'use client';

import { prepareMailchimpInvites } from '@utils/mailchimp/prepareMailchimp';

export async function processRsvpReminders() {
  try {
    const res = await prepareMailchimpInvites('rsvp_reminder');
    if (!res.ok) {
      alert(`Error processing RSVP reminders: ${res.error}`);
    }

    const processedCount = res.ids?.length ?? 0;
    if (processedCount > 0) {
      alert(`Successfully processed ${processedCount} RSVP reminders!`);
    } else {
      alert('No RSVP reminders to process.');
    }
  } catch (err: any) {
    console.error('Error processing RSVP reminders:', err);
    alert(`Error processing RSVP reminders: ${err.message}`);
  }
}
