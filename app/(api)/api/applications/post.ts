import { NextRequest, NextResponse } from 'next/server';
import { CreateApplication } from '@datalib/applications/createApplication';
import { GetRollout, GetRollback } from '@datalib/applications/getRollout';

export async function POST(request: NextRequest) {
  const start_date = await GetRollout('applications');
  const end_date = await GetRollback('applications');

  if (
    start_date.body == null ||
    end_date.body == null ||
    Date.now() >= start_date.body ||
    Date.now() <= end_date.body
  ) {
    return NextResponse.json(null, { status: 500 });
  }

  const body = await request.json();
  const res = await CreateApplication(body);
  return NextResponse.json({ ...res }, { status: res.ok ? 200 : 500 });
}
