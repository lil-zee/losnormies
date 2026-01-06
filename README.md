# Canvas Board - Anonymous Imageboard with Infinite Canvas

A minimalist, fast, and secure anonymous imageboard where users can post content anywhere on an infinite canvas and engage in threaded discussions.

## Features

- 🎨 **Infinite Canvas**: Pan and zoom to explore posts across a vast 2D space
- 🔒 **Anonymous**: No registration or login required
- 💬 **Threaded Replies**: Each post can have unlimited replies
- 🖼️ **Image Support**: Upload and compress images client-side
- 📝 **Markdown**: Simple markdown support for text formatting
- 🗑️ **Delete Tokens**: One-time tokens to delete your own posts
- ⚡ **Rate Limiting**: IP-based rate limiting to prevent spam
- 📱 **Responsive**: Works on desktop and mobile

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Image Storage**: Local filesystem (dev) / Vercel Blob (prod)
- **Rate Limiting**: Upstash Redis
- **Deployment**: Vercel

## Prerequisites

- Node.js 20+ and npm
- Docker and Docker Compose (for local PostgreSQL)
- Upstash Redis account (free tier available)

## Getting Started

### 1. Clone and Install

```bash
cd canvas-board
npm install
```

### 2. Set Up Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and configure:

- `DATABASE_URL`: Leave as-is for Docker PostgreSQL
- `UPSTASH_REDIS_REST_URL`: Get from https://console.upstash.com/
- `UPSTASH_REDIS_REST_TOKEN`: Get from Upstash console

### 3. Start PostgreSQL with Docker

```bash
docker-compose up -d
```

Wait a few seconds for the database to be ready.

### 4. Run Database Migrations

```bash
npm run db:migrate
```

### 5. Seed the Database

```bash
npm run db:seed
```

This creates sample posts at various coordinates for testing.

### 6. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:migrate` - Run Prisma migrations
- `npm run db:seed` - Seed database with demo data
- `npm run db:studio` - Open Prisma Studio (DB GUI)
- `npm run db:push` - Push schema changes without migrations

## Database Schema

### Post
- `id`: Unique identifier
- `shortId`: 8-character display ID
- `x, y`: Canvas coordinates
- `text`: Post content (markdown)
- `imageUrl`: Image URL
- `createdAt`: Timestamp
- `deletedAt`: Soft delete timestamp
- `deleteTokenHash`: SHA-256 hash of delete token
- `ipHash`: SHA-256 hash of creator IP
- `replyCount`: Number of replies

### Reply
- `id`: Unique identifier
- `postId`: Parent post ID
- `text`: Reply content
- `imageUrl`: Image URL
- `createdAt`: Timestamp
- `deletedAt`: Soft delete timestamp
- `deleteTokenHash`: SHA-256 hash of delete token
- `ipHash`: SHA-256 hash of creator IP

### Report
- `id`: Unique identifier
- `targetType`: "post" or "reply"
- `targetId`: ID of reported content
- `reason`: Optional reason
- `createdAt`: Timestamp
- `ipHash`: SHA-256 hash of reporter IP

## API Endpoints

### GET /api/posts
Fetch posts by viewport bounding box.

Query params:
- `minX`, `maxX`, `minY`, `maxY`: Bounding box coordinates

### POST /api/posts
Create a new post.

Body:
```json
{
  "x": 100,
  "y": 200,
  "text": "Hello world!",
  "imageUrl": "https://example.com/image.jpg"
}
```

Returns: `{ post, deleteToken }`

### GET /api/posts/[id]
Get post detail with all replies.

### POST /api/posts/[id]/replies
Create a reply to a post.

Body:
```json
{
  "text": "Nice post!",
  "imageUrl": "..."
}
```

Returns: `{ reply, deleteToken }`

### POST /api/upload
Upload an image.

Form data:
- `file`: Image file (JPG, PNG, WEBP, GIF, max 5MB)

Returns: `{ url }`

### POST /api/report
Report a post or reply.

Body:
```json
{
  "targetType": "post",
  "targetId": "abc123",
  "reason": "Spam"
}
```

### POST /api/delete
Delete a post or reply with token.

Body:
```json
{
  "targetType": "post",
  "targetId": "abc123",
  "deleteToken": "..."
}
```

### GET /api/health
Health check endpoint.

## Deployment to Vercel

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin YOUR_REPO_URL
git push -u origin main
```

### 2. Create Vercel Project

1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Configure environment variables in Vercel dashboard

### 3. Set Up Vercel Postgres (Recommended)

1. In your Vercel project, go to Storage → Create Database → Postgres
2. Vercel will auto-inject `DATABASE_URL`

Alternatively, use an external PostgreSQL provider (Supabase, Railway, etc.).

### 4. Set Up Upstash Redis

Add these to Vercel environment variables:
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

### 5. Enable Vercel Blob

1. In Vercel project settings, go to Storage → Blob
2. Vercel will auto-inject `BLOB_READ_WRITE_TOKEN`

### 6. Deploy

Vercel will automatically deploy. After deployment:

```bash
# Run migrations on production DB
npx prisma migrate deploy

# (Optional) Seed production data
npx prisma db seed
```

## Security Features

- **CSP Headers**: Content Security Policy configured in `next.config.ts`
- **Input Validation**: Zod schemas validate all user input server-side
- **Markdown Sanitization**: rehype-sanitize removes dangerous HTML
- **Image Validation**: MIME type, extension, and size checks
- **Rate Limiting**: IP-based with Upstash Redis (60s cooldown)
- **Delete Tokens**: SHA-256 hashed, non-reversible
- **IP Hashing**: IP addresses hashed before storage
- **SQL Injection Protection**: Prisma ORM parameterizes all queries

## Performance Optimizations

- **Viewport Virtualization**: Only posts in visible area are rendered
- **Image Compression**: Client-side compression before upload (2MB max)
- **Database Indexes**: Spatial indexes on x/y coordinates
- **Next.js Image**: Automatic image optimization
- **Turbopack**: Fast development builds

## Project Structure

```
canvas-board/
├── app/
│   ├── api/              # API routes
│   ├── page.tsx          # Main canvas page
│   └── layout.tsx        # Root layout
├── components/           # React components
├── hooks/                # Custom hooks
├── lib/                  # Server-side utilities
├── utils/                # Client-side utilities
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── seed.ts           # Seed script
├── public/uploads/       # Local image storage (dev only)
├── docker-compose.yml    # PostgreSQL container
├── .env.example          # Environment template
└── package.json
```

## Troubleshooting

### PostgreSQL connection issues

Ensure Docker is running and the container is up:

```bash
docker ps
docker-compose logs postgres
```

### Rate limiting not working

Verify Upstash Redis credentials in `.env`:

```bash
# Test connection
npm run dev
# Check logs for Redis errors
```

### Image uploads failing

- **Development**: Ensure `public/uploads/` directory exists
- **Production**: Verify `BLOB_READ_WRITE_TOKEN` is set in Vercel

### Migrations failing

Reset the database (⚠️ deletes all data):

```bash
npx prisma migrate reset
```

## License

MIT

## Contributing

Contributions are welcome! Please open an issue or PR.
