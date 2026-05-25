# ─────────────────────────── Stage 1: deps ───────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

# OpenSSL needed by Prisma
RUN apk add --no-cache openssl

COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci --legacy-peer-deps

# ─────────────────────── Stage 2: builder ────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

RUN apk add --no-cache openssl

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npx prisma generate
RUN npm run build

# Keep prisma CLI for migrations at runtime (don't prune dev deps)

# ──────────────────────── Stage 3: runtime ───────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

RUN apk add --no-cache openssl dumb-init

ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package*.json ./

# Uploads directory (will be mounted as volume)
RUN mkdir -p /app/uploads

EXPOSE 3001

# Run migrations and start
CMD ["dumb-init", "sh", "-c", "./node_modules/.bin/prisma migrate deploy && node dist/main.js"]
