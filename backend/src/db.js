import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rawPath = process.env.SQLITE_PATH || process.env.DATABASE_URL || path.join(__dirname, '..', 'data', 'rental.db');
const dbPath = path.isAbsolute(rawPath) ? rawPath : path.resolve(process.cwd(), rawPath);

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Convert pg-style $1, $2 placeholders to ? and return { rows } for compatibility
function toSqliteParams(sql, params = []) {
  const out = [];
  let i = 0;
  const newSql = sql.replace(/\$(\d+)/g, () => {
    out.push(params[i]);
    i++;
    return '?';
  });
  return { sql: newSql, params: out };
}

export default {
  query(sql, params = []) {
    const { sql: s, params: p } = toSqliteParams(sql, Array.isArray(params) ? params : params ? [params] : []);
    const upper = s.trim().toUpperCase();
    const stmt = db.prepare(s);
    if (upper.startsWith('SELECT') || upper.includes(' RETURNING ')) {
      const rows = p.length ? stmt.all(...p) : stmt.all();
      return Promise.resolve({ rows: Array.isArray(rows) ? rows : [] });
    }
    if (upper.includes('RETURNING')) {
      const rows = p.length ? stmt.all(...p) : stmt.all();
      return Promise.resolve({ rows: Array.isArray(rows) ? rows : [] });
    }
    p.length ? stmt.run(...p) : stmt.run();
    return Promise.resolve({ rows: [] });
  },
  get db() {
    return db;
  },
};
