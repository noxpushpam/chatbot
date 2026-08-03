import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getDb } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const q = req.nextUrl.searchParams.get('q') || '';
  const db = await getDb();

  const filter: any = { _id: { $ne: new ObjectId(user.userId) } };
  if (q) {
    filter.$or = [
      { username: { $regex: q, $options: 'i' } },
      { full_name: { $regex: q, $options: 'i' } },
    ];
  }

  const users = await db
    .collection('users')
    .find(filter, { projection: { password: 0 } })
    .sort({ is_online: -1, last_seen: -1 })
    .limit(100)
    .toArray();

  const result = await Promise.all(
    users.map(async (u) => {
      const unread = await db.collection('messages').countDocuments({
        sender_id: u._id.toString(),
        receiver_id: user.userId,
        is_read: false,
      });

      return {
        id: u._id.toString(),
        username: u.username,
        full_name: u.full_name || u.username,
        profile_pic: u.profile_pic || '',
        is_online: !!u.is_online,
        last_seen: u.last_seen,
        unread,
      };
    })
  );

  return NextResponse.json({ users: result });
}
