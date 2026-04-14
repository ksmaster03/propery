\c kb kb_admin

INSERT INTO skills (category_id, name, proficiency, description, learned_at, last_used_at, use_count)
SELECT c.id, s.name, s.prof, s.descr, s.learned, s.last_used, s.cnt
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
) AS s(cat_code, name, prof, descr, learned, last_used, cnt)
WHERE c.code = s.cat_code
ON CONFLICT (category_id, name) DO NOTHING;

SELECT COUNT(*) AS skills_count FROM skills;
