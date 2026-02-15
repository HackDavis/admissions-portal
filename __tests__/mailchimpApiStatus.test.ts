/** @jest-environment node */
import {
  reserveMailchimpAPIKeyIndices,
} from '@utils/mailchimp/mailchimpApiStatus';

jest.mock('@actions/mailchimp/getMailchimp', () => ({
  getMailchimp: jest.fn(),
}));

jest.mock('@actions/mailchimp/updateMailchimp', () => ({
  updateMailchimp: jest.fn(),
}));

import { getMailchimp } from '@actions/mailchimp/getMailchimp';
import { updateMailchimp } from '@actions/mailchimp/updateMailchimp';

const mockedGetMailchimp = getMailchimp as jest.Mock;
const mockedUpdateMailchimp = updateMailchimp as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockedUpdateMailchimp.mockResolvedValue({ ok: true });

  // Default env vars for key 1 and 2
  process.env.MAILCHIMP_API_KEY_1 = 'key1';
  process.env.MAILCHIMP_SERVER_PREFIX_1 = 'us1';
  process.env.MAILCHIMP_AUDIENCE_ID_1 = 'aud1';
  process.env.MAILCHIMP_API_KEY_2 = 'key2';
  process.env.MAILCHIMP_SERVER_PREFIX_2 = 'us2';
  process.env.MAILCHIMP_AUDIENCE_ID_2 = 'aud2';
});

test('assigns all to same key when under limit', async () => {
  mockedGetMailchimp.mockResolvedValue({
    ok: true,
    body: { apiKeyIndex: 1, apiCallsMade: 10, maxApiCalls: 500, maxApiKeys: 2 },
  });

  const result = await reserveMailchimpAPIKeyIndices(5);

  expect(result).toEqual([1, 1, 1, 1, 1]);
  // Single increment write: apiCallsMade +5
  expect(mockedUpdateMailchimp).toHaveBeenCalledTimes(1);
  expect(mockedUpdateMailchimp).toHaveBeenCalledWith(
    expect.objectContaining({ apiCallsMade: 5 })
  );
});

test('rotates key mid-batch when limit is reached', async () => {
  // 497 calls made, max 500 => 2 more on key 1, then rotate to key 2
  mockedGetMailchimp.mockResolvedValue({
    ok: true,
    body: { apiKeyIndex: 1, apiCallsMade: 497, maxApiCalls: 500, maxApiKeys: 2 },
  });

  const result = await reserveMailchimpAPIKeyIndices(5);

  // 2 slots on key 1 (calls 497→498, 498→499), then rotate at 499 (>= 499),
  // 3 slots on key 2
  expect(result).toEqual([1, 1, 2, 2, 2]);
  // Should write: increment apiKeyIndex by 1, reset calls, then increment by calls on final key
  expect(mockedUpdateMailchimp).toHaveBeenCalledWith(
    expect.objectContaining({ apiKeyIndex: 1 })
  );
  expect(mockedUpdateMailchimp).toHaveBeenCalledWith(
    expect.objectContaining({ apiCallsMade: 0 })
  );
  expect(mockedUpdateMailchimp).toHaveBeenCalledWith(
    expect.objectContaining({ apiCallsMade: 3 })
  );
});

test('throws when all keys are exhausted', async () => {
  // Already on key 2 (the max), and at the limit
  mockedGetMailchimp.mockResolvedValue({
    ok: true,
    body: { apiKeyIndex: 2, apiCallsMade: 499, maxApiCalls: 500, maxApiKeys: 2 },
  });

  await expect(reserveMailchimpAPIKeyIndices(3)).rejects.toThrow(
    'All Mailchimp API keys exhausted'
  );
  // No writes should have been made
  expect(mockedUpdateMailchimp).not.toHaveBeenCalled();
});

test('throws when getMailchimp fails', async () => {
  mockedGetMailchimp.mockResolvedValue({
    ok: false,
    error: 'DB connection failed',
  });

  await expect(reserveMailchimpAPIKeyIndices(1)).rejects.toThrow(
    'DB connection failed'
  );
});

test('throws when rotated key env vars are missing', async () => {
  delete process.env.MAILCHIMP_API_KEY_2;

  mockedGetMailchimp.mockResolvedValue({
    ok: true,
    body: { apiKeyIndex: 1, apiCallsMade: 499, maxApiCalls: 500, maxApiKeys: 2 },
  });

  await expect(reserveMailchimpAPIKeyIndices(2)).rejects.toThrow(
    'Missing Environment Variable'
  );
});

test('handles rotation at exact boundary (apiCallsMade === maxApiCalls - 1)', async () => {
  mockedGetMailchimp.mockResolvedValue({
    ok: true,
    body: { apiKeyIndex: 1, apiCallsMade: 499, maxApiCalls: 500, maxApiKeys: 2 },
  });

  const result = await reserveMailchimpAPIKeyIndices(3);

  // First call is already at 499 (>= 499), so all 3 go to key 2
  expect(result).toEqual([2, 2, 2]);
});
