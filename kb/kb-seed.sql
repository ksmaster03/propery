-- === Seed ตัวอย่าง: บันทึกสิ่งที่เพิ่งทำใน DOA project วันนี้ ===
\c kb kb_admin

-- Tags เริ่มต้น
INSERT INTO tags (name, color) VALUES
  ('vite', '#646cff'),
  ('lighthouse', '#0cce6b'),
  ('code-splitting', '#005b9f'),
  ('wcag-aa', '#d7a94b'),
  ('mui', '#007fff'),
  ('playwright', '#45ba4b'),
  ('rollup', '#ff3e00'),
  ('react-19', '#61dafb')
ON CONFLICT (name) DO NOTHING;

-- Skills ที่ใช้ใน session ล่าสุด
INSERT INTO skills (category_id, name, proficiency, description, learned_at, last_used_at, use_count)
SELECT c.id, s.name, s.prof, s.desc, s.learned, s.last_used, s.cnt
FROM categories c, (VALUES
  ('frontend', 'Vite modulePreload.resolveDependencies', 4, 'กรอง chunks ที่ไม่ควร preload เพื่อลด Login bundle', DATE '2026-04-13', DATE '2026-04-14', 1),
  ('frontend', 'React.lazy() + Suspense code splitting', 5, 'Lazy-load routes + AppShell ลด initial bundle', DATE '2026-04-13', DATE '2026-04-14', 2),
  ('frontend', 'MUI manualChunks circular dependency', 3, 'MUI internal cross-refs ทำให้ split chunks แล้ว runtime error', DATE '2026-04-14', DATE '2026-04-14', 1),
  ('frontend', 'Google Fonts non-blocking load', 4, 'rel=preload + media=print onload trick', DATE '2026-04-13', DATE '2026-04-14', 1),
  ('frontend', 'WCAG AA color contrast fixing', 4, 'ตรวจ axe-core + adjust palette (4.5:1 minimum)', DATE '2026-04-13', DATE '2026-04-13', 1),
  ('frontend', 'Dynamic import() สำหรับ PDF libs', 5, 'jsPDF/html2canvas โหลด on-demand ลด bundle 594KB', DATE '2026-04-14', DATE '2026-04-14', 1),
  ('backend',  'Prisma migration + schema design', 5, 'Business features: termination, deposit, meter, POS', DATE '2026-04-13', DATE '2026-04-13', 1),
  ('devops',   'Playwright CDP pageerror debugging', 4, 'จับ JS runtime error จาก headless browser', DATE '2026-04-14', DATE '2026-04-14', 1),
  ('devops',   'k6 stress test 10K VUs', 4, 'ramping scenario + threshold checks', DATE '2026-04-13', DATE '2026-04-13', 1)
) AS s(cat_code, name, prof, desc, learned, last_used, cnt)
WHERE c.code = s.cat_code
ON CONFLICT (category_id, name) DO NOTHING;

-- ตัวอย่างบทความ
INSERT INTO articles (category_id, title, slug, summary, content, difficulty, read_time_min, is_pinned)
SELECT c.id,
  'Vite: ตัด pdf-vendor ออกจาก modulepreload',
  'vite-exclude-pdf-vendor-modulepreload',
  'วิธีใช้ resolveDependencies เพื่อไม่ให้ Vite preload chunks หนักๆ ที่ไม่ได้ใช้ตอน initial load',
  $md$
# Vite: ตัด pdf-vendor ออกจาก modulepreload

## ปัญหา

Vite จะอัตโนมัติเพิ่ม `<link rel="modulepreload">` สำหรับทุก chunk ที่อยู่ในกราฟ
import ตอน initial load แม้ chunk นั้นจะเป็น dynamic import ก็ตาม

ผลลัพธ์: หน้า Login ที่ไม่ได้ใช้ PDF เลย ก็ยังโหลด `pdf-vendor` 594 KB

## วิธีแก้

ใน `vite.config.ts`:

```typescript
build: {
  modulePreload: {
    resolveDependencies: (_filename, deps) => {
      return deps.filter((dep) => {
        if (dep.includes('pdf-vendor')) return false;
        if (dep.includes('chart-vendor')) return false;
        return true;
      });
    },
  },
}
```

ยืนยันผลด้วย:
```bash
grep -oE '<link[^>]*modulepreload[^>]*>' dist/index.html
```

## เพิ่มเติม: dynamic import() สำหรับ lib ขนาดใหญ่

```typescript
// lib/pdf.ts
export async function generateSimplePdf(...) {
  const { default: jsPDF } = await import('jspdf');
  // ...
}
```

วิธีนี้บังคับให้ bundler สร้าง chunk แยก และโหลดตอนเรียกใช้งานเท่านั้น
  $md$,
  3, 5, TRUE
FROM categories c WHERE c.code = 'frontend'
ON CONFLICT (slug) DO NOTHING;

-- ลิงก์ article กับ tags
INSERT INTO article_tags (article_id, tag_id)
SELECT a.id, t.id
FROM articles a, tags t
WHERE a.slug = 'vite-exclude-pdf-vendor-modulepreload'
  AND t.name IN ('vite', 'code-splitting', 'rollup')
ON CONFLICT DO NOTHING;

-- Bookmarks ที่ใช้บ่อย
INSERT INTO bookmarks (category_id, title, url, description, is_favorite)
SELECT c.id, b.title, b.url, b.description, b.fav
FROM categories c, (VALUES
  ('frontend', 'MUI Material Docs',         'https://mui.com/material-ui/',                                                     'Component library reference',          TRUE),
  ('frontend', 'Vite Config Reference',      'https://vite.dev/config/',                                                         'Build config + plugins',                TRUE),
  ('frontend', 'axe DevTools Rules',         'https://dequeuniversity.com/rules/axe/',                                            'WCAG rule reference',                   FALSE),
  ('backend',  'Prisma Schema Reference',    'https://www.prisma.io/docs/orm/prisma-schema',                                      'Schema + migrations',                   TRUE),
  ('database', 'PostgreSQL 16 Docs',         'https://www.postgresql.org/docs/16/',                                               'PG reference',                          FALSE),
  ('devops',   'AWS Free Tier Limits',       'https://aws.amazon.com/free/',                                                      'ดู quota free tier',                    FALSE),
  ('devops',   'Docker Compose Spec',        'https://docs.docker.com/compose/compose-file/',                                     'Compose file reference',                FALSE),
  ('devops',   'Cloudflare Tunnel Config',   'https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/',    'Tunnel setup',                          FALSE)
) AS b(cat_code, title, url, description, fav)
WHERE c.code = b.cat_code
ON CONFLICT DO NOTHING;

-- สรุป
SELECT 'categories' AS tbl, COUNT(*) AS cnt FROM categories
UNION ALL SELECT 'tags',      COUNT(*) FROM tags
UNION ALL SELECT 'skills',    COUNT(*) FROM skills
UNION ALL SELECT 'articles',  COUNT(*) FROM articles
UNION ALL SELECT 'bookmarks', COUNT(*) FROM bookmarks;
