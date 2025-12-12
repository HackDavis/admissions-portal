'use server';

import { NextRequest, NextResponse } from 'next/server';

import Login from '@datalib/auth/login';

/*
I created a custom API route to log in because the default route provided by Auth.js
requires you to first get your CSRF token before logging in, this takes care of it
*/
export async function POST(request: NextRequest) {
  const body = await request.json();
  const res = await Login(body.email, body.password);
  return NextResponse.json({ ...res }, { status: res.ok ? 200 : 401 });
}
