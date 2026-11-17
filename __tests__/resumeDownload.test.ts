/** @jest-environment node */

import { Readable } from 'stream';
import { NextRequest } from 'next/server';

const auth = jest.fn();
const getApplicationResume = jest.fn();

jest.mock('@/auth', () => ({ auth: (...args: unknown[]) => auth(...args) }));
jest.mock('@datalib/resumes/getApplicationResume', () => ({
  GetApplicationResume: (...args: unknown[]) => getApplicationResume(...args),
}));

import { GET } from '../app/(api)/api/applications/[id]/resume/route';

const request = () =>
  new NextRequest('http://localhost/api/applications/abc/resume');
const params = { params: { id: 'abc' } };

describe('GET /api/applications/[id]/resume', () => {
  beforeEach(() => {
    getApplicationResume.mockResolvedValue({
      ok: true,
      status: 200,
      body: {
        stream: Readable.from([Buffer.from('%PDF-1.7 hello')]),
        filename: 'My "Résumé".pdf',
      },
      error: null,
    });
  });

  test('rejects requests with no session', async () => {
    auth.mockResolvedValue(null);
    const res = await GET(request(), params);
    expect(res.status).toBe(401);
    expect(getApplicationResume).not.toHaveBeenCalled();
  });

  test('rejects signed-in users who are not admins', async () => {
    auth.mockResolvedValue({ user: { role: 'user' } });
    const res = await GET(request(), params);
    expect(res.status).toBe(401);
    expect(getApplicationResume).not.toHaveBeenCalled();
  });

  test('streams the PDF to an admin with safe headers', async () => {
    auth.mockResolvedValue({ user: { role: 'admin' } });
    const res = await GET(request(), params);

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('application/pdf');
    expect(res.headers.get('x-content-type-options')).toBe('nosniff');
    expect(res.headers.get('cache-control')).toBe('private, no-store');

    const disposition = res.headers.get('content-disposition') as string;
    // Quotes and accents in the applicant's filename are percent-encoded, so they cannot break the header
    expect(disposition).toBe(
      "inline; filename*=UTF-8''My%20%22R%C3%A9sum%C3%A9%22.pdf"
    );
    expect(await res.text()).toBe('%PDF-1.7 hello');
  });

  test('returns the datalib error and status when there is no resume', async () => {
    auth.mockResolvedValue({ user: { role: 'admin' } });
    getApplicationResume.mockResolvedValue({
      ok: false,
      status: 404,
      body: null,
      error: 'This application has no uploaded resume.',
    });
    const res = await GET(request(), params);
    expect(res.status).toBe(404);
    expect((await res.json()).error).toMatch(/no uploaded resume/);
  });
});
