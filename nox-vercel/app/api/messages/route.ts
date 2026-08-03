import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getDb } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const otherId = req.nextUrl.searchParams.get('user_id');
  if (!otherId) {
    return NextResponse.json({ error: 'user_id required' }, { status: 400 });
  }

  const db = await getDb();

  // Mark as read
  await db.collection('messages').updateMany(
    { sender_id: otherId, receiver_id: user.userId, is_read: false },
    { $set: { is_read: true } }
  );

  await db.collection('notifications').updateMany(
    { user_id: user.userId, from_user_id: otherId, type: 'message', is_read: false },
    { $set: { is_read: true } }
  );

  const messages = await db
    .collection('messages')
    .find({
      $or: [
        { sender_id: user.userId, receiver_id: otherId },
        { sender_id: otherId, receiver_id: user.userId },
      ],
    })
    .sort({ created_at: 1 })
    .limit(200)
    .toArray();

  const result = messages.map((m) => {
    const viewOnce = !!m.view_once;
    const viewedBy: string[] = m.viewed_by || [];
    const alreadyViewed = viewedBy.includes(user.userId);
    const isMine = m.sender_id === user.userId;

    let image = m.image || null;
    if (viewOnce && alreadyViewed && !isMine) {
      image = null;
    }

    return {
      id: m._id.toString(),
      sender_id: m.sender_id,
      message: m.message || null,
      image,
      view_once: viewOnce,
      already_viewed: alreadyViewed,
      is_read: !!m.is_read,
      created_at: m.created_at,
      is_mine: isMine,
    };
  });

  const other = await db.collection('users').findOne(
    { _id: new ObjectId(otherId) },
    { projection: { password: 0 } }
  );

  return NextResponse.json({
    messages: result,
    other_user: other
      ? {
          id: other._id.toString(),
          username: other.username,
          full_name: other.full_name || other.username,
          profile_pic: other.profile_pic || '',
          is_online: !!other.is_online,
          last_seen: other.last_seen,
        }
      : null,
  });
}
