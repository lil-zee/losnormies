import { PrismaClient } from '@prisma/client';
import { createHash } from 'crypto';

const prisma = new PrismaClient();

function hashIP(ip: string): string {
  return createHash('sha256').update(ip).digest('hex');
}

async function main() {
  console.log('🌱 Starting seed...');

  await prisma.report.deleteMany();
  await prisma.reply.deleteMany();
  await prisma.post.deleteMany();

  const samplePosts = [
    { x: 0, y: 0, text: '# Welcome to Canvas Board!\n\nThis is the center. Post anywhere!', shortId: 'welcome1' },
    { x: 500, y: 300, text: 'Just hanging out over here 👋', shortId: 'post0001' },
    { x: -400, y: 200, text: '**Anonymous posting** is the future!', shortId: 'post0002' },
    { x: 200, y: -500, text: 'South quadrant 🌴', shortId: 'post0003' },
    { x: -300, y: -300, text: 'Southwest corner! 🔥', shortId: 'post0004' },
    { x: 1000, y: 1000, text: 'Far away...\n\n`console.log("Hello!");`', shortId: 'post0005' },
  ];

  const demoIPHash = hashIP('127.0.0.1');

  for (const postData of samplePosts) {
    const post = await prisma.post.create({
      data: { ...postData, ipHash: demoIPHash },
    });
    console.log(`Created: ${post.shortId} at (${post.x}, ${post.y})`);

    if (post.shortId === 'welcome1') {
      await prisma.reply.create({
        data: { postId: post.id, text: 'First! 🎉', ipHash: demoIPHash },
      });
      await prisma.reply.create({
        data: { postId: post.id, text: 'Love it!', ipHash: demoIPHash },
      });
      await prisma.post.update({
        where: { id: post.id },
        data: { replyCount: 2 },
      });
      console.log(`  └─ Added 2 replies`);
    }
  }

  console.log('✅ Seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
