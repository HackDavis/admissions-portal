/** @jest-environment node */
import { NextRequest } from 'next/server';
import { ObjectId } from 'mongodb';

const findReferral = jest.fn();
const insertOne = jest.fn();
const findApplication = jest.fn();
const find = jest.fn();
const getCookie = jest.fn();
jest.mock('@utils/mongodb/mongoClient.mjs', () => ({
  getDatabase: async () => ({
    collection: (name: string) =>
      name === 'referrals'
        ? { findOne: findReferral }
        : { findOne: findApplication, insertOne, find },
  }),
}));
jest.mock('next/headers', () => ({ cookies: () => ({ get: getCookie }) }));
jest.mock('@utils/request/parseAndReplace', () => ({
  __esModule: true,
  default: async (body: object) => body,
}));
import { GET } from '../app/(api)/api/referrals/route';
import { CreateApplication } from '@datalib/applications/createApplication';
import { GetApplicationStats } from '@datalib/applications/getStats';

beforeEach(() => {
  jest.resetAllMocks();
  findReferral.mockImplementation(async ({ code }) =>
    code === '123456' ? { name: 'Tabling' } : null
  );
  insertOne.mockResolvedValue({ insertedId: new ObjectId() });
  findApplication.mockResolvedValue(null);
});
const request = (code: string, cookie?: string) =>
  new NextRequest(`https://apply.hackdavis.io/api/referrals?ref=${code}`, {
    headers: cookie ? { cookie: `hd_ref=${cookie}` } : {},
  });
test('captures valid codes with a protected 30-day cookie', async () => {
  const res = await GET(request('123456'));
  expect((await res.json()).captured).toBe(true);
  expect(res.cookies.get('hd_ref')).toMatchObject({
    value: '123456',
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 2592000,
  });
});
test.each(['bad', '999999'])('replaces a stale cookie (%s)', async (cookie) => {
  const res = await GET(request('123456', cookie));
  expect(res.cookies.get('hd_ref')?.value).toBe('123456');
});
test('keeps a valid first-touch cookie', async () => {
  const res = await GET(request('999999', '123456'));
  expect((await res.json()).captured).toBe(false);
  expect(res.headers.get('set-cookie')).toBeNull();
});
test.each(['bad', '999999'])(
  'does not set a cookie for invalid incoming code %s',
  async (code) => {
    const res = await GET(request(code));
    expect((await res.json()).captured).toBe(false);
    expect(res.headers.get('set-cookie')).toBeNull();
  }
);
test.each([
  ['123456', 'Tabling'],
  ['999999', 'unattributed'],
  ['bad', 'unattributed'],
  [undefined, 'unattributed'],
])(
  'saves attribution for cookie %s and ignores client-supplied attribution',
  async (code, source) => {
    getCookie.mockReturnValue(code ? { value: code } : undefined);
    expect(
      (
        await CreateApplication({
          email: 'test@example.com',
          referralSource: 'Forged',
        })
      ).ok
    ).toBe(true);
    expect(insertOne).toHaveBeenCalledWith(
      expect.objectContaining({ referralSource: source })
    );
  }
);
test('referral lookup failure does not block application submission', async () => {
  getCookie.mockReturnValue({ value: '123456' });
  findReferral.mockRejectedValue(new Error('offline'));
  expect((await CreateApplication({ email: 'test@example.com' })).ok).toBe(
    true
  );
  expect(insertOne).toHaveBeenCalledWith(
    expect.objectContaining({ referralSource: 'unattributed' })
  );
});
test('counts normalized sources within each scope, including legacy applications', async () => {
  const records = [
    { status: 'pending', referralSource: ' Tabling ' },
    { status: 'accepted', referralSource: 'Tabling' },
    { status: 'tentatively_accepted', referralSource: 'Flyers' },
    { status: 'accepted' },
    { status: 'pending', referralSource: ' ' },
  ];
  find.mockImplementation((query) => ({
    toArray: async () =>
      records.filter(
        (r) => !query.status || query.status.$in.includes(r.status)
      ),
  }));
  const res = await GetApplicationStats();
  expect(res.ok).toBe(true);
  expect(res.body?.all.referralCounts).toEqual([
    { source: 'Tabling', count: 2 },
    { source: 'unattributed', count: 2 },
    { source: 'Flyers', count: 1 },
  ]);
  expect(res.body?.processed.referralCounts).toEqual([
    { source: 'Tabling', count: 1 },
    { source: 'unattributed', count: 1 },
  ]);
  expect(res.body?.hypothetic.referralCounts).toEqual([
    { source: 'Flyers', count: 1 },
    { source: 'Tabling', count: 1 },
    { source: 'unattributed', count: 1 },
  ]);
  expect(find).toHaveBeenCalledWith(
    expect.anything(),
    expect.objectContaining({
      projection: expect.objectContaining({ referralSource: 1 }),
    })
  );
});

test('rejects readable referral names', async () => {
  const res = await GET(request('instagram'));
  expect((await res.json()).captured).toBe(false);
  expect(res.headers.get('set-cookie')).toBeNull();
});
