#!/bin/bash
# === Deploy script — รันบน EC2 หลังจาก source code ถูก SCP มาแล้ว ===
set -eux

cd /opt/doa

# สร้าง .env ถ้ายังไม่มี (ต้องแก้ค่าก่อน docker compose up ครั้งแรก)
if [ ! -f .env ]; then
  cat > .env <<EOF
DB_USER=doa
DB_PASSWORD=$(openssl rand -base64 24 | tr -d '/+=' | head -c 32)
DB_NAME=doa_lease
JWT_SECRET=$(openssl rand -base64 48 | tr -d '/+=' | head -c 48)
JWT_REFRESH_SECRET=$(openssl rand -base64 48 | tr -d '/+=' | head -c 48)
CORS_ORIGIN=https://propery.toptierdigital.space
CLOUDFLARE_TUNNEL_TOKEN=
EOF
  echo "⚠️  สร้าง .env แล้ว — ต้องเพิ่ม CLOUDFLARE_TUNNEL_TOKEN ก่อนรัน docker compose"
fi

# Build + start services
docker compose build
docker compose up -d db api web

# Wait for api health
sleep 10

# Run database migration + seed
docker compose exec -T api npx prisma migrate deploy
docker compose exec -T api npx tsx prisma/seed.ts || echo "seed skipped (may already exist)"

echo ""
echo "✅ Deploy สำเร็จ!"
echo "   Web:   http://localhost:8080 (internal)"
echo "   API:   http://doa-api:3001 (internal, via docker network)"
echo ""
echo "🔒 เพิ่ม Cloudflare Tunnel token ใน .env แล้ว run:"
echo "   docker compose up -d cloudflared"
