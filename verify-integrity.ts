import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Testing DB Integrity...');
    try {
        // 1. Create a dummy post
        const post = await prisma.post.create({
            data: {
                x: 0,
                y: 0,
                text: 'Integrity Check',
                ipHash: 'test',
                deleteTokenHash: 'test',
                shortId: Math.random().toString(36).substring(7),
            },
        });
        console.log(`Created post: ${post.id}`);

        // 2. Try to fetch it immediately
        const fetched = await prisma.post.findUnique({
            where: { id: post.id },
        });

        if (fetched) {
            console.log('✅ Post fetched successfully!');
        } else {
            console.error('❌ Post created but NOT FOUND immediately after.');
        }

        // 3. Clean up
        await prisma.post.delete({ where: { id: post.id } });

    } catch (e) {
        console.error('Test failed:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
