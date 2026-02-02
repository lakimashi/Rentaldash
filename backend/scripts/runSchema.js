import 'dotenv/config';
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rawPath = process.env.SQLITE_PATH || process.env.DATABASE_URL || path.join(__dirname, '..', 'data', 'rental.db');
const dbPath = path.isAbsolute(rawPath) ? rawPath : path.resolve(path.join(__dirname, '..'), rawPath);
const schemaPath = path.join(__dirname, '..', 'schema.sqlite.sql');

const dir = path.dirname(dbPath);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const sql = fs.readFileSync(schemaPath, 'utf8');
db.exec(sql);
console.log('SQLite schema applied successfully.');
db.close();
