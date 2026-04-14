import { Router, Request, Response } from 'express';
import { kbQuery, kbQueryOne } from '../../lib/kb-db.js';

const router = Router();

// === Dashboard stats ===
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const stats = await kbQueryOne(`
      SELECT
        (SELECT COUNT(*) FROM categories) AS categories_count,
        (SELECT COUNT(*) FROM tags)       AS tags_count,
        (SELECT COUNT(*) FROM skills)     AS skills_count,
        (SELECT COUNT(*) FROM articles WHERE is_archived = FALSE) AS articles_count,
        (SELECT COUNT(*) FROM bookmarks)  AS bookmarks_count,
        (SELECT COUNT(*) FROM code_snippets) AS snippets_count
    `);
    res.json({ success: true, data: stats });
  } catch (err: any) {
    console.error('[KB] stats error:', err.message);
    res.status(500).json({ success: false, error: 'ไม่สามารถดึง stats ได้' });
  }
});

// === Categories ===
router.get('/categories', async (_req: Request, res: Response) => {
  try {
    const rows = await kbQuery(`
      SELECT c.*,
        (SELECT COUNT(*) FROM articles a WHERE a.category_id = c.id AND a.is_archived = FALSE) AS articles_count,
        (SELECT COUNT(*) FROM skills s WHERE s.category_id = c.id) AS skills_count
      FROM categories c
      ORDER BY c.sort_order, c.name_th
    `);
    res.json({ success: true, data: rows });
  } catch (err: any) {
    console.error('[KB] categories error:', err.message);
    res.status(500).json({ success: false, error: 'ไม่สามารถดึง categories' });
  }
});

// === Tags (พร้อม usage count คำนวณสด) ===
router.get('/tags', async (_req: Request, res: Response) => {
  try {
    const rows = await kbQuery(`
      SELECT t.*,
        (SELECT COUNT(*) FROM article_tags at WHERE at.tag_id = t.id) AS real_usage_count
      FROM tags t
      ORDER BY real_usage_count DESC, t.name
    `);
    res.json({ success: true, data: rows });
  } catch (err: any) {
    console.error('[KB] tags error:', err.message);
    res.status(500).json({ success: false, error: 'ไม่สามารถดึง tags' });
  }
});

// === Skills ===
router.get('/skills', async (req: Request, res: Response) => {
  try {
    const { categoryId, q } = req.query;
    const where: string[] = [];
    const params: any[] = [];

    if (categoryId) {
      params.push(Number(categoryId));
      where.push(`s.category_id = $${params.length}`);
    }
    if (q) {
      params.push(`%${q}%`);
      where.push(`(s.name ILIKE $${params.length} OR s.description ILIKE $${params.length})`);
    }

    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const rows = await kbQuery(`
      SELECT s.*, c.code AS category_code, c.name_th AS category_name, c.color AS category_color
      FROM skills s
      LEFT JOIN categories c ON c.id = s.category_id
      ${whereClause}
      ORDER BY s.last_used_at DESC NULLS LAST, s.proficiency DESC
      LIMIT 200
    `, params);
    res.json({ success: true, data: rows });
  } catch (err: any) {
    console.error('[KB] skills error:', err.message);
    res.status(500).json({ success: false, error: 'ไม่สามารถดึง skills' });
  }
});

router.post('/skills', async (req: Request, res: Response) => {
  try {
    const { categoryId, name, proficiency, description, learnedAt, lastUsedAt } = req.body;
    if (!name) {
      res.status(400).json({ success: false, error: 'name จำเป็น' });
      return;
    }
    const row = await kbQueryOne(`
      INSERT INTO skills (category_id, name, proficiency, description, learned_at, last_used_at, use_count)
      VALUES ($1, $2, $3, $4, $5, $6, 1)
      ON CONFLICT (category_id, name) DO UPDATE
        SET proficiency = EXCLUDED.proficiency,
            description = EXCLUDED.description,
            last_used_at = EXCLUDED.last_used_at,
            use_count = skills.use_count + 1,
            updated_at = NOW()
      RETURNING *
    `, [categoryId || null, name, proficiency || 3, description || null, learnedAt || null, lastUsedAt || null]);
    res.status(201).json({ success: true, data: row });
  } catch (err: any) {
    console.error('[KB] create skill error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// === Articles ===
router.get('/articles', async (req: Request, res: Response) => {
  try {
    const { categoryId, q, tag, pinned } = req.query;
    const where: string[] = ['a.is_archived = FALSE'];
    const params: any[] = [];

    if (categoryId) {
      params.push(Number(categoryId));
      where.push(`a.category_id = $${params.length}`);
    }
    if (pinned === 'true') {
      where.push(`a.is_pinned = TRUE`);
    }
    if (q) {
      params.push(`%${q}%`);
      where.push(`(a.title ILIKE $${params.length} OR a.content ILIKE $${params.length})`);
    }
    if (tag) {
      params.push(tag as string);
      where.push(`EXISTS (SELECT 1 FROM article_tags at JOIN tags t ON t.id = at.tag_id WHERE at.article_id = a.id AND t.name = $${params.length})`);
    }

    const rows = await kbQuery(`
      SELECT a.id, a.title, a.slug, a.summary, a.difficulty, a.read_time_min,
             a.is_pinned, a.view_count, a.created_at, a.updated_at,
             c.code AS category_code, c.name_th AS category_name, c.color AS category_color,
             COALESCE(
               (SELECT json_agg(t.name ORDER BY t.name) FROM article_tags at JOIN tags t ON t.id = at.tag_id WHERE at.article_id = a.id),
               '[]'::json
             ) AS tags
      FROM articles a
      LEFT JOIN categories c ON c.id = a.category_id
      WHERE ${where.join(' AND ')}
      ORDER BY a.is_pinned DESC, a.updated_at DESC
      LIMIT 100
    `, params);
    res.json({ success: true, data: rows });
  } catch (err: any) {
    console.error('[KB] articles error:', err.message);
    res.status(500).json({ success: false, error: 'ไม่สามารถดึง articles' });
  }
});

router.get('/articles/:slug', async (req: Request, res: Response) => {
  try {
    // เพิ่ม view count
    await kbQuery(`UPDATE articles SET view_count = view_count + 1 WHERE slug = $1`, [req.params.slug]);

    const row = await kbQueryOne(`
      SELECT a.*,
             c.code AS category_code, c.name_th AS category_name, c.color AS category_color,
             COALESCE(
               (SELECT json_agg(t.name ORDER BY t.name) FROM article_tags at JOIN tags t ON t.id = at.tag_id WHERE at.article_id = a.id),
               '[]'::json
             ) AS tags
      FROM articles a
      LEFT JOIN categories c ON c.id = a.category_id
      WHERE a.slug = $1
    `, [req.params.slug]);
    if (!row) {
      res.status(404).json({ success: false, error: 'ไม่พบบทความ' });
      return;
    }
    res.json({ success: true, data: row });
  } catch (err: any) {
    console.error('[KB] article detail error:', err.message);
    res.status(500).json({ success: false, error: 'ไม่สามารถดึงบทความ' });
  }
});

router.post('/articles', async (req: Request, res: Response) => {
  try {
    const { categoryId, title, slug, summary, content, difficulty, readTimeMin, isPinned, tags } = req.body;
    if (!title || !slug || !content) {
      res.status(400).json({ success: false, error: 'title, slug, content จำเป็น' });
      return;
    }

    const article = await kbQueryOne(`
      INSERT INTO articles (category_id, title, slug, summary, content, difficulty, read_time_min, is_pinned)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [categoryId || null, title, slug, summary || null, content, difficulty || 3, readTimeMin || 5, !!isPinned]);

    // เชื่อม tags ถ้ามี
    if (Array.isArray(tags) && tags.length && article) {
      for (const tagName of tags) {
        // upsert tag
        const tag = await kbQueryOne(`
          INSERT INTO tags (name) VALUES ($1)
          ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
          RETURNING id
        `, [tagName]);
        if (tag) {
          await kbQuery(`INSERT INTO article_tags (article_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [article.id, tag.id]);
        }
      }
    }
    res.status(201).json({ success: true, data: article });
  } catch (err: any) {
    console.error('[KB] create article error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// === Bookmarks ===
router.get('/bookmarks', async (req: Request, res: Response) => {
  try {
    const { categoryId, favorite } = req.query;
    const where: string[] = [];
    const params: any[] = [];

    if (categoryId) {
      params.push(Number(categoryId));
      where.push(`b.category_id = $${params.length}`);
    }
    if (favorite === 'true') where.push(`b.is_favorite = TRUE`);

    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const rows = await kbQuery(`
      SELECT b.*, c.code AS category_code, c.name_th AS category_name, c.color AS category_color
      FROM bookmarks b
      LEFT JOIN categories c ON c.id = b.category_id
      ${whereClause}
      ORDER BY b.is_favorite DESC, b.created_at DESC
      LIMIT 200
    `, params);
    res.json({ success: true, data: rows });
  } catch (err: any) {
    console.error('[KB] bookmarks error:', err.message);
    res.status(500).json({ success: false, error: 'ไม่สามารถดึง bookmarks' });
  }
});

router.post('/bookmarks', async (req: Request, res: Response) => {
  try {
    const { categoryId, title, url, description, isFavorite } = req.body;
    if (!title || !url) {
      res.status(400).json({ success: false, error: 'title + url จำเป็น' });
      return;
    }
    const row = await kbQueryOne(`
      INSERT INTO bookmarks (category_id, title, url, description, is_favorite)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [categoryId || null, title, url, description || null, !!isFavorite]);
    res.status(201).json({ success: true, data: row });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// === Global search (trigram similarity) ===
router.get('/search', async (req: Request, res: Response) => {
  try {
    const q = String(req.query.q || '').trim();
    if (!q) {
      res.json({ success: true, data: { articles: [], skills: [], bookmarks: [] } });
      return;
    }
    const pattern = `%${q}%`;

    const [articles, skills, bookmarks] = await Promise.all([
      kbQuery(`
        SELECT id, title, slug, summary, category_id,
               similarity(title, $2) AS sim
        FROM articles
        WHERE is_archived = FALSE AND (title ILIKE $1 OR content ILIKE $1)
        ORDER BY sim DESC, updated_at DESC
        LIMIT 10
      `, [pattern, q]),
      kbQuery(`
        SELECT id, name, proficiency, category_id, last_used_at
        FROM skills
        WHERE name ILIKE $1 OR description ILIKE $1
        ORDER BY last_used_at DESC NULLS LAST
        LIMIT 10
      `, [pattern]),
      kbQuery(`
        SELECT id, title, url, description, category_id
        FROM bookmarks
        WHERE title ILIKE $1 OR description ILIKE $1
        ORDER BY is_favorite DESC, created_at DESC
        LIMIT 10
      `, [pattern]),
    ]);

    res.json({ success: true, data: { articles, skills, bookmarks } });
  } catch (err: any) {
    console.error('[KB] search error:', err.message);
    res.status(500).json({ success: false, error: 'ค้นหาไม่สำเร็จ' });
  }
});

export default router;
