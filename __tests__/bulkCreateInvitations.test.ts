/** @jest-environment node */
import bulkCreateInvitations from '@utils/tito/bulkCreateInvitations';

jest.mock('@utils/tito/createRsvpInvitation', () => ({
  __esModule: true,
  default: jest.fn(),
}));

import createRsvpInvitation from '@utils/tito/createRsvpInvitation';

const mockedCreate = createRsvpInvitation as jest.Mock;

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
