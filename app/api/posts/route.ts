import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createPostSchema } from '@/lib/validation';
import { getClientIP, hashIP } from '@/lib/ip';
import { generateDeleteToken, hashDeleteToken } from '@/lib/auth';
import { ratelimit } from '@/lib/ratelimit';

// GET /api/posts?minX=...&maxX=...&minY=...&maxY=...
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const minX = parseFloat(searchParams.get('minX') || '-1000');
    const maxX = parseFloat(searchParams.get('maxX') || '1000');
    const minY = parseFloat(searchParams.get('minY') || '-1000');
    const maxY = parseFloat(searchParams.get('maxY') || '1000');

    const posts = await prisma.post.findMany({
      where: {
        x: { gte: minX, lte: maxX },
        y: { gte: minY, lte: maxY },
        deletedAt: null,
      },
      select: {
        id: true,
        shortId: true,
        x: true,
        y: true,
        text: true,
        imageUrl: true,
        createdAt: true,
        replyCount: true,
        likes: true,
      },
      take: 200,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ posts });
  } catch (error) {
    console.error('Fetch posts failed:', error);
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}

// POST /api/posts
export async function POST(request: NextRequest) {
  try {
    const ip = getClientIP(request);

    // Rate limiting check
    try {
      const { success } = await ratelimit.limit(ip);
      if (!success) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Try again later.' },
          { status: 429 }
        );
      }
    } catch (rateLimitError) {
      console.warn('Rate limit check failed, allowing request:', rateLimitError);
    }

    const userToken = request.headers.get('x-user-token');
    if (!userToken) {
      return NextResponse.json({ error: 'Identity Token Required' }, { status: 401 });
    }

    const body = await request.json();
    const data = createPostSchema.parse(body);
    const ipHash = hashIP(ip);
    const deleteToken = generateDeleteToken();
    const deleteTokenHash = hashDeleteToken(deleteToken);

    const post = await prisma.post.create({
      data: {
        x: data.x,
        y: data.y,
        text: data.text,
        imageUrl: data.imageUrl,
        ipHash,
        deleteTokenHash,
        authorToken: userToken,
      },
    });

    return NextResponse.json({
      post: {
        id: post.id,
        shortId: post.shortId,
        x: post.x,
        y: post.y,
        text: post.text,
        imageUrl: post.imageUrl,
        createdAt: post.createdAt,
      },
      deleteToken,
    });
  } catch (error: any) {
    console.error('Create post failed:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create post' },
      { status: 400 }
    );
  }
}
