import { NextRequest, NextResponse } from 'next/server';
import { CreateApplication } from '@datalib/applications/createApplication';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const res = await CreateApplication(body);
  return NextResponse.json({ ...res }, { status: res.ok ? 200 : 500 });
}
