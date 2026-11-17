import { NextRequest, NextResponse } from 'next/server';
import { DeleteResume } from '@datalib/resumes/deleteResume';

export async function DELETE(
  _: NextRequest,
  { params }: { params: { fileId: string } }
) {
  const { status, ...res } = await DeleteResume(params.fileId);
  return NextResponse.json({ ...res }, { status });
}
