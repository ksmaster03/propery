-- === สร้าง database kb + user ===
-- ต้องรันด้วย postgres superuser
\c postgres

-- สร้าง role kb_admin (ถ้ายังไม่มี)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'kb_admin') THEN
    CREATE ROLE kb_admin WITH LOGIN PASSWORD 'kb_secret_2026';
  END IF;
END
$$;

-- สร้าง database kb (ถ้ายังไม่มี)
SELECT 'CREATE DATABASE kb OWNER kb_admin ENCODING ''UTF8'''
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'kb')\gexec

GRANT ALL PRIVILEGES ON DATABASE kb TO kb_admin;

-- === สลับเข้า database kb เพื่อสร้าง schema ===
\c kb kb_admin

-- === Extensions ที่ใช้ ===
-- citext: เปรียบเทียบ case-insensitive สำหรับชื่อ tags/skills
-- pg_trgm: search ทำ similarity match
CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- === Tables ===

-- หมวดหมู่หลัก (web, backend, database, devops, ai, design, ฯลฯ)
CREATE TABLE IF NOT EXISTS categories (
  id           SERIAL PRIMARY KEY,
  code         VARCHAR(32) UNIQUE NOT NULL,     -- slug ภาษาอังกฤษ
  name_th      VARCHAR(100) NOT NULL,           -- ชื่อภาษาไทย
  name_en      VARCHAR(100) NOT NULL,
  description  TEXT,
  icon         VARCHAR(50),                     -- material icon name
  color        VARCHAR(16),                     -- hex color
  sort_order   INT DEFAULT 100,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Tags (tree-flexible — หลายๆ article มี tag หลายตัว)
CREATE TABLE IF NOT EXISTS tags (
  id           SERIAL PRIMARY KEY,
  name         CITEXT UNIQUE NOT NULL,          -- case-insensitive
  color        VARCHAR(16),
  usage_count  INT DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Skills — เช่น "React Hooks", "Prisma migrations", "Docker compose networking"
CREATE TABLE IF NOT EXISTS skills (
  id            SERIAL PRIMARY KEY,
  category_id   INT REFERENCES categories(id) ON DELETE SET NULL,
  name          VARCHAR(200) NOT NULL,
  proficiency   SMALLINT CHECK (proficiency BETWEEN 1 AND 5), -- 1=learning, 5=expert
  description   TEXT,
  learned_at    DATE,                           -- วันแรกที่เรียน/ใช้
  last_used_at  DATE,                           -- ใช้ครั้งล่าสุด
  use_count     INT DEFAULT 0,                  -- ใช้กี่ครั้งแล้ว
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (category_id, name)
);

-- บทความ/โน้ต knowledge หลัก — เก็บเนื้อหาแบบ markdown
CREATE TABLE IF NOT EXISTS articles (
  id              SERIAL PRIMARY KEY,
  category_id     INT REFERENCES categories(id) ON DELETE SET NULL,
  title           VARCHAR(300) NOT NULL,
  slug            VARCHAR(300) UNIQUE NOT NULL,
  summary         TEXT,                         -- สรุปสั้น 1-2 บรรทัด
  content         TEXT NOT NULL,                -- markdown เนื้อหาเต็ม
  source_url      TEXT,                         -- ที่มา (ถ้ามี)
  difficulty      SMALLINT CHECK (difficulty BETWEEN 1 AND 5),
  read_time_min   INT,
  is_pinned       BOOLEAN DEFAULT FALSE,
  is_archived     BOOLEAN DEFAULT FALSE,
  view_count      INT DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- เชื่อม article กับ tag (many-to-many)
CREATE TABLE IF NOT EXISTS article_tags (
  article_id  INT NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  tag_id      INT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (article_id, tag_id)
);

-- Code snippets — เก็บแยกเพื่อ reuse + search ได้ง่ายกว่า parse markdown
CREATE TABLE IF NOT EXISTS code_snippets (
  id           SERIAL PRIMARY KEY,
  article_id   INT REFERENCES articles(id) ON DELETE CASCADE,
  title        VARCHAR(200) NOT NULL,
  language     VARCHAR(32) NOT NULL,            -- typescript, sql, bash, ฯลฯ
  code         TEXT NOT NULL,
  description  TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- References/Bookmarks — ลิงก์/เอกสารที่ใช้อ้างอิง
CREATE TABLE IF NOT EXISTS bookmarks (
  id           SERIAL PRIMARY KEY,
  category_id  INT REFERENCES categories(id) ON DELETE SET NULL,
  title        VARCHAR(300) NOT NULL,
  url          TEXT NOT NULL,
  description  TEXT,
  is_favorite  BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- === Indexes ===
-- Full-text search ไทย/อังกฤษบน title + content ด้วย pg_trgm
CREATE INDEX IF NOT EXISTS idx_articles_title_trgm    ON articles USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_articles_content_trgm  ON articles USING gin (content gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_articles_category      ON articles (category_id);
CREATE INDEX IF NOT EXISTS idx_articles_pinned        ON articles (is_pinned) WHERE is_pinned = TRUE;
CREATE INDEX IF NOT EXISTS idx_skills_category        ON skills (category_id);
CREATE INDEX IF NOT EXISTS idx_snippets_article       ON code_snippets (article_id);
CREATE INDEX IF NOT EXISTS idx_snippets_language      ON code_snippets (language);

-- === Trigger อัปเดต updated_at อัตโนมัติ ===
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at_articles    ON articles;
CREATE TRIGGER set_updated_at_articles     BEFORE UPDATE ON articles     FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
DROP TRIGGER IF EXISTS set_updated_at_skills      ON skills;
CREATE TRIGGER set_updated_at_skills       BEFORE UPDATE ON skills       FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
DROP TRIGGER IF EXISTS set_updated_at_categories  ON categories;
CREATE TRIGGER set_updated_at_categories   BEFORE UPDATE ON categories   FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- === Seed data: หมวดหมู่เริ่มต้น ===
INSERT INTO categories (code, name_th, name_en, icon, color, sort_order) VALUES
  ('frontend',  'Frontend',         'Frontend Development',  'web',           '#005b9f', 10),
  ('backend',   'Backend',          'Backend Development',   'dns',           '#0f7a43', 20),
  ('database',  'Database',         'Database & Data',       'storage',       '#7c3aed', 30),
  ('devops',    'DevOps / Cloud',   'DevOps & Cloud',        'cloud',         '#d97706', 40),
  ('ai',        'AI / ML',          'AI & Machine Learning', 'psychology',    '#d7a94b', 50),
  ('design',    'UI / UX',          'Design & UX',           'palette',       '#b52822', 60),
  ('security',  'Security',         'Security',              'shield',        '#163f6b', 70),
  ('pm',        'Project / Process','Project Management',    'checklist',     '#5a6d80', 80),
  ('misc',      'เบ็ดเตล็ด',         'Miscellaneous',         'category',      '#6c757d', 999)
ON CONFLICT (code) DO NOTHING;

COMMIT;

-- แสดงสรุป
\dt
SELECT 'kb database พร้อมใช้งาน ✓' AS status;
