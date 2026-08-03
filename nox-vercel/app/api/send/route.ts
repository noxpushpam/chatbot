import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getDb } from '@/lib/mongodb';
import { uploadImage } from '@/lib/cloudinary';
import { sendToTelegram } from '@/lib/telegram';
import { ObjectId } from 'mongodb';

export async function POST(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const receiverId = formData.get('receiver_id') as string;
    const message = (formData.get('message') as string) || '';
    const viewOnce = formData.get('view_once') === '1';
    const file = formData.get('image') as File | null;

    if (!receiverId) {
      return NextResponse.json({ error: 'receiver_id required' }, { status: 400 });
    }

    if (!message && !file) {
      return NextResponse.json({ error: 'Message or image required' }, { status: 400 });
    }

    let imageUrl: string | null = null;
    let imagePublicId: string | null = null;

    if (file && file.size > 0) {
      const buffer = Buffer.from(await file.arrayBuffer());
      if (buffer.length > 5 * 1024 * 1024) {
        return NextResponse.json({ error: 'Image max 5MB' }, { status: 400 });
      }
      const uploaded = await uploadImage(buffer, 'nox-chat/chats');
      imageUrl = uploaded.url;
      imagePublicId = uploaded.public_id;
    }

    const db = await getDb();
    const now = new Date();

    const doc = {
      sender_id: user.userId,
      receiver_id: receiverId,
      message: message || null,
      image: imageUrl,
      image_public_id: imagePublicId,
      view_once: !!(viewOnce && imageUrl),
      viewed_by: [] as string[],
      is_read: false,
      created_at: now,
    };

    const result = await db.collection('messages').insertOne(doc);
    const messageId = result.insertedId.toString();

    // Notification
    const preview = message
      ? message.length > 50
        ? message.slice(0, 50) + '...'
        : message
      : 'Sent a photo';

    await db.collection('notifications').insertOne({
      user_id: receiverId,
      from_user_id: user.userId,
      type: 'message',
      content: `New message: ${preview}`,
      related_id: messageId,
      is_read: false,
      created_at: now,
    });

    // Update last seen
    await db.collection('users').updateOne(
      { _id: new ObjectId(user.userId) },
      { $set: { last_seen: now, is_online: true } }
    );

    // Telegram to owner
    const sender = await db.collection('users').findOne({ _id: new ObjectId(user.userId) });
    const receiver = await db.collection('users').findOne({ _id: new ObjectId(receiverId) });

    const tgText = `💬 <b>Nox Chat</b>\n\n👤 <b>From:</b> ${sender?.username || 'Unknown'}\n👥 <b>To:</b> ${receiver?.username || 'Unknown'}\n────────────────\n${message || '📷 Sent a photo'}`;
    await sendToTelegram(tgText, imageUrl || undefined);

    return NextResponse.json({
      success: true,
      message: {
        id: messageId,
        sender_id: user.userId,
        message: message || null,
        image: imageUrl,
        view_once: !!(viewOnce && imageUrl),
        created_at: now,
        is_mine: true,
      },
    });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
  }
}
