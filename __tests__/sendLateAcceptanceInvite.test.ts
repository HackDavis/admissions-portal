/** @jest-environment node */
import { sendLateAcceptanceInvite } from '@actions/applications/sendLateAcceptanceInvite';
import { getDatabase } from '@utils/mongodb/mongoClient.mjs';
import bulkCreateInvitations from '@utils/tito/bulkCreateInvitations';
import { prepareMailchimpInvites } from '@utils/mailchimp/prepareMailchimp';
import { auth } from '@/auth';

jest.mock('@utils/mongodb/mongoClient.mjs', () => ({ getDatabase: jest.fn() }));
jest.mock('@utils/tito/bulkCreateInvitations', () => jest.fn());
jest.mock('@utils/mailchimp/prepareMailchimp', () => ({
  prepareMailchimpInvites: jest.fn(),
}));
jest.mock('@/auth', () => ({ auth: jest.fn() }));
jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));

const id = '64b7f0c2a1b2c3d4e5f60718';
const options = { rsvpListSlug: 'hackers', releaseIds: ['101'] };

const findOne = jest.fn();
const updateOne = jest.fn();
(getDatabase as jest.Mock).mockResolvedValue({
  collection: () => ({ findOne, updateOne }),
});
const createTito = bulkCreateInvitations as jest.Mock;
const prepareMailchimp = prepareMailchimpInvites as jest.Mock;

const lateAcceptance = {
  email: 'late@example.com',
  firstName: 'Late',
  lastName: 'Person',
  status: 'accepted',
  manualEntry: { addedById: 'a', addedByEmail: 'a@x.com', addedAt: new Date() },
};

beforeEach(() => {
  (auth as jest.Mock).mockResolvedValue({ user: { id: 'a', role: 'admin' } });
  findOne.mockResolvedValue(lateAcceptance);
  createTito.mockResolvedValue({
    ok: true,
    inviteMap: new Map([['late@example.com', 'https://tito/abc']]),
    errors: [],
  });
  prepareMailchimp.mockResolvedValue({ ok: true, ids: [id], error: null });
});

test('creates the Tito invite, sends Hub + Mailchimp, and records invitedAt', async () => {
  const res = await sendLateAcceptanceInvite(id, options);

  expect(res.ok).toBe(true);
  expect(createTito).toHaveBeenCalledWith({
    applicants: [
      expect.objectContaining({ _id: id, email: 'late@example.com' }),
    ],
    rsvpListSlug: 'hackers',
    releaseIds: '101',
  });
  expect(prepareMailchimp).toHaveBeenCalledWith('accepted', {
    applicantIds: [id],
    titoInviteMap: { 'late@example.com': 'https://tito/abc' },
    rsvpListSlug: 'hackers',
  });
  expect(
    updateOne.mock.calls[0][1].$set['manualEntry.invitedAt']
  ).toBeInstanceOf(Date);
});

test.each([
  ['not manually added', { ...lateAcceptance, manualEntry: undefined }],
  ['not accepted', { ...lateAcceptance, status: 'waitlisted' }],
  [
    'already invited',
    {
      ...lateAcceptance,
      manualEntry: { ...lateAcceptance.manualEntry, invitedAt: new Date() },
    },
  ],
])('refuses applications that are %s', async (_, application) => {
  findOne.mockResolvedValue(application);

  const res = await sendLateAcceptanceInvite(id, options);

  expect(res.ok).toBe(false);
  expect(createTito).not.toHaveBeenCalled();
  expect(prepareMailchimp).not.toHaveBeenCalled();
});

test('does not email or mark invited when Tito fails', async () => {
  createTito.mockResolvedValue({
    ok: false,
    inviteMap: new Map(),
    errors: ['late@example.com: boom'],
  });

  const res = await sendLateAcceptanceInvite(id, options);

  expect(res).toMatchObject({
    ok: false,
    error: expect.stringContaining('boom'),
  });
  expect(prepareMailchimp).not.toHaveBeenCalled();
  expect(updateOne).not.toHaveBeenCalled();
});

test('leaves the applicant retryable when Mailchimp fails', async () => {
  prepareMailchimp.mockResolvedValue({ ok: true, ids: [], error: '1 FAILED' });

  const res = await sendLateAcceptanceInvite(id, options);

  expect(res.ok).toBe(false);
  expect(updateOne).not.toHaveBeenCalled();
});

test('requires an RSVP list and release', async () => {
  const res = await sendLateAcceptanceInvite(id, {
    rsvpListSlug: '',
    releaseIds: [],
  });
  expect(res.ok).toBe(false);
  expect(findOne).not.toHaveBeenCalled();
});

test('refuses non-admins', async () => {
  (auth as jest.Mock).mockResolvedValue({ user: { role: 'hacker' } });

  const res = await sendLateAcceptanceInvite(id, options);

  expect(res).toEqual({ ok: false, body: null, error: 'Unauthorized' });
  expect(findOne).not.toHaveBeenCalled();
});

test('accepts numeric release ids, which is what Tito actually returns', async () => {
  const res = await sendLateAcceptanceInvite(id, {
    rsvpListSlug: 'hackers',
    releaseIds: [101, 102] as unknown as string[],
  });

  expect(res.ok).toBe(true);
  expect(createTito).toHaveBeenCalledWith(
    expect.objectContaining({ releaseIds: '101,102' })
  );
});
