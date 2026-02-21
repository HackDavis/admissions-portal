/** @jest-environment node */

jest.mock('@utils/tito/getRsvpLists', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('@utils/tito/getUnredeemedRsvpInvitations', () => ({
  getUnredeemedRsvpInvitations: jest.fn(),
}));

import getRsvpLists from '@utils/tito/getRsvpLists';
import { getUnredeemedRsvpInvitations } from '@utils/tito/getUnredeemedRsvpInvitations';

const mockedGetRsvpLists = getRsvpLists as jest.Mock;
const mockedGetUnredeemed = getUnredeemedRsvpInvitations as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  process.env.TITO_AUTH_TOKEN = 'token';
  process.env.TITO_EVENT_BASE_URL = 'https://tito.test';
});

test('getRsvpLists returns requested list', async () => {
  mockedGetRsvpLists.mockResolvedValue({
    ok: true,
    body: [{ slug: 'a' }, { slug: 'b' }],
  });

  const res = await getRsvpLists();
  expect(res.body?.[1].slug).toBe('b');
});

test('getUnredeemedRsvpInvitations returns unredeemed map', async () => {
  mockedGetUnredeemed.mockResolvedValue({
    ok: true,
    body: new Map([
      ['fresh@example.com', 'url-fresh'],
      ['user1@example.com', 'url-1'],
    ]),
    error: null,
  });

  const res = await getUnredeemedRsvpInvitations('slug-1');
  expect(res.body?.get('fresh@example.com')).toBe('url-fresh');
  expect(res.body?.size).toBe(2);
});

test('getUnredeemedRsvpInvitations handles error', async () => {
  mockedGetUnredeemed.mockResolvedValue({
    ok: false,
    body: null,
    error: 'Failed to fetch',
  });

  const res = await getUnredeemedRsvpInvitations('slug-1');
  expect(res.ok).toBe(false);
  expect(res.error).toBe('Failed to fetch');
});
