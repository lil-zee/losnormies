import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyDeleteToken } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const post = await prisma.post.findFirst({
      where: { OR: [{ id }, { shortId: id }], deletedAt: null },
      include: { replies: { where: { deletedAt: null }, orderBy: { createdAt: 'asc' } } },
    });
    if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    return NextResponse.json({ post });
  } catch (error) {
    console.error('Fetch post failed:', error);
    return NextResponse.json({ error: 'Failed to fetch post' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { x, y } = body;
    console.log(`PATCH post ${id}:`, { x, y });

    const post = await prisma.post.update({
      where: { id },
      data: { x, y },
    });

    return NextResponse.json({ post });
  } catch (error) {
    console.error('Update post failed:', error);
    return NextResponse.json({ error: 'Failed to update post' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const adminToken = request.headers.get('x-admin-token');
    let deleteToken: string | undefined;

    // Only parse body for deleteToken if admin token is missing
    if (!adminToken || adminToken !== process.env.ADMIN_SECRET) {
      try {
        const body = await request.json();
        deleteToken = body.deleteToken;
      } catch (e) {
        // Body might be empty
      }
    }

    const post = await prisma.post.findFirst({
      where: { OR: [{ id }, { shortId: id }], deletedAt: null },
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    let authorized = false;

    // 1. Admin Auth
    if (process.env.ADMIN_SECRET && adminToken === process.env.ADMIN_SECRET) {
      authorized = true;
      console.log(`Admin deleted post ${id}`);
    }
    // 2. User User Auth
    else if (deleteToken && post.deleteTokenHash) {
      if (verifyDeleteToken(deleteToken, post.deleteTokenHash)) {
        authorized = true;
      }
    }

    if (!authorized) {
      return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 403 });
    }

    await prisma.post.update({
      where: { id: post.id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete post failed:', error);
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
  }
}