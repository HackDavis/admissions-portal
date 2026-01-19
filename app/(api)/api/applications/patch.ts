import { NextRequest, NextResponse } from 'next/server';
import { UpdateApplication } from '@datalib/applications/updateApplication';

export async function PATCH(request: NextRequest) {
  const { id, ...body } = await request.json();
  const res = await UpdateApplication(id, body);
  return NextResponse.json({ ...res }, { status: res.ok ? 200 : 500 });
}
