# STAGE 1: Build
FROM node:22-bookworm-slim AS builder
WORKDIR /app

# No need for libc6-compat on debian

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build Next.js
RUN npm run build

# STAGE 2: Runner
FROM node:22-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production

# Install FFmpeg (Essential for Sentinel)
RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy essential files
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder /app/scripts ./scripts

# Copy and configure the entrypoint script
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

# Set permissions for the recordings/thumbnails folders and database
RUN mkdir -p public/recordings public/thumbnails \
    && chown -R nextjs:nodejs public/recordings public/thumbnails prisma

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["./docker-entrypoint.sh"]
