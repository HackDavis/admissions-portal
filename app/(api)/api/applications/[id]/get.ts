import { NextRequest, NextResponse } from 'next/server';
import { GetApplication } from '@datalib/applications/getApplication';

export async function GET(
  _: NextRequest,
  { params }: { params: { id: string } }
) {
  const res = await GetApplication(params.id);
  return NextResponse.json({ ...res }, { status: res.ok ? 200 : 500 });
}
