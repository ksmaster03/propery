# CLAUDE.md — DOA Commercial Lease System

คู่มือสำหรับ AI agent (Claude Code) ที่ช่วยพัฒนา/ดูแลระบบนี้

## Project Overview

ระบบบริหารสัญญาเช่าพื้นที่เชิงพาณิชย์ของกรมท่าอากาศยาน (DOA) — full-stack monorepo

- **Backend:** Express 4 + TypeScript + Prisma 6 + PostgreSQL 16
- **Frontend:** React 19 + Vite + MUI 6 + Tailwind + Chart.js + TanStack Query
- **Auth:** JWT access + refresh, role-based (Admin/Supervisor/Operator/Tenant)
- **Testing:** Vitest (unit) + Playwright (E2E)
- **Deploy:** AWS EC2 Bangkok (ap-southeast-7) + Cloudflare Tunnel
- **Live:** https://doa.growgenius.co.th

## Project Structure

```
doa-lease-system/
├── packages/
│   ├── api/              # Express + Prisma
│   │   ├── prisma/       # Schema + migrations + seed
│   │   └── src/
│   │       ├── routes/   # Domain modules: auth, dashboard, units, ...
│   │       ├── middleware/
│   │       ├── lib/      # Prisma client, JWT utils
│   │       └── config/
│   └── web/              # React + Vite
│       ├── src/
│       │   ├── pages/    # Route components grouped by domain
│       │   ├── components/{layout,shared,ui}/
│       │   ├── api/      # Axios client + React Query hooks
│       │   ├── lib/      # i18n, auth-store, theme
│       │   └── styles/
│       └── e2e/          # Playwright tests
├── deploy/               # Docker + AWS + Cloudflare setup
└── docker-compose.yml
```

## Coding Standards

### Comments
- **ใช้ comment ภาษาไทยเท่านั้น** — ห้าม comment ภาษาอังกฤษ
- Comment สั้นๆ อธิบาย "ทำไม" ไม่ใช่ "อะไร"
- ไม่ต้องใส่ comment ทุกบรรทัด ใส่เฉพาะที่ไม่ชัดเจน

### Naming — Prisma
- Model prefix: `Tm*` (master/lookup) หรือ `Tt*` (transaction)
- Table map: `m_*` (master) หรือ `t_*` (transaction)
- Columns: snake_case ผ่าน `@map()`
- Timestamps: `createdAt`, `updatedAt`, `createdBy`, `updatedBy` ทุก table

### Naming — Files
- Pages: PascalCase (`Dashboard.tsx`, `ContractCreate.tsx`)
- Routes: kebab-case folder + `*.routes.ts`
- Tests: `*.test.ts(x)` สำหรับ unit, `*.spec.ts` สำหรับ E2E

### Patterns
- **API responses:** `{ success: boolean, data?: any, error?: string }`
- **Error handling:** try/catch ใน route handler, ส่งผ่าน middleware สำหรับ server error
- **i18n:** ใช้ `useTranslation()` hook ทุก user-facing text
- **Fallback data:** frontend pages มี `fallback*` const เพื่อให้ test/demo ทำงานได้แม้ API ขัดข้อง

## Workflows

### เริ่มระบบ local
```bash
npm run dev           # start api + web พร้อมกัน
npm run db:migrate    # prisma migrate
npm run db:seed       # seed ข้อมูลตั้งต้น
```

### Testing
```bash
npm run test:api      # Vitest API (14 tests, ~400ms)
npm run test:web      # Vitest Frontend (14 tests, ~4s)
npm run test:e2e      # Playwright (56 tests, ~30s)
```

### Deploy AWS
```bash
# Build + bundle
rm -rf packages/api/dist packages/web/dist
tar --exclude='node_modules' --exclude='.git' --exclude='dist' \
    --exclude='test-results' --exclude='deploy/*.pem' \
    -czf /tmp/doa-source.tar.gz .

# Upload
scp -i deploy/doa-property.pem /tmp/doa-source.tar.gz \
    ec2-user@43.210.173.149:/opt/doa/

# Rebuild on EC2
ssh -i deploy/doa-property.pem ec2-user@43.210.173.149 \
    "cd /opt/doa && tar -xzf doa-source.tar.gz && sudo docker compose up -d --build"
```

## Performance Targets (จาก guideline)

| Metric | Target |
|--------|--------|
| P95 Response Time | < 500ms |
| CPU Utilization (under load) | < 80% |
| Error Rate | < 1% |
| Lighthouse Accessibility | > 90 (WCAG AA) |

## Known Constraints

- **Domain:** ใช้ `doa.growgenius.co.th` เพราะ `toptierdigital.space` ไม่อยู่ใน Cloudflare account เดียวกับ cert.pem
- **AWS Region:** ap-southeast-7 (Bangkok) เท่านั้น
- **EC2 Key:** `deploy/doa-property.pem` (gitignored, ห้าม commit)
- **Cloudflare Tunnel:** ใช้ config file + credentials ไม่ใช่ token (bind กับ tunnel ID `3c0fe053-1890-457d-bbeb-661ec24d471e`)

## Things NOT To Do

- ❌ ห้าม commit `*.pem` หรือ `*.json` tunnel credentials
- ❌ ห้ามเปิด HTTP/HTTPS public ingress บน EC2 — เข้าผ่าน Cloudflare Tunnel เท่านั้น
- ❌ ห้าม hardcode secrets ใน source — ใช้ `.env` หรือ environment variables
- ❌ ห้ามใช้ `git push --force` บน `master`
- ❌ ห้าม comment ภาษาอังกฤษ

## References

- [Plan document](C:/Users/ADMIN/.claude/plans/mighty-bubbling-quail.md)
- [AWS Infrastructure](deploy/AWS-INFRASTRUCTURE.md)
- [Cloudflare Tunnel setup](deploy/CLOUDFLARE-TUNNEL.md)
- [Mockups](d:/propre/doa_lease_system_full.html)
