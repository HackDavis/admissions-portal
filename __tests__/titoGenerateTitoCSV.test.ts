/** @jest-environment node */

jest.mock('@actions/applications/getApplication', () => ({
  getAdminApplications: jest.fn(),
}));

import { generateTitoCSV } from '@utils/tito/generateTitoCSV';
import { getAdminApplications } from '@actions/applications/getApplication';

const mockedGetAdminApplications = getAdminApplications as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

test('generates CSV with Tito URLs when map is provided', async () => {
  mockedGetAdminApplications.mockResolvedValue({
    ok: true,
    body: [
      {
        _id: '1',
        firstName: 'Ada',
        lastName: 'Lovelace',
        email: 'ada@example.com',
        status: 'accepted',
      },
    ],
    error: null,
  });

  const map = new Map([['ada@example.com', 'tito-url']]);
  const csv = await generateTitoCSV('accepted', map);

  expect(csv).toMatch('Tito Invite URL');
  expect(csv).toMatch('tito-url');
});

test('generates import CSV when map is not provided', async () => {
  mockedGetAdminApplications.mockResolvedValue({
    ok: true,
    body: [
      {
        _id: '1',
        firstName: 'Ada',
        lastName: 'Lovelace',
        email: 'ada@example.com',
        status: 'accepted',
      },
    ],
    error: null,
  });

  const csv = await generateTitoCSV('accepted');

  expect(csv).toMatch('Expiry Time');
  expect(csv).toMatch('test ticket');
});

test('throws when applicant fetch fails', async () => {
  mockedGetAdminApplications.mockResolvedValue({
    ok: false,
    body: null,
    error: 'db down',
  });

  await expect(generateTitoCSV('accepted')).rejects.toThrow(/db down/);
});
