import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getDb } from '@/lib/mongodb';
import { uploadImage } from '@/lib/cloudinary';
import { ObjectId } from 'mongodb';

export async function POST(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const full_name = (formData.get('full_name') as string) || '';
    const bio = (formData.get('bio') as string) || '';
    const file = formData.get('profile_pic') as File | null;

    const db = await getDb();
    const update: any = { full_name, bio };

    if (file && file.size > 0) {
      const buffer = Buffer.from(await file.arrayBuffer());
      if (buffer.length > 5 * 1024 * 1024) {
        return NextResponse.json({ error: 'Max 5MB' }, { status: 400 });
      }
      const uploaded = await uploadImage(buffer, 'nox-chat/profiles');
      update.profile_pic = uploaded.url;
    }

    await db.collection('users').updateOne(
      { _id: new ObjectId(user.userId) },
      { $set: update }
    );

    return NextResponse.json({ success: true, profile_pic: update.profile_pic || null });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e.message || 'Error' }, { status: 500 });
  }
}
