import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@utils/mongodb/mongoClient.mjs';

const COOKIE_NAME = 'hd_ref';
const THIRTY_DAYS = 60 * 60 * 24 * 30;

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('ref') ?? '';

  if (!/^[0-9]{6}$/.test(code)) {
    return NextResponse.json({ ok: true, captured: false });
  }

  try {
    const db = await getDatabase();
    const referrals = db.collection('referrals');
    const existingCode = request.cookies.get(COOKIE_NAME)?.value;
    if (existingCode && /^[0-9]{6}$/.test(existingCode)) {
      const existing = await referrals.findOne({ code: existingCode });
      if (existing) {
        return NextResponse.json({ ok: true, captured: false });
      }
    }

    const referral = await referrals.findOne({ code });

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
