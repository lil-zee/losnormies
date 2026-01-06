# Quick Start Guide

## ⚠️ Known Issue: Prisma Schema

The Prisma schema file had encoding issues during creation. Follow these steps to fix:

### Fix Method 1: Manual Creation

Create `prisma/schema.prisma` with this exact content:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Post {
  id              String    @id @default(cuid())
  shortId         String    @unique @default(cuid())
  x               Float
  y               Float
  text            String?   @db.Text
  imageUrl        String?
  createdAt       DateTime  @default(now())
  deletedAt       DateTime?
  deleteTokenHash String?
  ipHash          String
  replyCount      Int       @default(0)
  replies         Reply[]

  @@index([x, y])
  @@index([createdAt])
  @@index([shortId])
  @@map("posts")
}

model Reply {
  id              String    @id @default(cuid())
  postId          String
  post            Post      @relation(fields: [postId], references: [id], onDelete: Cascade)
  text            String?   @db.Text
  imageUrl        String?
  createdAt       DateTime  @default(now())
  deletedAt       DateTime?
  deleteTokenHash String?
  ipHash          String

  @@index([postId, createdAt])
  @@map("replies")
}

model Report {
  id         String   @id @default(cuid())
  targetType String
  targetId   String
  reason     String?
  createdAt  DateTime @default(now())
  ipHash     String

  @@index([targetType, targetId])
  @@map("reports")
}
```

### Fix Method 2: Copy from Working Project (if available)

```powershell
Copy-Item "C:\Users\Usuario\.gemini\antigravity\brain\340a00e0-76db-4208-909b-f660a4188aa4\canvas-board\prisma\schema.prisma" -Destination "prisma/schema.prisma"
```

## 🚀 After Fixing Schema

```bash
# 1. Generate Prisma Client
npx prisma generate

# 2. Start PostgreSQL
docker-compose up -d

# 3. Run migrations
npm run db:migrate

# 4. Seed database with demo data
npm run db:seed

# 5. Start development server
npm run dev
```

## 🔧 Set Up Upstash Redis (Required for Rate Limiting)

1. Go to https://console.upstash.com/
2. Create a free Redis database
3. Copy the REST URL and REST TOKEN
4. Update `.env`:

```
UPSTASH_REDIS_REST_URL="https://your-instance.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your_token_here"
```

## ✅ Verify Everything Works

```bash
# Check health endpoint
curl http://localhost:3000/api/health

# Should return: {"status":"ok","timestamp":"..."}
```

## 📖 Full Documentation

- Complete setup: `README.md`
- Implementation status: `IMPLEMENTATION_STATUS.md`
- Detailed walkthrough: See artifacts panel

Enjoy building! 🎨
