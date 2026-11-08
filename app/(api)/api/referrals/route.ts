import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@app/(api)/_utils/mongodb/mongoClient.mjs';

const COOKIE_NAME = 'hd_ref';
const THIRTY_DAYS = 60 * 60 * 24 * 30;

export async function GET(request: NextRequest) {
  if (request.cookies.get(COOKIE_NAME)) {
    return NextResponse.json({ ok: true, captured: false });
  }

  const code = request.nextUrl.searchParams.get('ref') ?? '';

  if (!/^[0-9]{6}$/.test(code)) {
    return NextResponse.json({ ok: true, captured: false });
  }

  try {
    const db = await getDatabase();
    const referral = await db.collection('referrals').findOne({ code });

    if (!referral) {
      return NextResponse.json({ ok: true, captured: false });
    }

    const res = NextResponse.json({ ok: true, captured: true });
    res.cookies.set(COOKIE_NAME, code, {
      maxAge: THIRTY_DAYS,
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });
    return res;
  } catch (err) {
    console.error('Referral capture failed:', err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
