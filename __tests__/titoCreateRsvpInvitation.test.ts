/** @jest-environment node */

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

    const res = await createRsvpInvitation({
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      rsvpListSlug: 'rsvp-1',
      releaseIds: '1',
    });

    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/Missing Tito API configuration/i);
  });

  test('returns error for invalid releaseIds', async () => {
    process.env.TITO_AUTH_TOKEN = 'token';
    process.env.TITO_EVENT_BASE_URL = 'https://tito.test';
    const createRsvpInvitation = await loadModule();

    const res = await createRsvpInvitation({
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      rsvpListSlug: 'rsvp-1',
      releaseIds: 'abc',
    });

    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/Invalid release IDs format/i);
  });

  test('returns ok on success', async () => {
    process.env.TITO_AUTH_TOKEN = 'token';
    process.env.TITO_EVENT_BASE_URL = 'https://tito.test';
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        release_invitation: { unique_url: 'https://tito.test/invite' },
      }),
    });
    const createRsvpInvitation = await loadModule();

    const res = await createRsvpInvitation({
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      rsvpListSlug: 'rsvp-1',
      releaseIds: '1',
    });

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
    });
    const createRsvpInvitation = await loadModule();

    const res = await createRsvpInvitation({
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      rsvpListSlug: 'rsvp-1',
      releaseIds: '1',
    });

    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/Tito API error/i);
  });
});
