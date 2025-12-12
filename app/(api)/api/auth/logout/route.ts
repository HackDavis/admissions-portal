'use server';

import { NextRequest, NextResponse } from 'next/server';

import Logout from '@datalib/auth/logout';
import authenticated from '@utils/authentication/authenticated';

async function post(_: NextRequest) {
  const res = await Logout();
  return NextResponse.json({ ...res }, { status: res.ok ? 200 : 401 });
}

const POST = authenticated(post);

export { POST };
