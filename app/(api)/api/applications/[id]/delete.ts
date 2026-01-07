import { NextRequest, NextResponse } from 'next/server';
import { DeleteApplication } from '@datalib/applications/deleteApplication';

export async function DELETE(
  _: NextRequest,
  { params }: { params: { id: string } }
) {
  const res = await DeleteApplication(params.id);
  return NextResponse.json({ ...res }, { status: res.ok ? 200 : 500 });
}
