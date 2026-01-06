import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createReplySchema } from '@/lib/validation';
import { getClientIP, hashIP } from '@/lib/ip';
import { generateDeleteToken, hashDeleteToken } from '@/lib/auth';
import { ratelimit } from '@/lib/ratelimit';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const ip = getClientIP(request);
    const { success } = await ratelimit.limit(ip);
    if (!success) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    const body = await request.json();
    const data = createReplySchema.parse(body);
    const post = await prisma.post.findFirst({ where: { OR: [{ id }, { shortId: id }], deletedAt: null } });
    if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    const ipHash = hashIP(ip);
    const deleteToken = generateDeleteToken();
    const deleteTokenHash = hashDeleteToken(deleteToken);
    const reply = await prisma.reply.create({ data: { postId: post.id, text: data.text, imageUrl: data.imageUrl, ipHash, deleteTokenHash } });
    await prisma.post.update({ where: { id: post.id }, data: { replyCount: { increment: 1 } } });
    return NextResponse.json({ reply, deleteToken });
  } catch (error: any) {
    console.error('Create reply failed:', error);
    return NextResponse.json({ error: error.message || 'Failed to create reply' }, { status: 400 });
  }
}