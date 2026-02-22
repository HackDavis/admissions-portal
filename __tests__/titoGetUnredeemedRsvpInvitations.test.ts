/** @jest-environment node */

describe('getUnredeemedRsvpInvitations', () => {
  const loadModule = async () => {
    const mod = await import('@utils/tito/getUnredeemedRsvpInvitations');
    return mod.getUnredeemedRsvpInvitations;
  };

  beforeEach(() => {
    jest.resetModules();
    process.env.TITO_AUTH_TOKEN = 'token';
    process.env.TITO_EVENT_BASE_URL = 'https://tito.test';
    (global as any).fetch = jest.fn();
  });

  test('successfully maps unredeemed invites and ignores redeemed ones', async () => {
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        release_invitations: [
          { email: 'fresh@test.com', unique_url: 'url-1', redeemed: false },
          { email: 'old@test.com', unique_url: 'url-2', redeemed: true },
        ],
      }),
    });

    const getUnredeemedRsvpInvitations = await loadModule();
    const res = await getUnredeemedRsvpInvitations('slug-1');

    expect(res.ok).toBe(true);
    expect(res.body?.get('fresh@test.com')).toBe('url-1');
    expect(res.body?.has('old@test.com')).toBe(false);
    expect(res.body?.size).toBe(1);
  });

  test('handles API errors gracefully', async () => {
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => 'Internal Server Error',
      headers: new Headers(),
    });

    const getUnredeemedRsvpInvitations = await loadModule();
    const res = await getUnredeemedRsvpInvitations('slug-1');

    expect(res.ok).toBe(false);
    expect(res.error).toContain('500');
  });

  test('skips malformed invites with missing email or unique_url and logs errors', async () => {
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        release_invitations: [
          { email: 'valid@test.com', unique_url: 'valid-url', redeemed: false },
          { email: null, unique_url: 'no-email-url', redeemed: false },
          { email: 'no-url@test.com', unique_url: undefined, redeemed: false },
        ],
      }),
    });
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    const getUnredeemedRsvpInvitations = await loadModule();
    const res = await getUnredeemedRsvpInvitations('slug-1');
    expect(res.ok).toBe(true);
    expect(res.body?.size).toBe(1);
    expect(res.body?.get('valid@test.com')).toBe('valid-url');
    expect(res.body?.has('no-url@test.com')).toBe(false);
    expect(res.body?.has('')).toBe(false);
    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  test('aggregates unredeemed invites across multiple pages', async () => {
    (global as any).fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          release_invitations: Array.from({ length: 500 }).map((_, i) => ({
            email: `page1-${i}@test.com`,
            unique_url: `url-${i}`,
            redeemed: false,
          })),
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          release_invitations: [
            {
              email: 'page2-unredeemed@test.com',
              unique_url: 'url-page2',
              redeemed: false,
            },
          ],
        }),
      });
    const getUnredeemedRsvpInvitations = await loadModule();
    const res = await getUnredeemedRsvpInvitations('slug-1');
    expect(res.ok).toBe(true);
    expect(res.body?.get('page1-0@test.com')).toBe('url-0');
    expect(res.body?.get('page2-unredeemed@test.com')).toBe('url-page2');
    expect(res.body?.size).toBe(501);
    expect((global as any).fetch).toHaveBeenCalledTimes(2);
  });
});
