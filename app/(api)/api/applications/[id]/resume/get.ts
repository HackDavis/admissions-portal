import { Readable } from 'stream';
import { NextRequest, NextResponse } from 'next/server';
import { GetApplicationResume } from '@datalib/resumes/getApplicationResume';

export async function GET(
  _: NextRequest,
  { params }: { params: { id: string } }
) {
  const { status, ok, body, error } = await GetApplicationResume(params.id);
  if (!ok || !body) {
    return NextResponse.json({ ok, body: null, error }, { status });
  }

  return new NextResponse(Readable.toWeb(body.stream) as ReadableStream, {
    headers: {
      'Content-Type': 'application/pdf',
      // The filename is applicant-supplied: percent-encoding keeps it from breaking the header
      'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(
        body.filename
      )}`,
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'private, no-store',
    },
  });
}
