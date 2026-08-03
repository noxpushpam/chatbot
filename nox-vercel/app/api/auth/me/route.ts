import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getDb } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET() {
  const tokenUser = await getCurrentUser();
  if (!tokenUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = await getDb();
  const user = await db.collection('users').findOne(
    { _id: new ObjectId(tokenUser.userId) },
    { projection: { password: 0 } }
  );

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({
    id: user._id.toString(),
    username: user.username,
    email: user.email,
    full_name: user.full_name || '',
    bio: user.bio || '',
    profile_pic: user.profile_pic || '',
    is_online: user.is_online,
  });
}
