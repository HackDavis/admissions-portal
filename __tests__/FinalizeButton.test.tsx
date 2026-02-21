/** @jest-environment jsdom */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FinalizeButton from '../app/(pages)/admin/_components/FinalizeButton';
import { Application } from '@typeDefs/application';

jest.mock('@utils/tito/getRsvpLists', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('@utils/tito/getReleases', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('@utils/tito/bulkCreateInvitations', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('@utils/mailchimp/prepareMailchimp', () => ({
  prepareMailchimpInvites: jest.fn(),
}));

jest.mock('@actions/mailchimp/updateMailchimp', () => ({
  updateMailchimp: jest.fn(),
}));

jest.mock('../app/(pages)/admin/_hooks/useMailchimp', () => ({
  useMailchimp: jest.fn(),
}));

import getRsvpLists from '@utils/tito/getRsvpLists';
import getReleases from '@utils/tito/getReleases';
import bulkCreateInvitations from '@utils/tito/bulkCreateInvitations';
import { prepareMailchimpInvites } from '@utils/mailchimp/prepareMailchimp';
import { updateMailchimp } from '@actions/mailchimp/updateMailchimp';
import { useMailchimp } from '../app/(pages)/admin/_hooks/useMailchimp';

const mockedGetRsvpLists = getRsvpLists as jest.Mock;
const mockedGetReleases = getReleases as jest.Mock;
const mockedBulkCreateInvitations = bulkCreateInvitations as jest.Mock;
const mockedPrepareMailchimpInvites = prepareMailchimpInvites as jest.Mock;
const mockedUpdateMailchimp = updateMailchimp as jest.Mock;
const mockedUseMailchimp = useMailchimp as jest.Mock;

const baseApps: Application[] = [
  {
    _id: '1',
    firstName: 'Ada',
    lastName: 'Lovelace',
    email: 'ada@example.com',
    status: 'tentatively_accepted',
    wasWaitlisted: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as Application,
  {
    _id: '2',
    firstName: 'Grace',
    lastName: 'Hopper',
    email: 'grace@example.com',
    status: 'tentatively_waitlisted',
    wasWaitlisted: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as Application,
];

function setupMocks() {
  mockedGetRsvpLists.mockResolvedValue({
    ok: true,
    body: [{ id: 'list-1', slug: 'rsvp-1', title: 'RSVP 1' }],
    error: null,
  });

  mockedGetReleases.mockResolvedValue({
    ok: true,
    body: [{ id: 'release-1', slug: 'release-1', title: 'Release 1' }],
    error: null,
  });

  mockedUseMailchimp.mockReturnValue({
    mailchimp: { batchNumber: 3 },
    refresh: jest.fn(),
  });

  mockedUpdateMailchimp.mockResolvedValue({
    ok: true,
    body: null,
    error: null,
  });
}

beforeEach(() => {
  setupMocks();
  mockedBulkCreateInvitations.mockResolvedValue({
    ok: true,
    inviteMap: new Map([['ada@example.com', 'tito-url-ada']]),
    errors: [],
  });

  mockedPrepareMailchimpInvites.mockImplementation(async (status: string) => {
    if (status === 'tentatively_accepted') {
      return { ok: true, ids: ['1'], error: null };
    }
    if (status === 'tentatively_waitlisted') {
      return { ok: true, ids: ['2'], error: null };
    }
    return { ok: true, ids: [], error: null };
  });

  jest.spyOn(window, 'alert').mockImplementation(() => undefined);
  URL.createObjectURL = jest.fn(() => 'blob:mock');
  URL.revokeObjectURL = jest.fn();
  if (typeof document !== 'undefined') {
    const originalCreateElement = document.createElement.bind(document);
    jest.spyOn(document, 'createElement').mockImplementation((tagName) => {
      if (tagName === 'a') {
        return {
          href: '',
          download: '',
          click: jest.fn(),
        } as unknown as HTMLAnchorElement;
      }
      return originalCreateElement(tagName);
    });
  }
});

afterEach(() => {
  jest.restoreAllMocks();
});

test('processes all applicants and passes Tito map to Mailchimp', async () => {
  const onFinalizeStatus = jest.fn();
  const user = userEvent.setup();
  render(
    <FinalizeButton apps={baseApps} onFinalizeStatus={onFinalizeStatus} />
  );

  await user.click(screen.getByRole('button', { name: /finalize/i }));
  await waitFor(() => expect(mockedGetRsvpLists).toHaveBeenCalled());

  const releaseCheckbox = await screen.findByRole('checkbox');
  await user.click(releaseCheckbox);

  await user.click(screen.getByRole('button', { name: /process all/i }));

  await waitFor(() =>
    expect(mockedPrepareMailchimpInvites).toHaveBeenCalledWith(
      'tentatively_accepted',
      expect.anything()
    )
  );

  const acceptedCall = mockedPrepareMailchimpInvites.mock.calls.find(
    (c: any[]) => c[0] === 'tentatively_accepted'
  );
  expect(acceptedCall).toBeDefined();
  expect(acceptedCall![1]).toEqual(
    expect.objectContaining({
      rsvpListSlug: 'rsvp-1',
      titoInviteMap: { 'ada@example.com': 'tito-url-ada' },
    })
  );

  expect(mockedBulkCreateInvitations).toHaveBeenCalledWith(
    expect.objectContaining({
      rsvpListSlug: 'rsvp-1',
      releaseIds: 'release-1',
    })
  );

  expect(onFinalizeStatus).toHaveBeenCalledWith(
    '1',
    'accepted',
    'tentative',
    expect.objectContaining({ batchNumber: 3 })
  );
  expect(onFinalizeStatus).toHaveBeenCalledWith(
    '2',
    'waitlisted',
    'tentative',
    expect.objectContaining({ batchNumber: 3 })
  );

  expect(mockedUpdateMailchimp).toHaveBeenCalledWith(
    expect.objectContaining({ batchNumber: 1 })
  );
});

test('increments batch number when Mailchimp failures occur', async () => {
  mockedPrepareMailchimpInvites.mockImplementation(async (status: string) => {
    if (status === 'tentatively_accepted') {
      return {
        ok: true,
        ids: ['1'],
        error: '1 FAILED:\n[grace@example.com]: Bad Request',
      };
    }
    return { ok: true, ids: [], error: null };
  });

  const onFinalizeStatus = jest.fn();
  const user = userEvent.setup();
  render(
    <FinalizeButton apps={baseApps} onFinalizeStatus={onFinalizeStatus} />
  );

  await user.click(screen.getByRole('button', { name: /finalize/i }));
  await waitFor(() => expect(mockedGetRsvpLists).toHaveBeenCalled());

  const releaseCheckbox = await screen.findByRole('checkbox');
  await user.click(releaseCheckbox);

  await user.click(screen.getByRole('button', { name: /process all/i }));

  await waitFor(() => expect(mockedPrepareMailchimpInvites).toHaveBeenCalled());

  expect(onFinalizeStatus).toHaveBeenCalledWith(
    '1',
    'accepted',
    'tentative',
    expect.any(Object)
  );
  expect(onFinalizeStatus).not.toHaveBeenCalledWith(
    '2',
    'waitlisted',
    'tentative',
    expect.any(Object)
  );

  expect(mockedUpdateMailchimp).toHaveBeenCalledWith(
    expect.objectContaining({ batchNumber: 1 })
  );
});

test('continues Mailchimp processing when Tito creation has failures', async () => {
  mockedBulkCreateInvitations.mockResolvedValue({
    ok: false,
    inviteMap: new Map(),
    errors: ['ada@example.com: failure'],
  });

  const onFinalizeStatus = jest.fn();
  const user = userEvent.setup();
  render(
    <FinalizeButton apps={baseApps} onFinalizeStatus={onFinalizeStatus} />
  );

  await user.click(screen.getByRole('button', { name: /finalize/i }));
  await waitFor(() => expect(mockedGetRsvpLists).toHaveBeenCalled());

  const releaseCheckbox = await screen.findByRole('checkbox');
  await user.click(releaseCheckbox);

  await user.click(screen.getByRole('button', { name: /process all/i }));

  await waitFor(() => expect(mockedPrepareMailchimpInvites).toHaveBeenCalled());
});

test('non-accepted Mailchimp fires in parallel with Tito (before it resolves)', async () => {
  let resolveTito: (value: any) => void;
  const titoPromise = new Promise((resolve) => {
    resolveTito = resolve;
  });

  mockedBulkCreateInvitations.mockReturnValue(titoPromise);

  const callOrder: string[] = [];
  mockedPrepareMailchimpInvites.mockImplementation(async (status: string) => {
    callOrder.push(status);
    return { ok: true, ids: [], error: null };
  });

  const onFinalizeStatus = jest.fn();
  const user = userEvent.setup();
  render(
    <FinalizeButton apps={baseApps} onFinalizeStatus={onFinalizeStatus} />
  );

  await user.click(screen.getByRole('button', { name: /finalize/i }));
  await waitFor(() => expect(mockedGetRsvpLists).toHaveBeenCalled());

  const releaseCheckbox = await screen.findByRole('checkbox');
  await user.click(releaseCheckbox);

  await user.click(screen.getByRole('button', { name: /process all/i }));

  // Non-accepted Mailchimp should fire while Tito is still pending
  await waitFor(() => expect(callOrder).toContain('tentatively_waitlisted'));

  // Accepted Mailchimp should NOT have fired yet (Tito still pending)
  expect(callOrder).not.toContain('tentatively_accepted');

  // Now resolve Tito
  resolveTito!({
    ok: true,
    inviteMap: new Map([['ada@example.com', 'tito-url-ada']]),
    errors: [],
  });

  // After Tito resolves, accepted Mailchimp should fire
  await waitFor(() => expect(callOrder).toContain('tentatively_accepted'));
});

test('defense-in-depth blocks status update for unverified applicant', async () => {
  // Two accepted applicants, but Tito only succeeded for one
  const twoAcceptedApps: Application[] = [
    {
      _id: '1',
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      status: 'tentatively_accepted',
      wasWaitlisted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as Application,
    {
      _id: '3',
      firstName: 'Alan',
      lastName: 'Turing',
      email: 'alan@example.com',
      status: 'tentatively_accepted',
      wasWaitlisted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as Application,
  ];

  // Tito only succeeded for Ada, not Alan
  mockedBulkCreateInvitations.mockResolvedValue({
    ok: true,
    inviteMap: new Map([['ada@example.com', 'tito-url-ada']]),
    errors: [],
  });

  // Mailchimp erroneously returns BOTH IDs as successful
  mockedPrepareMailchimpInvites.mockImplementation(async (status: string) => {
    if (status === 'tentatively_accepted') {
      return { ok: true, ids: ['1', '3'], error: null };
    }
    return { ok: true, ids: [], error: null };
  });

  const onFinalizeStatus = jest.fn();
  const user = userEvent.setup();
  render(
    <FinalizeButton
      apps={twoAcceptedApps}
      onFinalizeStatus={onFinalizeStatus}
    />
  );

  await user.click(screen.getByRole('button', { name: /finalize/i }));
  await waitFor(() => expect(mockedGetRsvpLists).toHaveBeenCalled());

  const releaseCheckbox = await screen.findByRole('checkbox');
  await user.click(releaseCheckbox);

  await user.click(screen.getByRole('button', { name: /process all/i }));

  await waitFor(() => expect(mockedPrepareMailchimpInvites).toHaveBeenCalled());

  // Ada (verified in Tito map) should get status update
  await waitFor(() =>
    expect(onFinalizeStatus).toHaveBeenCalledWith(
      '1',
      'accepted',
      'tentative',
      expect.any(Object)
    )
  );

  // Alan (NOT in Tito map) should be blocked by defense-in-depth
  expect(onFinalizeStatus).not.toHaveBeenCalledWith(
    '3',
    'accepted',
    'tentative',
    expect.any(Object)
  );
});

test('accepted batches receive Tito map while non-accepted batches receive empty map', async () => {
  const appsWithWaitlistAccepted: Application[] = [
    ...baseApps,
    {
      _id: '3',
      firstName: 'Alan',
      lastName: 'Turing',
      email: 'alan@example.com',
      status: 'tentatively_waitlist_accepted',
      wasWaitlisted: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as Application,
  ];

  mockedBulkCreateInvitations.mockResolvedValue({
    ok: true,
    inviteMap: new Map([
      ['ada@example.com', 'tito-url-ada'],
      ['alan@example.com', 'tito-url-alan'],
    ]),
    errors: [],
  });

  const inviteMaps: Record<string, Record<string, string>> = {};
  mockedPrepareMailchimpInvites.mockImplementation(
    async (status: string, opts: { titoInviteMap: Record<string, string> }) => {
      inviteMaps[status] = opts.titoInviteMap;
      if (status === 'tentatively_accepted') {
        return { ok: true, ids: ['1'], error: null };
      }
      if (status === 'tentatively_waitlisted') {
        return { ok: true, ids: ['2'], error: null };
      }
      if (status === 'tentatively_waitlist_accepted') {
        return { ok: true, ids: ['3'], error: null };
      }
      return { ok: true, ids: [], error: null };
    }
  );

  const onFinalizeStatus = jest.fn();
  const user = userEvent.setup();
  render(
    <FinalizeButton
      apps={appsWithWaitlistAccepted}
      onFinalizeStatus={onFinalizeStatus}
    />
  );

  await user.click(screen.getByRole('button', { name: /finalize/i }));
  await waitFor(() => expect(mockedGetRsvpLists).toHaveBeenCalled());

  const releaseCheckbox = await screen.findByRole('checkbox');
  await user.click(releaseCheckbox);

  await user.click(screen.getByRole('button', { name: /process all/i }));

  await waitFor(() =>
    expect(mockedPrepareMailchimpInvites).toHaveBeenCalledTimes(4)
  );

  // Accepted batches should receive the full Tito map
  expect(inviteMaps['tentatively_accepted']).toEqual({
    'ada@example.com': 'tito-url-ada',
    'alan@example.com': 'tito-url-alan',
  });
  expect(inviteMaps['tentatively_waitlist_accepted']).toEqual({
    'ada@example.com': 'tito-url-ada',
    'alan@example.com': 'tito-url-alan',
  });

  // Non-accepted batches should receive empty map
  expect(inviteMaps['tentatively_waitlisted']).toEqual({});
  expect(inviteMaps['tentatively_waitlist_rejected']).toEqual({});
});
