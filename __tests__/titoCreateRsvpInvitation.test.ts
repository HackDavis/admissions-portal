/** @jest-environment node */

const invitationData = {
  firstName: 'Ada',
  lastName: 'Lovelace',
  email: 'ada@example.com',
  rsvpListSlug: 'rsvp-1',
  releaseIds: '1',
};

const successResponse = {
  ok: true,
  status: 200,
  json: async () => ({
    release_invitation: { unique_url: 'https://tito.test/invite' },
  }),
  headers: new Headers(),
};

const make429 = (retryAfter?: string) => {
  const headers = new Headers();
  if (retryAfter) headers.set('Retry-After', retryAfter);
  return {
    ok: false,
    status: 429,
    text: async () => 'Rate limited',
    headers,
  };
};

describe('createRsvpInvitation', () => {
  const loadModule = async () => {
    const mod = await import('@utils/tito/createRsvpInvitation');
    return mod.default;
  };

  beforeEach(() => {
    jest.resetModules();
    delete process.env.TITO_AUTH_TOKEN;
    delete process.env.TITO_EVENT_BASE_URL;
    (global as any).fetch = jest.fn();
  });

  test('returns error when env vars are missing', async () => {
    const createRsvpInvitation = await loadModule();

    const res = await createRsvpInvitation(invitationData);

    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/Missing Tito API configuration/i);
  });

  test('returns error for invalid releaseIds', async () => {
    process.env.TITO_AUTH_TOKEN = 'token';
    process.env.TITO_EVENT_BASE_URL = 'https://tito.test';
    const createRsvpInvitation = await loadModule();

    const res = await createRsvpInvitation({
      ...invitationData,
      releaseIds: 'abc',
    });

    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/Invalid release IDs format/i);
  });

  test('returns ok on success', async () => {
    process.env.TITO_AUTH_TOKEN = 'token';
    process.env.TITO_EVENT_BASE_URL = 'https://tito.test';
    (global as any).fetch = jest.fn().mockResolvedValue(successResponse);
    const createRsvpInvitation = await loadModule();

    const res = await createRsvpInvitation(invitationData);

    expect(res.ok).toBe(true);
    expect(res.body?.unique_url).toBe('https://tito.test/invite');
  });

  test('returns error on API failure', async () => {
    process.env.TITO_AUTH_TOKEN = 'token';
    process.env.TITO_EVENT_BASE_URL = 'https://tito.test';
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => 'Bad Request',
      headers: new Headers(),
    });
    const createRsvpInvitation = await loadModule();

    const res = await createRsvpInvitation(invitationData);

    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/Tito API 400/);
  });

  test('retries on 429 and succeeds', async () => {
    jest.useFakeTimers();
    process.env.TITO_AUTH_TOKEN = 'token';
    process.env.TITO_EVENT_BASE_URL = 'https://tito.test';

    (global as any).fetch = jest
      .fn()
      .mockResolvedValueOnce(make429())
      .mockResolvedValueOnce(make429())
      .mockResolvedValueOnce(successResponse);

    const createRsvpInvitation = await loadModule();

    const promise = createRsvpInvitation(invitationData);

    // Advance past 1st retry delay (base 1s + up to 1s jitter)
    await jest.advanceTimersByTimeAsync(2000);
    // Advance past 2nd retry delay (base 2s + up to 1s jitter)
    await jest.advanceTimersByTimeAsync(3000);

    const res = await promise;

    expect(res.ok).toBe(true);
    expect(res.body?.unique_url).toBe('https://tito.test/invite');
    expect((global as any).fetch).toHaveBeenCalledTimes(3);

    jest.useRealTimers();
  });

  test('respects Retry-After header', async () => {
    jest.useFakeTimers();
    process.env.TITO_AUTH_TOKEN = 'token';
    process.env.TITO_EVENT_BASE_URL = 'https://tito.test';

    (global as any).fetch = jest
      .fn()
      .mockResolvedValueOnce(make429('2'))
      .mockResolvedValueOnce(successResponse);

    const createRsvpInvitation = await loadModule();

    const promise = createRsvpInvitation(invitationData);

    // Retry-After: 2 means 2000ms
    await jest.advanceTimersByTimeAsync(2000);

    const res = await promise;

    expect(res.ok).toBe(true);
    expect((global as any).fetch).toHaveBeenCalledTimes(2);

    jest.useRealTimers();
  });

  test('gives up after max retries on persistent 429', async () => {
    jest.useFakeTimers();
    process.env.TITO_AUTH_TOKEN = 'token';
    process.env.TITO_EVENT_BASE_URL = 'https://tito.test';

    // Return 429 for every call (6 total: initial + 5 retries)
    (global as any).fetch = jest.fn().mockResolvedValue(make429());

    const createRsvpInvitation = await loadModule();

    const promise = createRsvpInvitation(invitationData);

    // Advance enough time for all 5 retries with exponential backoff + jitter.
    await jest.advanceTimersByTimeAsync(45000);

    const res = await promise;

    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/Tito API 429/);
    // 1 initial + 5 retries = 6 total calls
    expect((global as any).fetch).toHaveBeenCalledTimes(6);

    jest.useRealTimers();
  });

  test('does not retry on non-429 errors', async () => {
    process.env.TITO_AUTH_TOKEN = 'token';
    process.env.TITO_EVENT_BASE_URL = 'https://tito.test';

    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => 'Internal Server Error',
      headers: new Headers(),
    });

    const createRsvpInvitation = await loadModule();

    const res = await createRsvpInvitation(invitationData);

    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/500/);
    expect((global as any).fetch).toHaveBeenCalledTimes(1);
  });
});
