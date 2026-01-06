import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Testing database connection...');
    const posts = await prisma.post.findMany({ take: 1 });
    console.log('Successfully connected! Found posts:', posts.length);
    if (posts.length > 0) {
      console.log('Sample post:', posts[0]);
    }
  } catch (e) {
    console.error('ERROR:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
