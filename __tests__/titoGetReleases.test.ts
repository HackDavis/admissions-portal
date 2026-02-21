/** @jest-environment node */

describe('getReleases', () => {
  const loadModule = async () => {
    const mod = await import('@utils/tito/getReleases');
    return mod.default;
  };

  beforeEach(() => {
    jest.resetModules();
    delete process.env.TITO_AUTH_TOKEN;
    delete process.env.TITO_EVENT_BASE_URL;
    (global as any).fetch = jest.fn();
  });

  test('returns error when env vars are missing', async () => {
    const getReleases = await loadModule();
    const res = await getReleases();
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/Missing Tito API configuration/i);
  });

  test('returns ok with releases', async () => {
    process.env.TITO_AUTH_TOKEN = 'token';
    process.env.TITO_EVENT_BASE_URL = 'https://tito.test';
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ releases: [{ id: '1', slug: 'rel-1' }] }),
    });
    const getReleases = await loadModule();

    const res = await getReleases();
    expect(res.ok).toBe(true);
    expect(res.body?.length).toBe(1);
  });

  test('returns error on API failure', async () => {
    process.env.TITO_AUTH_TOKEN = 'token';
    process.env.TITO_EVENT_BASE_URL = 'https://tito.test';
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => 'Server error',
      headers: new Headers(),
    });
    const getReleases = await loadModule();

    const res = await getReleases();
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/Tito API 500/);
  });
});
