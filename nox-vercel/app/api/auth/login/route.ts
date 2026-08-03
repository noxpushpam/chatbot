import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getDb } from '@/lib/mongodb';
import { signToken } from '@/lib/auth';
import { ObjectId } from 'mongodb';

export async function POST(req: NextRequest) {
  try {
    const { login, password } = await req.json();

    if (!login || !password) {
      return NextResponse.json({ error: 'Login and password required' }, { status: 400 });
    }

    const db = await getDb();
    const user = await db.collection('users').findOne({
      $or: [{ username: login }, { email: login }],
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    // Update last seen
    await db.collection('users').updateOne(
      { _id: user._id },
      { $set: { is_online: true, last_seen: new Date() } }
    );

    const token = signToken({
      userId: user._id.toString(),
      username: user.username,
    });

    const res = NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        username: user.username,
        full_name: user.full_name || user.username,
        profile_pic: user.profile_pic || '',
      },
    });

    res.cookies.set('nox_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return res;
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
