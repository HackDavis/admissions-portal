/** @jest-environment node */

jest.mock('@actions/applications/getApplication', () => ({
  getAdminApplications: jest.fn(),
}));

import { generateTitoCSV } from '@utils/tito/generateTitoCSV';
import { getAdminApplications } from '@actions/applications/getApplication';

const mockedGetAdminApplications = getAdminApplications as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  process.env.TITO_HACKER_TICKET_NAME = 'test ticket';
  process.env.TITO_TICKET_EXPIRY = '2026-12-31T23:59:59Z';
});

test('generates Tito import CSV for accepted applicants', async () => {
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

  expect(csv).toMatch(
    'First Name,Last Name,Email,Expiry Time,Redirect?,Discount Code,test ticket'
  );
  expect(csv).toMatch(
    '"Ada","Lovelace","ada@example.com","2026-12-31T23:59:59Z","Y","","Y"'
  );
});

test('generates import CSV for accepted applicants', async () => {
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
  expect(csv).toMatch('"Y"');
});

test('throws when applicant fetch fails', async () => {
  mockedGetAdminApplications.mockResolvedValue({
    ok: false,
    body: null,
    error: 'db down',
  });

  await expect(generateTitoCSV('accepted')).rejects.toThrow(/db down/);
});
