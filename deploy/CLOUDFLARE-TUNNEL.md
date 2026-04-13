# Cloudflare Tunnel Setup Guide

ขั้นตอนสร้าง Tunnel เชื่อม `propery.toptierdigital.space` กับ EC2

## 1. สร้าง Tunnel ใน Cloudflare Zero Trust

1. เข้า https://one.dash.cloudflare.com
2. เลือก **Networks → Tunnels → Create a tunnel**
3. เลือก **Cloudflared**
4. ตั้งชื่อ: `doa-property`
5. คลิก **Save tunnel**
6. Copy **Tunnel token** (ยาวๆ เริ่มด้วย `eyJ...`)

## 2. Public Hostname — เชื่อม domain กับ service

ใน tab **Public Hostname**:
- **Subdomain:** `propery`
- **Domain:** `toptierdigital.space`
- **Path:** (ว่าง)
- **Service:**
  - Type: `HTTP`
  - URL: `doa-web:80`

คลิก **Save hostname**

## 3. ติดตั้ง Token บน EC2

SSH เข้า EC2 และเพิ่ม token ใน `.env`:

```bash
ssh -i deploy/doa-property.pem ec2-user@43.210.173.149

cd /opt/doa
sudo nano .env
# เพิ่มบรรทัด:
# CLOUDFLARE_TUNNEL_TOKEN=eyJhIjoiXXXXXXXX...

sudo docker compose up -d cloudflared
sudo docker compose logs -f cloudflared
```

เมื่อเห็น `Connection registered connIndex=0` แปลว่า tunnel ใช้งานได้แล้ว

## 4. ทดสอบ

เปิด https://propery.toptierdigital.space — จะเห็นหน้า Login

## Credentials (Demo)
- Admin: `admin` / `admin123`
- Tenant: `0105562001234` / `tenant123`

## โครงสร้างที่ deploy

```
EC2 t3.small (43.210.173.149) — Bangkok ap-southeast-7
  └─ Docker Compose
      ├─ doa-db          PostgreSQL 16 (port 5432 internal)
      ├─ doa-api         Express + Prisma (port 3001 internal)
      ├─ doa-web         React + Nginx (port 80 → host 8080)
      └─ doa-cloudflared Cloudflare Tunnel → propery.toptierdigital.space
```

Security:
- Port 22 (SSH) เปิด
- Port 8080 ไม่ publish ออก internet (แค่ host-internal)
- ไม่มี ingress HTTP/HTTPS — เข้าผ่าน Cloudflare Tunnel เท่านั้น
