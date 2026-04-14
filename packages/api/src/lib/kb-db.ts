import pg from 'pg';
const { Pool } = pg;

// === Connection pool สำหรับ Knowledge Base database ===
// แยกจาก doa_lease (Prisma) เพราะ kb อยู่อีก database หนึ่งใน instance เดียวกัน
// ใช้ raw pg client เพื่อความยืดหยุ่นใน raw SQL query
const kbPool = new Pool({
  host: process.env.KB_DB_HOST || 'db',
  port: Number(process.env.KB_DB_PORT || 5432),
  database: process.env.KB_DB_NAME || 'kb',
  user: process.env.KB_DB_USER || 'kb_admin',
  password: process.env.KB_DB_PASSWORD || 'kb_secret_2026',
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

kbPool.on('error', (err) => {
  console.error('[KB] Unexpected pool error:', err.message);
});

// Helper — query + return rows
export async function kbQuery<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const result = await kbPool.query(sql, params);
  return result.rows as T[];
}

// Helper — query + return first row or null
export async function kbQueryOne<T = any>(sql: string, params: any[] = []): Promise<T | null> {
  const result = await kbPool.query(sql, params);
  return (result.rows[0] as T) || null;
}

export { kbPool };
