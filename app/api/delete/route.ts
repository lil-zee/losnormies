import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { deleteSchema } from '@/lib/validation';
import { verifyDeleteToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = deleteSchema.parse(body);

    if (data.targetType === 'post') {
      const post = await prisma.post.findUnique({
        where: { id: data.targetId },
      });

      if (!post || !post.deleteTokenHash) {
        return NextResponse.json({ error: 'Post not found' }, { status: 404 });
      }

      if (!verifyDeleteToken(data.deleteToken, post.deleteTokenHash)) {
        return NextResponse.json({ error: 'Invalid delete token' }, { status: 403 });
      }

      await prisma.post.update({
        where: { id: data.targetId },
        data: { deletedAt: new Date() },
      });
    } else {
      const reply = await prisma.reply.findUnique({
        where: { id: data.targetId },
      });

      if (!reply || !reply.deleteTokenHash) {
        return NextResponse.json({ error: 'Reply not found' }, { status: 404 });
      }

      if (!verifyDeleteToken(data.deleteToken, reply.deleteTokenHash)) {
        return NextResponse.json({ error: 'Invalid delete token' }, { status: 403 });
      }

      await prisma.reply.update({
        where: { id: data.targetId },
        data: { deletedAt: new Date() },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete failed:', error);
    return NextResponse.json(
      { error: error.message || 'Delete failed' },
      { status: 400 }
    );
  }
}
