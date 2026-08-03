import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getDb } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { message_id } = await req.json();
  if (!message_id) {
    return NextResponse.json({ error: 'message_id required' }, { status: 400 });
  }

  const db = await getDb();
  const msg = await db.collection('messages').findOne({ _id: new ObjectId(message_id) });

  if (!msg) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  if (msg.receiver_id !== user.userId) {
    return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
  }

  if (!msg.view_once) {
    return NextResponse.json({ success: true, already: true });
  }

  const viewedBy: string[] = msg.viewed_by || [];
  if (viewedBy.includes(user.userId)) {
    return NextResponse.json({ success: true, already: true });
  }

  viewedBy.push(user.userId);
  await db.collection('messages').updateOne(
    { _id: new ObjectId(message_id) },
    { $set: { viewed_by: viewedBy } }
  );

  return NextResponse.json({ success: true });
}
