import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getDb } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = await getDb();
  const notifs = await db
    .collection('notifications')
    .find({ user_id: user.userId })
    .sort({ created_at: -1 })
    .limit(30)
    .toArray();

  let unreadCount = 0;
  const result = await Promise.all(
    notifs.map(async (n) => {
      if (!n.is_read) unreadCount++;
      let fromUser = null;
      if (n.from_user_id) {
        fromUser = await db.collection('users').findOne(
          { _id: new ObjectId(n.from_user_id) },
          { projection: { username: 1, full_name: 1, profile_pic: 1 } }
        );
      }
      return {
        id: n._id.toString(),
        type: n.type,
        content: n.content,
        is_read: !!n.is_read,
        created_at: n.created_at,
        from_user_id: n.from_user_id,
        from_name: fromUser?.full_name || fromUser?.username || 'Someone',
        from_pic: fromUser?.profile_pic || '',
      };
    })
  );

  return NextResponse.json({ notifications: result, unread_count: unreadCount });
}

export async function POST(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = await getDb();
  await db.collection('notifications').updateMany(
    { user_id: user.userId, is_read: false },
    { $set: { is_read: true } }
  );

  return NextResponse.json({ success: true });
}
