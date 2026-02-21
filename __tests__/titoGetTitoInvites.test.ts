/** @jest-environment node */

jest.mock('axios', () => ({
  get: jest.fn(),
}));

import axios from 'axios';
import {
  getTitoRsvpList,
  getUnredeemedTitoInvites,
} from '@utils/tito/getTitoInvites';

const mockedAxiosGet = axios.get as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  process.env.TITO_AUTH_TOKEN = 'token';
  process.env.TITO_EVENT_BASE_URL = 'https://tito.test';
});

test('getTitoRsvpList returns requested list', async () => {
  mockedAxiosGet.mockResolvedValue({
    data: { rsvp_lists: [{ slug: 'a' }, { slug: 'b' }] },
  });

  const list = await getTitoRsvpList(1);
  expect(list.slug).toBe('b');
});

test('getTitoRsvpList throws when no lists', async () => {
  mockedAxiosGet.mockResolvedValue({ data: { rsvp_lists: [] } });

  await expect(getTitoRsvpList(0)).rejects.toThrow(/No RSVP lists returned/i);
});

test('getUnredeemedTitoInvites returns unredeemed map', async () => {
  mockedAxiosGet
    .mockResolvedValueOnce({
      data: {
        release_invitations: Array.from({ length: 500 }).map((_, i) => ({
          email: `user${i}@example.com`,
          unique_url: `url-${i}`,
          redeemed: false,
        })),
      },
    })
    .mockResolvedValueOnce({
      data: {
        release_invitations: [
          {
            email: 'redeemed@example.com',
            unique_url: 'url-x',
            redeemed: true,
          },
          {
            email: 'fresh@example.com',
            unique_url: 'url-fresh',
            redeemed: false,
          },
        ],
      },
    });

  const map = await getUnredeemedTitoInvites('slug-1');
  expect(map.get('fresh@example.com')).toBe('url-fresh');
  expect(map.has('redeemed@example.com')).toBe(false);
  expect(map.size).toBe(501);
});

test('getUnredeemedTitoInvites throws on axios error', async () => {
  mockedAxiosGet.mockRejectedValue(new Error('boom'));

  await expect(getUnredeemedTitoInvites('slug-1')).rejects.toThrow(/boom/);
});
