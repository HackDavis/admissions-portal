/** @jest-environment node */

describe('createRsvpList', () => {
  const loadModule = async () => {
    const mod = await import('@utils/tito/createRsvpList');
    return mod.default;
  };

  beforeEach(() => {
    jest.resetModules();
    delete process.env.TITO_AUTH_TOKEN;
    delete process.env.TITO_EVENT_BASE_URL;
    (global as any).fetch = jest.fn();
  });

  test('returns error when env vars are missing', async () => {
    const createRsvpList = await loadModule();
    const res = await createRsvpList('RSVP 1');
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/Missing Tito API configuration/i);
  });

  test('returns error when title is missing', async () => {
    process.env.TITO_AUTH_TOKEN = 'token';
    process.env.TITO_EVENT_BASE_URL = 'https://tito.test';
    const createRsvpList = await loadModule();

    const res = await createRsvpList('');
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/RSVP list title is required/i);
  });

  test('returns ok on success', async () => {
    process.env.TITO_AUTH_TOKEN = 'token';
    process.env.TITO_EVENT_BASE_URL = 'https://tito.test';
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ rsvp_list: { id: '1', slug: 'rsvp-1' } }),
    });
    const createRsvpList = await loadModule();

    const res = await createRsvpList('RSVP 1');
    expect(res.ok).toBe(true);
    expect(res.body?.slug).toBe('rsvp-1');
  });

  test('returns error on API failure', async () => {
    process.env.TITO_AUTH_TOKEN = 'token';
    process.env.TITO_EVENT_BASE_URL = 'https://tito.test';
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => 'Server error',
    });
    const createRsvpList = await loadModule();

    const res = await createRsvpList('RSVP 1');
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/Tito API error/i);
  });
});
