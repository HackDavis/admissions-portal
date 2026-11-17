import { NextRequest, NextResponse } from 'next/server';
import { UploadResume } from '@datalib/resumes/uploadResume';

export async function POST(request: NextRequest) {
  const file = (await request.formData()).get('file');
  const { status, ...res } = await UploadResume(file);
  return NextResponse.json({ ...res }, { status });
}
