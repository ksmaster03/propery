# === Stage 1: Build ===
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies for Prisma + build
RUN apk add --no-cache openssl

# Copy package files จาก root + api
COPY package*.json ./
COPY packages/api/package*.json ./packages/api/

# Install dependencies (workspace)
RUN npm install --workspace packages/api

# Copy API source
COPY packages/api ./packages/api
COPY tsconfig.base.json ./

# Generate Prisma client
RUN npx prisma generate --schema=packages/api/prisma/schema.prisma

# Build TypeScript
RUN cd packages/api && npx tsc

# === Stage 2: Runtime ===
FROM node:22-alpine AS runtime

WORKDIR /app

RUN apk add --no-cache openssl

# Copy built artifacts + node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/packages/api/package*.json ./packages/api/
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/api/dist ./packages/api/dist
COPY --from=builder /app/packages/api/prisma ./packages/api/prisma

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

WORKDIR /app/packages/api

# Run migrations แล้วเริ่ม server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
