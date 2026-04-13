# Cloudflare Tunnel Setup Guide

> **Production Live:** **https://doa.growgenius.co.th** ✅

## การตั้งค่าปัจจุบัน

| ค่า | Value |
|-----|-------|
| **Tunnel Name** | `doa-property` |
| **Tunnel ID** | `3c0fe053-1890-457d-bbeb-661ec24d471e` |
| **Domain** | `doa.growgenius.co.th` |
| **Route Service** | `http://doa-web:80` |
| **Protocol** | QUIC (auto) |
| **Connections** | 4 edge (bkk06 x2, sin07, sin11) |

## ไฟล์บน EC2

```
/opt/doa/cloudflared/
├── credentials.json    # Tunnel credentials (chmod 644)
└── config.yml          # Ingress rules
```

```yaml
# /opt/doa/cloudflared/config.yml
tunnel: 3c0fe053-1890-457d-bbeb-661ec24d471e
credentials-file: /etc/cloudflared/credentials.json

ingress:
  - hostname: doa.growgenius.co.th
    service: http://doa-web:80
  - service: http_status:404
```

## Override docker-compose

```yaml
# /opt/doa/docker-compose.override.yml
services:
  cloudflared:
    command: tunnel --no-autoupdate --config /etc/cloudflared/config.yml run
    volumes:
      - /opt/doa/cloudflared:/etc/cloudflared:ro
```

## คำสั่งจัดการ

```bash
# Start / Stop / Restart tunnel
ssh -i deploy/doa-property.pem ec2-user@43.210.173.149
sudo docker compose -f /opt/doa/docker-compose.yml -f /opt/doa/docker-compose.override.yml restart cloudflared

# ดู logs
sudo docker logs doa-cloudflared -f

# ดูสถานะ
sudo docker ps | grep cloudflared
```

---

## วิธีสร้างใหม่ (ถ้าต้องใช้ domain อื่น)

### 1. สร้าง Tunnel

```bash
# ต้องรัน cloudflared tunnel login ก่อน สำหรับ domain ใหม่
cloudflared tunnel login

# สร้าง tunnel
cloudflared tunnel create <tunnel-name>
# → จะได้ tunnel ID และ credentials file ใน ~/.cloudflared/<id>.json

# สร้าง DNS CNAME
cloudflared tunnel route dns --overwrite-dns <tunnel-id> <hostname>
```

### 2. Deploy ไป EC2

```bash
# Copy credentials + config
scp -i deploy/doa-property.pem ~/.cloudflared/<id>.json ec2-user@43.210.173.149:/tmp/
scp -i deploy/doa-property.pem deploy/tunnel-config.yml ec2-user@43.210.173.149:/tmp/

ssh -i deploy/doa-property.pem ec2-user@43.210.173.149
sudo mkdir -p /opt/doa/cloudflared
sudo mv /tmp/<id>.json /opt/doa/cloudflared/credentials.json
sudo mv /tmp/tunnel-config.yml /opt/doa/cloudflared/config.yml
sudo chmod 644 /opt/doa/cloudflared/credentials.json
```

### 3. Start tunnel

```bash
cd /opt/doa
sudo docker compose up -d cloudflared
```

## Credentials (Demo)
- Admin: `admin` / `admin123`
- Operator: `operator1` / `operator123`
- Tenant Portal: `0105562001234` / `tenant123`
