# KB — Knowledge Base Database

Personal knowledge base สำหรับบันทึกทักษะ/บทความ/code snippets ที่เจอระหว่างพัฒนาระบบ
ใช้ PostgreSQL container เดียวกับ DOA project (`doa-db`) — ไม่เสียค่าใช้จ่ายเพิ่ม

## Connection

| | Local (dev) | Production (EC2) |
|---|---|---|
| Host | `localhost` | `43.210.173.149` (ผ่าน SSH tunnel) |
| Port | `5432` (expose container port) | `5432` (ผ่าน container network) |
| Database | `kb` | `kb` |
| User | `kb_admin` | `kb_admin` |
| Password | `kb_secret_2026` | `kb_secret_2026` |

### เชื่อมต่อจาก local ผ่าน SSH tunnel

```bash
# เปิด tunnel
ssh -i deploy/doa-property.pem -L 5433:localhost:5432 ec2-user@43.210.173.149

# connect
psql -h localhost -p 5433 -U kb_admin -d kb
# (แต่ port 5432 บน EC2 host ไม่ได้ expose — ต้องใช้วิธีที่ 2)
```

### เชื่อมต่อผ่าน docker exec (วิธีที่ใช้จริง)

```bash
ssh -i deploy/doa-property.pem ec2-user@43.210.173.149 \
  "cd /opt/doa && sudo docker compose exec -T db psql -U kb_admin -d kb"
```

### Connection string (Prisma/Node.js)

จาก container `doa-api` (ใน network เดียวกัน):
```
postgresql://kb_admin:kb_secret_2026@db:5432/kb
```

## Schema

7 ตารางหลัก + pg_trgm สำหรับ full-text search

| Table | คำอธิบาย |
|---|---|
| `categories` | หมวดหมู่หลัก (frontend, backend, database, devops, ai, design, security, pm, misc) |
| `tags` | Tags แบบ case-insensitive (citext) |
| `skills` | ทักษะที่เรียนรู้ — proficiency 1-5, learned_at, last_used_at, use_count |
| `articles` | บทความ/โน้ตแบบ markdown — title, slug, summary, content, difficulty, pinned |
| `article_tags` | M2M join table |
| `code_snippets` | โค้ดตัวอย่าง — แยกจาก article เพื่อ search ตาม language ได้ |
| `bookmarks` | ลิงก์อ้างอิง/เอกสาร |

### Indexes
- `gin_trgm_ops` บน `articles.title` + `articles.content` — similarity search
- `idx_articles_pinned` partial index (เฉพาะ `is_pinned = TRUE`)
- `idx_snippets_language` — filter by language

### Triggers
- `trigger_set_updated_at` auto-update `updated_at` บน articles/skills/categories

## ไฟล์ในโฟลเดอร์นี้

| ไฟล์ | วัตถุประสงค์ |
|---|---|
| `kb-setup.sql` | สร้าง database + user + schema + seed categories (idempotent) |
| `kb-seed.sql` | Seed ตัวอย่าง tags, articles, bookmarks |
| `kb-seed-skills.sql` | Seed ทักษะที่เรียนรู้จาก session พัฒนา DOA |

## ตัวอย่าง query

### ดูทักษะที่ใช้บ่อยสุด
```sql
SELECT c.name_th, s.name, s.proficiency, s.use_count, s.last_used_at
FROM skills s JOIN categories c ON c.id = s.category_id
ORDER BY s.use_count DESC, s.last_used_at DESC
LIMIT 20;
```

### Search article ด้วย trigram similarity
```sql
SELECT title, slug, similarity(title, 'vite preload') AS sim
FROM articles
WHERE title % 'vite preload'   -- ใช้ gin_trgm_ops index
ORDER BY sim DESC
LIMIT 10;
```

### Full-text search ใน content
```sql
SELECT title, substring(content FROM 1 FOR 200) AS preview
FROM articles
WHERE content ILIKE '%modulepreload%'
ORDER BY updated_at DESC;
```

### เพิ่ม article ใหม่
```sql
INSERT INTO articles (category_id, title, slug, summary, content, difficulty, read_time_min)
VALUES (
  (SELECT id FROM categories WHERE code = 'frontend'),
  'หัวข้อใหม่',
  'new-slug-here',
  'สรุปสั้นๆ',
  $$# Markdown content
ใส่เนื้อหาเป็น markdown ได้เลย$$,
  3, 5
);
```

### เพิ่ม tag ให้ article
```sql
INSERT INTO article_tags (article_id, tag_id)
SELECT a.id, t.id
FROM articles a, tags t
WHERE a.slug = 'new-slug-here'
  AND t.name IN ('vite', 'performance');
```

## การ backup

ใช้ pg_dump ผ่าน docker:

```bash
ssh -i deploy/doa-property.pem ec2-user@43.210.173.149 \
  "sudo docker compose -f /opt/doa/docker-compose.yml exec -T db pg_dump -U kb_admin kb" \
  > kb-backup-$(date +%Y%m%d).sql
```

## Re-run setup (idempotent)

ทุก SQL ใน folder นี้ใช้ `ON CONFLICT DO NOTHING` + `IF NOT EXISTS` — รันซ้ำได้ปลอดภัย

```bash
ssh -i deploy/doa-property.pem ec2-user@43.210.173.149 \
  "cd /opt/doa && sudo docker compose cp kb/kb-setup.sql db:/tmp/ && \
   sudo docker compose exec -T db psql -U doa -d doa_lease -f /tmp/kb-setup.sql"
```
