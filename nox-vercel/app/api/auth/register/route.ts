import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getDb } from '@/lib/mongodb';
import { signToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { username, email, password, full_name } = await req.json();

    if (!username || !email || !password) {
      return NextResponse.json({ error: 'All fields required' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password min 6 characters' }, { status: 400 });
    }

    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      return NextResponse.json({ error: 'Invalid username' }, { status: 400 });
    }

    const db = await getDb();
    const existing = await db.collection('users').findOne({
      $or: [{ username }, { email }],
    });

    if (existing) {
      return NextResponse.json({ error: 'Username or email already exists' }, { status: 400 });
    }

    const hashed = await bcrypt.hash(password, 10);

    const result = await db.collection('users').insertOne({
      username,
      email,
      password: hashed,
      full_name: full_name || '',
      bio: '',
      profile_pic: '',
      is_online: false,
      last_seen: new Date(),
      created_at: new Date(),
    });

    const token = signToken({
      userId: result.insertedId.toString(),
      username,
    });

    const res = NextResponse.json({
      success: true,
      user: {
        id: result.insertedId.toString(),
        username,
        full_name: full_name || '',
      },
    });

    res.cookies.set('nox_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return res;
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
