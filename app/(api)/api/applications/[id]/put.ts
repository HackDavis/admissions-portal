import { NextRequest, NextResponse } from 'next/server';
import { UpdateApplication } from '@datalib/applications/updateApplication';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json();
  const res = await UpdateApplication(params.id, body);
  return NextResponse.json({ ...res }, { status: res.ok ? 200 : 500 });
}
