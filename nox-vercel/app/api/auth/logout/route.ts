import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getDb } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (user) {
      const db = await getDb();
      await db.collection('users').updateOne(
        { _id: new ObjectId(user.userId) },
        { $set: { is_online: false } }
      );
    }
  } catch {}

  const res = NextResponse.json({ success: true });
  res.cookies.set('nox_token', '', {
    httpOnly: true,
    maxAge: 0,
    path: '/',
  });
  return res;
}
