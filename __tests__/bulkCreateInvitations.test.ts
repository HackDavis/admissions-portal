/** @jest-environment node */
import bulkCreateInvitations from '@utils/tito/bulkCreateInvitations';

jest.mock('@utils/tito/createRsvpInvitation', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('@utils/tito/deleteRsvpInvitationByEmail', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('@utils/tito/getRsvpInvitationByEmail', () => ({
  __esModule: true,
  default: jest.fn(),
}));

import createRsvpInvitation from '@utils/tito/createRsvpInvitation';
import deleteRsvpInvitationByEmail from '@utils/tito/deleteRsvpInvitationByEmail';
import getRsvpInvitationByEmail from '@utils/tito/getRsvpInvitationByEmail';

const mockedCreate = createRsvpInvitation as jest.Mock;
const mockedDeleteByEmail = deleteRsvpInvitationByEmail as jest.Mock;
const mockedGetByEmail = getRsvpInvitationByEmail as jest.Mock;

const applicants = [
  {
    _id: '1',
    firstName: 'Ada',
    lastName: 'Lovelace',
    email: 'ada@example.com',
    status: 'tentatively_accepted',
  },
  {
    _id: '2',
    firstName: 'Grace',
    lastName: 'Hopper',
    email: 'grace@example.com',
    status: 'tentatively_accepted',
  },
];

beforeEach(() => {
  jest.clearAllMocks();
  mockedDeleteByEmail.mockResolvedValue({
    ok: false,
    deletedInvitationSlug: null,
    error: 'not called',
  });
  mockedGetByEmail.mockResolvedValue({
    ok: false,
    invitation: null,
    error: 'not called',
  });
});

test('reuses existing invitation URL on duplicate ticket error', async () => {
  mockedCreate
    .mockResolvedValueOnce({
      ok: false,
      body: null,
      error: 'email has already been taken',
    })
    .mockResolvedValueOnce({ ok: true, body: { unique_url: 'url-2' } });

  mockedGetByEmail.mockResolvedValueOnce({
    ok: true,
    invitation: {
      slug: 'rsvp_existing_123',
      email: 'ada@example.com',
      unique_url: 'url-existing',
    },
    error: null,
  });

  const result = await bulkCreateInvitations({
    applicants: applicants as any,
    rsvpListSlug: 'rsvp-1',
    releaseIds: '1',
  });

  expect(mockedGetByEmail).toHaveBeenCalledWith({
    rsvpListSlug: 'rsvp-1',
    email: 'ada@example.com',
  });
  expect(mockedDeleteByEmail).not.toHaveBeenCalled();
  expect(result.inviteMap.get('ada@example.com')).toBe('url-existing');
  expect(result.autoFixedCount).toBe(1);
  expect(result.autoFixedNotesMap['ada@example.com']).toMatch(/reused/i);
});

test('creates invite map and collects errors', async () => {
  mockedCreate
    .mockResolvedValueOnce({ ok: true, body: { unique_url: 'url-1' } })
    .mockResolvedValueOnce({ ok: false, body: null, error: 'failed' });

  const result = await bulkCreateInvitations({
    applicants: applicants as any,
    rsvpListSlug: 'rsvp-1',
    releaseIds: '1',
  });

  expect(result.inviteMap.get('ada@example.com')).toBe('url-1');
  expect(result.errors.length).toBe(1);
  expect(mockedCreate).toHaveBeenCalledTimes(2);
});

test('handles rejected invitation promise', async () => {
  mockedCreate
    .mockResolvedValueOnce({ ok: true, body: { unique_url: 'url-1' } })
    .mockRejectedValueOnce(new Error('boom'));

  const result = await bulkCreateInvitations({
    applicants: applicants as any,
    rsvpListSlug: 'rsvp-1',
    releaseIds: '1',
  });

  expect(result.inviteMap.size).toBe(1);
  expect(result.errors[0]).toMatch(/boom/);
});

test('limits concurrency to 20', async () => {
  let activeConcurrent = 0;
  let maxConcurrent = 0;

  const manyApplicants = Array.from({ length: 25 }, (_, i) => ({
    _id: String(i),
    firstName: `First${i}`,
    lastName: `Last${i}`,
    email: `user${i}@example.com`,
    status: 'tentatively_accepted',
  }));

  mockedCreate.mockImplementation(() => {
    activeConcurrent++;
    maxConcurrent = Math.max(maxConcurrent, activeConcurrent);
    return new Promise((resolve) => {
      setTimeout(() => {
        activeConcurrent--;
        resolve({ ok: true, body: { unique_url: `url-${activeConcurrent}` } });
      }, 10);
    });
  });

  await bulkCreateInvitations({
    applicants: manyApplicants as any,
    rsvpListSlug: 'rsvp-1',
    releaseIds: '1',
  });

  expect(maxConcurrent).toBe(20);
});

test('does not add artificial delay between batches', async () => {
  const manyApplicants = Array.from({ length: 25 }, (_, i) => ({
    _id: String(i),
    firstName: `First${i}`,
    lastName: `Last${i}`,
    email: `user${i}@example.com`,
    status: 'tentatively_accepted',
  }));

  mockedCreate.mockImplementation(() =>
    Promise.resolve({ ok: true, body: { unique_url: 'url' } })
  );

  const start = Date.now();
  await bulkCreateInvitations({
    applicants: manyApplicants as any,
    rsvpListSlug: 'rsvp-1',
    releaseIds: '1',
  });
  const elapsed = Date.now() - start;

  // Without artificial delays, 25 instant-resolving mocks should complete well under 100ms
  expect(elapsed).toBeLessThan(100);
});

test('deletes existing invitation and retries on duplicate ticket error', async () => {
  mockedCreate
    .mockResolvedValueOnce({
      ok: false,
      body: null,
      error: 'email already has a Tito ticket attached',
    })
    .mockResolvedValueOnce({ ok: true, body: { unique_url: 'url-retry' } })
    .mockResolvedValueOnce({ ok: true, body: { unique_url: 'url-2' } });

  mockedDeleteByEmail.mockResolvedValueOnce({
    ok: true,
    deletedInvitationSlug: 'rsvp_old_123',
    error: null,
  });

  const result = await bulkCreateInvitations({
    applicants: applicants as any,
    rsvpListSlug: 'rsvp-1',
    releaseIds: '1',
  });

  expect(mockedDeleteByEmail).toHaveBeenCalledWith({
    rsvpListSlug: 'rsvp-1',
    email: 'ada@example.com',
  });
  expect(mockedCreate).toHaveBeenCalledTimes(3);
  expect(result.inviteMap.get('ada@example.com')).toBe('url-2');
  expect(result.inviteMap.get('grace@example.com')).toBe('url-retry');
  expect(result.errors).toHaveLength(0);
});

test('records failure when duplicate ticket recovery delete fails', async () => {
  mockedCreate
    .mockResolvedValueOnce({
      ok: false,
      body: null,
      error: 'email has already been taken',
    })
    .mockResolvedValueOnce({ ok: true, body: { unique_url: 'url-2' } });

  mockedDeleteByEmail.mockResolvedValueOnce({
    ok: false,
    deletedInvitationSlug: null,
    error: 'No existing RSVP release invitation found for this email',
  });

  const result = await bulkCreateInvitations({
    applicants: applicants as any,
    rsvpListSlug: 'rsvp-1',
    releaseIds: '1',
  });

  expect(mockedDeleteByEmail).toHaveBeenCalledTimes(1);
  expect(result.inviteMap.get('grace@example.com')).toBe('url-2');
  expect(result.errors).toHaveLength(1);
  expect(result.errors[0]).toMatch(/duplicate ticket recovery failed/i);
});

test('retries when Tito returns 422 email has already been taken payload', async () => {
  mockedCreate
    .mockResolvedValueOnce({
      ok: false,
      body: null,
      error:
        'Tito API error: 422 - {"status":422,"message":"That request was invalid","errors":{"email":["has already been taken"]},"error_list":[{"attribute":"email","message":"has already been taken"}]}',
    })
    .mockResolvedValueOnce({ ok: true, body: { unique_url: 'url-retry-422' } })
    .mockResolvedValueOnce({ ok: true, body: { unique_url: 'url-other' } });

  mockedDeleteByEmail.mockResolvedValueOnce({
    ok: true,
    deletedInvitationSlug: 'rsvp_old_422',
    error: null,
  });

  const result = await bulkCreateInvitations({
    applicants: applicants as any,
    rsvpListSlug: 'rsvp-1',
    releaseIds: '1',
  });

  expect(mockedDeleteByEmail).toHaveBeenCalledWith({
    rsvpListSlug: 'rsvp-1',
    email: 'ada@example.com',
  });
  expect(result.inviteMap.size).toBe(2);
  expect(result.errors).toHaveLength(0);
});

test('skips duplicate emails in same finalize batch', async () => {
  const duplicatedApplicants = [
    applicants[0],
    { ...applicants[0], _id: '3', email: 'ADA@example.com' },
    applicants[1],
  ];

  mockedCreate
    .mockResolvedValueOnce({ ok: true, body: { unique_url: 'url-ada' } })
    .mockResolvedValueOnce({ ok: true, body: { unique_url: 'url-grace' } });

  const result = await bulkCreateInvitations({
    applicants: duplicatedApplicants as any,
    rsvpListSlug: 'rsvp-1',
    releaseIds: '1',
  });

  expect(mockedCreate).toHaveBeenCalledTimes(2);
  expect(result.inviteMap.size).toBe(2);
  expect(
    result.errors.some((e) => e.includes('skipped duplicate applicant email'))
  ).toBe(true);
});
