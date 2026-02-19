import { Application } from '@/app/_types/application';

// Generate comprehensive CSV with all applicant data
export const generateComprehensiveCSV = (
  applicants: Application[],
  titoInviteMap: Map<string, string>,
  hubInviteMap: Map<string, string>,
  autoFixedNotesMap: Map<string, string>,
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
    'HackDavis Hub Invite URL',
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
    const hubUrl = hubInviteMap.get(email) || '';
    const autoFixedNote = autoFixedNotesMap.get(email) || '';
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
        errorMessages.push(mailchimpError || 'Mailchimp email failed to send');
      }

      if (errorMessages.length > 0) {
        success = 'FALSE';
        notes = errorMessages.join('; ');
      } else {
        success = 'TRUE';
        notes = autoFixedNote;
      }
    } else {
      // Non-accepted applicants only need Mailchimp
      if (mailchimpSuccess) {
        success = 'TRUE';
        notes = autoFixedNote;
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
      hubUrl,
      success,
      notes,
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(',');
  });

  return [headers.join(','), ...rows].join('\n');
};
