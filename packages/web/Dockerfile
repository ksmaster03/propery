# === Stage 1: Build ===
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY packages/web/package*.json ./packages/web/

RUN npm install --workspace packages/web

# Copy source
COPY packages/web ./packages/web
COPY tsconfig.base.json ./

# Build Vite production bundle
RUN cd packages/web && npx vite build

# === Stage 2: Serve with Nginx ===
FROM nginx:1.27-alpine AS runtime

# Copy built assets to nginx html
COPY --from=builder /app/packages/web/dist /usr/share/nginx/html

# Custom nginx config รองรับ SPA routing + proxy /api → API
COPY packages/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
