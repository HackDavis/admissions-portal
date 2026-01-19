import { NextRequest, NextResponse } from 'next/server';
import { GetManyApplications } from '@datalib/applications/getApplication';
import getQueries from '@utils/request/getQueries';

export async function GET(request: NextRequest) {
  const queries = await getQueries(request, 'applications');
  const res = await GetManyApplications(queries);
  return NextResponse.json({ ...res }, { status: res.ok ? 200 : 500 });
}
