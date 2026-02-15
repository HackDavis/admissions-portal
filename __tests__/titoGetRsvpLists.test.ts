/** @jest-environment node */

describe('getRsvpLists', () => {
  const loadModule = async () => {
    const mod = await import('@utils/tito/getRsvpLists');
    return mod.default;
  };

  beforeEach(() => {
    jest.resetModules();
    delete process.env.TITO_AUTH_TOKEN;
    delete process.env.TITO_EVENT_BASE_URL;
    (global as any).fetch = jest.fn();
  });

  test('returns error when env vars are missing', async () => {
    const getRsvpLists = await loadModule();
    const res = await getRsvpLists();
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/Missing Tito API configuration/i);
  });

  test('returns ok with rsvp lists', async () => {
    process.env.TITO_AUTH_TOKEN = 'token';
    process.env.TITO_EVENT_BASE_URL = 'https://tito.test';
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ rsvp_lists: [{ id: '1', slug: 'rsvp-1' }] }),
    });
    const getRsvpLists = await loadModule();

    const res = await getRsvpLists();
    expect(res.ok).toBe(true);
    expect(res.body?.length).toBe(1);
  });

  test('returns error on API failure', async () => {
    process.env.TITO_AUTH_TOKEN = 'token';
    process.env.TITO_EVENT_BASE_URL = 'https://tito.test';
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => 'Bad Request',
    });
    const getRsvpLists = await loadModule();

    const res = await getRsvpLists();
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/Tito API error/i);
  });
});
