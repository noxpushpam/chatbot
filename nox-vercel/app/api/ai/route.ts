import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { askBlackboxAI } from '@/lib/blackbox';

export async function POST(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { question } = await req.json();
  if (!question?.trim()) {
    return NextResponse.json({ error: 'Question required' }, { status: 400 });
  }

  const answer = await askBlackboxAI(question.trim());
  return NextResponse.json({ success: true, answer });
}
