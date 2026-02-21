/** @jest-environment node */
import { prepareMailchimpInvites } from '@utils/mailchimp/prepareMailchimp';

jest.mock('@utils/mailchimp/mailchimpApiStatus', () => ({
  reserveMailchimpAPIKeyIndex: jest.fn(),
  reserveMailchimpAPIKeyIndices: jest.fn(),
}));

jest.mock('@utils/getFilteredApplications', () => ({
  getApplicationsByStatuses: jest.fn(),
  getApplicationsForRsvpReminder: jest.fn(),
}));

jest.mock('@utils/tito/getTitoInvites', () => ({
  getTitoRsvpList: jest.fn(),
  getUnredeemedTitoInvites: jest.fn(),
}));

jest.mock('@utils/hub/createHubInvite', () => ({
  getHubSession: jest.fn(),
  createHubInvite: jest.fn(),
}));

jest.mock('axios', () => ({
  create: jest.fn(),
}));

import {
  reserveMailchimpAPIKeyIndex,
  reserveMailchimpAPIKeyIndices,
} from '@utils/mailchimp/mailchimpApiStatus';
import {
  getApplicationsByStatuses,
  getApplicationsForRsvpReminder,
} from '@utils/getFilteredApplications';
import {
  getTitoRsvpList,
  getUnredeemedTitoInvites,
} from '@utils/tito/getTitoInvites';
import { getHubSession, createHubInvite } from '@utils/hub/createHubInvite';
import axios from 'axios';

const mockedReserveKey = reserveMailchimpAPIKeyIndex as jest.Mock;
const mockedReserveKeys = reserveMailchimpAPIKeyIndices as jest.Mock;
const mockedGetByStatuses = getApplicationsByStatuses as jest.Mock;
const mockedGetForReminder = getApplicationsForRsvpReminder as jest.Mock;
const mockedGetTitoRsvpList = getTitoRsvpList as jest.Mock;
const mockedGetUnredeemed = getUnredeemedTitoInvites as jest.Mock;
const mockedGetHubSession = getHubSession as jest.Mock;
const mockedCreateHubInvite = createHubInvite as jest.Mock;
const mockedAxiosCreate = axios.create as jest.Mock;

const baseApplicants = [
  {
    _id: '1',
    firstName: 'Ada',
    lastName: 'Lovelace',
    email: 'ada@example.com',
    status: 'tentatively_accepted',
  },
];

beforeEach(() => {
  jest.clearAllMocks();

  process.env.MAILCHIMP_SERVER_PREFIX_1 = 'server';
  process.env.MAILCHIMP_API_KEY_1 = 'key';
  process.env.MAILCHIMP_AUDIENCE_ID_1 = 'aud';
  process.env.HACKDAVIS_HUB_BASE_URL = 'https://hub.test';
  process.env.HUB_ADMIN_EMAIL = 'admin@test.com';
  process.env.HUB_ADMIN_PASSWORD = 'secret';
  process.env.TITO_AUTH_TOKEN = 'token';
  process.env.TITO_EVENT_BASE_URL = 'https://tito.test';

  mockedReserveKey.mockResolvedValue(1);
  mockedReserveKeys.mockResolvedValue([1]);
  mockedGetByStatuses.mockResolvedValue(baseApplicants);
  mockedGetForReminder.mockResolvedValue([]);
  mockedGetHubSession.mockResolvedValue({});
  mockedCreateHubInvite.mockResolvedValue('hub-url');

  mockedAxiosCreate.mockReturnValue({
    put: jest.fn().mockResolvedValue({ data: { merge_fields: {} } }),
  });
});

test('uses provided Tito map and skips Tito fetch', async () => {
  const res = await prepareMailchimpInvites('tentatively_accepted', {
    titoInviteMap: { 'ada@example.com': 'tito-url' },
    rsvpListSlug: 'rsvp-1',
  });

  expect(res.ok).toBe(true);
  expect(mockedGetTitoRsvpList).not.toHaveBeenCalled();
  expect(mockedGetUnredeemed).not.toHaveBeenCalled();
  expect(mockedCreateHubInvite).toHaveBeenCalledWith(
    {},
    'Ada',
    'Lovelace',
    'ada@example.com'
  );
});

test('falls back to Tito fetch when map is not provided', async () => {
  mockedGetTitoRsvpList.mockResolvedValue({ slug: 'fallback-list' });
  mockedGetUnredeemed.mockResolvedValue(
    new Map([['ada@example.com', 'tito-url']])
  );

  const res = await prepareMailchimpInvites('tentatively_accepted');

  expect(res.ok).toBe(true);
  expect(mockedGetTitoRsvpList).toHaveBeenCalled();
  expect(mockedGetUnredeemed).toHaveBeenCalledWith('fallback-list');
});

test('skips applicant missing from Tito map without calling Hub', async () => {
  // Provide a Tito map that does NOT include ada@example.com
  const res = await prepareMailchimpInvites('tentatively_accepted', {
    titoInviteMap: { 'other@example.com': 'tito-url-other' },
    rsvpListSlug: 'rsvp-1',
  });

  expect(res.ids).toEqual([]);
  expect(mockedCreateHubInvite).not.toHaveBeenCalled();
  expect(res.error).toContain('Skipped');
});

test('uses RSVP reminder path without Tito fetch', async () => {
  mockedGetForReminder.mockResolvedValue(baseApplicants);

  const res = await prepareMailchimpInvites('rsvp_reminder');

  expect(res.ok).toBe(true);
  expect(mockedGetForReminder).toHaveBeenCalled();
  expect(mockedGetUnredeemed).not.toHaveBeenCalled();
});
