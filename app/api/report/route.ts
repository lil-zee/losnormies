import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { reportSchema } from '@/lib/validation';
import { getClientIP, hashIP } from '@/lib/ip';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = reportSchema.parse(body);

    const ip = getClientIP(request);
    const ipHash = hashIP(ip);

    await prisma.report.create({
      data: {
        targetType: data.targetType,
        targetId: data.targetId,
        reason: data.reason,
        ipHash,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Report failed:', error);
    return NextResponse.json(
      { error: error.message || 'Report failed' },
      { status: 400 }
    );
  }
}
